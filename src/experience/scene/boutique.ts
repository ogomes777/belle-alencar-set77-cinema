/**
 * Boutique (z < -1.4): piso de carvalho em espinha de peixe, gesso marfim,
 * nichos em arco, araras de latão com cabides em mola, pódio central,
 * três arcos de categoria no fundo e provador com espelho.
 */
import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { archFrame, archPanel, box, contact, plane, spot, type Kit } from './kit';
import { labelTexture } from '../textures';
import { DEMO_CATALOG, productById } from '../../commerce/catalog.demo';
import type { Product, Category } from '../../commerce/types';
import { DISPLAY_HEIGHT, disposeProductDisplay, productDisplay, supportedProduct } from './product';
import { buildAtelier59, editorialGarment } from './atelier59';
import type { Tier } from '../../core/tier';

export const ROOM = { x: 5.2, zFront: -1.4, zBack: -17.2, h: 4.2 };
export const RAIL = { y: 2.28, x: 3.45, z0: -3.12, z1: -11.9 };
export const HERO_HANGER = new THREE.Vector3(RAIL.x, RAIL.y, -6.4);
export const PODIUM = new THREE.Vector3(-1.82, 0.2, -12.15);
export const FITTING = new THREE.Vector3(2.25, 0, -16.25);
export const ARCHES = [-3.6, -1.2, 1.2];

export interface BoutiqueHandle {
  group: THREE.Group;
  update(dt: number, ctx: { camera: THREE.Camera; camVel: number; pointer: THREE.Vector2 | null; pointerVel: number; archFocus: number; fittingActive: boolean; heroOnRail: boolean; sweep: number }): void;
  mirror: Reflector | null;
  setProduct(productId: string | null): void;
  browse(dir:number):Product|null;
  activeProduct():Product|null;
  pick(ndc:THREE.Vector2,camera:THREE.Camera):Product|null;
  hover(ndc:THREE.Vector2,camera:THREE.Camera):Product|null;
  select(id:string|null):void;
  hideProduct(id:string,hide:boolean):void;
  productPosition(id:string):{position:THREE.Vector3;width:number;height:number}|null;
  cameraShift():number;
  focusPoint():THREE.Vector3;
  railPosition():{index:number;total:number};
  bagPosition():THREE.Vector3;
  bagWidth():number;
  impactBag():void;
  bagHit(ndc:THREE.Vector2,camera:THREE.Camera):boolean;
  setSideCategory(side: -1|1, category: Category | null, page?:number, selectedId?:string|null):Product[];
  lastPickedSide():-1|1;
  sideFor(id:string): -1|1|null;
  sideProducts(side:-1|1):Product[];
}

interface Swing {
  ax: number; az: number; vx: number; vz: number;
  hook:THREE.Vector3; yaw:number; mesh:THREE.Object3D; clipped:boolean;
  product:Product;side:number;baseZ:number;focus:number;focusV:number;slide:number;
}

