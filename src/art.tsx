import { memo, useId } from 'react'
import { materials, type Material } from './model'

function ring(count: number, draw: (angle: number, index: number) => string) {
  return Array.from({ length: count }, (_, index) => draw(index * 360 / count, index)).join('')
}

const radial = (count: number, path: string, colors: string[], stroke: string) =>
  ring(count, (angle, index) => `<path d="${path}" transform="rotate(${angle} 50 50)" fill="${colors[index % colors.length]}" stroke="${stroke}" stroke-width="1.3"/>`)

function bloom(palette: string[], inner: string, count = 9) {
  return radial(count, 'M50 57C33 47 33 26 48 8Q68 25 63 43Q61 52 50 57Z', palette, '#452632')
    + radial(count, 'M50 56Q34 44 50 20Q66 42 50 56Z', [inner, palette[1]], '#ffffff33')
    + radial(7, 'M50 54Q40 44 50 34Q60 45 50 54Z', [palette[0], inner], '#ffffff55')
    + '<circle cx="50" cy="50" r="7" fill="#e6ad54"/><circle cx="50" cy="49" r="3" fill="#ffe998"/>'
}

function materialArt(id: Material): string {
  switch (id) {
    case 'trunk': return `<circle cx="50" cy="52" r="47" fill="#33422d"/><circle cx="50" cy="49" r="45" fill="#aab571" stroke="#536246" stroke-width="3"/><circle cx="50" cy="49" r="40" fill="#cecc90" stroke="#ebdba3" stroke-width="2"/>${[35, 30, 22, 15, 8].map(r => `<circle cx="50" cy="49" r="${r}" fill="none" stroke="#8f965f" stroke-width=".9" stroke-dasharray="3 1"/>`).join('')}`
    case 'banana':
    case 'lotus-base': return `<circle cx="50" cy="51" r="43" fill="${id === 'banana' ? '#203b35' : '#642b48'}"/>`
      + radial(12, 'M50 63Q28 49 43 23L50 4L57 23Q72 49 50 63Z', id === 'banana' ? ['#477e55', '#648a52', '#32624d'] : ['#c45b81', '#e27fa0', '#a44974'], '#223b37')
      + radial(12, 'M50 59Q38 47 50 23Q62 47 50 59Z', id === 'banana' ? ['#76a961', '#4b8b53'] : ['#e99bb0', '#ed769f'], '#d5dc962f')
      + '<circle cx="50" cy="50" r="23" fill="#4b693f" stroke="#b0ae66" stroke-width="2"/><circle cx="50" cy="50" r="18" fill="#355944" stroke="#749064" stroke-dasharray="2 3"/>'
    case 'fold':
    case 'fold-round':
    case 'fold-fan': {
      const outline = { fold: 'M50 5 91 70Q54 97 9 70Z', 'fold-round': 'M50 10C82 27 98 66 68 85Q50 96 29 84C1 65 21 24 50 10Z', 'fold-fan': 'M50 90 8 34Q27 11 50 19Q72 9 92 34Z' }[id]
      return `<path d="${outline}" fill="#477b50" stroke="#234939" stroke-width="4"/><path d="M50 24 74 68 50 87 27 68Z" fill="#82ac61"/><path d="M50 21V86M50 72 29 54M50 72 70 53" fill="none" stroke="#c4ca7b" stroke-width="2" opacity=".65"/><path d="M50 30 59 67 50 80Z" fill="#aec575"/>`
    }
    case 'lotus-pink': return bloom(['#e976a1', '#c94e82', '#fa9eb5'], '#ffd0d0')
    case 'lotus-white': return bloom(['#ffead0', '#daccbd', '#fff6df'], '#fffaeb')
    case 'lotus-purple': return bloom(['#ab71d2', '#7646aa', '#c593e2'], '#e8b9f0')
    case 'marigold': return radial(14, 'M50 63C24 54 25 19 43 14Q60 6 66 26Q78 50 50 63Z', ['#e88831', '#f6b143', '#f19a26'], '#bf6425') + radial(11, 'M50 59Q27 48 44 28Q53 16 62 36Q73 51 50 59Z', ['#ffbf4c', '#e58a24'], '#f7a544') + '<circle cx="50" cy="50" r="11" fill="#ffd477" stroke="#e9952b" stroke-dasharray="2 2"/>'
    case 'jasmine': return bloom(['#f8f3dc', '#c3cbaf', '#f1ebcb'], '#fffdf0', 6)
    case 'rose': return radial(7, 'M50 66C20 67 6 40 28 21Q57 2 71 31Q72 57 50 66Z', ['#bd4166', '#d9567a', '#e8728b'], '#96364e') + radial(5, 'M50 62Q25 59 33 36Q51 22 66 39Q67 56 50 62Z', ['#ea7990', '#c54667'], '#a83d62') + '<path d="M41 52c-5-12 17-18 17-4 0 7-13 10-12 2" fill="none" stroke="#f5a3a6" stroke-width="4"/>'
    case 'orchid': return radial(5, 'M50 59C10 42 22 14 43 17Q70 17 67 33Z', ['#a768bd', '#da96d9', '#bd7ac2'], '#744575') + '<path d="M50 38q25 0 18 23-18 22-35 0-5-17 17-23" fill="#f6cfed"/><path d="M39 53q14 13 23 0-12 28-23 0" fill="#964583"/><circle cx="50" cy="48" r="5" fill="#f5ca70"/>'
    case 'petals': return '<path d="M7 63Q15 24 41 23 45 52 7 63ZM41 54Q44 12 82 12 85 44 41 54ZM34 82Q59 49 91 59 84 84 34 82Z" fill="#ef90a2" stroke="#9a4a68" stroke-width="3"/><path d="m11 60 24-26m10 17 28-29M40 79l42-16" stroke="#fbc2c1" stroke-width="2"/>'
    case 'candle': return '<circle cx="50" cy="62" r="28" fill="#a56e35" stroke="#794a2d" stroke-width="2"/><circle cx="50" cy="57" r="27" fill="#f5c66d" stroke="#ffe4a3" stroke-width="3"/><circle cx="50" cy="57" r="18" fill="#ffe49c" stroke="#e7af5b"/><path d="M50 57q-4-12 1-18" fill="none" stroke="#583c30" stroke-width="4" stroke-linecap="round"/>'
    case 'incense': return ring(3, (_, index) => `<path d="m${29 + index * 17} 83 ${-12 + index * 10}-63" stroke="#d98c79" stroke-width="7" stroke-linecap="round"/><path d="m${17 + index * 27} 20 ${3 - index * 2} 13" stroke="#bba278" stroke-width="7" stroke-linecap="round"/>`)
    case 'beads': return radial(5, 'M50 72Q14 51 26 27Q35 9 50 22Q68 4 77 31Q86 51 50 72Z', ['#d5ad90', '#f6d5b6', '#e6bda1'], '#7a685c') + radial(6, 'M50 62Q35 40 50 25Q65 41 50 62Z', ['#ebc5a8', '#ffdac0'], '#ad8980')
  }
}

