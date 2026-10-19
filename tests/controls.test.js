import test from 'node:test';import assert from 'node:assert/strict';import {CONTROLS,readInput,inputEdges,activeSeats} from '../src/controls.js';
test('four keyboard seats have no overlapping gameplay keys',()=>{const all=CONTROLS.flatMap(c=>Object.entries(c).filter(([k])=>k!=='label').map(([,v])=>v));assert.equal(new Set(all).size,all.length);for(let i=0;i<4;i++){const keys=new Set([CONTROLS[i].right,CONTROLS[i].work]);const input=readInput(i,keys);assert.equal(input.x,1);assert.ok(input.work);for(let j=0;j<4;j++)if(j!==i)assert.equal(readInput(j,keys).x,0)}});
test('standard gamepad has deadzone, normalized input and one-shot action edges',()=>{const pad={axes:[.1,-1],buttons:Array.from({length:10},(_,i)=>({pressed:[0,2,5].includes(i)}))},input=readInput(0,new Set(),pad);assert.equal(input.x,0);assert.equal(input.z,-1);assert.ok(input.work);assert.deepEqual(inputEdges(input),['interact','dash']);assert.deepEqual(inputEdges(input,input),[]);assert.ok(Math.abs(readInput(0,new Set(),{axes:[1,1]}).x-Math.SQRT1_2)<1e-12)});
test('solo relay uses two switchable chefs, four local seats are cooperative only',()=>{assert.equal(activeSeats({mode:'solo'},{roles:true}),2);assert.equal(activeSeats({mode:'solo'},{}),1);assert.equal(activeSeats({mode:'coop',players:4},{}),4);assert.equal(activeSeats({mode:'pvp',players:4},{}),2)});
test('P1 moves with arrow keys; WASD moves only P2 in local multiplayer',()=>{
 for(const [key,axis,value] of [['ArrowUp','z',-1],['ArrowDown','z',1],['ArrowLeft','x',-1],['ArrowRight','x',1]]){
  assert.equal(readInput(0,new Set([key]))[axis],value);
  assert.equal(readInput(1,new Set([key]))[axis],0);
 }
 assert.equal(readInput(0,new Set(['KeyW'])).z,0);
 assert.equal(readInput(1,new Set(['KeyW'])).z,-1);
 assert.equal(CONTROLS[0].interact,'KeyE');assert.equal(CONTROLS[0].work,'Space');
});
