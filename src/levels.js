import { STATIONS } from './engine.js';

export const MODES = {
  solo: { name: 'Một mình', icon: '♨', description: 'Chinh phục 10 màn và săn đủ 3 sao.' },
  assist: {name:'Cùng phụ bếp',icon:'✿',description:'Bạn và bot chung điểm. Bot nhận đồ, nấu, rửa và nhường quầy.'},
  coop: { name: 'Đồng đội', icon: '♡', description: '2–4 người, chung căn bếp và chung điểm.' },
  pvp: { name: 'Đấu tay đôi', icon: '⚔', description: 'Hai người cùng bàn phím. Chung một bếp, tranh đơn và đua điểm!' },
  bot: { name: 'Đấu với bot', icon: '✦', description: 'So tài ngay trong cùng bếp. Dụng cụ và nguyên liệu dùng chung.' },
};
export const MAPS = [
  { id: 'sunny', name: 'Đại sảnh Ánh Lửa', short: 'LANTERN HALL', icon: '✦', subtitle: 'Đại tiệc trên vực ngọc. Chung bếp, chung cuộc vui.', background: '#dce4d5', floor: [0xeee2c5, 0x709c8c], wall: 0xe8c184, cabinet: 0x514356, accent: '#789a83', hazard: [], spawn: [{x:0,z:1.6},{x:-3,z:1.6}] },
  { id: 'harbor', name: 'Bến cảng gió lộng', short: 'HARBOR KITCHEN', icon: '⚓', subtitle: 'Lối giữa thông thoáng. Cẩn thận sàn ướt!', background: '#cbdfe2', floor: [0xede3c9, 0x679bab], wall: 0xb3cfd1, cabinet: 0x306f94, accent: '#678ca4', hazard: [{x:0,z:0,rx:.85,rz:1.1}], spawn: [{x:0,z:1.5},{x:-3.8,z:1.5}] },
  { id: 'market', name: 'Chợ đêm đèn lồng', short: 'LANTERN MARKET', icon: '☾', subtitle: 'Bếp đổi phía, đảo lệch và lối đi zích zắc.', background: '#cec1d0', floor: [0xefdbb4, 0xa66d78], wall: 0xd39e88, cabinet: 0x93475d, accent: '#9e737d', hazard: [], spawn: [{x:0,z:-1.6},{x:3.8,z:1.5}] },
];
export const ROOM_SCALE={x:1.25,z:1.4};
for(const map of MAPS){for(const p of map.spawn){p.x*=ROOM_SCALE.x;p.z*=ROOM_SCALE.z}for(const h of map.hazard){h.x*=ROOM_SCALE.x;h.z*=ROOM_SCALE.z;h.rx*=ROOM_SCALE.x;h.rz*=ROOM_SCALE.z}}
export const LEVELS = [
  { name: 'Làm nóng bếp', tag: 'THƯ THẢ', duration: 240, patience: 110, cookTime: 10, burnAfter: 25, chopTime: 2, goals: [150,350,600], recipeOffset: 0, menu:['tomato','salad','burger','mushroom'] },
  { name: 'Giờ cao điểm', tag: 'NHỘN NHỊP', duration: 210, patience: 88, cookTime: 9, burnAfter: 20, chopTime: 2.2, goals: [180,400,650], recipeOffset: 0, menu:['salad','burger','garden','onion','burger'] },
  { name: 'Bếp trưởng', tag: 'THỬ THÁCH', duration: 180, patience: 72, cookTime: 8, burnAfter: 16, chopTime: 2.4, goals: [200,420,680], recipeOffset: 0, menu:['burger','garden','salad','mushroom','burger','onion'] },
];
export function getMap(id) { return MAPS.find(map=>map.id===id)||MAPS[0]; }
export function getStations(mapId='sunny', versus=false) {
  const stations=STATIONS.map(s=>({...s}));
  const set=(id,x,z)=>Object.assign(stations.find(s=>s.id===id),{x,z});
  if(mapId==='harbor'){
    set('board',-2.25,-3);set('onion',4.5,-3);set('pot',2.25,-3);
    set('plates',2.25,3);set('serve',4.5,3);
    set('counter1',0,0);
  }
  if(mapId==='market'){
    set('tomato',4.5,-3);set('onion',2.25,-3);set('board',-2.25,-3);set('pot',-4.5,-3);
    set('serve',-4.5,3);set('sink',4.5,3);
    set('counter0',-2.25,.2);set('counter1',0,1.6);set('counter2',2.25,.2);
  }
  for(const station of stations){station.x*=ROOM_SCALE.x;station.z*=ROOM_SCALE.z}
  Object.assign(stations.find(s=>s.id==='counter0'),{id:'lettuce',kind:'source',ingredient:'lettuce'});
  Object.assign(stations.find(s=>s.id==='counter2'),{id:'beef',kind:'source',ingredient:'beef'});
  Object.assign(stations.find(s=>s.id==='trash'),{x:6.5,z:-1.3});
  stations.push({id:'bun',kind:'source',ingredient:'bun',x:-6.5,z:1.3},{id:'grill',kind:'grill',x:6.5,z:1.3},{id:'assembly',kind:'assembly',x:0,z:4.2});

  return stations;
}
export const isVersus = mode=>mode==='pvp'||mode==='bot';

export const stationsForTeam=(stations,team)=>Object.assign(stations.filter(s=>s.team===undefined||s.team===team),{bounds:stations.bounds});
