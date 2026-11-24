import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Image as KonvaImage, Circle, Line, Transformer } from 'react-konva'
import type Konva from 'konva'
import {
  ArrowDownToLine, ArrowUpToLine, Check, Copy, Flower2, Grid3X3, Minus,
  Plus, Redo2, RotateCw, Scan, Trash2, Undo2,
} from 'lucide-react'
import { materialSources } from './art'
import { DesignPreview, sortPieces } from './design'
import {
  boardCenter, boardSize, categories, clamp, materialById, materials,
  type Board, type Change, type Material, type Piece, type Room, type SavedPiece,
} from './model'
import type { RoomSession } from './useRoom'
import { messageFor } from './useRoom'

const empty: SavedPiece[] = []
const images: Partial<Record<Material, HTMLImageElement>> = {}
let loading: Promise<void> | undefined

export function loadMaterialImages() {
  loading ??= Promise.all(materials.map(({ id }) => new Promise<void>((resolve, reject) => {
    const image = new Image()
    image.onload = () => { images[id] = image; resolve() }
    image.onerror = reject
    image.src = materialSources[id]
  }))).then(() => {})
  return loading
}

type Frame = { id: string; before: Piece | null; after: Piece | null }[]
const samePiece = (a?: Piece | null, b?: Piece | null) => !a || !b
  ? !a && !b
  : a.material === b.material && a.x === b.x && a.y === b.y && a.size === b.size && a.z === b.z && a.rotation === b.rotation

type Props = {
  board: Board; room: Room; action: RoomSession['action']; readOnly?: boolean
  roundId?: string; feedback: () => void; heading?: string
}

