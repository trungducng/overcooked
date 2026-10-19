export const isBurning=(game,s)=>!!(game.fires?.[s.id]||(['pot','grill'].includes(s.kind)&&game[s.kind].burnt));
// Both teammate and rival bots use the same physical rack / floor / counter tools.
export function fireTask(game,p,stations){
 const fires=stations.filter(s=>isBurning(game,s)).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z));
 if(p.item?.kind==='extinguisher'){
  if(fires.length)return {station:fires[0],work:true,label:'Dùng bình cứu hoả dập lửa'};
  const rack=stations.find(s=>s.kind==='extinguisher'&&!game.counters[s.id]);
  return {station:rack||stations.find(s=>s.kind==='counter'&&!s.belt&&!game.counters[s.id]),label:'Trả bình cứu hoả'};
 }
 if(!fires.length)return null;
 if(p.item)return {station:stations.find(s=>s.kind==='counter'&&!s.belt&&!game.counters[s.id])||stations.find(s=>s.kind==='trash'),label:'Đặt đồ xuống để lấy bình cứu hoả'};
 const tool=stations.filter(s=>game.counters[s.id]?.kind==='extinguisher').sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
 return {station:tool,work:false,label:tool?'Lấy bình cứu hoả':'Chờ bình cứu hoả · nhường đường'};
}
