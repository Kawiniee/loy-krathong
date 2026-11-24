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

function spark(x: number, y: number, radius: number, color: string) {
  return `<path d="M0-1Q.16-.16 1 0Q.16.16 0 1Q-.16.16-1 0Q-.16-.16 0-1Z"
    transform="translate(${x} ${y}) scale(${radius})" fill="${color}"/>`
}

const star = 'M50 6 64 33l30 5-22 22 5 32-27-15-27 15 5-32L6 38l30-5Z'
const crescent = 'M70 6A47 47 0 1 0 93 69 36 36 0 0 1 70 6Z'

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
    case 'woven-base': return '<defs><pattern id="weave" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><rect width="12" height="12" fill="#9e6539"/><path d="M0 3h12m-9 0v9m6-12v7" stroke="#d8a461" stroke-width="4"/><path d="M0 5h12m-7 0v7" stroke="#70482f"/></pattern></defs><circle cx="50" cy="51" r="46" fill="url(#weave)" stroke="#654329" stroke-width="6"/><circle cx="50" cy="50" r="43" fill="none" stroke="#e2ad67" stroke-width="4" stroke-dasharray="2 2.6"/><circle cx="50" cy="50" r="34" fill="none" stroke="#f7c689" opacity=".65"/>'
    case 'lilypad-base': return '<path d="M49 50 81 17A45 45 0 1 0 94 41Z" fill="#467c59" stroke="#244539" stroke-width="4"/><path d="M49 50 77 18Q57 4 34 15Q7 27 9 54Q13 78 38 90Q65 97 85 70Q92 61 92 44Z" fill="#719d63"/><path d="M49 50 32 15m17 35L9 48m40 2L23 78m26-28-1 40m1-40 25 30m-25-30 37 11" stroke="#98bd76" stroke-width="1.5"/><ellipse cx="27" cy="39" rx="6" ry="4" fill="#aaddbc" opacity=".72"/>'
    case 'moon-base': return `<path d="${crescent}" fill="#f6ce83" stroke="#986540" stroke-width="3"/><path d="M62 10A44 44 0 0 0 40 89" fill="none" stroke="#ffefba" stroke-width="3"/><ellipse cx="29" cy="49" rx="9" ry="6" fill="#d69b62"/><ellipse cx="47" cy="75" rx="6" ry="4" fill="#d69b62"/>${spark(80,31,9,'#fff0ad')}${spark(66,49,4,'#ffefc7')}`
    case 'reef-base': return '<path d="M13 19 39 6 75 12 92 33 96 63 76 90 49 96 19 82 6 59Z" fill="#377e85" stroke="#224c66" stroke-width="5"/><path d="M20 25 42 13 73 20 85 38 87 61 71 82 47 89 25 76 14 57Z" fill="#e0b57e" stroke="#75c0b0" stroke-width="5"/><path d="M32 48q26-17 38 2-6 20-31 19-16-6-7-21Z" fill="#78bab3" stroke="#e4c896"/><path d="M16 32q7 6 14 1m43 37q10 3 13-5m-59 9 10 6" fill="none" stroke="#fff0c3" stroke-width="2" stroke-linecap="round"/>'
    case 'galaxy-base': return `<defs><radialGradient id="galaxy"><stop stop-color="#8d689f"/><stop offset=".68" stop-color="#454075"/><stop offset="1" stop-color="#251f51"/></radialGradient></defs><circle cx="50" cy="50" r="45" fill="url(#galaxy)" stroke="#a183bc" stroke-width="3"/><path d="M12 53q14 25 51 12 37-15 19-31Q63 20 40 39T55 54" fill="none" stroke="#d1aedf" stroke-opacity=".48" stroke-width="3" stroke-linecap="round"/>${[[23,27,6],[73,28,5],[34,73,4],[63,79,6],[82,56,4],[44,19,3],[58,46,5]].map(([x,y,r])=>spark(x,y,r,'#fff1bb')).join('')}`
    case 'fern': return '<path d="M25 94Q49 61 70 8" fill="none" stroke="#d2b978" stroke-width="3"/>' + Array.from({ length: 7 }, (_, i) => {
      const x = 30 + i * 6
      const y = 81 - i * 10
      return `<path d="M${x} ${y}q-21-2-19-18 19 4 19 18q9-19 22-17-3 14-22 17Z" fill="${i % 2 ? '#a2b65e' : '#639b64'}" stroke="#3d6449" stroke-width="1"/>`
    }).join('')
    case 'monstera': return '<path d="M43 93 52 62M50 70C30 76 11 59 8 41q-3-10 7-17l15 9-8-15q10-10 24-5l7 15 6-16q14-1 19 10l-7 13 16-3q9 10-1 23l-18 2 9 7q-13 14-27 6Z" fill="#63a789" stroke="#285e55" stroke-width="4" stroke-linejoin="round"/><path d="m45 83 10-53M50 59 30 45m21 6 23-12m-25 26 16-4" stroke="#a9cf91" stroke-width="2" fill="none"/>'
    case 'ginkgo': return '<path d="M51 83 50 52M50 63C20 58 4 49 8 24 22 15 33 11 47 18l4 7 4-7q17-8 38 6C97 46 78 60 50 63Z" fill="#d0ab51" stroke="#99703f" stroke-width="3"/><path d="M50 59 19 30m31 29L32 22m18 37 1-28m-1 28 18-37M50 59l33-27" stroke="#efd083" stroke-width="2" stroke-linecap="round"/>'
    case 'bamboo': return '<path d="M27 93Q50 65 64 8m-20 57 25-17M48 54 29 30" fill="none" stroke="#829853" stroke-width="5" stroke-linecap="round"/><path d="M47 57Q22 54 11 36q25 1 36 21Zm8-16Q31 28 34 12q20 8 21 29Zm1 14q17-24 38-16Q80 55 56 55Zm3-19Q67 13 87 11 79 32 59 36ZM40 71Q22 63 9 65q6 15 31 6Z" fill="#91b76d" stroke="#497650" stroke-width="2"/>'
    case 'frost-sprig': return '<path d="M49 91V14m0 58L22 53m27 9 29-24M49 51 28 30m21 8 22-16" fill="none" stroke="#b3e2eb" stroke-width="3" stroke-linecap="round"/>' + [[49,13],[22,52],[79,38],[27,29],[72,20]].map(([x,y])=>spark(x,y,9,'#d2f8fc')).join('')
    case 'sunflower': return radial(16, 'M50 57Q27 36 44 13q8-9 15 1 13 23-9 43Z', ['#f6c757','#ffc64e','#e4a441'],'#bd7b35') + '<circle cx="50" cy="50" r="22" fill="#805034" stroke="#eeb352" stroke-width="2"/><circle cx="50" cy="50" r="15" fill="#543136" stroke="#bc8953" stroke-width="3" stroke-dasharray="2 3"/>'
    case 'butterfly-pea': return '<path d="M49 82C34 81 9 58 17 35 19 23 33 18 43 28c0-15 14-22 23-9 6 8 3 13 3 13 14-7 24 9 18 24-7 15-24 25-38 26Z" fill="#5756ac" stroke="#322e72" stroke-width="3"/><path d="M49 71Q25 59 31 38q10-9 18 6 8-20 22-8 10 16-22 35Z" fill="#8184dd"/><path d="M49 70Q35 58 41 50l8 6 9-7q8 9-9 21Z" fill="#e5d9f7"/><path d="M37 78q12 9 22-1" fill="none" stroke="#92b679" stroke-width="7" stroke-linecap="round"/>'
    case 'hibiscus': return radial(5, 'M50 58C19 47 21 23 34 15q16-12 27 4c20 21 11 33-11 39Z',['#e65b69','#ef7680'],'#974354') + '<circle cx="50" cy="50" r="12" fill="#a33a53"/><path d="M48 52q16 2 27-16" fill="none" stroke="#f9b988" stroke-width="4" stroke-linecap="round"/><circle cx="76" cy="35" r="5" fill="#ffd270"/>'
    case 'sakura': return radial(5, 'M50 60Q26 42 31 20 39 7 49 17 60 7 68 20q7 21-18 40Z',['#f5b4c7','#ef9fbc'],'#bf7598') + radial(5,'M50 52V30',['none'],'#fff2e7') + '<circle cx="50" cy="50" r="6" fill="#e6a64e"/>'
    case 'chrysanthemum': return radial(16,'M50 56Q37 38 43 16q7-13 14 0 6 22-7 40Z',['#f9eee0','#f3cbb7'],'#be8f86') + radial(13,'M50 54Q41 43 45 28q5-7 10 0 4 15-5 26Z',['#fff1c7','#f0d4a4'],'#deaf85') + '<circle cx="50" cy="50" r="9" fill="#e6aa55"/>'
    case 'lavender': return '<path d="m34 91 14-75m-10 68 31-55M40 78 28 43" fill="none" stroke="#849966" stroke-width="3"/>' + [[30,44,5],[34,53,6],[43,35,7],[47,24,7],[50,15,5],[55,55,5],[61,45,7],[66,35,6],[72,26,4]].map(([x,y,r],i)=>`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r-1}" fill="${i%2?'#bb92cf':'#9065b3'}" stroke="#654c86"/>`).join('')
    case 'lotus-candle': return bloom(['#ed946f','#d27363','#f1a587'],'#ffc890',7) + '<circle cx="50" cy="51" r="14" fill="#ffe2a1" stroke="#e6a461" stroke-width="2"/><path d="m50 51 2-7" stroke="#634139" stroke-width="3" stroke-linecap="round"/>'
    case 'star-candle': return `<path d="${star}" fill="#edaa68" stroke="#ad683d" stroke-width="3"/><path d="M50 18 60 39l23 4-17 17 4 22-20-11-20 11 4-22-17-17 23-4Z" fill="#ffe2a1"/><path d="m50 51 2-7" stroke="#674032" stroke-width="4" stroke-linecap="round"/>`
    case 'lantern': return '<path d="M50 12v12m0 49v17m-5-1 5 5 5-5" stroke="#e7bb71" stroke-width="4" stroke-linecap="round" fill="none"/><rect x="21" y="24" width="58" height="51" rx="18" fill="#c65d58" stroke="#7d3e52" stroke-width="3"/><path d="M32 25q-9 24 0 49m12-49q-6 24 0 49m12-49q5 24 0 49m12-49q9 24 0 49" stroke="#f6aa75" stroke-width="3" fill="none"/><path d="M35 23h30m-30 53h30" stroke="#efc384" stroke-width="5" stroke-linecap="round"/>'
    case 'bunting': return '<path d="M5 24q45 35 90 0" stroke="#eac68d" stroke-width="3" fill="none"/><path d="m12 29 16 10-16 15Z" fill="#e78482"/><path d="m30 39 19 4-14 20Z" fill="#edbc75"/><path d="m50 43 19-4-4 24Z" fill="#89bfac"/><path d="m71 38 18-9-2 23Z" fill="#a993c5"/>'
    case 'garland': return '<path d="M50 13q30 2 31 27 0 25-31 39Q19 65 19 40q1-25 31-27Z" fill="none" stroke="#8f6c56" stroke-width="13"/><path d="M50 13q30 2 31 27 0 25-31 39Q19 65 19 40q1-25 31-27Z" fill="none" stroke="#f7e8c7" stroke-width="12" stroke-dasharray="1 7" stroke-linecap="round"/><path d="m43 73-11 10 5 10 13-9 13 9 5-10-11-10Z" fill="#dd7b80" stroke="#a65065" stroke-width="2"/>'
    case 'firework': return ring(10,(angle,i)=>`<path d="M50 12q-7 11 0 ${13+i%3*3}M50 7v1" transform="rotate(${angle} 50 50)" stroke="${i%2?'#eb9384':'#ffcf7d'}" fill="none" stroke-width="3.5" stroke-linecap="round"/>`) + spark(50,50,10,'#ffe5a7')
    case 'koi': return '<path d="M37 69Q16 81 18 94q18-3 28-16 2 15 18 17-1-16-19-29Z" fill="#efb19a" stroke="#a95b54" stroke-width="2"/><path d="M57 41Q78 35 85 54 69 63 54 52m-18 2q-19-12-20 10 7 7 21 2" fill="#e18c72"/><path d="M36 70c1-13-10-32 0-51Q48 1 65 14q18 17 3 37L47 79Z" fill="#fff0ca" stroke="#a96a5a" stroke-width="3"/><path d="M34 33q15 3 21-11T68 18q7 9 5 17-16 12-39-2Zm5 22q16 11 21 1L47 74l-8-5Z" fill="#e87859"/><circle cx="59" cy="20" r="2.7" fill="#3e3034"/>'
    case 'turtle': return '<path d="M35 32Q19 15 13 29q-3 12 17 16m40-10q18-16 23-2 1 11-18 17M32 65Q14 65 18 79q11 7 20-7m29-9q24-1 18 15-13 7-23-6M46 73l6 15 5-15" fill="#81b998" stroke="#426f67" stroke-width="3"/><ellipse cx="51" cy="48" rx="25" ry="28" fill="#679661" stroke="#3a6552" stroke-width="4"/><path d="m51 30 15 10v16L51 66 36 56V40Z" fill="#bcca7c" stroke="#477854" stroke-width="3"/><circle cx="51" cy="17" r="11" fill="#9acc9f" stroke="#426f67" stroke-width="3"/><path d="M47 15h.1m8 0h.1" stroke="#2d4d48" stroke-width="3" stroke-linecap="round"/>'
    case 'sea-shell': return '<path d="M49 91Q14 80 8 41 8 14 33 14 50 2 69 15 92 16 93 43 87 80 49 91Z" fill="#eab48f" stroke="#a36564" stroke-width="3"/><path d="M49 88 15 40m34 48L29 20m20 68V14m0 74 21-68M49 88l35-46" stroke="#f9dac2" stroke-width="3" fill="none" stroke-linecap="round"/><path d="m40 79 9 9 11-9" fill="#ad7776"/>'
    case 'coral': return '<path d="M49 90q-4-19 3-38 6-17 0-40M50 73Q26 58 22 29m5 17L13 36m15 11 7-24m18 38q17-11 23-43m-9 27 19-10M51 71q17 0 29-14" fill="none" stroke="#a95164" stroke-width="10" stroke-linecap="round"/><path d="M49 90q-4-19 3-38 6-17 0-40M50 73Q26 58 22 29m5 17L13 36m15 11 7-24m18 38q17-11 23-43m-9 27 19-10M51 71q17 0 29-14" fill="none" stroke="#ea8585" stroke-width="6" stroke-linecap="round"/>'
    case 'pearl': return '<path d="M13 58Q19 20 50 19t37 38q-11 26-37 30T13 58Z" fill="#bd8cb7" stroke="#705779" stroke-width="3"/><path d="M14 58q34 19 72-1M29 42l13 25m28-25L56 67" fill="none" stroke="#e2b1ce" stroke-width="3"/><circle cx="50" cy="55" r="16" fill="#fff0da" stroke="#d6bacb" stroke-width="3"/><path d="M44 49q4-4 8-3" fill="none" stroke="#fffbed" stroke-width="4" stroke-linecap="round"/>'
    case 'crystal': return '<path d="M24 84 12 57l9-21 14 14 8-30L55 6l17 23-2 24 15-12 5 23-17 22Z" fill="#8f70bd" stroke="#51406e" stroke-width="3" stroke-linejoin="round"/><path d="M24 84 21 36l14 14 11 36Zm22 2 9-80 17 23-2 24-10 33Zm14 0 25-45 5 23-17 22Z" fill="#bba0df"/><path d="M46 86 55 6 43 20l-8 30Z" fill="#dfbafa"/>' + spark(78,20,9,'#f9dfb5')
    case 'star': return `<path d="${star}" fill="#8eb5de" stroke="#5b609a" stroke-width="3"/><path d="M50 6v44L36 33 6 38l44 12-22 10-5 32 27-42v27l27 15-27-42 22 10 22-22-44 12 14-17Z" fill="#c4e8f4"/>${spark(50,50,9,'#f9f7d7')}`
    case 'comet': return '<path d="M80 16C56 27 32 45 16 78 42 67 68 69 85 47 93 36 93 17 80 16Z" fill="#6f75bc" stroke="#564689" stroke-width="3"/><path d="M76 25Q43 41 25 69 67 57 81 36" fill="none" stroke="#a7bae9" stroke-width="5" stroke-linecap="round"/>' + spark(79,28,17,'#ffdf96') + spark(35,33,6,'#c7e7f5')
    case 'potion': return '<path d="M38 37V19h24v18l15 22c17 35-70 35-54 0Z" fill="#b0dad9" stroke="#4f7488" stroke-width="4"/><path d="M29 63q24-13 42 0c10 21-53 22-42 0Z" fill="#ab79c8"/><path d="M39 22 36 8h28l-3 14Z" fill="#b28966" stroke="#745949" stroke-width="3"/><path d="M31 66q-2 8 8 11" stroke="#def6ef" stroke-width="3" stroke-linecap="round" fill="none"/>' + spark(52,64,8,'#fff4ce')
    case 'dragon-egg': return '<path d="M50 9c17 0 37 32 37 55A37 27 0 0 1 13 64C13 41 33 9 50 9Z" fill="#769795" stroke="#365a64" stroke-width="4"/><path d="m51 13 8 16-9 10-10-10 8-16m-8 16-13 7 9 14 14-11 14 11 9-14-14-7M36 50l-16 7 8 16 22-12 22 12 8-16-16-7M28 73l11 14 11-12 11 12 11-14" stroke="#bed1a5" stroke-width="2" fill="none"/><path d="M24 53Q30 30 43 20" stroke="#d9dbad" stroke-width="4" fill="none" stroke-linecap="round"/>'
    case 'mushroom': return '<path d="M43 53q2 18-5 31 10 9 24 0-8-13-5-31Z" fill="#ecd5ab" stroke="#9b775f" stroke-width="3"/><path d="M9 56Q16 22 50 17q33 4 41 39-40 15-82 0Z" fill="#d36b69" stroke="#8b4857" stroke-width="3"/><path d="M14 56q35 9 72 0" stroke="#f3af92" stroke-width="3" fill="none"/><g fill="#ffe6bb"><ellipse cx="43" cy="35" rx="8" ry="5"/><ellipse cx="67" cy="41" rx="6" ry="4"/><ellipse cx="28" cy="49" rx="5" ry="3"/></g>'
    case 'butterfly': return '<path d="M49 48Q28 9 12 17 1 30 20 50q-15 10 1 25 15 10 29-18 15 28 29 18 16-15 1-25 19-20 8-33-16-8-38 31Z" fill="#7eb9cc" stroke="#4b587e" stroke-width="4"/><path d="M47 51 23 29m23 25-22 11m29-14 24-22M54 54l22 11" fill="none" stroke="#c9ebdf" stroke-width="3"/><path d="M50 43v25m0-24-7-10m7 10 7-10" stroke="#414468" stroke-width="3" stroke-linecap="round"/>'
    case 'bridge': return '<path d="M11 62q38-40 78 0v14Q50 53 11 76Z" fill="#a97354" stroke="#59433d" stroke-width="4"/><path d="M14 58q36-34 72 0m-72 1V43m19 4V32m17 11V27m17 20V32m19 27V43M14 43q36-32 72 0" stroke="#edb784" stroke-width="3" stroke-linecap="round" fill="none"/><path d="m28 55 4 11m18-17v13m22-7-4 11" stroke="#724a43" stroke-width="2"/>'
    case 'cloud': return '<path d="M22 75Q1 73 8 52q4-11 19-11 4-19 23-22 19-1 26 20 17 2 18 19 1 16-16 18Z" fill="#cbd0ec" stroke="#787da5" stroke-width="3"/><path d="M13 59q8 12 22 8 13 5 25 0 13 3 27-9" stroke="#a9b1d5" fill="none" stroke-width="3"/>' + spark(68,22,7,'#ffe5ad')
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
