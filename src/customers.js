import {RECIPES} from './engine.js';
export const DINING_SEATS=[
 {x:-9.5,z:-8,beltIndex:0,name:'Linh'}, {x:-1.9,z:-8,beltIndex:2,name:'An'}, {x:5.7,z:-8,beltIndex:3,name:'Minh'},
 {x:9.5,z:8,beltIndex:6,name:'Mai'}, {x:1.9,z:8,beltIndex:8,name:'Nam'}, {x:-5.7,z:8,beltIndex:9,name:'Hà'},
];
export class CustomerService{
 constructor(stage,stations){this.stage=stage;this.stations=stations;this.time=0;this.sequence=0;this.nextArrival=0;this.nextSeat=0;this.seats=DINING_SEATS.map((s,id)=>({...s,id,status:'empty',phase:0,order:null}));this.arrive();}
 get orders(){return this.seats.filter(s=>s.status==='seated').map(s=>s.order).sort((a,b)=>a.id-b.id)}
 arrive(){if(this.seats.filter(s=>s.status==='arriving'||s.status==='seated').length>=3)return;let seat;for(let i=0;i<this.seats.length;i++){const s=this.seats[(this.nextSeat+i)%this.seats.length];if(s.status==='empty'){seat=s;break}}if(!seat)return;seat.status='arriving';seat.phase=0;seat.order=null;this.nextSeat=(seat.id+1)%this.seats.length;}
 bind(games){this.games=games;for(const g of games){g.customerService=this;Object.defineProperty(g,'orders',{configurable:true,enumerable:true,get:()=>this.orders,set:()=>{}});}}
 tick(dt){this.time+=dt;this.nextArrival-=dt;if(this.nextArrival<=0){this.arrive();this.nextArrival=6;}
  for(const s of this.seats){s.phase+=dt;if(s.status==='arriving'&&s.phase>=3){s.status='seated';s.phase=0;const recipe=this.stage.menu[this.sequence%this.stage.menu.length];s.order={id:++this.sequence,recipe,time:this.stage.patience,total:this.stage.patience,seatId:s.id,seatLabel:`B${s.id+1} · ${s.name}`};}
   else if(s.status==='seated'){s.order.time=Math.max(0,s.order.time-dt);if(!s.order.time){s.status='leaving';s.phase=0;for(const g of this.games){g.score=Math.max(0,g.score-20);g.missed++;g.combo=0;g.emit('miss',`Bàn ${s.id+1} chờ quá lâu · −20đ`)}}}
   else if(s.status==='leaving'&&s.phase>=3){s.status='empty';s.phase=0;s.order=null;}
  }
  for(const station of this.stations.filter(s=>s.kind==='customer'))station.customerActive=this.seats[station.customerId].status==='seated';
 }
 serve(game,p,id,service='table'){const seat=this.seats[id];if(!seat||seat.status!=='seated')return game.fail('Khách đã được phục vụ hoặc chưa gọi món.');if(p.item?.kind!=='meal'||p.item.recipe!==seat.order.recipe)return game.fail(`Bàn ${id+1} gọi ${RECIPES.find(r=>r.id===seat.order.recipe).name}. Mang đúng món tới nhé.`);
  const order=seat.order,first=this.orders[0]?.id===order.id,recipe=RECIPES.find(r=>r.id===order.recipe),tip=Math.ceil(order.time/10)*2;game.combo=first?game.combo+1:0;const multiplier=1+Math.min(game.combo,5)*.2,serviceMultiplier=service==='table'?1.25:1,points=Math.round((recipe.value+tip)*multiplier*(game.rush?1.25:1)*serviceMultiplier);
  // Close the shared order before awarding it; another team cannot win it again.
  seat.status='leaving';seat.phase=0;for(const s of this.stations)if(s.customerId===id)s.customerActive=false;
  this.lastService={seatId:id,service,team:p.team??0,time:this.time};game.score+=points;game.served++;game.dirty++;p.item=null;game.emit('serve',`Bàn ${id+1} · +${points}đ${service==='table'?' · Tận bàn +25%':' · Băng chuyền'}`,{points,combo:game.combo,base:recipe.value,tip,multiplier,rush:game.rush,customerId:id,service,serviceMultiplier});return true;
 }
 belt(game,item,station){const seat=this.seats.find(s=>s.status==='seated'&&s.beltIndex===station.beltIndex&&s.order.recipe===item.recipe);return seat?this.serve(game,{item,team:item.deliveryTeam??0},seat.id,'belt'):false}
 snapshot(){return JSON.parse(JSON.stringify({time:this.time,sequence:this.sequence,nextArrival:this.nextArrival,nextSeat:this.nextSeat,lastService:this.lastService,seats:this.seats}))}
 apply(state){Object.assign(this,state);}
}
