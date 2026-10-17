import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createPresentation,batchStatic} from './presentation.js';
import {INGREDIENTS,RECIPES,matchAssembly} from './engine.js';
import {ItemHandling} from './handling.js';
import {KitchenMatch} from './match.js';
import {MAPS,LEVELS,MODES,getMap,stationsForTeam} from './levels.js';
import {KitchenEffects} from './effects.js';
import {createStageDecor} from './stage-decor.js';
import {stagePreview} from './stage-preview.js';
import {createTouchControls,mergeTouch} from './touch.js';
import {snapshot,applySnapshot} from './sync.js';
import {CONTROLS,readInput,inputEdges,activeSeats} from './controls.js';
import {getStage,isStageUnlocked,STAGES} from './stages.js';
import {BOT_DIFFICULTIES} from './bot.js';
import {nearestStation} from './navigation.js';
import {stepChef,requestDash,resetMotion,stopDash,DASH_COOLDOWN} from './movement.js';
const $=s=>document.querySelector(s),wrap=$('#canvas-wrap');
let selected={mode:'solo',map:'sunny',level:0,difficulty:'normal'},match=new KitchenMatch(selected),game=match.games[0],stations=match.stations,activeMap=match.map,versus=false,coop=false,orderTeam=0,resultShown=false;
let network=null,networkTick=0,receivedRound=null;
const isGuest=()=>network?.role==='client';
let controlledChef=0;
let handling=new ItemHandling(stations,match.kitchen);
const gameFor=i=>match.gameFor(i);
const scene=new THREE.Scene();scene.background=new THREE.Color('#0c1830');scene.fog=new THREE.Fog('#0c1830',38,78);
const camera=new THREE.OrthographicCamera(-12,12,10,-10,.1,100);camera.position.set(10.5,18,18);camera.lookAt(0,0,0);
let quality='balanced';try{quality=localStorage.getItem('kr-quality')||'balanced'}catch{}if(!['light','balanced','high'].includes(quality))quality='balanced';
let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch(e){$('#start-card').innerHTML='<h2>Cần WebGL để chơi</h2><p>Hãy mở game trong Chrome, Edge hoặc Safari và bật tăng tốc phần cứng.</p>';throw e}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;wrap.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xa5baff,0x101c35,.72));const sun=new THREE.DirectionalLight(0xffe3c5,2.15);sun.position.set(-5,16,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-14,right:14,top:12,bottom:-12,near:1,far:38});sun.shadow.normalBias=.035;sun.shadow.bias=-.00015;sun.shadow.radius=3.5;scene.add(sun);
const fill=new THREE.DirectionalLight(0x44cfdf,.7);fill.position.set(8,6,-8);scene.add(fill);
const roomScene=()=>scene;
const colorAccents=new Map([[0xf2dfb5,0xefd19a],[0xd4bf94,0xbca16a],[0xb4c1a2,0x83a28c],[0xcdbf9e,0xb7a17d],[0xe75f40,0xe7492b],[0xeaa05e,0xef873b],[0x72a3bd,0x3f94c4],[0x7f9c62,0x5f924c],[0x829c64,0x689650],[0xa0b47b,0x83aa5b]]);
const mats=new Map();function mat(color,roughness=.75,metalness=0){const key=`${color}:${roughness}:${metalness}`;if(!mats.has(key)){
 const metal=[0x92aba4,0xcbd6bf,0xd6d9c8,0xb6c4b3,0xa6b6a7].includes(color);
 const material=new THREE.MeshStandardMaterial({color:colorAccents.get(color)??color,roughness:metal?.3:roughness,metalness:metal?.65:metalness});
 if([0xcaa26a,0xb68a55,0xc79963,0xb48858].includes(color)){material.map=presentation.materials.wood.map;material.bumpMap=material.map;material.bumpScale=.025;}
 if(color===0xf2a34e){material.emissive.set(0xff7b20);material.emissiveIntensity=.9;}
 mats.set(key,material);
 }return mats.get(key)}
function box(w,h,d,color,x=0,y=0,z=0,parent=scene){const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,1,Math.min(w,h,d)*.13),mat(color));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
function sphere(r,color,x=0,y=0,z=0,parent=scene,scale){const m=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),mat(color));m.position.set(x,y,z);if(scale)m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function cyl(rt,rb,h,color,x=0,y=0,z=0,parent=scene,n=24){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,n),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function torus(r,t,color,x,y,z,parent=scene){const m=new THREE.Mesh(new THREE.TorusGeometry(r,t,8,32),mat(color));m.position.set(x,y,z);m.rotation.x=Math.PI/2;m.castShadow=true;parent.add(m);return m}
function leaf(x,y,z,parent,angle=0){const l=sphere(.2,0x7f9c62,x,y,z,parent,[.45,1.4,.7]);l.rotation.z=angle;return l}

function food(type,chopped=false){const g=new THREE.Group();if(chopped){for(let i=0;i<6;i++)box(.13,.09,.13,INGREDIENTS[type].color,(i%3-1)*.16,.05,Math.floor(i/3)*.17-.08,g);return g}if(type==='fish'){box(.5,.14,.26,0xf59575,0,.13,0,g);for(const x of [-.15,0,.15])box(.025,.008,.28,0xffd1b4,x,.205,0,g);}if(type==='rice'){box(.32,.35,.26,0xeee6cf,0,.18,0,g);box(.20,.04,.17,0xb64842,0,.36,.08,g);}if(type==='nori'){for(let i=0;i<3;i++)box(.4,.018,.35,0x315245,0,.05+i*.025,0,g);}if(type==='cucumber'){const m=cyl(.085,.085,.48,0x62aa5b,0,.12,0,g);m.rotation.z=Math.PI/2;}if(type==='lettuce'){for(let i=0;i<6;i++)sphere(.20,i%2?0x8fb452:0x6b944d,Math.sin(i)*.12,.19+Math.cos(i)*.04,Math.cos(i)*.12,g,[1,1.2,.7]);}if(type==='beef'){box(.46,.12,.34,0xc87967,0,.11,0,g);box(.32,.02,.04,0xf1c4a5,0,.18,.02,g);}if(type==='bun'){sphere(.27,0xd7aa61,0,.18,0,g,[1,.62,1]);for(let i=0;i<4;i++)box(.035,.015,.025,0xf5deb0,Math.sin(i*4)*.15,.33,Math.cos(i*4)*.1,g);}if(type==='tomato'){sphere(.24,0xe75f40,0,.19,0,g,[1,.85,1]);for(let i=0;i<5;i++){const a=i*1.256;const l=box(.07,.028,.2,0x537b3d,Math.sin(a)*.07,.4,Math.cos(a)*.07,g);l.rotation.y=a}}if(type==='onion'){sphere(.22,0xe5c788,0,.2,0,g,[1,1.1,1]);cyl(.025,.09,.15,0xa89856,0,.45,0,g,8);for(let i=-1;i<=1;i++)leaf(i*.06,.56,0,g,i*.3)}if(type==='mushroom'){cyl(.085,.11,.3,0xf5e7ca,0,.15,0,g);sphere(.25,0xb68a65,0,.32,0,g,[1,.55,1]);sphere(.042,0xe7ca9b,.1,.43,.04,g,[1,.3,1]);sphere(.035,0xe7ca9b,-.1,.41,-.05,g)}return g}
function plate(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);cyl(.39,.30,.065,0xfffbeb,0,0,0,g);torus(.32,.025,0xd9e0cc,0,.045,0,g);return g}
function itemMesh(item){const g=new THREE.Group();if(item.kind==='cooked'){cyl(.25,.25,.1,item.ingredient==='rice'?0xfff2d8:0x7c4e37,0,.08,0,g);}else if(item.kind==='raw'||item.kind==='chopped')g.add(food(item.ingredient,item.kind==='chopped'));else{plate(g);if(item.kind==='meal'){const recipe=RECIPES.find(r=>r.id===item.recipe);if(recipe.family==='sushi'){
  const filling=recipe.ingredients.includes('fish')?0xf79877:0x72b761;
  if(recipe.id==='nigiri'){for(const x of [-.16,.16]){box(.22,.13,.30,0xfff0d6,x,.13,0,g);box(.24,.055,.32,filling,x,.225,0,g);}}
  else for(const [x,z] of [[-.15,-.13],[.15,-.13],[-.15,.13],[.15,.13]]){cyl(.13,.13,.17,0x294d40,x,.14,z,g);cyl(.108,.108,.018,0xfff2d9,x,.235,z,g);cyl(.045,.045,.022,filling,x,.25,z,g);}
 }else if(recipe.family==='bowl'){cyl(.29,.23,.20,0xdce6df,0,.13,0,g);cyl(.26,.26,.035,0xffefd0,0,.25,0,g);for(const x of [-.12,.12])box(.14,.055,.3,recipe.id==='beefbowl'?0x8d5e3d:0xf59879,x,.30,0,g);sphere(.075,0x7db764,.1,.33,.15,g);
 }else if(recipe.family==='burger'){cyl(.26,.25,.08,0xdbb46f,0,.1,0,g);cyl(.28,.27,.07,INGREDIENTS[recipe.ingredients.find(i=>i!=='bun'&&i!=='beef')].color,0,.17,0,g);cyl(.25,.25,.09,0x79503b,0,.24,0,g);sphere(.28,0xdbaa61,0,.32,0,g,[1,.55,1]);}else if(recipe.family==='salad'){for(let i=0;i<6;i++)sphere(.09,INGREDIENTS[recipe.ingredients[i%2]].color,Math.sin(i*2)*.17,.12,Math.cos(i*2)*.17,g);}else cyl(.27,.27,.035,recipe.color,0,.05,0,g);for(let i=0;i<4;i++)sphere(.025,0x6d984c,(i%2-.5)*.16,.075,(Math.floor(i/2)-.5)*.15,g)}}if(item.kind==='plate'&&item.components)for(let i=0;i<item.components.length;i++){const f=itemMesh(item.components[i]);f.scale.setScalar(.6);f.position.set((i-1)*.15,.09,0);g.add(f)}return g}
