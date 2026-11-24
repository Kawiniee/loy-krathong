import { lazy, StrictMode, Suspense, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  Camera, Check, ChevronLeft, Copy, Flower2, Gift, Home, Link2, LogOut,
  MoonStar, RefreshCw, Sparkles, Timer, Users, Volume2, VolumeX, Waves, X,
} from 'lucide-react'
import { AvatarArt, FestivalArt, LotusMark, materialSources } from './art'
import { audio, mutedAudio, type AudioSettings } from './audio'
import { activities, avatars, otherSeat, themes, type Activity, type Board, type Player, type Profile } from './model'
import { Photo, River, useClock } from './river'
import { messageFor, onlineAvailable, useRoom, type RoomSession } from './useRoom'
import { DesignPreview } from './design'
import '@fontsource-variable/noto-sans-thai/wght.css'
import '@fontsource-variable/noto-serif-thai/wght.css'
import './style.css'

const Workshop = lazy(() => import('./workshop'))
const locations = [
  { id: 'workshop', title: 'ร้านแต่งกระทง', detail: 'เลือกใบตอง ดอกไม้ และเทียน แล้วจัดกระทงในแบบของคุณ', icon: Flower2 },
  { id: 'challenge', title: 'ซุ้มแข่งแต่งกระทง', detail: 'รับโจทย์เดียวกัน แล้วประชันฝีมือก่อนหมดเวลา', icon: Timer },
  { id: 'river', title: 'ท่าน้ำลอยกระทง', detail: 'จุดเทียน ตั้งคำอธิษฐาน แล้วปล่อยกระทงพร้อมกัน', icon: Waves },
  { id: 'photo', title: 'จุดถ่ายภาพ', detail: 'จัดกรอบภาพริมแม่น้ำ แล้วเก็บเป็นภาพที่ระลึก', icon: Camera },
] as const
type Location = Exclude<Activity, 'festival'>

function SoundControl() {
  const [sound, setSound] = useState<AudioSettings>(mutedAudio)
  const [open, setOpen] = useState(false)
  const [failed, setFailed] = useState(false)
  const enabled = Object.values(sound).some(Boolean)
  function settings(next: AudioSettings) {
    setSound(next)
    setFailed(false)
    void audio.configure(next).catch(() => setFailed(true))
  }
  return <div className="sound-control">
    <button className="icon-button" aria-expanded={open} title="ตั้งค่าเสียง" aria-label="ตั้งค่าเสียง" onClick={() => setOpen(!open)}>
      {enabled ? <Volume2 size={19}/> : <VolumeX size={19}/>}
    </button>
    {open && <div className="sound-menu panel">
      <h2>เสียงในงานวัด</h2>
      {([['water', 'เสียงริมน้ำ'], ['music', 'ดนตรีบรรเลง'], ['effects', 'เสียงประกอบ']] as const).map(([key, label]) =>
        <label key={key} className="check-label"><input type="checkbox" checked={sound[key]} onChange={event => settings({ ...sound, [key]: event.target.checked })}/> {label}</label>,
      )}
      <button className="button small" onClick={() => settings(enabled ? mutedAudio : { water: true, music: true, effects: true })}>{enabled ? 'ปิดเสียงทั้งหมด' : 'เปิดเสียงทั้งหมด'}</button>
      {failed && <p className="muted" role="status">เบราว์เซอร์นี้เปิดเสียงไม่ได้</p>}
    </div>}
  </div>
}

function Header({ home, session }: { home: () => void; session: RoomSession }) {
  return <header className="site-header">
    <div className="shell header-inner">
      <button className="brand" onClick={home} aria-label="กลับหน้างานวัด">
        <span className="brand-mark"><LotusMark size={26}/></span><span>คืนวันเพ็ญ<small>งานลอยกระทงออนไลน์</small></span>
      </button>
      <div className="header-right">
        <span className="header-date"><MoonStar size={16}/> 24 พฤศจิกายน 2569</span>
        {session.mode && <button className="icon-button" title="ออกจากงาน" aria-label="ออกจากงาน"
          onClick={() => { if (session.mode !== 'local' || window.confirm('ออกจากงานและปิดห้องในเครื่องนี้?')) { session.exit(); home() } }}><LogOut size={18}/></button>}
        <SoundControl/>
      </div>
    </div>
  </header>
}

