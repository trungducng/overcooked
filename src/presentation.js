import {createAlternateSets} from './scenery.js';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Batch only immutable meshes. Interactive props, particles and animated flames
// keep their own objects; source geometry is converted into the root's space.
export function batchStatic(root){
 root.updateMatrixWorld(true);
 const inverse=new THREE.Matrix4().copy(root.matrixWorld).invert(),groups=new Map(),objects=[];
 root.traverse(mesh=>{
  if(!mesh.isMesh||mesh.isInstancedMesh||Array.isArray(mesh.material)||mesh.material.isShaderMaterial||mesh.material.transparent)return;
  for(let parent=mesh;parent;parent=parent.parent){if(parent.userData.dynamic)return;if(parent===root)break;}
  const geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld));
  const key=mesh.material.uuid;if(!groups.has(key))groups.set(key,{material:mesh.material,geometries:[]});groups.get(key).geometries.push(geometry);objects.push(mesh);
 });
 for(const group of groups.values()){
  const merged=mergeGeometries(group.geometries,false);if(!merged)throw new Error('Incompatible static geometry');
  const mesh=new THREE.Mesh(merged,group.material);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);for(const geometry of group.geometries)geometry.dispose();
 }
 for(const mesh of objects)mesh.parent.remove(mesh);
}

// All scenery is live geometry. Surface maps and light falloffs are generated
// here so the game has no remote asset dependency or baked background image.
function surfaceTexture(wood=false){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
 const c=canvas.getContext('2d');c.fillStyle=wood?'#c5b7a8':'#b7bac8';c.fillRect(0,0,512,512);
 let seed=313;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<6500;i++){const v=Math.floor(70+rand()*140);c.fillStyle=`rgba(${v},${v},${v},${wood?.05:.10})`;c.fillRect(rand()*512,rand()*512,wood?rand()*48+2:rand()*3+1,1+rand()*2);}
 for(let i=0;i<(wood?65:16);i++){c.strokeStyle=wood?'#30212220':'#55566b10';c.lineWidth=wood?.7:1.5;c.beginPath();const y=rand()*512;c.moveTo(0,y);for(let x=0;x<=512;x+=25)c.lineTo(x,y+Math.sin(x*.03+i)*3);c.stroke();}
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
function glowTexture(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'#ffffff');g.addColorStop(.16,'#ffffffb0');g.addColorStop(.5,'#ffffff25');g.addColorStop(1,'#ffffff00');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);}

