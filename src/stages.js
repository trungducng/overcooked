import {LEVELS,MAPS,getStations,getMap} from './levels.js';
// Each shift has an authored layout and a mechanic, rather than only shorter timers.
const definitions=[
 {name:'Bữa súp đầu tiên',lesson:'Lấy · thái · nấu · rửa',menu:['tomato','mushroom','onion'],goals:[120,320,550],layout:'open'},
 {name:'Cửa sổ đồng đội',lesson:'Chuyển đồ qua quầy giữa; Tab đổi đầu bếp khi solo',menu:['tomato','garden','mushroom'],goals:[100,250,450],layout:'relay',roles:true},
 {name:'Vườn bếp chữ U',lesson:'Thớt trong đảo chữ U: chia người sơ chế và người chạy món',menu:['forest','salad','garden'],goals:[160,360,600],layout:'island'},
 {name:'Bến cảng chữ S',lesson:'Ba làn nối qua hai đầu: chọn đường khô để tiếp tế',menu:['salad','burger'],goals:[130,320,550],layout:'lanes',wet:true},
 {name:'Dây chuyền phục vụ',lesson:'Băng chuyền đổi chiều mỗi 18 giây: canh lúc lấy đồ',menu:['onionburger','burger','salad'],goals:[130,320,570],layout:'belt',belt:true,reverse:true},
 {name:'Hai cửa luân phiên',lesson:'Vách giữa chia hai vùng, cửa trên và dưới đóng lệch nhịp',menu:['burger','garden'],goals:[150,340,580],layout:'gates',gate:true,wet:true},
 {name:'Chợ đêm zigzag',lesson:'Quầy sơ chế và giao ở hai đầu mê cung; chuyền nguyên liệu để tiết kiệm đường',menu:['forest','salad','onionburger'],goals:[140,320,560],layout:'market'},
 {name:'Đảo bếp chuyển động',lesson:'Xe chở đồ qua đường ray: nhận đúng món khi xe đến',menu:['onionburger','forest','mushroom'],goals:[150,340,590],layout:'moving',moving:true},
 {name:'Ca làm bão lửa',lesson:'Hơi nước phun theo chu kỳ, băng chuyền đảo chiều và cháy lan',menu:['onionburger','garden','forest','onion'],goals:[170,380,650],layout:'finale',belt:true,reverse:true,gate:true,wet:true,vents:true},
];
export const STAGE_STYLES=[
 {accent:'#e7b96e',floor:0xd7b777,secondary:0x8e9c74,icon:'♨',mechanic:'Bếp truyền thống'},
 {accent:'#77c8b8',floor:0xa0c5b9,secondary:0x607b87,icon:'⇄',mechanic:'Cửa chuyển đồ'},
 {accent:'#a4d270',floor:0xb6c88a,secondary:0x6d8c69,icon:'♧',mechanic:'Đảo sơ chế chữ U'},
 {accent:'#7fcbe2',floor:0xa1bfc8,secondary:0x487f99,icon:'≈',mechanic:'Đường đi chữ S'},
 {accent:'#efc16c',floor:0xa4aaa6,secondary:0x596d79,icon:'⇆',mechanic:'Băng chuyền đảo chiều'},
 {accent:'#df9d70',floor:0xc0b39c,secondary:0x668992,icon:'⇅',mechanic:'Hai cửa luân phiên'},
 {accent:'#ec8ca5',floor:0xd3ad96,secondary:0x926574,icon:'☾',mechanic:'Chợ zigzag'},
 {accent:'#b5a3e7',floor:0xb4a6d0,secondary:0x6c719b,icon:'↔',mechanic:'Xe chuyển đồ'},
 {accent:'#f49762',floor:0xc9a27d,secondary:0x8f635e,icon:'♨',mechanic:'Hơi nước áp lực'},
];
export const STAGES=definitions.map((d,i)=>({...LEVELS[i%3],...d,style:STAGE_STYLES[i],id:i,map:MAPS[Math.floor(i/3)].id,level:i%3}));
export function getStage(map,level=0){return STAGES.find(s=>s.map===map&&s.level===level)||STAGES[0]}
export function stageMap(stage){const map=getMap(stage.map);return {...map,stageId:stage.id,moving:stage.moving,dynamicHazards:[],hazard:stage.wet?(stage.layout==='lanes'?[{x:0,z:0,rx:2.8,rz:.6},{x:-6.2,z:-2,rx:.6,rz:1.2},{x:6.2,z:2,rx:.6,rz:1.2}]:stage.layout==='gates'?[{x:-3.8,z:0,rx:1.2,rz:.7},{x:3.8,z:0,rx:1.2,rz:.7}]:[{x:0,z:2.1,rx:2.2,rz:.65}]):[],spawn:stage.layout==='lanes'?[{x:-3.8,z:.9},{x:3.8,z:-.9},{x:-3.8,z:-.9},{x:3.8,z:.9}]:stage.roles?[{x:-3.8,z:2},{x:3.8,z:2},{x:-3.8,z:-2.8},{x:3.8,z:-2.8}]:[{x:-3.8,z:2},{x:3.8,z:2},{x:-3.8,z:-2},{x:3.8,z:-2}]}}
export function stageStations(stage,competitive=false){
 const stations=getStations(stage.map,competitive),at=(id,x,z)=>Object.assign(stations.find(s=>s.id===id),{x,z});
 if(stage.layout==='relay'){
  at('tomato',-5.6,-4.2);at('onion',-2.8,-4.2);at('mushroom',-6.2,-1.4);at('board',-2.6,-1.4);at('lettuce',-5.6,4.2);at('beef',-2.8,4.2);at('bun',-6.5,2.1);at('sink',2.8,4.2);at('plates',5.6,0);at('pot',2.8,-4.2);at('grill',5.6,-4.2);at('assembly',2.8,-1.4);at('serve',5.6,4.2);at('trash',6.5,2.1);at('counter1',0,0);
  for(const z of [-3.55,3.55])stations.push({id:'partition'+z,kind:'obstacle',x:0,z,width:1.0,depth:competitive?2.8:4.9});
 }
 const layout=positions=>{for(const [id,[x,z]] of Object.entries(positions))at(id,x,z)};
 const wall=(id,x,z,width,depth)=>stations.push({id,kind:'obstacle',x,z,width,depth});
 if(stage.layout==='island'){
  layout({tomato:[-5.6,4.2],onion:[-2.8,-4.2],mushroom:[0,-4.2],lettuce:[2.8,-4.2],pot:[-5.6,-4.2],serve:[5.6,-4.2],sink:[-2.8,4.2],plates:[0,4.2],assembly:[2.8,4.2],bun:[5.6,4.2],beef:[6.5,-1.3],grill:[6.5,1.3],trash:[-6.5,1.3],board:[0,0],counter1:[-4.2,0]});
  wall('garden-left',-2.1,0,.35,3.4);wall('garden-right',2.1,0,.35,3.4);wall('garden-bottom',0,1.8,4.55,.35);
 }
 if(stage.layout==='lanes'){
  layout({tomato:[-5.6,-4.2],onion:[-2.8,-4.2],mushroom:[0,-4.2],board:[2.8,-4.2],pot:[5.6,-4.2],sink:[-5.6,4.2],plates:[-2.8,4.2],assembly:[0,4.2],serve:[2.8,4.2],bun:[5.6,4.2],lettuce:[-6.5,0],beef:[6.5,0],trash:[-6.5,2.2],grill:[6.5,-2.2],counter1:[0,0]});
  wall('dock-upper',-1.7,-2,8,.35);wall('dock-lower',1.7,2,8,.35);
 }
 if(stage.belt){at('lettuce',-5.6,0);at('beef',5.6,0);at('counter1',0,0);stations.push({id:'belt0',kind:'counter',x:-2.8,z:0,belt:true},{id:'belt2',kind:'counter',x:2.8,z:0,belt:true});stations.find(s=>s.id==='counter1').belt=true;}
 if(stage.layout==='gates'){
  layout({tomato:[-5.6,-4.2],onion:[-2.8,-4.2],board:[2.8,-4.2],pot:[5.6,-4.2],sink:[-5.6,4.2],plates:[-2.8,4.2],assembly:[2.8,4.2],serve:[5.6,4.2],lettuce:[-6.5,0],beef:[6.5,0],bun:[-6.5,2.2],grill:[6.5,2.2],trash:[-6.5,-2.2],mushroom:[6.5,-2.2],counter1:[-2.8,0]});
  wall('dock-divider',0,0,.65,4.2);
 }
 if(stage.layout==='market'){
  layout({tomato:[-5.6,-4.2],onion:[-2.8,-4.2],mushroom:[0,-4.2],lettuce:[2.8,-4.2],pot:[5.6,-4.2],serve:[-5.6,4.2],plates:[-2.8,4.2],counter1:[0,4.2],sink:[2.8,4.2],bun:[5.6,4.2],board:[-6.3,-1.4],trash:[-6.3,1.4],beef:[6.3,-1.4],grill:[6.3,1.4],assembly:[0,0]});
  wall('stall-left',-2.2,-1,.4,3.4);wall('stall-right',2.2,1,.4,3.4);
 }
 if(stage.moving){at('counter1',0,0);at('lettuce',-5.6,0);at('beef',5.6,0);}
 if(stage.belt||stage.moving){at('bun',-6.5,2.2);at('grill',6.5,2.2);}
 if(stage.gate){const divided=stage.layout==='gates';stations.push({id:'gate',kind:'obstacle',x:0,z:divided?3.9:2.3,width:divided?.65:2.2,depth:divided?3.7:.35,enabled:false,dynamic:true});if(divided)stations.push({id:'gate-alt',kind:'obstacle',x:0,z:-3.9,width:.65,depth:3.7,enabled:false,dynamic:true,phaseOffset:8});}
 return stations;
}
export function isStageUnlocked(stage,records,mode='solo'){
 if(stage.id===0)return true;
 // Cooperative/competitive records also contribute to campaign access.
 return STAGES.slice(0,stage.id).every(s=>Object.entries(records).some(([key,r])=>key.endsWith(`:${s.map}:${s.level}`)&&Number(r.stars)>=1));
}
