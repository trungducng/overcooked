import {CustomerService,DINING_SEATS} from './customers.js';
import {KitchenGame,chefKey} from './engine.js';
import {MAPS,LEVELS,getMap,getStations,isVersus,MODES,stationsForTeam} from './levels.js';
import {KitchenEnvironment} from './environment.js';
import {getStage,stageMap,stageStations} from './stages.js';
import {CoopBot} from './coop-bot.js';
import {ChefBot} from './bot.js';
let matchSequence=0;
export class KitchenMatch {
  constructor(options={}){
    this.round=Date.now()+'-'+(++matchSequence);
    this.options={mode:'solo',map:'sunny',level:0,difficulty:'normal',...options};
    if(!MODES[this.options.mode])this.options.mode='solo';
    this.options.level=Math.max(0,Math.min(3,Math.floor(Number(this.options.level)||0)));
    this.options.pvpBots=['orange','blue','both'].includes(this.options.pvpBots)?this.options.pvpBots:'none';
    this.options.map=getMap(this.options.map).id;this.level=getStage(this.options.map,this.options.level);this.options.level=this.level.level;this.map=stageMap(this.level);
    this.competitive=isVersus(this.options.mode);this.stations=stageStations(this.level,this.competitive);
    const config={...this.level,recipeOffset:this.level.recipeOffset+MAPS.findIndex(m=>m.id===this.map.id)};
    this.games=Array.from({length:this.competitive?2:1},()=>new KitchenGame(config));
    this.kitchen=Object.fromEntries(['board','pot','grill','assembly','plates','dirty','wash','counters','fires','claims'].map(key=>[key,this.games[0][key]]));
    for(const game of this.games)game.attachKitchen(this.kitchen);
    if(this.level.buffet){this.customers=new CustomerService(this.level,this.stations);for(const seat of DINING_SEATS){const id=DINING_SEATS.indexOf(seat),belt=this.stations.find(s=>s.beltIndex===seat.beltIndex);this.stations.push({id:'customer'+id,kind:'customer',customerId:id,customerActive:false,x:belt.x,z:belt.z});}this.customers.bind(this.games);}
    this.environment=new KitchenEnvironment(this.level,this.stations,this.kitchen,this.map);
    this.environment.deliver=(item,station)=>{const g=this.games[this.competitive?(item.deliveryTeam===1?1:0):0];if(this.customers)return this.customers.belt(g,item,station);if(!g.orders.some(o=>o.recipe===item.recipe))return false;return g.action({item,team:item.deliveryTeam??0,bot:true},this.stations.find(s=>s.kind==='serve'));};
    this.bot=this.options.mode==='assist'?new CoopBot(this.stations,this.map,this.options.difficulty,this.level):this.options.mode==='bot'?new ChefBot(stationsForTeam(this.stations,1),this.map,this.options.difficulty):null;
    this.bots=new Map();if(this.bot)this.bots.set(1,this.bot);
    if(this.options.mode==='pvp')for(const [seat,choice] of [[2,'orange'],[3,'blue']])if(this.options.pvpBots===choice||this.options.pvpBots==='both')this.bots.set(seat,new ChefBot(this.stations,this.map,this.options.difficulty));
  }
  get status(){return this.games[0].status}
  set status(value){for(const game of this.games)game.status=value}
  get time(){return this.games[0].time}
  start(){this.status='playing'}
  tick(dt,players){
    if(this.status!=='playing')return;
    for(const [i,p] of (players||[]).entries()){p.id??=i;p.bot=this.bots.has(i);}
    for(const s of this.stations){const claim=this.kitchen.claims[s.id];if(claim&&(players||[]).some(p=>p.active!==false&&chefKey(p)===claim.owner&&Math.hypot(p.x-s.x,p.z-s.z)<2.1))claim.remaining=Math.max(claim.remaining,2);}
    this.customers?.tick(dt);this.environment.tick(dt,players);for(let i=0;i<this.games.length;i++)this.games[i].tick(dt,i===0);
    if(players&&this.status==='playing')for(const [seat,bot] of this.bots){const p=players[seat];if(p?.active!==false&&p)bot.update(this.gameFor(seat),p,dt,players.filter((other,i)=>i!==seat&&other.active!==false));}
  }
  gameFor(index){return this.games[this.competitive?index%2:0]}
  get result(){if(!this.competitive)return null;const [a,b]=this.games;return{winner:a.score===b.score?null:a.score>b.score?0:1,scores:[a.score,b.score],served:[a.served,b.served]}}
}
