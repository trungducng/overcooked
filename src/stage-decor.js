import * as THREE from 'three';
export function createStageDecor(scene,batch){
 const root=new THREE.Group();scene.add(root);let live=[];
 function reset(stage,stations){
  root.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose()}});root.clear();live=[];
  const materials=new Map();const mat=(color,opacity=1)=>{const key=color+':'+opacity;if(!materials.has(key))materials.set(key,new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1}));return materials.get(key)};
  const block=(w,h,d,color,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);root.add(m);return m};
  const panel=(x,z,w,d,color,opacity=.1)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat(color,opacity));m.rotation.x=-Math.PI/2;m.position.set(x,.205,z);root.add(m);return m};
  // Coloured work zones and inset runners communicate the route without labels.
  const style=stage.style,accent=new THREE.Color(style.accent);panel(0,0,15.8,11.3,style.floor,.08);
  for(const s of stations){if(['board','pot','grill','serve','assembly'].includes(s.kind))panel(s.x,s.z,2.45,1.7,s.kind==='serve'?0xf4ce74:s.kind==='board'?0x9bc684:0xd5a17f,.16);}
  if(stage.sushi){
   panel(0,.9,8.1,3.5,0x243d43,.55);
   for(const x of [-1.4,1.4])for(const z of [0,1.8])block(.7,.14,1.42,0x29484d,x,1.2,z);
   for(const x of [-2.8,2.8])block(2.17,.14,.5,0x29484d,x,1.2,.9);
   for(const z of [-.8,2.6])block(8,.06,.10,0xeab96e,0,1.31,z);
   for(const x of [-4,4])block(.10,.06,3.5,0xeab96e,x,1.31,.9);
   for(const x of [-3,0,3]){block(.95,.95,.06,0xaa4745,x,3,-7.6);block(.06,.6,.08,0xffe2af,x,3,-7.5);}
  }
  if(stage.roles){panel(-3.6,0,6.9,11,0x70bea5,.12);panel(3.6,0,6.9,11,0xecaa68,.12);}
  if(stage.layout==='island'){panel(0,0,3.7,3.2,0x92bb63,.23);for(const x of [-2.1,2.1])for(const z of [-1.5,-.5,.5,1.5]){block(.45,.06,.4,0x8cb358,x,.25,z);}}
  if(stage.layout==='lanes'){for(const z of [-3,0,3])for(let i=0;i<7;i++)block(.35,.01,.07,0x89bfce,-4.8+i*1.6,.22,z);}
  if(stage.moving){for(const z of [-.54,.54])block(6.7,.025,.045,0xc4b4e8,0,.225,z);for(let x=-3;x<=3;x+=.5)block(.04,.02,1.1,0x6f7797,x,.21,0);}
  // Back-wall pennants make all nine shifts recognisable at a glance.
  for(let i=0;i<stage.id%3+3;i++){const x=(i-(stage.id%3+2)/2)*1.1;block(.65,.9,.04,accent,x,3.0,-7.7);block(.7,.07,.07,0xe7c689,x,3.5,-7.7);}
  if(stage.vents)for(const v of [{x:-3.2,z:2},{x:3.2,z:-2}]){const g=new THREE.Group();g.userData.dynamic=true;root.add(g);for(let i=0;i<5;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.09,.035,1.0),mat(0x658e9e));m.position.set(v.x+(i-2)*.18,.235,v.z);g.add(m)}const ring=new THREE.Mesh(new THREE.RingGeometry(.8,.9,32),mat(0xeab260,.7));ring.userData.dynamic=true;ring.rotation.x=-Math.PI/2;ring.position.set(v.x,.25,v.z);root.add(ring);live.push({ring,x:v.x,z:v.z});}
  batch(root);
 }
 function update(environment,time){for(const v of live){const state=environment.vents?.find(x=>x.x===v.x);v.ring.visible=!!state&&(state.active||state.warning);v.ring.material.color.set(state?.active?0x86e9f2:0xffa64f);v.ring.material.opacity=.35+Math.sin(time*8)*.2;}}
 return {reset,update};
}