export function buildBoutique(kit: Kit, tier: Tier, dpr: number): BoutiqueHandle {
  const g = new THREE.Group();
  g.name = 'boutique';
  const { x: X, zFront, zBack, h: H } = ROOM;
  const L = zFront - zBack;
  const zc = (zFront + zBack) / 2;

  // V59: the V58 showroom was removed. This is a rebuilt, physical flagship,
  // with approved reference 02 as the single plant (not six unrelated backdrops).
  g.add(buildAtelier59(kit,tier));

  // araras de latão
  for (const side of [-1, 1]) {
    const len = RAIL.z0 - RAIL.z1;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, len, 12), kit.brass);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(side * RAIL.x, RAIL.y, (RAIL.z0 + RAIL.z1) / 2);
    g.add(bar);
    // Independent freestanding fixture: vertical poles stand ON two stone
    // blocks. No horizontal attachment to the wall; rear passage stays open.
    for(const z of [RAIL.z0,RAIL.z1]){
      const foot=box(.68,.23,.82,kit.travertine,side*RAIL.x,.115,z);
      foot.castShadow=true;foot.receiveShadow=true;g.add(foot);
      g.add(contact(kit,.9,1.02,side*RAIL.x,z));
      const riser=new THREE.Mesh(new THREE.CylinderGeometry(.021,.025,RAIL.y-.22,12),kit.brass);
      riser.position.set(side*RAIL.x,(RAIL.y+.22)/2,z);
      g.add(riser);
      const cap=new THREE.Mesh(new THREE.SphereGeometry(.036,10,8),kit.brass);
      cap.position.set(side*RAIL.x,RAIL.y,z);g.add(cap);
    }
  }

  // Canonical garments only. Jewelry and bags remain on their own displays.
  const clothing=DEMO_CATALOG.filter(product=>!['bolsas','pulseiras','aneis'].includes(product.category));
  const perRail = 16; // 15 roupas por parede + espaço para o vestido protagonista.
  const hangerGeo = new THREE.TorusGeometry(0.17, 0.006, 5, 24, Math.PI * 0.62);
  hangerGeo.rotateZ(Math.PI * 0.19);
  const hookGeo = new THREE.TorusGeometry(0.025, 0.004, 5, 12, Math.PI * 1.3);
  hookGeo.translate(0, 0.17 + 0.012, 0);
  const hangers = new THREE.InstancedMesh(hangerGeo, kit.brass, perRail * 2 + 1);
  const hooks = new THREE.InstancedMesh(hookGeo, kit.brass, perRail * 2 + 1);
  g.add(hangers, hooks);
  const clipBars=new THREE.InstancedMesh(new THREE.BoxGeometry(.34,.015,.018),kit.brass,perRail*2+1);
  const clipPins=new THREE.InstancedMesh(new THREE.BoxGeometry(.025,.055,.025),kit.brass,(perRail*2+1)*2);
  const hidden=new THREE.Matrix4().makeScale(0,0,0);
  for(let i=0;i<perRail*2+1;i++){clipBars.setMatrixAt(i,hidden);clipPins.setMatrixAt(i*2,hidden);clipPins.setMatrixAt(i*2+1,hidden);}
  g.add(clipBars,clipPins);
  const swings:Swing[]=[];
  const rightSwings:Swing[]=[];
  const leftSwings:Swing[]=[];
  let focusIndex=4,hoverId:string|null=null,selectedId:string|null=null;
  const raycaster=new THREE.Raycaster();
  let hi=0;
  for (const side of [-1, 1]) {
    for (let k = 0; k < perRail; k++) {
      const z = RAIL.z0 - 0.25 - (k / (perRail - 1)) * (RAIL.z0 - RAIL.z1 - 0.5);
      if (side === -1 && k === perRail-1) continue;
      if (side === 1 && k === 6) continue; // um único cabide reservado ao protagonista
      // Order is stable: 15 left + 15 right, every one of the 30 outfits once.
      const product=clothing[hi]!;
      const pivot=new THREE.Group(); pivot.userData.dynamic=true;
      const display=editorialGarment(side as -1|1,k);
      pivot.add(display); g.add(pivot);
      const clipped=product.category==='saias'||product.category==='calcas';
      const swing:Swing={ax:0,az:0,vx:0,vz:0,hook:new THREE.Vector3(side*RAIL.x,RAIL.y,z),yaw:side*-Math.PI/2,mesh:pivot,clipped,product,side,baseZ:z,focus:0,focusV:0,slide:0};
      swings.push(swing);
      if(side===1)rightSwings.push(swing); else leftSwings.push(swing);
      hi++;
    }
  }
  // Start on the right wall. Continuing left enters the other rail in the SAME room.
  const railSwings=[...rightSwings,...leftSwings];
  hangers.count = hooks.count = clipBars.count = hi + 1;
  clipPins.count=(hi+1)*2;
  // cabide vazio do protagonista (fica na arara quando o vestido sai)
  const heroHangerIndex = hi;

  const tmpQ = new THREE.Quaternion();
  const tmpE = new THREE.Euler();
  const offHanger = new THREE.Matrix4().makeTranslation(0, -0.2, 0);
  const clipOffsets=[new THREE.Matrix4().makeTranslation(-.12,-.22,0),new THREE.Matrix4().makeTranslation(.12,-.22,0)];
  const one = new THREE.Vector3(1, 1, 1);
  const base = new THREE.Matrix4();
  const out = new THREE.Matrix4();
  const writeSwing = (s: Swing, hiIdx: number) => {
    tmpE.set(s.ax, s.yaw, s.az, 'YXZ');
    tmpQ.setFromEuler(tmpE);
    base.compose(s.hook, tmpQ, one);
    s.mesh.matrixAutoUpdate=false;
    s.mesh.matrix.copy(base);
    s.mesh.matrixWorldNeedsUpdate=true;
    out.multiplyMatrices(base, offHanger);
    hangers.setMatrixAt(hiIdx, s.clipped?hidden:out);
    hooks.setMatrixAt(hiIdx, out);
    clipBars.setMatrixAt(hiIdx,s.clipped?out:hidden);
    for(let side=0;side<2;side++) {
      if(s.clipped) {
        out.multiplyMatrices(base,clipOffsets[side]!);
        clipPins.setMatrixAt(hiIdx*2+side,out);
      } else clipPins.setMatrixAt(hiIdx*2+side,hidden);
    }
  };
  swings.forEach((s, i) => writeSwing(s, i));
  const heroSwing: Swing = { ax:0,az:0,vx:0,vz:0,hook:HERO_HANGER.clone(),yaw:-Math.PI/2,mesh:new THREE.Group(),clipped:false,product:clothing[0]!,side:1,baseZ:HERO_HANGER.z,focus:0,focusV:0,slide:0 };
  const writeHero = () => {
    tmpE.set(heroSwing.ax, heroSwing.yaw, heroSwing.az, 'YXZ');
    tmpQ.setFromEuler(tmpE);
    base.compose(heroSwing.hook, tmpQ, one);
    out.multiplyMatrices(base, offHanger);
    hangers.setMatrixAt(heroHangerIndex, out);
    hooks.setMatrixAt(heroHangerIndex, out);
  };
  writeHero();


  // Loja única: saco de couro geométrico 3D no piso (não overlay duplicado).
  const bag=new THREE.Group();bag.name='sacola-no-piso';bag.userData.dynamic=true;bag.position.set(-3.03,.83,-15.85);
  const leather=new THREE.MeshStandardMaterial({color:'#643231',roughness:.53,metalness:.04,side:THREE.DoubleSide});
  const dark=new THREE.MeshStandardMaterial({color:'#493b2d',roughness:.94});
  const body=new THREE.Mesh(new THREE.BoxGeometry(.49,.51,.25),leather);body.position.y=.31;body.castShadow=true;bag.add(body);
  const mouth=new THREE.Mesh(new THREE.PlaneGeometry(.42,.18),dark);mouth.rotation.x=-Math.PI/2;mouth.position.y=.571;bag.add(mouth);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.243,.013,8,36,Math.PI),kit.brass);rim.rotation.x=Math.PI/2;rim.scale.y=.47;rim.position.set(0,.572,.015);bag.add(rim);
  for(const side of [-1,1]){
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.17,.55,side*.078),new THREE.Vector3(-.13,.80,side*.078),new THREE.Vector3(.13,.80,side*.078),new THREE.Vector3(.17,.55,side*.078)]);
    bag.add(new THREE.Mesh(new THREE.TubeGeometry(curve,20,.012,7,false),leather));
  }
  // O lettering vem do arquivo oficial da Belle, sem reconstrução tipográfica.
  // Placa inexistente: a impressão é aplicada na superfície frontal do couro,
  // com mapas alfa, para parecer uma gravação de folha dourada.
  const officialLogo=new THREE.TextureLoader().load('/brand/belle-alencar-logo.svg',texture=>{
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=4;
    texture.needsUpdate=true;
  });
  officialLogo.colorSpace=THREE.SRGBColorSpace;
  const foil=new THREE.Mesh(
    new THREE.PlaneGeometry(.37,.178),
    new THREE.MeshBasicMaterial({map:officialLogo,transparent:true,opacity:.97,
      depthWrite:false,alphaTest:.02,polygonOffset:true,polygonOffsetFactor:-1,toneMapped:false})
  );
  foil.name='logo-oficial-belle-alencar';
  foil.position.set(0,.325,.134);
  foil.renderOrder=3;
  bag.add(foil);
  // Uma costura delicada, não um adesivo sobre a marca.
  const seam=new THREE.Mesh(new THREE.PlaneGeometry(.426,.0028),
    new THREE.MeshBasicMaterial({color:'#bea170',transparent:true,opacity:.34,depthWrite:false}));
  seam.position.set(0,.104,.132);
  bag.add(seam);
  bag.add(box(.075,.055,.015,kit.brass,0,.44,.135));g.add(bag);g.add(contact(kit,.8,.48,2.05,-6.05));
  let bagPulse=0;
  let pickedSide:-1|1=1;
  const initialProduct=new Map(swings.map(s=>[s,s.product]));
  const slotsPerSide=8; // bounded GPU memory; paginate beyond eight products.
  function swingFor(id:string){return railSwings.find(s=>s.product.id===id)||null;}
  function setSideCategory(side:-1|1,category:Category|null,page=0,requestedId:string|null=null):Product[]{
    const activeSide=side===1?rightSwings:leftSwings;
    const items=category ? DEMO_CATALOG.filter(p=>p.active&&p.category===category)
      : activeSide.map(s=>initialProduct.get(s)!).filter(p=>p.active);
    const start=Math.max(0,page)*slotsPerSide;
    const window=items.slice(start,start+slotsPerSide);
    activeSide.forEach((s,i)=>{
      const next=category?window[i]??null:initialProduct.get(s)!;
      s.mesh.visible=!!next;
      if(!next)return;
      if(s.product.id===next.id)return;
      s.mesh.children.slice().forEach(obj=>{obj.removeFromParent();disposeProductDisplay(obj);});
      s.product=next;
      const display=category?productDisplay(next,DISPLAY_HEIGHT[next.category],'top'):editorialGarment(side,activeSide.indexOf(s));
      if(category)display.position.y=-.22;
      s.mesh.add(display);
      s.clipped=next.category==='saias'||next.category==='calcas';
    });
    if(requestedId){
      const index=railSwings.findIndex(s=>s.side===side&&s.product.id===requestedId&&s.mesh.visible);
      if(index>=0)focusIndex=index;
    }
    selectedId=requestedId??null;
    return items;
  }
  function hitRail(ndc:THREE.Vector2,camera:THREE.Camera):Swing|null{
    raycaster.setFromCamera(ndc,camera);
    for(const hit of raycaster.intersectObjects(railSwings.filter(s=>s.mesh.visible).map(s=>s.mesh),true)){
      let node:THREE.Object3D|null=hit.object;
      while(node&&node!==g){const found=railSwings.find(s=>s.mesh===node);if(found)return found;node=node.parent;}
    }
    // Raycast can miss a very thin 2.5D garment seen at an oblique angle.
    // Fallback uses the actual projected center and a tight click radius.
    let best:Swing|null=null,dist=.11;
    const projected=new THREE.Vector3();
    for(const swing of railSwings){
      if(!swing.mesh.visible)continue;
      swing.mesh.getWorldPosition(projected).project(camera);
      if(projected.z<0||projected.z>=1)continue;
      const d=Math.hypot(projected.x-ndc.x,(projected.y-.10)-ndc.y);
      if(d<dist){best=swing;dist=d;}
    }
    return best;
  }

  // Fitting product overlays continue to use the existing commercial API,
  // while the ARCHITECTURE (mirror, curtain, volume and seat) lives in Atelier59.
  const mirrorLook=new THREE.Group();mirrorLook.visible=false;g.add(mirrorLook);
  const glassGlare=new THREE.Mesh(new THREE.PlaneGeometry(.02,.02),
    new THREE.MeshBasicMaterial({transparent:true,opacity:0}));glassGlare.visible=false;g.add(glassGlare);
  const mirror: Reflector|null=null;

  // A selected product is a frontal supported photograph, never a claimed 360 try-on.
  const fittingDisplay=new THREE.Group();fittingDisplay.name='fitting-product-display';
  fittingDisplay.position.set(FITTING.x,0,FITTING.z);fittingDisplay.visible=false;g.add(fittingDisplay);
  let fittingProductId:string|null=null;
  const setProduct=(id:string|null) => {
    if(id===fittingProductId)return;
    fittingProductId=id;
    [...fittingDisplay.children].forEach(disposeProductDisplay);
    [...mirrorLook.children].forEach(disposeProductDisplay);
    if(!id){fittingDisplay.visible=false;mirrorLook.visible=false;return;}
    const product=productById(id);
    if(!product){fittingProductId=null;return;}
    const height=DISPLAY_HEIGHT[product.category];
    fittingDisplay.add(supportedProduct(kit,product.slug,height,.065));
    // Recorte espelhado na própria moldura: um só produto, mesma cor e textura.
    const reflection=productDisplay(product,Math.min(1.36,height*.86),'bottom');
    mirrorLook.add(reflection);
  };

  const archPanels:THREE.MeshStandardMaterial[]=[];
  const sweep=spot('#b48a60',0,[-1.6,2.6,-6.4],[0,1,-8],.16,.55);g.add(sweep,sweep.target);
  // Lighting and surfaces are now physically consistent in Atelier59.

  // Keep distant products in scene; architectural occlusion and frustum culling handle visibility.
  // atualização: molas dos cabides + foco dos arcos + espelho
  const proj = new THREE.Vector3();
  let t = 0;
  let heroKicked=false;
  return {
    browse(dir){
      focusIndex=THREE.MathUtils.clamp(focusIndex+Math.sign(dir),0,railSwings.length-1);
      hoverId=railSwings[focusIndex]?.product.id??null;
      return railSwings[focusIndex]?.product??null;
    },
    activeProduct(){return railSwings[focusIndex]?.product??null;},
    hover(ndc,camera){
      const hit=hitRail(ndc,camera);
      hoverId=hit?.product.id??null;
      return hit?.product??null;
    },
    pick(ndc,camera){
      const hit=hitRail(ndc,camera);
      if(hit){pickedSide=hit.side as -1|1;hoverId=hit.product.id;focusIndex=railSwings.indexOf(hit);}
      else hoverId=null;
      return hit?.product??null;
    },
    railPosition(){return {index:focusIndex+1,total:railSwings.length};},
    lastPickedSide(){return pickedSide;},
    sideFor(id){return (railSwings.find(s=>s.product.id===id&&s.mesh.visible)?.side??null) as -1|1|null;},
    sideProducts(side){return (side===1?rightSwings:leftSwings).filter(s=>s.mesh.visible).map(s=>s.product);},
    setSideCategory,
    focusPoint(){
      const s=railSwings[focusIndex];
      return new THREE.Vector3(s?.hook.x??RAIL.x,1.32,s?.hook.z??-6.4);
    },
    select(id){selectedId=id;},
    hideProduct(id,hide){const s=swingFor(id);if(s)s.mesh.visible=!hide;},
    productPosition(id){const s=swingFor(id);if(!s)return null;const p=s.mesh.getWorldPosition(new THREE.Vector3());p.y-=.22;return {position:p,width:(s.mesh.children[0]?.userData.displayWidth as number)||.65,height:DISPLAY_HEIGHT[s.product.category]};},
    cameraShift(){
      const swing=railSwings[focusIndex];
      return swing ? THREE.MathUtils.clamp(swing.baseZ+6.4,-3.2,3.2) : 0;
    },
    bagPosition(){bag.updateWorldMatrix(true,false);return bag.localToWorld(new THREE.Vector3(0,.58,.02));},
    bagWidth(){return .35;},
    impactBag(){bagPulse=1;},
    bagHit(ndc,camera){raycaster.setFromCamera(ndc,camera);return raycaster.intersectObject(bag,true).length>0;},
    group: g,
    mirror,
    setProduct,
    update(dt, ctx) {
      fittingDisplay.visible=!!fittingProductId&&ctx.fittingActive;
      mirrorLook.visible=!!fittingProductId&&ctx.fittingActive;
      glassGlare.visible=ctx.fittingActive;
      t+=dt;
      if(bagPulse>0){bagPulse=Math.max(0,bagPulse-dt*1.8);bag.rotation.z=Math.sin((1-bagPulse)*20)*.055*bagPulse;bag.scale.y=1+Math.sin((1-bagPulse)*22)*.04*bagPulse;}
      const k=34; // reactive but stable spring
      const c = 7.2; // physical damping prevents jitter and stuck twisting
      const camPos = (ctx.camera as THREE.PerspectiveCamera).position;
      swings.forEach((s,i)=>{
        const isSelected=s.product.id===selectedId;
        const isHovered=s.product.id===hoverId;
        const isFocused=s===railSwings[focusIndex];
        const goal=isSelected?.86:isHovered?.28:isFocused?.17:0;
        s.focusV+=(goal-s.focus)*46*dt;
        s.focusV*=Math.exp(-13*dt);
        s.focus=THREE.MathUtils.clamp(s.focus+s.focusV*dt,0,.88);
        const active=railSwings[focusIndex];
        // A peça fica no seu próprio cabide: não deslize a arara inteira para
        // frente/trás com cada seleção. Isso fazia planos fotográficos se cruzarem.
        const slideGoal=0;
        s.slide+=(slideGoal-s.slide)*(1-Math.exp(-dt*10));
        s.hook.set(s.side*(RAIL.x-.55*s.focus),RAIL.y+s.focus*.07,
          s.baseZ+s.slide);
        const face=Math.atan2(camPos.x-s.hook.x,camPos.z-s.hook.z);
        const natural=s.side*-Math.PI/2;
        // Shortest-angle interpolation: atan2 never jumps from +PI to -PI.
        // Limit the facing angle as if a real hanger twists on the rail.
        const delta=Math.atan2(Math.sin(face-natural),Math.cos(face-natural));
        const goalYaw=natural+THREE.MathUtils.clamp(delta,-1.05,1.05)*s.focus;
        const deltaYaw=Math.atan2(Math.sin(goalYaw-s.yaw),Math.cos(goalYaw-s.yaw));
        s.yaw+=deltaYaw*(1-Math.exp(-dt*9));
        const dx=camPos.x-s.hook.x;
        const dz = camPos.z - s.hook.z;
        const d2 = dx * dx + dz * dz;
        if (d2 < 9 && ctx.camVel > 0.02) {
          const f = (ctx.camVel * 0.9) / (1 + d2);
          s.vz += f * Math.sign(s.hook.x) * -0.6;
          s.vx += f * 0.3 * Math.sin(i * 1.7 + t);
        }
        if (ctx.pointer && ctx.pointerVel > 0.002) {
          proj.copy(s.hook).setY(1.3).project(ctx.camera);
          const pd = Math.hypot(proj.x - ctx.pointer.x, proj.y - ctx.pointer.y);
          if (pd < 0.12 && proj.z < 1) {
            s.vz += ctx.pointerVel * 14 * (0.12 - pd) * (Math.sign(s.hook.x) || 1);
            s.vx += ctx.pointerVel * 5 * (0.12 - pd);
          }
        }
        // ar ambiente (respiração quase imperceptível)
        // Soft real-room airflow and a stronger but bounded gesture response.
        s.vx+=Math.sin(t*.88+i*.67)*.018*dt;
        s.vz+=Math.sin(t*.73+i*.91)*.022*dt;
        if(isFocused){s.vz+=Math.sin(t*1.9+i)*.09*dt;}
        if(isHovered){s.vx+=Math.sin(t*2.4+i)*.12*dt;}
        s.vx += (-k * s.ax - c * s.vx) * dt;
        s.vz += (-k * s.az - c * s.vz) * dt;
        s.ax = THREE.MathUtils.clamp(s.ax + s.vx * dt, -.12, .12);
        s.az = THREE.MathUtils.clamp(s.az + s.vz * dt, -.12, .12);
        writeSwing(s, i);
      });
      // cabide vazio balança quando o vestido sai
      if (!ctx.heroOnRail && !heroKicked) { heroSwing.vz = 2.4; heroKicked = true; }
      if (ctx.heroOnRail) { heroKicked = false; heroSwing.vx = heroSwing.vz = heroSwing.ax = heroSwing.az = 0; }
      heroSwing.vx += (-k * heroSwing.ax - c * heroSwing.vx) * dt;
      heroSwing.vz += (-k * heroSwing.az - c * heroSwing.vz) * dt;
      heroSwing.ax += heroSwing.vx * dt;
      heroSwing.az += heroSwing.vz * dt;
      writeHero();
      hangers.instanceMatrix.needsUpdate = true;
      hooks.instanceMatrix.needsUpdate = true;
      clipBars.instanceMatrix.needsUpdate=true;clipPins.instanceMatrix.needsUpdate=true;
      archPanels.forEach((m, i) => {
        const target = 0.25 + Math.max(0, 1 - Math.abs(ctx.archFocus - i)) * 0.55;
        m.emissiveIntensity += (target - m.emissiveIntensity) * Math.min(1, dt * 5);
      });
      // Reflector intentionally absent: mirror and reflection stay deterministic.
      if (ctx.sweep >= 0) {
        const sx = -0.9 + ctx.sweep * 1.8;
        sweep.target.position.set(sx, 1.2 - ctx.sweep * 0.5, PODIUM.z);
        sweep.target.updateMatrixWorld();
        sweep.intensity = 90 * Math.sin(Math.min(1, Math.max(0, ctx.sweep)) * Math.PI);
      } else sweep.intensity = 0;
    },
  };
}