export default function Workshop({ board, room, action, readOnly = false, roundId, feedback, heading = 'โต๊ะแต่งกระทง' }: Props) {
  const pieces = room.boards[board] ?? empty
  const [category, setCategory] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [grid, setGrid] = useState(false)
  const [radial, setRadial] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [width, setWidth] = useState(480)
  const [loaded, setLoaded] = useState(!!images.trunk)
  const [pending, setPending] = useState(false)
  const locked = useRef(false)
  const savedRevision = useRef(new Map<string, number>())
  const [undo, setUndo] = useState<Frame[]>([])
  const [redo, setRedo] = useState<Frame[]>([])
  const boardWrapper = useRef<HTMLDivElement>(null)
  const stage = useRef<Konva.Stage>(null)
  const transformer = useRef<Konva.Transformer>(null)
  const dragRevision = useRef<SavedPiece | null>(null)
  const scale = width / boardSize * zoom
  const margin = (width - boardSize * scale) / 2
  const item = pieces.find(item => item.id === selected)

  useEffect(() => {
    let active = true
    void loadMaterialImages().then(() => { if (active) setLoaded(true) })
      .catch(() => { if (active) setNotice('โหลดภาพวัสดุไม่สำเร็จ ลองรีเฟรชหน้า') })
    const node = boardWrapper.current
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    if (node) observer.observe(node)
    return () => { active = false; observer.disconnect() }
  }, [])

  useEffect(() => {
    const node = item && stage.current?.findOne('#' + item.id)
    transformer.current?.nodes(node && !readOnly && !pending ? [node] : [])
  }, [item, readOnly, loaded, width, zoom, pending])

  const adjust = (value: number) => clamp(grid ? Math.round(value / 20) * 20 : Math.round(value), 0, boardSize)

  async function write(changes: Change[]) {
    if (locked.current || readOnly || !changes.length) return false
    locked.current = true
    setPending(true)
    setNotice('')
    try {
      const next = await action({ type: 'edit', board, changes, roundId })
      for (const change of changes) savedRevision.current.set(change.id, next.boards[board]?.find(piece => piece.id === change.id)?.rev ?? 0)
      feedback()
      return true
    } catch (error) {
      setNotice(messageFor(error))
      return false
    } finally {
      locked.current = false
      setPending(false)
    }
  }

  async function edit(updates: { before?: SavedPiece; after: Piece | null }[]) {
    if (updates.length === 0) return false
    const frame = updates.map(({ before, after }) => ({ id: (after ?? before)!.id, before: before ?? null, after }))
    if (await write(updates.map(({ before, after }) => ({ id: (after ?? before)!.id, expected: before?.rev ?? 0, piece: after })))) {
      setUndo(previous => [...previous.slice(-39), frame])
      setRedo([])
      return true
    }
    return false
  }

  async function travel(forward: boolean) {
    const entries = forward ? redo : undo
    const frame = entries.at(-1)
    if (!frame) return
    const changes = frame.map(entry => {
      const current = pieces.find(piece => piece.id === entry.id)
      return {
        id: entry.id, expected: current?.rev ?? 0, piece: forward ? entry.after : entry.before,
        matches: samePiece(current, forward ? entry.before : entry.after) && (current?.rev ?? 0) === savedRevision.current.get(entry.id),
      }
    })
    if (changes.some(change => !change.matches)) {
      setNotice('ชิ้นงานถูกแก้ไขจากอีกเซสชัน จึงข้ามประวัติรายการนี้')
      if (forward) setRedo(redo.slice(0, -1))
      else setUndo(undo.slice(0, -1))
      return
    }
    if (!await write(changes.map(({ id, expected, piece }) => ({ id, expected, piece })))) return
    if (forward) {
      setRedo(redo.slice(0, -1))
      setUndo([...undo, frame])
    } else {
      setUndo(undo.slice(0, -1))
      setRedo([...redo, frame])
    }
  }

  function add(material: Material, x?: number, y?: number) {
    const definition = materialById.get(material)
    if (!definition) return
    const base = definition.category === 0
    const n = base ? 1 : radial
    const count = pieces.filter(piece => materialById.get(piece.material)?.category !== 0).length
    const angle = count * Math.PI * (3 - Math.sqrt(5))
    const px = adjust(x ?? (base ? boardCenter : boardCenter + Math.cos(angle) * (count === 0 && n === 1 ? 0 : 90)))
    const py = adjust(y ?? (base ? boardCenter : boardCenter + Math.sin(angle) * (count === 0 && n === 1 ? 0 : 90)))
    const z = base ? Math.min(0, ...pieces.map(piece => piece.z)) - 1 : Math.max(0, ...pieces.map(piece => piece.z)) + 1
    const added = Array.from({ length: n }, (_, index): Piece => {
      const turn = index * 2 * Math.PI / n
      const rx = n > 1 && px === boardCenter && py === boardCenter ? 92 : px - boardCenter
      const ry = py - boardCenter
      return {
        id: crypto.randomUUID(), material, size: definition.size, z: z + index,
        x: adjust(boardCenter + rx * Math.cos(turn) - ry * Math.sin(turn)),
        y: adjust(boardCenter + rx * Math.sin(turn) + ry * Math.cos(turn)),
        rotation: ((turn * 180 / Math.PI + 180) % 360) - 180,
      }
    })
    void edit(added.map(after => ({ after }))).then(ok => { if (ok) setSelected(added[0].id) })
  }

  function update(changes: Partial<Piece>) {
    if (item) void edit([{ before: item, after: { ...item, ...changes } }])
  }

  function duplicate() {
    if (!item) return
    const after = { ...item, id: crypto.randomUUID(), x: adjust(item.x + 20), y: adjust(item.y + 20), z: Math.max(...pieces.map(p => p.z)) + 1 }
    void edit([{ after }]).then(ok => { if (ok) setSelected(after.id) })
  }

  const disabled = pending || readOnly
  const order = sortPieces(pieces)
  const selectedName = item ? materialById.get(item.material)?.name : 'ยังไม่ได้เลือกวัสดุ'

  return <div className="studio">
    <aside className="panel materials">
      <h2><Flower2 size={20}/> วัสดุแต่งกระทง</h2>
      <div className="material-tabs" aria-label="หมวดวัสดุ">{categories.map((label, i) =>
        <button key={label} className={i === category ? 'active' : ''} aria-pressed={i === category} onClick={() => setCategory(i)}>{label}</button>,
      )}</div>
      <div className="material-grid" key={category}>
        {materials.filter(material => material.category === category).map(material =>
          <button key={material.id} type="button" aria-label={material.name} disabled={disabled} draggable={!disabled}
            onDragStart={event => { event.dataTransfer.setData('text/plain', material.id); event.dataTransfer.effectAllowed = 'copy' }}
            onClick={() => add(material.id)}>
            <img src={materialSources[material.id]} alt="" draggable={false}/><span>{material.name}</span>
          </button>,
        )}
      </div>
      <p className="muted material-hint">แตะวัสดุเพื่อเพิ่ม หรือลากไปวางบนโต๊ะ</p>
    </aside>
    <section className="panel tabletop" aria-label="กระดานแต่งกระทง">
      <div className="table-heading"><h2>{heading}</h2><span className="muted">{pieces.length} ชิ้น</span></div>
      <div className="canvas-shell" ref={boardWrapper} aria-busy={!loaded || pending}
        onDragOver={event => { if (!disabled) event.preventDefault() }}
        onDrop={event => {
          event.preventDefault()
          if (disabled) return
          const material = event.dataTransfer.getData('text/plain') as Material
          const rect = event.currentTarget.getBoundingClientRect()
          add(material, (event.clientX - rect.left - margin) / scale, (event.clientY - rect.top - margin) / scale)
        }}>
        {!pieces.length && <div className="canvas-empty"><Flower2 size={34}/><span>เริ่มจากเลือกฐานกระทง</span></div>}
        <Stage width={width} height={width} ref={stage}
          onPointerDown={event => { if (event.target === event.target.getStage()) setSelected(null) }}>
          <Layer x={margin} y={margin} scaleX={scale} scaleY={scale}>
            <Circle x={240} y={240} radius={185} stroke="#837865" opacity={.27} dash={[4, 6]} listening={false}/>
            <Circle x={240} y={240} radius={125} stroke="#837865" opacity={.25} listening={false}/>
            {grid && Array.from({ length: 25 }, (_, i) => <Line key={'x' + i} points={[i * 20, 0, i * 20, 480]} stroke="#b2a180" opacity={.16} listening={false}/>)}
            {grid && Array.from({ length: 25 }, (_, i) => <Line key={'y' + i} points={[0, i * 20, 480, i * 20]} stroke="#b2a180" opacity={.16} listening={false}/>)}
            {loaded && order.map(piece => <KonvaImage key={piece.id} id={piece.id} name="material-piece" image={images[piece.material]}
              x={piece.x} y={piece.y} width={piece.size} height={piece.size} offsetX={piece.size / 2} offsetY={piece.size / 2}
              rotation={piece.rotation} draggable={!disabled}
              onPointerDown={() => setSelected(piece.id)} onDragStart={() => { dragRevision.current = piece; setSelected(piece.id) }}
              onDragEnd={event => {
                const before = dragRevision.current ?? piece
                dragRevision.current = null
                const node = event.target
                const after = { ...before, x: adjust(node.x()), y: adjust(node.y()) }
                node.position({ x: piece.x, y: piece.y })
                if (!samePiece(before, after)) void edit([{ before, after }])
              }}
              onTransformStart={() => { dragRevision.current = piece }}
              onTransformEnd={event => {
                const before = dragRevision.current ?? piece
                dragRevision.current = null
                const node = event.target
                const after = {
                  ...before, x: adjust(node.x()), y: adjust(node.y()),
                  rotation: Math.round(node.rotation()) % 360,
                  size: clamp(Math.round(piece.size * node.scaleX()), 12, 460),
                }
                node.setAttrs({ x: piece.x, y: piece.y, rotation: piece.rotation, scaleX: 1, scaleY: 1 })
                if (!samePiece(before, after)) void edit([{ before, after }])
              }}
            />)}
            {!readOnly && <Transformer ref={transformer} anchorSize={12} anchorCornerRadius={3} borderStroke="#f1c186"
              anchorStroke="#e1ad77" anchorFill="#252b3d" rotateAnchorOffset={22}
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']} flipEnabled={false} keepRatio
              boundBoxFunc={(oldBox, next) => next.width < 12 * scale || next.width > 460 * scale ? oldBox : next}/>}
          </Layer>
        </Stage>
      </div>
      <div className="tool-row">
        <button className="icon-button" aria-label="เลิกทำ" title="เลิกทำ" disabled={disabled || !undo.length} onClick={() => void travel(false)}><Undo2 size={19}/></button>
        <button className="icon-button" aria-label="ทำซ้ำ" title="ทำซ้ำ" disabled={disabled || !redo.length} onClick={() => void travel(true)}><Redo2 size={19}/></button>
        <span className="tool-divider"/>
        <button className="icon-button" aria-label="ซูมออก" disabled={zoom <= .7} onClick={() => setZoom(n => clamp(n - .15, .7, 1.6))}><Minus size={18}/></button>
        <button className="icon-button zoom-label" aria-label="รีเซ็ตซูม" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
        <button className="icon-button" aria-label="ซูมเข้า" disabled={zoom >= 1.6} onClick={() => setZoom(n => clamp(n + .15, .7, 1.6))}><Plus size={18}/></button>
        <button className={`icon-button ${grid ? 'active' : ''}`} aria-label="จัดแนวตามตาราง" aria-pressed={grid} onClick={() => setGrid(!grid)}><Grid3X3 size={18}/></button>
      </div>
    </section>
    <aside className="panel inspector">
      <h2><Scan size={19}/> ชิ้นงาน</h2>
      <div className="preview-tile"><DesignPreview pieces={pieces}/>{pieces.length === 0 && <Flower2 size={29}/>}</div>
      <label className="form-label">วางเป็นวง
        <select value={radial} disabled={disabled} onChange={event => setRadial(+event.target.value)}>
          <option value={1}>ทีละชิ้น</option>{[4, 6, 8, 12].map(n => <option key={n} value={n}>{n} ตำแหน่ง</option>)}
        </select>
      </label>
      <label className="form-label">เลือกชิ้นงาน
        <select aria-label="เลือกชิ้นงาน" value={item?.id ?? ''} onChange={event => setSelected(event.target.value || null)}>
          <option value="">เลือกบนกระดาน</option>
          {order.map((piece, i) => <option key={piece.id} value={piece.id}>{i + 1}. {materialById.get(piece.material)?.name}</option>)}
        </select>
      </label>
      <div className="selected-tools">
        <button className="icon-button" aria-label="หมุนชิ้นงาน" title="หมุนชิ้นงาน" disabled={disabled || !item} onClick={() => item && update({ rotation: (item.rotation + 15) % 360 })}><RotateCw size={18}/></button>
        <button className="icon-button" aria-label="ย่อชิ้นงาน" title="ย่อชิ้นงาน" disabled={disabled || !item} onClick={() => item && update({ size: clamp(item.size - 8, 12, 460) })}><Minus size={18}/></button>
        <button className="icon-button" aria-label="ขยายชิ้นงาน" title="ขยายชิ้นงาน" disabled={disabled || !item} onClick={() => item && update({ size: clamp(item.size + 8, 12, 460) })}><Plus size={18}/></button>
        <button className="icon-button" aria-label="ทำสำเนา" title="ทำสำเนา" disabled={disabled || !item} onClick={duplicate}><Copy size={17}/></button>
        <button className="icon-button" aria-label="ย้ายชิ้นงานขึ้นบนสุด" title="ย้ายขึ้นบนสุด" disabled={disabled || !item} onClick={() => update({ z: Math.max(...pieces.map(p => p.z)) + 1 })}><ArrowUpToLine size={17}/></button>
        <button className="icon-button" aria-label="ย้ายชิ้นงานลงล่างสุด" title="ย้ายลงล่างสุด" disabled={disabled || !item} onClick={() => update({ z: Math.min(...pieces.map(p => p.z)) - 1 })}><ArrowDownToLine size={17}/></button>
        <button className="icon-button" aria-label="ลบชิ้นงาน" title="ลบชิ้นงาน" disabled={disabled || !item} onClick={() => item && void edit([{ before: item, after: null }])}><Trash2 size={17}/></button>
      </div>
      <p className="muted selection-label">{selectedName}</p>
      {!readOnly && <>
        <button className="button primary save-design" disabled={pending || !pieces.length} onClick={() => setNotice('บันทึกกระทงแล้ว เลือกนำไปลอยได้ที่ท่าน้ำ')}><Check size={18}/> บันทึกกระทง</button>
        {confirmClear ? <div className="clear-actions">
          <button className="button small" onClick={() => setConfirmClear(false)}>ยกเลิก</button>
          <button className="button small danger" onClick={() => { setConfirmClear(false); void edit(pieces.map(before => ({ before, after: null }))) }}>ล้างทั้งหมด</button>
        </div> : <button className="quiet-button" disabled={disabled || !pieces.length} onClick={() => setConfirmClear(true)}>ล้างกระดาน</button>}
      </>}
      <p className="status-line" role="status">{notice || (readOnly ? 'ดูผลงานอย่างเดียว' : pending ? 'กำลังบันทึก…' : 'บันทึกอัตโนมัติทุกครั้งที่แก้ไข')}</p>
    </aside>
  </div>
}
