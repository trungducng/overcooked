import {KitchenGame} from './engine.js';
import {MAPS,LEVELS,getMap,getStations,isVersus,MODES} from './levels.js';
import {ChefBot} from './bot.js';
export class KitchenMatch {
  constructor(options={}){
    this.options={mode:'solo',map:'sunny',level:0,difficulty:'normal',...options};
    if(!MODES[this.options.mode])this.options.mode='solo';
    this.options.level=Math.max(0,Math.min(2,Math.floor(Number(this.options.level)||0)));
    this.map=getMap(this.options.map);this.options.map=this.map.id;this.level=LEVELS[this.options.level];
    this.competitive=isVersus(this.options.mode);this.stations=getStations(this.map.id,this.competitive);
    const config={...this.level,recipeOffset:this.level.recipeOffset+MAPS.indexOf(this.map)};
    this.games=Array.from({length:this.competitive?2:1},()=>new KitchenGame(config));
    if(this.competitive)this.games[1].counters=this.games[0].counters;
    this.bot=this.options.mode==='bot'?new ChefBot(this.stations,this.map,this.options.difficulty):null;
  }
  get status(){return this.games[0].status}
  set status(value){for(const game of this.games)game.status=value}
  get time(){return this.games[0].time}
  start(){this.status='playing'}
  tick(dt,players){if(this.status!=='playing')return;for(const game of this.games)game.tick(dt);if(this.bot&&players&&this.status==='playing')this.bot.update(this.games[1],players[1],dt);}
  gameFor(index){return this.games[this.competitive?index:0]}
  get result(){if(!this.competitive)return null;const [a,b]=this.games;return{winner:a.score===b.score?null:a.score>b.score?0:1,scores:[a.score,b.score],served:[a.served,b.served]}}
}
