import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { archFrame, box, contact, plane, spot, type Kit } from './kit';
import type { Tier } from '../../core/tier';
const WOOD_LIGHT=['#6b503d','#705440','#654b37','#70513c','#745943','#66503e'];
const IVORY=['#e6d0af','#d1b897','#f6e8cc','#bda78c','#e8d7ba','#c4ad93'];
const BORDEAUX=['#351e20','#4e2028','#5f2931','#291d1f','#692c37','#422128'];
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
function canvasTexture(draw:(c:CanvasRenderingContext2D,s:number)=>void,size=512):THREE.CanvasTexture{
const c=document.createElement('canvas');c.width=c.height=size;
const ctx=c.getContext('2d')!;draw(ctx,size);
const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
function stableNoise(x:number,y:number){return (Math.sin((x+13.3)*127.1+(y+7.1)*311.7)*43758.5453)%1;}
function parquetTexture():THREE.CanvasTexture{
return canvasTexture((ctx,s)=>{
ctx.fillStyle='#604936';ctx.fillRect(0,0,s,s);
const h=68,w=22;
for(let row=-2;row<Math.ceil(s/h)+3;row++){
for(let column=-8;column<Math.ceil(s/34)+8;column++){
const centerX=column*68+((row%2)*34),top=row*h;
for(let side of [-1,1]){
const seed=Math.abs(Math.floor(stableNoise(row*23+side,column*11)*65536))%WOOD_LIGHT.length;
const color=WOOD_LIGHT[seed]!;
const x0=centerX,y0=top;
const x1=centerX+side*34,y1=top+34;
const x2=centerX+side*34,y2=top+34+w;
const x3=centerX,y3=top+w;
ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineTo(x3,y3);ctx.closePath();
ctx.fillStyle=color;ctx.fill();ctx.lineWidth=1.1;ctx.strokeStyle='#403128';ctx.stroke();
ctx.strokeStyle='rgba(220,175,128,.065)';ctx.lineWidth=.5;
for(let k=0;k<7;k++){const t=(k+.5)/8;ctx.beginPath();ctx.moveTo(x0*(1-t)+x3*t,y0*(1-t)+y3*t);ctx.lineTo(x1*(1-t)+x2*t,y1*(1-t)+y2*t);ctx.stroke();}
}
}
}
for(let i=0;i<2200;i++){
const x=(i*73.3)%s,y=(i*17.7+(i%5)*27)%s;
ctx.fillStyle=i%2?'rgba(252,202,157,.035)':'rgba(12,7,4,.045)';ctx.fillRect(x,y,1+(i%6),.5);
}
},512);
}
function limestoneTexture():THREE.CanvasTexture{
return canvasTexture((ctx,s)=>{
ctx.fillStyle='#c4a588';ctx.fillRect(0,0,s,s);
for(let i=0;i<22000;i++){
const x=(i*47.13)%s,y=(i*29.17+i*i*.00053)%s;
const light=(i*27)%63;
ctx.fillStyle=light<33?'rgba(75,47,27,.041)':'rgba(246,225,196,.05)';
ctx.fillRect(x,y,1+(i%4),1+(i%2));
}
for(let i=0;i<20;i++){
ctx.strokeStyle='rgba(85,57,39,.075)';ctx.lineWidth=.7+(i%3)*.5;
const sy=(i*33)%s;ctx.beginPath();ctx.moveTo(0,sy);
for(let x=0;x<=s;x+=9)ctx.lineTo(x,sy+Math.sin(x*.01+i)*2.5);ctx.stroke();
}
},512);
}
function tubeBetween(a:THREE.Vector3,b:THREE.Vector3,r:number,mat:THREE.Material,segments=10):THREE.Mesh{
const vec=b.clone().sub(a),mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,vec.length(),segments),mat);
mesh.position.copy(a).addScaledVector(vec,.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vec.normalize());mesh.castShadow=true;return mesh;
}
function lampTrack(group:THREE.Group,x:number,center:number,length:number,brass:THREE.Material){
const dark=new THREE.MeshStandardMaterial({color:'#302219',metalness:.67,roughness:.36});
group.add(box(.055,.045,length,dark,x,4.17,center));
for(let z=center-length/2+.44;z<center+length/2-.3;z+=1.38){
const socket=new THREE.Mesh(new THREE.CylinderGeometry(.065,.079,.16,12),dark);
socket.rotation.x=Math.PI;socket.position.set(x,4.04,z);group.add(socket);
const lens=new THREE.Mesh(new THREE.CircleGeometry(.043,12),new THREE.MeshBasicMaterial({color:'#ffe8b9'}));
lens.rotation.x=Math.PI/2;lens.position.set(x,3.94,z);group.add(lens);
group.add(tubeBetween(new THREE.Vector3(x,4.16,z),new THREE.Vector3(x,4.09,z),.015,brass));
}
}
/** A cheap reflected-corridor study in touch tier. CINEMA retains an actual Reflector.
 * Physical mirror content is deliberately not a reference PNG pasted on the wall.
 */
