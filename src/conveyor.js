import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
// Lit, solid machinery. Moving links share one instanced draw call.
export function createConveyor(scene,batch){
 const root=new THREE.Group();scene.add(root);let links=null,path=null,rollers=[];const dummy=new THREE.Object3D();
 function clear(){const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.isMesh){gs.add(o.geometry);ms.add(o.material)}});for(const g of gs)g.dispose();for(const m of ms)m.dispose();root.clear();links=null;path=null;rollers=[];}
 function reset(stage,stations){clear();if(!stage.belt)return;
  const materials=new Map(),mat=(color,metal=.1,rough=.5)=>{const key=color+':'+metal;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough}));return materials.get(key)};
  const steel=mat(0xaab8b8,.7,.3),dark=mat(0x263e43,.4),wood=mat(0x975d40),gold=mat(0xd9ae67,.65,.3),rubber=mat(0x3b5356,.25),black=mat(0x182c31),lamp=mat(0xa6e2bd);
  const mesh=(geometry,material,x,y,z)=>{const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;root.add(o);return o};
  const box=(w,h,d,m,x,y,z)=>mesh(new RoundedBoxGeometry(w,h,d,1,Math.min(w,h,d)*.12),m,x,y,z);
  const tube=(points,r,m)=>mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points,true,'centripetal'),Math.max(80,points.length*2),r,6,true),m,0,0,0);
  let halfX,halfZ,cz,radius,width=1.5;
  if(stage.buffet){halfX=10.5;halfZ=6.2;cz=0;radius=1.15;}else if(stage.sushi){halfX=2.8;halfZ=.9;cz=.9;radius=.8;width=1.42;}
  if(halfX){
   const rounded=(offset,y)=>{const pts=[],hx=halfX+offset,hz=halfZ+offset,r=Math.max(.05,radius+offset);for(const [cx,zz,start] of [[hx-r,-hz+r,-Math.PI/2],[hx-r,hz-r,0],[-hx+r,hz-r,Math.PI/2],[-hx+r,-hz+r,Math.PI]])for(let i=0;i<=10;i++){const a=start+i*Math.PI/20;pts.push(new THREE.Vector3(cx+Math.cos(a)*r,y,cz+zz+Math.sin(a)*r));}return pts};
   const outer=rounded(width/2+.15,0),inner=rounded(-Math.min(width/2+.15,radius-.08),0);
   const shape=new THREE.Shape(outer.map(p=>new THREE.Vector2(p.x,-p.z))),hole=new THREE.Path(inner.map(p=>new THREE.Vector2(p.x,-p.z)).reverse());shape.holes.push(hole);
   const ring=(height,y,m)=>{const geo=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.035,bevelThickness:.035,curveSegments:8});geo.rotateX(-Math.PI/2);return mesh(geo,m,0,y,0)};
   ring(.46,.66,wood);ring(.16,1.08,steel);ring(.06,1.23,black);
   for(const edge of [-1,1]){tube(rounded(edge*(width/2+.1),1.34),.055,gold);tube(rounded(edge*(width/2+.13),.82),.035,dark);}
   const center=rounded(0,1.30);path=new THREE.CatmullRomCurve3(center,true,'centripetal',0);const length=path.getLength(),count=Math.ceil(length/.22);
   links=new THREE.InstancedMesh(new THREE.BoxGeometry(width,.07,.185),rubber,count);links.instanceMatrix.setUsage(THREE.DynamicDrawUsage);links.castShadow=links.receiveShadow=true;links.userData.dynamic=true;root.add(links);
   for(let d=0;d<length;d+=2.4){const p=path.getPointAt(d/length);box(.18,.57,.18,steel,p.x,.45,p.z);box(.42,.08,.42,dark,p.x,.20,p.z);}
   for(let d=0;d<length;d+=.6){const p=path.getPointAt(d/length),t=path.getTangentAt(d/length),roller=mesh(new THREE.CylinderGeometry(.12,.12,width,8),steel,p.x,1.16,p.z);roller.rotation.z=Math.PI/2;roller.rotation.y=-Math.atan2(t.z,t.x);}
   for(const x of [-halfX,halfX]){const side=x+(x>0?1:-1)*(width/2+.28);box(.46,.52,.72,dark,side,.91,cz);const cap=mesh(new THREE.CylinderGeometry(.19,.19,.16,12),steel,side+(x>0?.28:-.28),.93,cz);cap.rotation.z=Math.PI/2;box(.10,.15,.22,lamp,side,1.22,cz-.12);}
  }else{
   const slots=stations.filter(s=>s.belt),min=Math.min(...slots.map(s=>s.x))-1.05,max=Math.max(...slots.map(s=>s.x))+1.05,z=slots[0].z;
   box(max-min,.48,1.65,wood,(min+max)/2,.87,z);box(max-min,.12,1.7,steel,(min+max)/2,1.17,z);
   for(const edge of [-.81,.81])box(max-min,.09,.10,gold,(min+max)/2,1.32,z+edge);
   const count=Math.ceil((max-min)/.22);links=new THREE.InstancedMesh(new THREE.BoxGeometry(.18,.07,1.44),rubber,count);links.userData.dynamic=true;root.add(links);path={line:true,min,max,z};
   for(let x=min+.4;x<max;x+=2.4){box(.18,.58,1.2,steel,x,.46,z);box(.4,.08,1.5,dark,x,.2,z);}
  }
  // A raised end cap and service light make pickup points tangible.
  for(const s of stations.filter(s=>s.belt&&(s.beltIndex===0||s.beltIndex===(stage.buffet?11:5))))box(.22,.15,.35,lamp,s.x,1.39,s.z-.66);
  batch(root);update(0,1);
 }
 function update(time,direction=1){if(!links||!path)return;const n=links.count;
  for(let i=0;i<n;i++){if(path.line){const length=path.max-path.min;dummy.position.set(path.min+((i/n*length+time*.5*direction)%length+length)%length,1.29,path.z);dummy.rotation.set(0,0,0);}else{const length=path.getLength(),t=((i/n+time*.5*direction/length)%1+1)%1,p=path.getPointAt(t),tangent=path.getTangentAt(t);dummy.position.copy(p);dummy.rotation.set(0,Math.atan2(tangent.x,tangent.z),0);}dummy.updateMatrix();links.setMatrixAt(i,dummy.matrix);}links.instanceMatrix.needsUpdate=true;
 }
 return {reset,update,root};
}
