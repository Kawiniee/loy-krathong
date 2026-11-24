import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { applyLocal, newPlayer, type Action, type Profile, type Room, type Seat } from './model'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const onlineAvailable = !!(url && key)
let connectionClient: Promise<SupabaseClient> | undefined
function getClient() {
  if (!onlineAvailable) throw new Error('ยังไม่ได้ตั้งค่า Supabase')
  connectionClient ??= import('@supabase/supabase-js').then(({ createClient }) => createClient(url, key))
  return connectionClient
}
const storageKey = 'lk-festival-session-v1'
type Session = { mode: 'local'; room: Room } | { mode: 'online'; id: string; code: string }

function loadSession(): Session | null {
  try {
    const value = localStorage.getItem(storageKey)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function store(session: Session | null) {
  if (session) localStorage.setItem(storageKey, JSON.stringify(session))
  else localStorage.removeItem(storageKey)
}

const errors: Record<string, string> = {
  room_unavailable: 'ไม่พบห้อง หรือเซสชันนี้ไม่มีสิทธิ์เข้าห้อง',
  room_full: 'ห้องนี้มีผู้เล่นครบ 2 คนแล้ว',
  edit_conflict: 'เพื่อนแก้ไขชิ้นนี้แล้ว ลองเลือกชิ้นงานอีกครั้ง',
  round_closed: 'ตอนนี้ไม่สามารถเริ่มหรือแก้ไขรอบแข่งขันได้',
  board_locked: 'กระทงใบนี้เปิดดูได้อย่างเดียว',
  empty_board: 'แต่งกระทงให้มีวัสดุอย่างน้อยหนึ่งชิ้นก่อน',
  board_limit: 'กระทงหนึ่งใบใส่วัสดุได้สูงสุด 300 ชิ้น',
  river_started: 'สถานะพิธีลอยเปลี่ยนแล้ว ลองอีกครั้ง',
  invalid_profile: 'ตรวจสอบชื่อและตัวละครอีกครั้ง',
}
export const messageFor = (error: unknown) => {
  const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : ''
  return errors[message] ?? (/[\u0e00-\u0e7f]/.test(message) ? message : 'เชื่อมต่อหรือบันทึกไม่สำเร็จ ลองอีกครั้ง')
}

async function remote<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const client = await getClient()
  const { data, error } = await client.rpc(name, args)
  if (error) throw error
  return data as T
}

export function useRoom(invite: string) {
  const [initial] = useState(() => {
    const saved = loadSession()
    if (invite && (saved?.mode !== 'online' || saved.code !== invite)) return null
    return saved
  })
  const [mode, setMode] = useState(initial?.mode ?? null)
  const [id, setId] = useState(initial?.mode === 'online' ? initial.id : '')
  const [room, setRoom] = useState<Room | null>(initial?.mode === 'local' ? initial.room : null)
  const roomRef = useRef(room)
  const liveId = useRef(id)
  const [seat, setSeat] = useState<Seat>(initial?.mode === 'local' ? initial.room.seat : 1)
  const [offset, setOffset] = useState(0)
  const [connection, setConnection] = useState<'connecting' | 'live' | 'polling' | 'offline'>('connecting')
  const [error, setError] = useState('')
  const queue = useRef(Promise.resolve())

  const acceptOnline = useCallback((next: Room) => {
    if (liveId.current !== next.id) return
    const current = roomRef.current
    if (current?.id === next.id && (current.rev > next.rev || (current.rev === next.rev && current.now > next.now))) return
    roomRef.current = next
    setRoom(next)
    setSeat(next.seat)
    setOffset(next.now - Date.now())
  }, [])

  useEffect(() => {
    if (!id || !onlineAvailable) return
    let active = true
    let live = false
    let channel: RealtimeChannel | undefined
    let realtimeClient: SupabaseClient | undefined
    let pollTicks = 0
    let timeout: ReturnType<typeof setTimeout>
    const refresh = async (heartbeat = false) => {
      try {
        const next = heartbeat
          ? await remote<Room>('lk_action', { r: id, a: { type: 'heartbeat' } })
          : await remote<Room>('lk_get', { r: id })
        if (!active) return
        acceptOnline(next)
        setConnection(live ? 'live' : 'polling')
        setError('')
      } catch (cause) {
        if (!active) return
        setConnection('offline')
        setError(messageFor(cause))
      }
    }
    void getClient().then(client => {
      if (!active) return
      realtimeClient = client
      channel = client.channel(`festival-${id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lk_signal', filter: `id=eq.${id}` }, () => {
          clearTimeout(timeout)
          timeout = setTimeout(() => void refresh(), 70)
        }).subscribe(status => {
          if (!active) return
          live = status === 'SUBSCRIBED'
          if (live) void refresh()
        })
    }).catch(() => {}) // HTTP polling still reports any connection errors.
    void refresh(true)
    const poll = setInterval(() => {
      pollTicks += 1
      if (!live || pollTicks % 4 === 0) void refresh()
    }, 1000)
    const heartbeat = setInterval(() => void refresh(true), 15000)
    const onFocus = () => { if (!document.hidden) void refresh(true) }
    window.addEventListener('online', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      active = false
      clearInterval(poll)
      clearInterval(heartbeat)
      clearTimeout(timeout)
      if (channel) void realtimeClient?.removeChannel(channel)
      window.removeEventListener('online', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [id, acceptOnline])

  function local(first: Profile, second: Profile) {
    const next: Room = {
      id: crypto.randomUUID(), code: '', rev: 0, seat: 1, now: Date.now(),
      players: [newPlayer(1, first), newPlayer(2, second)], boards: {}, round: null, ceremony: null,
    }
    store({ mode: 'local', room: next })
    roomRef.current = next
    setRoom(next)
    setSeat(1)
    setMode('local')
    setOffset(0)
    setError('')
  }

  async function online(profile: Profile, code: string | null) {
    const client = await getClient()
    const { data } = await client.auth.getSession()
    if (!data.session) {
      const { error } = await client.auth.signInAnonymously()
      if (error) throw error
    }
    const next = await remote<Room>('lk_enter', { invite: code, player_name: profile.name, player_avatar: profile.avatar })
    store({ mode: 'online', id: next.id, code: next.code })
    liveId.current = next.id
    setError('')
    setConnection('connecting')
    setId(next.id)
    setMode('online')
    acceptOnline(next)
  }

  async function action(action: Action): Promise<Room> {
    const queuedSeat = seat
    const queuedId = roomRef.current?.id
    const result = queue.current.then(async () => {
      const current = roomRef.current
      if (!current || current.id !== queuedId) throw new Error('ออกจากห้องแล้ว')
      if (mode === 'local') {
        const next = applyLocal(current, queuedSeat, action)
        store({ mode, room: next })
        roomRef.current = next
        setRoom(next)
        return next
      }
      try {
        const next = await remote<Room>('lk_action', { r: current.id, a: action })
        acceptOnline(next)
        return next
      } catch (cause) {
        // Pull authoritative versions after a rejected concurrent edit.
        void remote<Room>('lk_get', { r: current.id }).then(acceptOnline).catch(() => {})
        throw cause
      }
    })
    queue.current = result.then(() => {}, () => {})
    return result
  }

  function switchSeat() {
    const current = roomRef.current
    if (mode !== 'local' || !current) return
    const next: Room = { ...current, seat: current.seat === 1 ? 2 : 1 }
    store({ mode, room: next })
    roomRef.current = next
    setRoom(next)
    setSeat(next.seat)
  }

  function exit() {
    store(null)
    liveId.current = ''
    roomRef.current = null
    setRoom(null)
    setId('')
    setMode(null)
    setError('')
    setOffset(0)
    window.history.replaceState(null, '', window.location.pathname)
  }

  return { mode, room, seat, offset, connection, error, local, online, action, switchSeat, exit }
}

export type RoomSession = ReturnType<typeof useRoom>
