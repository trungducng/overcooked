import * as THREE from 'three';
import {INGREDIENTS,RECIPES,matchAssembly} from './engine.js';
import {KitchenMatch} from './match.js';
import {MAPS,LEVELS,MODES,getMap,ROOM_SCALE,stationsForTeam} from './levels.js';
import {BOT_DIFFICULTIES} from './bot.js';
import {collides,nearestStation,speedMultiplier} from './navigation.js';
const $=s=>document.querySelector(s),wrap=$('#canvas-wrap');
let selected={mode:'solo',map:'sunny',level:0,difficulty:'normal'},match=new KitchenMatch(selected),game=match.games[0],stations=match.stations,activeMap=match.map,versus=false,coop=false,orderTeam=0,resultShown=false;
const gameFor=i=>match.gameFor(i);
const scene=new THREE.Scene();scene.background=new THREE.Color('#e5e9d6');scene.fog=new THREE.Fog('#e5e9d6',32,65);
const camera=new THREE.OrthographicCamera(-12,12,10,-10,.1,100);camera.position.set(10.5,18,18);camera.lookAt(0,0,0);
let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch(e){$('#start-card').innerHTML='<h2>Cần WebGL để chơi</h2><p>Hãy mở game trong Chrome, Edge hoặc Safari và bật tăng tốc phần cứng.</p>';throw e}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.96;wrap.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xfff8df,0x5a746b,1.15));const sun=new THREE.DirectionalLight(0xffe5bd,2.7);sun.position.set(-6,13,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-14,right:14,top:12,bottom:-12,near:1,far:38});sun.shadow.normalBias=.035;sun.shadow.bias=-.00015;sun.shadow.radius=2.5;scene.add(sun);
const rivalScene=new THREE.Scene();rivalScene.background=scene.background.clone();rivalScene.fog=scene.fog.clone();
const fill=new THREE.DirectionalLight(0xd0e8e4,.6);fill.position.set(8,6,-8);scene.add(fill);for(const light of scene.children.filter(o=>o.isLight))rivalScene.add(light.clone());
const roomScene=team=>versus&&team===1?rivalScene:scene;
const colorAccents=new Map([[0xf2dfb5,0xefd19a],[0xd4bf94,0xbca16a],[0xb4c1a2,0x83a28c],[0xcdbf9e,0xb7a17d],[0xe75f40,0xe7492b],[0xeaa05e,0xef873b],[0x72a3bd,0x3f94c4],[0x7f9c62,0x5f924c],[0x829c64,0x689650],[0xa0b47b,0x83aa5b]]);
const mats=new Map();function mat(color,roughness=.75,metalness=0){const key=`${color}:${roughness}:${metalness}`;if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color:colorAccents.get(color)??color,roughness,metalness}));return mats.get(key)}
function box(w,h,d,color,x=0,y=0,z=0,parent=scene){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
function sphere(r,color,x=0,y=0,z=0,parent=scene,scale){const m=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),mat(color));m.position.set(x,y,z);if(scale)m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function cyl(rt,rb,h,color,x=0,y=0,z=0,parent=scene,n=24){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,n),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function torus(r,t,color,x,y,z,parent=scene){const m=new THREE.Mesh(new THREE.TorusGeometry(r,t,8,32),mat(color));m.position.set(x,y,z);m.rotation.x=Math.PI/2;m.castShadow=true;parent.add(m);return m}
function leaf(x,y,z,parent,angle=0){const l=sphere(.2,0x7f9c62,x,y,z,parent,[.45,1.4,.7]);l.rotation.z=angle;return l}
function plant(x,z,size=1){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(size);scene.add(g);cyl(.4,.29,.64,0xc48c65,0,.35,0,g);cyl(.42,.42,.12,0xdb9e77,0,.7,0,g);cyl(.34,.34,.04,0x775d44,0,.77,0,g);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const l=sphere(.48,i%2?0x829c64:0xa0b47b,Math.cos(a)*.28,1+Math.sin(i)*.15,Math.sin(a)*.28,g,[.65,1.2,.6]);l.rotation.z=Math.cos(a)*.6;}return g}
function food(type,chopped=false){const g=new THREE.Group();if(chopped){for(let i=0;i<6;i++)box(.13,.09,.13,INGREDIENTS[type].color,(i%3-1)*.16,.05,Math.floor(i/3)*.17-.08,g);return g}if(type==='lettuce'){for(let i=0;i<6;i++)sphere(.20,i%2?0x8fb452:0x6b944d,Math.sin(i)*.12,.19+Math.cos(i)*.04,Math.cos(i)*.12,g,[1,1.2,.7]);}if(type==='beef'){box(.46,.12,.34,0xc87967,0,.11,0,g);box(.32,.02,.04,0xf1c4a5,0,.18,.02,g);}if(type==='bun'){sphere(.27,0xd7aa61,0,.18,0,g,[1,.62,1]);for(let i=0;i<4;i++)box(.035,.015,.025,0xf5deb0,Math.sin(i*4)*.15,.33,Math.cos(i*4)*.1,g);}if(type==='tomato'){sphere(.24,0xe75f40,0,.19,0,g,[1,.85,1]);for(let i=0;i<5;i++){const a=i*1.256;const l=box(.07,.028,.2,0x537b3d,Math.sin(a)*.07,.4,Math.cos(a)*.07,g);l.rotation.y=a}}if(type==='onion'){sphere(.22,0xe5c788,0,.2,0,g,[1,1.1,1]);cyl(.025,.09,.15,0xa89856,0,.45,0,g,8);for(let i=-1;i<=1;i++)leaf(i*.06,.56,0,g,i*.3)}if(type==='mushroom'){cyl(.085,.11,.3,0xf5e7ca,0,.15,0,g);sphere(.25,0xb68a65,0,.32,0,g,[1,.55,1]);sphere(.042,0xe7ca9b,.1,.43,.04,g,[1,.3,1]);sphere(.035,0xe7ca9b,-.1,.41,-.05,g)}return g}
function plate(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);cyl(.39,.30,.065,0xfffbeb,0,0,0,g);torus(.32,.025,0xd9e0cc,0,.045,0,g);return g}
function itemMesh(item){const g=new THREE.Group();if(item.kind==='cooked'){cyl(.25,.25,.1,0x7c4e37,0,.08,0,g);}else if(item.kind==='raw'||item.kind==='chopped')g.add(food(item.ingredient,item.kind==='chopped'));else{plate(g);if(item.kind==='meal'){const recipe=RECIPES.find(r=>r.id===item.recipe);if(recipe.family==='burger'){cyl(.26,.25,.08,0xdbb46f,0,.1,0,g);cyl(.28,.27,.07,0x83a35b,0,.17,0,g);cyl(.25,.25,.09,0x79503b,0,.24,0,g);sphere(.28,0xdbaa61,0,.32,0,g,[1,.55,1]);}else if(recipe.family==='salad'){for(let i=0;i<6;i++)sphere(.09,i%2?0x82a94f:0xda7550,Math.sin(i*2)*.17,.12,Math.cos(i*2)*.17,g);}else cyl(.27,.27,.035,recipe.color,0,.05,0,g);for(let i=0;i<4;i++)sphere(.025,0x6d984c,(i%2-.5)*.16,.075,(Math.floor(i/2)-.5)*.15,g)}}if(item.kind==='plate'&&item.components)for(let i=0;i<item.components.length;i++){const f=itemMesh(item.components[i]);f.scale.setScalar(.6);f.position.set((i-1)*.15,.09,0);g.add(f)}return g}
// A tiny restaurant, built like a hand-painted wooden toy.
box(300,.1,300,0xe5e9d6,0,-.75,0);box(13.5,.6,9.9,0xb4c1a2,0,-.35,0);box(13.2,.25,9.6,0xcdbf9e,0,-.05,0);
for(let x=0;x<12;x++)for(let z=0;z<8;z++){box(1.065,.08,1.065,(x+z)%2?0xe9ead9:0x9eb7a6,(x-5.5)*1.075,.1,(z-3.5)*1.075)}
box(13.3,.16,.15,0xf9e9bd,0,.12,4.5);box(.15,.16,9.1,0xf9e9bd,6.6,.12,0);box(.15,.16,9.1,0xf9e9bd,-6.6,.12,0);
// The rear wall and window let warm sunlight into the room.
box(13.2,2.65,.22,0xf1dbae,0,1.35,-4.45);box(13.3,.16,.35,0x768f76,0,2.7,-4.45);box(13.2,.58,.28,0x8aa58c,0,.42,-4.3);
for(let i=-6;i<=6;i++)box(.025,.58,.025,0x77947c,i,.42,-4.14);
box(3.1,1.65,.16,0xfaf0d2,-2.6,1.72,-4.23);box(2.8,1.38,.17,0xa8cdd0,-2.6,1.75,-4.12);box(.09,1.4,.1,0xfff1d3,-2.6,1.75,-4.0);box(2.85,.09,.1,0xfff1d3,-2.6,1.75,-4.0);box(3.25,.13,.5,0xe6c895,-2.6,.99,-4.02);
// Small hills beyond the window, a clock, framed menu, and hanging utensils.
sphere(.45,0xc6d7ac,-3.3,1.27,-4.0,scene,[1.3,.45,.1]);sphere(.5,0xbbcca1,-2.05,1.22,-4.0,scene,[1.2,.45,.1]);
const clock=new THREE.Group();clock.position.set(.2,2.0,-4.2);clock.rotation.x=Math.PI/2;scene.add(clock);cyl(.42,.42,.09,0x8e7751,0,0,0,clock);cyl(.35,.35,.1,0xfff7de,0,.02,0,clock);box(.035,.03,.23,0x5d6b58,0,.08,-.08,clock);box(.20,.03,.035,0x5d6b58,.08,.08,0,clock);
box(1.18,1.26,.12,0xc6955f,5.2,1.84,-4.22);box(1.02,1.1,.13,0x45675a,5.2,1.84,-4.13);for(let i=0;i<4;i++)box(.55-i*.06,.026,.02,0xe6d8b3,5.2,2.13-i*.2,-4.05);
box(1.7,.08,.16,0x9d7851,2.7,2.3,-4.1);for(let i=0;i<3;i++){box(.045,.38,.04,0x657e6b,2.1+i*.5,2.08,-4.02);sphere(.12,i===2?0xb7bcab:0x7b8f79,2.1+i*.5,1.84,-4.0,scene,[1,1.2,.3]);}
// Lower side wall, decorative floor mats, garden and front step.
box(.22,1,7.2,0xf0dcb7,-6.55,.57,-.7);box(.3,.14,7.3,0x77937a,-6.55,1.12,-.7);
box(4,.04,1.1,0xd69d73,2.1,.17,4.03);for(let i=-1;i<=1;i++)box(.045,.01,.9,0xe9c39b,2.1+i*.8,.195,4.03);
plant(-7.4,3.9,1.3);plant(7.4,-3.7,1.1);plant(-7.0,-4.8,.9);plant(6.8,3.5,.85);
box(3.6,.3,.8,0xc3b79a,0,-.26,5.25);box(3.3,.16,.65,0xd7c8aa,0,-.02,4.8);
for(let i=0;i<13;i++){const x=-8.8+Math.sin(i*19)*.7,z=-5.5+i*.87;sphere(.35,0xb4c49a,x,-.34,z,scene,[1,.45,1]);}
const roomEnvironment=new THREE.Group();for(const child of [...scene.children])if(!child.isLight)roomEnvironment.add(child);roomEnvironment.scale.set(ROOM_SCALE.x,1,ROOM_SCALE.z);scene.add(roomEnvironment);let rivalEnvironment=null,rivalDecor=null;
const environmentMeshes=[];
scene.traverse(o=>{if(o.isMesh&&o.material?.color){o.userData.originalColor=o.material.color.getHex();environmentMeshes.push(o)}});
const mapDecor=new THREE.Group();mapDecor.scale.set(ROOM_SCALE.x,1,ROOM_SCALE.z);scene.add(mapDecor);
function disposeTree(group){group.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(o.userData.disposeMaterial)o.material.dispose()}});}
function applyTheme(){
 if(rivalEnvironment)rivalScene.remove(rivalEnvironment);if(rivalDecor)rivalScene.remove(rivalDecor);
 const swaps=new Map([[0xe9ead9,activeMap.floor[0]],[0x9eb7a6,activeMap.floor[1]],[0xf1dbae,activeMap.wall],[0x768f76,activeMap.cabinet],[0x8aa58c,activeMap.cabinet]]);
 for(const mesh of environmentMeshes)mesh.material=mat(swaps.get(mesh.userData.originalColor)??mesh.userData.originalColor);
 scene.background.set(activeMap.background);scene.fog.color.set(activeMap.background);rivalScene.background.set(activeMap.background);rivalScene.fog.color.set(activeMap.background);$('.play-area').style.background=activeMap.background;
 replaceGroup(mapDecor);
 if(activeMap.id==='harbor'){
  for(const x of [-7.5,7.5]){box(1.7,.04,11,0x8bb8c1,x,-.24,0,mapDecor);for(let i=0;i<9;i++)box(.7,.025,.07,0xc0d9d7,x+Math.sin(i)*.3,-.2,-4+i,mapDecor)}
  const buoy=torus(.43,.12,0xd97a5c,-5.4,1.7,-4.2,mapDecor);buoy.rotation.x=Math.PI/2;torus(.43,.04,0xf5ebd4,-5.4,1.7,-4.07,mapDecor).rotation.x=Math.PI/2;
  for(const h of activeMap.hazard){const puddle=cyl(1,1,.012,0x82bbc4,h.x/ROOM_SCALE.x,.165,h.z/ROOM_SCALE.z,mapDecor,48);puddle.scale.set(h.rx/ROOM_SCALE.x,1,h.rz/ROOM_SCALE.z);torus(.43,.015,0xb7d7d5,h.x/ROOM_SCALE.x,.18,h.z/ROOM_SCALE.z,mapDecor).scale.set(1.2,1,1);}
  for(const x of [-7.6,7.6])for(const z of [-4,4]){cyl(.16,.19,.65,0x9d8063,x,.1,z,mapDecor);cyl(.23,.23,.09,0xe6cba5,x,.46,z,mapDecor)}
 }
 if(activeMap.id==='market'){
  box(13,.07,.07,0x82665d,0,3.15,-4.1,mapDecor);
  for(let i=0;i<7;i++){const x=-5.4+i*1.8;colorLantern(x,2.72,-4.05,i%2?0xe9b65f:0xd67b66);}
  for(const x of [-7.4,7.4]){box(.13,2.5,.13,0x926e60,x,1.1,3,mapDecor);colorLantern(x,2.4,3,0xe7b261)}
 }
 rivalEnvironment=roomEnvironment.clone(true);rivalScene.add(rivalEnvironment);rivalDecor=mapDecor.clone(true);rivalScene.add(rivalDecor);
}
function colorLantern(x,y,z,color){cyl(.025,.025,.28,0x7e6758,x,y+.4,z,mapDecor);sphere(.32,color,x,y,z,mapDecor,[1,1.25,1]);for(const dy of [-.35,.35])cyl(.15,.15,.06,0xae7d54,x,y+dy,z,mapDecor);cyl(.02,.02,.2,0xd9a352,x,y-.48,z,mapDecor);}
function stationCounter(s){const group=new THREE.Group();group.position.set(s.x,0,s.z);roomScene(s.team).add(group);const isIsland=s.kind==='counter';box(2.08,.88,1.28,isIsland?0xc79461:activeMap.cabinet,0,.65,0,group);box(2.16,.18,1.42,0xf2dfb5,0,1.19,0,group);box(2.05,.12,1.27,0xd4bf94,0,.25,0,group);for(const x of [-.57,.57])box(.1,.24,.9,0x9c8863,x,.13,0,group);
if(s.kind!=='sink'&&s.kind!=='pot'){box(.91,.55,.035,isIsland?0xc99960:new THREE.Color(activeMap.cabinet).lerp(new THREE.Color(0xffffff),.12).getHex(),-.49,.7,.658,group);box(.91,.55,.035,isIsland?0xc99960:new THREE.Color(activeMap.cabinet).lerp(new THREE.Color(0xffffff),.12).getHex(),.49,.7,.658,group);box(.2,.045,.07,0xd9c691,-.49,.84,.7,group);box(.2,.045,.07,0xd9c691,.49,.84,.7,group)}if(s.team!==undefined){box(1.98,.11,.07,s.team===0?0xeaa05e:0x72a3bd,0,1.09,.735,group)}return group}
const binIconMaterials=new Map();
function binIcon(ingredient,parent){
 if(!binIconMaterials.has(ingredient)){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff4d4';ctx.strokeStyle='#836d47';ctx.lineWidth=9;ctx.beginPath();ctx.roundRect(8,8,240,240,38);ctx.fill();ctx.stroke();ctx.font='156px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(INGREDIENTS[ingredient].emoji,128,139);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;binIconMaterials.set(ingredient,new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));
 }
 const icon=new THREE.Mesh(new THREE.PlaneGeometry(.51,.46),binIconMaterials.get(ingredient));icon.position.set(0,.68,.736);parent.add(icon);
}
const stationGroups={},dynamicGroups={},potVisuals=[];
function buildStations(){
for(const group of Object.values(stationGroups)){group.parent?.remove(group);disposeTree(group)}
for(const key of Object.keys(stationGroups))delete stationGroups[key];
for(const key of Object.keys(dynamicGroups))delete dynamicGroups[key];
potVisuals.length=0;

for(const s of stations){if(s.kind==='trash'){const g=new THREE.Group();g.position.set(s.x,0,s.z);roomScene(s.team).add(g);box(.8,.85,.8,0x7d8c77,0,.56,0,g);box(.9,.12,.9,0xb3b7a0,0,1.04,0,g);box(.45,.025,.38,0x455d4f,0,1.115,0,g);for(const x of [-.27,.27])cyl(.09,.09,.18,0x3e5145,x,.15,0,g);stationGroups[s.id]=g;continue}
const g=stationCounter(s);stationGroups[s.id]=g;const dyn=new THREE.Group();dyn.position.y=1.31;g.add(dyn);dynamicGroups[s.id]=dyn;
if(s.kind==='source'){binIcon(s.ingredient,g);box(1.65,.14,1.05,0xb68a55,0,1.36,0,g);for(const z of [-.48,.48])box(1.65,.24,.09,0xcaa26a,0,1.51,z,g);for(const x of [-.81,.81])box(.09,.24,1.05,0xcaa26a,x,1.51,0,g);for(let i=0;i<6;i++){const f=food(s.ingredient);f.position.set((i%3-1)*.45,1.45,(Math.floor(i/3)-.5)*.43);f.rotation.y=i;g.add(f)}}
if(s.kind==='board'){box(1.4,.06,.85,0xc79963,0,1.32,0,g);box(.035,.035,.65,0xb48858,.6,1.36,0,g);const knife=box(.38,.04,.1,0xd6d9c8,.6,1.4,.1,g);knife.rotation.y=.3;box(.24,.06,.1,0x637363,.89,1.4,.02,g)}
if(s.kind==='pot'){let burner,potSoup;const steam=[];box(1.75,.10,1.1,0x606f63,0,1.34,0,g);for(const x of [-.43,.43]){cyl(.3,.3,.04,0x364e46,x,1.41,0,g);torus(.22,.03,0x7e8b7d,x,1.44,0,g)}burner=torus(.31,.045,0xf2a34e,0,1.44,0,g);cyl(.48,.38,.52,0x92aba4,0,1.7,0,g);torus(.47,.04,0xcbd6bf,0,1.97,0,g);for(const x of [-.6,.6])box(.26,.08,.18,0x455d57,x,1.83,0,g);potSoup=cyl(.42,.42,.03,0xd09c63,0,1.955,0,g);potSoup.visible=false;for(let i=0;i<8;i++){const puff=sphere(.11,0xfff9e7,0,2.1,0,g);puff.material=new THREE.MeshBasicMaterial({color:0xfffaeb,transparent:true,opacity:.4,depthWrite:false});puff.userData.disposeMaterial=true;puff.visible=false;steam.push(puff)}potVisuals.push({burner,potSoup,steam,team:s.team??0});}
if(s.kind==='sink'){box(1.5,.06,.97,0xa6b6a7,0,1.31,0,g);box(1.25,.045,.76,0x5f8784,0,1.35,0,g);box(1.05,.03,.58,0x8abbb7,0,1.38,0,g);cyl(.05,.05,.5,0x9fac9c,.62,1.58,-.39,g);const tap=torus(.18,.045,0xb6c4b3,.46,1.8,-.39,g);tap.rotation.x=0;box(.08,.12,.08,0xb6c4b3,.28,1.73,-.39,g)}
if(s.kind==='assembly'){box(1.7,.06,1,0xd9c5a1,0,1.33,0,g);box(.4,.07,.17,0xe2b96b,.6,1.42,-.25,g)}
if(s.kind==='grill'){box(1.8,.07,1.1,0x52665e,0,1.34,0,g);cyl(.48,.43,.10,0x394d46,0,1.44,0,g);box(.55,.07,.12,0x5e6654,.55,1.48,0,g)}
if(s.kind==='serve'){box(1.8,.07,1.05,0xedeacb,0,1.32,0,g);cyl(.15,.2,.11,0xd5af66,.65,1.43,0,g);sphere(.06,0x8e805a,.65,1.53,0,g,[1,.4,1]);box(2.15,.18,.15,0xe6a46f,0,1.43,.63,g)}
}
buildLabels();}
// Flowers and the entrance sign are part of the restaurant, on every map.
box(.7,.8,.07,0xb18b60,-5.7,.62,4.9).rotation.x=-.15;box(.58,.62,.08,0x4c6c56,-5.7,.65,4.86);for(let i=0;i<3;i++)box(.32,.018,.015,0xeadcc1,-5.7,.8-i*.14,4.8);
function chef(color,x,z){const root=new THREE.Group();root.position.set(x,.17,z);scene.add(root);const body=new THREE.Group();root.add(body);cyl(.29,.35,.6,0xfff4da,0,.76,0,body);box(.48,.43,.16,color,0,.68,.27,body);box(.48,.045,.17,0xf6deb5,0,.92,.28,body);for(const a of [-1,1]){const arm=sphere(.14,0xfff0d4,a*.37,.86,.06,body,[.9,1.4,1]);sphere(.105,0xe5b087,a*.39,.67,.16,body)}cyl(.10,.1,.2,0x55675b,-.16,.32,0,body);cyl(.10,.1,.2,0x55675b,.16,.32,0,body);const legs=[sphere(.14,0x3f5149,-.16,.20,.06,body,[.8,.65,1.4]),sphere(.14,0x3f5149,.16,.20,.06,body,[.8,.65,1.4])];sphere(.30,0xe5b087,0,1.25,.02,body,[1,.95,.92]);sphere(.12,0xe9ac80,0,1.22,.3,body,[.6,.6,.7]);for(const a of [-1,1]){sphere(.033,0x364c41,a*.11,1.31,.275,body,[.8,1.2,.6]);sphere(.055,0xdc946e,a*.19,1.19,.24,body,[1,.4,.25])}box(.12,.025,.035,0x75584a,0,1.12,.29,body);cyl(.31,.31,.16,0xfff9e9,0,1.52,0,body);for(const p of [[0,1.72,0],[-.19,1.68,0],[.19,1.68,0],[0,1.67,-.17]])sphere(.22,0xfff9e9,...p,body);const ring=torus(.43,.035,color,0,.025,0,root);const held=new THREE.Group();held.position.set(0,.95,.60);body.add(held);return{root,body,legs,ring,held,item:null,visualKey:'',x,z,dir:0,cooldown:0,dash:0,moving:false,work:false}}
const players=[chef(0xeaa05e,0,1.6),chef(0x72a3bd,-3,1.6)];players[1].root.visible=false;
const highlight=new THREE.Mesh(new THREE.BoxGeometry(2.23,.05,1.5),new THREE.MeshBasicMaterial({color:0xffd68e,transparent:true,opacity:.5}));highlight.position.y=1.3;highlight.visible=false;scene.add(highlight);
const stationNames={source:'NGUYÊN LIỆU',board:'THỚT',pot:'BẾP NẤU',sink:'BỒN RỬA',plates:'ĐĨA SẠCH',serve:'GIAO MÓN',trash:'RÁC',grill:'CHẢO NƯỚNG',assembly:'RÁP MÓN'};
const labels={};
function buildLabels(){
 $('#station-labels').replaceChildren();for(const key of Object.keys(labels))delete labels[key];
 for(const s of stations){if(s.kind==='counter')continue;const el=document.createElement('div');el.className='station-label';if(s.team!==undefined)el.classList.add(`team-${s.team}`);$('#station-labels').append(el);labels[s.id]=el;}
}
const keys=new Set();let last=performance.now(),elapsed=0,hudTime=0,nearby=null,lastDynamic='',lastOrders='',toastTimer,muted=false,audio;let showAllLabels=false;
let records={};try{records=JSON.parse(localStorage.getItem('kr-progress')||'{}')||{}}catch{}
function recordKey(options=selected){return `${options.mode}:${options.map}:${options.level}`;}
function getRecord(options=selected){const r=records[recordKey(options)]||{};return{best:Math.max(0,Number(r.best)||0),stars:Math.max(0,Math.min(3,Number(r.stars)||0))};}
function starsFor(score){return match.level.goals.filter(goal=>score>=goal).length;}
function totalStars(mode){return MAPS.reduce((sum,map)=>sum+LEVELS.reduce((n,_,level)=>n+getRecord({mode,map:map.id,level}).stars,0),0);}
try{muted=localStorage.getItem('kr-muted')==='1'}catch{}
function sound(freq=500,duration=.1){if(muted)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq,audio.currentTime);osc.frequency.exponentialRampToValueAtTime(freq*1.5,audio.currentTime+duration);gain.gain.setValueAtTime(.035,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration)}catch{}}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3200)}
const nearest=p=>nearestStation(p,stationsForTeam(stations,p.team??0)),collision=(x,z,p)=>collides(x,z,stationsForTeam(stations,p.team??0));
function interact(i){if(match.status!=='playing'||i===1&&match.bot)return;const p=players[i],s=nearest(p);if(s){p.dir=Math.atan2(s.x-p.x,s.z-p.z);if(gameFor(i).action(p,s))sound(420,.07)}else toast('Đến gần một quầy bếp để tương tác.');processEvents();updateHud();}
function keydown(e){
 const input=e.target instanceof HTMLSelectElement;if(input)return;
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','Numpad0','Slash'].includes(e.code)&&match.status==='playing')e.preventDefault();
 if(e.code==='Enter'&&coop&&!match.bot&&match.status==='playing')e.preventDefault();
 if(e.code==='KeyH'&&!e.repeat){e.preventDefault();toggleLabels();return;}
 if(e.code==='Escape'){if(!e.repeat)togglePause();return;}
 if(!$('#modal').hidden||match.status!=='playing')return;
 keys.add(e.code);if(e.repeat)return;if(e.code==='KeyE')interact(0);if(coop&&!match.bot&&e.code==='Enter')interact(1);if(e.code==='ShiftLeft')dash(0);if(coop&&!match.bot&&e.code==='ShiftRight')dash(1);
}
window.addEventListener('keydown',keydown);window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();if(match.status==='playing')showPause()});
function dash(i){const p=players[i];if(match.status==='playing'&&p.cooldown<=0){p.dash=.17;p.cooldown=1.1;sound(220,.08)}}
for(const btn of document.querySelectorAll('[data-key]')){btn.addEventListener('pointerdown',e=>{e.preventDefault();btn.setPointerCapture(e.pointerId);keys.add(btn.dataset.key);if(btn.dataset.key==='KeyE')interact(0)});for(const event of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(event,()=>keys.delete(btn.dataset.key))}
function animateChef(p,dt){
 p.root.position.set(p.x,.17,p.z);const delta=THREE.MathUtils.euclideanModulo(p.dir-p.body.rotation.y+Math.PI,Math.PI*2)-Math.PI;p.body.rotation.y+=delta*Math.min(1,dt*16);
 p.body.position.y=p.moving?Math.abs(Math.sin(elapsed*14))*.08:p.work?Math.sin(elapsed*22)*.035:Math.sin(elapsed*2.5)*.012;p.body.rotation.z=p.moving?Math.sin(elapsed*14)*.035:0;
 p.legs[0].position.z=p.moving?Math.sin(elapsed*14)*.12+.06:.06;p.legs[1].position.z=p.moving?-Math.sin(elapsed*14)*.12+.06:.06;p.held.rotation.x=p.work?Math.sin(elapsed*20)*.2:0;
}
function movePlayer(p,i,dt){
 if(match.status!=='playing')return;p.cooldown=Math.max(0,p.cooldown-dt);p.dash=Math.max(0,p.dash-dt);
 let dx=Number(keys.has(i===0?'KeyD':'ArrowRight'))-Number(keys.has(i===0?'KeyA':'ArrowLeft'));
 let dz=Number(keys.has(i===0?'KeyS':'ArrowDown'))-Number(keys.has(i===0?'KeyW':'ArrowUp'));p.moving=!!(dx||dz);p.work=false;
 if(p.moving){const len=Math.hypot(dx,dz);dx/=len;dz/=len;const worldX=dx*.868+dz*.496,worldZ=-dx*.496+dz*.868,speed=(p.dash>0?10.5:3.8)*speedMultiplier(p,activeMap);const nx=p.x+worldX*speed*dt,nz=p.z+worldZ*speed*dt;if(!collision(nx,p.z,p))p.x=nx;if(!collision(p.x,nz,p))p.z=nz;p.dir=Math.atan2(worldX,worldZ)}
 else if(keys.has(i===0?'Space':'Numpad0')||i===1&&keys.has('Slash')){const s=nearest(p);p.work=gameFor(i).work(p,s,dt);if(p.work&&s)p.dir=Math.atan2(s.x-p.x,s.z-p.z)}
 animateChef(p,dt);
}
function replaceGroup(g){while(g.children.length){const o=g.children[0];g.remove(o);disposeTree(o)}}
function stationGame(s){return match.games[s.team??0];}
function updateDynamic(){
 const key=JSON.stringify(match.games.map(g=>[g.board&&{ingredient:g.board.ingredient,done:g.board.progress>=1},g.pot.ingredients,g.pot.burnt,g.pot.ready,g.plates,g.dirty,g.counters,g.grill,g.assembly]));
 if(key!==lastDynamic){lastDynamic=key;
  for(const s of stations){const g=dynamicGroups[s.id];if(!g||!['board','plates','sink','counter','grill','assembly'].includes(s.kind))continue;replaceGroup(g);const state=stationGame(s);
   if(s.kind==='board'&&state.board){const f=food(state.board.ingredient,state.board.progress>=1);f.position.y=.06;g.add(f)}
   if(s.kind==='plates'){const count=state.plates;for(let i=0;i<count;i++)plate(g,0,.04+i*.055,0);}
   if(s.kind==='sink'){const count=state.dirty;for(let i=0;i<Math.min(count,7);i++){const d=plate(g,.18,.1+i*.055,.08);cyl(.22,.22,.01,0xa98e60,0,.05,0,d)}}
   if(s.kind==='assembly'&&state.assembly)g.add(itemMesh(state.assembly));
   if(s.kind==='grill'&&state.grill.item){const f=itemMesh(state.grill.ready?{kind:'cooked',ingredient:'beef'}:state.grill.item);f.position.y=.18;g.add(f);}
   if(s.kind==='counter'&&state.counters[s.id])g.add(itemMesh(state.counters[s.id]));
  }
  for(const v of potVisuals){const pot=match.games[v.team].pot;v.potSoup.visible=pot.ingredients.length>0;const recipe=RECIPES.find(r=>[...r.ingredients].sort().join()===[...pot.ingredients].sort().join());v.potSoup.material=mat(recipe?.color||INGREDIENTS[pot.ingredients[0]]?.color||0xd09c63);}
 }
 for(const p of players){const key=JSON.stringify(p.item);if(key!==p.visualKey){p.visualKey=key;replaceGroup(p.held);if(p.item)p.held.add(itemMesh(p.item))}}
}
function itemName(item){if(!item)return'Tay không';if(item.kind==='plate')return'Đĩa sạch';if(item.kind==='meal')return RECIPES.find(r=>r.id===item.recipe).name;return`${INGREDIENTS[item.ingredient].name}${item.kind==='chopped'?' đã thái':item.kind==='cooked'?' đã nướng':''}`}
function updateHud(){
 const seconds=Math.ceil(match.time);$('#timer').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;$('#timer').style.color=seconds<=30?'#d27a55':'';
 $('#combo-display').textContent=`COMBO ×${(1+Math.min(game.combo,5)*.2).toFixed(1)}${game.rush?' · CAO ĐIỂM +25%':''}`;$('#combo-display').classList.toggle('rush',game.rush);$('#score').textContent=game.score;$('#served').textContent=String(game.served).padStart(2,'0');$('#carrying').textContent=itemName(players[0].item);
 const target=match.level.goals[2];$('#goal-current').textContent=`${game.score}đ`;$('#goal-fill').style.width=`${Math.min(game.score/target*100,100)}%`;const stars=starsFor(game.score);$('#stars').textContent='★ '.repeat(stars)+'☆ '.repeat(3-stars);
 const state=match.games[orderTeam]||game;$('#order-count').textContent=`${state.orders.length}/3`;
 const orderKey=`${orderTeam}:`+state.orders.map(o=>o.id).join();if(orderKey!==lastOrders){lastOrders=orderKey;$('#orders').innerHTML=state.orders.map(o=>{const r=RECIPES.find(r=>r.id===o.recipe);return`<article class="ticket" data-order="${o.id}"><div class="ticket-header"><span>${o===state.orders[0]?'① ƯU TIÊN':'ĐƠN #'+String(o.id).padStart(2,'0')}</span><b>+${r.value}đ</b></div><div class="ticket-dish"><span class="dish-emoji">${r.emoji}</span><div><h3>${r.name}</h3><small>${r.steps}</small></div></div><div class="ingredients">${r.ingredients.map(t=>`<span class="ingredient" title="${INGREDIENTS[t].name}">${INGREDIENTS[t].emoji}</span>`).join('')}</div><div class="ticket-time"><i></i></div></article>`}).join('')}
 for(const o of state.orders){const el=document.querySelector(`[data-order="${o.id}"]`);el.classList.toggle('urgent',o.time<25);el.querySelector('.ticket-time i').style.width=`${o.time/o.total*100}%`;el.title=`Còn ${Math.ceil(o.time)} giây`}
 if(versus){const rival=match.games[1];$('#team0-score').textContent=game.score;$('#team1-score').textContent=rival.score;$('#team0-detail').textContent=`${game.served} món · ${game.plates} đĩa`;$('#team1-detail').textContent=`${rival.served} món · ${rival.plates} đĩa`;
  $('#battle-status').textContent=game.score===rival.score?'NGANG TÀI':game.score>rival.score?'BẠN ĐANG DẪN TRƯỚC':'ĐỐI THỦ ĐANG DẪN';$('#bot-status').textContent=match.bot?match.bot.label:'Mũi tên · Enter · /';
 }
 renderer.domElement.dataset.state=JSON.stringify({status:match.status,mode:selected.mode,map:selected.map,level:selected.level+1,time:Math.round(match.time),players:players.map(p=>({x:+p.x.toFixed(3),z:+p.z.toFixed(3),item:p.item,team:p.team})),teams:match.games.map(g=>({score:g.score,served:g.served,pot:g.pot,board:g.board,plates:g.plates,dirty:g.dirty,grill:g.grill,assembly:g.assembly})),bot:match.bot?.label});updateDynamic();
}
function viewRects(){const w=wrap.clientWidth,h=wrap.clientHeight;if(!versus)return[{x:0,y:0,w,h}];return w>=900?[{x:0,y:0,w:w/2,h},{x:w/2,y:0,w:w/2,h}]:[{x:0,y:0,w,h:h/2},{x:0,y:h/2,w,h:h/2}];}
const viewCameras=[camera,camera.clone()];
function project(x,y,z,team=0){const rect=viewRects()[versus?team:0],v=new THREE.Vector3(x,y,z).project(viewCameras[versus?team:0]);return{x:rect.x+(v.x*.5+.5)*rect.w,y:rect.y+(-v.y*.5+.5)*rect.h};}
function renderRooms(){renderer.setScissorTest(true);const rects=viewRects();for(let i=0;i<rects.length;i++){const r=rects[i],y=wrap.clientHeight-r.y-r.h;renderer.setViewport(r.x,y,r.w,r.h);renderer.setScissor(r.x,y,r.w,r.h);renderer.render(i===0?scene:rivalScene,viewCameras[i]);}renderer.setScissorTest(false);}

function toggleLabels(){showAllLabels=!showAllLabels;$('#labels-toggle').setAttribute('aria-pressed',String(showAllLabels));$('#labels-toggle').textContent=showAllLabels?'H · Tên quầy':'H · Nhãn gọn';updateLabels();}
$('#labels-toggle').onclick=toggleLabels;
function updateLabels(){
 const focusedIds=new Set();if(match.status==='playing'){for(let i=0;i<(coop&&!match.bot?2:1);i++){const target=nearest(players[i]);if(target)focusedIds.add(target.id)}}
 for(const s of stations){
  const el=labels[s.id];if(!el)continue;const state=stationGame(s),focused=focusedIds.has(s.id),full=showAllLabels||focused;
  let text=s.ingredient?`${INGREDIENTS[s.ingredient].emoji} ${INGREDIENTS[s.ingredient].name}`:stationNames[s.kind],progress=null,alert=false,active=false;
  if(s.kind==='board'&&state.board){active=state.board.progress>0;progress=state.board.progress; text=full?(progress>=1?'✓ Đã thái':`Thái · ${Math.round(progress*100)}%`):progress>=1?'✓':'🔪';}
  if(s.kind==='pot'){
   active=state.pot.ingredients.length===2;alert=state.pot.burnt;
   if(alert){text=full?'🔥 Nồi cháy · giữ Space':'🔥';progress=state.pot.fireWork;}
   else if(state.pot.ready)text=full?'✓ Súp đã chín':'✓ 🍲';
   else if(active){text=full?'Đang nấu':'🍲';progress=state.pot.time/state.config.cookTime;}
   else text=`Nồi súp · ${state.pot.ingredients.length}/2`;
  }
  if(s.kind==='grill'){
   active=!!state.grill.item;alert=state.grill.burnt;
   text=alert?(full?'🔥 Chảo cháy · giữ Space':'🔥'):state.grill.ready?(full?'✓ Thịt đã chín':'✓ 🥩'):full?'Chảo nướng':'🍳';
   if(active&&!alert)progress=Math.min(1,state.grill.time/7);if(alert)progress=state.grill.fireWork;
  }
  if(s.kind==='plates')text=`Đĩa sạch · ${state.plates}`;
  if(s.kind==='sink'){text=`Bồn rửa · ${state.dirty} đĩa bẩn`;if(state.wash>0){active=true;progress=state.wash;if(!full)text='🫧';}}
  if(s.kind==='assembly'&&state.assembly){const meal=matchAssembly(state.assembly.components);active=!!meal;text=full?(meal?'✓ '+meal.name:`Ráp món · ${state.assembly.components.length} phần`):'✓ '+meal?.emoji;}
  el.hidden=!full&&!active&&!alert;if(el.hidden)continue;
  el.classList.toggle('near',focused);el.classList.toggle('status-only',!full);el.classList.toggle('alert',alert);
  const pos=project(s.x,s.kind==='pot'?2.5:2.05,s.z,s.team??0);el.style.left=pos.x+'px';el.style.top=pos.y+'px';
  el.innerHTML=text+(progress!==null?`<span class="progress"><i style="width:${Math.min(1,progress)*100}%"></i></span>`:'');
 }
 const hint=$('#context-hint');if(match.status==='playing'&&nearby){hint.style.display='block';hint.innerHTML=contextHint(nearby,players[0]);}else hint.style.display='none';
}

function contextHint(s,p){
 let key='E',text='';if(s.team!==undefined&&s.team!==p.team)return '● Quầy xanh của đối thủ';const state=gameFor(0);
 if(s.kind==='source')text=`Lấy ${INGREDIENTS[s.ingredient].name.toLowerCase()}`;
 if(s.kind==='board'){if(state.board&&!p.item){key=state.board.progress<1?'SPACE':'E';text=state.board.progress<1?'Giữ để thái nguyên liệu':'Lấy nguyên liệu đã thái'}else text='Đặt nguyên liệu lên thớt'}
 if(s.kind==='pot'){key=state.pot.burnt?'SPACE':'E';text=state.pot.burnt?'Giữ để dập lửa':state.pot.ready?'Múc súp vào đĩa':state.pot.ingredients.length===2?'Súp đang nấu…':'Cho nguyên liệu đã thái vào nồi'}
 if(s.kind==='plates')text='Lấy đĩa sạch của bạn';if(s.kind==='sink'){key='SPACE';text='Giữ để rửa đĩa của bạn'}if(s.kind==='grill'){key=state.grill.burnt?'SPACE':'E';text=state.grill.burnt?'Giữ để dập lửa':state.grill.ready?'Lấy thịt đã nướng':'Đặt thịt đã thái vào chảo'}if(s.kind==='assembly')text='Đặt đĩa / thêm nguyên liệu / lấy món';if(s.kind==='serve')text='Giao món cho khách';if(s.kind==='trash')text='Bỏ đồ đang cầm';if(s.kind==='counter')text=p.item?'Đặt đồ lên bàn':'Lấy đồ trên bàn';return`<kbd>${key}</kbd>${text}`;
}
function processEvents(){
 for(let team=0;team<match.games.length;team++)for(const e of match.games[team].events.splice(0)){
  if(e.type==='end'){if(!resultShown)endGame();continue}
  const name=team===0?'Bạn':match.bot?'Bot':'Người 2';if(team===0||e.type==='serve'||e.type==='fire')toast(team===0?e.text:`${name}: ${e.text}`);
  if(e.type==='serve'){sound(team===0?660:460,.25);const s=stationsForTeam(stations,team).find(s=>s.kind==='serve'),pos=project(s.x,2.4,s.z,team);const f=document.createElement('div');f.className=`floating-score ${team===1?'rival-score':''}`;f.textContent=`${versus?name+' ':''}+${e.points}đ`;f.style.left=pos.x+'px';f.style.top=pos.y+'px';$('#floaters').append(f);setTimeout(()=>f.remove(),1700)}
  if(team===0&&(e.type==='chop'||e.type==='wash'))sound(750,.15);if(e.type==='fire'||e.type==='miss')sound(150,.3);if(e.type==='ready')sound(950,.2);
 }
}
function resize(){const w=wrap.clientWidth,h=wrap.clientHeight;renderer.setSize(w,h);const rects=viewRects();for(let i=0;i<rects.length;i++){const c=viewCameras[i],r=rects[i],aspect=r.w/r.h,halfHeight=Math.max(8.7,11.7/aspect);c.left=-halfHeight*aspect;c.right=halfHeight*aspect;c.top=halfHeight;c.bottom=-halfHeight;c.position.set(10.5,20,18);c.lookAt(0,.2,0);c.updateProjectionMatrix();}$('#room-titles').hidden=!versus;$('#room-titles').classList.toggle('stacked',versus&&w<900);updateLabels();}

new ResizeObserver(resize).observe(wrap);
function syncMatchUi(){
 $('h1').innerHTML=`${activeMap.name}<span>${activeMap.icon}</span>`;$('.level-bar .eyebrow').textContent=`MAP ${MAPS.indexOf(activeMap)+1} · LEVEL ${selected.level+1} · ${match.level.name.toUpperCase()}`;
 $('.level-pill').innerHTML=`<span class="live-dot"></span> ${activeMap.short} <i>/</i> ${selected.level+1}–3`;
 $('#mode').innerHTML=`<span>●</span> ${MODES[selected.mode].name.toUpperCase()} <small>⌄</small>`;$('#mode').setAttribute('aria-label','Chọn chế độ và bản đồ');
 document.body.classList.toggle('dual-kitchens',versus);$('#room-rival-title').textContent=match.bot?'BẾP CHEF BOT':'BẾP NGƯỜI 2';$('#battle-bar').hidden=!versus;$('#order-teams').hidden=!versus;$('#p2-controls').hidden=!coop||!!match.bot;
 $('.shift-heading h2').textContent=match.level.name;$('.shift-heading>span').textContent=activeMap.icon;$('.shift-panel>p').textContent=activeMap.subtitle;
 $('#goal-target').textContent=`${match.level.goals[2]}đ`;document.querySelectorAll('.goals b').forEach((el,i)=>el.textContent=`${match.level.goals[i]}đ`);
 $('#rival-name').textContent=match.bot?'CHEF BOT':'NGƯỜI 2';$('#rival-orders').textContent=match.bot?'Đơn của bot':'Đơn người 2';$('#battle-kind').textContent=match.bot?`ĐẤU BOT · ${BOT_DIFFICULTIES[selected.difficulty].name.toUpperCase()}`:'PVP · CÙNG BÀN PHÍM';
 $('#progress-count').textContent=`${totalStars(selected.mode)}/27 ★`;readBest();
}
function startGame(options=selected){
 match=new KitchenMatch(options);selected={...match.options};game=match.games[0];stations=match.stations;activeMap=match.map;versus=match.competitive;coop=selected.mode!=='solo';orderTeam=0;resultShown=false;lastDynamic='';lastOrders='';
 for(let i=0;i<players.length;i++){const p=players[i],spawn=activeMap.spawn[i];Object.assign(p,{item:null,x:spawn.x,z:spawn.z,cooldown:0,dash:0,dir:0,visualKey:'reset',moving:false,work:false,team:versus?i:0});roomScene(versus?i:0).add(p.root);p.root.visible=i===0||coop;p.root.position.set(p.x,.17,p.z);p.body.rotation.y=0;}
 buildStations();applyTheme();syncMatchUi();resize();selectOrderTeam(0);match.start();keys.clear();$('#start-card').hidden=true;$('#modal').hidden=true;$('#touch-controls').classList.toggle('active',matchMedia('(pointer:coarse)').matches);$('#floaters').replaceChildren();
 toast(versus?'Hai căn bếp riêng! Mỗi bên tự chuẩn bị, nấu và ráp món. Điểm cao hơn thắng.':`${activeMap.name} · ${match.level.name}. Vào bếp thôi!`);sound(550,.2);updateHud();updateLabels();
}
function modal(content){keys.clear();$('#modal-content').innerHTML=content;$('#modal').hidden=false;$('#modal .close-modal').focus()}
function showPause(){if(match.status!=='playing')return;match.status='paused';modal('<span class="eyebrow">NGHỈ TAY MỘT CHÚT</span><h2>Cả căn bếp cùng nghỉ.</h2><p>Thời gian, nồi súp và bot đều đang tạm dừng.</p><button class="primary-btn" id="resume">Nấu tiếp thôi <span>↗</span></button><button class="secondary-btn" id="change-match">Đổi chế độ / bản đồ</button><button class="secondary-btn" id="restart">Chơi lại màn này</button>');$('#resume').onclick=closeModal;$('#restart').onclick=()=>startGame();$('#change-match').onclick=openSetup;}
function closeModal(){$('#modal').hidden=true;if(match.status==='paused')match.status='playing';if(match.status==='ended'){$('#start-card').hidden=false;$('#start-card h2').textContent='Thêm một trận nữa?'}keys.clear()}
function togglePause(){if(!$('#modal').hidden){closeModal();return}showPause()}
let draft={...selected};
function openSetup(){if(match.status==='playing')match.status='paused';draft={...selected};renderSetup();}
function renderSetup(focusSelector){
 const map=getMap(draft.map),level=LEVELS[draft.level],competitive=draft.mode==='pvp'||draft.mode==='bot';
 modal(`<div class="setup"><div class="setup-title"><div><span class="eyebrow">KITCHEN RUSH · CHỌN TRẬN ĐẤU</span><h2>Bếp mới. Đối thủ mới.</h2></div><span class="progress-badge">${totalStars(draft.mode)} / 27 ★</span></div>
 <div class="setup-section-label">01 <b>CHẾ ĐỘ CHƠI</b></div><div class="mode-grid">${Object.entries(MODES).map(([id,m])=>`<button class="mode-card ${draft.mode===id?'selected':''}" data-mode="${id}" aria-pressed="${draft.mode===id}"><span>${m.icon}</span><strong>${m.name}</strong><small>${m.description}</small></button>`).join('')}</div>
 <div class="setup-section-label">02 <b>CHỌN CĂN BẾP</b><span>3 bản đồ · 9 màn chơi</span></div><div class="map-grid">${MAPS.map((m,i)=>`<button class="map-card ${draft.map===m.id?'selected':''}" data-map="${m.id}" aria-pressed="${draft.map===m.id}"><span class="map-art map-${m.id}"><i></i><i></i><i></i><b>${m.icon}</b></span><span class="map-meta"><small>0${i+1}</small><strong>${m.name}</strong><em>${LEVELS.reduce((sum,_,level)=>sum+getRecord({mode:draft.mode,map:m.id,level}).stars,0)}/9 ★</em></span></button>`).join('')}</div>
 <p class="map-description">${map.icon} ${map.subtitle}</p><div class="setup-bottom"><div class="level-picker"><div class="setup-section-label">03 <b>LEVEL</b></div><div class="level-buttons">${LEVELS.map((l,i)=>`<button data-level="${i}" class="${draft.level===i?'selected':''}" aria-pressed="${draft.level===i}"><b>0${i+1}</b><span>${l.name}<small>${'★'.repeat(getRecord({...draft,level:i}).stars)||l.tag}</small></span></button>`).join('')}</div></div>${draft.mode==='bot'?`<label class="bot-difficulty">TRÌNH ĐỘ BOT<select id="bot-difficulty">${Object.entries(BOT_DIFFICULTIES).map(([id,d])=>`<option value="${id}" ${draft.difficulty===id?'selected':''}>${d.name}</option>`).join('')}</select><small>Bot tự đi, thái, nấu và rửa đĩa.</small></label>`:''}</div>
 <div class="match-brief"><span><b>${Math.floor(level.duration/60)}:${String(level.duration%60).padStart(2,'0')}</b> phút / trận</span><span><b>${level.patience}s</b> mỗi đơn</span><span><b>${competitive?'ĐIỂM CAO THẮNG':level.goals[2]+'đ → ★★★'}</b></span></div>
 <p class="setup-controls">${draft.mode==='pvp'||draft.mode==='coop'?'P1: WASD · E · Space &nbsp; | &nbsp; P2: Mũi tên · Enter · /':'WASD di chuyển · E lấy / đặt · giữ Space để thao tác'}${competitive?'<br>Hai bếp tách biệt, đầy đủ nguyên liệu, chảo, bàn ráp, đĩa và bồn rửa riêng; hai bên nhận cùng chuỗi công thức.':''}</p><button class="primary-btn" id="begin-match">${competitive?'Bắt đầu so tài':'Vào bếp thôi'} <span>↗</span></button></div>`);
 for(const el of document.querySelectorAll('[data-mode]'))el.onclick=()=>{draft.mode=el.dataset.mode;renderSetup(`[data-mode="${draft.mode}"]`)};
 for(const el of document.querySelectorAll('[data-map]'))el.onclick=()=>{draft.map=el.dataset.map;renderSetup(`[data-map="${draft.map}"]`)};
 for(const el of document.querySelectorAll('[data-level]'))el.onclick=()=>{draft.level=Number(el.dataset.level);renderSetup(`[data-level="${draft.level}"]`)};
 if($('#bot-difficulty'))$('#bot-difficulty').onchange=e=>draft.difficulty=e.target.value;
 $('#begin-match').onclick=()=>startGame(draft);if(focusSelector)$(focusSelector)?.focus();
}
function endGame(){
 resultShown=true;const stars=starsFor(game.score),record=getRecord();records[recordKey()]={best:Math.max(game.score,record.best),stars:Math.max(stars,record.stars)};try{localStorage.setItem('kr-progress',JSON.stringify(records))}catch{}readBest();$('#progress-count').textContent=`${totalStars(selected.mode)}/27 ★`;
 const result=match.result,rivalName=match.bot?'Chef Bot':'Người 2';const heading=result?(result.winner===null?'Ngang tài ngang sức!':result.winner===0?'Bạn thắng trận này!':`${rivalName} thắng trận này!`):stars===3?'Ngôi sao căn bếp!':stars?'Một ca làm thật ngon!':'Mỗi đầu bếp đều có ngày đầu tiên.';
 const nextIndex=(MAPS.indexOf(activeMap)*3+selected.level+1)%9;
 modal(`<span class="eyebrow">${activeMap.name.toUpperCase()} · LEVEL ${selected.level+1} · HẾT GIỜ</span><h2>${heading}</h2>${result?`<div class="result-versus"><div class="${result.winner===0?'winner':''}"><span>BẠN · CAM</span><strong>${result.scores[0]}<small>đ</small></strong><p>${result.served[0]} món đã giao</p></div><b>VS</b><div class="${result.winner===1?'winner':''}"><span>${rivalName.toUpperCase()} · XANH</span><strong>${result.scores[1]}<small>đ</small></strong><p>${result.served[1]} món đã giao</p></div></div><p>Thắng thua tính theo tổng điểm khi hết giờ. Hai bên bằng điểm sẽ hòa.</p>`:`<div class="stars">${'★ '.repeat(stars)+'☆ '.repeat(3-stars)}</div><div class="result-score">${game.score}<small>đ</small></div><p>Đã phục vụ <b>${game.served} món</b>, bỏ lỡ ${game.missed} đơn.<br>Tiến độ ${MODES[selected.mode].name}: ${totalStars(selected.mode)}/27 sao.</p>`}<button class="primary-btn" id="again">${result?'Tái đấu':'Chơi lại màn này'} <span>↗</span></button><button class="secondary-btn" id="next-level">${nextIndex===0?'Chọn màn khác':`Màn tiếp theo · ${MAPS[Math.floor(nextIndex/3)].name} ${nextIndex%3+1}`}</button><button class="text-btn" id="back-maps">Đổi chế độ / bản đồ</button>`);
 $('#again').onclick=()=>startGame();$('#next-level').onclick=()=>{if(nextIndex===0)openSetup();else startGame({...selected,map:MAPS[Math.floor(nextIndex/3)].id,level:nextIndex%3})};$('#back-maps').onclick=openSetup;
}
function selectOrderTeam(team){orderTeam=team;lastOrders='';for(const el of document.querySelectorAll('[data-order-team]')){const selected=Number(el.dataset.orderTeam)===team;el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected))}updateHud()}
for(const el of document.querySelectorAll('[data-order-team]'))el.onclick=()=>selectOrderTeam(Number(el.dataset.orderTeam));
$('#start').onclick=openSetup;$('#pause').onclick=togglePause;$('.close-modal').onclick=closeModal;$('#mode').onclick=openSetup;
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});
$('#help').onclick=()=>{if(match.status==='playing')match.status='paused';modal(`<span class="eyebrow">CẨM NANG ĐẦU BẾP · PHIÊN BẢN 3</span><h2>Nấu ngon. So tài. Đi xa hơn.</h2><ol><li><b>Lấy → thái:</b> E để lấy nguyên liệu, E đặt lên thớt, giữ Space để thái, E lấy lại.</li><li><b>Nấu → giao:</b> cho 2 nguyên liệu đã thái đúng công thức vào nồi. Lấy đĩa sạch → E tại nồi đã chín → E ở quầy giao món.</li><li><b>Salad:</b> đặt đĩa lên bàn ráp, thêm xà lách và cà chua đã thái. E tay không lấy món.</li><li><b>Burger:</b> thái thịt bò → nướng chảo 7 giây → ráp với bánh mì và cà chua thái trên đĩa.</li><li><b>Combo:</b> giao đơn đầu danh sách để tăng hệ số, giao lệch thứ tự hoặc để khách bỏ đi sẽ mất chuỗi. Cao điểm mỗi 45 giây thưởng thêm 25% trong 12 giây.</li><li><b>Dọn bếp:</b> tay không, giữ Space tại bồn để rửa đĩa hoặc tại nồi cháy để dập lửa. Súp chín để lâu sẽ cháy.</li><li><b>Thi đấu:</b> P1 ở bếp trái, P2 / bot ở bếp phải. Hai bếp hoàn toàn tách biệt. Mỗi bên có đơn, đĩa, combo và điểm riêng. Cùng thời gian, cùng chuỗi công thức; điểm cao hơn thắng, bằng điểm là hòa.</li><li><b>9 màn:</b> 3 map × 3 level. Level cao giảm thời gian và hạn đơn. Bến cảng có sàn ướt làm chậm bước chân; chợ đêm đổi bố trí quầy.</li></ol><p><b>P1:</b> WASD · E · Space · Shift trái.<br><b>P2:</b> Mũi tên · Enter · / hoặc Numpad 0 · Shift phải.<br><b>Esc:</b> tạm dừng cả hai bên và bot.<br>PvP và đồng đội chơi cùng máy, cùng bàn phím.</p><button class="primary-btn" id="got-it">Đã hiểu <span>↗</span></button>`);$('#got-it').onclick=closeModal};
$('#recipes').onclick=()=>{if(match.status==='playing')match.status='paused';modal(`<span class="eyebrow">SỔ TAY MÓN · 3 CÁCH CHẾ BIẾN</span><h2>Mỗi món, một nhịp bếp.</h2><div class="recipe-book">${RECIPES.map(r=>`<article><b>${r.emoji} ${r.name}</b><span>${r.ingredients.map(i=>INGREDIENTS[i].emoji).join(' + ')}</span><p>${r.family==='soup'?'Thái 2 phần → cho vào nồi → chờ chín → cầm đĩa múc súp.':r.family==='salad'?'Đặt đĩa sạch lên bàn ráp. Thêm xà lách thái + cà chua thái. E tay không lấy món.':'Đặt đĩa sạch lên bàn ráp. Thái thịt bò → nướng chảo 7 giây. Ráp thịt chín + bánh mì + cà chua thái. E tay không lấy bánh.'}</p></article>`).join('')}</div><p>Giao đơn đầu danh sách để tăng combo. Nồi và chảo đều có thể cháy. Tay không, giữ Space để dập lửa.</p><button class="primary-btn" id="close-book">Nhớ rồi, nấu thôi <span>↗</span></button>`);$('#close-book').onclick=closeModal};
function syncSound(){$('#sound').textContent=muted?'♪̸':'♫';$('#sound').setAttribute('aria-pressed',String(!muted))}
$('#sound').onclick=()=>{muted=!muted;try{localStorage.setItem('kr-muted',muted?'1':'0')}catch{}syncSound();if(!muted)sound(600,.2)};syncSound();
function readBest(){$('#best').textContent=getRecord().best}
const tips=['<b>Salad</b>: đặt đĩa lên bàn ráp, thêm xà lách và cà chua đã thái. E tay không để lấy.','<b>Burger</b>: thái thịt bò, nướng 7 giây, ráp trên đĩa với bánh mì và cà chua thái.','<b>Combo</b>: giao đơn đầu tiên để tăng hệ số. Cao điểm mỗi 45 giây thưởng thêm 25%.','<b>Thi đấu</b>: hai căn bếp riêng, đầy đủ nguyên liệu và dụng cụ mỗi bên.','<b>Bot biết tự nấu!</b> Chọn Tập sự, Đầu bếp hoặc Bếp trưởng trong menu trận đấu.','<b>3 map × 3 level</b>. Đổi bản đồ bằng nút chế độ trên góc phải căn bếp.','<b>Bến cảng</b> có sàn ướt: đi vòng hoặc lướt qua để tiết kiệm thời gian.','Rửa đĩa sau khi giao món. Cả <b>người chơi lẫn bot</b> đều cần đĩa sạch.'];
let tipIndex=0;setInterval(()=>{$('#tip').innerHTML=tips[tipIndex++%tips.length]},14000);
function animate(now){
 requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;
 if(match.status==='playing'){match.tick(dt,players);if(match.status==='playing'){movePlayer(players[0],0,dt);if(coop){if(match.bot)animateChef(players[1],dt);else movePlayer(players[1],1,dt)}}nearby=nearest(players[0]);highlight.visible=!!nearby;if(nearby)highlight.position.set(nearby.x,1.315,nearby.z);processEvents()}else highlight.visible=false;
 if(match.status==='ready')players[0].body.position.y=Math.sin(elapsed*2.5)*.018;
 for(const v of potVisuals){const pot=match.games[v.team].pot,cooking=pot.ingredients.length===2;for(let i=0;i<v.steam.length;i++){const puff=v.steam[i];puff.visible=cooking;const t=(elapsed*.48+i/8)%1;puff.position.set(Math.sin(i*7+t*2)*.22,2.05+t*1.2,Math.cos(i*4+t*2)*.18);puff.scale.setScalar(.5+t);puff.material.opacity=(1-t)*.4;puff.material.color.set(pot.burnt?0x6b5140:0xfffaeb)}v.burner.material=mat(pot.burnt?0xe46b38:cooking?0xf2a34e:0x8d9078);v.burner.scale.setScalar(pot.burnt?1+Math.sin(elapsed*18)*.15:1);}
 hudTime+=dt;if(hudTime>.1){updateHud();updateLabels();hudTime=0}renderRooms();
}
$('#start-card .mini-spark').textContent='✦ 9 MÀN · 3 BẢN ĐỒ · PVP & BOT';$('#start-card h2').textContent='Bếp mới. Trận mới.';$('#start-card p').textContent='Nấu cùng bạn. Đấu tay đôi. Thách thức bot.';$('#start').innerHTML='Chọn trận đấu <span>↗</span>';
players.forEach(p=>p.team=0);buildStations();applyTheme();syncMatchUi();updateHud();resize();requestAnimationFrame(animate);
