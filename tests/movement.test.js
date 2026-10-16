import test from 'node:test';
import assert from 'node:assert/strict';
import {CHEF_DISTANCE,DASH_DURATION,DASH_SPEED,DASH_COOLDOWN,moveChef,recoverChef,requestDash,resetMotion,stopDash,screenDirection,stepChef} from '../src/movement.js';
import {collides} from '../src/navigation.js';
import {MAPS,getStations} from '../src/levels.js';
import {KitchenMatch} from '../src/match.js';
const plain={hazard:[]};
const chef=(x=0,z=0)=>({x,z,dir:Math.PI/2,active:true,item:null,cooldown:0,dash:0});
const close=(a,b,tolerance=1e-6)=>assert.ok(Math.abs(a-b)<tolerance,`${a} != ${b}`);

test('Free movement and dash distance are stable at 20, 30, 60 and 144 FPS',()=>{
 for(const fps of [20,30,60,144]){const p=chef(),input={x:1,z:0},direction=screenDirection(1,0);requestDash(p,input);for(let i=0;i<fps/2;i++)stepChef(p,input,1/fps,[],plain);const expected=DASH_DURATION*DASH_SPEED+(.5-DASH_DURATION)*3.8;close(p.x,direction.x*expected);close(p.z,direction.z*expected);close(p.cooldown,DASH_COOLDOWN-.5);}
 const diagonal=chef(),straight=chef();stepChef(diagonal,{x:1,z:1},.2,[],plain);stepChef(straight,{x:1,z:0},.2,[],plain);close(Math.hypot(diagonal.x,diagonal.z),Math.hypot(straight.x,straight.z));
});
test('Dash cooldown blocks spam, facing dash works and carried food survives contact',()=>{
 const p=chef(-2,0),other=chef(0,0);p.item={kind:'meal',recipe:'burger'};assert.ok(requestDash(p));assert.equal(requestDash(p),false);stepChef(p,{x:0,z:0},.25,[],plain,[other]);assert.ok(p.x<=-CHEF_DISTANCE+1e-6);assert.equal(p.item.recipe,'burger');assert.equal(p.dash,0);stepChef(p,{x:0,z:0},.25,[],plain,[other]);stepChef(p,{x:0,z:0},.25,[],plain,[other]);stepChef(p,{x:0,z:0},.25,[],plain,[other]);stepChef(p,{x:0,z:0},.11,[],plain,[other]);assert.ok(requestDash(p));
});
test('Swept movement cannot tunnel through a chef, furniture or boundaries',()=>{
 const obstacle={kind:'counter',x:0,z:0},p=chef(-3,0),other=chef(-1,0);
 moveChef(p,6,0,[],[other]);assert.ok(p.x<=other.x-CHEF_DISTANCE+1e-6);
 const q=chef(-3,0);moveChef(q,6,0,[obstacle]);assert.ok(q.x<-1.35);assert.equal(collides(q.x,q.z,[obstacle]),false);
 const r=chef(7,5);moveChef(r,10,10,[]);assert.ok(r.x<=7.5&&r.z<=5.55);
});
test('Two head-on chefs stop, then slide apart and escape without pushing',()=>{
 const a=chef(-1,0),b=chef(1,0);for(let i=0;i<60;i++){moveChef(a,.05,0,[],[b]);moveChef(b,-.05,0,[],[a]);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=CHEF_DISTANCE-1e-6)}
 const oldB={x:b.x,z:b.z};moveChef(a,.5,.8,[],[b]);close(b.x,oldB.x);close(b.z,oldB.z);assert.ok(a.z>.5);moveChef(b,-1,0,[],[a]);assert.ok(b.x<0);
});
test('Diagonal input slides along a counter and can turn around its corner',()=>{
 const stations=[{kind:'counter',x:0,z:0}],p=chef(-1.4,0);moveChef(p,1,1,stations);assert.ok(p.z>.8);assert.equal(collides(p.x,p.z,stations),false);moveChef(p,2,.5,stations);assert.ok(p.x>-.5);assert.equal(collides(p.x,p.z,stations),false);
});
test('Recovery finds a free spot without dropping a held object; hidden chefs do not block solo',()=>{
 const p=chef(0,0),other=chef(0,0);p.item={kind:'plate'};assert.ok(recoverChef(p,[],[other]));assert.ok(Math.hypot(p.x-other.x,p.z-other.z)>=CHEF_DISTANCE-1e-6);assert.equal(p.item.kind,'plate');const stations=[{kind:'board',x:0,z:0}],q=chef(0,0);assert.ok(recoverChef(q,stations));assert.equal(collides(q.x,q.z,stations),false);const a=chef(-1,0),hidden={...chef(0,0),active:false};moveChef(a,2,0,[],[hidden]);close(a.x,1);
});
for(const map of MAPS)test(`${map.id}: adversarial walking and dash contacts preserve clearances`,()=>{
 const stations=getStations(map.id),players=map.spawn.map(p=>chef(p.x,p.z));let seed=37;
 const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32};
 for(let frame=0;frame<2500;frame++){for(const p of players){const input={x:Math.round(rand()*2)-1,z:Math.round(rand()*2)-1};if(frame%27===0)requestDash(p,input);stepChef(p,input,frame%71===0?.25:1/30,stations,map,players.filter(q=>q!==p));assert.equal(collides(p.x,p.z,stations),false)}assert.ok(Math.hypot(players[0].x-players[1].x,players[0].z-players[1].z)>=CHEF_DISTANCE-1e-6)}
});
for(const map of MAPS)test(`${map.id}: bot routes around a human and resumes after a blocked approach`,()=>{
 const m=new KitchenMatch({mode:'bot',map:map.id}),players=map.spawn.map(p=>chef(p.x,p.z));m.start();let closest=Infinity;for(let t=0;t<240;t+=.05){if(t>35&&t<70){const board=m.stations.find(s=>s.kind==='board');const candidate={x:board.x,z:board.z+1.08};if(!collides(candidate.x,candidate.z,m.stations)&&Math.hypot(candidate.x-players[1].x,candidate.z-players[1].z)>=CHEF_DISTANCE)Object.assign(players[0],candidate);}else if(t>=70&&t<70.06)Object.assign(players[0],map.spawn[0]);m.tick(.05,players);closest=Math.min(closest,Math.hypot(players[0].x-players[1].x,players[0].z-players[1].z));assert.equal(collides(players[1].x,players[1].z,m.stations),false);m.games.forEach(g=>g.events=[])}assert.ok(closest>=CHEF_DISTANCE-1e-6);assert.ok(m.games[1].served>=2,`only ${m.games[1].served} orders; ${m.bot.label}`);
});
test('Reset clears dash momentum and cooldown',()=>{const p=chef();requestDash(p);resetMotion(p);assert.equal(p.dash,0);assert.equal(p.cooldown,0);assert.equal(p.dashX,0);assert.equal(p.dashZ,0)});

for(const map of MAPS)test(`${map.id}: stations have distinct physical locations`,()=>{const stations=getStations(map.id);assert.equal(new Set(stations.map(s=>`${s.x}:${s.z}`)).size,stations.length)});
test('Pausing cancels queued dash without advancing cooldown or positions',()=>{const p=chef();p.dashRequested=true;requestDash(p);const cooldown=p.cooldown;stopDash(p);assert.equal(p.dashRequested,false);assert.equal(p.dash,0);assert.equal(p.cooldown,cooldown);close(p.x,0);});
test('Overhead camera controls move along the matching screen axes without sideways drift',()=>{for(const [input,x,z] of [[{x:1,z:0},.76,0],[{x:-1,z:0},-.76,0],[{x:0,z:1},0,.76],[{x:0,z:-1},0,-.76]]){const p=chef();stepChef(p,input,.2,[],plain);close(p.x,x);close(p.z,z)}});