function CardArt({ location }: { location: Location }) {
  return <span className={`card-art decor-${location}`} aria-hidden="true">
    <svg viewBox="0 0 118 100">
      <circle cx="60" cy="51" r="38" fill="currentColor" opacity=".12"/>
      <circle cx="60" cy="51" r="44" fill="none" stroke="currentColor" opacity=".15" strokeDasharray="2 5"/>
      <path d="M21 27v12m-6-6h12m64 31v12m-6-6h12M92 23v8m-4-4h8" stroke="currentColor" strokeLinecap="round" opacity=".7"/>
      {location === 'workshop' && <>
        <image href={materialSources.banana} x="30" y="20" width="59" height="59"/>
        <image href={materialSources['lotus-pink']} x="44" y="31" width="30" height="30"/>
        <image href={materialSources.jasmine} x="65" y="56" width="21" height="21"/>
      </>}
      {location === 'challenge' && <>
        <path d="M48 28h26m-13 0v-7m-7 0h14m-8 29v-13m0 13 11 5" stroke="#ecca8e" fill="none" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="60" cy="54" r="24" fill="#6f4e48" stroke="#d7a877" strokeWidth="3"/>
        <circle cx="60" cy="54" r="19" fill="#433549" stroke="#f0bd82"/>
        <path d="M60 42v12l10 4" stroke="#f3cf97" strokeWidth="3" fill="none" strokeLinecap="round"/>
      </>}
      {location === 'river' && <>
        <path d="M21 63q9-6 19 0t19 0 19 0 19 0M28 73q8-5 16 0t16 0 16 0 16 0" stroke="#9cc7c1" strokeWidth="2" fill="none"/>
        <path d="M42 53q17-9 35 0l-5 11H48Z" fill="#70976d" stroke="#b9cb91"/>
        <path d="M57 38h7v17h-7z" fill="#eec385"/><path d="M61 36q-10-5 1-14 6 12-1 14" fill="#ffcc76"/>
      </>}
      {location === 'photo' && <>
        <path d="M30 34h18l4-7h16l4 7h16v37H30Z" fill="#645070" stroke="#c9aad7" strokeWidth="2" strokeLinejoin="round"/>
        <circle cx="60" cy="52" r="12" fill="#383a59" stroke="#d4b7e0" strokeWidth="2"/>
        <circle cx="61" cy="53" r="7" fill="#807394"/><path d="M79 41h4" stroke="#f6d7a4" strokeWidth="3" strokeLinecap="round"/>
      </>}
    </svg>
  </span>
}

function Locations({ choose }: { choose: (id: Location) => void }) {
  return <section className="locations" aria-labelledby="locations-heading">
    <div className="section-heading"><h2 id="locations-heading">เดินเล่นในงาน</h2><span/><LotusMark size={23}/></div>
    <div className="location-grid">
      {locations.map(({ id, title, detail }) => <button key={id} className={`location-card location-${id}`} onClick={() => choose(id)}>
        <CardArt location={id}/><span className="location-copy"><strong>{title}</strong><span>{detail}</span></span>
      </button>)}
    </div>
  </section>
}

function Lobby({ choose, enter }: { choose: (id: Location) => void; enter?: (tab: 'create' | 'join' | 'local') => void }) {
  return <>
    <section className="hero">
      <FestivalArt/>
      <div className="hero-shade"/>
      <div className="hero-copy">
        <p className="hero-kicker"><Sparkles size={16}/> คืนวันเพ็ญ เดือนสิบสอง</p>
        <h1>ลอยกระทง<span>กันเถอะ!</span></h1>
        <p className="hero-description">มาแต่งกระทงด้วยกัน เดินเล่นในงานวัด<br className="desktop-break"/> แล้วลอยกระทงใต้แสงจันทร์</p>
        {enter ? <div className="hero-actions">
          <button className="button primary" onClick={() => enter(onlineAvailable ? 'create' : 'local')}><LotusMark size={22}/>{onlineAvailable ? 'สร้างห้องส่วนตัว' : 'เริ่มเล่นสองคน'}</button>
          {onlineAvailable && <button className="button hero-secondary" onClick={() => enter('join')}><Link2 size={17}/> เข้าห้องเพื่อน</button>}
        </div> : <button className="button primary" onClick={() => choose('workshop')}><Flower2 size={19}/> ไปแต่งกระทง</button>}
        {enter && onlineAvailable && <button className="local-link" onClick={() => enter('local')}><Users size={16}/> เล่นสองคนบนเครื่องเดียว</button>}
      </div>
      <span className="hero-caption"><span className="dot on"/> ริมน้ำคืนวันเพ็ญ</span>
    </section>
    <Locations choose={choose}/>
  </>
}

