export function stickVector(dx,dy,radius){const length=Math.hypot(dx,dy);if(!radius||length<radius*.13)return{x:0,z:0};const scale=Math.min(1,length/radius)/length;return{x:dx*scale,z:dy*scale};}
export function mergeTouch(input,touch){let x=input.x+touch.x,z=input.z+touch.z;const length=Math.hypot(x,z);if(length>1){x/=length;z/=length;}return {...input,x,z,work:input.work||touch.work};}
export function createTouchControls(root,{onAxes,onWork,onAction}){
 root.replaceChildren();root.classList.add('thumb-controls');root.setAttribute('aria-label','Điều khiển cảm ứng');
 const stick=document.createElement('div');stick.id='touch-stick';stick.setAttribute('role','group');stick.setAttribute('aria-label','Kéo cần để di chuyển');stick.innerHTML='<span class="stick-guides">＋</span><span class="stick-knob"></span><small>DI CHUYỂN</small>';root.append(stick);
 const actions=document.createElement('div');actions.className='touch-actions';root.append(actions);
 const buttons=new Map(),holds=new Set();let stickPointer=null,origin=null;
 const button=(id,label,action,hold=false)=>{const b=document.createElement('button');b.id=id;b.innerHTML=label;b.type='button';b.dataset.action=action;actions.append(b);buttons.set(action,b);
  b.addEventListener('pointerdown',event=>{event.preventDefault();b.setPointerCapture(event.pointerId);b.classList.add('pressed');if(hold){holds.add(event.pointerId);onWork(true)}else onAction(action)});
  const release=e=>{if(hold){holds.delete(e.pointerId);onWork(holds.size>0)}b.classList.remove('pressed')};for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,release);
  // Keyboard / assistive activation has no pointerdown event.
  b.addEventListener('click',event=>{event.preventDefault();if(event.detail===0){if(hold)onWork(false);else onAction(action)}});return b;
 };
 button('touch-interact','<b>↔</b><span>LẤY / ĐẶT</span>','interact');button('touch-work','<b>🔪</b><span>GIỮ THAO TÁC</span>','work',true);button('touch-dash','<b>»</b><span>LƯỚT</span>','dash');button('touch-throw','<b>↗</b><span>NÉM</span>','throw');button('touch-drop','<b>↓</b><span>THẢ</span>','drop');button('switch-chef','<b>⇄</b><span>ĐỔI BẾP TRƯỞNG</span>','switch');
 const knob=stick.querySelector('.stick-knob');
 function move(e){if(e.pointerId!==stickPointer)return;const vector=stickVector(e.clientX-origin.x,e.clientY-origin.y,origin.radius);knob.style.transform=`translate(${vector.x*origin.radius}px,${vector.z*origin.radius}px)`;onAxes(vector);}
 stick.addEventListener('pointerdown',e=>{e.preventDefault();if(stickPointer!==null)return;const rect=stick.getBoundingClientRect();stickPointer=e.pointerId;origin={x:rect.left+rect.width/2,y:rect.top+rect.height/2,radius:rect.width*.32};stick.setPointerCapture(e.pointerId);stick.classList.add('pressed');move(e)});
 stick.addEventListener('pointermove',move);
 const stop=e=>{if(e.pointerId!==stickPointer)return;stickPointer=null;origin=null;knob.style.transform='translate(0,0)';stick.classList.remove('pressed');onAxes({x:0,z:0})};for(const name of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(name,stop);
 return{reset(){stickPointer=null;origin=null;holds.clear();knob.style.transform='translate(0,0)';stick.classList.remove('pressed');for(const b of buttons.values())b.classList.remove('pressed');onAxes({x:0,z:0});onWork(false)},buttons};
}
