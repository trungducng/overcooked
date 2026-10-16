export const CONTROLS=[
 {up:'KeyW',left:'KeyA',down:'KeyS',right:'KeyD',interact:'KeyE',work:'Space',dash:'ShiftLeft',drop:'KeyQ',throw:'KeyF',label:'WASD · E · Space · Shift · Q · F'},
 {up:'ArrowUp',left:'ArrowLeft',down:'ArrowDown',right:'ArrowRight',interact:'Enter',work:'Slash',dash:'ShiftRight',drop:'Delete',throw:'Period',label:'↑↓←→ · Enter · / · Shift phải · Delete · .'},
 {up:'KeyI',left:'KeyJ',down:'KeyK',right:'KeyL',interact:'KeyO',work:'KeyU',dash:'KeyP',drop:'KeyN',throw:'KeyM',label:'IJKL · O · U · P · N · M'},
 {up:'Numpad8',left:'Numpad4',down:'Numpad5',right:'Numpad6',interact:'NumpadAdd',work:'Numpad0',dash:'NumpadDecimal',drop:'NumpadSubtract',throw:'NumpadMultiply',label:'Num 8456 · + · 0 · dấu chấm · − · ×'},
];
const cleanAxis=x=>Math.abs(Number(x)||0)<.18?0:Math.max(-1,Math.min(1,Number(x)||0));
export function readInput(index,keys,pad){const c=CONTROLS[index],pressed=n=>!!pad?.buttons?.[n]?.pressed;
 let x=Number(keys.has(c.right))-Number(keys.has(c.left)),z=Number(keys.has(c.down))-Number(keys.has(c.up));
 if(pad?.connected!==false){x+=cleanAxis(pad?.axes?.[0]);z+=cleanAxis(pad?.axes?.[1]);}
 const length=Math.hypot(x,z);if(length>1){x/=length;z/=length;}
 return {x,z,work:keys.has(c.work)||pressed(2),interact:pressed(0),throw:pressed(1),drop:pressed(3),dash:pressed(5),pause:pressed(9)};
}
export function inputEdges(current,previous={}){return ['interact','throw','drop','dash','pause'].filter(key=>current[key]&&!previous[key])}
export function activeSeats(options,stage){return options.mode==='coop'?Math.max(2,Math.min(4,Math.floor(options.players)||2)):options.mode==='solo'?(stage.roles?2:1):2}
