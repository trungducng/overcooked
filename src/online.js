import Peer from 'peerjs';
import {sanitizeInput} from './sync.js';
const PROTOCOL=4,PREFIX='kitchen-rush-v7-';
const makeCode=()=>crypto.randomUUID().replaceAll('-','').slice(0,6).toUpperCase();
const empty=()=>({x:0,z:0,work:false,actions:[]});
export class OnlineRoom {
 constructor({onState=()=>{},onSnapshot=()=>{},onRoster=()=>{},onDisconnect=()=>{},onLeave=()=>{}}={}){Object.assign(this,{onState,onSnapshot,onRoster,onDisconnect,onLeave});this.role=null;this.code='';this.seat=0;this.connections=new Map();this.reservations=new Map();this.inputs=new Map();this.actions=[];this.seq=0;this.lastSnapshot=0;this.status='offline';this.closed=false;this.maximum=4;}
 state(status,detail=''){this.status=status;this.detail=detail;this.onState(status,detail)}
 async host(maximum=4){this.role='host';this.maximum=maximum;this.code=makeCode();this.peer=new Peer(PREFIX+this.code);this.state('connecting','Đang tạo phòng…');this.peer.on('open',()=>this.state('hosting',`Phòng ${this.code} · đang chờ bạn bè`));this.peer.on('connection',c=>this.accept(c));this.bindPeer();}
 async join(code){
  this.role='client';this.code=code.trim().toUpperCase();if(!/^[A-Z0-9]{6}$/.test(this.code))throw Error('Mã phòng gồm 6 chữ / số.');
  const key='kr-online-'+this.code;try{this.token=sessionStorage.getItem(key)||crypto.randomUUID();sessionStorage.setItem(key,this.token)}catch{this.token=crypto.randomUUID()}
  this.peer=new Peer();this.state('connecting','Đang tìm chủ phòng…');this.peer.on('open',()=>this.connect());this.bindPeer();
 }
 bindPeer(){this.peer.on('error',error=>this.state('error',error.type==='peer-unavailable'?'Không tìm thấy phòng. Kiểm tra mã hoặc chủ phòng đã thoát.':'Không nối được phòng. Thử kết nối lại hoặc đổi mạng.'));this.peer.on('disconnected',()=>{if(!this.closed){this.state('reconnecting','Mất kết nối máy chủ báo hiệu…');this.peer.reconnect();}});}
 accept(conn){let seat=null,welcomed=false;const timeout=setTimeout(()=>{if(!welcomed)conn.close()},8000);
  conn.on('data',message=>{
   if(this.closed)return;
   if(!welcomed){
    if(message?.type!=='hello'||message.version!==PROTOCOL||typeof message.token!=='string'||message.token.length>100){conn.close();return;}
    seat=this.reservations.get(message.token);if(seat===undefined){seat=Array.from({length:this.maximum-1},(_,i)=>i+1).find(i=>![...this.reservations.values()].includes(i));if(seat===undefined){conn.send({type:'error',message:'Phòng đã đủ người hoặc giữ chỗ cho người đang kết nối lại.'});conn.close();return;}this.reservations.set(message.token,seat);}
    const old=this.connections.get(seat);if(old&&old!==conn)old.close();this.connections.set(seat,conn);welcomed=true;clearTimeout(timeout);conn.send({type:'welcome',version:PROTOCOL,seat});this.inputs.set(seat,{...empty(),seq:-1,updated:performance.now()});this.onRoster(this.seats);return;
   }
   if(message?.type==='leave'){this.release(seat);return;}
   const last=this.inputs.get(seat),input=sanitizeInput(message,last?.seq??-1);if(!input)return;this.inputs.set(seat,{...input,updated:performance.now()});for(const action of input.actions)if(this.actions.length<32)this.actions.push({seat,action});
  });
  conn.on('close',()=>{clearTimeout(timeout);if(this.closed)return;if(seat!==null&&this.connections.get(seat)===conn){this.connections.delete(seat);this.inputs.set(seat,{...empty(),seq:-1,updated:0});this.onRoster(this.seats);this.onDisconnect(seat);}});conn.on('error',()=>conn.close());
 }
 connect(){if(this.closed)return;const conn=this.peer.connect(PREFIX+this.code,{reliable:true,serialization:'json'});this.connection=conn;const timeout=setTimeout(()=>{if(this.status!=='connected'){conn.close();this.state('error','Kết nối quá lâu. Kiểm tra mã phòng / thử mạng khác.')}},12000);
  conn.on('open',()=>conn.send({type:'hello',version:PROTOCOL,token:this.token}));
  conn.on('data',message=>{
   if(this.closed||this.connection!==conn)return;
   if(message?.type==='welcome'&&message.version===PROTOCOL){clearTimeout(timeout);this.seat=message.seat;this.seq=0;this.lastSnapshot=performance.now();this.state('connected',`Phòng ${this.code} · bạn là P${this.seat+1}`);}
   if(message?.type==='snapshot'){if(this.status!=='connected')this.state('connected',`Phòng ${this.code} · bạn là P${this.seat+1}`);this.lastSnapshot=performance.now();this.onSnapshot(message.state);}
   if(message?.type==='error'){clearTimeout(timeout);this.state('error',message.message);}
  });
  conn.on('close',()=>{clearTimeout(timeout);if(!this.closed&&this.connection===conn){this.state('disconnected','Chủ phòng mất kết nối. Bếp đã dừng trên máy bạn.');this.onDisconnect(0)}});conn.on('error',()=>{clearTimeout(timeout);this.state('error','Không thiết lập được kết nối trực tiếp tới chủ phòng.')});
 }
 reconnect(){if(this.role==='client'){this.connection?.close();this.state('connecting','Đang vào lại đúng chỗ cũ…');if(this.peer.disconnected)this.peer.reconnect();else this.connect();}}
 get seats(){return [0,...this.connections.keys()].sort()}
 input(seat){const input=this.inputs.get(seat);return input&&performance.now()-input.updated<350?input:empty()}
 command(action){if(this.actions.length<12)this.actions.push(action)}
 sendInput(input){if(!this.connection?.open)return;this.connection.send({type:'input',seq:++this.seq,x:input.x,z:input.z,work:input.work,actions:this.actions.splice(0,4)})}
 broadcast(state){for(const conn of this.connections.values())if(conn.open&&conn.dataChannel?.bufferedAmount<128000)conn.send({type:'snapshot',state})}
 release(seat){for(const [token,id] of this.reservations)if(id===seat)this.reservations.delete(token);this.onLeave(seat);this.connections.get(seat)?.close();}
 close(){if(this.role==='client'&&this.connection?.open)this.connection.send({type:'leave'});this.closed=true;const closing=this.connection;setTimeout(()=>closing?.close(),100);for(const c of this.connections.values())c.close();const peer=this.peer;setTimeout(()=>peer?.destroy(),100);this.connections.clear();this.inputs.clear();this.actions=[];this.state('offline');}
}
