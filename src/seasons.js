import * as THREE from 'three';
export const SEASONS={
 classic:{name:'Nguyên bản',icon:'✦',description:'Giữ phong cách riêng của từng căn bếp.',background:0x0c1830,sun:0xffe3c5,fill:0x44cfdf,accent:'#e3b873'},
 halloween:{name:'Halloween',icon:'🎃',description:'Bí ngô, nến tím và khu vườn ma quái.',background:0x170d25,sun:0xffbd79,fill:0x9964df,accent:'#ef9b46'},
 christmas:{name:'Giáng sinh',icon:'🎄',description:'Cây thông, quà tặng và tuyết rơi nhẹ.',background:0x0b2433,sun:0xffe5bb,fill:0x79c5e9,accent:'#9bd6c9'},
 tet:{name:'Tết',icon:'🧧',description:'Đèn lồng đỏ, hoa mai, hoa đào và sắc vàng.',background:0x30121b,sun:0xffd493,fill:0xf08b65,accent:'#f1c657'},
};
export const seasonOrDefault=id=>Object.hasOwn(SEASONS,id)?id:'classic';
export function createSeasonDecor(scene,batch){
 const root=new THREE.Group();root.name='season-decor';scene.add(root);let points=null,seed=null,current='classic';
 function clear(){const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material)});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();root.clear();points=null;}
 function setTheme(id,stage,quality='balanced'){
  clear();current=seasonOrDefault(id);root.visible=current!=='classic';if(!root.visible)return;
  const mats=new Map(),mat=(c,glow=false)=>{const key=c+':'+glow;if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color:c,roughness:.7,emissive:glow?c:0,emissiveIntensity:glow?.55:0}));return mats.get(key)};
  const add=(geo,c,x,y,z,glow=false)=>{const m=new THREE.Mesh(geo,mat(c,glow));m.position.set(x,y,z);m.castShadow=false;m.receiveShadow=true;root.add(m);return m};
  const box=(w,h,d,c,x,y,z)=>add(new THREE.BoxGeometry(w,h,d),c,x,y,z);
  const ball=(r,c,x,y,z,glow=false)=>add(new THREE.SphereGeometry(r,10,7),c,x,y,z,glow);
  const cone=(r,h,c,x,y,z)=>add(new THREE.ConeGeometry(r,h,10),c,x,y,z);
  const wide=stage?.buffet,edge=wide?15:10,zBack=wide?-10:-7.2,zFront=wide?8:5.7;
  const base=current==='halloween'?0x65315f:current==='christmas'?0x23624d:0x9a2939;
  for(const side of [-1,1]){
   box(2.4,.24,2.2,base,side*edge,.15,zFront);
   if(current==='halloween'){
    for(let i=0;i<3;i++){const x=side*(edge+(i-1)*.65),z=zFront+(i%2)*.6,r=i===1?.7:.48;const pumpkin=ball(r,0xd97727,x,r+.25,z);pumpkin.scale.y=.8;box(.12,.3,.12,0x665f30,x,r*1.8+.3,z);for(const dx of [-.19,.19]){const eye=cone(.13,.22,0xffe792,x+dx,r+.4,z+r*.9);eye.rotation.z=Math.PI;}box(.36,.09,.035,0xffcd60,x,r+.15,z+r*.95);}
    box(.15,3.7,.15,0x594766,side*edge,2,zBack);cone(.85,1.8,0x4a285c,side*edge,4.2,zBack);add(new THREE.CylinderGeometry(.9,.9,.1,10),0x522866,side*edge,3.35,zBack);
   }else if(current==='christmas'){
    box(.4,1,.4,0x755544,side*edge,.7,zFront);for(let i=0;i<3;i++){cone(1.4-i*.3,2.1-i*.25,0x28664d,side*edge,1.7+i*.9,zFront);cone(1.22-i*.28,.45,0xe8f2ed,side*edge,2.4+i*.78,zFront);}ball(.23,0xffd976,side*edge,4.15,zFront,true);
    for(let i=0;i<5;i++){const a=i*2.4;ball(.14,[0xee5a4c,0xffda76,0x9edce3][i%3],side*edge+Math.sin(a)*.8,1.4+i*.35,zFront+Math.cos(a)*.7,true);}
    for(let i=0;i<3;i++){const x=side*edge+(i-1)*.72,z=zFront-1.3;box(.58,.55,.58,i%2?0xdeb85b:0xb33d4a,x,.5,z);box(.1,.58,.62,0xffe5aa,x,.51,z);box(.62,.58,.1,0xffe5aa,x,.51,z);}
   }else{
    const x=side*edge,z=zFront;add(new THREE.CylinderGeometry(.6,.4,.85,10),0x9a2b36,x,.65,z);box(.18,2.8,.18,0x754b38,x,2.1,z);
    for(let i=0;i<5;i++){const a=i*2.4,b=box(.1,1.9,.1,0x855c46,x+Math.sin(a)*.45,2.5+i*.12,z+Math.cos(a)*.35);b.rotation.z=Math.sin(a)*.6;for(let j=0;j<5;j++){const f=ball(.17,side<0?0xffce58:0xf697ad,x+Math.sin(a+j*.7)*(.7+j*.09),2.6+i*.22+Math.cos(j)*.4,z+Math.cos(a+j*.7)*.7);f.scale.y=.65;}}
   }
  }
  // Back-wall garland and large hanging ornaments establish a clear seasonal silhouette.
  box(edge*2,.09,.09,current==='tet'?0xd9a34b:0xb6a5ba,0,4.5,zBack);
  for(let i=-3;i<=3;i++){
   const x=i*2.5,y=3.8+Math.abs(i)*.12;
   box(.035,.6,.035,0xd5b589,x,4.2,zBack);
   if(current==='tet'){const lamp=ball(.4,0xd9383a,x,y,zBack,true);lamp.scale.y=1.25;box(.3,.1,.3,0xf0c75f,x,y+.5,zBack);box(.035,.55,.035,0xf4c24b,x,y-.7,zBack);}
   else if(current==='christmas'){ball(.25,i%2?0xcf4547:0xf1cd72,x,y,zBack,true);}
   else{const ghost=ball(.32,0xd8dfd6,x,y,zBack,true);ghost.scale.y=1.5;for(const dx of [-.11,.11])ball(.06,0x342342,x+dx,y+.04,zBack+.29);}
  }
  batch(root);
  // One points draw call; no per-flake mesh, lights or shadow maps.
  seed=new Float32Array(96*3);for(let i=0;i<96;i++){seed[i*3]=Math.sin(i*21.37)*(edge+2);seed[i*3+1]=(i*.71)%7+.8;seed[i*3+2]=Math.cos(i*13.77)*9;}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(seed.slice(),3));points=new THREE.Points(geo,new THREE.PointsMaterial({color:current==='christmas'?0xe5f5ff:current==='tet'?0xffb4b8:0xc691ed,size:current==='christmas'?.075:.10,transparent:true,opacity:.7,depthWrite:false}));points.frustumCulled=false;root.add(points);setQuality(quality);
 }
 function setQuality(q){if(points){points.visible=q!=='light';points.geometry.setDrawRange(0,q==='high'?96:48);}}
 function update(time){if(!points?.visible||!root.visible)return;const a=points.geometry.attributes.position;for(let i=0;i<a.count;i++){a.array[i*3]=seed[i*3]+Math.sin(time*.4+i)*.3;a.array[i*3+1]=.4+((seed[i*3+1]-time*(current==='halloween'?.13:.45))%7+7)%7;}a.needsUpdate=true;}
 return {setTheme,setQuality,update,root};
}
