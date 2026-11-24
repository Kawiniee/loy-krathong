import { useEffect, useRef, useState } from 'react'
import { Camera, Check, Download, Flame, Sparkles, Waves } from 'lucide-react'
import { FestivalArt, materialSources } from './art'
import { clamp, floatChoices, type Boat, type Ceremony, type Launch, type Player } from './model'
import { DesignPreview, designBounds, sortPieces } from './design'
import { messageFor, type RoomSession } from './useRoom'

const frames = ['ริมน้ำ', 'เส้นทอง', 'ขอบดอกบัว']
export function useClock(offset = 0, step = 250) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const update = () => setNow(Date.now())
    update()
    const timer = setInterval(update, step)
    return () => clearInterval(timer)
  }, [step])
  return now + offset
}

function BoatArt({ boat, elapsed, animated, names }: { boat: Boat; elapsed: number; animated: boolean; names: boolean }) {
  const bound = designBounds(boat.items)
  const scale = 184 / Math.max(bound.w, bound.h)
  const ordered = sortPieces(boat.items)
  const passage = Math.min(elapsed / 25, 1)
  const x = 140 + boat.position * 1000 + (animated ? Math.sin(elapsed * .19 + boat.seat) * 21 + passage * (boat.seat === 1 ? -74 : 66) : 0)
  const y = (boat.seat === 1 ? 450 : 483) + (animated ? Math.sin(elapsed * 1.1 + boat.seat) * 3 - passage * 70 : 0)
  const candles = ordered.filter(piece => piece.material === 'candle')
  const centerX = bound.x + bound.w / 2
  const centerY = bound.y + bound.h / 2
  const flamePoints = candles.length ? candles : [{ id: 'flame', x: centerX, y: centerY, size: 28 }]
  return <g transform={`translate(${x} ${y}) scale(${1 - passage * .24})`}>
    <ellipse cy="16" rx="95" ry="20" fill={boat.candle ? '#d49460' : '#6f99a3'} opacity=".16"/>
    <path d="M-108 30q108 23 216 0M-89 11q89 21 178 0" fill="none" stroke={boat.candle ? '#eabe85' : '#7da1a8'} opacity=".37" strokeWidth="2" strokeLinecap="round"/>
    <g transform={`scale(${scale} ${scale * .63}) translate(${-centerX} ${-centerY})`}>
      {ordered.map(item => <image key={item.id} href={materialSources[item.material]} width={item.size} height={item.size}
        x={item.x - item.size / 2} y={item.y - item.size / 2} transform={`rotate(${item.rotation} ${item.x} ${item.y})`}/>)}
    </g>
    {boat.candle && flamePoints.map(point => <g key={point.id} transform={`translate(${(point.x - centerX) * scale} ${(point.y - centerY) * scale * .63})`}>
      <ellipse cy="-18" rx="30" ry="26" fill="#ffbd66" opacity={.15 + Math.sin(elapsed * 6 + boat.seat) * .04}/>
      <path d="M0-4c-13-7-6-19 2-28-2 10 11 20-2 28Z" fill="#ffd17d"/>
      <path d="M0-5c-6-4-3-11 1-17-1 6 5 12-1 17Z" fill="#fff5c3"/>
      <path d="M-13 23h26m-18 8H6m-23 8H17" stroke="#e8b175" opacity=".42" strokeLinecap="round"/>
    </g>)}
    {boat.incense && <path d={`M16-12q${20 + Math.sin(elapsed * 2) * 8}-10 3-22T27-61`} stroke="#eee1cf" strokeOpacity=".42" strokeWidth="2" fill="none"/>}
    {names && <text y="64" textAnchor="middle" fontFamily="Tahoma, sans-serif" fontSize="23" fill="#fff0d9" paintOrder="stroke" stroke="#132234" strokeWidth="4">{boat.name}</text>}
  </g>
}

