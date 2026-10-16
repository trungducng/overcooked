import {collides} from './navigation.js';
export class KitchenEnvironment {
 constructor(stage,stations,kitchen){this.stage=stage;this.stations=stations;this.kitchen=kitchen;this.time=0;this.beltCycle=0;this.warning=false;this.revision=0;this.events=[];this.gateOpen=true;this.spread={};}
 tick(dt,players=[]){
  const before=this.time;this.time+=dt;
  if(this.stage.belt){
   const cycle=Math.floor(this.time/6),slots=this.stations.filter(s=>s.belt).sort((a,b)=>a.x-b.x);
   while(this.beltCycle<cycle){this.beltCycle++;if(slots.length){const items=slots.map(s=>this.kitchen.counters[s.id]);for(let i=0;i<slots.length;i++){const incoming=items[(i+slots.length-1)%slots.length];if(incoming)this.kitchen.counters[slots[i].id]=incoming;else delete this.kitchen.counters[slots[i].id];}this.events.push('belt');}}
  }
  if(this.stage.gate){
   const phase=this.time%16,gate=this.stations.find(s=>s.id==='gate');this.warning=phase>=8&&phase<10;
   const shouldClose=phase>=10&&phase<15;
   // Never close a gate through a chef, or teleport a chef to the other side.
   const occupied=players.some(p=>p.active!==false&&Math.abs(p.x-gate.x)<gate.width/2+.4&&Math.abs(p.z-gate.z)<gate.depth/2+.4);
   const enabled=shouldClose&&!occupied;
   if(gate.enabled!==enabled){gate.enabled=enabled;this.revision++;this.events.push(enabled?'gate-close':'gate-open');}this.gateOpen=!enabled;
   if(before%16<8&&phase>=8)this.events.push('warning');
  }
  // Burning cookware ignites a neighbour after eight seconds. Extinguishing
  // individual counters is always possible with empty hands, including the sink.
  const hot=this.stations.filter(s=>(s.kind==='pot'||s.kind==='grill')&&this.kitchen[s.kind].burnt||this.kitchen.fires?.[s.id]);
  const current=new Set(hot.map(s=>s.id));for(const id of Object.keys(this.spread))if(!current.has(id))delete this.spread[id];
  for(const source of hot){this.spread[source.id]=(this.spread[source.id]||0)+dt;if(this.spread[source.id]<8)continue;this.spread[source.id]=0;
   const next=this.stations.filter(s=>s!==source&&!['obstacle','trash','pot','grill'].includes(s.kind)&&!this.kitchen.fires[s.id]&&Math.hypot(s.x-source.x,s.z-source.z)<3.25).sort((a,b)=>Math.hypot(a.x-source.x,a.z-source.z)-Math.hypot(b.x-source.x,b.z-source.z))[0];
   if(next){this.kitchen.fires[next.id]={work:0};this.events.push('spread');}
  }
  if(this.stage.moving){
   const counter=this.stations.find(s=>s.id==='counter1'),target=Math.sin(this.time*Math.PI/12)*2.4,dx=target-counter.x;
   const blocked=players.some(p=>p.active!==false&&Math.abs(p.x-target)<1.6&&Math.abs(p.z-counter.z)<1.15);
   if(!blocked&&Math.abs(dx)>.025){counter.x=target;this.revision++;}
  }
 }
}
