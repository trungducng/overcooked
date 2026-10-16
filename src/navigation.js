// Radius duplicated here only as a navigation clearance; movement owns contact response.
const PEER_CLEARANCE=.74;
export const BOUNDS={minX:-7.5,maxX:7.5,minZ:-5.55,maxZ:5.55};
export function collides(x,z,stations){
  if(x<BOUNDS.minX||x>BOUNDS.maxX||z<BOUNDS.minZ||z>BOUNDS.maxZ)return true;
  return stations.some(s=>Math.abs(x-s.x)<(s.kind==='trash'?.53:1.13)+.23&&Math.abs(z-s.z)<(s.kind==='trash'?.53:.76)+.23);
}
export function nearestStation(p,stations){
  let found=null,best=1.67;for(const s of stations){const d=Math.hypot(p.x-s.x,p.z-s.z);if(d<best){found=s;best=d}}return found;
}
export function speedMultiplier(p,map){return map.hazard.some(h=>((p.x-h.x)/h.rx)**2+((p.z-h.z)/h.rz)**2<1)?.58:1;}
// Four-way navigation avoids corner cutting. Both bot and humans use collides().
export function createNavigator(stations){
  const step=.24,nx=63,nz=47,cells=new Map();
  for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz;iz++){const x=-7.44+ix*step,z=-5.52+iz*step;if(!collides(x,z,stations))cells.set(ix*nz+iz,{id:ix*nz+iz,ix,iz,x,z});}
  function pathTo(p,station,others=[]){
    const blocked=(x,z)=>collides(x,z,stations)||others.some(other=>other!==p&&other.active!==false&&Math.hypot(x-other.x,z-other.z)<PEER_CLEARANCE);
    if(nearestStation(p,stations)?.id===station.id&&Math.hypot(p.x-station.x,p.z-station.z)<1.53)return [];
    const visible=(a,b)=>{const n=Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.07);for(let i=1;i<=n;i++)if(blocked(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n))return false;return true};
    const candidates=[...cells.values()].sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z));
    const start=candidates.find(c=>visible(p,c));if(!start)return null;
    const open=[start],cost=new Map([[start.id,0]]),previous=new Map(),closed=new Set();
    const h=c=>Math.max(0,Math.hypot(c.x-station.x,c.z-station.z)-1.45);
    while(open.length){open.sort((a,b)=>(cost.get(b.id)+h(b))-(cost.get(a.id)+h(a)));const current=open.pop();if(closed.has(current.id))continue;closed.add(current.id);
      if(Math.hypot(current.x-station.x,current.z-station.z)<1.53&&nearestStation(current,stations)?.id===station.id){const path=[current];let id=current.id;while(previous.has(id)){id=previous.get(id);path.unshift(cells.get(id))}return path.map(c=>({x:c.x,z:c.z}));}
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const ix=current.ix+dx,iz=current.iz+dz;if(ix<0||ix>=nx||iz<0||iz>=nz)continue;const next=cells.get(ix*nz+iz);if(!next||closed.has(next.id)||blocked(next.x,next.z))continue;const g=cost.get(current.id)+step;if(g<(cost.get(next.id)??Infinity)){cost.set(next.id,g);previous.set(next.id,current.id);open.push(next)}}
    }return null;
  }
  return {pathTo,cells};
}