function mirrorFallbackTexture():THREE.CanvasTexture{
 return canvasTexture((ctx,size)=>{
  const bg=ctx.createLinearGradient(0,0,0,size);
  bg.addColorStop(0,'#b9a085');bg.addColorStop(.3,'#8c7359');
  bg.addColorStop(.78,'#4d4035');bg.addColorStop(1,'#76634f');
  ctx.fillStyle=bg;ctx.fillRect(0,0,size,size);
  const vp=size/2;
  for(let i=0;i<5;i++){
    const e=i*35;
    const x=e*.54,y=e*.62,wide=size-e*1.08,high=size-e*1.37;
    ctx.fillStyle=i%2===0?'rgba(29,24,23,.29)':'rgba(177,147,107,.16)';
    ctx.fillRect(x,y,wide,high);
    ctx.strokeStyle='rgba(223,184,126,.72)';ctx.lineWidth=Math.max(2,8-i*1.2);
    ctx.beginPath();ctx.moveTo(x+5,y+high);ctx.lineTo(x+5,y+high*.31);
    ctx.quadraticCurveTo(vp,y-high*.25,x+wide-5,y+high*.31);
    ctx.lineTo(x+wide-5,y+high);ctx.stroke();
  }
  ctx.strokeStyle='rgba(240,198,128,.85)';ctx.lineWidth=7;
  ctx.beginPath();ctx.moveTo(vp,size*.07);ctx.lineTo(vp,size*.65);ctx.stroke();
  ctx.strokeStyle='rgba(255,230,182,.4)';ctx.lineWidth=2;
  for(let i=0;i<8;i++){
   const y=size*.23+i*35;ctx.beginPath();ctx.moveTo(vp*.2+i*13,y);ctx.lineTo(size-vp*.2-i*13,y);ctx.stroke();
  }
 },512);
}
function limestoneArch(w:number,h:number,thickness:number,material:THREE.Material):THREE.Mesh{
const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(w/2,h);shape.lineTo(-w/2,h);shape.closePath();
const hole=new THREE.Path();const r=w*.36, shoulder=h-r*.97;
hole.moveTo(-r,0);hole.lineTo(-r,shoulder);hole.absarc(0,shoulder,r,Math.PI,0,true);hole.lineTo(r,0);hole.lineTo(-r,0);
shape.holes.push(hole);
const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:thickness,steps:1,bevelEnabled:false,curveSegments:24}),material);
mesh.receiveShadow=true;mesh.castShadow=true;return mesh;
}
function curtain(cx:number,z:number,w:number,h:number,material:THREE.Material,deep=.20):THREE.Mesh{
const g=new THREE.PlaneGeometry(w,h,96,30);const p=g.getAttribute('position') as THREE.BufferAttribute;
for(let i=0;i<p.count;i++){
const x=p.getX(i),y=p.getY(i),u=(x/w+.5),v=y/h+.5;
const fold=Math.sin(u*Math.PI*16)*deep+Math.sin(u*Math.PI*31)*deep*.18;
p.setXYZ(i,x*(.93+.07*(1-v)),y,fold*(.55+.45*v)+Math.abs(Math.cos(u*Math.PI*16))*.014);
}
g.computeVertexNormals();const mesh=new THREE.Mesh(g,material);mesh.position.set(cx,h/2+.035,z);
mesh.castShadow=true;mesh.receiveShadow=true;mesh.name='flagship-curtain';return mesh;
}
function bench(kit:Kit):THREE.Group{
const g=new THREE.Group();g.name='boucle-lounge-chair';
const boucle=new THREE.MeshStandardMaterial({color:'#ead4ba',roughness:1,metalness:0,bumpMap:kit.weave,bumpScale:.016});
const seat=new THREE.Mesh(new THREE.CylinderGeometry(.64,.66,.43,48),boucle);seat.position.set(0,.29,0);seat.castShadow=true;g.add(seat);
const back=new THREE.Mesh(new THREE.SphereGeometry(.7,24,16,0,Math.PI*2,0,Math.PI*.65),boucle);
back.position.set(0,.74,-.28);back.scale.set(1,.63,.65);back.castShadow=true;g.add(back);
g.add(contact(kit,1.6,1.5,0,0));return g;
}
function shopFlower(materials:Kit):THREE.Group{
const g=new THREE.Group();
const vase=new THREE.Mesh(new THREE.SphereGeometry(.21,20,16),materials.travertine);vase.position.y=.21;vase.scale.set(1,1.3,1);g.add(vase);
const leaf=new THREE.MeshStandardMaterial({color:'#616242',roughness:.84,side:THREE.DoubleSide});
const gold=new THREE.MeshStandardMaterial({color:'#857343',roughness:.8});
for(let i=0;i<18;i++){
const a=i*2.399,z=(i%3)*.12;const x=Math.sin(a)*(.11+i*.014),y=.44+i*.039;
const top=new THREE.Vector3(x,y,z+Math.cos(a)*.09);
g.add(tubeBetween(new THREE.Vector3(0,.41,0),top,.0075,gold,6));
const p=new THREE.Mesh(new THREE.ConeGeometry(.045+.016*(i%4),.16,6),leaf);
p.rotation.z=Math.sin(a)*.8;p.rotation.x=Math.cos(a)*.8;p.position.copy(top);g.add(p);
}return g;
}
export function buildAtelier59(kit:Kit,tier:Tier):THREE.Group{
const g=new THREE.Group();g.name='FLAGSHIP-ATELIER-V59-REBUILD';
const limestone=new THREE.MeshStandardMaterial({map:limestoneTexture(),roughness:.86,metalness:0,color:'#f4e7d7'});
const darkWood=new THREE.MeshStandardMaterial({color:'#40291d',roughness:.66});
const floorMat=new THREE.MeshStandardMaterial({map:parquetTexture(),color:'#f0d0aa',roughness:.42,metalness:.025});
floorMat.map!.repeat.set(3,5);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(10.4,16.4),floorMat);floor.rotation.x=-Math.PI/2;floor.position.set(0,.004,-9.25);floor.receiveShadow=true;g.add(floor);
g.add(box(10.4,.17,16.4,darkWood,0,-.09,-9.25));
const ceiling=new THREE.Mesh(new THREE.PlaneGeometry(10.4,16.1),new THREE.MeshStandardMaterial({color:'#d7b99a',roughness:1}));
ceiling.rotation.x=Math.PI/2;ceiling.position.set(0,4.22,-9.25);g.add(ceiling);
const W=5.2,back=-17.2;
for(const side of [-1,1]){
const frontSide=box(.28,4.22,1.34,limestone,side*5.08,2.11,-2.05);g.add(frontSide);
const arch=limestoneArch(3.43,4.22,.3,limestone);arch.rotation.y=side*Math.PI/2;
arch.position.set(side*4.94,0,-4.56);g.add(arch);
const recess=box(.08,4.22,3.43,new THREE.MeshStandardMaterial({color:'#927359',roughness:1}),side*6.66,2.11,-4.56);g.add(recess);
g.add(box(1.5,4.22,.13,limestone,side*5.91,2.11,-6.29));
g.add(box(.2,4.22,10.95,limestone,side*5.1,2.11,-11.75));
g.add(box(.06,.16,16,kit.brass,side*5.01,.08,-9.25));
const inset=new THREE.Mesh(new THREE.TorusGeometry(1.2,.22,12,44,Math.PI),limestone);
inset.rotation.y=side*Math.PI/2;inset.position.set(side*4.83,2.8,-4.55);g.add(inset);
}
// Reference 02: TWO deep limestone vaults facing the entrance.
 // The previous side-rotated thin arch was edge-on from the hero camera.
 // These have real arched clear apertures. Garment rails can pass through
 // the openings but cannot intersect the stone returns.
 for(const side of [-1,1]){
   const portal=limestoneArch(3.03,4.21,.58,limestone);
   portal.name=side<0?'limestone-vault-left':'limestone-vault-right';
   portal.position.set(side*3.73,0,-8.10);
   portal.receiveShadow=true;g.add(portal);
   const returnWall=box(.22,4.21,.72,limestone,side*5.15,2.105,-8.08);
   g.add(returnWall);
   const vaultLight=spot('#ffe0af',8,[side*3.86,3.91,-7.82],[side*3.73,2.0,-8.65],.83,.89);
   g.add(vaultLight,vaultLight.target);
 }
 for(const x of [-2.75,0,2.75])lampTrack(g,x,-9.5,13.8,kit.brass);