const presentation=createPresentation(scene,renderer,camera);const fx=new KitchenEffects(scene);const stageDecor=createStageDecor(scene,batchStatic);const beltVisuals=[];
function disposeTree(group){group.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(o.userData.disposeMaterial)o.material.dispose()}});}
function applyTheme(){presentation.setTheme(activeMap,match.level);stageDecor.reset(match.level,stations);fx.reset();document.body.dataset.theme=activeMap.id;}
function stationCounter(s){
 const group=new THREE.Group();group.position.set(s.x,0,s.z);scene.add(group);
 const hot=s.kind==='pot'||s.kind==='grill',isSource=s.kind==='source';
 const woodbox=(w,h,d,x,y,z)=>{const m=box(w,h,d,0x64473f,x,y,z,group);m.material=activeMap.id==='harbor'?mat(0x628392,.45,.6):presentation.materials.wood;return m};
 woodbox(2.08,.89,1.28,0,.65,0);
 box(2.17,.16,1.43,hot?0x777d8b:s.belt&&activeMap.sushi?0x29484d:0xb09c85,0,1.2,0,group);
 box(2.06,.12,1.28,0x30394c,0,.25,0,group);
 for(const x of [-.84,.84]){box(.11,.27,.95,0x323c51,x,.13,0,group);box(.10,.66,.08,0xb88c4f,x,.69,.665,group);}
 for(const x of [-.46,.46]){
  woodbox(.81,.59,.065,x,.69,.655);
  box(.69,.025,.03,0x302635,x,.49,.698,group);box(.69,.025,.03,0x302635,x,.87,.698,group);
  box(.23,.06,.085,0xc7964c,x,.86,.72,group);
 }
 for(const z of [-.64,.64])box(2.1,.05,.05,0xc89a58,0,1.12,z,group);
 if(hot){box(1.94,.55,.10,0xa1443c,0,.76,.69,group);for(const x of [-.61,-.2,.2,.61]){const dial=cyl(.065,.065,.07,0x273244,x,.88,.78,group,12);dial.rotation.x=Math.PI/2;}box(1.1,.24,.03,0x202c3e,0,.57,.755,group);for(let i=0;i<6;i++)box(.1,.018,.035,0x61718b,-.4+i*.16,.58,.78,group);}
 if(isSource){box(1.75,.14,.08,0xc68c42,0,1.18,.72,group);}
 return group;
}
const binIconMaterials=new Map();
function binIcon(ingredient,parent){
 if(!binIconMaterials.has(ingredient)){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff3d7';ctx.strokeStyle='#b97c3f';ctx.lineWidth=9;ctx.beginPath();ctx.roundRect(8,8,240,240,38);ctx.fill();ctx.stroke();ctx.font='156px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(INGREDIENTS[ingredient].emoji,128,139);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;binIconMaterials.set(ingredient,new THREE.MeshBasicMaterial({map:texture,toneMapped:false}));
 }
 const icon=new THREE.Mesh(new THREE.PlaneGeometry(.68,.61),binIconMaterials.get(ingredient));icon.position.set(0,1.04,.79);icon.rotation.x=-.40;parent.add(icon);
}
const stationGroups={},dynamicGroups={},potVisuals=[];
function buildStations(){
for(const group of Object.values(stationGroups)){group.parent?.remove(group);disposeTree(group)}
for(const key of Object.keys(stationGroups))delete stationGroups[key];
for(const key of Object.keys(dynamicGroups))delete dynamicGroups[key];
potVisuals.length=0;beltVisuals.length=0;

for(const s of stations){if(s.kind==='obstacle'){const g=new THREE.Group();g.position.set(s.x,0,s.z);scene.add(g);box(s.width,.95,s.depth,activeMap.id==='sunny'?0x697d60:activeMap.id==='market'?0x8d4d58:0x48566f,0,.6,0,g);box(s.width,.07,s.depth,0xc7ad79,0,1.12,0,g);if(s.dynamic){for(let j=0;j<3;j++)box(Math.min(s.width,.6),.1,.1,0xe7ae53,0,.3+j*.25,s.depth/2+.02,g);}stationGroups[s.id]=g;continue}if(s.kind==='trash'){const g=new THREE.Group();g.position.set(s.x,0,s.z);roomScene(s.team).add(g);box(.8,.85,.8,0x7d8c77,0,.56,0,g);box(.9,.12,.9,0xb3b7a0,0,1.04,0,g);box(.45,.025,.38,0x455d4f,0,1.115,0,g);for(const x of [-.27,.27])cyl(.09,.09,.18,0x3e5145,x,.15,0,g);stationGroups[s.id]=g;continue}
const g=stationCounter(s);if(s.belt){if(activeMap.sushi&&(s.beltIndex===0||s.beltIndex===5)){box(.6,.08,.18,0x6ac3a1,0,1.31,-.58,g);torus(.16,.025,0x9de8c8,0,.8,.78,g);}const tread=new THREE.Group();tread.userData.dynamic=true;g.add(tread);if(activeMap.sushi)tread.rotation.y=s.beltIndex===2?-Math.PI/2:s.beltIndex===5?Math.PI/2:s.beltIndex>=3?Math.PI:0;const stripes=[];for(let i=0;i<5;i++){const stripe=box(activeMap.sushi?.09:.16,.025,activeMap.sushi?.48:1.2,activeMap.sushi?0xd2ded4:0xe8b759,-.8+i*.4,1.3,0,tread);stripe.rotation.y=.3;stripes.push(stripe)}beltVisuals.push(stripes);}stationGroups[s.id]=g;const dyn=new THREE.Group();dyn.userData.dynamic=true;dyn.position.y=1.31;g.add(dyn);dynamicGroups[s.id]=dyn;
if(s.kind==='source'){binIcon(s.ingredient,g);box(1.65,.14,1.05,0xb68a55,0,1.36,0,g);for(const z of [-.48,.48])box(1.65,.24,.09,0xcaa26a,0,1.51,z,g);for(const x of [-.81,.81])box(.09,.24,1.05,0xcaa26a,x,1.51,0,g);for(let i=0;i<6;i++){const f=food(s.ingredient);f.position.set((i%3-1)*.45,1.45,(Math.floor(i/3)-.5)*.43);f.rotation.y=i;g.add(f)}}
if(s.kind==='board'){box(1.4,.06,.85,0xc79963,0,1.32,0,g);box(.035,.035,.65,0xb48858,.6,1.36,0,g);const knife=box(.38,.04,.1,0xd6d9c8,.6,1.4,.1,g);knife.rotation.y=.3;box(.24,.06,.1,0x637363,.89,1.4,.02,g)}
if(s.kind==='pot'){let burner,potSoup;const steam=[];box(1.75,.10,1.1,0x606f63,0,1.34,0,g);for(const x of [-.43,.43]){cyl(.3,.3,.04,0x364e46,x,1.41,0,g);torus(.22,.03,0x7e8b7d,x,1.44,0,g)}burner=torus(.31,.045,0xf2a34e,0,1.44,0,g);cyl(.48,.38,.52,0x92aba4,0,1.7,0,g);torus(.47,.04,0xcbd6bf,0,1.97,0,g);for(const x of [-.6,.6])box(.26,.08,.18,0x455d57,x,1.83,0,g);potSoup=cyl(.42,.42,.03,0xd09c63,0,1.955,0,g);potSoup.visible=false;for(let i=0;i<8;i++){const puff=sphere(.11,0xfff9e7,0,2.1,0,g);puff.material=new THREE.MeshBasicMaterial({color:0xfffaeb,transparent:true,opacity:.4,depthWrite:false});puff.userData.disposeMaterial=true;puff.visible=false;steam.push(puff)}burner.userData.dynamic=true;potSoup.userData.dynamic=true;potVisuals.push({burner,potSoup,steam,team:s.team??0});}
if(s.kind==='sink'){box(1.5,.06,.97,0xa6b6a7,0,1.31,0,g);box(1.25,.045,.76,0x5f8784,0,1.35,0,g);box(1.05,.03,.58,0x8abbb7,0,1.38,0,g);cyl(.05,.05,.5,0x9fac9c,.62,1.58,-.39,g);const tap=torus(.18,.045,0xb6c4b3,.46,1.8,-.39,g);tap.rotation.x=0;box(.08,.12,.08,0xb6c4b3,.28,1.73,-.39,g)}
if(s.kind==='assembly'){box(1.7,.06,1,0xd9c5a1,0,1.33,0,g);box(.4,.07,.17,0xe2b96b,.6,1.42,-.25,g)}
if(s.kind==='grill'){box(1.8,.07,1.1,0x52665e,0,1.34,0,g);cyl(.48,.43,.10,0x394d46,0,1.44,0,g);box(.55,.07,.12,0x5e6654,.55,1.48,0,g)}
if(s.kind==='serve'){box(1.8,.07,1.05,0xedeacb,0,1.32,0,g);cyl(.15,.2,.11,0xd5af66,.65,1.43,0,g);sphere(.06,0x8e805a,.65,1.53,0,g,[1,.4,1]);box(2.15,.18,.15,0xe6a46f,0,1.43,.63,g)}
}
for(const group of Object.values(stationGroups))batchStatic(group);
buildLabels();}
function chef(color,x,z){const root=new THREE.Group();root.position.set(x,.17,z);scene.add(root);const body=new THREE.Group();root.add(body);cyl(.29,.35,.6,0xfff4da,0,.76,0,body);box(.48,.43,.16,color,0,.68,.27,body);box(.48,.045,.17,0xf6deb5,0,.92,.28,body);for(const a of [-1,1]){const arm=sphere(.14,0xfff0d4,a*.37,.86,.06,body,[.9,1.4,1]);sphere(.105,0xe5b087,a*.39,.67,.16,body)}cyl(.10,.1,.2,0x55675b,-.16,.32,0,body);cyl(.10,.1,.2,0x55675b,.16,.32,0,body);const legs=[sphere(.14,0x3f5149,-.16,.20,.06,body,[.8,.65,1.4]),sphere(.14,0x3f5149,.16,.20,.06,body,[.8,.65,1.4])];sphere(.37,0xefbd91,0,1.25,.02,body,[1,.96,.95]);sphere(.145,0xe9ac80,0,1.22,.37,body,[.75,.75,.8]);for(const a of [-1,1]){sphere(.033,0x364c41,a*.14,1.33,.36,body,[.8,1.2,.6]);sphere(.055,0xdc946e,a*.24,1.19,.29,body,[1,.4,.25])}sphere(.075,0x694837,-.07,1.12,.365,body,[1.35,.42,.5]);sphere(.075,0x694837,.07,1.12,.365,body,[1.35,.42,.5]);for(const x of [-.15,.15])for(const y of [.65,.81])sphere(.025,0xc49b5b,x,y,.37,body);torus(.24,.06,color,0,1.05,0,body);cyl(.38,.38,.16,0xfff9e9,0,1.55,0,body);for(const p of [[0,1.72,0],[-.19,1.68,0],[.19,1.68,0],[0,1.67,-.17]])sphere(.27,0xfff9e9,...p,body);const ring=torus(.43,.04,color,0,.025,0,root);ring.material=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.35,roughness:.5});ring.userData.disposeMaterial=true;const disc=new THREE.Mesh(new THREE.CircleGeometry(.42,32),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.32,depthWrite:false}));disc.rotation.x=-Math.PI/2;disc.position.y=.02;root.add(disc);const held=new THREE.Group();held.position.set(0,.95,.60);body.add(held);return{root,body,legs,ring,held,item:null,visualKey:'',x,z,dir:0,cooldown:0,dash:0,moving:false,work:false}}
const players=[chef(0xeaa05e,0,1.6),chef(0x72a3bd,-3,1.6),chef(0x9bba60,-3,-2),chef(0xbc82c4,3,-2)];players.forEach((p,i)=>p.root.visible=i===0);
const highlight=new THREE.Mesh(new THREE.BoxGeometry(2.23,.05,1.5),new THREE.MeshBasicMaterial({color:0xffd68e,transparent:true,opacity:.5}));highlight.position.y=1.3;highlight.visible=false;scene.add(highlight);
const stationNames={source:'NGUYÊN LIỆU',board:'THỚT',pot:'BẾP NẤU',sink:'BỒN RỬA',plates:'ĐĨA SẠCH',serve:'GIAO MÓN',trash:'RÁC',grill:'CHẢO NƯỚNG',assembly:'RÁP MÓN'};
const labels={};
function buildLabels(){
 $('#station-labels').replaceChildren();for(const key of Object.keys(labels))delete labels[key];
 for(const s of stations){if(['counter','obstacle'].includes(s.kind))continue;const el=document.createElement('div');el.className='station-label';if(s.team!==undefined)el.classList.add(`team-${s.team}`);$('#station-labels').append(el);labels[s.id]=el;}
}
const keys=new Set();let last=performance.now(),elapsed=0,hudTime=0,nearby=null,lastDynamic='',lastOrders='',toastTimer,muted=false,audio;let showAllLabels=false;
let records={};try{records=JSON.parse(localStorage.getItem('kr-progress')||'{}')||{}}catch{}
function recordKey(options=selected){return `${options.mode}:${options.map}:${options.level}`;}
function getRecord(options=selected){const r=records[recordKey(options)]||{};return{best:Math.max(0,Number(r.best)||0),stars:Math.max(0,Math.min(3,Number(r.stars)||0))};}
function starsFor(score){return match.level.goals.filter(goal=>score>=goal).length;}
function totalStars(mode){return MAPS.reduce((sum,map)=>sum+LEVELS.reduce((n,_,level)=>n+getRecord({mode,map:map.id,level}).stars,0),0);}
try{muted=localStorage.getItem('kr-muted')==='1'}catch{}
function sound(freq=500,duration=.1){if(muted)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq,audio.currentTime);osc.frequency.exponentialRampToValueAtTime(freq*1.5,audio.currentTime+duration);gain.gain.setValueAtTime(.035,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration)}catch{}}
function toast(text){if(useTouch())text=text.replace(/Space/g,'nút dao').replace(/Nhấn E/g,'Chạm Lấy/Đặt').replace(/ E /g,' Lấy/Đặt ');$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3200)}
const nearest=p=>nearestStation(p,stationsForTeam(stations,p.team??0));
let padPrevious=[],frameInputs=[];let touchState={x:0,z:0,work:false};
const touch=createTouchControls($('#touch-controls'),{onAxes:axes=>Object.assign(touchState,axes),onWork:work=>{touchState.work=work},onAction:action=>{if(match.status!=='playing')return;if(action==='interact')interact(0);if(action==='drop'||action==='throw')handleItem(0,action);if(action==='dash')dash(0);if(action==='switch')switchChef();}});
const localInput=(i,pad)=>{const input=readInput(i,keys,pad);return i===0?mergeTouch(input,touchState):input};
const movementInput=i=>frameInputs[i]||localInput(i);
const botSeat=i=>match.bots.has(i);
function pollInputs(){const pads=navigator.getGamepads?.()||[];for(let i=0;i<4;i++){const input=localInput(i,pads[i]);frameInputs[i]=input;if(players[i].active&&!botSeat(i)&&(!network||i===0))for(const command of inputEdges(input,padPrevious[i])){if(command==='interact')interact(i);if(command==='drop'||command==='throw')handleItem(i,command);if(command==='dash')dash(i);if(command==='pause')togglePause()}padPrevious[i]=input;}}
window.addEventListener('gamepaddisconnected',e=>{frameInputs[e.gamepad.index]=null;padPrevious[e.gamepad.index]={};if(players[e.gamepad.index]?.active&&match.status==='playing'){showPause();toast('Tay cầm ngắt kết nối. Có thể cắm lại hoặc dùng bàn phím.')}});
function interact(i){if(isGuest()){network.command('interact');return}if(match.status!=='playing'||botSeat(i))return;if(i===0)i=controlledChef;const p=players[i];if(handling.handoff(p,players)||handling.pickup(p)){sound(580,.08);updateHud();return}const s=nearest(p);if(s){p.dir=Math.atan2(s.x-p.x,s.z-p.z);if(gameFor(i).action(p,s))sound(420,.07)}else toast('Đến gần một quầy bếp để tương tác.');processEvents();updateHud();}
function keydown(e){
 if(e.code==='Enter'&&e.target instanceof HTMLButtonElement&&e.target.closest('#network-bar'))return;
 const input=e.target instanceof HTMLSelectElement||e.target instanceof HTMLInputElement;if(input)return;
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','Numpad0','Slash'].includes(e.code)&&match.status==='playing')e.preventDefault();
 if(e.code==='Enter'&&coop&&!match.bot&&match.status==='playing')e.preventDefault();
 if(e.code==='KeyH'&&!e.repeat){e.preventDefault();toggleLabels();return;}
 if(e.code==='Escape'){if(!e.repeat)togglePause();return;}
 if(!$('#modal').hidden||match.status!=='playing')return;
 keys.add(e.code);if(e.repeat)return;
 if(e.code==='Tab'&&selected.mode==='solo'&&match.level.roles){e.preventDefault();switchChef();return}
 for(let i=0;i<4;i++){if(network&&i!==0)continue;if(!players[i].active||botSeat(i)||selected.mode==='solo'&&i>0)continue;const c=CONTROLS[i];if(Object.values(c).includes(e.code))e.preventDefault();if(e.code===c.interact)interact(i);if(e.code===c.drop)handleItem(i,'drop');if(e.code===c.throw)handleItem(i,'throw');if(e.code===c.dash)dash(i);}

}
window.addEventListener('keydown',keydown);window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();touch.reset();if(match.status==='playing'&&!network)showPause()});
function switchChef(){touch.reset();if(selected.mode!=='solo'||!match.level.roles||match.status!=='playing')return;controlledChef=1-controlledChef;keys.clear();toast('Đang điều khiển đầu bếp '+(controlledChef+1));updateCrew();}
function handleItem(i,action){if(isGuest()){network.command(action);return}if(i===0)i=controlledChef;if(match.status!=='playing')return;if(handling[action](players[i])){sound(action==='throw'?300:400,.1);updateHud()}else if(action==='throw')toast('Chỉ ném nguyên liệu sống hoặc đã thái. Q để thả đĩa / món ăn.')}
function dash(i){if(isGuest()){network.command('dash');return}if(i===0)i=controlledChef;if(match.status==='playing'&&(players[i].cooldown||0)<=0)players[i].dashRequested=true;}
function animateChef(p,dt){
 if(isGuest()){p.root.position.lerp(new THREE.Vector3(p.x,.17,p.z),Math.min(1,dt*20));}else p.root.position.set(p.x,.17,p.z);const delta=THREE.MathUtils.euclideanModulo(p.dir-p.body.rotation.y+Math.PI,Math.PI*2)-Math.PI;p.body.rotation.y+=delta*Math.min(1,dt*16);
 p.ring.scale.setScalar(p.dash>0?1.22:1);
 p.body.position.y=p.moving?Math.abs(Math.sin(elapsed*14))*.08:p.work?Math.sin(elapsed*22)*.035:Math.sin(elapsed*2.5)*.012;p.body.rotation.z=p.dash>0?-.14:p.moving?Math.sin(elapsed*14)*.035:0;
 p.legs[0].position.z=p.moving?Math.sin(elapsed*14)*.12+.06:.06;p.legs[1].position.z=p.moving?-Math.sin(elapsed*14)*.12+.06:.06;p.held.rotation.x=p.work?Math.sin(elapsed*20)*.2:0;
}
function movePlayer(p,i,dt){
 if(match.status!=='playing')return;
 const input=network?.role==='host'&&i>0?network.input(i):movementInput(selected.mode==='solo'?0:i);
 if(p.dashRequested){p.dashRequested=false;if(requestDash(p,input))sound(220,.08)}
 stepChef(p,input,dt,stations,activeMap,players.filter(other=>other!==p&&other.active));
 if(!input.x&&!input.z&&!p.dash&&input.work){const s=nearest(p);p.work=gameFor(i).work(p,s,dt);if(p.work&&s)p.dir=Math.atan2(s.x-p.x,s.z-p.z)}
 animateChef(p,dt);
}