export function createPresentation(scene,renderer,camera){
 const environment=new THREE.Group();environment.name='Lantern Hall';scene.add(environment);
 const stoneMap=surfaceTexture(),woodMap=surfaceTexture(true),glowMap=glowTexture();
 const standard=(color,roughness=.8,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const stone=standard(0x69718d),darkStone=standard(0x343c59),trim=standard(0xa0a6b9),wood=standard(0xa7795c),gold=standard(0xb88740,.38,.55),iron=standard(0x323c51,.42,.55);
 for(const m of [stone,darkStone,trim]){m.map=stoneMap;m.bumpMap=stoneMap;m.bumpScale=.028;}
 wood.map=woodMap;wood.bumpMap=woodMap;wood.bumpScale=.025;
 const materials={stone,darkStone,trim,wood,gold,iron};
 const unit=new RoundedBoxGeometry(1,1,1,2,.09);
 function block(w,h,d,material,x,y,z,parent=environment){const mesh=new THREE.Mesh(unit,material);mesh.scale.set(w,h,d);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function sphere(r,material,x,y,z,parent=environment,scale){const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,12,10),material);mesh.position.set(x,y,z);if(scale)mesh.scale.set(...scale);mesh.castShadow=true;parent.add(mesh);return mesh;}
 function cylinder(rt,rb,h,material,x,y,z,parent=environment){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,12),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function ring(r,t,material,x,y,z,parent=environment){const mesh=new THREE.Mesh(new THREE.TorusGeometry(r,t,8,40),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
 function glow(color,x,y,z,size,parent=environment,opacity=.4){const material=new THREE.SpriteMaterial({map:glowMap,color,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false});const sprite=new THREE.Sprite(material);sprite.position.set(x,y,z);sprite.scale.set(size,size,1);parent.add(sprite);return sprite;}
 // Deep, layered masonry beneath the playable floor.
 const matrix=new THREE.Matrix4(),quaternion=new THREE.Quaternion(),position=new THREE.Vector3(),scale=new THREE.Vector3();
 const masonry=[];
 for(let row=0;row<4;row++)for(let i=0;i<12;i++)for(const z of [-6.15,6.15])masonry.push({x:-7.7+i*1.4+(row%2?.18:0),y:-.43-row*.84,z,w:1.36,h:.79,d:.65});
 for(let row=0;row<4;row++)for(let i=0;i<9;i++)for(const x of [-8.18,8.18])masonry.push({x,y:-.43-row*.84,z:-5.45+i*1.35,w:.65,h:.79,d:1.31});
 const bricks=new THREE.InstancedMesh(unit,stone,masonry.length);masonry.forEach((b,i)=>{matrix.compose(position.set(b.x,b.y,b.z),quaternion,scale.set(b.w,b.h,b.d));bricks.setMatrixAt(i,matrix);bricks.setColorAt(i,new THREE.Color().setHSL(.64,.13,.40+(i%5)*.025));});bricks.castShadow=true;bricks.receiveShadow=true;environment.add(bricks);
 block(16.7,.28,12.8,darkStone,0,-.02,0);
 // Octagonal stone tiles with recessed dark grout and small diamond infills.
 const shape=new THREE.Shape(),a=.56,cut=.14;shape.moveTo(-a+cut,-a);shape.lineTo(a-cut,-a);shape.lineTo(a,-a+cut);shape.lineTo(a,a-cut);shape.lineTo(a-cut,a);shape.lineTo(-a+cut,a);shape.lineTo(-a,a-cut);shape.lineTo(-a,-a+cut);shape.closePath();
 const tileGeo=new THREE.ExtrudeGeometry(shape,{depth:.075,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.024,bevelThickness:.022});tileGeo.rotateX(-Math.PI/2);
 const tileMaterial=standard(0xc4c8d5);tileMaterial.map=stoneMap;tileMaterial.bumpMap=stoneMap;tileMaterial.bumpScale=.018;
 const tiles=new THREE.InstancedMesh(tileGeo,tileMaterial,14*10);let ti=0;
 for(let ix=0;ix<14;ix++)for(let iz=0;iz<10;iz++){matrix.makeTranslation((ix-6.5)*1.16,.09,(iz-4.5)*1.16);tiles.setMatrixAt(ti,matrix);tiles.setColorAt(ti,new THREE.Color().setHSL(.645,.12,.67+((ix*17+iz*7)%5)*.025));ti++;}
 tiles.receiveShadow=true;environment.add(tiles);
 const infills=new THREE.InstancedMesh(new RoundedBoxGeometry(.18,.06,.18,1,.015),trim,13*9);ti=0;
 for(let ix=0;ix<13;ix++)for(let iz=0;iz<9;iz++){matrix.makeRotationY(Math.PI/4);matrix.setPosition((ix-6)*1.16,.1,(iz-4)*1.16);infills.setMatrixAt(ti++,matrix);}infills.receiveShadow=true;environment.add(infills);
 for(const z of [-6.12,6.12]){block(16.8,.19,.33,trim,0,.13,z);block(16.7,.07,.09,gold,0,.24,z-.08);}
 for(const x of [-8.15,8.15])block(.32,.19,12.1,trim,x,.13,0);
 // A luminous abyss, kept below the floor so it never obscures the action.
 const mistMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},tint:{value:new THREE.Color(0x00d8bd)}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float time;uniform vec3 tint;void main(){vec2 p=vUv-.5;float wave=sin(p.x*23.+time*.3)*cos(p.y*17.-time*.2)*.08;float light=exp(-dot(p,p)*9.)*.75+wave;gl_FragColor=vec4(tint*(.035+light*.25),.88);}'});
 const mist=new THREE.Mesh(new THREE.PlaneGeometry(65,55),mistMaterial);mist.rotation.x=-Math.PI/2;mist.position.y=-3.5;environment.add(mist);
 for(const x of [-7.6,7.6]){const light=new THREE.PointLight(0x12e8d0,65,13,2);light.position.set(x,-1.2,1);environment.add(light);glow(0x00eecb,x,-1.5,2,13,environment,.14);}
 // Stone wings and their portals. Railings mark these as scenery, outside bounds.
 for(const side of [-1,1]){
  block(3.0,.38,9.2,darkStone,side*10.55,-.27,-2.05);block(3.08,.16,9.3,trim,side*10.55,-.02,-2.05);
  for(let i=0;i<7;i++){block(.3,.7,.8,stone,side*12,.45,-5.9+i*1.2);block(.35,.15,.92,trim,side*12,.85,-5.9+i*1.2);}
  for(let row=0;row<5;row++)for(let i=0;i<3;i++)block(1.02,.73,.55,(row+i)%3?stone:darkStone,side*10.6+(i-1)*1.05,row*.75+.42,-6.15);
 }
 // Rear walls have real block seams, buttresses, recessed lancet windows.
 for(const side of [-1,1])for(let row=0;row<6;row++)for(let i=0;i<5;i++)block(1.18,.74,.55,(i+row)%4?stone:darkStone,side*(4.32+i*1.18),row*.76+.4,-7.25);
 const windowMaterial=new THREE.MeshBasicMaterial({color:0x97f9ff,toneMapped:false});
 function archWindow(x){
  const arch=new THREE.Shape();arch.moveTo(-.63,0);arch.lineTo(-.63,1.58);arch.quadraticCurveTo(-.55,2.15,0,2.5);arch.quadraticCurveTo(.55,2.15,.63,1.58);arch.lineTo(.63,0);arch.closePath();
  const glass=new THREE.Mesh(new THREE.ShapeGeometry(arch),windowMaterial);glass.position.set(x,1.14,-6.92);environment.add(glass);
  for(const dx of [-.77,.77])block(.24,2.0,.4,trim,x+dx,2.05,-6.87);
  for(let i=0;i<9;i++){const angle=Math.PI*i/8,xx=x+Math.cos(angle)*.76,yy=2.95+Math.sin(angle)*.94;const b=block(.35,.32,.4,trim,xx,yy,-6.87);b.rotation.z=angle-Math.PI/2;}
  block(1.85,.17,.65,trim,x,1.10,-6.75);block(.08,2.3,.08,gold,x,2.2,-6.78);block(1.25,.08,.08,gold,x,2.15,-6.78);glow(0x5ce9ff,x,2.2,-6.65,4.3,environment,.22);
 }
 archWindow(-6.65);archWindow(6.65);
 // An occupied dining gallery connects the kitchen to a wider world.
 block(7.8,.7,4.4,darkStone,0,.43,-9.25);block(7.8,.14,4.4,wood,0,.85,-9.25);
 for(let i=0;i<17;i++)block(.42,.035,4.3,wood,-3.6+i*.45,.94,-9.25);
 for(let row=0;row<5;row++)for(let i=0;i<7;i++)block(1.14,.75,.55,stone,-3.5+i*1.16,row*.77+.7,-11.5);
 block(7.2,.18,.9,wood,0,1.58,-9.05);for(const x of [-2.7,2.7])block(.18,.68,.6,wood,x,1.15,-9.05);
 const robe=standard(0x29365f),skin=standard(0xf2bf91),hat=standard(0x405bb0),white=standard(0xf8eee3);
 for(let i=0;i<3;i++){
  const x=(i-1)*1.9;block(.9,.18,.7,wood,x,1.05,-10.15);sphere(.36,robe,x,1.44,-10.15,environment,[1,.9,1]);sphere(.28,skin,x,2.13,-10.12);cylinder(.02,.36,.7,hat,x,2.68,-10.12);cylinder(.4,.4,.07,hat,x,2.33,-10.12);
  for(const dx of [-.09,.09])sphere(.035,iron,x+dx,2.17,-9.86);const dish=cylinder(.27,.27,.035,white,x,1.72,-8.91);dish.rotation.x=.03;
 }
 for(const x of [-3.9,3.9]){block(.42,6.7,.48,wood,x,3.2,-8.1);block(.62,.25,.64,gold,x,.9,-8.1);block(.6,.25,.65,gold,x,3.45,-8.1);for(let i=0;i<6;i++)sphere(.055,gold,x,1.3+i*.35,-7.84);const brace=block(.24,3.2,.27,wood,x*.74,5.2,-8.1);brace.rotation.z=x<0?-.65:.65;}
 block(8.5,.32,.55,wood,0,6.3,-8.1);
 // The crest, chipped paving and balustrades give the hall its own identity.
 block(1.65,2.05,.08,standard(0x58334c),0,3.5,-11.14);ring(.56,.065,gold,0,3.6,-11.04);
 for(const side of [-1,1]){const handle=block(.075,.95,.08,gold,side*.1,3.55,-10.98);handle.rotation.z=side*.62;const blade=block(.18,.4,.08,trim,-side*.28,3.87,-10.98);blade.rotation.z=side*.62;}
 for(let i=0;i<34;i++){const x=Math.sin(i*17.3)*7.4,z=Math.cos(i*9.1)*5.3;const crack=block(.012,.008,.28+(i%3)*.1,darkStone,x,.196,z);crack.rotation.y=i*2.7;}
 for(const side of [-1,1])for(let row=0;row<3;row++)for(let i=0;i<6;i++)block(1.04,.74,.52,stone,side*10.55+(i%3-1)*1.05,-.65-row*.76,-6.58+(i<3?0:9.07));
 // Books, bottles, ironwork and banners create scale without labels.
 const bookMats=[standard(0x705080),standard(0x336f74),standard(0x8a493f),standard(0x827044)];
 for(const side of [-1,1])for(let k=0;k<4;k++){
  const x=side*(4.25+k*.27),y=1.1+(k%2)*.18;const b=block(.22,.68,.48,bookMats[k],x,y,-6.8);b.rotation.z=(k-1.5)*.1;block(.23,.035,.49,gold,x,y-.23,-6.8);
 }
 for(const x of [-9.0,9.0]){
  block(.75,.24,1.1,trim,x,.14,3.5);block(.48,3.9,.65,darkStone,x,2.08,3.5);block(.68,.22,.85,trim,x,3.9,3.5);block(.72,.18,.85,trim,x,1.1,3.5);block(.15,2.25,.1,gold,x,2.45,3.87);
  const banner=block(.82,1.9,.06,standard(x<0?0x783e59:0x295d72),x,2.1,3.91);block(.6,.06,.075,gold,x,2.72,3.96);ring(.21,.04,gold,x,2.25,3.97);
 }
 const fires=[];
 function torch(x,z,y=2.25){
  block(.32,.8,.18,iron,x,y-.25,z);const arm=block(.12,.13,.65,iron,x,y-.15,z+.22);arm.rotation.x=-.25;cylinder(.22,.13,.23,gold,x,y,z+.43);
  const flame=new THREE.Group();flame.userData.dynamic=true;flame.position.set(x,y+.18,z+.43);environment.add(flame);
  const outer=standard(0xff7629);outer.emissive.set(0xff580d);outer.emissiveIntensity=3;const inner=standard(0xffe58d);inner.emissive.set(0xffc950);inner.emissiveIntensity=4;
  const f=sphere(.21,outer,0,.23,0,flame,[.8,2.0,.8]);const heart=sphere(.13,inner,0,.14,.03,flame,[.8,1.7,.8]);glow(0xff7b21,0,.3,0,2.8,flame,.32);
  const light=new THREE.PointLight(0xff963f,30,10,2);light.position.set(x,y+.45,z+.9);environment.add(light);fires.push({flame,light,phase:x*.7+z,f,heart});
 }
 for(const x of [-8.9,-3.8,3.8,8.9])torch(x,-6.75,2.4);
 for(const x of [-10.7,10.7])torch(x,1.7,1.3);
 // Portal disks have animated spiral light, ornamental rings and hovering dust.
 const portals=[];
 for(const side of [-1,1]){
  const group=new THREE.Group();group.position.set(side*10.25,1.7,-3.8);environment.add(group);
  const portalMat=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,uniforms:{time:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float time;void main(){vec2 p=vUv-.5;float r=length(p)*2.;float a=atan(p.y,p.x);float spiral=pow(.5+.5*sin(a*3.-r*16.+time*2.),3.);vec3 col=mix(vec3(.015,.32,.45),vec3(.4,1.,.97),spiral);float alpha=smoothstep(1.,.9,r);gl_FragColor=vec4(col*(1.2+spiral),alpha);}'});
  const disk=new THREE.Mesh(new THREE.CircleGeometry(.85,48),portalMat);group.add(disk);ring(.95,.13,gold,0,0,0,group);ring(1.13,.045,trim,0,0,0,group);
  for(let i=0;i<10;i++){const a=i*Math.PI/5;const b=block(.14,.2,.16,gold,Math.cos(a)*1.06,Math.sin(a)*1.06,0,group);b.rotation.z=a;}
  block(1.8,.22,.7,trim,0,-1.1,0,group);glow(0x36ffe9,0,0,.1,3.8,group,.28);const l=new THREE.PointLight(0x36eecf,30,9,2);l.position.copy(group.position).add(new THREE.Vector3(0,0,1));environment.add(l);portals.push(portalMat);
 }
 // Soft points rather than screen-space confetti: they live down in the chasm.
 const points=new Float32Array(80*3);for(let i=0;i<80;i++){points[i*3]=Math.sin(i*21.7)*14;points[i*3+1]=-3+(i%11)*.17;points[i*3+2]=Math.cos(i*13.1)*11;}
 const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(points,3));const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0x90ffe1,map:glowMap,size:.14,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));environment.add(dust);
 // Wet patches retain exactly the physical positions defined by each map.
 const puddles=new THREE.Group();scene.add(puddles);const alternateSets=createAlternateSets(scene,batchStatic);
 function setTheme(map,stage){environment.visible=map.id==='sunny'&&!stage?.buffet;alternateSets.setTheme(stage?.buffet?'buffet':map.id,stage);tiles.material.color.set(stage?.style.floor??0xc4c8d5);
  scene.background.set(map.id==='market'?0x121026:0x0c1830);scene.fog.color.copy(scene.background);
  const tint=map.id==='market'?0x50415e:map.id==='harbor'?0x33536d:0x444660;darkStone.color.set(tint);mistMaterial.uniforms.tint.value.set(map.id==='market'?0x5360d5:0x00d8bd);
  for(const child of [...puddles.children]){puddles.remove(child);child.geometry.dispose();child.material.dispose();}
  for(const h of map.hazard){const p=new THREE.Mesh(new THREE.CircleGeometry(1,32),new THREE.MeshPhysicalMaterial({color:0x54a9c2,transparent:true,opacity:.3,roughness:.12,metalness:.25,depthWrite:false}));p.rotation.x=-Math.PI/2;p.position.set(h.x,.205,h.z);p.scale.set(h.rx,h.rz,1);puddles.add(p);}
 }
 batchStatic(environment);
 // Direct rendering avoids the full-resolution SSAO, MSAA and bloom stack.
 // Emissive materials and glow sprites retain the lighting cues at one pass.
 let lightCount=0;environment.traverse(o=>{if(o.isPointLight){o.visible=lightCount++<2;}});
 function resize(){}
 function update(time){mistMaterial.uniforms.time.value=time;for(const p of portals)p.uniforms.time.value=time;for(const fire of fires){const flicker=1+Math.sin(time*9+fire.phase)*.12+Math.sin(time*17+fire.phase)*.05;fire.flame.scale.set(1,flicker,1);fire.light.intensity=30*flicker;fire.f.rotation.z=Math.sin(time*7+fire.phase)*.12;}dust.rotation.y=Math.sin(time*.035)*.04;}
 return {materials,setSeasonPalette(id,stage){tiles.material.color.set(id==='halloween'?0xa98bba:id==='christmas'?0xd4eeee:id==='tet'?0xead09a:stage?.style.floor??0xc4c8d5);stone.color.set(id==='halloween'?0x70607f:id==='christmas'?0x718d9b:id==='tet'?0x947364:0x69718d);},setTheme,resize,update,render:()=>renderer.render(scene,camera)};
}
