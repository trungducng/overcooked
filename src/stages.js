import {LEVELS,MAPS,getStations,getMap} from './levels.js';
// Each shift has an authored layout and a mechanic, rather than only shorter timers.
const definitions=[
 {name:'Bữa súp đầu tiên',lesson:'Lấy · thái · nấu · rửa',menu:['tomato','mushroom','onion'],goals:[120,320,550],layout:'open'},
 {name:'Cửa sổ đồng đội',lesson:'Chuyển đồ qua quầy giữa; Tab đổi đầu bếp khi solo',menu:['tomato','garden','mushroom'],goals:[100,250,450],layout:'relay',roles:true},
 {name:'Đại tiệc ba món',lesson:'Giữ nhịp súp, salad và burger cùng lúc',menu:['burger','salad','garden'],goals:[160,360,600],layout:'island'},
 {name:'Bến cảng trơn trượt',lesson:'Đường vòng khô và lướt qua vùng ướt',menu:['salad','burger'],goals:[130,320,550],layout:'lanes',wet:true},
 {name:'Dây chuyền phục vụ',lesson:'Đồ trên ba quầy trôi theo băng chuyền mỗi 6 giây',menu:['burger','salad'],goals:[130,320,570],layout:'belt',belt:true},
 {name:'Cầu cảng đóng mở',lesson:'Cửa chắn cảnh báo trước khi đóng; vẫn có lối vòng',menu:['burger','garden'],goals:[150,340,580],layout:'gates',gate:true,wet:true},
 {name:'Chợ rau ban đêm',lesson:'Dây chuyền salad và quầy sơ chế xa quầy giao',menu:['salad','onion','garden'],goals:[140,320,560],layout:'market'},
 {name:'Đảo bếp chuyển động',lesson:'Quầy chuyển đồ di chuyển giữa hai phía bếp',menu:['burger','salad','mushroom'],goals:[150,340,590],layout:'moving',moving:true},
 {name:'Ca làm bão lửa',lesson:'Băng chuyền, cửa chắn, súp và chảo: chia việc để sống sót',menu:['burger','garden','salad','onion'],goals:[170,380,650],layout:'finale',belt:true,gate:true,wet:true},
];
export const STAGES=definitions.map((d,i)=>({...LEVELS[i%3],...d,id:i,map:MAPS[Math.floor(i/3)].id,level:i%3}));
export function getStage(map,level=0){return STAGES.find(s=>s.map===map&&s.level===level)||STAGES[0]}
export function stageMap(stage){const map=getMap(stage.map);return {...map,moving:stage.moving,hazard:stage.wet?[{x:0,z:2.1,rx:2.2,rz:.65}]:[],spawn:stage.roles?[{x:-3.8,z:2},{x:3.8,z:2},{x:-3.8,z:-2.8},{x:3.8,z:-2.8}]:[{x:-3.8,z:2},{x:3.8,z:2},{x:-3.8,z:-2},{x:3.8,z:-2}]}}
export function stageStations(stage,competitive=false){
 const stations=getStations(stage.map,competitive),at=(id,x,z)=>Object.assign(stations.find(s=>s.id===id),{x,z});
 if(stage.layout==='relay'){
  at('tomato',-5.6,-4.2);at('onion',-2.8,-4.2);at('mushroom',-6.2,-1.4);at('board',-2.6,-1.4);at('lettuce',-5.6,4.2);at('beef',-2.8,4.2);at('bun',-6.5,2.1);at('sink',2.8,4.2);at('plates',5.6,0);at('pot',2.8,-4.2);at('grill',5.6,-4.2);at('assembly',2.8,-1.4);at('serve',5.6,4.2);at('trash',6.5,2.1);at('counter1',0,0);
  for(const z of [-3.55,3.55])stations.push({id:'partition'+z,kind:'obstacle',x:0,z,width:1.0,depth:competitive?2.8:4.9});
 }
 if(stage.layout==='island'){at('board',-2.8,0);at('lettuce',0,-4.2);at('mushroom',2.8,-4.2);at('counter1',0,0);at('assembly',2.8,0);at('pot',5.6,-4.2);at('beef',5.6,-1.4);at('trash',-6.5,-1.3);}
 if(stage.layout==='lanes'){at('board',-5.6,0);at('bun',-2.8,0);at('lettuce',5.6,-4.2);at('beef',5.6,-1.4);at('trash',-6.5,-1.3);at('onion',-2.8,-4.2);at('counter1',0,0);at('assembly',2.8,0);}
 if(stage.belt){at('lettuce',-5.6,0);at('beef',5.6,0);at('counter1',0,0);stations.push({id:'belt0',kind:'counter',x:-2.8,z:0,belt:true},{id:'belt2',kind:'counter',x:2.8,z:0,belt:true});stations.find(s=>s.id==='counter1').belt=true;}
 if(stage.layout==='gates'){at('counter1',-2.8,0);at('assembly',2.8,0);at('lettuce',-5.6,0);at('beef',5.6,0);}
 if(stage.layout==='market'){at('board',-2.8,0);at('lettuce',-5.6,-4.2);at('mushroom',0,-4.2);at('onion',-2.8,-4.2);at('pot',5.6,-4.2);at('tomato',2.8,-4.2);at('beef',5.6,-1.4);at('trash',-6.5,-1.3);at('assembly',2.8,0);at('counter1',0,4.2);}
 if(stage.moving){at('counter1',0,0);at('lettuce',-5.6,0);at('beef',5.6,0);}
 if(stage.belt||stage.gate||stage.moving){at('bun',-6.5,2.2);at('grill',6.5,2.2);}
 if(stage.gate)stations.push({id:'gate',kind:'obstacle',x:0,z:2.3,width:2.2,depth:.35,enabled:false,dynamic:true});
 return stations;
}
export function isStageUnlocked(stage,records,mode='solo'){
 if(stage.id===0)return true;
 // Cooperative/competitive records also contribute to campaign access.
 return STAGES.slice(0,stage.id).every(s=>Object.entries(records).some(([key,r])=>key.endsWith(`:${s.map}:${s.level}`)&&Number(r.stars)>=1));
}
