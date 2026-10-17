import {KitchenGame} from './engine.js';
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
    this.options.level=Math.max(0,Math.min(2,Math.floor(Number(this.options.level)||0)));
    this.options.map=getMap(this.options.map).id;this.level=getStage(this.options.map,this.options.level);this.map=stageMap(this.level);
    this.competitive=isVersus(this.options.mode);this.stations=stageStations(this.level,this.competitive);
    const config={...this.level,recipeOffset:this.level.recipeOffset+MAPS.findIndex(m=>m.id===this.map.id)};
    this.games=Array.from({length:this.competitive?2:1},()=>new KitchenGame(config));
    this.kitchen=Object.fromEntries(['board','pot','grill','assembly','plates','dirty','wash','counters','fires'].map(key=>[key,this.games[0][key]]));
    for(const game of this.games)game.attachKitchen(this.kitchen);
    this.environment=new KitchenEnvironment(this.level,this.stations,this.kitchen,this.map);
    this.bot=this.options.mode==='assist'?new CoopBot(this.stations,this.map,this.options.difficulty,this.level):this.options.mode==='bot'?new ChefBot(stationsForTeam(this.stations,1),this.map,this.options.difficulty):null;
  }
  get status(){return this.games[0].status}
  set status(value){for(const game of this.games)game.status=value}
  get time(){return this.games[0].time}
  start(){this.status='playing'}
  tick(dt,players){if(this.status!=='playing')return;this.environment.tick(dt,players);for(let i=0;i<this.games.length;i++)this.games[i].tick(dt,i===0);if(this.bot&&players&&this.status==='playing')this.bot.update(this.games[this.competitive?1:0],players[1],dt,players.filter((p,i)=>i!==1&&p.active!==false));}
  gameFor(index){return this.games[this.competitive?index:0]}
  get result(){if(!this.competitive)return null;const [a,b]=this.games;return{winner:a.score===b.score?null:a.score>b.score?0:1,scores:[a.score,b.score],served:[a.served,b.served]}}
}