function replaceGroup(g){while(g.children.length){const o=g.children[0];g.remove(o);disposeTree(o)}}
function stationGame(s){return match.games[s.team??0];}
const fireGroup=new THREE.Group();scene.add(fireGroup);const fireMeshes=new Map();
function updateFires(){const burning=stations.filter(s=>match.kitchen.fires[s.id]||(s.kind==='grill'&&match.kitchen.grill.burnt));const ids=new Set(burning.map(s=>s.id));for(const [id,m] of fireMeshes)if(!ids.has(id)){fireGroup.remove(m);disposeTree(m);fireMeshes.delete(id)}for(const s of burning){let g=fireMeshes.get(s.id);if(!g){g=new THREE.Group();for(let i=0;i<3;i++)sphere(.25,i%2?0xffca55:0xff7335,(i-1)*.3,.3,0,g,[.7,2,.7]);fireGroup.add(g);fireMeshes.set(s.id,g)}g.position.set(s.x,1.4,s.z);g.scale.y=1+Math.sin(elapsed*15+s.x)*.15;}}
const aim=new THREE.Group();scene.add(aim);const aimMat=new THREE.MeshBasicMaterial({color:0xffe6a8,transparent:true,opacity:.48,depthWrite:false});for(let i=0;i<5;i++){const dot=new THREE.Mesh(new THREE.CircleGeometry(.045+i*.008,8),aimMat);dot.rotation.x=-Math.PI/2;dot.position.set(0,.24,1+i*.8);aim.add(dot)}
const looseGroup=new THREE.Group();scene.add(looseGroup);const looseMeshes=new Map();
function updateLoose(){const ids=new Set(handling.items.map(e=>e.id));for(const [id,m] of looseMeshes)if(!ids.has(id)){looseGroup.remove(m);disposeTree(m);looseMeshes.delete(id)}for(const e of handling.items){let m=looseMeshes.get(e.id);if(!m){m=itemMesh(e.item);looseMeshes.set(e.id,m);looseGroup.add(m)}m.position.set(e.x,e.y,e.z);m.rotation.y=e.flight?elapsed*8:0;}}
function updateDynamic(){
 const key=JSON.stringify(match.games.map(g=>[g.board&&{ingredient:g.board.ingredient,done:g.board.progress>=1},g.pot.ingredients,g.pot.burnt,g.pot.ready,g.plates,g.dirty,g.counters,{item:g.grill.item,ready:g.grill.ready,burnt:g.grill.burnt},g.assembly]));
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
function animateBeltItems(){
 if(!activeMap.sushi)return;
 const slots=stations.filter(s=>s.belt).sort((a,b)=>a.beltIndex-b.beltIndex),e=match.environment;
 const direction=Math.floor((e.beltCycle+1)*6/36)%2?-1:1,t=Math.max(0,(e.time%6-5.4)/.6);
 for(let i=0;i<slots.length;i++){const mesh=dynamicGroups[slots[i].id]?.children[0];if(!mesh)continue;const next=slots[(i+slots.length+direction)%slots.length];mesh.position.x=(next.x-slots[i].x)*t;mesh.position.z=(next.z-slots[i].z)*t;}
}
function itemName(item){if(!item)return'Tay không';if(item.kind==='plate')return'Đĩa sạch';if(item.kind==='meal')return RECIPES.find(r=>r.id===item.recipe).name;return`${INGREDIENTS[item.ingredient].name}${item.kind==='chopped'?' đã thái':item.kind==='cooked'?(item.ingredient==='rice'?' đã nấu':' đã nướng'):''}`}
function updateHud(){
 document.body.dataset.seat=String(isGuest()?network.seat:0);
 const hudGame=gameFor(isGuest()?network.seat:controlledChef);
 const seconds=Math.ceil(match.time);$('#timer').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;$('#timer').style.color=seconds<=30?'#d27a55':'';
 $('#combo-display').textContent=`COMBO ×${(1+Math.min(hudGame.combo,5)*.2).toFixed(1)}${hudGame.rush?' · CAO ĐIỂM +25%':''}`;$('#combo-display').classList.toggle('rush',hudGame.rush);$('#score').textContent=hudGame.score;$('#served').textContent=String(hudGame.served).padStart(2,'0');updateCrew();$('#carrying').textContent=itemName(players[isGuest()?network.seat:controlledChef].item);
 const target=match.level.goals[2];$('#goal-current').textContent=`${hudGame.score}đ`;$('#goal-fill').style.width=`${Math.min(hudGame.score/target*100,100)}%`;const stars=starsFor(hudGame.score);$('#stars').textContent='★ '.repeat(stars)+'☆ '.repeat(3-stars);
 const state=match.games[orderTeam]||game;$('#order-count').textContent=`${state.orders.length}/3`;
 const orderKey=`${orderTeam}:`+state.orders.map(o=>o.id).join();if(orderKey!==lastOrders){lastOrders=orderKey;$('#orders').innerHTML=state.orders.map(o=>{const r=RECIPES.find(r=>r.id===o.recipe);return`<article class="ticket" data-order="${o.id}"><div class="ticket-header"><span>${o===state.orders[0]?'① ƯU TIÊN':'ĐƠN #'+String(o.id).padStart(2,'0')}</span><b>+${r.value}đ</b></div><div class="ticket-dish"><span class="dish-emoji">${r.emoji}</span><div><h3>${r.name}</h3><small>${r.steps}</small></div></div><div class="ingredients">${r.ingredients.map(t=>`<span class="ingredient" title="${INGREDIENTS[t].name}">${INGREDIENTS[t].emoji}</span>`).join('')}</div><div class="ticket-time"><i></i></div></article>`}).join('')}
 for(const o of state.orders){const el=document.querySelector(`[data-order="${o.id}"]`);el.classList.toggle('urgent',o.time<25);el.querySelector('.ticket-time i').style.width=`${o.time/o.total*100}%`;el.title=`Còn ${Math.ceil(o.time)} giây`}
 if(versus){const rival=match.games[1];$('#shared-supply').textContent=`BẾP CHUNG · ${game.plates} đĩa sạch · ${game.dirty} đĩa bẩn`;$('#team0-score').textContent=game.score;$('#team1-score').textContent=rival.score;$('#team0-detail').textContent=`${game.served} món · CAM`;$('#team1-detail').textContent=`${rival.served} món · XANH`;
  $('#battle-status').textContent=game.score===rival.score?'NGANG TÀI':game.score>rival.score?'BẠN ĐANG DẪN TRƯỚC':'ĐỐI THỦ ĐANG DẪN';$('#bot-status').textContent=match.bot?match.bot.label:'Mũi tên · Enter · /';
 }
 const cooldown=players[isGuest()?network.seat:controlledChef].cooldown||0;$('#dash-state').textContent=cooldown>0?`Lướt · ${cooldown.toFixed(1)}s`:'Lướt sẵn sàng';$('#touch-work span').textContent=nearby?.kind==='sink'?'GIỮ ĐỂ RỬA':nearby?.kind==='pot'&&match.kitchen.pot.burnt||nearby?.kind==='grill'&&match.kitchen.grill.burnt||nearby&&match.kitchen.fires[nearby.id]?'GIỮ DẬP LỬA':'GIỮ ĐỂ THÁI';$('#dash-state').style.setProperty('--dash-ready',`${(1-cooldown/DASH_COOLDOWN)*100}%`);$('#touch-dash').classList.toggle('cooling',cooldown>0);$('#touch-dash').setAttribute('aria-label',cooldown>0?`Lướt đang hồi ${cooldown.toFixed(1)} giây`:'Lướt nhanh');const p2Cooldown=players[1].cooldown||0;$('#p2-controls').textContent=isGuest()?'ONLINE · WASD · E · Space · Shift · Q thả · F ném':`P2: ↑ ↓ ← → · Enter · / · Shift phải · ${p2Cooldown>0?'Lướt '+p2Cooldown.toFixed(1)+'s':'Lướt sẵn sàng'}`;
 renderer.domElement.dataset.state=JSON.stringify({network:network?{role:network.role,code:network.code,seat:network.seat,status:network.status,seats:network.seats}:null,status:match.status,mode:selected.mode,layout:'shared',visual:match.level.layout,keys:[...keys],stationCount:stations.length,map:selected.map,level:selected.level+1,time:Math.round(match.time),players:players.map(p=>({x:+p.x.toFixed(3),z:+p.z.toFixed(3),item:p.item,team:p.team,active:p.active,dash:+(p.dash||0).toFixed(3),cooldown:+(p.cooldown||0).toFixed(2)})),teams:match.games.map(g=>({score:g.score,served:g.served,pot:g.pot,board:g.board,plates:g.plates,dirty:g.dirty,grill:g.grill,assembly:g.assembly,fires:g.fires})),bots:[...match.bots].map(([seat,b])=>({seat,label:b.label})),bot:match.bot?.label,environment:{time:match.environment.time,warning:match.environment.warning,gateOpen:match.environment.gateOpen,direction:match.environment.direction,vents:match.environment.vents,fx:{particles:fx.particles.length,rings:fx.rings.length},belt:match.environment.beltCycle},controlledChef,loose:handling.items.map(e=>({id:e.id,x:e.x,z:e.z,flying:!!e.flight,item:e.item}))});updateDynamic();
}
function viewRects(){return[{x:0,y:0,w:wrap.clientWidth,h:wrap.clientHeight}];}
const viewCameras=[camera];
function project(x,y,z){const rect=viewRects()[0],v=new THREE.Vector3(x,y,z).project(camera);return{x:(v.x*.5+.5)*rect.w,y:(-v.y*.5+.5)*rect.h};}
function renderRooms(){presentation.render();}

function toggleLabels(){showAllLabels=!showAllLabels;$('#labels-toggle').setAttribute('aria-pressed',String(showAllLabels));$('#labels-toggle').textContent=showAllLabels?'H · Tên quầy':'H · Nhãn gọn';updateLabels();}
$('#labels-toggle').onclick=toggleLabels;
function updateLabels(){
 const focusedIds=new Set();if(match.status==='playing'){for(let i=0;i<players.length;i++){if(!players[i].active||botSeat(i)||isGuest()&&i!==network.seat)continue;const target=nearest(players[i]);if(target)focusedIds.add(target.id)}}
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
 const hint=$('#context-hint');if(match.status==='playing'&&nearby){hint.style.display='block';hint.innerHTML=contextHint(nearby,players[controlledChef]);}else hint.style.display='none';
}

function contextHint(s,p){
 let key='E',text='';if(gameFor(0).fires[s.id])return '<kbd>SPACE</kbd>🔥 Giữ để dập lửa quầy';if(s.team!==undefined&&s.team!==p.team)return '● Quầy xanh của đối thủ';const state=gameFor(0);
 if(s.kind==='source')text=`Lấy ${INGREDIENTS[s.ingredient].name.toLowerCase()}`;
 if(s.kind==='board'){if(state.board&&!p.item){key=state.board.progress<1?'SPACE':'E';text=state.board.progress<1?'Giữ để thái nguyên liệu':'Lấy nguyên liệu đã thái'}else text='Đặt nguyên liệu lên thớt'}
 if(s.kind==='pot'&&(state.pot.ingredients[0]==='rice'||p.item?.ingredient==='rice'))return `<kbd>E</kbd>${state.pot.burnt?'Giữ thao tác để cứu nồi cơm':state.pot.ready?'Tay không lấy cơm chín':state.pot.ingredients.length?'Cơm đang nấu…':'Cho gạo sống vào nồi'}`;if(s.kind==='pot'){key=state.pot.burnt?'SPACE':'E';text=state.pot.burnt?'Giữ để dập lửa':state.pot.ready?'Múc súp vào đĩa':state.pot.ingredients.length===2?'Súp đang nấu…':'Cho nguyên liệu đã thái vào nồi'}
 if(s.kind==='plates')text='Lấy đĩa sạch dùng chung';if(s.kind==='sink'){key='SPACE';text='Giữ để rửa đĩa'}if(s.kind==='grill'){key=state.grill.burnt?'SPACE':'E';text=state.grill.burnt?'Giữ để dập lửa':state.grill.ready?'Lấy thịt đã nướng':'Đặt thịt đã thái vào chảo'}if(s.kind==='assembly')text='Đặt đĩa / thêm nguyên liệu / lấy món';if(s.kind==='serve')text='Giao món cho khách';if(s.kind==='trash')text='Bỏ đồ đang cầm';if(s.kind==='counter')text=s.belt?(p.item?.kind==='meal'?'Đặt món lên băng chuyền · tự giao ở cuối tuyến':p.item?'Đặt đồ lên băng chuyền':'Lấy đồ / sushi trên băng chuyền'):p.item?'Đặt đồ lên bàn':'Lấy đồ trên bàn';return`<kbd>${key}</kbd>${text}`;
}
function processEvents(){
 for(let team=0;team<match.games.length;team++)for(const e of match.games[team].events.splice(0)){
  if(e.type==='end'){if(!resultShown)endGame();continue}
  const name=team===0?'Bạn':match.bot?'Bot':'Người 2';if(team===0||e.type==='serve'||e.type==='fire')toast(team===0?e.text:`${name}: ${e.text}`);
  if(e.type==='serve'){sound(team===0?660:460,.12);setTimeout(()=>sound(team===0?830:580,.1),90);setTimeout(()=>sound(team===0?990:690,.16),180);const s=stationsForTeam(stations,team).find(s=>s.kind==='serve'),pos=project(s.x,2.4,s.z,team);const f=document.createElement('div');f.className=`floating-score ${team===1?'rival-score':''}`;f.textContent=`${versus?name+' ':''}+${e.points}đ`;f.style.left=pos.x+'px';f.style.top=pos.y+'px';$('#floaters').append(f);setTimeout(()=>f.remove(),1700)}
  if(team===0&&(e.type==='chop'||e.type==='wash'))sound(750,.15);if(e.type==='fire'||e.type==='warning'||e.type==='miss')sound(150,.3);if(e.type==='ready')sound(950,.2);
 }
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){keys.clear();touch.reset();}});
let forcedTouch=false;const useTouch=()=>forcedTouch||matchMedia('(any-pointer:coarse)').matches||navigator.maxTouchPoints>0||innerWidth<=700;
function updateTouchMode(){const active=useTouch();document.body.classList.toggle('touch-mode',active);document.body.classList.toggle('touch-portrait',active&&innerHeight>innerWidth);$('#touch-controls').classList.toggle('active',active&&match.status!=='ready');}
function resize(){touch.reset();updateTouchMode();if(match.status!=='ready')$('#touch-controls').classList.toggle('active',useTouch());const w=wrap.clientWidth,h=wrap.clientHeight;renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='light'?.75:quality==='high'?1.5:1));renderer.setSize(w,h);const rects=viewRects();for(let i=0;i<rects.length;i++){const c=viewCameras[i],r=rects[i],aspect=r.w/r.h,halfHeight=Math.max(useTouch()?9.6:8.6,(useTouch()?9.4:11.4)/aspect);c.left=-halfHeight*aspect;c.right=halfHeight*aspect;c.top=halfHeight;c.bottom=-halfHeight;c.position.set(0,24,19);c.lookAt(0,.1,useTouch()?1:-2.5);c.updateProjectionMatrix();}presentation.resize(w,h);$('#room-titles').hidden=true;updateLabels();}