export const materialSources = Object.fromEntries(materials.map(({ id }) => [
  id, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="180" height="180">${materialArt(id)}</svg>`,
  ),
])) as Record<Material, string>

export function LotusMark({ size = 30 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M16 25C8 25 4 20 3 13c6-.5 11 1.5 13 8 2-6.5 7-8.5 13-8-1 7-5 12-13 12Z" fill="#d7a059" stroke="#f3cc8b" strokeLinejoin="round"/>
    <path d="M16 24C10 17 12 8 16 4c4 4 6 13 0 20Z" fill="#f1ba70" stroke="#f8d9a2" strokeLinejoin="round"/>
    <path d="M7 28h18" stroke="#9e845d" strokeLinecap="round"/>
  </svg>
}

export function AvatarArt({ avatar, size = 35 }: { avatar: number; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <circle cx="24" cy="24" r="23" fill={['#633e5e', '#4a4f62', '#655139', '#363e6a'][avatar]}/>
    {avatar === 0 && <><path d="M24 36C12 36 7 28 8 22c8 0 14 2 16 8 2-6 8-8 16-8 1 6-4 14-16 14Z" fill="#bd7093"/><path d="M24 34c-9-8-7-17 0-23 7 6 9 15 0 23" fill="#efa9b1"/><path d="M14 39h20" stroke="#e8c287" strokeWidth="2" strokeLinecap="round"/></>}
    {avatar === 1 && <><ellipse cx="18" cy="16" rx="4" ry="10" fill="#e9cdb6" transform="rotate(-15 18 16)"/><ellipse cx="30" cy="16" rx="4" ry="10" fill="#e9cdb6" transform="rotate(15 30 16)"/><ellipse cx="24" cy="29" rx="13" ry="10" fill="#f7dec3"/><circle cx="20" cy="28" r="1.6" fill="#4b3749"/><circle cx="28" cy="28" r="1.6" fill="#4b3749"/><circle cx="24" cy="32" r="1.6" fill="#c07e8a"/></>}
    {avatar === 2 && <><path d="M16 23 7 16v16l9-7" fill="#e39d61"/><ellipse cx="27" cy="24" rx="13" ry="9" fill="#efbd71"/><path d="m23 26 6-4-1 8" fill="#da8a58"/><circle cx="34" cy="22" r="1.7" fill="#4f3445"/><circle cx="37" cy="12" r="2" fill="#dfcf9a"/></>}
    {avatar === 3 && <><path d="M30 11a14 14 0 1 0 7 21A14 14 0 0 1 30 11Z" fill="#f4cb88"/><path d="M34 13v8m-4-4h8M16 11v6m-3-3h6" stroke="#f9ddac" strokeLinecap="round"/></>}
  </svg>
}

function Temple({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M-110 109H110L96 126H-96Z" fill="#151c34" stroke="#78605d"/>
    <path d="M-82 102V72H82V102Z" fill="#302841"/>
    <path d="M-94 75Q-58 60-49 42L0 22 49 42Q58 60 94 75L62 74 0 50-62 74Z" fill="#453044" stroke="#b28462" strokeWidth="2"/>
    <path d="M-66 55Q-24 40 0 6Q24 40 66 55L37 50 0 30-37 50Z" fill="#69404b" stroke="#d0a06c" strokeWidth="2"/>
    <path d="M0 6V-17m-94 92-8-12m196 12 8-12m-168-8-8-10m140 10 8-10" stroke="#e0b07a" strokeWidth="2" strokeLinecap="round"/>
    {[-52, -24, 24, 52].map(i => <path key={i} d={`M${i - 5} 99v-15q5-10 10 0v15Z`} fill="#e4a35c" opacity=".68"/>)}
    <path d="M-9 106V78L0 68l9 10v28Z" fill="#b57953"/>
    <path d="M-88 103H88m-96 8H96" stroke="#997059"/>
  </g>
}

function Stall({ x, y, flip = 1 }: { x: number; y: number; flip?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${flip} 1)`}>
    <path d="M-14 82H142L165 100H-38Z" fill="#443139" stroke="#886657" strokeWidth="2"/>
    <path d="M0 40h125v45H0z" fill="#4a343f"/>
    <path d="M9 45h106v38H9Z" fill="#ad7155" opacity=".7"/>
    <path d="M12 41v47m99-47v47" stroke="#312733" strokeWidth="7"/>
    <path d="M-14 44 7 15 59 0l56 15 27 29Z" fill="#71465a" stroke="#c78c6b" strokeWidth="2"/>
    <path d="M-14 44h156M59 0l-22 44M59 0l24 44" fill="none" stroke="#ecc28d" strokeOpacity=".45"/>
    <path d="M-8 45q8 13 18 0 8 13 18 0 8 13 18 0 8 13 18 0 8 13 18 0 8 13 18 0 8 13 18 0 8 13 18 0" fill="none" stroke="#e4a677" strokeWidth="2"/>
    <path d="M5 77h115v10H5Z" fill="#68454b" stroke="#a5775e"/>
    {[25, 62, 99].map(i => <g key={i}><circle cx={i} cy="60" r="14" fill="#f7aa62" opacity=".17"/><rect x={i - 5} y="54" width="10" height="12" rx="3" fill="#ffc77e"/><path d={`M${i} 49v19`} stroke="#edaa62"/></g>)}
  </g>
}

function DemoBoat({ x, y, scale, pink = false }: { x: number; y: number; scale: number; pink?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cy="29" rx="91" ry="15" fill="#ba8d69" opacity=".12"/>
    <path d="M-70 26q70 15 140 0M-90 37q90 19 180 0" fill="none" stroke="#b89173" opacity=".35"/>
    <path d="M-64 1Q-50 35 0 35Q50 35 64 1Z" fill="#294a40" stroke="#849a68" strokeWidth="2"/>
    <ellipse cy="1" rx="64" ry="18" fill="#3c674f" stroke="#a5ac74" strokeWidth="2"/>
    {[-51, -33, -15, 4, 24, 44].map((v, i) => <path key={v} d={`M${v - 9} 12q-9-19 7-29 17 11 11 29Z`} fill={i % 2 ? '#83a36b' : '#537a56'} stroke="#c2bb81" strokeWidth="1"/>)}
    <image href={materialSources[pink ? 'lotus-pink' : 'lotus-purple']} x="-55" y="-25" width="40" height="40"/>
    <image href={materialSources[pink ? 'lotus-purple' : 'marigold']} x="17" y="-22" width="39" height="39"/>
    <rect x="-6" y="-34" width="12" height="39" rx="2" fill="#f3c37c"/>
    <ellipse cy="-35" rx="6" ry="2.6" fill="#ffe8a7"/>
    <path d="M0-38c-13-6-5-17 1-24-1 9 12 17-1 24Z" fill="#ffcf72"/>
    <path d="M0-39c-6-3-3-9 1-13 0 5 4 8-1 13Z" fill="#fff5c6"/>
  </g>
}

export const FestivalArt = memo(function FestivalArt({ riverOnly = false }: { riverOnly?: boolean }) {
  const uid = useId().replace(/[^a-z0-9]/gi, '')
  const id = (name: string) => uid + name
  const fill = (name: string) => `url(#${id(name)})`
  const stars = Array.from({ length: 75 }, (_, i) => ({
    x: (i * 97 + 19) % 1300, y: 12 + (i * 57 % 269), r: i % 11 === 0 ? 2 : 0.7 + i % 3 * .25,
  }))
  return <svg className="festival-art" viewBox="0 0 1280 580" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id={id('sky')} x2="0" y2="1"><stop stopColor="#15182f"/><stop offset=".64" stopColor="#393250"/><stop offset="1" stopColor="#775262"/></linearGradient>
      <linearGradient id={id('water')} x2="0" y2="1"><stop stopColor="#353a55"/><stop offset=".38" stopColor="#253a4f"/><stop offset="1" stopColor="#102735"/></linearGradient>
      <radialGradient id={id('glow')}><stop stopColor="#f7bd83" stopOpacity=".45"/><stop offset=".48" stopColor="#ca8b77" stopOpacity=".14"/><stop offset="1" stopColor="#c38a83" stopOpacity="0"/></radialGradient>
      <radialGradient id={id('moon')} cx=".36" cy=".29" r=".8"><stop stopColor="#fff0c7"/><stop offset=".74" stopColor="#f3cea0"/><stop offset="1" stopColor="#d7a075"/></radialGradient>
      <linearGradient id={id('beam')} x2="0" y2="1"><stop stopColor="#f3cb9b" stopOpacity=".38"/><stop offset="1" stopColor="#be907f" stopOpacity="0"/></linearGradient>
    </defs>
    <path d="M0 0h1280v580H0Z" fill={fill('sky')}/>
    <ellipse cx="805" cy="152" rx="360" ry="255" fill={fill('glow')}/>
    <ellipse cx="804" cy="121" rx="153" ry="139" fill={fill('glow')}/>
    {stars.map(({ x, y, r }, i) => <circle key={i} cx={x} cy={y} r={r} fill={i % 3 ? '#f4d8ae' : '#d5b7d9'} opacity={(i % 6 + 2) / 11}/>)}
    <circle cx="806" cy="125" r="62" fill={fill('moon')}/>
    <path d="M817 80c-6 10-28 6-33 21-4 10 10 14 3 21-8 10-22 4-27 13 7 25 25 42 52 47-7-11-3-20 8-24 21-6 3-16 16-31 8-8 19-5 26-8-4-19-20-38-45-39Z" fill="#c58674" opacity=".19"/>
    <path d="M644 144q61-20 108-10m111 17q58-25 141-13m-345 31q135-15 196 3m17 12q54-7 124 1" stroke="#e9b39d" strokeWidth="3" opacity=".15" fill="none" strokeLinecap="round"/>
    <path d="M0 279 69 231l81 16 96-42 83 32 104-52 92 50 102-27 79 42 69-31 68 22 109-57 74 31 72-49 82 49 60-21v139H0Z" fill="#39314b"/>
    <path d="m0 283 72-33 82 32 95-21 110 35 107-42 80 35 127-43 96 35 116-23 62 21 101-43 75 30 157-44v125H0Z" fill="#252b43"/>
    <path d="M0 317q182-33 327 1t351-4q181-34 317 0t285-13v279H0Z" fill={fill('water')}/>
    <path d="M788 310h37l92 270H704Z" fill={fill('beam')} opacity=".65"/>
    {Array.from({ length: 115 }, (_, i) => {
      const x = i * 131 % 1340 - 28
      const y = 320 + Math.floor(i * 233 % 252)
      return <path key={i} d={`M${x} ${y}h${9 + i * 13 % 71}`} stroke={i % 5 === 0 || (x > 739 && x < 865) ? '#d1a38a' : '#7697a3'} opacity={.12 + i % 5 * .036} strokeLinecap="round"/>
    })}
    <g className="art-shimmer">
      {Array.from({ length: 20 }, (_, i) => <path key={i} d={`M${803 - i * 2 + i % 3 * 8} ${321 + i * 9}h${25 + i % 7 * 8}`} stroke="#f2c8a2" strokeWidth={i % 2 ? 2 : 1} opacity={(25-i)/68} strokeLinecap="round"/>)}
    </g>
    <path d="M0 301Q127 282 261 309l69 26Q125 353 0 387Zm1280-16q-107-15-208 10l-69 27q98 12 277 54Z" fill="#1d2b3a"/>
    <path d="M0 366q153-46 306-35M1030 324q137-18 250 33" fill="none" stroke="#947164" strokeWidth="2" opacity=".7"/>
    <Temple x={1032} y={183} scale={1.12}/>
    <Stall x={1129} y={257}/>
    <Stall x={221} y={271} flip={-1}/>
    <Stall x={46} y={268}/>
    <path d="M0 119q105 110 334 94m609 2q204-6 337-120" fill="none" stroke="#b58b72" strokeWidth="1.2" opacity=".75"/>
    {[[19, 137], [59, 164], [107, 186], [162, 201], [221, 212], [281, 216], [972, 213], [1026, 206], [1081, 194], [1136, 174], [1190, 147], [1242, 121]].map(([x, y], i) =>
      <g key={x} className="art-lantern" style={{ animationDelay: `-${i * .42}s` }}>
        <circle cx={x} cy={y + 13} r="34" fill={fill('glow')}/>
        <path d={`M${x} ${y}v8`} stroke="#dec291"/>
        <rect x={x - 8} y={y + 7} width="16" height="19" rx="6" fill={i % 3 === 0 ? '#ec9e87' : '#efbe78'} stroke="#ffdba0"/>
        <path d={`M${x - 3} ${y + 8}v17m6-17v17`} stroke="#b97561" opacity=".75"/>
        <path d={`M${x} ${y + 26}v5`} stroke="#db975a"/>
      </g>,
    )}
    <path d="M0 518q99-100 202-67 55 18 87 129H0Zm1280-60q-96-28-182 11l-88 111h270Z" fill="#172f36"/>
    {!riverOnly && <g className="art-boats">
      <DemoBoat x={763} y={454} scale={1.43} pink/>
      <DemoBoat x={958} y={412} scale={.93}/>
      <DemoBoat x={587} y={376} scale={.45} pink/>
    </g>}
    <path d="M0 552q110-115 206 28H0Zm1280-48q-91-1-132 76h132Z" fill="#132731"/>
    {[57, 93, 135, 1197, 1231, 1258].map((x, i) => <path key={x} d={`M${x} 580q${i % 2 ? -17 : 20}-48 -23-94m23 94q15-58 40-76m-40 76q-4-47 8-112`} fill="none" stroke="#325044" strokeWidth="3" strokeLinecap="round"/>)}
    {[[185,378],[235,446],[345,333],[621,344],[652,427],[879,361],[1104,381],[1110,459],[1190,435],[462,310],[914,486],[594,490],[305,419]].map(([x,y],i) =>
      <circle key={x} className="art-firefly" style={{ animationDelay: `-${i * .61}s` }} cx={x} cy={y} r={i % 3 ? 2 : 2.8} fill="#ffdb91"/>,
    )}
  </svg>
})
