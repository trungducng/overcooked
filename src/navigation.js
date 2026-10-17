// Radius duplicated here only as a navigation clearance; movement owns contact response.
const PEER_CLEARANCE=.74;
export const BOUNDS={minX:-7.5,maxX:7.5,minZ:-5.55,maxZ:5.55};
export function collides(x,z,stations){
  const bounds=stations.bounds||BOUNDS;
  if(x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ)return true;
  return stations.some(s=>s.enabled!==false&&Math.abs(x-s.x)<(s.width!==undefined?s.width/2:s.kind==='trash'?.53:1.13)+.23&&Math.abs(z-s.z)<(s.depth!==undefined?s.depth/2:s.kind==='trash'?.53:.76)+.23);
}
export function nearestStation(p,stations){
  let found=null,best=1.67;for(const s of stations){if(s.kind==='obstacle')continue;const d=Math.hypot(p.x-s.x,p.z-s.z);if(d<best){found=s;best=d}}return found;
}
export function speedMultiplier(p,map){const hits=[...(map.hazard||[]),...(map.dynamicHazards||[])].filter(h=>((p.x-h.x)/h.rx)**2+((p.z-h.z)/h.rz)**2<1);return hits.length?Math.min(...hits.map(h=>h.multiplier??.58)):1;}
// Four-way navigation avoids corner cutting. Both bot and humans use collides().
export function createNavigator(stations){
  const step=.24,bounds=stations.bounds||BOUNDS,startX=Math.ceil(bounds.minX/step)*step,startZ=Math.ceil(bounds.minZ/step)*step,nx=Math.floor((bounds.maxX-startX)/step)+1,nz=Math.floor((bounds.maxZ-startZ)/step)+1,cells=new Map();
  for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz;iz++){const x=startX+ix*step,z=startZ+iz*step;if(!collides(x,z,stations))cells.set(ix*nz+iz,{id:ix*nz+iz,ix,iz,x,z});}
  function pathTo(p,station,others=[]){
    const blocked=(x,z)=>collides(x,z,stations)||others.some(other=>other!==p&&other.active!==false&&Math.hypot(x-other.x,z-other.z)<PEER_CLEARANCE);
    if(nearestStation(p,stations)?.id===station.id&&Math.hypot(p.x-station.x,p.z-station.z)<1.53)return [];
    const visible=(a,b)=>{const n=Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.07);for(let i=1;i<=n;i++)if(blocked(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n))return false;return true};
    let start=null,best=Infinity;for(const c of cells.values()){const d=(c.x-p.x)**2+(c.z-p.z)**2;if(d<best&&visible(p,c)){start=c;best=d}}if(!start)return null;
    const open=[],cost=new Map([[start.id,0]]),previous=new Map(),closed=new Set();
    const h=c=>Math.max(0,Math.hypot(c.x-station.x,c.z-station.z)-1.45);
    const push=(cell)=>{const entry={cell,score:cost.get(cell.id)+h(cell)};open.push(entry);let i=open.length-1;while(i>0){const j=(i-1)>>1;if(open[j].score<=entry.score)break;open[i]=open[j];i=j}open[i]=entry;};
    const pop=()=>{const first=open[0],last=open.pop();if(open.length){let i=0;while(i*2+1<open.length){let j=i*2+1;if(j+1<open.length&&open[j+1].score<open[j].score)j++;if(open[j].score>=last.score)break;open[i]=open[j];i=j}open[i]=last}return first.cell;};push(start);
    while(open.length){const current=pop();if(closed.has(current.id))continue;closed.add(current.id);
      if(Math.hypot(current.x-station.x,current.z-station.z)<1.53&&nearestStation(current,stations)?.id===station.id){const path=[current];let id=current.id;while(previous.has(id)){id=previous.get(id);path.unshift(cells.get(id))}return path.map(c=>({x:c.x,z:c.z}));}
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const ix=current.ix+dx,iz=current.iz+dz;if(ix<0||ix>=nx||iz<0||iz>=nz)continue;const next=cells.get(ix*nz+iz);if(!next||closed.has(next.id)||blocked(next.x,next.z))continue;const g=cost.get(current.id)+step;if(g<(cost.get(next.id)??Infinity)){cost.set(next.id,g);previous.set(next.id,current.id);push(next)}}
    }return null;
  }
  return {pathTo,cells};
}