const touchToggle=document.createElement('button');touchToggle.id='touch-toggle';touchToggle.className='labels-toggle';touchToggle.textContent='✥ Cảm ứng';touchToggle.setAttribute('aria-label','Bật điều khiển cảm ứng');touchToggle.setAttribute('aria-pressed','false');$('.scene-options').prepend(touchToggle);touchToggle.onclick=()=>{forcedTouch=!forcedTouch;touch.reset();touchToggle.setAttribute('aria-pressed',String(forcedTouch));resize();};
const rotateHint=document.createElement('div');rotateHint.id='rotate-hint';rotateHint.textContent='↻ Xoay ngang để bếp rộng hơn';$('#canvas-wrap').append(rotateHint);
const qualityButton=document.createElement('button');qualityButton.className='labels-toggle';qualityButton.id='quality';$('.scene-options').prepend(qualityButton);
function applyQuality(){renderer.shadowMap.enabled=quality!=='light';const size=quality==='high'?2048:1024;if(sun.shadow.mapSize.x!==size){sun.shadow.map?.dispose();sun.shadow.map=null;sun.shadow.mapSize.set(size,size);}qualityButton.textContent=quality==='light'?'☼ Nhẹ':quality==='high'?'☼ Nét':'☼ Mượt';qualityButton.title='Đổi chất lượng: Nhẹ / Mượt / Nét';document.body.dataset.quality=quality;resize();}
qualityButton.onclick=()=>{quality=['light','balanced','high'][(['light','balanced','high'].indexOf(quality)+1)%3];try{localStorage.setItem('kr-quality',quality)}catch{}applyQuality();};
new ResizeObserver(resize).observe(wrap);
const crewBar=document.createElement('div');crewBar.id='crew-bar';$('#canvas-wrap').append(crewBar);
function updateCrew(){$('#team0-name').textContent=match.bots.has(2)?'P1 + BOT · CAM':network?'P1 · CAM':'BẠN · CAM';if(network&&versus){$('#rival-name').textContent=match.bots.has(3)?'P2 + BOT · XANH':'P2 · XANH';$('[data-order-team="0"]').textContent='Đơn P1 · CAM';$('#rival-orders').textContent='Đơn P2 · XANH';}else{$('[data-order-team="0"]').textContent='Đơn của bạn';}$('#switch-chef').hidden=selected.mode!=='solo'||!match.level.roles;crewBar.hidden=!coop||(versus&&!match.bots.size);crewBar.title=match.bot?.label||'';crewBar.innerHTML=players.filter(p=>p.active).map(p=>`<span class="crew-seat seat-${p.id}" title="${botSeat(p.id)?match.bots.get(p.id).label:CONTROLS[p.id].label}">● P${p.id+1}${botSeat(p.id)?' · BOT':selected.mode==='solo'&&p.id===controlledChef?' ◀':''}</span>`).join('');}
function syncMatchUi(){
 $('h1').innerHTML=`${activeMap.name}<span>${activeMap.icon}</span>`;$('.level-bar .eyebrow').textContent=`MAP ${MAPS.findIndex(m=>m.id===activeMap.id)+1} · LEVEL ${selected.level+1} · ${match.level.name.toUpperCase()}`;
 $('.level-pill').innerHTML=`<span class="live-dot"></span> ${activeMap.short} <i>/</i> ${selected.level+1}–3`;
 $('#mode').innerHTML=`<span>●</span> ${MODES[selected.mode].name.toUpperCase()} <small>⌄</small>`;$('#mode').setAttribute('aria-label','Chọn chế độ và bản đồ');
 document.body.classList.remove('dual-kitchens');document.body.classList.toggle('shared-arena',versus);$('#room-rival-title').textContent=match.bot?'BẾP CHEF BOT':'BẾP NGƯỜI 2';$('#shared-supply').hidden=!versus;$('#battle-bar').hidden=!versus;$('#order-teams').hidden=!versus;$('#p2-controls').hidden=!coop||!!match.bot;
 $('.shift-heading h2').textContent=match.level.name;$('.shift-heading>span').textContent=activeMap.icon;$('.shift-panel>p').textContent=activeMap.subtitle;
 $('#goal-target').textContent=`${match.level.goals[2]}đ`;document.querySelectorAll('.goals b').forEach((el,i)=>el.textContent=`${match.level.goals[i]}đ`);
 $('#rival-name').textContent=match.bots.has(3)?'P2 + BOT · XANH':match.bot?'CHEF BOT':'NGƯỜI 2';$('#rival-orders').textContent=match.bot?'Đơn của bot':'Đơn người 2';$('#battle-kind').textContent=match.bot?`ĐẤU BOT · ${BOT_DIFFICULTIES[selected.difficulty].name.toUpperCase()}`:`PVP · ${match.bots.has(2)?2:1} VS ${match.bots.has(3)?2:1}`;
 updateCrew();$('#progress-count').textContent=`${totalStars(selected.mode)}/27 ★`;readBest();
}
function startGame(options=selected){
 if(network?.role==='host'&&!['coop','pvp'].includes(options.mode)){network.close();network=null;renderNetwork();}if(network?.role==='host'&&((options.mode==='pvp'?2:4)!==network.maximum)){network.close();network=null;renderNetwork();}
 replaceGroup(looseGroup);looseMeshes.clear();replaceGroup(fireGroup);fireMeshes.clear();
 match=new KitchenMatch(options);selected={...match.options};game=match.games[0];stations=match.stations;handling=new ItemHandling(stations,match.kitchen);activeMap=match.map;controlledChef=0;versus=match.competitive;coop=selected.mode!=='solo'||match.level.roles;orderTeam=0;resultShown=false;lastDynamic='';lastOrders='';
 for(let i=0;i<players.length;i++){const p=players[i],spawn=activeMap.spawn[i];Object.assign(p,{item:null,x:spawn.x,z:spawn.z,id:i,bot:botSeat(i),active:selected.mode==='pvp'?(i<2||botSeat(i)):i<activeSeats(selected,match.level),dir:0,visualKey:'reset',moving:false,work:false,team:versus?i%2:0});if(versus)p.ring.material.color.set(p.team===0?0xeaa05e:0x72a3bd);resetMotion(p);roomScene(versus?i%2:0).add(p.root);p.root.visible=p.active;p.root.position.set(p.x,.17,p.z);p.body.rotation.y=0;}
 if(network?.role==='host')for(const p of players)p.active=network.seats.includes(p.id)||botSeat(p.id);buildStations();applyTheme();syncMatchUi();resize();selectOrderTeam(0);match.start();keys.clear();touch.reset();$('#start-card').hidden=true;$('#modal').hidden=true;$('#touch-controls').classList.toggle('active',useTouch());$('#floaters').replaceChildren();
 toast(versus?'Chung một bếp! Ai giao món sẽ nhận điểm; mọi người dùng chung dụng cụ và đĩa.':`${activeMap.name} · ${match.level.name}. Vào bếp thôi!`);sound(550,.2);updateHud();updateLabels();
}
function modal(content){clearTimeout(toastTimer);$('#toast').classList.remove('visible');keys.clear();touch.reset();players.forEach(stopDash);$('#modal-content').innerHTML=content;$('#modal').hidden=false;$('#modal .close-modal').focus()}
function showPause(){if(isGuest()){toast('Chỉ chủ phòng tạm dừng / đổi màn.');return}if(match.status!=='playing')return;match.status='paused';modal('<span class="eyebrow">NGHỈ TAY MỘT CHÚT</span><h2>Cả căn bếp cùng nghỉ.</h2><p>Thời gian, nồi súp và bot đều đang tạm dừng.</p><button class="primary-btn" id="resume">Nấu tiếp thôi <span>↗</span></button><button class="secondary-btn" id="change-match">Đổi chế độ / bản đồ</button><button class="secondary-btn" id="restart">Chơi lại màn này</button>');$('#resume').onclick=closeModal;$('#restart').onclick=()=>startGame();$('#change-match').onclick=openSetup;}
function closeModal(){$('#modal').hidden=true;if(match.status==='paused')match.status='playing';if(match.status==='ended'){$('#start-card').hidden=false;$('#start-card h2').textContent='Thêm một trận nữa?'}keys.clear()}
function togglePause(){if(!$('#modal').hidden){closeModal();return}showPause()}
let draft={...selected};
function openSetup(){if(isGuest()){openOnline();return}if(match.status==='playing')match.status='paused';draft={...selected};renderSetup();}
const canPlay=(stage,options=draft)=>!!options.practice||isStageUnlocked(stage,records,options.mode);
function renderSetup(focusSelector){
 const map=getMap(draft.map),level=getStage(draft.map,draft.level),competitive=draft.mode==='pvp'||draft.mode==='bot';
 modal(`<div class="setup"><div class="setup-title"><div><span class="eyebrow">KITCHEN RUSH · CHỌN TRẬN ĐẤU</span><h2>Chọn ca làm của bạn.</h2></div><span class="progress-badge">${totalStars(draft.mode)} / 27 ★</span></div>
 <div class="setup-section-label">01 <b>CHẾ ĐỘ CHƠI</b></div><div class="mode-grid">${Object.entries(MODES).map(([id,m])=>`<button class="mode-card ${draft.mode===id?'selected':''}" data-mode="${id}" aria-pressed="${draft.mode===id}"><span>${m.icon}</span><strong>${m.name}</strong><small>${m.description}</small></button>`).join('')}</div>
 <button class="secondary-btn" id="online-mode">🌐 Chơi online · phòng 2–4 người</button>${draft.mode==='pvp'?`<label class="seat-picker">Bot trong trận PvP <select id="pvp-bots">${[['none','Không bot · 1 vs 1'],['orange','Thêm bot đội Cam · 2 vs 1'],['blue','Thêm bot đội Xanh · 1 vs 2'],['both','Mỗi đội một bot · 2 vs 2']].map(([id,label])=>`<option value="${id}" ${(draft.pvpBots||'none')===id?'selected':''}>${label}</option>`).join('')}</select><small>P1 đội Cam, P2 đội Xanh. Bot P3/P4 tự điều khiển; dùng được trong phòng online 2 người.</small></label>`:''}${draft.mode==='coop'?`<label class="seat-picker">Số đầu bếp local <select id="seat-count">${[2,3,4].map(n=>`<option value="${n}" ${Number(draft.players||2)===n?'selected':''}>${n} người</option>`).join('')}</select><small>Mỗi tay cầm nối vào điều khiển P1, P2, P3, P4 theo thứ tự.</small></label>`:''}<label class="practice-picker"><input type="checkbox" id="practice" ${draft.practice?'checked':''}> Luyện tập tự do · mở mọi màn, không lưu sao</label><p class="map-description">${level.style.icon} <b>${level.name}</b> — ${level.lesson}</p><div class="setup-section-label">02 <b>9 CA LÀM · 9 BÀI TOÁN</b><span>Chạm sơ đồ để chọn màn</span></div><div class="stage-grid">${STAGES.map(s=>{const unlocked=canPlay(s),chosen=s.id===level.id,record=getRecord({...draft,map:s.map,level:s.level});return `<button class="stage-card ${chosen?'selected':''} ${unlocked?'':'locked'}" data-stage="${s.id}" aria-pressed="${chosen}" style="--stage-accent:${s.style.accent}"><span class="stage-preview">${stagePreview(s)}<i>${String(s.id+1).padStart(2,'0')}</i><em>${unlocked?('★'.repeat(record.stars)||'☆ ☆ ☆'):'🔒'}</em></span><strong>${s.name}</strong><small>${s.style.icon} ${s.style.mechanic}</small><span class="stage-menu">${s.menu.map(id=>RECIPES.find(r=>r.id===id)?.emoji||'').slice(0,3).join(' ')} <b>${chosen?'ĐANG CHỌN':unlocked?'CHỌN MÀN':'CẦN MỞ KHÓA'}</b></span></button>`}).join('')}</div>${draft.mode==='bot'||draft.mode==='pvp'&&draft.pvpBots&&draft.pvpBots!=='none'?`<label class="bot-difficulty">TRÌNH ĐỘ BOT<select id="bot-difficulty">${Object.entries(BOT_DIFFICULTIES).map(([id,d])=>`<option value="${id}" ${draft.difficulty===id?'selected':''}>${d.name}</option>`).join('')}</select></label>`:''}
 <div class="match-brief"><span><b>${Math.floor(level.duration/60)}:${String(level.duration%60).padStart(2,'0')}</b> phút / trận</span><span><b>${level.patience}s</b> mỗi đơn</span><span><b>${competitive?'ĐIỂM CAO THẮNG':level.goals[2]+'đ → ★★★'}</b></span></div>
 <p class="setup-controls">${useTouch()?'Cảm ứng: cần trái di chuyển · Lấy/Đặt · giữ nút dao thao tác. Local nhiều người cần bàn phím/tay cầm; điện thoại/iPad dùng Online để mỗi người có điều khiển riêng.<br>':''}${draft.mode==='pvp'||draft.mode==='coop'?'P1: WASD · E · Space &nbsp; | &nbsp; P2: Mũi tên · Enter · /':'WASD di chuyển · E lấy / đặt · giữ Space để thao tác · Shift để lướt'}${competitive?'<br>Chung kho, thớt, nồi, chảo, đĩa và bàn ráp. Ai lấy món và giao sẽ nhận điểm; hai bên nhận cùng chuỗi công thức.':''}</p><button class="primary-btn" id="begin-match">${competitive?'Bắt đầu so tài':'Vào bếp thôi'} <span>↗</span></button></div>`);
 for(const el of document.querySelectorAll('.mode-card[data-mode]'))el.onclick=()=>{draft.mode=el.dataset.mode;renderSetup(`[data-mode="${draft.mode}"]`)};
 for(const el of document.querySelectorAll('.map-card[data-map]'))el.onclick=()=>{draft.map=el.dataset.map;renderSetup(`[data-map="${draft.map}"]`)};
 for(const el of document.querySelectorAll('.stage-card[data-stage]'))el.onclick=()=>{const s=STAGES[Number(el.dataset.stage)];draft.map=s.map;draft.level=s.level;renderSetup(`[data-stage="${s.id}"]`)};
 $('#practice').onchange=e=>{draft.practice=e.target.checked;renderSetup('#practice')};$('#online-mode').onclick=openOnline;if($('#pvp-bots'))$('#pvp-bots').onchange=e=>{draft.pvpBots=e.target.value;renderSetup('#pvp-bots')};if($('#seat-count'))$('#seat-count').onchange=e=>{draft.players=Number(e.target.value)};if($('#bot-difficulty'))$('#bot-difficulty').onchange=e=>draft.difficulty=e.target.value;
 $('#begin-match').disabled=!canPlay(level);$('#begin-match').onclick=()=>startGame(draft);if(focusSelector)$(focusSelector)?.focus();
}
function endGame(){
 if(isGuest()){resultShown=true;modal(`<span class="eyebrow">CA LÀM KẾT THÚC</span><h2>${gameFor(network.seat).score} điểm · ${gameFor(network.seat).served} món</h2><p>Chờ chủ phòng chơi lại / chọn màn tiếp theo.</p><button id="guest-leave" class="secondary-btn">Rời phòng</button>`);$('#guest-leave').onclick=leaveOnline;return;}
 resultShown=true;const stars=starsFor(game.score),record=getRecord();if(!selected.practice)records[recordKey()]={best:Math.max(game.score,record.best),stars:Math.max(stars,record.stars)};try{localStorage.setItem('kr-progress',JSON.stringify(records))}catch{}readBest();$('#progress-count').textContent=`${totalStars(selected.mode)}/27 ★`;
 const result=match.result,rivalName=match.bot?'Chef Bot':'Người 2';const heading=result?(result.winner===null?'Ngang tài ngang sức!':result.winner===0?'Bạn thắng trận này!':`${rivalName} thắng trận này!`):stars===3?'Ngôi sao căn bếp!':stars?'Một ca làm thật ngon!':'Mỗi đầu bếp đều có ngày đầu tiên.';
 const nextIndex=(MAPS.findIndex(m=>m.id===activeMap.id)*3+selected.level+1)%9;
 modal(`<span class="eyebrow">${activeMap.name.toUpperCase()} · LEVEL ${selected.level+1} · ${selected.practice?'LUYỆN TẬP · KHÔNG LƯU SAO':'HẾT GIỜ'}</span><h2>${heading}</h2>${result?`<div class="result-versus"><div class="${result.winner===0?'winner':''}"><span>BẠN · CAM</span><strong>${result.scores[0]}<small>đ</small></strong><p>${result.served[0]} món đã giao</p></div><b>VS</b><div class="${result.winner===1?'winner':''}"><span>${rivalName.toUpperCase()} · XANH</span><strong>${result.scores[1]}<small>đ</small></strong><p>${result.served[1]} món đã giao</p></div></div><p>Thắng thua tính theo tổng điểm khi hết giờ. Hai bên bằng điểm sẽ hòa.</p>`:`<div class="stars">${'★ '.repeat(stars)+'☆ '.repeat(3-stars)}</div><div class="result-score">${game.score}<small>đ</small></div><p>Đã phục vụ <b>${game.served} món</b>, bỏ lỡ ${game.missed} đơn.<br>Tiến độ ${MODES[selected.mode].name}: ${totalStars(selected.mode)}/27 sao.</p>`}<button class="primary-btn" id="again">${result?'Tái đấu':'Chơi lại màn này'} <span>↗</span></button><button class="secondary-btn" id="next-level">${nextIndex===0?'Chọn màn khác':`Màn tiếp theo · ${MAPS[Math.floor(nextIndex/3)].name} ${nextIndex%3+1}`}</button><button class="text-btn" id="back-maps">Đổi chế độ / bản đồ</button>`);
 $('#again').onclick=()=>startGame();$('#next-level').onclick=()=>{if(nextIndex===0)openSetup();else if(canPlay(STAGES[nextIndex],selected))startGame({...selected,map:MAPS[Math.floor(nextIndex/3)].id,level:nextIndex%3});else toast('Cần ít nhất 1 sao để mở màn tiếp theo.')};$('#back-maps').onclick=openSetup;
}
function selectOrderTeam(team){orderTeam=team;lastOrders='';for(const el of document.querySelectorAll('[data-order-team]')){const selected=Number(el.dataset.orderTeam)===team;el.classList.toggle('selected',selected);el.setAttribute('aria-pressed',String(selected))}updateHud()}
for(const el of document.querySelectorAll('[data-order-team]'))el.onclick=()=>selectOrderTeam(Number(el.dataset.orderTeam));
$('#start').onclick=openSetup;$('#pause').onclick=togglePause;$('.close-modal').onclick=closeModal;$('#mode').onclick=openSetup;
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});
$('#help').onclick=()=>{if(match.status==='playing')match.status='paused';modal(`<span class="eyebrow">CẨM NANG ĐẦU BẾP · BẾP CHUNG</span><h2>Nấu ngon. So tài. Đi xa hơn.</h2><ol><li><b>Lấy → thái:</b> E để lấy nguyên liệu, E đặt lên thớt, giữ Space để thái, E lấy lại.</li><li><b>Nấu → giao:</b> cho 2 nguyên liệu đã thái đúng công thức vào nồi. Lấy đĩa sạch → E tại nồi đã chín → E ở quầy giao món.</li><li><b>Salad:</b> đặt đĩa lên bàn ráp, thêm xà lách và cà chua đã thái. E tay không lấy món.</li><li><b>Burger:</b> thái thịt bò → nướng chảo 7 giây → ráp với bánh mì và cà chua thái trên đĩa.</li><li><b>Sushi / cơm tô:</b> Gạo sống cho thẳng vào nồi, chờ chín rồi E tay không lấy cơm. Thái cá / dưa leo; rong biển dùng trực tiếp. Đặt đĩa ở bàn ráp, thêm các phần theo đơn. Màn 5 có vòng băng chuyền 6 bàn: đặt món lên vòng, tới cuối tuyến tự giao theo đội đã đặt lên; món không còn đơn vẫn chạy vòng để lấy lại.</li><li><b>Bot PvP:</b> Chọn thêm bot đội Cam, đội Xanh hoặc mỗi đội một bot. Bot nhường quầy bạn đang đứng dùng và đồ bạn vừa đặt; sau khi bỏ quầy một lúc bot mới tiếp việc.</li><li><b>Combo:</b> giao đơn đầu danh sách để tăng hệ số, giao lệch thứ tự hoặc để khách bỏ đi sẽ mất chuỗi. Cao điểm mỗi 45 giây thưởng thêm 25% trong 12 giây.</li><li><b>Dọn bếp:</b> tay không, giữ Space tại bồn để rửa đĩa hoặc tại nồi cháy để dập lửa. Súp chín để lâu sẽ cháy.</li><li><b>Thi đấu:</b> Cả hai ở chung một căn bếp. Có thể tiếp tục món người khác đang làm hoặc lấy món đã chín. Đĩa và dụng cụ dùng chung; đơn, combo và điểm thi đấu riêng. Cùng thời gian, cùng chuỗi công thức; điểm cao hơn thắng, bằng điểm là hòa.</li><li><b>Chuyển đồ:</b> quay mặt vào đồng đội tay trống, E để đưa tận tay. Q thả xuống sàn, E tay không nhặt lại. F ném nguyên liệu sống / đã thái theo hướng nhìn; đồng đội tay trống tự bắt. Không ném đĩa hay món đã hoàn thiện. P2: Delete thả, dấu chấm ném.</li><li><b>9 màn:</b> mỗi ca có bố cục và bài học riêng. Đạt 1 sao để mở màn kế. Chọn Luyện tập tự do để thử mọi màn, không lưu sao. Solo ở màn phân vai dùng Tab đổi đầu bếp. Bến cảng có sàn ướt làm chậm bước chân; chợ đêm đổi bố trí quầy.</li></ol><p><b>P1:</b> WASD · E · Space · Shift trái.<br><b>P2:</b> Mũi tên · Enter · / · Shift phải.<br><b>P3:</b> IJKL · O lấy · U thao tác · P lướt · N thả · M ném.<br><b>P4:</b> numpad 8456 · + lấy · 0 thao tác · dấu chấm lướt · − thả · × ném.<br><b>Điện thoại / iPad:</b> kéo cần bên trái để đi; chạm Lấy/Đặt, giữ nút dao để thái/rửa/dập lửa; Ném, Thả và Lướt ở cụm bên phải. Có thể dùng hai ngón cùng lúc. Xoay ngang để nhìn bếp rộng hơn. Chơi chung trên nhiều thiết bị qua mã phòng online.<br><b>Tay cầm:</b> cần trái di chuyển, A lấy/đặt, X thao tác, B ném, Y thả, RB lướt, Start tạm dừng.<br><b>Esc:</b> tạm dừng cả hai bên và bot.<br>PvP hai người có thể thêm 1–2 bot; đồng đội chọn 2–4 người trong menu. Có thể phối hợp bàn phím và tay cầm.</p><button class="primary-btn" id="got-it">Đã hiểu <span>↗</span></button>`);$('#got-it').onclick=closeModal};
$('#recipes').onclick=()=>{if(match.status==='playing')match.status='paused';modal(`<span class="eyebrow">SỔ TAY MÓN · 5 NHÓM MÓN · 16 CÔNG THỨC</span><h2>Mỗi món, một nhịp bếp.</h2><div class="recipe-book">${RECIPES.map(r=>`<article><b>${r.emoji} ${r.name}</b><span>${r.ingredients.map(i=>INGREDIENTS[i].emoji).join(' + ')}</span><p>${r.family==='soup'?'Thái 2 phần → cho vào nồi → chờ chín → cầm đĩa múc súp.':r.ingredients.map(i=>INGREDIENTS[i].name).join(' + ')+' · '+r.steps+'. Đặt đĩa lên bàn ráp; E tay không lấy món.'}</p></article>`).join('')}</div><p>Giao đơn đầu danh sách để tăng combo. Nồi và chảo đều có thể cháy. Tay không, giữ Space để dập lửa.</p><button class="primary-btn" id="close-book">Nhớ rồi, nấu thôi <span>↗</span></button>`);$('#close-book').onclick=closeModal};
function syncSound(){$('#sound').textContent=muted?'♪̸':'♫';$('#sound').setAttribute('aria-pressed',String(!muted))}
$('#sound').onclick=()=>{muted=!muted;try{localStorage.setItem('kr-muted',muted?'1':'0')}catch{}syncSound();if(!muted)sound(600,.2)};syncSound();
function readBest(){$('#best').textContent=getRecord().best}
const tips=['<b>Salad</b>: đặt đĩa lên bàn ráp, thêm xà lách và cà chua đã thái. E tay không để lấy.','<b>Burger</b>: thái thịt bò, nướng 7 giây, ráp trên đĩa với bánh mì và cà chua thái.','<b>Combo</b>: giao đơn đầu tiên để tăng hệ số. Cao điểm mỗi 45 giây thưởng thêm 25%.','<b>Thi đấu</b>: chung bếp, chung dụng cụ. Ai giao món sẽ nhận điểm.','<b>Bot biết tự nấu!</b> Chọn Tập sự, Đầu bếp hoặc Bếp trưởng trong menu trận đấu.','<b>9 màn riêng · mở khóa bằng sao</b>. Đổi bản đồ bằng nút chế độ trên góc phải căn bếp.','<b>Bến cảng</b> có sàn ướt: đi vòng hoặc lướt qua để tiết kiệm thời gian.','Rửa đĩa sau khi giao món. Cả <b>người chơi lẫn bot</b> đều cần đĩa sạch.'];
let tipIndex=0;setInterval(()=>{$('#tip').innerHTML=tips[tipIndex++%tips.length]},14000);
const mechanicCue=document.createElement('div');mechanicCue.id='mechanic-cue';$('#canvas-wrap').append(mechanicCue);
function updateMechanicCue(){const e=match.environment,s=match.level;let text=s.style.mechanic;if(s.belt)text=`${s.sushi?'🍣 Đặt sushi lên vòng · tự giao cuối tuyến · ':''}${e.direction<0?'← Sang trái':'Sang phải →'} · đảo chiều sau ${(s.sushi?36:18)-Math.floor(e.time%(s.sushi?36:18))}s`;if(s.gate&&s.layout==='gates'){const a=stations.find(x=>x.id==='gate-alt');text=`Cửa trên ${a.enabled?'ĐÓNG':'MỞ'} · cửa dưới ${e.gateOpen?'MỞ':'ĐÓNG'}`;}if(s.moving)text='↔ Xe chuyển đồ · nhận tại hai đầu ray';if(s.vents)text=e.vents.some(v=>v.active)?'♨ ĐANG PHUN · tránh vòng xanh':e.vents.some(v=>v.warning)?'⚠ HƠI NƯỚC SẮP PHUN':'♨ Khu áp lực · theo dõi lỗ thoát hơi';mechanicCue.hidden=match.status==='ready';mechanicCue.textContent=`${String(s.id+1).padStart(2,'0')} · ${s.name}  /  ${text}`;mechanicCue.style.setProperty('--cue-color',s.style.accent);mechanicCue.classList.toggle('danger',e.warning||e.vents.some(v=>v.warning));}
const netBar=document.createElement('div');netBar.id='network-bar';netBar.hidden=true;document.body.append(netBar);
function renderNetwork(){if(!network){netBar.hidden=true;return}netBar.hidden=false;const roster=network.role==='host'?network.seats.map(i=>'P'+(i+1)).join(' · '):'Bạn là P'+(network.seat+1);netBar.innerHTML=`<span>🌐 ${network.code||'…'} · ${roster} · ${network.detail||network.status}</span>${network.role==='host'?network.seats.filter(i=>i>0).map(i=>`<button data-kick="${i}" title="Rời chỗ để người khác tham gia">P${i+1} ×</button>`).join(''):''}${network.role==='client'?'<button id="net-reconnect">Vào lại</button>':''}<button id="net-leave">Rời phòng</button>`;$('#net-leave').onclick=leaveOnline;for(const b of netBar.querySelectorAll('[data-kick]'))b.onclick=()=>network.release(Number(b.dataset.kick));if($('#net-reconnect'))$('#net-reconnect').onclick=()=>network.reconnect();}
function leaveOnline(){network?.close();network=null;receivedRound=null;renderNetwork();keys.clear();startGame({mode:'solo',map:selected.map,level:selected.level});showPause();}
async function createNetwork(role,code){
 network?.close();network=null;receivedRound=null;
 const {OnlineRoom}=await import('./online.js');
 network=new OnlineRoom({onState:()=>renderNetwork(),onRoster:seats=>{if(network?.role==='host'){for(const p of players)p.active=seats.includes(p.id)||botSeat(p.id);renderNetwork();updateHud();}},onSnapshot:state=>{
  if(!isGuest()||state?.version!==1)return;
  if(receivedRound!==state.round){receivedRound=state.round;startGame(state.options);if(versus)selectOrderTeam(network.seat);}
  const oldServed=gameFor(network.seat).served;applySnapshot(state,match,players,handling);if(gameFor(network.seat).served>oldServed)sound(660,.25);controlledChef=network.seat;for(const p of players)p.root.visible=p.active;updateHud();
 },onLeave:seat=>{if(players[seat]?.item)handling.drop(players[seat]);},onDisconnect:seat=>{if(network?.role==='host'&&match.status==='playing'){showPause();toast('P'+(seat+1)+' mất kết nối. Đang giữ đồ và chỗ cho người chơi vào lại.')}else if(isGuest()){match.status='paused';keys.clear();}}});
 if(role==='host'){
  const options={...draft,mode:draft.mode==='pvp'?'pvp':'coop',players:4};startGame(options);match.status='paused';await network.host(options.mode==='pvp'?2:4);network.onRoster(network.seats);
  modal(`<span class="eyebrow">PHÒNG ONLINE · ${options.mode==='pvp'?'PVP 2 NGƯỜI':'ĐỒNG ĐỘI 4 NGƯỜI'}</span><h2>Mã phòng: <b id="room-code">${network.code}</b></h2><p>Gửi mã này cho bạn bè. Mọi người mở game, chọn Chơi online → Nhập mã. Chủ phòng điều khiển P1; khách dùng WASD · E · Space · Shift · Q · F.</p><p>Giữ tab chủ phòng mở. Khách mất mạng có thể dùng Vào lại để giữ nguyên chỗ và đồ.</p><button id="room-start" class="primary-btn">Bắt đầu ca làm</button><button id="room-cancel" class="secondary-btn">Rời phòng</button>`);$('#room-start').onclick=()=>{if(network.status!=='hosting'){toast('Đợi tạo phòng thành công trước khi bắt đầu.');return}closeModal();};$('#room-cancel').onclick=leaveOnline;
 }else{await network.join(code);$('#modal').hidden=true;$('#start-card').hidden=true;toast('Đang kết nối vào phòng…');}
 renderNetwork();
}
function openOnline(){if(match.status==='playing'&&!isGuest())match.status='paused';modal(`<span class="eyebrow">ONLINE · CÙNG NẤU TỪ XA</span><h2>Rủ cả hội vào bếp.</h2><p>Tạo phòng ở màn đang chọn. Chế độ Đấu tay đôi tạo phòng PvP 2 người; các chế độ khác tạo phòng đồng đội tối đa 4 người.</p><button id="host-room" class="primary-btn" ${canPlay(getStage(draft.map,draft.level))?'':'disabled'}>Tạo phòng · ${getStage(draft.map,draft.level).name}</button><label class="room-label">Mã phòng<input id="join-code" maxlength="6" placeholder="ABC123" autocomplete="off" spellcheck="false"></label><button id="join-room" class="secondary-btn">Vào phòng</button><p class="online-note">Kết nối trực tiếp qua PeerJS/WebRTC. Một số mạng chặn kết nối trực tiếp; nếu không nối được, thử mạng khác. Khi chủ phòng thoát, ca làm dừng.</p>`);$('#host-room').onclick=()=>createNetwork('host').catch(e=>toast(e.message));$('#join-room').onclick=()=>createNetwork('client',$('#join-code').value).catch(e=>toast(e.message));}
function networkUpdate(dt){
 if(!network)return;networkTick+=dt;if(networkTick<.05)return;networkTick=0;
 if(network.role==='host'){if(match.status!=='playing')network.actions.length=0;for(const p of players)p.root.visible=p.active;network.broadcast(snapshot(match,players,handling));}
 else{const pad=navigator.getGamepads?.()[0],input=localInput(0,pad);for(const command of inputEdges(input,padPrevious[0])){if(['interact','drop','throw','dash'].includes(command))network.command(command)}padPrevious[0]=input;network.sendInput(match.status==='playing'?input:{x:0,z:0,work:false});if(network.status==='connected'&&performance.now()-network.lastSnapshot>3000){match.status='paused';network.state('disconnected','Không nhận được dữ liệu chủ phòng. Bếp đang dừng; bấm Vào lại.');}}
}
let frameCount=0,frameTime=0,workBeat=0;
let lowFrames=0;
function animate(now){
 requestAnimationFrame(animate);const rawDt=(now-last)/1000,dt=Math.min(rawDt,.1);last=now;elapsed+=dt;frameCount++;frameTime+=rawDt;if(frameTime>=1){renderer.domElement.dataset.renderstats=JSON.stringify({fps:Math.round(frameCount/frameTime),width:wrap.clientWidth,height:wrap.clientHeight,quality,drawCalls:renderer.info.render.calls});if(document.visibilityState==='visible'&&frameCount/frameTime<32&&quality==='balanced')lowFrames++;else lowFrames=0;if(lowFrames>=4){quality='light';applyQuality();toast('Đã chuyển sang chế độ Nhẹ để giữ nhịp chơi.');lowFrames=0;}frameCount=0;frameTime=0;}
 if(match.status==='playing'&&!isGuest()){if(network?.role==='host')for(const {seat,action} of network.actions.splice(0)){if(!players[seat]?.active)continue;if(action==='interact')interact(seat);if(action==='drop'||action==='throw')handleItem(seat,action);if(action==='dash')dash(seat);}match.tick(dt,players);handling.tick(dt,players);if(match.status==='playing'){pollInputs();if(selected.mode==='solo'){movePlayer(players[controlledChef],controlledChef,dt);if(coop)animateChef(players[1-controlledChef],dt)}else{for(let i=0;i<players.length;i++)if(players[i].active){if(botSeat(i))animateChef(players[i],dt);else movePlayer(players[i],i,dt)}}}nearby=nearest(players[controlledChef]);highlight.visible=!!nearby;if(nearby)highlight.position.set(nearby.x,1.315,nearby.z);processEvents();for(const event of match.environment.events.splice(0)){if(event==='belt-serve'){toast('🍣 Băng chuyền đã phục vụ món!');sound(780,.2)}if(event==='steam-warning'){toast('⚠ Hơi nước sắp phun: tránh vùng cam trên sàn!');sound(220,.15)}if(event==='spread'){toast('🔥 Cháy lan sang quầy bên cạnh! Tay không giữ Space để cứu bếp.');sound(140,.3)}if(event==='warning'){toast('⚠ Cửa chắn đóng sau 2 giây. Chọn lối vòng!');sound(180,.3)}}}else highlight.visible=false;
 networkUpdate(dt);if(isGuest()){nearby=nearest(players[network.seat]);highlight.visible=match.status==='playing'&&!!nearby;if(nearby)highlight.position.set(nearby.x,1.315,nearby.z);for(const p of players)if(p.active)animateChef(p,dt);if(match.status==='ended'&&!resultShown)endGame();}if(match.status==='ready')players[0].body.position.y=Math.sin(elapsed*2.5)*.018;
 for(const v of potVisuals){const pot=match.games[v.team].pot,cooking=pot.ingredients.length===2;for(let i=0;i<v.steam.length;i++){const puff=v.steam[i];puff.visible=cooking;const t=(elapsed*.48+i/8)%1;puff.position.set(Math.sin(i*7+t*2)*.22,2.05+t*1.2,Math.cos(i*4+t*2)*.18);puff.scale.setScalar(.5+t);puff.material.opacity=(1-t)*.4;puff.material.color.set(pot.burnt?0x6b5140:0xfffaeb)}v.burner.material=mat(pot.burnt?0xe46b38:cooking?0xf2a34e:0x8d9078);v.burner.scale.setScalar(pot.burnt?1+Math.sin(elapsed*18)*.15:1);}
 const aimChef=players[isGuest()?network.seat:controlledChef];aim.visible=match.status==='playing'&&['raw','chopped'].includes(aimChef.item?.kind);aim.position.set(aimChef.x,0,aimChef.z);aim.rotation.y=aimChef.dir;for(const s of stations){const g=stationGroups[s.id];if(!g)continue;g.position.x=s.x;g.position.z=s.z;if(s.kind==='obstacle'&&s.dynamic){g.visible=s.enabled||s.warning;g.scale.y=s.enabled?1:.12;}}workBeat-=dt;if(workBeat<=0&&match.status==='playing'&&players.some(p=>p.active&&p.work)){sound(match.kitchen.board?.progress<1?220:500,.035);workBeat=.24;}for(const event of handling.events.splice(0)){if(['catch','handoff'].includes(event))sound(850,.08);}for(const stripes of beltVisuals)for(let i=0;i<stripes.length;i++)stripes[i].position.x=((i*.4+match.environment.time*.45*(match.environment.direction||1))%2+2)%2-.95;fx.observe(match,players,handling,dt,quality);stageDecor.update(match.environment,match.environment.time);updateFires();updateLoose();animateBeltItems();presentation.update(elapsed);hudTime+=dt;if(hudTime>.1){updateMechanicCue();updateHud();updateLabels();hudTime=0}renderRooms();
}
$('#start-card>small').textContent=useTouch()?'Kéo cần trái · chạm Lấy/Đặt · giữ nút dao để thao tác':'W A S D di chuyển · E tương tác';$('#start-card .mini-spark').textContent='KITCHEN RUSH · ĐẠI SẢNH ÁNH LỬA';$('#start-card h2').textContent='Đại tiệc lên lửa.';$('#start-card p').textContent='9 ca làm. Một căn bếp chung. Chơi solo, cùng bot hoặc rủ hội bạn local / online.';$('#start').innerHTML='Chọn trận đấu <span>↗</span>';
players.forEach((p,i)=>{p.id=i;p.team=0;p.active=i===0;resetMotion(p)});buildStations();applyTheme();syncMatchUi();updateHud();applyQuality();requestAnimationFrame(animate);
