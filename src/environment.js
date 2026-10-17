export class KitchenEnvironment {
 constructor(stage,stations,kitchen,map=null){this.stage=stage;this.stations=stations;this.kitchen=kitchen;this.time=0;this.beltCycle=0;this.warning=false;this.revision=0;this.events=[];this.gateOpen=true;this.spread={};this.map=map;this.direction=1;this.vents=stage.vents?[{x:-3.2,z:2,rx:1.3,rz:.75,offset:0},{x:3.2,z:-2,rx:1.3,rz:.75,offset:7}]:[];}
 tick(dt,players=[]){
  const before=this.time;this.time+=dt;
  if(this.stage.belt){
   const interval=this.stage.beltInterval||6,cycle=Math.floor(this.time/interval),slots=this.stations.filter(s=>s.belt).sort((a,b)=>(a.beltIndex??a.x)-(b.beltIndex??b.x));
   while(this.beltCycle<cycle){this.beltCycle++;if(slots.length){const items=slots.map(s=>this.kitchen.counters[s.id]);this.direction=this.stage.reverse&&Math.floor(this.beltCycle*interval/(this.stage.sushi?36:18))%2?-1:1;
   const exit=this.direction>0?slots.length-1:0,out=items[exit];
   if(out?.kind==='meal'&&this.deliver?.(out)){items[exit]=undefined;delete this.kitchen.claims?.[slots[exit].id];this.events.push('belt-serve');}
   const claims=slots.map(s=>this.kitchen.claims?.[s.id]);
   for(let i=0;i<slots.length;i++){const incoming=items[(i+slots.length-this.direction)%slots.length];if(incoming)this.kitchen.counters[slots[i].id]=incoming;else delete this.kitchen.counters[slots[i].id];if(this.kitchen.claims){const claim=claims[(i+slots.length-this.direction)%slots.length];if(claim)this.kitchen.claims[slots[i].id]=claim;else delete this.kitchen.claims[slots[i].id];}}this.events.push('belt');}}
  }
  this.warning=false;
  for(const gate of this.stations.filter(s=>s.dynamic&&s.id.startsWith('gate'))){
   const offset=gate.phaseOffset||0,phase=(this.time+offset)%16,oldPhase=(before+offset)%16,warn=phase>=8&&phase<10;
   this.warning ||= warn;gate.warning=warn;
   const occupied=players.some(p=>p.active!==false&&Math.abs(p.x-gate.x)<gate.width/2+.4&&Math.abs(p.z-gate.z)<gate.depth/2+.4);
   const enabled=phase>=10&&phase<15&&!occupied;
   if(gate.enabled!==enabled){gate.enabled=enabled;this.revision++;this.events.push(enabled?'gate-close':'gate-open');}if(gate.id==='gate')this.gateOpen=!enabled;
   if(warn&&(oldPhase<8||oldPhase>=10))this.events.push('warning');
  }
  for(const vent of this.vents){const phase=(this.time+vent.offset)%14,was=vent.warning;vent.warning=phase>=4&&phase<6;vent.active=phase>=6&&phase<10;if(vent.warning&&!was)this.events.push('steam-warning');}
  if(this.map)this.map.dynamicHazards=this.vents.filter(v=>v.active).map(v=>({...v,multiplier:.35}));
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