function RiverImage({ ceremony, now, photo = false, names = false, frame = 0, zoom = 1, x = 0, y = 0, imageRef }: {
  ceremony: Ceremony | null; now: number; photo?: boolean; names?: boolean; frame?: number; zoom?: number
  x?: number; y?: number; imageRef?: React.Ref<SVGSVGElement>
}) {
  const elapsed = ceremony ? Math.max(0, (now - ceremony.at) / 1000) : 0
  const floating = !!ceremony && now >= ceremony.at
  return <svg xmlns="http://www.w3.org/2000/svg" ref={imageRef} viewBox="0 0 1280 580" className="river-image"
    role="img" aria-label="ฉากแม่น้ำยามค่ำคืน">
    <g transform={`translate(${640 + x} ${290 + y}) scale(${zoom}) translate(-640 -290)`}>
      <FestivalArt riverOnly/>
      {floating && ceremony.boats.map(boat => <BoatArt key={boat.seat} boat={boat} elapsed={elapsed} animated names={names}/>)}
    </g>
    {photo && <g>
      {frame > 0 && <rect x="18" y="18" width="1244" height="544" rx="17" fill="none" stroke={frame === 1 ? '#e4b47c' : '#dca8bb'} strokeWidth="3"/>}
      {frame === 2 && [[58, 57], [1222, 57], [58, 516], [1222, 516]].map(([x, y]) =>
        <image key={x + ':' + y} href={materialSources['lotus-pink']} x={x - 29} y={y - 29} width="58" height="58"/>,
      )}
      <text x="640" y="539" textAnchor="middle" fontFamily="Tahoma, sans-serif" fontSize="23" fill="#fbe4be" paintOrder="stroke" stroke="#172539" strokeWidth="4">24 พฤศจิกายน 2569</text>
    </g>}
  </svg>
}

async function exportPng(svg: SVGSVGElement) {
  const copy = svg.cloneNode(true) as SVGSVGElement
  copy.setAttribute('width', '1280')
  copy.setAttribute('height', '580')
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = 1920
    canvas.height = 870
    const context = canvas.getContext('2d')
    if (!context) throw new Error('เปิดตัวสร้างภาพไม่ได้')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const png = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('สร้างภาพ PNG ไม่สำเร็จ')), 'image/png'),
    )
    const download = URL.createObjectURL(png)
    const link = document.createElement('a')
    link.href = download
    link.download = 'loy-krathong-2569.png'
    link.click()
    setTimeout(() => URL.revokeObjectURL(download), 1000)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function River({ session, player, onPhoto }: { session: RoomSession; player: Player; onPhoto: () => void }) {
  const { room, action, offset } = session
  const now = useClock(offset, 75)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [wish, setWish] = useState(() => sessionStorage.getItem(`lk-wish-${room!.id}-${player.seat}`) ?? '')
  const ceremony = room!.ceremony
  const choices = floatChoices(room!, player.seat)
  const pieces = room!.boards[player.launch.board] ?? []
  const started = !!ceremony && now >= ceremony.at
  const countdown = ceremony ? Math.max(0, Math.ceil((ceremony.at - now) / 1000)) : 0

  async function update(launch: Partial<Launch>) {
    setBusy(true)
    setError('')
    try {
      await action({ type: 'launch', launch: { ...player.launch, ...launch } })
    } catch (cause) {
      setError(messageFor(cause))
    } finally {
      setBusy(false)
    }
  }

  async function reset() {
    setBusy(true)
    try { await action({ type: 'reset-river' }) }
    catch (cause) { setError(messageFor(cause)) }
    finally { setBusy(false) }
  }

  return <>
    <section className="river-stage">
      <RiverImage ceremony={ceremony} now={now} names/>
      {countdown > 0 && <div className="countdown" role="status" aria-label="นับถอยหลัง"><span>เตรียมลอยพร้อมกัน</span><strong>{countdown}</strong></div>}
      {started && <span className="river-badge"><Waves size={18}/> ลอยกระทงแล้ว</span>}
    </section>
    {!ceremony && <div className="river-controls panel">
      <div className="river-pick">
        <div className="river-preview"><DesignPreview pieces={pieces}/></div>
        <label className="form-label">เลือกกระทง
          <select value={player.launch.board} disabled={busy || player.launch.ready}
            onChange={event => void update({ board: event.target.value as Launch['board'] })}>
            {choices.map(choice => <option key={choice.board} value={choice.board}>{choice.name}</option>)}
          </select>
        </label>
        <p className="muted">{pieces.length ? `${pieces.length} ชิ้น` : 'กระทงใบนี้ยังว่างอยู่'}</p>
      </div>
      <div className="river-prep">
        <div className="segmented">
          <button aria-pressed={player.launch.candle} disabled={busy || player.launch.ready} onClick={() => void update({ candle: !player.launch.candle })}><Flame size={17}/> จุดเทียน</button>
          <button aria-pressed={player.launch.incense} disabled={busy || player.launch.ready} onClick={() => void update({ incense: !player.launch.incense })}><Sparkles size={17}/> จุดธูป</button>
        </div>
        <label className="form-label">ตำแหน่งปล่อยกระทง
          <select value={player.launch.position} disabled={busy || player.launch.ready} onChange={event => void update({ position: +event.target.value })}>
            <option value="0.3">ฝั่งซ้าย</option><option value="0.5">กลางน้ำ</option><option value="0.7">ฝั่งขวา</option>
          </select>
        </label>
        <label className="form-label">คำอธิษฐาน (เก็บไว้ในเครื่อง)
          <input value={wish} placeholder="เขียนคำอธิษฐานของคุณ" maxLength={180} onChange={event => {
            setWish(event.target.value)
            sessionStorage.setItem(`lk-wish-${room!.id}-${player.seat}`, event.target.value)
          }}/>
        </label>
      </div>
      <div className="river-ready">
        <h2>พร้อมลอยหรือยัง?</h2>
        <div>{room!.players.map(person => <p key={person.seat}><span className={`dot ${person.launch.ready ? 'on' : ''}`}/>{person.name} · {person.launch.ready ? 'พร้อมแล้ว' : 'กำลังเตรียมกระทง'}</p>)}</div>
        {room!.players.length < 2 && <p className="muted">รอเพื่อนเข้าห้อง</p>}
        <button className="button primary" disabled={busy || (!pieces.length && !player.launch.ready)}
          onClick={() => void update({ ready: !player.launch.ready })}><Check size={18}/>{player.launch.ready ? 'ยกเลิกพร้อม' : 'พร้อมลอย'}</button>
      </div>
    </div>}
    {started && <div className="river-end"><button className="button primary" onClick={onPhoto}><Camera size={18}/> ถ่ายภาพที่ระลึก</button>
      <button className="button" disabled={busy} onClick={() => void reset()}>เตรียมลอยรอบใหม่</button></div>}
    {error && <p className="error" role="alert">{error}</p>}
  </>
}