type EntryTab = 'create' | 'join' | 'local'
function Entry({ initial, invite, close, enter }: {
  initial: EntryTab; invite: string; close: () => void
  enter: (tab: EntryTab, profile: Profile, other: Profile, code: string) => Promise<void>
}) {
  const [tab, setTab] = useState(initial)
  const [profile, setProfile] = useState<Profile>({ name: '', avatar: 0 })
  const [second, setSecond] = useState<Profile>({ name: '', avatar: 1 })
  const [code, setCode] = useState(invite)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { dialog.current?.showModal() }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!profile.name.trim() || (tab === 'local' && !second.name.trim())) {
      setError('กรอกชื่อผู้เล่นให้ครบ')
      return
    }
    if (tab === 'join' && !/^[0-9A-F]{16}$/i.test(code.trim())) {
      setError('กรอกรหัสห้อง 16 ตัวจากลิงก์เชิญ')
      return
    }
    setBusy(true)
    setError('')
    try { await enter(tab, { ...profile, name: profile.name.trim() }, { ...second, name: second.name.trim() }, code.trim().toUpperCase()) }
    catch (cause) { setError(messageFor(cause)) }
    finally { setBusy(false) }
  }

  function fields(value: Profile, set: (profile: Profile) => void, label: string, id: string) {
    return <fieldset className="profile-fields">
      <label className="form-label" htmlFor={id}>{label}<input id={id} name={id} value={value.name} maxLength={24} autoComplete="off" required
        placeholder="พิมพ์ชื่อเล่น" onChange={event => set({ ...value, name: event.target.value })}/></label>
      <div className="avatars" aria-label={`ตัวละคร ${label}`}>{avatars.map((name, avatar) =>
        <button className={`avatar-button ${value.avatar === avatar ? 'active' : ''}`} key={name} type="button"
          aria-label={`${label} · ${name}`} aria-pressed={value.avatar === avatar} onClick={() => set({ ...value, avatar })}>
          <AvatarArt avatar={avatar} size={35}/><span>{name}</span>
        </button>,
      )}</div>
    </fieldset>
  }

  return <dialog ref={dialog} className="entry-dialog panel" onCancel={event => { event.preventDefault(); if (!busy) close() }}>
    <div className="dialog-head"><div className="brand-mark"><LotusMark/></div><h2>เข้างานลอยกระทง</h2>
      <button className="icon-button" aria-label="ปิด" disabled={busy} onClick={close}><X size={20}/></button>
    </div>
    <div className="segmented entry-tabs">
      {([['create','สร้างห้อง'], ['join','เข้าห้อง'], ['local','เล่นเครื่องเดียว']] as const).map(([key, name]) =>
        <button key={key} disabled={busy || (key !== 'local' && !onlineAvailable)} aria-pressed={tab === key} onClick={() => { setError(''); setTab(key) }}>{name}</button>,
      )}
    </div>
    {!onlineAvailable && <p className="muted entry-note">ตอนนี้เปิดให้เล่นสองคนบนเครื่องเดียว โหมดออนไลน์ยังไม่ได้เชื่อม Supabase</p>}
    <form onSubmit={submit}>
      {fields(profile, setProfile, tab === 'local' ? 'ชื่อผู้เล่นคนที่ 1' : 'ชื่อของคุณ', 'player-name')}
      {tab === 'local' && fields(second, setSecond, 'ชื่อผู้เล่นคนที่ 2', 'second-name')}
      {tab === 'join' && <label className="form-label">รหัสห้อง<input value={code} onChange={event => setCode(event.target.value.toUpperCase())}
        placeholder="รหัสจากลิงก์เชิญ" autoComplete="off" spellCheck="false" maxLength={16} required/></label>}
      {error && <p className="error" role="alert">{error}</p>}
      <button className="button primary enter-button" disabled={busy}><Users size={18}/>{busy ? 'กำลังเข้างาน…' : tab === 'create' ? 'สร้างห้อง' : tab === 'join' ? 'เข้าห้องเพื่อน' : 'เข้างานทั้งสองคน'}</button>
    </form>
  </dialog>
}

