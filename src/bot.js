import { RECIPES, INGREDIENTS } from './engine.js';
import { createNavigator, nearestStation, collides, speedMultiplier } from './navigation.js';
export const BOT_DIFFICULTIES={easy:{name:'Tập sự',speed:2.7,delay:.4},normal:{name:'Đầu bếp',speed:3.2,delay:.18},hard:{name:'Bếp trưởng',speed:3.8,delay:.04}};
export class ChefBot{
  constructor(stations,map,difficulty='normal'){this.stations=stations;this.map=map;this.settings=BOT_DIFFICULTIES[difficulty]||BOT_DIFFICULTIES.normal;this.navigator=createNavigator(stations);this.path=[];this.targetId=null;this.wait=0;this.recipe=null;this.label='Đang chọn món';}
  choose(game,p){
    const own=kind=>this.stations.find(s=>s.kind===kind&&(s.team===undefined||s.team===(p.team??0)));
    const task=(kind,work=false,label='')=>({station:own(kind),work,label});
    if(game.pot.burnt){if(p.item)return task(p.item.kind==='plate'?'sink':'trash',false,'Dọn tay để dập lửa');return task('pot',true,'Dập lửa');}
    if(p.item?.kind==='meal')return task(game.orders.some(o=>o.recipe===p.item.recipe)?'serve':'trash',false,'Giao món');
    if(p.item?.kind==='plate')return task('pot',false,'Chờ súp / múc súp');
    if(p.item?.kind==='chopped')return task('pot',false,'Cho vào nồi');
    if(p.item?.kind==='raw')return task('board',false,'Đặt lên thớt');
    if(game.board)return task('board',game.board.progress<1,game.board.progress<1?'Đang thái':'Lấy nguyên liệu');
    if(game.pot.ready||game.pot.ingredients.length===2){if(!game.plates)return task('sink',true,'Rửa đĩa');return task('plates',false,'Lấy đĩa sạch');}
    const candidates=game.orders.map(o=>RECIPES.find(r=>r.id===o.recipe));
    if(!this.recipe||game.pot.ingredients.length===0)this.recipe=candidates[0];
    if(game.pot.ingredients.length&&!this.recipe.ingredients.includes(game.pot.ingredients[0]))this.recipe=candidates.find(r=>r.ingredients.includes(game.pot.ingredients[0]))||RECIPES.find(r=>r.ingredients.includes(game.pot.ingredients[0]));
    const ingredients=[...this.recipe.ingredients];for(const ingredient of game.pot.ingredients)ingredients.splice(ingredients.indexOf(ingredient),1);
    return {station:this.stations.find(s=>s.ingredient===ingredients[0]),work:false,label:`Lấy ${INGREDIENTS[ingredients[0]]?.name.toLowerCase()}`};
  }
  update(game,p,dt){
    p.moving=false;p.work=false;if(game.status!=='playing')return;
    this.wait=Math.max(0,this.wait-dt);const task=this.choose(game,p);this.label=task.label;if(!task.station)return;
    if(nearestStation(p,this.stations)?.id===task.station.id&&Math.hypot(p.x-task.station.x,p.z-task.station.z)<1.55){
      this.targetId=null;this.path=[];p.dir=Math.atan2(task.station.x-p.x,task.station.z-p.z);
      if(task.work){p.work=game.work(p,task.station,dt);return;}
      if(task.station.kind==='pot'&&p.item?.kind==='plate'&&!game.pot.ready)return;
      if(this.wait===0){game.action(p,task.station);this.wait=this.settings.delay;}return;
    }
    if(this.targetId!==task.station.id||!this.path.length){this.targetId=task.station.id;this.path=this.navigator.pathTo(p,task.station)||[];if(!this.path.length)return;}
    let distance=this.settings.speed*speedMultiplier(p,this.map)*dt;
    while(distance>0&&this.path.length){const waypoint=this.path[0],dx=waypoint.x-p.x,dz=waypoint.z-p.z,length=Math.hypot(dx,dz);if(length<.015){this.path.shift();continue}const amount=Math.min(length,distance),x=p.x+dx/length*amount,z=p.z+dz/length*amount;if(collides(x,z,this.stations)){this.path=[];break}p.dir=Math.atan2(dx,dz);p.x=x;p.z=z;p.moving=true;distance-=amount;if(amount===length)this.path.shift();}
  }
}
