const playerKeys=['id','x','z','dir','item','team','active','dash','cooldown','moving','work'];
const gameKeys=['status','time','score','served','missed','combo','sequence','orders','rush'];
const pick=(o,keys)=>Object.fromEntries(keys.map(k=>[k,o[k]]));
export function snapshot(match,players,handling){return JSON.parse(JSON.stringify({version:1,round:match.round,options:match.options,games:match.games.map(g=>pick(g,gameKeys)),kitchen:match.kitchen,players:players.map(p=>pick(p,playerKeys)),loose:handling.items,environment:{time:match.environment.time,beltCycle:match.environment.beltCycle,warning:match.environment.warning,gateOpen:match.environment.gateOpen,direction:match.environment.direction,vents:match.environment.vents},stations:match.stations.map(s=>pick(s,['id','x','z','enabled','warning']))}));}
export function applySnapshot(state,match,players,handling){
 if(state.version!==1||state.games.length!==match.games.length)return false;
 Object.assign(match.kitchen,state.kitchen);for(let i=0;i<match.games.length;i++)Object.assign(match.games[i],state.games[i]);
 for(let i=0;i<players.length;i++)if(state.players[i])Object.assign(players[i],state.players[i]);
 handling.items=state.loose;handling.sequence=Math.max(0,...state.loose.map(e=>e.id));Object.assign(match.environment,state.environment);
 for(const s of state.stations){const local=match.stations.find(x=>x.id===s.id);if(local)Object.assign(local,s);}return true;
}
export function sanitizeInput(message,lastSequence=-1){
 if(!message||message.type!=='input'||!Number.isSafeInteger(message.seq)||message.seq<=lastSequence)return null;
 let x=Number(message.x),z=Number(message.z);if(!Number.isFinite(x)||!Number.isFinite(z))return null;
 x=Math.max(-1,Math.min(1,x));z=Math.max(-1,Math.min(1,z));const d=Math.hypot(x,z);if(d>1){x/=d;z/=d;}
 return {seq:message.seq,x,z,work:message.work===true,actions:Array.isArray(message.actions)?message.actions.filter(a=>['interact','drop','throw','dash'].includes(a)).slice(0,4):[]};
}
