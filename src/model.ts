export const avatars = ['ดอกบัว', 'กระต่าย', 'ปลาทอง', 'พระจันทร์'] as const
export const activities = {
  festival: 'เดินงานวัด', workshop: 'แต่งกระทง', challenge: 'แข่งแต่งกระทง',
  river: 'อยู่ที่ท่าน้ำ', photo: 'ถ่ายภาพ',
} as const
export type Activity = keyof typeof activities
export type Seat = 1 | 2
export const otherSeat = (seat: Seat): Seat => seat === 1 ? 2 : 1
export const themes = ['กระทงสีเดียว', 'กระทงมินิมอล', 'กระทงธรรมชาติ', 'กระทงดอกไม้จัดเต็ม', 'กระทงสุดแปลก']
export const categories = ['ฐานกระทง', 'ใบตอง', 'ดอกไม้', 'ธูปและเทียน'] as const
export const materials = [
  { id: 'trunk', name: 'ฐานต้นกล้วย', category: 0, size: 250 },
  { id: 'banana', name: 'ฐานใบตอง', category: 0, size: 250 },
  { id: 'lotus-base', name: 'ฐานดอกบัว', category: 0, size: 250 },
  { id: 'fold', name: 'ใบตองยอดแหลม', category: 1, size: 72 },
  { id: 'fold-round', name: 'ใบตองกลีบมน', category: 1, size: 72 },
  { id: 'fold-fan', name: 'ใบตองพัด', category: 1, size: 76 },
  { id: 'lotus-pink', name: 'บัวชมพู', category: 2, size: 61 },
  { id: 'lotus-white', name: 'บัวขาว', category: 2, size: 61 },
  { id: 'lotus-purple', name: 'บัวม่วง', category: 2, size: 61 },
  { id: 'marigold', name: 'ดาวเรือง', category: 2, size: 59 },
  { id: 'jasmine', name: 'มะลิ', category: 2, size: 45 },
  { id: 'rose', name: 'กุหลาบ', category: 2, size: 58 },
  { id: 'orchid', name: 'กล้วยไม้', category: 2, size: 64 },
  { id: 'petals', name: 'กลีบดอกไม้', category: 2, size: 39 },
  { id: 'incense', name: 'ธูป', category: 3, size: 53 },
  { id: 'candle', name: 'เทียน', category: 3, size: 44 },
  { id: 'beads', name: 'เปลือกหอย', category: 3, size: 36 },
] as const
export type Material = typeof materials[number]['id']
export const materialById = new Map(materials.map(material => [material.id, material]))

export const boardSize = 480
export const boardCenter = boardSize / 2
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
export const boards = ['own1', 'own2', 'shared', 'gift1', 'gift2', 'round1', 'round2'] as const
export type Board = typeof boards[number]
export type Piece = { id: string; material: Material; x: number; y: number; rotation: number; size: number; z: number }
export type SavedPiece = Piece & { rev: number }
export type Change = { id: string; expected: number; piece: Piece | null }
export type FloatBoard = Exclude<Board, 'round1' | 'round2'>
export type Launch = { board: FloatBoard; candle: boolean; incense: boolean; position: number; ready: boolean }
export type Player = {
  seat: Seat; name: string; avatar: number; activity: Activity; seen: number;
  giftReady: boolean; launch: Launch; reaction: string
}
export type Profile = Pick<Player, 'name' | 'avatar'>
export type Round = { id: string; theme: number; duration: number; ends: number }
export type Boat = { seat: Seat; name: string; items: Piece[]; candle: boolean; incense: boolean; position: number }
export type Ceremony = { at: number; boats: Boat[] }
export type Room = {
  id: string; code: string; rev: number; seat: Seat; now: number; players: Player[];
  boards: Partial<Record<Board, SavedPiece[]>>; round: Round | null; ceremony: Ceremony | null
}
export type Action =
  | { type: 'activity'; activity: Activity }
  | { type: 'heartbeat' }
  | { type: 'edit'; board: Board; changes: Change[]; roundId?: string }
  | { type: 'gift'; ready: boolean }
  | { type: 'launch'; launch: Launch }
  | { type: 'reset-river' }
  | { type: 'round'; duration: number }
  | { type: 'reaction'; reaction: string; roundId: string }

