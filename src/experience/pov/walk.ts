/** Belle hero POV. Shared collision model for keyboard, touch and destinations.
 * The film owns scroll. The visit owns its camera only while explicitly enabled.
 * No pointer lock or device sensors. Physical store coordinates are in metres.
 */
export type VisitDestination = 'entrada'|'centro'|'esquerda'|'direita'|'provador';
export interface WalkPoint { x:number; z:number; }
export interface WalkPose extends WalkPoint { yaw:number; pitch:number; active:boolean; }
const EYE=1.62;
const LIMIT={xmin:-4.82,xmax:4.82,zmin:-16.42,zmax:-1.70};
export const VISIT_DESTINATIONS:Record<VisitDestination,WalkPoint>={
 entrada:{x:0,z:-2.62},centro:{x:0,z:-5.8},esquerda:{x:-2.12,z:-7.25},
 direita:{x:2.12,z:-7.25},provador:{x:1.65,z:-13.15}
};
export const VIEWPOSES={
 fachada:{x:0,z:9,yaw:0,pitch:0,fov:40},
 sala:{x:0,z:2.1,yaw:0,pitch:0,fov:42},
 direita:{x:.65,z:-7.6,yaw:1.04,pitch:0,fov:46},
 esquerda:{x:-.65,z:-7.6,yaw:-1.04,pitch:0,fov:46},
 provador:{x:.35,z:-13.05,yaw:0,pitch:0,fov:46},
 portaInterna:{x:0,z:-9.8,yaw:Math.PI,pitch:0,fov:42},
} as const;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const norm=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
function collides(x:number,z:number,r=.29):boolean{
 if(x<LIMIT.xmin+r||x>LIMIT.xmax-r||z<LIMIT.zmin+r||z>LIMIT.zmax-r)return true;
 // Two physical freestanding rails and stone supports, 1+ metres from walls.
 for(const side of [-1,1]){
  const dx=Math.abs(x-side*3.45);
  if(dx<.49+r && z< -3.12+r && z> -11.9-r)return true;
 }
 // Center display is offset from the principal circulation lane.
 if((x+3.03)**2+(z+15.9)**2 < (0.71+r)**2)return true;
 // Partition between corridor and fitting alcove.
 if((x+3.6)**2+(z+13.7)**2 < (0.62+r)**2)return true;
 return false;
}
export function safeWalkPoint(x:number,z:number):WalkPoint{
 const nx=clamp(x,LIMIT.xmin+.3,LIMIT.xmax-.3),nz=clamp(z,LIMIT.zmin+.3,LIMIT.zmax-.3);
 if(!collides(nx,nz))return {x:nx,z:nz};
 let best=VISIT_DESTINATIONS.centro,score=Infinity;
 for(const point of Object.values(VISIT_DESTINATIONS)){
  const d=(point.x-nx)**2+(point.z-nz)**2;
  if(d<score&&!collides(point.x,point.z)){best=point;score=d;}
 }
 return {...best};
}
/** Substep segment collision: no tunnelling on slow/dropped frames. */
export function collisionStep(from:WalkPoint,to:WalkPoint,deltaRadius=.29):WalkPoint{
 let {x,z}=from;
 const distance=Math.hypot(to.x-x,to.z-z),steps=Math.max(1,Math.ceil(distance/.10));
 for(let i=0;i<steps;i++){
  const nextX=x+(to.x-from.x)/steps,nextZ=z+(to.z-from.z)/steps;
  if(!collides(nextX,nextZ,deltaRadius)) {x=nextX;z=nextZ;continue;}
  if(!collides(nextX,z,deltaRadius))x=nextX;
  if(!collides(x,nextZ,deltaRadius))z=nextZ;
 }
 return {x,z};
}
export class POVWalk {
 active=false;
 x=0;z=-3;yaw=0;pitch=0;
 private path:WalkPoint[]=[];
 private keys=new Set<string>();
 private arrival:VisitDestination|null=null;
 start(x:number,z:number,yaw:number,pitch=0){
  const p=safeWalkPoint(x,z);
  this.x=p.x;this.z=p.z;this.yaw=yaw;this.pitch=clamp(pitch,-.61,.61);
  this.path=[];this.keys.clear();this.active=true;this.arrival=null;
 }
 stop(){this.active=false;this.path=[];this.keys.clear();this.arrival=null;}
 look(deltaYaw:number,deltaPitch=0){
  if(!this.active)return;
  // Unbounded yaw avoids a discontinuity crossing +/-180 degrees.
  this.yaw+=clamp(deltaYaw,-1.25,1.25);
  this.pitch=clamp(this.pitch+deltaPitch,-.61,.61);
 }
 faceEntrance(){this.arrival=null;this.path=[];this.yaw=Math.PI;this.pitch=0;}
 centerLook(){this.arrival=null;this.path=[];this.yaw=0;this.pitch=0;}
 key(key:string,pressed:boolean){
  const name=key.toLowerCase();
  if(!['w','a','s','d','arrowleft','arrowright','arrowup','arrowdown'].includes(name))return false;
  if(pressed)this.keys.add(name);else this.keys.delete(name);
  if(pressed){this.path=[];this.arrival=null;}
  return true;
 }
 go(destination:VisitDestination){
  const end=VISIT_DESTINATIONS[destination];
  this.arrival=destination;
  // Route across the clear middle aisle, never through either garment rail.
  const route:WalkPoint[]=[];
  const switching=Math.abs(this.x-end.x)>2.5;
  if(switching){route.push({x:0,z:clamp(this.z,-11,-3.3)});}
  if(Math.abs(this.z-end.z)>3.5){route.push({x:0,z:clamp(end.z,-12.0,-3.2)});}
  route.push(end);
  this.path=route.filter(pt=>Math.hypot(pt.x-this.x,pt.z-this.z)>.12);
 }
 update(dt:number){
  if(!this.active)return;
  const sec=clamp(dt,0,.055),speed=2.30*sec;
  let vx=0,vz=0;
  const forward=(this.keys.has('w')||this.keys.has('arrowup')?1:0)-(this.keys.has('s')||this.keys.has('arrowdown')?1:0);
  const lateral=(this.keys.has('d')||this.keys.has('arrowright')?1:0)-(this.keys.has('a')||this.keys.has('arrowleft')?1:0);
  if(forward||lateral){
   const n=Math.hypot(forward,lateral), f=forward/n,side=lateral/n;
   vx=Math.sin(this.yaw)*f+Math.cos(this.yaw)*side;
   vz=-Math.cos(this.yaw)*f+Math.sin(this.yaw)*side;
   this.path=[];this.arrival=null;
  }else if(this.path.length){
   const next=this.path[0]!,dx=next.x-this.x,dz=next.z-this.z,dist=Math.hypot(dx,dz);
   if(dist<.11){this.x=next.x;this.z=next.z;this.path.shift();if(!this.path.length){const side=this.arrival;this.arrival=null;if(side==='direita')this.yaw=Math.PI/2;if(side==='esquerda')this.yaw=-Math.PI/2;if(side==='provador')this.yaw=0;}}
   else{vx=dx/dist;vz=dz/dist;}
  }
  const step=collisionStep({x:this.x,z:this.z},{x:this.x+vx*speed,z:this.z+vz*speed});
  this.x=step.x;this.z=step.z;
  if(this.path.length){
   const pt=this.path[0]!;
   if(Math.hypot(pt.x-this.x,pt.z-this.z)<.12){this.x=pt.x;this.z=pt.z;this.path.shift();}
  }
 }
 get pose():WalkPose{return {x:this.x,z:this.z,yaw:this.yaw,pitch:this.pitch,active:this.active};}
 get y(){return EYE;}
 get destination(){return this.arrival;}
}

