import * as THREE from 'three';
import {INGREDIENTS} from './engine.js';
// One fixed pool, two draw calls. No per-burst geometry/material allocation.
export class KitchenEffects {
 constructor(scene,capacity=240){
  this.capacity=capacity;this.particles=[];this.rings=[];this.previous=null;this.clock=0;this.beat=0;
  this.dots=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshBasicMaterial({transparent:true,opacity:.82,depthWrite:false}),capacity);this.dots.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.dots.frustumCulled=false;this.dots.count=0;scene.add(this.dots);
  this.halos=new THREE.InstancedMesh(new THREE.TorusGeometry(1,.025,4,24),new THREE.MeshBasicMaterial({transparent:true,opacity:.65,depthWrite:false}),24);this.halos.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.halos.frustumCulled=false;this.halos.count=0;scene.add(this.halos);
  this.matrix=new THREE.Matrix4();this.position=new THREE.Vector3();this.scale=new THREE.Vector3();this.rotation=new THREE.Quaternion();this.ringRotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,0));this.color=new THREE.Color();
 }
 reset(){this.particles.length=0;this.rings.length=0;this.previous=null;this.dots.count=0;this.halos.count=0;this.beat=0;}
 burst(x,y,z,color=0xffd57a,count=12,speed=1.8,life=.7,size=.065){
  for(let i=0;i<count&&this.particles.length<this.capacity;i++){const angle=Math.random()*Math.PI*2,force=(.3+Math.random()*.7)*speed;this.particles.push({x,y,z,vx:Math.cos(angle)*force,vz:Math.sin(angle)*force,vy:(.4+Math.random())*speed,gravity:speed>.8?4:0,life,ttl:life,size,color});}
 }
 ring(x,z,color=0xffd57a,y=.24){if(this.rings.length>=24)this.rings.shift();this.rings.push({x,z,y,color,life:.6,ttl:.6})}
 observe(match,players,handling,dt,quality='balanced'){
  const playing=match.status==='playing',step=playing?Math.min(dt,.1):0;this.clock+=step;this.beat-=step;const first=!this.previous||this.previous.round!==match.round;
  if(first){this.reset();this.previous={round:match.round,served:match.games.map(g=>g.served),ready:match.kitchen.pot.ready,grill:match.kitchen.grill.ready,burnt:match.kitchen.pot.burnt||match.kitchen.grill.burnt,board:match.kitchen.board?.progress||0,wash:match.kitchen.wash,items:players.map(p=>JSON.stringify(p.item)),flying:new Map(),dash:players.map(p=>p.dash||0)};}
  const prev=this.previous,k=match.kitchen,at=kind=>match.stations.find(s=>s.kind===kind),low=quality==='light';
  for(let i=0;i<match.games.length;i++){const g=match.games[i];if(g.served>prev.served[i]){const s=at('serve');this.burst(s.x,1.7,s.z,i?0x90d5ff:0xffcd59,low?14:32,2.5,1,.075);this.ring(s.x,s.z,0xa9ef9a);prev.served[i]=g.served;}}
  if(k.pot.ready&&!prev.ready){const s=at('pot');this.ring(s.x,s.z,0xa5ed93,1.45);this.burst(s.x,2.0,s.z,0xd9f9a7,10,.8,.75)}prev.ready=k.pot.ready;
  if(k.grill.ready&&!prev.grill){const s=at('grill');this.ring(s.x,s.z,0xa5ed93,1.45)}prev.grill=k.grill.ready;
  const burnt=k.pot.burnt||k.grill.burnt;if(burnt&&!prev.burnt){const s=at(k.pot.burnt?'pot':'grill');this.burst(s.x,1.6,s.z,0xff763a,22,2,1);this.ring(s.x,s.z,0xff573b)}prev.burnt=burnt;
  if(playing&&this.beat<=0){
   this.beat=low?.22:.12;
   if((k.board?.progress||0)>prev.board){const s=at('board');this.burst(s.x,1.5,s.z,INGREDIENTS[k.board.ingredient].color,low?2:4,.8,.4,.045)}
   if(k.wash>prev.wash){const s=at('sink');this.burst(s.x,1.5,s.z,0xb7eeff,3,.55,.7,.06)}
   if(k.pot.ingredients.length===2){const s=at('pot');this.burst(s.x,2.0,s.z,k.pot.burnt?0x76675e:0xe7eee1,low?1:2,.32,1.4,.10)}
   if(k.grill.item){const s=at('grill');this.burst(s.x,1.6,s.z,k.grill.burnt?0x6c625c:0xffbd65,2,.6,.6,.035)}
   for(const vent of match.environment.vents||[])if(vent.active)this.burst(vent.x,.25,vent.z,0xc8eef0,low?2:5,.6,1.0,.12);
  }
  prev.board=k.board?.progress||0;prev.wash=k.wash;
  for(let i=0;i<players.length;i++){
   const p=players[i],key=JSON.stringify(p.item);if(p.active&&key!==prev.items[i]&&p.item){this.burst(p.x,1.2,p.z,0xfff0b0,5,.9,.35,.045);if(prev.flying.size)this.ring(p.x,p.z,0x94e9d2)}prev.items[i]=key;
   if(p.active&&p.dash>0&&step){if(!prev.dash[i])this.ring(p.x,p.z,0xffdf9a);this.burst(p.x-Math.sin(p.dir)*.3,.3,p.z-Math.cos(p.dir)*.3,0xe8dac0,low?1:2,.5,.28,.08)}prev.dash[i]=p.dash||0;
  }
  const current=new Map();for(const e of handling.items){if(e.flight){if(step)this.burst(e.x,e.y,e.z,0xffd88d,1,.15,.2,.04);current.set(e.id,{x:e.x,z:e.z})}else if(prev.flying.has(e.id))this.ring(e.x,e.z,0xe5d4a2);}
  prev.flying=current;this.update(step,low?120:this.capacity);
 }
 update(dt,limit=this.capacity){
  for(const p of this.particles){p.ttl-=dt;p.x+=p.vx*dt;p.z+=p.vz*dt;p.y+=p.vy*dt;p.vy-=p.gravity*dt;}
  this.particles=this.particles.filter(p=>p.ttl>0);if(this.particles.length>limit)this.particles.splice(0,this.particles.length-limit);
  for(let i=0;i<this.particles.length;i++){const p=this.particles[i],fade=p.ttl/p.life;this.matrix.compose(this.position.set(p.x,p.y,p.z),this.rotation,this.scale.setScalar(p.size*(.25+fade)));this.dots.setMatrixAt(i,this.matrix);this.dots.setColorAt(i,this.color.set(p.color).multiplyScalar(.5+fade*.5));}this.dots.count=this.particles.length;this.dots.instanceMatrix.needsUpdate=true;if(this.dots.instanceColor)this.dots.instanceColor.needsUpdate=true;
  for(const r of this.rings)r.ttl-=dt;this.rings=this.rings.filter(r=>r.ttl>0);for(let i=0;i<this.rings.length;i++){const r=this.rings[i],t=1-r.ttl/r.life;this.matrix.compose(this.position.set(r.x,r.y,r.z),this.ringRotation,this.scale.setScalar(.2+t*.85));this.halos.setMatrixAt(i,this.matrix);this.halos.setColorAt(i,this.color.set(r.color).multiplyScalar(1-t*.75));}this.halos.count=this.rings.length;this.halos.instanceMatrix.needsUpdate=true;if(this.halos.instanceColor)this.halos.instanceColor.needsUpdate=true;
 }
}
