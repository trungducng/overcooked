import { RECIPES, INGREDIENTS, matchAssembly } from './engine.js';
import { createNavigator, nearestStation, collides, speedMultiplier } from './navigation.js';
export const BOT_DIFFICULTIES={easy:{name:'Tập sự',speed:2.7,delay:.4},normal:{name:'Đầu bếp',speed:3.2,delay:.18},hard:{name:'Bếp trưởng',speed:3.8,delay:.04}};
export class ChefBot{
  constructor(stations,map,difficulty='normal'){this.stations=stations.filter(s=>s.team===undefined||s.team===1);this.map=map;this.settings=BOT_DIFFICULTIES[difficulty]||BOT_DIFFICULTIES.normal;this.navigator=createNavigator(this.stations);this.path=[];this.targetId=null;this.wait=0;this.recipe=null;this.label='Đang chọn món';}
  choose(game,p){
    const own=kind=>this.stations.find(s=>s.kind===kind&&(s.team===undefined||s.team===(p.team??0)));
    const task=(kind,work=false,label='')=>({station:own(kind),work,label});
    if(this.lastServed!==game.served){this.recipe=null;this.lastServed=game.served;}
    if(!this.recipe)this.recipe=RECIPES.find(r=>r.id===game.orders[0].recipe);
    for(const kind of ['pot','grill'])if(game[kind].burnt){if(p.item)return task(p.item.kind==='plate'?'sink':'trash',false,'Dọn tay để dập lửa');return task(kind,true,'Dập lửa');}
    if(p.item?.kind==='meal')return task(game.orders.some(o=>o.recipe===p.item.recipe)?'serve':'trash',false,'Giao món');
    if(p.item?.kind==='plate')return task(this.recipe.family==='soup'?'pot':'assembly',false,this.recipe.family==='soup'?'Múc súp':'Đặt đĩa lên bàn ráp');
    if(p.item?.kind==='cooked'||p.item?.ingredient==='bun')return task('assembly',false,'Ráp món');
    if(p.item?.kind==='chopped')return task(p.item.ingredient==='beef'?'grill':this.recipe.family==='soup'?'pot':'assembly',false,'Thêm nguyên liệu');
    if(p.item?.kind==='raw')return task('board',false,'Đặt lên thớt');
    if(game.board)return task('board',game.board.progress<1,game.board.progress<1?'Đang thái':'Lấy nguyên liệu');
    if(this.recipe.family==='soup'){
      if(game.pot.ready||game.pot.ingredients.length===2)return task(game.plates?'plates':'sink',!game.plates,game.plates?'Lấy đĩa':'Rửa đĩa');
      const ingredient=this.recipe.ingredients[game.pot.ingredients.length];return {station:this.stations.find(s=>s.ingredient===ingredient),label:`Lấy ${INGREDIENTS[ingredient].name.toLowerCase()}`};
    }
    if(!game.assembly)return task(game.plates?'plates':'sink',!game.plates,game.plates?'Lấy đĩa ráp món':'Rửa đĩa');
    if(matchAssembly(game.assembly.components))return task('assembly',false,'Lấy món đã ráp');
    if(game.grill.ready)return task('grill',false,'Lấy thịt nướng');
    const present=game.assembly.components.map(c=>c.kind+':'+c.ingredient);
    const missing=this.recipe.components.filter(c=>!present.includes(c));
    const next=missing.find(c=>c!=='cooked:beef'||!game.grill.item);
    if(!next)return task('grill',false,'Chờ thịt nướng');
    const ingredient=next.split(':')[1];return{station:this.stations.find(s=>s.ingredient===ingredient),label:`Lấy ${INGREDIENTS[ingredient].name.toLowerCase()}`};
  }
  update(game,p,dt){
    p.moving=false;p.work=false;if(game.status!=='playing')return;
    this.wait=Math.max(0,this.wait-dt);const task=this.choose(game,p);this.label=task.label;if(!task.station)return;
    if(nearestStation(p,this.stations)?.id===task.station.id&&Math.hypot(p.x-task.station.x,p.z-task.station.z)<1.55){
      this.targetId=null;this.path=[];p.dir=Math.atan2(task.station.x-p.x,task.station.z-p.z);
      if(task.work){p.work=game.work(p,task.station,dt);return;}
      if(task.station.kind==='pot'&&p.item?.kind==='plate'&&!game.pot.ready)return;
      if(task.station.kind==='grill'&&!p.item&&game.grill.item&&!game.grill.ready)return;
      if(this.wait===0){const discardedMeal=task.station.kind==='trash'&&p.item?.kind==='meal';if(game.action(p,task.station)&&discardedMeal)this.recipe=null;this.wait=this.settings.delay;}return;
    }
    if(this.targetId!==task.station.id||!this.path.length){this.targetId=task.station.id;this.path=this.navigator.pathTo(p,task.station)||[];if(!this.path.length)return;}
    let distance=this.settings.speed*speedMultiplier(p,this.map)*dt;
    while(distance>0&&this.path.length){const waypoint=this.path[0],dx=waypoint.x-p.x,dz=waypoint.z-p.z,length=Math.hypot(dx,dz);if(length<.015){this.path.shift();continue}const amount=Math.min(length,distance),x=p.x+dx/length*amount,z=p.z+dz/length*amount;if(collides(x,z,this.stations)){this.path=[];break}p.dir=Math.atan2(dx,dz);p.x=x;p.z=z;p.moving=true;distance-=amount;if(amount===length)this.path.shift();}
  }
}
