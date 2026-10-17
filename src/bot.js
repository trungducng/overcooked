import { chefKey, RECIPES, INGREDIENTS, matchAssembly, matchRecipe } from './engine.js';
import {moveChef, recoverChef} from './movement.js';
import { createNavigator, nearestStation, speedMultiplier } from './navigation.js';
export const BOT_DIFFICULTIES={easy:{name:'Tập sự',speed:2.7,delay:.4},normal:{name:'Đầu bếp',speed:3.2,delay:.18},hard:{name:'Bếp trưởng',speed:3.8,delay:.04}};
export class ChefBot{
  constructor(stations,map,difficulty='normal'){this.stations=Object.assign(stations.filter(s=>s.team===undefined||s.team===1),{bounds:stations.bounds});this.map=map;this.settings=BOT_DIFFICULTIES[difficulty]||BOT_DIFFICULTIES.normal;this.navigator=createNavigator(this.stations);this.path=[];this.targetId=null;this.wait=0;this.recipe=null;this.label='Đang chọn món';}
  reserved(game,p,s){
    if(!s||!['board','pot','grill','assembly','counter'].includes(s.kind))return false;
    const claim=game.claims?.[s.id];if(claim&&claim.remaining>0&&claim.owner!==chefKey(p))return true;
    return (this.others||[]).some(h=>h.active!==false&&!h.bot&&Math.hypot(h.x-s.x,h.z-s.z)<1.85&&nearestStation(h,this.stations)?.id===s.id);
  }
  choose(game,p){
    const proposed=this.plan(game,p);if(!this.reserved(game,p,proposed.station))return proposed;
    if(p.item){const free=this.stations.find(s=>s.kind==='counter'&&!game.counters[s.id]&&!this.reserved(game,p,s));return {station:free||this.stations.find(s=>s.kind==='trash'),label:'Cất đồ dự phòng · nhường quầy cho đầu bếp khác'};}
    const sink=this.stations.find(s=>s.kind==='sink');if(game.dirty&&!(this.others||[]).some(h=>h.active!==false&&h.work&&nearestStation(h,this.stations)?.id===sink?.id))return {station:sink,work:true,label:'Rửa đĩa · nhường món bạn đang làm'};
    return {station:null,label:'Nhường đồ đang làm · chờ việc trống'};
  }
  plan(game,p){
    const own=kind=>this.stations.find(s=>s.kind===kind&&(s.team===undefined||s.team===(p.team??0)));
    const task=(kind,work=false,label='')=>({station:own(kind),work,label});
    const candidates=game.orders.map(o=>RECIPES.find(r=>r.id===o.recipe));
    const contains=(recipe,items)=>items.every((item,i)=>items.slice(0,i+1).filter(x=>x===item).length<=recipe.ingredients.filter(x=>x===item).length);
    const matching=(predicate)=>this.recipe&&candidates.some(r=>r.id===this.recipe.id)&&predicate(this.recipe)?this.recipe:candidates.find(predicate)||RECIPES.find(predicate);
    if(this.lastServed!==game.served){this.recipe=null;this.lastServed=game.served;}
    if(!p.item){
      if(game.board){const ingredient=game.board.ingredient,assemblyKeys=game.assembly?.components.map(c=>c.kind+':'+c.ingredient)||[],assemblyRecipe=game.assembly&&matching(r=>r.components&&r.components.includes('chopped:'+ingredient)&&!assemblyKeys.includes('chopped:'+ingredient)&&assemblyKeys.every(k=>r.components.includes(k)));this.recipe=ingredient==='beef'?matching(r=>r.components?.includes('cooked:beef')):ingredient==='lettuce'?matching(r=>r.components?.includes('chopped:lettuce')):
        assemblyRecipe||matching(r=>r.family==='soup'&&contains(r,[...game.pot.ingredients,ingredient]))||matching(r=>r.ingredients.includes(ingredient));}
      else if(game.pot.ingredients.length&&game.pot.ingredients[0]!=='rice')this.recipe=matchRecipe(game.pot.ingredients)||matching(r=>r.family==='soup'&&contains(r,game.pot.ingredients));
      else if(game.assembly){const keys=game.assembly.components.map(c=>c.kind+':'+c.ingredient);this.recipe=matching(r=>r.components&&keys.every(k=>r.components.includes(k)));}
      else if(game.grill.item)this.recipe=matching(r=>r.components?.includes('cooked:beef'));
    }
    if(!this.recipe)this.recipe=candidates[0];
    const fire=this.stations.find(s=>game.fires?.[s.id]);if(fire){if(p.item)return{station:own('trash'),label:'Dọn tay cứu bếp'};return{station:fire,work:true,label:'Dập lửa quầy bếp'}};
    if(!p.item){const stale=this.stations.find(s=>s.belt&&game.counters[s.id]?.kind==='meal'&&(game.counters[s.id].deliveryTeam??0)===(p.team??0)&&!game.orders.some(o=>o.recipe===game.counters[s.id].recipe)&&!this.reserved(game,p,s));if(stale)return {station:stale,label:'Thu món hết đơn · trả đĩa về bồn rửa'};}
    const park=()=>({station:this.stations.find(s=>s.kind==='counter'&&!game.counters[s.id])||own('trash'),label:'Đặt đồ tạm để nhường quầy'});
    const source=ingredient=>({station:this.stations.find(s=>s.kind==='counter'&&game.counters[s.id]?.ingredient===ingredient&&!this.reserved(game,p,s))||this.stations.find(s=>s.ingredient===ingredient),label:`Lấy ${INGREDIENTS[ingredient].name.toLowerCase()}`});
    for(const kind of ['pot','grill'])if(game[kind].burnt){if(p.item)return task(p.item.kind==='plate'?'sink':'trash',false,'Dọn tay để dập lửa');return task(kind,true,'Dập lửa');}
    if(p.item?.kind==='meal'){const belt=this.stations.find(s=>s.belt&&!game.counters[s.id]);return game.orders.some(o=>o.recipe===p.item.recipe)?{station:this.map.sushi&&belt?belt:own('serve'),label:this.map.sushi?'Đặt sushi lên băng chuyền phục vụ':'Giao món'}:task('trash',false,'Dọn món không còn đơn');}
    if(p.item?.kind==='plate'&&this.recipe.family!=='soup'&&game.assembly)return p.item.components?.length?park():task('sink',false,'Trả đĩa để tiếp tục món đang ráp');
    if(p.item?.kind==='plate')return task(this.recipe.family==='soup'?'pot':'assembly',false,this.recipe.family==='soup'?'Múc súp':'Đặt đĩa lên bàn ráp');
    if(p.item?.kind==='raw'&&p.item.ingredient==='rice')return game.pot.ingredients.length?park():task('pot',false,'Nấu cơm cho sushi');
    if(p.item?.kind==='cooked'||['bun','nori'].includes(p.item?.ingredient))return game.assembly?task('assembly',false,'Ráp món'):park();
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
    if(matchAssembly(game.assembly.components)?.id===this.recipe.id)return task('assembly',false,'Lấy món đã ráp');
    if(game.pot.ready&&game.pot.ingredients[0]==='rice'&&!game.assembly.components.some(c=>c.ingredient==='rice'))return task('pot',false,'Lấy cơm chín');
    if(game.grill.ready)return task('grill',false,'Lấy thịt nướng');
    const present=game.assembly.components.map(c=>c.kind+':'+c.ingredient);
    const missing=this.recipe.components.filter(c=>!present.includes(c));
    const next=missing.find(c=>(c!=='cooked:beef'||!game.grill.item)&&(c!=='cooked:rice'||!game.pot.ingredients.length));
    if(!next)return task(game.pot.ingredients[0]==='rice'?'pot':'grill',false,'Chờ cơm / thịt chín');
    const ingredient=next.split(':')[1];return source(ingredient);
  }
  update(game,p,dt,others=[]){
    p.bot=true;this.others=others;p.moving=false;p.work=false;if(game.status!=='playing')return;
    if(this.stations.some(s=>s.dynamic)||this.map.moving){this.navRefresh=(this.navRefresh||0)-dt;if(this.navRefresh<=0){this.navigator=createNavigator(this.stations);this.path=[];this.navRefresh=.75}}
    recoverChef(p,this.stations,others);this.repathWait=Math.max(0,(this.repathWait||0)-dt);
    this.wait=Math.max(0,this.wait-dt);const task=this.choose(game,p);this.label=task.label;if(!task.station)return;
    if(nearestStation(p,this.stations)?.id===task.station.id&&Math.hypot(p.x-task.station.x,p.z-task.station.z)<1.55){
      this.targetId=null;this.path=[];p.dir=Math.atan2(task.station.x-p.x,task.station.z-p.z);
      if(task.work){p.work=game.work(p,task.station,dt);return;}
      if(task.station.kind==='pot'&&game.pot.ingredients[0]==='rice'&&!game.pot.ready)return;
      if(task.station.kind==='pot'&&p.item?.kind==='plate'&&!game.pot.ready)return;
      if(task.station.kind==='grill'&&!p.item&&game.grill.item&&!game.grill.ready)return;
      if(this.wait===0){const discardedMeal=task.station.kind==='trash'&&p.item?.kind==='meal';if(game.action(p,task.station)&&discardedMeal)this.recipe=null;this.wait=this.settings.delay;}return;
    }
    if(this.targetId!==task.station.id||!this.path.length){this.targetId=task.station.id;if(this.repathWait>0)return;this.path=this.navigator.pathTo(p,task.station,others)||[];this.repathWait=.3;if(!this.path.length){this.label='Chờ lối trống';return;}}
    let distance=this.settings.speed*speedMultiplier(p,this.map)*dt;
    while(distance>0&&this.path.length){const waypoint=this.path[0],dx=waypoint.x-p.x,dz=waypoint.z-p.z,length=Math.hypot(dx,dz);if(length<.015){this.path.shift();continue}const amount=Math.min(length,distance),moved=moveChef(p,dx/length*amount,dz/length*amount,this.stations,others);p.dir=Math.atan2(dx,dz);p.moving ||= moved.distance>1e-5;distance-=amount;if(moved.hitChef||moved.hitWall){this.path=[];this.label='Đang tìm đường vòng';break}if(amount===length)this.path.shift();}
  }
}
