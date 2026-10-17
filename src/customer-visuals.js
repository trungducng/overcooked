import * as THREE from 'three';import {RECIPES} from './engine.js';
import {DINING_SEATS} from './customers.js';
export function createCustomerVisuals(scene,container,project,batch){
 const root=new THREE.Group();scene.add(root);const guests=[],bubbles=[];
 const materials=new Map(),mat=c=>{if(!materials.has(c))materials.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.7}));return materials.get(c)};
 const box=(g,w,h,d,c,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m};
 const ball=(g,r,c,x,y,z)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),mat(c));m.position.set(x,y,z);m.castShadow=true;g.add(m);};
 for(let i=0;i<DINING_SEATS.length;i++){const g=new THREE.Group();root.add(g);const coat=[0x518b98,0xc47d66,0x8e81ab,0xc29b51,0x638b67,0x647ca7][i];for(const x of [-.14,.14]){box(g,.17,.4,.22,0x354653,x,.27,0);box(g,.21,.13,.34,0x4b3b36,x,.10,.09);}box(g,.58,.62,.42,coat,0,.76,0);for(const x of [-.39,.39])box(g,.17,.47,.22,coat,x,.77,0);ball(g,.30,0xedbd96,0,1.36,0);ball(g,.305,i%2?0x765142:0x3e3d41,0,1.48,-.09);for(const x of [-.105,.105])ball(g,.027,0x293c44,x,1.40,.28);ball(g,.065,0xd99a7b,0,1.33,.29);batch(g);guests.push(g);
  const el=document.createElement('div');el.className='customer-bubble';el.hidden=true;container.append(el);bubbles.push(el);
 }
 function reset(active){root.visible=!!active;for(const el of bubbles)el.hidden=true;}
 function update(service,time,held){if(!service){root.visible=false;return}root.visible=true;for(const seat of service.seats){const g=guests[seat.id],bubble=bubbles[seat.id],active=seat.status!=='empty';g.visible=active;bubble.hidden=!active;if(!active)continue;
  const enter=seat.status==='arriving',leave=seat.status==='leaving',t=enter?Math.min(1,seat.phase/3):leave?Math.min(1,seat.phase/3):1;
  const offset=enter?(1-t)*3.2:leave?t*3.2:0;g.position.set(seat.x,.18+(seat.status==='seated'?.10:Math.abs(Math.sin(time*10))*.045),seat.z+Math.sign(seat.z)*offset);g.rotation.y=seat.z<0?0:Math.PI;
  const pos=project(g.position.x,2.15,g.position.z,0);bubble.style.left=pos.x+'px';bubble.style.top=pos.y+'px';bubble.classList.toggle('matching',seat.status==='seated'&&held?.recipe===seat.order?.recipe);bubble.classList.toggle('urgent',seat.status==='seated'&&seat.order.time<25);
  bubble.innerHTML=seat.status==='seated'?`<b>B${seat.id+1}</b><span>${RECIPES.find(r=>r.id===seat.order.recipe).emoji}</span><small>${Math.ceil(seat.order.time)}s${held?.recipe===seat.order.recipe?'<br>Tận bàn +25%':''}</small>`:enter?`<small>${seat.name} đang tới</small>`:'<small>✓ Cảm ơn!</small>';
 }}
 return {reset,update};
}
