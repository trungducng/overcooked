import {collides, speedMultiplier} from './navigation.js';

export const CHEF_RADIUS = .35;
export const CHEF_DISTANCE = CHEF_RADIUS * 2;
export const WALK_SPEED = 3.8;
export const DASH_SPEED = 10.5;
export const DASH_DURATION = .17;
export const DASH_COOLDOWN = 1.1;
const EPSILON = 1e-7;

export function touchesChef(x, z, others = [], margin = 0) {
  return others.some(p => p.active !== false && Math.hypot(x-p.x, z-p.z) < CHEF_DISTANCE + margin - EPSILON);
}

// Kinematic chefs never push each other into furniture. Small swept steps prevent
// a dash or a slow frame from jumping across a thin obstacle or another chef.
export function moveChef(p, dx, dz, stations, others = []) {
  const startX = p.x, startZ = p.z;
  const peers = others.filter(other => other !== p && other.active !== false);
  const clear = (x,z) => !collides(x,z,stations) && !touchesChef(x,z,peers);
  const steps = Math.max(1,Math.ceil(Math.hypot(dx,dz)/.055));
  let hitWall = false, hitChef = false;
  for(let i=0;i<steps;i++) {
    const x0=p.x,z0=p.z;
    let x=x0+dx/steps,z=z0+dz/steps;
    // Keep the unblocked axis moving when walking diagonally against furniture.
    if(collides(x,z0,stations)){x=x0;hitWall=true;}
    if(collides(x,z,stations)){z=z0;hitWall=true;}
    for(const other of peers) {
      const rx=x-other.x,rz=z-other.z,d=Math.hypot(rx,rz);
      if(d<CHEF_DISTANCE-EPSILON) {
        hitChef=true;
        const oldD=Math.hypot(x0-other.x,z0-other.z);
        const nx=d>EPSILON?rx/d:oldD>EPSILON?(x0-other.x)/oldD:1;
        const nz=d>EPSILON?rz/d:oldD>EPSILON?(z0-other.z)/oldD:0;
        x=other.x+nx*CHEF_DISTANCE;z=other.z+nz*CHEF_DISTANCE;
      }
    }
    if(clear(x,z)){p.x=x;p.z=z;}
    else if(clear(x,z0)){p.x=x;}
    else if(clear(x0,z)){p.z=z;}
  }
  return {distance:Math.hypot(p.x-startX,p.z-startZ),hitWall,hitChef};
}

// Used on spawn/reset and when a loaded position is no longer valid. Prefer the
// nearest free spot; never teleport to a station or change the carried object.
export function recoverChef(p,stations,others=[]) {
  const peers=others.filter(other=>other!==p&&other.active!==false);
  const clear=(x,z)=>!collides(x,z,stations)&&!touchesChef(x,z,peers);
  if(clear(p.x,p.z))return true;
  for(let r=.05;r<=2;r+=.05)for(let i=0;i<48;i++){
    const angle=i*Math.PI/24,x=p.x+Math.cos(angle)*r,z=p.z+Math.sin(angle)*r;
    if(clear(x,z)){p.x=x;p.z=z;return true;}
  }
  return false;
}

export function resetMotion(p) {
  Object.assign(p,{cooldown:0,dash:0,dashX:0,dashZ:0,dashRequested:false,moving:false,work:false});
}
export function stopDash(p) {p.dash=0;p.dashX=0;p.dashZ=0;p.dashRequested=false;}
export function requestDash(p,input={x:0,z:0}) {
  if((p.cooldown||0)>EPSILON || p.active===false)return false;
  const direction=screenDirection(input.x,input.z);
  p.dashX=direction.x||direction.z?direction.x:Math.sin(p.dir||0);
  p.dashZ=direction.x||direction.z?direction.z:Math.cos(p.dir||0);
  p.dir=Math.atan2(p.dashX,p.dashZ);
  p.dash=DASH_DURATION;p.cooldown=DASH_COOLDOWN;
  return true;
}
export function screenDirection(x,z) {
  const length=Math.hypot(x,z);
  if(!length)return {x:0,z:0};
  // Match the fixed isometric camera. Normalize the basis as well as the input.
  const basis=Math.hypot(.868,.496);
  return {x:(x*.868+z*.496)/length/basis,z:(-x*.496+z*.868)/length/basis};
}
export function stepChef(p,input,dt,stations,map,others=[]) {
  const direction=screenDirection(input.x,input.z);
  const duration=Math.max(0,Math.min(dt,.25));
  const peers=others.filter(other=>other!==p&&other.active!==false);
  recoverChef(p,stations,peers);
  p.moving=false;p.work=false;
  let remaining=duration;
  while(remaining>EPSILON) {
    const dashing=(p.dash||0)>EPSILON;
    const slice=Math.min(remaining,.02,dashing?p.dash:Infinity);
    p.cooldown=Math.max(0,(p.cooldown||0)-slice);
    const x=dashing?p.dashX:direction.x,z=dashing?p.dashZ:direction.z;
    const speed=(dashing?DASH_SPEED:WALK_SPEED)*speedMultiplier(p,map);
    if(x||z) {
      const moved=moveChef(p,x*speed*slice,z*speed*slice,stations,peers);
      p.moving ||= moved.distance>1e-5;
      p.dir=Math.atan2(x,z);
      // A frontal impact ends the burst. Glancing contacts still slide.
      if(dashing&&moved.distance<speed*slice*.45)stopDash(p);
    }
    p.dash=Math.max(0,(p.dash||0)-slice);
    remaining-=slice;
  }
  return p.moving;
}
