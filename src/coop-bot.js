import {fireTask} from './fire-safety.js';
import {ChefBot} from './bot.js';
import {RECIPES,matchRecipe} from './engine.js';
import {nearestStation} from './navigation.js';
export class CoopBot extends ChefBot {
 constructor(stations,map,difficulty,stage){super(stations,map,difficulty);this.stage=stage;this.humans=[];}
 choose(game,p){
  const safety=fireTask(game,p,this.stage.roles?this.stations.filter(s=>s.x>0):this.stations);if(safety)return safety;
  const station=kind=>this.stations.find(s=>s.kind===kind),task=(s,work,label)=>({station:s,work,label});
  // The relay has a hard preparation/cooking division. The helper stays on the
  // cooking side and consumes only ingredients actually passed across the hatch.
  if(this.stage.roles){
   const pass=this.stations.find(s=>s.id==='counter1');
   if(game.pot.burnt)return p.item?task(station('trash'),false,'Dọn tay cứu nồi'):task(station('pot'),true,'Dập lửa');
   const fire=this.stations.find(s=>game.fires[s.id]&&s.x>0);if(fire)return p.item?task(station('trash'),false,'Dọn tay cứu bếp'):task(fire,true,'Dập lửa quầy');
   if(p.item?.kind==='meal')return task(station('serve'),false,'Giao món đồng đội');
   if(p.item?.kind==='plate')return task(station('pot'),false,'Đợi súp chín / múc súp');
   if(p.item?.kind==='chopped')return task(station('pot'),false,'Nấu nguyên liệu đồng đội chuyển');
   if(p.item)return task(station('trash'),false,'Dọn nguyên liệu không dùng được');
   if(game.pot.ready)return task(station(game.plates?'plates':'sink'),!game.plates,'Chuẩn bị đĩa');
   const incoming=game.counters[pass.id];if(incoming&&incoming.kind==='chopped'){
    if(game.pot.ingredients.length<2&&(game.pot.ingredients.length===0||matchRecipe([...game.pot.ingredients,incoming.ingredient])))return task(pass,false,'Nhận đồ qua quầy chung');
   }
   if(game.dirty)return task(station('sink'),true,'Rửa đĩa khi đợi đồng đội');
   return task(null,false,'Đầu bếp nấu · chờ nguyên liệu đã thái ở quầy giữa');
  }
  const proposed=super.choose(game,p);if(!proposed.station)return proposed;
  const reserved=this.humans.some(h=>h.active!==false&&nearestStation(h,this.stations)?.id===proposed.station.id&&(h.work||h.item)&&Math.hypot(h.x-proposed.station.x,h.z-proposed.station.z)<1.7);
  if(!reserved)return proposed;
  if(p.item){const free=this.stations.find(s=>s.kind==='counter'&&!game.counters[s.id]&&!this.humans.some(h=>Math.hypot(h.x-s.x,h.z-s.z)<1.8));return task(free,false,'Đặt nguyên liệu dự phòng, nhường quầy cho bạn');}
  if(game.dirty)return task(station('sink'),true,'Rửa đĩa · bạn tiếp tục sơ chế');
  if(game.pot.ready&&game.plates)return task(station('plates'),false,'Lấy đĩa múc món đồng đội nấu');
  if(game.grill.ready)return task(station('grill'),false,'Cứu thịt đã chín khỏi cháy');
  return task(null,false,'Nhường quầy · sẵn sàng tiếp việc');
 }
 update(game,p,dt,others=[]){this.humans=others;super.update(game,p,dt,others)}
}
