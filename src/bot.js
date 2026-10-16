import { RECIPES, INGREDIENTS, matchAssembly, matchRecipe } from './engine.js';
import {moveChef, recoverChef} from './movement.js';
import { createNavigator, nearestStation, speedMultiplier } from './navigation.js';
export const BOT_DIFFICULTIES={easy:{name:'Tập sự',speed:2.7,delay:.4},normal:{name:'Đầu bếp',speed:3.2,delay:.18},hard:{name:'Bếp trưởng',speed:3.8,delay:.04}};
export class ChefBot{
  constructor(stations,map,difficulty='normal'){this.stations=stations.filter(s=>s.team===undefined||s.team===1);this.map=map;this.settings=BOT_DIFFICULTIES[difficulty]||BOT_DIFFICULTIES.normal;this.navigator=createNavigator(this.stations);this.path=[];this.targetId=null;this.wait=0;this.recipe=null;this.label='Đang chọn món';}
  choose(game,p){
    const own=kind=>this.stations.find(s=>s.kind===kind&&(s.team===undefined||s.team===(p.team??0)));
    const task=(kind,work=false,label='')=>({station:own(kind),work,label});
    const candidates=game.orders.map(o=>RECIPES.find(r=>r.id===o.recipe));
    const contains=(recipe,items)=>items.every((item,i)=>items.slice(0,i+1).filter(x=>x===item).length<=recipe.ingredients.filter(x=>x===item).length);
    const matching=(predicate)=>candidates.find(predicate)||RECIPES.find(predicate);
    if(this.lastServed!==game.served){this.recipe=null;this.lastServed=game.served;}
    if(!p.item){
      if(game.board){const ingredient=game.board.ingredient,assemblyKeys=game.assembly?.components.map(c=>c.kind+':'+c.ingredient)||[],assemblyRecipe=game.assembly&&matching(r=>r.components&&r.components.includes('chopped:'+ingredient)&&!assemblyKeys.includes('chopped:'+ingredient)&&assemblyKeys.every(k=>r.components.includes(k)));this.recipe=ingredient==='beef'?RECIPES.find(r=>r.id==='burger'):ingredient==='lettuce'?RECIPES.find(r=>r.id==='salad'):
        assemblyRecipe||matching(r=>r.family==='soup'&&contains(r,[...game.pot.ingredients,ingredient]))||matching(r=>r.ingredients.includes(ingredient));}
      else if(game.pot.ingredients.length)this.recipe=matchRecipe(game.pot.ingredients)||matching(r=>r.family==='soup'&&contains(r,game.pot.ingredients));
      else if(game.assembly){const keys=game.assembly.components.map(c=>c.kind+':'+c.ingredient);this.recipe=matching(r=>r.components&&keys.every(k=>r.components.includes(k)));}
      else if(game.grill.item)this.recipe=RECIPES.find(r=>r.id==='burger');
    }
    if(!this.recipe)this.recipe=candidates[0];
    const fire=this.stations.find(s=>game.fires?.[s.id]);if(fire){if(p.item)return{station:own('trash'),label:'Dọn tay cứu bếp'};return{station:fire,work:true,label:'Dập lửa quầy bếp'}};
    const park=()=>({station:this.stations.find(s=>s.kind==='counter'&&!game.counters[s.id])||own('trash'),label:'Đặt đồ tạm để nhường quầy'});
    const source=ingredient=>({station:this.stations.find(s=>s.kind==='counter'&&game.counters[s.id]?.ingredient===ingredient)||this.stations.find(s=>s.ingredient===ingredient),label:`Lấy ${INGREDIENTS[ingredient].name.toLowerCase()}`});
    for(const kind of ['pot','grill'])if(game[kind].burnt){if(p.item)return task(p.item.kind==='plate'?'sink':'trash',false,'Dọn tay để dập lửa');return task(kind,true,'Dập lửa');}
    if(p.item?.kind==='meal')return task(game.orders.some(o=>o.recipe===p.item.recipe)?'serve':'trash',false,'Giao món');
    if(p.item?.kind==='plate'&&this.recipe.family!=='soup'&&game.assembly)return p.item.components?.length?park():task('sink',false,'Trả đĩa để tiếp tục món đang ráp');
    if(p.item?.kind==='plate')return task(this.recipe.family==='soup'?'pot':'assembly',false,this.recipe.family==='soup'?'Múc súp':'Đặt đĩa lên bàn ráp');
    if(p.item?.kind==='cooked'||p.item?.ingredient==='bun')return game.assembly?task('assembly',false,'Ráp món'):park();
    if(p.item?.kind==='chopped'&&(p.item.ingredient==='beef'&&game.grill.item||p.item.ingredient!=='beef'&&this.recipe.family!=='soup'&&!game.assembly))return park();
    if(p.item?.kind==='chopped')return task(p.item.ingredient==='beef'?'grill':this.recipe.family==='soup'?'pot':'assembly',false,'Thêm nguyên liệu');
    if(p.item?.kind==='raw'&&game.board)return park();
    if(p.item?.kind==='raw')return task('board',false,'Đặt lên thớt');
    if(game.board)return task('board',game.board.progress<1,game.board.progress<1?'Đang thái':'Lấy nguyên liệu');
    if(this.recipe.family==='soup'){
      if(game.pot.ready||game.pot.ingredients.length===2)return task(game.plates?'plates':'sink',!game.plates,game.plates?'Lấy đĩa':'Rửa đĩa');
      const ingredients=[...this.recipe.ingredients];for(const ingredient of game.pot.ingredients)ingredients.splice(ingredients.indexOf(ingredient),1);return source(ingredients[0]);
    }
    if(!game.assembly)return task(game.plates?'plates':'sink',!game.plates,game.plates?'Lấy đĩa ráp món':'Rửa đĩa');
    if(matchAssembly(game.assembly.components))return task('assembly',false,'Lấy món đã ráp');
    if(game.grill.ready)return task('grill',false,'Lấy thịt nướng');
    const present=game.assembly.components.map(c=>c.kind+':'+c.ingredient);
    const missing=this.recipe.components.filter(c=>!present.includes(c));
    const next=missing.find(c=>c!=='cooked:beef'||!game.grill.item);
    if(!next)return task('grill',false,'Chờ thịt nướng');
    const ingredient=next.split(':')[1];return source(ingredient);
  }
  update(game,p,dt,others=[]){
    p.moving=false;p.work=false;if(game.status!=='playing')return;
    if(this.stations.some(s=>s.dynamic)||this.map.moving){this.navRefresh=(this.navRefresh||0)-dt;if(this.navRefresh<=0){this.navigator=createNavigator(this.stations);this.path=[];this.navRefresh=.75}}
    recoverChef(p,this.stations,others);this.repathWait=Math.max(0,(this.repathWait||0)-dt);
    this.wait=Math.max(0,this.wait-dt);const task=this.choose(game,p);this.label=task.label;if(!task.station)return;
    if(nearestStation(p,this.stations)?.id===task.station.id&&Math.hypot(p.x-task.station.x,p.z-task.station.z)<1.55){
      this.targetId=null;this.path=[];p.dir=Math.atan2(task.station.x-p.x,task.station.z-p.z);
      if(task.work){p.work=game.work(p,task.station,dt);return;}
      if(task.station.kind==='pot'&&p.item?.kind==='plate'&&!game.pot.ready)return;
      if(task.station.kind==='grill'&&!p.item&&game.grill.item&&!game.grill.ready)return;
      if(this.wait===0){const discardedMeal=task.station.kind==='trash'&&p.item?.kind==='meal';if(game.action(p,task.station)&&discardedMeal)this.recipe=null;this.wait=this.settings.delay;}return;
    }
    if(this.targetId!==task.station.id||!this.path.length){this.targetId=task.station.id;if(this.repathWait>0)return;this.path=this.navigator.pathTo(p,task.station,others)||[];this.repathWait=.3;if(!this.path.length){this.label='Chờ lối trống';return;}}
    let distance=this.settings.speed*speedMultiplier(p,this.map)*dt;
    while(distance>0&&this.path.length){const waypoint=this.path[0],dx=waypoint.x-p.x,dz=waypoint.z-p.z,length=Math.hypot(dx,dz);if(length<.015){this.path.shift();continue}const amount=Math.min(length,distance),moved=moveChef(p,dx/length*amount,dz/length*amount,this.stations,others);p.dir=Math.atan2(dx,dz);p.moving ||= moved.distance>1e-5;distance-=amount;if(moved.hitChef||moved.hitWall){this.path=[];this.label='Đang tìm đường vòng';break}if(amount===length)this.path.shift();}
  }
}
