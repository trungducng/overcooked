import {collides,BOUNDS} from './navigation.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
// Items have one owner: a hand, a station, or this collection. Transfers move
// the original object; rejected actions leave its owner untouched.
export class ItemHandling {
 constructor(stations,kitchen){this.stations=stations;this.kitchen=kitchen;this.items=[];this.sequence=0;this.events=[];}
 clearPoint(x,z){
  if(!collides(x,z,this.stations))return{x,z};
  for(let r=.15;r<2.5;r+=.15)for(let i=0;i<24;i++){const a=i*Math.PI/12,p={x:x+Math.sin(a)*r,z:z+Math.cos(a)*r};if(!collides(p.x,p.z,this.stations))return p;}
  return null;
 }
 handoff(p,players){
  if(!p.item)return false;
  const x=Math.sin(p.dir||0),z=Math.cos(p.dir||0);
  const recipient=players.filter(q=>q!==p&&q.active!==false&&!q.item&&distance(p,q)<=1.25&&((q.x-p.x)*x+(q.z-p.z)*z)>.2).sort((a,b)=>distance(p,a)-distance(p,b))[0];
  if(!recipient)return false;
  // A countertop can be used for a long transfer, but direct handoffs cannot cross it.
  if(collides((p.x+recipient.x)/2,(p.z+recipient.z)/2,this.stations))return false;
  recipient.item=p.item;p.item=null;this.events.push('handoff');return true;
 }
 pickup(p){
  if(p.item)return false;
  const item=this.items.filter(o=>!o.flight&&distance(p,o)<1).sort((a,b)=>distance(p,a)-distance(p,b))[0];
  if(!item)return false;p.item=item.item;this.items.splice(this.items.indexOf(item),1);this.events.push('pickup');return true;
 }
 drop(p){
  if(!p.item)return false;const point=this.clearPoint(p.x+Math.sin(p.dir||0)*.75,p.z+Math.cos(p.dir||0)*.75);if(!point)return false;
  this.items.push({id:++this.sequence,item:p.item,...point,y:.25,flight:null});p.item=null;this.events.push('drop');return true;
 }
 throw(p){
  if(!p.item||!['raw','chopped'].includes(p.item.kind))return false;
  const dx=Math.sin(p.dir||0),dz=Math.cos(p.dir||0);
  this.items.push({id:++this.sequence,item:p.item,x:p.x,z:p.z,y:1,flight:{x:p.x,z:p.z,dx,dz,time:0,duration:.65,range:5,owner:p.id??p}});p.item=null;this.events.push('throw');return true;
 }
 tick(dt,players){
  for(const entity of [...this.items]){
   const f=entity.flight;if(!f)continue;
   let remaining=dt;
   while(remaining>0&&entity.flight){
    const slice=Math.min(.012,remaining);remaining-=slice;f.time=Math.min(f.duration,f.time+slice);const t=f.time/f.duration;
    const x=f.x+f.dx*f.range*t,z=f.z+f.dz*f.range*t;
    const wall=this.stations.some(s=>s.kind==='obstacle'&&s.enabled!==false&&Math.abs(x-s.x)<(s.width??2.26)/2+.15&&Math.abs(z-s.z)<(s.depth??1.52)/2+.15);
    if(x<BOUNDS.minX||x>BOUNDS.maxX||z<BOUNDS.minZ||z>BOUNDS.maxZ||wall){this.land(entity);break;}
    entity.x=x;entity.z=z;entity.y=.4+Math.sin(Math.PI*t)*1.75;
    const catcher=players.find(p=>p.active!==false&&(p.id??p)!==f.owner&&!p.item&&distance(p,entity)<.52);
    if(catcher){catcher.item=entity.item;this.items.splice(this.items.indexOf(entity),1);entity.flight=null;this.events.push('catch');break;}
    if(t>=1)this.land(entity);
   }
  }
 }
 land(entity){
  const counter=this.stations.find(s=>s.kind==='counter'&&Math.abs(s.x-entity.x)<1&&Math.abs(s.z-entity.z)<.65&&!this.kitchen.counters[s.id]);
  if(counter){this.kitchen.counters[counter.id]=entity.item;this.items.splice(this.items.indexOf(entity),1);}
  else{const point=this.clearPoint(entity.x,entity.z)||this.clearPoint(0,0);if(point)Object.assign(entity,point);entity.y=.25;}
  entity.flight=null;
 }
}