export function Photo({ session }: { session: RoomSession }) {
  const svg = useRef<SVGSVGElement>(null)
  const now = useClock(session.offset, 75)
  const [frame, setFrame] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [x, setX] = useState(0)
  const [y, setY] = useState(0)
  const [names, showNames] = useState(true)
  const [hidden, setHidden] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const ceremony = session.room?.ceremony ?? null
  const bounds = { x: 640 * (zoom - 1), y: 290 * (zoom - 1) }

  async function download() {
    if (!svg.current) return
    setBusy(true)
    setError('')
    try { await exportPng(svg.current) }
    catch (cause) { setError(messageFor(cause)) }
    finally { setBusy(false) }
  }

  return <>
    <section className={`river-stage ${hidden ? 'photo-full' : ''}`}>
      <RiverImage ceremony={ceremony} now={now} photo names={names} frame={frame} zoom={zoom}
        x={clamp(x, -bounds.x, bounds.x)} y={clamp(y, -bounds.y, bounds.y)} imageRef={svg}/>
    </section>
    {hidden && <button className="button photo-restore" onClick={() => setHidden(false)}>แสดงเครื่องมือถ่ายภาพ</button>}
    {!hidden && <>
      {!ceremony && <p className="muted photo-note">ลอยกระทงก่อนเพื่อให้กระทงของทั้งคู่ปรากฏในภาพ</p>}
      <div className="panel photo-controls">
        <label className="form-label">กรอบภาพ<select value={frame} onChange={event => setFrame(+event.target.value)}>
          {frames.map((name, index) => <option key={name} value={index}>{name}</option>)}
        </select></label>
        <label className="form-label">ซูม {Math.round(zoom * 100)}%<input type="range" min="1" max="1.8" step=".05" value={zoom} onChange={event => setZoom(+event.target.value)}/></label>
        <label className="form-label">ตำแหน่งแนวนอน<input type="range" min={-bounds.x} max={bounds.x} disabled={zoom === 1} value={clamp(x, -bounds.x, bounds.x)} onChange={event => setX(+event.target.value)}/></label>
        <label className="form-label">ตำแหน่งแนวตั้ง<input type="range" min={-bounds.y} max={bounds.y} disabled={zoom === 1} value={clamp(y, -bounds.y, bounds.y)} onChange={event => setY(+event.target.value)}/></label>
        <label className="check-label"><input type="checkbox" checked={names} onChange={event => showNames(event.target.checked)}/> แสดงชื่อผู้เล่น</label>
        <button className="button" onClick={() => setHidden(true)}>ซ่อนเครื่องมือ</button>
        <button className="button primary" disabled={busy} onClick={() => void download()}><Download size={18}/> ดาวน์โหลด PNG</button>
      </div>
    </>}
    {error && <p className="error" role="alert">{error}</p>}
  </>
}
