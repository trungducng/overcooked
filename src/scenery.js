import * as THREE from 'three';
// Alternate sets share the exact playable floor bounds with the hall. All props
// beyond it are scenery, so visual walls never disguise an invisible shortcut.
export function createAlternateSets(scene,batch){
 const material=(color,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness:metalness?.42:.84,metalness});
 const wood=material(0x725342),dark=material(0x263f4c),steel=material(0x668a99,.65),gold=material(0xe4ae53,.3),red=material(0xa53e42),cream=material(0xefddad);
 function box(root,w,h,d,mat,x,y,z){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh;}
 function cyl(root,r,h,mat,x,y,z){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,16),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);return mesh;}
 function ball(root,r,mat,x,y,z,scale=[1,1,1]){const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,12,8),mat);mesh.position.set(x,y,z);mesh.scale.set(...scale);mesh.castShadow=true;root.add(mesh);return mesh;}
 function foundation(root,tileA,tileB){box(root,16.6,.5,12.5,dark,0,-.2,0);const materials=[material(tileA),material(tileB)];for(let x=0;x<16;x++)for(let z=0;z<12;z++)box(root,.98,.08,.98,materials[(x+z)%2],x-7.5,.09,z-5.5);for(const z of [-6.2,6.2])box(root,16.8,.25,.2,wood,0,.13,z);for(const x of [-8.3,8.3])box(root,.2,.25,12.6,wood,x,.13,0);}
 const harbor=new THREE.Group(),market=new THREE.Group();scene.add(harbor,market);
 foundation(harbor,0xa6bcc2,0x738f9a);foundation(market,0xceaa78,0x957357);
 // Dockside canteen: overhead gantry, safety stripes, vents and cargo outside.
 box(harbor,55,.15,45,material(0x204f68),0,-1.8,0);
 for(const side of [-1,1]){
  box(harbor,3,.25,13,wood,side*10,-.1,-1.6);
  for(let i=0;i<10;i++)box(harbor,3.1,.035,.05,dark,side*10,.04,-7.4+i*1.3);
  for(const z of [-7,-2,4]){cyl(harbor,.24,3,wood,side*11.4,-1,z);cyl(harbor,.31,.12,gold,side*11.4,.55,z);}
  box(harbor,.4,5.4,.45,steel,side*7.9,2.4,-7.6);box(harbor,3.6,.4,.8,dark,side*6.3,4.9,-7.6);
  for(let i=0;i<5;i++){const stripe=box(harbor,.27,.42,.82,gold,side*5+i*.48,4.91,-7.59);stripe.rotation.z=.35;}
  for(let i=0;i<3;i++){box(harbor,1.65,1.45,1.5,i%2?steel:wood,side*10,.7+i*.08,-5+i*2.4);for(const dx of [-.6,.6])box(harbor,.08,1.5,1.55,gold,side*10+dx,.7+i*.08,-5+i*2.4);}
  cyl(harbor,.7,2.2,steel,side*5,1.0,-9.1);cyl(harbor,.73,.12,dark,side*5,2.15,-9.1);
 }
 box(harbor,16.1,.5,.55,dark,0,5.15,-7.6);box(harbor,7,.35,2,steel,0,.2,-8.8);
 for(const x of [-2.8,0,2.8]){box(harbor,1.8,1.3,.6,cream,x,1.15,-9.1);for(let i=0;i<5;i++)box(harbor,.18,.8,.1,dark,x-.6+i*.3,1.2,-8.72);}
 // Night market: red timber, tiled stalls, fabric awnings and warm lanterns.
 box(market,48,.2,40,material(0x192e35),0,-1.2,0);
 const lantern=new THREE.MeshStandardMaterial({color:0xffab45,emissive:0xff6d25,emissiveIntensity:.65,roughness:.65});
 for(const side of [-1,1]){
  box(market,3.4,.4,11,wood,side*10,-.1,-1.6);
  for(const z of [-5.7,-1.7,2.3]){
   box(market,2.8,1.1,1.9,red,side*10,.65,z);box(market,3.1,.15,2.15,wood,side*10,1.3,z);
   for(const dx of [-1.3,1.3])box(market,.15,3.7,.15,wood,side*10+dx,1.85,z-.8);
   for(let i=0;i<8;i++){const roof=box(market,.4,.13,2.8,i%2?cream:red,side*10-1.4+i*.4,3.6,z);roof.rotation.x=-.12;}
   for(let i=0;i<5;i++)ball(market,.19,material([0x7ea055,0xd35e46,0xd4b25d][i%3]),side*10-.9+i*.4,1.65,z,[1,1.1,1]);
  }
 }
 for(const x of [-7.6,7.6]){box(market,.32,5.0,.32,red,x,2.45,-7.7);box(market,.55,.18,.55,gold,x,4.8,-7.7);}
 box(market,16,.3,.35,wood,0,4.7,-7.7);
 for(let i=0;i<9;i++){const x=(i-4)*1.7,y=3.9+Math.abs(i-4)*.06;box(market,.035,.5,.035,dark,x,y+.6,-7.7);ball(market,.38,lantern,x,y,-7.7,[.85,1.1,.85]);for(const d of [-.36,.36])cyl(market,.2,.06,gold,x,y+d,-7.7);box(market,.035,.27,.035,gold,x,y-.55,-7.7);}
 box(market,7.5,1.2,1.6,red,0,.65,-9);box(market,8,.15,1.9,wood,0,1.35,-9);for(let i=0;i<6;i++)cyl(market,.32,.15,cream,-2.8+i*1.1,1.52,-8.7);
 batch(harbor);batch(market);harbor.visible=false;market.visible=false;
 return {setTheme(id){harbor.visible=id==='harbor';market.visible=id==='market';},harbor,market};
}