function Players({ session }: { session: RoomSession }) {
  const now = useClock(session.offset, 1500)
  const [copy, setCopy] = useState<'idle' | 'copied' | 'manual'>('idle')
  const players = session.room!.players
  const invite = new URL(window.location.pathname, window.location.origin)
  invite.searchParams.set('room', session.room!.code)
  async function share() {
    try { await navigator.clipboard.writeText(invite.href); setCopy('copied') }
    catch { setCopy('manual') }
  }
  return <section className="players panel" aria-label="ผู้เล่นในห้อง">
    <div className="player-list">
      {players.map(player => {
        const online = session.mode === 'local' || (player.seat === session.seat ? session.connection !== 'offline' : now - player.seen < 38000)
        return <div className={`player-chip ${player.seat === session.seat ? 'playing' : ''}`} key={player.seat}>
          <AvatarArt avatar={player.avatar}/>
          <div><strong>{player.name}</strong>{player.seat === session.seat && <small>คุณ</small>}
            <span><i className={`dot ${online ? 'on' : ''}`}/>{session.mode === 'local' ? 'เครื่องเดียว' : online ? 'ออนไลน์' : 'ออฟไลน์'} · {activities[player.activity]}{player.launch.ready ? ' · พร้อมลอย' : ''}</span>
          </div>
        </div>
      })}
      {players.length < 2 && <div className="player-chip vacant"><Users size={23}/><span>รอเพื่อนเข้าห้อง</span></div>}
    </div>
    <div className="player-actions">
      {session.mode === 'local' ? <button className="button small" onClick={session.switchSeat}><RefreshCw size={15}/> สลับผู้เล่น</button> : <>
        <span className="room-code">{session.room!.code}</span>
        <button className="button small" onClick={() => void share()}>{copy === 'copied' ? <Check size={16}/> : <Copy size={16}/>}
          {copy === 'copied' ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์เชิญ'}</button>
      </>}
    </div>
    {copy === 'manual' && <label className="form-label manual-link">ลิงก์เชิญ<input readOnly value={invite.href} onFocus={event => event.target.select()}/></label>}
  </section>
}

function Crafting({ session, player }: { session: RoomSession; player: Player }) {
  const [mode, setMode] = useState<'own' | 'shared' | 'gift'>('own')
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const room = session.room!
  const both = room.players.length === 2 && room.players.every(person => person.giftReady)
  const canSee = mode === 'own' || (mode === 'gift' && both)
  const board: Board = mode === 'shared' ? 'shared' : `${mode}${preview && canSee ? otherSeat(player.seat) : player.seat}`
  const readOnly = (preview && canSee) || (mode === 'gift' && player.giftReady)
  const friend = room.players.find(person => person.seat !== player.seat)
  async function ready() {
    setBusy(true)
    setError('')
    try { await session.action({ type: 'gift', ready: !player.giftReady }) }
    catch (cause) { setError(messageFor(cause)) }
    finally { setBusy(false) }
  }
  return <>
    <div className="activity-tools">
      <div className="segmented">
        {([['own', 'แต่งของตัวเอง'], ['shared','ช่วยกันแต่ง'], ['gift','แต่งให้กัน']] as const).map(([id, label]) =>
          <button key={id} aria-pressed={mode === id} onClick={() => { setMode(id); setPreview(false); setError('') }}>{label}</button>,
        )}
      </div>
      {canSee && friend && <button className="button small" onClick={() => setPreview(!preview)}><Flower2 size={17}/>{preview ? 'กลับมาดูกระทงที่ฉันทำ' : both && mode === 'gift' ? 'ดูกระทงที่เพื่อนแต่งให้' : 'ดูกระทงของเพื่อน'}</button>}
      {mode === 'shared' && <span className="muted companion"><Users size={17}/>{friend ? `${friend.name} · ${activities[friend.activity]}` : 'รอเพื่อนเข้าห้อง'}</span>}
      {mode === 'gift' && !both && <button className="button small" disabled={busy || !room.boards[board]?.length} onClick={() => void ready()}>
        <Gift size={17}/>{player.giftReady ? 'แก้ไขของขวัญอีกครั้ง' : 'ของขวัญพร้อมแล้ว'}
      </button>}
    </div>
    {mode === 'gift' && <p className="muted activity-note">{both ? 'เปิดของขวัญแล้ว ดูใบที่เพื่อนทำให้และเลือกนำไปลอยที่ท่าน้ำได้' : player.giftReady ? 'รอเพื่อนกดพร้อมเปิดของขวัญ' : 'เพื่อนจะเห็นกระทงใบนี้เมื่อทั้งคู่กดพร้อม'}</p>}
    {error && <p className="error" role="alert">{error}</p>}
    <Workshop key={`${board}-${player.seat}`} board={board} room={room} action={session.action} feedback={() => audio.tap()} readOnly={readOnly}/>
  </>
}

function Challenge({ session, player }: { session: RoomSession; player: Player }) {
  const room = session.room!
  const round = room.round
  const now = useClock(session.offset)
  const [duration, setDuration] = useState(60)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const remaining = round ? Math.ceil((round.ends - now) / 1000) : 0
  const completedRound = round && remaining <= 0 ? round.id : null
  const { mode, action } = session
  useEffect(() => {
    if (!completedRound || mode !== 'online') return
    const timer = setTimeout(() => void action({ type: 'heartbeat' }).catch(() => {}), 180)
    return () => clearTimeout(timer)
    // Fetch hidden designs once when the shared deadline passes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedRound, mode])
  const start = async () => {
    setBusy(true)
    setError('')
    try { await session.action({ type: 'round', duration }) }
    catch (cause) { setError(messageFor(cause)) }
    finally { setBusy(false) }
  }
  return <>
    {(!round || remaining <= 0) && <div className="panel challenge-head">
      <div><h2>{round ? 'เปิดผลงานทั้งสองใบ' : 'โจทย์เดียวกัน ใครจะแต่งได้แบบไหน?'}</h2>
        <p className="muted">{session.mode === 'local' ? 'สลับผู้เล่นเพื่อแต่งคนละใบในเวลาร่วมกัน' : 'ทั้งสองคนจะได้รับโจทย์และเวลาเดียวกัน'}</p></div>
      <label className="form-label">เวลาแข่งขัน<select value={duration} onChange={event => setDuration(+event.target.value)}>
        <option value={60}>60 วินาที</option><option value={120}>120 วินาที</option><option value={180}>180 วินาที</option>
      </select></label>
      <button className="button primary" disabled={busy || room.players.length < 2} onClick={() => void start()}><Timer size={18}/>{round ? 'เริ่มรอบใหม่' : 'สุ่มโจทย์และเริ่ม'}</button>
      {room.players.length < 2 && <span className="muted">รอเพื่อนเข้าห้อง</span>}
    </div>}
    {round && remaining > 0 && <>
      <div className="panel challenge-head"><h2>{themes[round.theme]}</h2><span className="tag">{remaining > round.duration ? `เริ่มใน ${remaining - round.duration}` : `เหลือ ${remaining} วินาที`}</span></div>
      <Workshop key={`${round.id}-${player.seat}`} board={`round${player.seat}`} room={room} action={session.action}
        roundId={round.id} feedback={() => audio.tap()} readOnly={remaining > round.duration}/>
    </>}
    {round && remaining <= 0 && <div className="challenge-results">
      {room.players.map(person => <section className="panel" key={person.seat}>
        <h2>{person.name}</h2><DesignPreview pieces={room.boards[`round${person.seat}`] ?? []}/>
        {person.seat !== player.seat && <div className="segmented">{['สวยจัง', 'สร้างสรรค์มาก', 'อยากเอาไปลอย!'].map(reaction =>
          <button key={reaction} aria-pressed={player.reaction === reaction} onClick={() => void session.action({ type: 'reaction', reaction, roundId: round.id }).catch(cause => setError(messageFor(cause)))}>{reaction}</button>,
        )}</div>}
        {person.seat === player.seat && room.players.find(p => p.seat !== person.seat)?.reaction && <p>{room.players.find(p => p.seat !== person.seat)?.reaction}</p>}
      </section>)}
    </div>}
    {error && <p className="error" role="alert">{error}</p>}
  </>
}

function Venue({ session, start, homeSignal }: { session: RoomSession; start?: Location; homeSignal: number }) {
  const player = session.room!.players.find(person => person.seat === session.seat)!
  const [view, setView] = useState<Activity>(start ?? player.activity)
  const [error, setError] = useState('')
  const seenHome = useRef(homeSignal)
  const reduce = useReducedMotion()
  const location = locations.find(location => location.id === view)
  const LocationIcon = location?.icon ?? Home
  const action = session.action

  useEffect(() => {
    if (seenHome.current !== homeSignal) {
      seenHome.current = homeSignal
      setView('festival')
    }
  }, [homeSignal])

  useEffect(() => {
    if (player.activity !== view) void action({ type: 'activity', activity: view }).catch(cause => setError(messageFor(cause)))
    // Only broadcast after navigation or a seat switch. Snapshots also update player.activity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, player.seat])

  function navigate(next: Activity) {
    setError('')
    setView(next)
    window.scrollTo(0, 0)
  }
  return <>
    <Players session={session}/>
    {session.mode === 'online' && session.connection !== 'live' && <p className="muted connection-note" role="status">
      {session.connection === 'offline' ? 'ขาดการเชื่อมต่อ กำลังลองเชื่อมใหม่' : session.connection === 'polling' ? 'ซิงก์เป็นระยะ กำลังเชื่อมต่อ Realtime' : 'กำลังเชื่อมต่อห้อง'}
    </p>}
    {(session.error || error) && <p className="error" role="alert">{session.error || error}</p>}
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={view} initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 6 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: reduce ? 1 : 0 }} transition={{ duration: reduce ? 0 : .16 }}>
        {location && <div className="page-heading">
          <button className="quiet-button" onClick={() => navigate('festival')}><ChevronLeft size={18}/> กลับไปเดินงาน</button>
          <h1><LocationIcon size={29}/> {location.title}</h1>
        </div>}
        {view === 'festival' && <Lobby choose={navigate}/>}
        <Suspense fallback={<p className="muted" role="status">กำลังเปิดโต๊ะแต่งกระทง…</p>}>
          {view === 'workshop' && <Crafting session={session} player={player}/>}
          {view === 'challenge' && <Challenge session={session} player={player}/>}
        </Suspense>
        {view === 'river' && <River key={player.seat} session={session} player={player} onPhoto={() => navigate('photo')}/>}
        {view === 'photo' && <Photo session={session}/>}
      </motion.div>
    </AnimatePresence>
  </>
}

function App() {
  const [invite] = useState(() => new URLSearchParams(window.location.search).get('room')?.toUpperCase() ?? '')
  const session = useRoom(invite)
  const [entry, setEntry] = useState<EntryTab | null>(invite ? onlineAvailable ? 'join' : 'local' : null)
  const [start, setStart] = useState<Location>()
  const [homeSignal, setHomeSignal] = useState(0)
  function open(tab: EntryTab) { setStart(undefined); setEntry(tab) }
  function choose(id: Location) { setStart(id); setEntry(onlineAvailable ? 'create' : 'local') }
  async function enter(tab: EntryTab, profile: Profile, second: Profile, code: string) {
    if (tab === 'local') session.local(profile, second)
    else await session.online(profile, tab === 'join' ? code : null)
    window.history.replaceState(null, '', window.location.pathname)
    setEntry(null)
  }
  return <>
    <Header session={session} home={() => { setHomeSignal(n => n + 1); window.scrollTo(0, 0) }}/>
    <main className="shell main-shell">
      {session.room ? <Venue key={session.room.id} session={session} start={start} homeSignal={homeSignal}/>
        : session.mode === 'online' ? <div className="panel reconnect">
          <h1>กำลังกลับเข้าห้อง</h1>{session.error && <p className="error" role="alert">{session.error}</p>}
          <button className="button" onClick={session.exit}>กลับหน้างานวัด</button>
        </div>
        : <Lobby choose={choose} enter={open}/>}
    </main>
    <footer className="shell site-footer"><LotusMark size={20}/> คืนวันเพ็ญ <span>·</span> งานลอยกระทงออนไลน์สำหรับสองคน</footer>
    {!session.mode && entry && <Entry key={entry} initial={entry} invite={invite} close={() => setEntry(null)} enter={enter}/>}
  </>
}

createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>)