const backWall=box(10.4,4.22,.25,limestone,0,2.11,back-.08);backWall.receiveShadow=true;g.add(backWall);
const sidePanelMaterial=new THREE.MeshStandardMaterial({color:'#60462f',metalness:.13,roughness:.78});
g.add(box(.12,3.7,.2,sidePanelMaterial,-4.96,1.85,-17));
const brassTrim=kit.brass;
const frame=archFrame(1.81,3.5,.065,.055,brassTrim);frame.position.set(-.68,.08,back+.18);g.add(frame);
const archShape=new THREE.Shape();const mw=1.66,mr=mw/2,mh=3.38;
archShape.moveTo(-mr,0);archShape.lineTo(-mr,mh-mr);archShape.absarc(0,mh-mr,mr,Math.PI,0,true);archShape.lineTo(mr,0);archShape.closePath();
if(tier==='cinema'){
const mirror=new Reflector(new THREE.ShapeGeometry(archShape,24),{clipBias:.006,textureWidth:384,textureHeight:512,color:0x8f806c});
mirror.position.set(-.68,.16,back+.224);mirror.name='flagship-real-mirror';g.add(mirror);
}else{
const mirror=new THREE.Mesh(new THREE.ShapeGeometry(archShape,24),new THREE.MeshBasicMaterial({map:mirrorFallbackTexture(),side:THREE.DoubleSide}));
mirror.position.set(-.68,.16,back+.224);mirror.name='flagship-mirror-essential';g.add(mirror);
}
const drapeFrame=archFrame(2.65,3.48,.38,.26,limestone);drapeFrame.position.set(2.19,.08,back+.34);g.add(drapeFrame);
const velvet=new THREE.MeshPhysicalMaterial({color:'#8d6342',roughness:.94,metalness:0,sheen:1,sheenColor:new THREE.Color('#d1b391'),side:THREE.DoubleSide});
g.add(curtain(2.19,back+.55,2.25,3.3,velvet,.19));
g.add(box(2.31,.04,.055,kit.brass,2.19,3.41,back+.57));
const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(.68,.72,.84,42),limestone);pedestal.position.set(-3.03,.42,-15.9);pedestal.castShadow=true;g.add(pedestal);
g.add(contact(kit,1.65,1.65,-3.03,-15.9));
const handbag=leatherHandbag('#69302f',kit.brass);handbag.scale.setScalar(.9);handbag.position.set(-3.03,.84,-15.9);g.add(handbag);
const flower=shopFlower(kit);flower.scale.setScalar(.55);flower.position.set(-.65,.12,-16.96);g.add(flower);
const seat=bench(kit);seat.position.set(-2.75,0,-14.45);seat.rotation.y=.4;g.add(seat);
const showroomSpot=spot('#ffdbb2',37,[0,4.15,-8.8],[0,1.05,-9.1],.95,.78);g.add(showroomSpot,showroomSpot.target);
for(const side of [-1,1]){
const light=spot('#ffe0ba',43,[side*2.8,4.15,-7.2],[side*3.4,1,-8.0],.93,.9);g.add(light,light.target);
}
const rearLight=spot('#ffdeb1',33,[.2,4.08,-14.3],[1.1,1.3,-16.7],.9,.9);g.add(rearLight,rearLight.target);
g.add(new THREE.HemisphereLight('#e4c19a','#372717',.88));
g.add(new THREE.AmbientLight('#f2d4ad',.28));
return g;
}
export function leatherHandbag(color:string,brass:THREE.Material):THREE.Group{
const g=new THREE.Group();const leather=new THREE.MeshStandardMaterial({color,roughness:.57,metalness:.04});
const body=new THREE.Mesh(new THREE.BoxGeometry(.4,.32,.18),leather);body.position.y=.17;body.castShadow=true;g.add(body);
const flap=new THREE.Mesh(new THREE.BoxGeometry(.404,.09,.19),leather);flap.position.y=.3;g.add(flap);
const handle=new THREE.Mesh(new THREE.TorusGeometry(.118,.018,8,26,Math.PI),brass);handle.position.y=.34;handle.rotation.z=Math.PI;g.add(handle);
g.add(box(.065,.056,.012,brass,0,.23,.102));return g;
}
let sharedLaceTexture:THREE.CanvasTexture|null=null;
export function editorialGarment(side:-1|1,index:number):THREE.Group{
const g=new THREE.Group();g.name='couture-volumetric-study-not-product-scan';g.userData.editorial3d=true;
const palette=side===-1?IVORY:BORDEAUX;
const hue=palette[index%palette.length]!;
const mat=new THREE.MeshPhysicalMaterial({color:hue,roughness:side===-1?.49:.68,metalness:0,sheen:1,
sheenColor:new THREE.Color(side===-1?'#dbc3a7':'#8e4350'),sheenRoughness:.34,side:THREE.DoubleSide});
const count=36,rows=32,verts:number[]=[],uv:number[]=[],indices:number[]=[];
const long=side===1||index%5!==3,height=long?2.12:1.77;
const topY=-.43,bottom=-height;
for(let j=0;j<=rows;j++){
const t=j/rows,y=topY+(bottom-topY)*t;
const waist=Math.exp(-Math.pow((t-.32)/.17,2));
 const sweep=t*t*(3-2*t);
 const body=.17+.08*Math.sin(Math.PI*Math.min(t,.7)/.7);
 const flare=(index%4===0?.15:index%3===0?.09:.045)*sweep;
 const bust=(body*(1-.43*waist)+flare)*(1+.02*Math.cos(index*3));
for(let i=0;i<=count;i++){
const a=2*Math.PI*i/count;
const pleat=t*t*(.075*Math.sin(a*7+index*.67)+.035*Math.sin(a*11-index*.45));
 const r=Math.max(.085,bust*(1+pleat)+.016*Math.sin(a*5+index)*sweep);
const hem=t>.92?(t-.92)*.18*Math.sin(a*8+index*1.2):0;
 verts.push(Math.sin(a)*r,y+hem,Math.cos(a)*r*.66);
uv.push(i/count,t);
if(j<rows&&i<count){const base=j*(count+1)+i;indices.push(base,base+count+1,base+1,base+1,base+count+1,base+count+2);}
}
}
const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
const skirt=new THREE.Mesh(geo,mat);skirt.castShadow=true;skirt.receiveShadow=true;g.add(skirt);
const bodice=new THREE.Mesh(new THREE.SphereGeometry(.175,22,16),mat);
 bodice.position.set(0,-.27,0);bodice.scale.set(1.15,1.14,.49);bodice.castShadow=true;g.add(bodice);
 const waistBand=new THREE.Mesh(new THREE.TorusGeometry(.153,.021,8,32),mat);
 waistBand.rotation.x=Math.PI/2;waistBand.scale.y=.64;waistBand.position.y=-.47;g.add(waistBand);
const neck=new THREE.Mesh(new THREE.TorusGeometry(.1,.018,8,24,Math.PI),mat);neck.position.set(0,-.105,.025);neck.rotation.z=Math.PI;g.add(neck);
for(const s of [-1,1])g.add(tubeBetween(new THREE.Vector3(s*.12,-.15,0),new THREE.Vector3(s*.12,-.06,0),.013,mat,7));
if(index%4===0){
for(let sideFold of [-1,1]){
const edge=curtain(sideFold*.05,-.03,.18,.74,mat,.10);edge.position.y=-.9;edge.rotation.z=sideFold*.07;g.add(edge);
}
}
// Three volumetric, asymmetric silk folds create shadow and non-flat drape.
if(index%3!==2){
 for(let k=0;k<2;k++){
  const silk=curtain((k-.5)*.105,.165,.19,1.05,mat,.052);
  silk.position.y=-.98+k*.1;silk.rotation.z=k===0?-.13:.16;
  silk.castShadow=true;g.add(silk);
 }
}
// Textile lace on selected ivory pieces; generated repeatable pattern, not an image facade.
if(side===-1&&index%4===1){
 if(!sharedLaceTexture){
  sharedLaceTexture=canvasTexture((ctx,size)=>{
   ctx.clearRect(0,0,size,size);
   for(let x=12;x<size;x+=42)for(let y=12;y<size;y+=42){
    ctx.strokeStyle='rgba(255,248,227,.92)';ctx.lineWidth=2.3;
    for(let k=0;k<6;k++){
     const a=k*Math.PI/3;
     ctx.beginPath();ctx.ellipse(x+Math.cos(a)*11,y+Math.sin(a)*11,6.1,3.8,a,0,Math.PI*2);ctx.stroke();
    }
    ctx.fillStyle='rgba(255,252,238,.83)';ctx.beginPath();ctx.arc(x,y,3.1,0,Math.PI*2);ctx.fill();
   }
  },256);
  sharedLaceTexture.repeat.set(2.5,4.5);
 }
 const laceMat=new THREE.MeshPhysicalMaterial({map:sharedLaceTexture,transparent:true,opacity:.85,
  roughness:.83,metalness:0,side:THREE.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
 const lace=curtain(0,.17,.41,1.23,laceMat,.023);
 lace.position.y=-1.03;g.add(lace);
}
const hangerMat=new THREE.MeshStandardMaterial({color:'#4a3026',roughness:.64});
g.add(tubeBetween(new THREE.Vector3(-.24,-.08,0),new THREE.Vector3(0,.07,0),.020,hangerMat,8));
g.add(tubeBetween(new THREE.Vector3(0,.07,0),new THREE.Vector3(.24,-.08,0),.020,hangerMat,8));
g.add(tubeBetween(new THREE.Vector3(-.24,-.08,0),new THREE.Vector3(.24,-.08,0),.013,hangerMat,8));
const hook=new THREE.Mesh(new THREE.TorusGeometry(.042,.008,8,18,Math.PI*1.3),new THREE.MeshStandardMaterial({color:'#ba9367',metalness:.9,roughness:.23}));
hook.rotation.z=Math.PI*.25;hook.position.y=.112;g.add(hook);
return g;
}
export function buildFlagshipFacade(kit:Kit,tier:Tier):{group:THREE.Group;setDoors(open:number):void}{
const g=new THREE.Group();g.name='flagship-3-bay-portal';
const limestone=new THREE.MeshStandardMaterial({map:limestoneTexture(),color:'#efddc4',roughness:.78});
const darkBronze=new THREE.MeshStandardMaterial({color:'#664225',metalness:.78,roughness:.29});
const bronze=kit.brass;
const W=8,H=5.35;
const outline=new THREE.Shape();outline.moveTo(-W,0);outline.lineTo(W,0);outline.lineTo(W,H);outline.lineTo(-W,H);outline.closePath();
for(const [x0,x1,y0,y1] of ([[-7.05,-3.14,.42,3.75],[-2.76,2.76,0,3.66],[3.14,7.05,.42,3.75]] as const)){
const hole=new THREE.Path();hole.moveTo(x0,y0);hole.lineTo(x0,y1);hole.lineTo(x1,y1);hole.lineTo(x1,y0);hole.closePath();outline.holes.push(hole);
}
const portal=new THREE.Mesh(new THREE.ExtrudeGeometry(outline,{depth:.55,steps:1,bevelEnabled:false}),limestone);
portal.position.z=-.26;portal.castShadow=true;portal.receiveShadow=true;g.add(portal);
for(const side of [-1,1]){
g.add(box(.22,5.38,.7,limestone,side*7.82,2.69,-.18));
}
const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=200;
const ctx=canvas.getContext('2d')!;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.textAlign='center';ctx.textBaseline='middle';
ctx.font='94px Georgia,serif';ctx.fillStyle='#6e4729';ctx.shadowColor='rgba(255,190,103,.4)';ctx.shadowBlur=6;ctx.fillText('B E L L E   A L E N C A R',768,111);
const signTex=new THREE.CanvasTexture(canvas);signTex.colorSpace=THREE.SRGBColorSpace;
const sign=new THREE.Mesh(new THREE.PlaneGeometry(7.5,.96),new THREE.MeshBasicMaterial({map:signTex,transparent:true,depthWrite:false}));
sign.position.set(0,4.45,.309);g.add(sign);
for(const x of [-5.1,0,5.1]){
const highlight=spot('#ffd5a0',12,[x,5.2,1],[x,3.7,0],.72,.88);g.add(highlight,highlight.target);
}
function frame(x0:number,x1:number,y0:number,y1:number,z=.29){
const m=.07;g.add(box(x1-x0+m,m,.13,darkBronze,(x0+x1)/2,y1,z));
g.add(box(x1-x0+m,m,.13,darkBronze,(x0+x1)/2,y0,z));
g.add(box(m,y1-y0,.13,darkBronze,x0,(y0+y1)/2,z));
g.add(box(m,y1-y0,.13,darkBronze,x1,(y0+y1)/2,z));
}
frame(-7.05,-3.14,.42,3.75);frame(3.14,7.05,.42,3.75);frame(-2.76,2.76,.03,3.66);
g.add(box(5.4,.015,.75,darkBronze,0,.009,.0));
for(const side of [-1,1]){
const x=side*5.1;
const stoneBack=box(3.82,3.33,.13,limestone,x,2.08,-1.73);g.add(stoneBack);
const step=box(3.86,.20,1.94,limestone,x,.47,-.65);step.receiveShadow=true;g.add(step);
for(const dir of [-1,1])g.add(box(.11,3.32,2.01,limestone,x+dir*1.92,2.08,-.68));
const ledge=box(3.85,.07,2.04,limestone,x,3.73,-.62);g.add(ledge);
const lens=new THREE.Mesh(new THREE.PlaneGeometry(3.81,3.23),new THREE.MeshPhysicalMaterial({color:'#c9a47c',roughness:.075,metalness:.04,transparent:true,opacity:.09,side:THREE.DoubleSide,depthWrite:false}));
lens.position.set(x,2.09,.34);g.add(lens);
g.add(box(3.72,.023,.055,kit.light,x,3.59,-.18));
const light=spot('#ffc993',26,[x,3.56,-.2],[x,.7,-.7],.8,.86);g.add(light,light.target);
}
const plinthA=box(.9,1.26,.72,limestone,-5.75,.63,-.52);g.add(plinthA);
const plinthB=box(.65,.63,.66,limestone,-4.38,.315,-.41);g.add(plinthB);
const florals=shopFlower(kit);florals.scale.set(1.75,1.75,1.75);florals.position.set(-5.75,1.26,-.55);g.add(florals);
const handbag=leatherHandbag('#66302e',bronze);handbag.position.set(-4.38,.64,-.45);g.add(handbag);
const wine=editorialGarment(1,5);wine.scale.set(1.65,1.82,1.5);wine.position.set(5.15,2.85,-.53);
wine.rotation.y=0;g.add(wine);
const gownBase=new THREE.Mesh(new THREE.CylinderGeometry(.38,.42,.08,28),limestone);gownBase.position.set(5.15,.05,-.57);g.add(gownBase);
const doors:THREE.Group[]=[];
for(const side of [-1,1]){
const leaf=new THREE.Group();leaf.position.set(side*2.76,0,.29);
const localX=side===-1?1.38:-1.38;
const pane=new THREE.Mesh(new THREE.BoxGeometry(2.69,3.50,.038),
new THREE.MeshPhysicalMaterial({color:'#c8b398',metalness:0,roughness:.12,transparent:true,opacity:.11,depthWrite:false,side:THREE.DoubleSide}));
pane.position.set(localX,1.83,0);leaf.add(pane);
for(const z of [-.028,.028]){
leaf.add(box(2.7,.037,.046,darkBronze,localX,3.59,z));
leaf.add(box(2.7,.037,.046,darkBronze,localX,.07,z));
leaf.add(box(.04,3.52,.05,darkBronze,localX*2,1.83,z));
leaf.add(box(.04,3.52,.05,darkBronze,0,1.83,z));
}
const handleX=side===-1?2.45:-2.45;
for(const z of [-.08,.09]){
const grip=box(.055,1.28,.06,bronze,handleX,1.84,z);grip.castShadow=true;leaf.add(grip);
leaf.add(box(.10,.034,.10,bronze,handleX,1.2,z));
leaf.add(box(.10,.034,.10,bronze,handleX,2.48,z));
}
g.add(leaf);doors.push(leaf);
}
for(const side of [-1,1])g.add(box(.19,3.65,1.75,limestone,side*2.83,1.825,-.63));
g.add(box(5.6,.18,1.75,limestone,0,3.74,-.63));
return {group:g,setDoors(open:number){const o=clamp(open,0,1);doors[0]!.rotation.y=-o*1.15;doors[1]!.rotation.y=o*1.15;}};
}
