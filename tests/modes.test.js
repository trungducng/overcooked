import test from 'node:test';
import assert from 'node:assert/strict';
import {KitchenGame} from '../src/engine.js';
import {ChefBot} from '../src/bot.js';
import {MAPS,LEVELS,getStations} from '../src/levels.js';
import {collides,createNavigator} from '../src/navigation.js';
for(const map of MAPS){
  test(`${map.id}: every station is reachable in solo and versus`,()=>{for(const versus of [false,true]){const stations=getStations(map.id,versus),nav=createNavigator(stations);for(const spawn of map.spawn){assert.equal(collides(spawn.x,spawn.z,stations),false,'valid spawn');for(const station of stations)assert.ok(nav.pathTo(spawn,station),`unreachable ${station.id}`)}}});
  for(let level=0;level<LEVELS.length;level++)test(`${map.id} level ${level+1}: bot cooks real orders and scores`,()=>{const stations=getStations(map.id,true),g=new KitchenGame(LEVELS[level]),p={...map.spawn[1],team:1,item:null},bot=new ChefBot(stations,map);g.start();for(let time=0;time<LEVELS[level].duration;time+=.05){g.tick(.05);bot.update(g,p,.05);assert.equal(collides(p.x,p.z,stations),false,'bot crossed a counter');g.events=[];}assert.ok(g.served>=2,`only ${g.served} served; ${bot.label}, ${JSON.stringify(p)}, pot ${JSON.stringify(g.pot)}`);assert.ok(g.score>0);assert.ok(g.status==='ended'||g.time<.1);});
}
test('Opponent cannot use the other team’s board or pot',()=>{const stations=getStations('sunny',true),g=new KitchenGame(),p={team:0,item:{kind:'raw',ingredient:'tomato'}};g.start();assert.equal(g.action(p,stations.find(s=>s.id==='board-rival')),false);assert.equal(g.board,null);assert.ok(p.item);assert.equal(g.work({team:0,item:null},stations.find(s=>s.id==='pot-rival'),5),false)});
test('Separate kitchens receive equal orders and do not share scores or plates',()=>{const a=new KitchenGame(LEVELS[1]),b=new KitchenGame(LEVELS[1]);a.start();b.start();assert.deepEqual(a.orders,b.orders);a.action({item:{kind:'plate'},team:0},{kind:'trash'});assert.equal(a.dirty,1);assert.equal(b.dirty,0);a.score=400;assert.equal(b.score,0);a.status='paused';b.status='paused';a.tick(100);b.tick(100);assert.equal(a.time,b.time)});

import {KitchenMatch} from '../src/match.js';
test('Match ends both teams together and decides wins and ties by score',()=>{
 const m=new KitchenMatch({mode:'pvp',map:'market',level:2});m.start();m.games[0].score=200;m.games[1].score=150;m.tick(m.time);assert.equal(m.status,'ended');assert.equal(m.games[1].status,'ended');assert.equal(m.result.winner,0);m.games[1].score=m.games[0].score;assert.equal(m.result.winner,null);m.games[1].score=m.games[0].score+50;assert.equal(m.result.winner,1);
});
test('Pause freezes both kitchens and bot movement',()=>{
 const m=new KitchenMatch({mode:'bot',map:'harbor'}),players=m.map.spawn.map((p,team)=>({...p,team,item:null}));m.start();m.tick(1,players);m.status='paused';const snapshot=JSON.stringify({positions:players,games:m.games});m.tick(30,players);assert.equal(JSON.stringify({positions:players,games:m.games}),snapshot);m.status='playing';m.tick(.1,players);assert.equal(m.games[0].time,m.games[1].time);assert.ok(m.time<239);
});
for(const difficulty of ['easy','normal','hard'])test(`Bot ${difficulty} can finish and wash dishes during a match`,()=>{
 const m=new KitchenMatch({mode:'bot',map:'harbor',difficulty}),players=m.map.spawn.map((p,team)=>({...p,team,item:null}));m.start();let cleaned=false,lastPlates=4;for(let t=0;t<240;t+=.05){m.tick(.05,players);if(m.games[1].plates>lastPlates)cleaned=true;lastPlates=m.games[1].plates;m.games.forEach(g=>g.events=[])}assert.ok(m.games[1].served>=5,`served ${m.games[1].served}`);assert.ok(cleaned,'bot did not wash dishes');
});
test('Both PvP players can cook and serve without consuming opponent orders or plates',()=>{
 const m=new KitchenMatch({mode:'pvp'});m.start();
 const cook=team=>{const p={team,item:null},g=m.gameFor(team),find=kind=>m.stations.find(s=>s.kind===kind&&(s.team===undefined||s.team===team));for(let i=0;i<2;i++){assert.ok(g.action(p,m.stations.find(s=>s.ingredient==='tomato')));assert.ok(g.action(p,find('board')));assert.ok(g.work(p,find('board'),2.1));assert.ok(g.action(p,find('board')));assert.ok(g.action(p,find('pot')))}m.tick(10.1);assert.ok(g.action(p,find('plates')));assert.ok(g.action(p,find('pot')));assert.ok(g.action(p,find('serve')));};
 cook(0);assert.ok(m.games[0].score>0);assert.equal(m.games[1].score,0);assert.equal(m.games[1].orders[0].id,1);assert.equal(m.games[1].plates,4);cook(1);assert.equal(m.games[0].served,1);assert.equal(m.games[1].served,1);assert.ok(m.games[1].score>0);assert.equal(m.games[0].dirty,1);assert.equal(m.games[1].dirty,1);
});