export const defaultLaunch = (seat: Seat): Launch => ({
  board: `own${seat}`, candle: false, incense: false, position: seat === 1 ? 0.3 : 0.7, ready: false,
})
export const newPlayer = (seat: Seat, profile: Profile): Player => ({
  ...profile, seat, activity: 'festival', seen: Date.now(), giftReady: false, launch: defaultLaunch(seat), reaction: '',
})

export function floatChoices(room: Room, seat: Seat): { board: FloatBoard; name: string }[] {
  const choices: { board: FloatBoard; name: string }[] = [
    { board: `own${seat}`, name: 'กระทงของฉัน' },
    { board: 'shared', name: 'กระทงที่ช่วยกันทำ' },
  ]
  if (room.players.length === 2 && room.players.every(player => player.giftReady)) {
    choices.push({ board: `gift${otherSeat(seat)}`, name: 'กระทงที่เพื่อนแต่งให้' })
  }
  return choices
}

export function applyLocal(room: Room, seat: Seat, action: Action): Room {
  const next = structuredClone(room)
  const player = next.players.find(player => player.seat === seat)
  if (!player) throw new Error('ไม่พบผู้เล่น')
  next.now = Date.now()
  next.rev += 1
  player.seen = next.now
  switch (action.type) {
    case 'activity':
      player.activity = action.activity
      break
    case 'edit': {
      const items = next.boards[action.board] ?? []
      if (![`own${seat}`, 'shared', `gift${seat}`, `round${seat}`].includes(action.board)
        || (action.board === `gift${seat}` && player.giftReady)) throw new Error('กระทงใบนี้เปิดดูได้อย่างเดียว')
      if (action.board.startsWith('round') && (!next.round || action.roundId !== next.round.id
        || next.now < next.round.ends - next.round.duration * 1000 || next.now >= next.round.ends)) {
        throw new Error('หมดเวลาแต่งกระทงแล้ว')
      }
      if (action.changes.some(change => (items.find(item => item.id === change.id)?.rev ?? 0) !== change.expected)) {
        throw new Error('ชิ้นงานมีการเปลี่ยนแปลง ลองใหม่อีกครั้ง')
      }
      const changed = new Set(action.changes.map(change => change.id))
      const updated = items.filter(item => !changed.has(item.id))
      for (const change of action.changes) {
        if (change.piece) updated.push({ ...change.piece, rev: next.rev })
      }
      if (updated.length > 300) throw new Error('กระทงหนึ่งใบใส่วัสดุได้สูงสุด 300 ชิ้น')
      next.boards[action.board] = updated
      if (!next.ceremony) next.players.forEach(person => {
        if (person.launch.board === action.board) person.launch.ready = false
      })
      break
    }
    case 'gift':
      if (next.players.every(player => player.giftReady)) throw new Error('เปิดของขวัญแล้ว')
      if (action.ready && !next.boards[`gift${seat}`]?.length) throw new Error('แต่งกระทงให้เพื่อนก่อน')
      player.giftReady = action.ready
      break
    case 'launch':
      if (next.ceremony) throw new Error('พิธีเริ่มแล้ว')
      if (action.launch.ready && !next.boards[action.launch.board]?.length) throw new Error('เลือกกระทงที่แต่งไว้ก่อน')
      player.launch = action.launch
      if (next.players.length === 2 && next.players.every(player => player.launch.ready)) {
        next.ceremony = {
          at: next.now + 3000,
          boats: next.players.map(({ seat, name, launch }) => ({
            seat, name, items: next.boards[launch.board] ?? [],
            candle: launch.candle, incense: launch.incense, position: launch.position,
          })),
        }
      }
      break
    case 'reset-river':
      next.ceremony = null
      next.players.forEach(player => { player.launch.ready = false })
      break
    case 'round':
      if (next.round && next.round.ends > next.now) throw new Error('กำลังแข่งอยู่')
      next.round = {
        id: crypto.randomUUID(), theme: Math.floor(Math.random() * themes.length),
        duration: action.duration, ends: next.now + 3000 + action.duration * 1000,
      }
      next.boards.round1 = []
      next.boards.round2 = []
      next.players.forEach(player => { player.reaction = '' })
      break
    case 'reaction':
      if (next.round?.id !== action.roundId || next.round.ends > next.now) throw new Error('รอจบการแข่งขันก่อน')
      player.reaction = action.reaction
      break
  }
  return next
}
