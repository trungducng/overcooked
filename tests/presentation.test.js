import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {batchStatic} from '../src/presentation.js';
const box=material=>new THREE.Mesh(new THREE.BoxGeometry(1,1,1),material);
function bounds(root){root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(root,true);return [...b.min.toArray(),...b.max.toArray()];}

test('Static batching preserves world bounds under nested rotation and nonuniform scaling',()=>{
 const root=new THREE.Group();root.position.set(5,2,-4);root.rotation.y=.7;
 const parent=new THREE.Group();parent.position.set(2,.5,-1);parent.scale.set(2,.7,1.4);parent.rotation.z=.3;root.add(parent);
 const material=new THREE.MeshStandardMaterial(),a=box(material),b=box(material);b.position.set(1.2,.4,2);parent.add(a,b);
 const before=bounds(root);batchStatic(root);const after=bounds(root);before.forEach((n,i)=>assert.ok(Math.abs(n-after[i])<1e-5));assert.equal(root.children.filter(o=>o.isMesh).length,1);assert.equal(parent.children.length,0);
});
test('Animated props, cooking contents and translucent steam stay independently updateable',()=>{
 const root=new THREE.Group(),material=new THREE.MeshStandardMaterial(),staticPart=box(material),contents=new THREE.Group(),soup=box(material),steam=box(new THREE.MeshBasicMaterial({transparent:true,opacity:.3}));contents.userData.dynamic=true;contents.add(soup);root.add(staticPart,contents,steam);batchStatic(root);assert.equal(contents.parent,root);assert.equal(soup.parent,contents);assert.equal(steam.parent,root);soup.visible=false;soup.position.y=3;assert.equal(contents.children[0].visible,false);assert.equal(contents.children[0].position.y,3);
});
test('Batching a station does not modify geometry shared by another station',()=>{
 const geometry=new THREE.BoxGeometry(1,1,1),material=new THREE.MeshStandardMaterial(),a=new THREE.Group(),b=new THREE.Group();const first=new THREE.Mesh(geometry,material),second=new THREE.Mesh(geometry,material);first.position.x=3;second.position.x=-7;a.add(first);b.add(second);const before=bounds(b),vertices=Array.from(geometry.attributes.position.array);batchStatic(a);assert.deepEqual(bounds(b),before);assert.deepEqual(Array.from(geometry.attributes.position.array),vertices);assert.equal(second.parent,b);
});
