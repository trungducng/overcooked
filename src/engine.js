import {isBurning} from './fire-safety.js';
export const chefKey=p=>String(p.id??(p.bot?'bot:'+String(p.team??0):'human:'+String(p.team??0)));
export const INGREDIENTS={tomato:{name:'Cà chua',emoji:'🍅',color:0xe96744},onion:{name:'Hành tây',emoji:'🧅',color:0xe8cb89},mushroom:{name:'Nấm',emoji:'🍄',color:0xb99a7c}};
Object.assign(INGREDIENTS,{lettuce:{name:'Xà lách',emoji:'🥬',color:0x83ac54},beef:{name:'Thịt bò',emoji:'🥩',color:0xc77561},bun:{name:'Bánh mì',emoji:'🍞',color:0xd8ad65}});
Object.assign(INGREDIENTS,{rice:{name:'Gạo',emoji:'🍚',color:0xf3ead4},fish:{name:'Cá hồi',emoji:'🐟',color:0xf79573},nori:{name:'Rong biển',emoji:'🌿',color:0x314f45},cucumber:{name:'Dưa leo',emoji:'🥒',color:0x62ad66}});
export const RECIPES=[{id:'tomato',name:'Súp cà chua',ingredients:['tomato','tomato'],color:'#dc7450',value:80},{id:'mushroom',name:'Súp nấm',ingredients:['mushroom','mushroom'],color:'#b8a17b',value:90},{id:'onion',name:'Súp hành tây',ingredients:['onion','onion'],color:'#e0bd68',value:80},{id:'garden',name:'Súp vườn nhà',ingredients:['tomato','mushroom'],color:'#bd975f',value:110}];
RECIPES.forEach(r=>{r.family='soup';r.steps='Thái → nấu → múc đĩa';r.emoji='🍲'});
RECIPES.push({id:'salad',family:'salad',name:'Salad vườn xanh',ingredients:['lettuce','tomato'],components:['chopped:lettuce','chopped:tomato'],color:'#91b66c',value:110,steps:'Thái → ráp trên đĩa',emoji:'🥗'},{id:'burger',family:'burger',name:'Burger bò nướng',ingredients:['bun','beef','tomato'],components:['raw:bun','cooked:beef','chopped:tomato'],color:'#b47b4b',value:190,steps:'Thái thịt → nướng → ráp bánh',emoji:'🍔'});
RECIPES.push({id:'forest',family:'salad',name:'Salad nấm rừng',ingredients:['lettuce','mushroom'],components:['chopped:lettuce','chopped:mushroom'],color:'#a2bb71',value:130,steps:'Thái rau và nấm → ráp đĩa',emoji:'🥗'},{id:'onionburger',family:'burger',name:'Burger hành giòn',ingredients:['bun','beef','onion'],components:['raw:bun','cooked:beef','chopped:onion'],color:'#d5ac6e',value:210,steps:'Nướng thịt → thái hành → ráp bánh',emoji:'🍔'});
RECIPES.push(
 {id:'nigiri',family:'sushi',name:'Nigiri cá hồi',ingredients:['rice','fish'],components:['cooked:rice','chopped:fish'],color:'#f29b7b',value:170,emoji:'🍣',steps:'Nấu cơm → thái cá → ráp trên đĩa'},
 {id:'salmonmaki',family:'sushi',name:'Maki cá hồi',ingredients:['rice','fish','nori'],components:['cooked:rice','chopped:fish','raw:nori'],color:'#ec9d77',value:210,emoji:'🍣',steps:'Nấu cơm → thái cá → cuộn rong biển'},
 {id:'kappamaki',family:'sushi',name:'Kappa dưa leo',ingredients:['rice','cucumber','nori'],components:['cooked:rice','chopped:cucumber','raw:nori'],color:'#80bd6e',value:180,emoji:'🍱',steps:'Nấu cơm → thái dưa → cuộn rong biển'},
 {id:'futomaki',family:'sushi',name:'Futomaki cá và dưa',ingredients:['rice','fish','cucumber','nori'],components:['cooked:rice','chopped:fish','chopped:cucumber','raw:nori'],color:'#e5bc7d',value:260,emoji:'🍱',steps:'Nấu cơm → thái cá và dưa → cuộn rong biển'},
 {id:'salmonbowl',family:'bowl',name:'Cơm cá hồi',ingredients:['rice','fish','cucumber'],components:['cooked:rice','chopped:fish','chopped:cucumber'],color:'#e8ad7f',value:220,emoji:'🍚',steps:'Nấu cơm → thái cá và dưa → ráp tô'},
 {id:'beefbowl',family:'bowl',name:'Cơm bò nướng',ingredients:['rice','beef','cucumber'],components:['cooked:rice','cooked:beef','chopped:cucumber'],color:'#b99561',value:240,emoji:'🍛',steps:'Nấu cơm → nướng bò → thêm dưa thái'},
 {id:'mushsalad',family:'salad',name:'Salad cà chua nấm',ingredients:['tomato','mushroom'],components:['chopped:tomato','chopped:mushroom'],color:'#bd9a71',value:130,emoji:'🥗',steps:'Thái nấm và cà chua → ráp đĩa'},
 {id:'greenburger',family:'burger',name:'Burger bò rau xanh',ingredients:['bun','beef','lettuce'],components:['raw:bun','cooked:beef','chopped:lettuce'],color:'#91b66b',value:210,emoji:'🍔',steps:'Nướng bò → thái rau → ráp bánh'}
);
export function matchAssembly(components){const key=components.map(c=>c.kind+':'+c.ingredient).sort().join(',');return RECIPES.find(r=>r.components&&[...r.components].sort().join(',')===key)}
export const STATIONS=[{id:'tomato',kind:'source',ingredient:'tomato',x:-4.5,z:-3},{id:'onion',kind:'source',ingredient:'onion',x:-2.25,z:-3},{id:'mushroom',kind:'source',ingredient:'mushroom',x:0,z:-3},{id:'board',kind:'board',x:2.25,z:-3},{id:'pot',kind:'pot',x:4.5,z:-3},{id:'sink',kind:'sink',x:-4.5,z:3},{id:'plates',kind:'plates',x:-2.25,z:3},{id:'serve',kind:'serve',x:2.25,z:3},{id:'trash',kind:'trash',x:5.5,z:0},{id:'counter0',kind:'counter',x:-2.25,z:0},{id:'counter1',kind:'counter',x:0,z:0},{id:'counter2',kind:'counter',x:2.25,z:0}];
export function matchRecipe(items){const key=[...items].sort().join(',');return RECIPES.find(r=>r.family==='soup'&&[...r.ingredients].sort().join(',')===key)}
export class KitchenGame{
 constructor(config={}){this.config={duration:240,patience:100,cookTime:10,burnAfter:23,chopTime:2,recipeOffset:0,menu:['tomato','mushroom','onion','garden'],...config};this.reset()}
 reset(){this.status='ready';this.time=this.config.duration;this.score=0;this.served=0;this.missed=0;this.combo=0;this.sequence=0;this.dirty=0;this.plates=4;this.wash=0;this.assembly=null;this.grill={item:null,time:0,ready:false,burnt:false,fireWork:0};this.rush=false;this.board=null;this.pot={ingredients:[],time:0,ready:false,burnt:false,fireWork:0};this.counters={};this.fires={};this.claims={};this.orders=[];this.events=[];for(let i=0;i<3;i++)this.newOrder()}
 emit(type,text,extra={}){this.events.push({type,text,...extra})}
 newOrder(){const menu=this.config.menu;const recipe=RECIPES.find(r=>r.id===menu[(this.sequence+this.config.recipeOffset)%menu.length]);this.orders.push({id:++this.sequence,recipe:recipe.id,time:this.config.patience,total:this.config.patience})}
 attachKitchen(kitchen){
  // Preparation and dishes are physical shared resources; orders and scores stay per team.
  for(const key of ['board','pot','grill','assembly','plates','dirty','wash','counters','fires','claims']){
   Object.defineProperty(this,key,{configurable:true,enumerable:true,get:()=>kitchen[key],set:value=>{kitchen[key]=value}});
  }
 }
 start(){this.status='playing'}
 tick(dt,advanceKitchen=true){if(this.status!=='playing')return;this.time=Math.max(0,this.time-dt);const elapsed=this.config.duration-this.time;const rush=elapsed>=45&&elapsed%45<12;if(rush&&!this.rush)this.emit('rush','Giờ cao điểm! Giao món nhận thêm 25% điểm trong 12 giây.');this.rush=rush;if(!this.customerService)for(const o of [...this.orders]){o.time-=dt;if(o.time<=0){this.orders=this.orders.filter(n=>n!==o);this.score=Math.max(0,this.score-20);this.missed++;this.combo=0;this.emit('miss','Khách đã rời đi · −20đ');this.newOrder()}}
 if(advanceKitchen){
 for(const [id,claim] of Object.entries(this.claims)){claim.remaining-=dt;if(claim.remaining<=0)delete this.claims[id];}
 const pot=this.pot;if((pot.ingredients.length===2||pot.ingredients[0]==='rice')&&!pot.burnt){pot.time+=dt;if(pot.time>=this.config.cookTime&&!pot.ready){pot.ready=true;this.emit('ready',pot.ingredients[0]==='rice'?'Cơm chín! Tay không lấy cơm để ráp sushi.':'Súp chín rồi! Mang đĩa đến nồi.')}if(pot.time>=this.config.cookTime+this.config.burnAfter-5&&!pot.warned){pot.warned=true;this.emit('warning','Súp sắp cháy! Múc ra trong 5 giây.')}if(pot.time>=this.config.cookTime+this.config.burnAfter){pot.burnt=true;pot.ready=false;this.emit('fire','Cháy! Lấy bình cứu hoả rồi giữ Space để dập lửa.')}}
 const grill=this.grill;if(grill.item&&!grill.burnt){grill.time+=dt;if(grill.time>=7&&!grill.ready){grill.ready=true;this.emit('ready','Thịt nướng chín! Lấy ra trước khi cháy.')}if(grill.time>=20&&!grill.warned){grill.warned=true;this.emit('warning','Thịt sắp cháy! Lấy ra trong 5 giây.')}if(grill.time>=25){grill.burnt=true;grill.ready=false;this.emit('fire','Cháy! Lấy bình cứu hoả rồi giữ Space để dập lửa.')}}
 }
 if(this.time===0){this.status='ended';this.emit('end','Hết ca làm!')}}
 action(p,s){const ok=this.performAction(p,s);if(ok&&s)this.claim(p,s);return ok}
 claim(p,s){
  if(!['board','pot','grill','assembly','counter'].includes(s.kind))return;
  const pending=s.kind==='counter'?this.counters[s.id]:s.kind==='board'?this.board:s.kind==='pot'?this.pot.ingredients.length:s.kind==='grill'?this.grill.item:this.assembly;
  if(!pending){delete this.claims[s.id];return;}
  const owner=chefKey(p),current=this.claims[s.id];
  // A teammate can add an ingredient without taking ownership away from its cook.
  if(current&&current.owner!==owner)return;
  this.claims[s.id]={owner,remaining:s.kind==='pot'?this.config.cookTime+12:s.kind==='grill'?19:12,human:!p.bot};
 }
 performAction(p,s){if(this.status!=='playing'||!s)return false;if(s.team!==undefined&&s.team!==(p.team??0))return this.fail('Đây là căn bếp của đối thủ.');if(this.fires?.[s.id])return this.fail('Quầy đang cháy! Cầm bình cứu hoả và giữ thao tác.');const item=p.item;
 if(s.kind==='extinguisher'){if(!item&&this.counters[s.id]){p.item=this.counters[s.id];delete this.counters[s.id];return true}if(item?.kind==='extinguisher'&&!this.counters[s.id]){this.counters[s.id]=item;p.item=null;return true}return this.fail('Kệ bình cứu hoả: E lấy / trả bình.')}
 if(item?.kind==='extinguisher'&&s.kind!=='counter')return this.fail('Cầm bình cứu hoả, giữ Space cạnh đám cháy để phun.');
 if(s.kind==='customer')return this.customerService?this.customerService.serve(this,p,s.customerId):false;
 if(s.kind==='source'){if(!item){p.item={kind:'raw',ingredient:s.ingredient};return true}return this.fail('Tay đang bận! Đặt đồ lên bàn trống trước nhé.')}
 if(s.kind==='board'){if(!item&&!this.board)return this.fail('Mang nguyên liệu đến thớt trước.');if(!item&&this.board){p.item=this.board.progress>=1?{kind:'chopped',ingredient:this.board.ingredient}:{kind:'raw',ingredient:this.board.ingredient};this.board=null;return true}if(item?.kind==='raw'&&['bun','nori','rice'].includes(item.ingredient))return this.fail('Bánh mì / rong biển dùng trực tiếp; gạo cho thẳng vào nồi.');if(item?.kind==='raw'&&!this.board){this.board={ingredient:item.ingredient,progress:0};p.item=null;this.emit('hint','Giữ Space cạnh thớt để thái nguyên liệu.');return true}return this.fail('Thớt cần trống để đặt nguyên liệu sống.')}
 if(s.kind==='pot'){
 if(!this.pot.burnt&&item?.kind==='raw'&&item.ingredient==='rice'&&!this.pot.ingredients.length){this.pot.ingredients=['rice'];p.item=null;this.emit('add','Đang nấu cơm · chờ chín rồi lấy bằng tay không.');return true}
 if(!this.pot.burnt&&this.pot.ingredients[0]==='rice'){if(!item&&this.pot.ready){p.item={kind:'cooked',ingredient:'rice'};this.clearPot();return true}return this.fail('Nồi cơm: đợi chín, E tay không lấy cơm.');}
 if(this.pot.burnt)return this.fail('Cháy! Lấy bình cứu hoả rồi giữ Space để dập lửa.');if(item?.kind==='chopped'&&this.pot.ingredients.length<2){if(!RECIPES.some(r=>r.family==='soup'&&r.ingredients.includes(item.ingredient)))return this.fail('Nguyên liệu này dùng cho salad / burger, không cho vào nồi súp.');const next=[...this.pot.ingredients,item.ingredient];if(next.length===2&&!matchRecipe(next))return this.fail('Hai nguyên liệu này không có trong công thức!');this.pot.ingredients.push(item.ingredient);p.item=null;this.emit('add','Đã thêm nguyên liệu vào nồi.');return true}if(item?.kind==='plate'&&this.pot.ready){p.item={kind:'meal',recipe:matchRecipe(this.pot.ingredients).id};this.clearPot();this.emit('plate','Súp nóng sẵn sàng! Mang đến quầy giao món.');return true}return this.fail(this.pot.ready?'Lấy đĩa sạch rồi quay lại múc súp.':this.pot.ingredients.length===2?'Súp đang nấu, chờ một chút nhé.':'Thái nguyên liệu trước khi cho vào nồi.')}
 if(s.kind==='grill'){
  if(this.grill.burnt)return this.fail('Cháy! Lấy bình cứu hoả rồi giữ Space để dập lửa.');
  if(item?.kind==='chopped'&&item.ingredient==='beef'&&!this.grill.item){this.grill.item={...item};p.item=null;this.emit('add','Đã cho thịt vào chảo. Nướng 7 giây.');return true}
  if(!item&&this.grill.ready){p.item={kind:'cooked',ingredient:'beef'};this.grill={item:null,time:0,ready:false,burnt:false,fireWork:0};return true}
  return this.fail('Chảo dùng cho thịt bò đã thái. E để lấy thịt khi chín.');
 }
 if(s.kind==='assembly'){
  if(item?.kind==='plate'&&this.assembly)return this.fail('Bàn ráp đã có đĩa. Thêm nguyên liệu trực tiếp, hoặc E tay không lấy đĩa cũ ra.');
  if(item&&['raw','chopped','cooked'].includes(item.kind)&&!this.assembly)return this.fail('Bàn ráp chưa có đĩa sạch. Đặt đĩa lên trước, rồi thêm nguyên liệu.');
  if(item?.kind==='plate'&&!this.assembly){this.assembly={kind:'plate',components:[],...item};p.item=null;return true}
  if(!item&&this.assembly){const recipe=matchAssembly(this.assembly.components);p.item=recipe?{kind:'meal',recipe:recipe.id}:this.assembly;this.assembly=null;return true}
  if(item&&this.assembly&&['raw','chopped','cooked'].includes(item.kind)){const next=[...this.assembly.components,item],keys=next.map(c=>c.kind+':'+c.ingredient);if(!RECIPES.some(r=>r.components&&keys.every((key,i)=>keys.slice(0,i+1).filter(k=>k===key).length<=r.components.filter(k=>k===key).length)))return this.fail('Nguyên liệu chưa khớp đĩa đang ráp. Sushi cần cơm chín, cá / dưa đã thái, rong biển sống; kiểm tra các phần đã có trên đĩa.');this.assembly.components=next;p.item=null;this.emit('add',matchAssembly(next)?'Món đã ráp xong! E để lấy và giao.':'Đã thêm vào đĩa. Mang nguyên liệu tiếp theo đến.');return true}
  return this.fail('Đặt đĩa sạch lên bàn ráp, rồi thêm từng nguyên liệu. E tay không để lấy đĩa.');
 }
 if(s.kind==='plates'){if(item)return this.fail('Đặt đồ đang cầm xuống trước.');if(!this.plates)return this.fail('Hết đĩa sạch! Giữ Space ở bồn rửa.');this.plates--;p.item={kind:'plate'};return true}
 if(s.kind==='sink'){if(item?.kind==='plate'){this.plates++;p.item=null;return true}return this.fail(this.dirty?'Tay không, giữ Space để rửa đĩa.':'Chưa có đĩa bẩn. Đĩa sẽ về sau mỗi món phục vụ.')}
 if(s.kind==='serve'){if(this.customerService)return this.fail('Mang món tới đúng bàn khách hoặc đặt lên băng chuyền.');if(item?.kind!=='meal')return this.fail('Chỉ giao món đã hoàn thiện trên đĩa.');const order=this.orders.find(o=>o.recipe===item.recipe);if(!order)return this.fail('Chưa có khách gọi món này!');const recipe=RECIPES.find(r=>r.id===item.recipe);const tip=Math.ceil(order.time/10)*2;this.combo=order===this.orders[0]?this.combo+1:0;const multiplier=1+Math.min(this.combo,5)*.2;const points=Math.round((recipe.value+tip)*multiplier*(this.rush?1.25:1));this.score+=points;this.served++;this.dirty++;p.item=null;this.orders=this.orders.filter(o=>o!==order);this.newOrder();this.emit('serve',`+${points}đ · Ngon tuyệt!`,{points,combo:this.combo,base:recipe.value,tip,multiplier,rush:this.rush});return true}
 if(s.kind==='trash'){if(item?.kind==='extinguisher')return this.fail('Không bỏ bình cứu hoả vào thùng rác. Trả về kệ hoặc đặt lên bàn.');if(!item)return this.fail('Thùng rác đang chờ đồ thừa.');if(item.kind==='plate'||item.kind==='meal')this.dirty++;p.item=null;this.emit('trash','Đã bỏ đồ đang cầm.');return true}
 if(s.kind==='counter'){if(!item&&this.counters[s.id]){p.item=this.counters[s.id];delete this.counters[s.id];return true}if(item&&!this.counters[s.id]){this.counters[s.id]=s.belt&&item.kind==='meal'?{...item,deliveryTeam:p.team??0}:item;p.item=null;return true}return this.fail(item?'Mặt bàn đã có đồ.':'Mặt bàn trống — có thể đặt đồ ở đây.')}
 return false}
 work(p,s,dt){const ok=this.performWork(p,s,dt);if(ok&&s)this.claim(p,s);return ok}
 performWork(p,s,dt){if(this.status!=='playing'||!s||s.team!==undefined&&s.team!==(p.team??0))return false;if(isBurning(this,s)){
 if(p.item?.kind!=='extinguisher')return false;
 const target=this.fires[s.id]||(s.kind==='pot'?this.pot:this.grill),key=this.fires[s.id]?'work':'fireWork';
 target[key]=(target[key]||0)+dt/1.1;
 if(target[key]>=1){if(this.fires[s.id])delete this.fires[s.id];else if(s.kind==='pot')this.clearPot();else this.grill={item:null,time:0,ready:false,burnt:false,fireWork:0};this.emit('wash','Đã dập lửa bằng bình cứu hoả!');}return true;
 }if(p.item)return false;if(s.kind==='board'&&this.board&&this.board.progress<1){this.board.progress=Math.min(1,this.board.progress+dt/this.config.chopTime);if(this.board.progress===1)this.emit('chop','Thái xong! Nhấn E để lấy.');return true}if(s.kind==='sink'&&this.dirty){this.wash+=dt/2.2;if(this.wash>=1){this.wash=0;this.dirty--;this.plates++;this.emit('wash','Một chiếc đĩa sạch tinh tươm!')}return true}return false}
 clearPot(){this.pot={ingredients:[],time:0,ready:false,burnt:false,fireWork:0}}
 fail(text){this.emit('hint',text);return false}
}
