import { materialSources } from './art'
import type { Piece } from './model'

export const sortPieces = <T extends Piece>(pieces: T[]) => [...pieces].sort((a,b) => a.z - b.z || a.id.localeCompare(b.id))

export function DesignPreview({ pieces, className = '' }: { pieces: Piece[]; className?: string }) {
  return <svg className={`design-preview ${className}`} viewBox="0 0 480 480" role="img" aria-label="ภาพกระทงที่แต่ง">
    {sortPieces(pieces).map(item => <image key={item.id} href={materialSources[item.material]} width={item.size} height={item.size}
      x={item.x - item.size / 2} y={item.y - item.size / 2} transform={`rotate(${item.rotation} ${item.x} ${item.y})`}/>)}
  </svg>
}

export function designBounds(items: Piece[]) {
  if (!items.length) return { x: 0, y: 0, w: 480, h: 480 }
  const minX = Math.min(...items.map(item => item.x - item.size * .71))
  const maxX = Math.max(...items.map(item => item.x + item.size * .71))
  const minY = Math.min(...items.map(item => item.y - item.size * .71))
  const maxY = Math.max(...items.map(item => item.y + item.size * .71))
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}
