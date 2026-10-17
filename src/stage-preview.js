import {stageStations} from './stages.js';
export function stagePreview(stage){
 const palette={source:'#79a276',board:'#d3ab62',pot:'#cf7755',grill:'#a56051',sink:'#72b3bf',plates:'#ede7c6',serve:'#e8b755',assembly:'#ac8fbe',counter:'#9d8969',obstacle:'#47566b',trash:'#596567'};
 const boxes=stageStations(stage).map(s=>{const w=(s.width??(s.kind==='trash'?.9:2.17))*7.5,h=(s.depth??(s.kind==='trash'?.9:1.43))*7.5,x=70+s.x*7.5-w/2,y=48+s.z*7.5-h/2;return`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="1" fill="${palette[s.kind]}" ${s.dynamic?'stroke="#f6c46c" stroke-dasharray="2 1"':''}/>${s.belt?`<path d="M${x+4} ${y+3}l3 3-3 3" stroke="#ffe5a0" fill="none"/>`:''}`}).join('');
 return `<svg viewBox="0 0 140 96" aria-hidden="true"><rect x="6" y="4" width="128" height="88" rx="5" fill="${stage.style.accent}" opacity=".16"/><rect x="10" y="6" width="120" height="84" fill="#25374a"/>${boxes}</svg>`;
}
