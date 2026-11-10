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
import { DISPLAY_HEIGHT, disposeProductDisplay, productDisplay, sceneProduct, supportedProduct } from './product';
import type { Tier } from '../../core/tier';

export const ROOM = { x: 5.2, zFront: -1.4, zBack: -17.2, h: 4.2 };
export const RAIL = { y: 1.92, x: 4.72, z0: -2.8, z1: -11.2 };
export const HERO_HANGER = new THREE.Vector3(RAIL.x, RAIL.y, -6.4);
export const PODIUM = new THREE.Vector3(0, 0.2, -8);
export const FITTING = new THREE.Vector3(3.9, 0, -15.5);
export const ARCHES = [-3.6, -1.2, 1.2];

export interface BoutiqueHandle {
  group: THREE.Group;
  update(dt: number, ctx: { camera: THREE.Camera; camVel: number; pointer: THREE.Vector2 | null; pointerVel: number; archFocus: number; fittingActive: boolean; heroOnRail: boolean; sweep: number }): void;
  mirror: Reflector | null;
  setProduct(productId: string | null): void;
}

interface Swing {
  ax: number; az: number; vx: number; vz: number;
  hook: THREE.Vector3; yaw: number; mesh: THREE.Object3D; clipped: boolean;
}

export function buildBoutique(kit: Kit, tier: Tier, dpr: number): BoutiqueHandle {
  const g = new THREE.Group();
  g.name = 'boutique';
  const { x: X, zFront, zBack, h: H } = ROOM;
  const L = zFront - zBack;
  const zc = (zFront + zBack) / 2;

  // piso, teto, paredes
  const floor = plane(X * 2, L, kit.oak, 1.6);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.001, zc);
  floor.receiveShadow = true;
  g.add(floor);
  const ceil = plane(X * 2, L, kit.plaster, 3);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, H, zc);
  g.add(ceil);
  for (const side of [-1, 1]) {
    const wall = plane(L, H, kit.plaster, 3);
    wall.rotation.y = side * -Math.PI / 2;
    wall.position.set(side * X, H / 2, zc);
    wall.receiveShadow = true;
    g.add(wall);
    g.add(box(0.03, 0.14, L, kit.travertine, side * (X - 0.015), 0.07, zc));
    g.add(box(0.05, 0.03, L, kit.light, side * (X - 0.2), H - 0.02, zc)); // sanca
  }
  const back = plane(X * 2, H, kit.plaster, 3);
  back.position.set(0, H / 2, zBack);
  g.add(back);
  // parede frontal interna com o vão da porta
  const front = new THREE.Shape();
  front.moveTo(-X, 0); front.lineTo(-1.25, 0); front.lineTo(-1.25, 3.1); front.lineTo(1.25, 3.1);
  front.lineTo(1.25, 0); front.lineTo(X, 0); front.lineTo(X, H); front.lineTo(-X, H); front.closePath();
  const frontMesh = new THREE.Mesh(new THREE.ShapeGeometry(front), kit.plaster);
  frontMesh.rotation.y = Math.PI;
  frontMesh.position.z = zFront;
  g.add(frontMesh);

  // spots embutidos no teto (instanciados)
  const disc = new THREE.InstancedMesh(new THREE.CircleGeometry(0.06, 20), kit.light, 40);
  let di = 0;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
  for (let z = zFront - 1.4; z > zBack + 0.8; z -= 1.8) {
    for (const x of [-3.4, -1.1, 1.1, 3.4]) {
      if (di >= 40) break;
      m4.compose(new THREE.Vector3(x, H - 0.005, z), q, new THREE.Vector3(1, 1, 1));
      disc.setMatrixAt(di++, m4);
    }
  }
  disc.count = di;
  g.add(disc);

  // Front-facing alpha studies in physically supported boutique niches.
  const nicheProducts=['saias-03','camisas-01','bolsas-02','calcas-01','croppeds-02','pulseiras-01'] as const;
  let nicheIndex=0;
  const nicheMat = new THREE.MeshStandardMaterial({ map: kit.glowTex, emissiveMap: kit.glowTex, emissive: new THREE.Color('#f1dcb8'), emissiveIntensity: 0.22, roughness: 0.95 });
  for (const side of [-1, 1]) {
    for (const z of [-4.2, -7.0, -9.8]) {
      const fr = archFrame(2.5, 3.3, 0.12, 0.1, kit.travertine);
      fr.rotation.y = side * -Math.PI / 2;
      fr.position.set(side * (X - 0.1), 0, z);
      g.add(fr);
      const panel = archPanel(2.5, 3.3, nicheMat);
      panel.rotation.y = side * -Math.PI / 2;
      panel.position.set(side * (X - 0.012), 0, z);
      g.add(panel);
      const slug=nicheProducts[nicheIndex++]!, product=sceneProduct(slug);
      const clothing=!['bolsas','pulseiras','aneis'].includes(product.category);
      const display=supportedProduct(kit, slug, DISPLAY_HEIGHT[product.category],clothing?2.25:1.16,clothing);
      display.rotation.y=side * -Math.PI / 2;
      display.position.set(side*(X-.24),0,z);
      g.add(display);
    }
  }

  // araras de latão
  for (const side of [-1, 1]) {
    const len = RAIL.z0 - RAIL.z1;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, len, 12), kit.brass);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(side * RAIL.x, RAIL.y, (RAIL.z0 + RAIL.z1) / 2);
    g.add(bar);
    for (const z of [RAIL.z0, (RAIL.z0 + RAIL.z1) / 2, RAIL.z1]) {
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, X - RAIL.x, 8), kit.brass);
      br.rotation.z = Math.PI / 2;
      br.position.set(side * (RAIL.x + (X - RAIL.x) / 2), RAIL.y, z);
      g.add(br);
    }
  }

  // Canonical garments only. Jewelry and bags remain on their own displays.
  const clothing=DEMO_CATALOG.filter(product=>!['bolsas','pulseiras','aneis'].includes(product.category));
  const perRail = tier === 'cinema' ? 15 : 9;
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
  const swings: Swing[] = [];
  let hi = 0;
  for (const side of [-1, 1]) {
    for (let k = 0; k < perRail; k++) {
      const z = RAIL.z0 - 0.25 - (k / (perRail - 1)) * (RAIL.z0 - RAIL.z1 - 0.5);
      if (side === 1 && Math.abs(z - HERO_HANGER.z) < 0.55) continue; // vaga do protagonista
      const product=clothing[(side<0?k:k+perRail)%clothing.length]!;
      const pivot=new THREE.Group(); pivot.userData.dynamic=true;
      const display=productDisplay(product,DISPLAY_HEIGHT[product.category],'top');
      display.position.y=-.22; pivot.add(display); g.add(pivot);
      const clipped=product.category==='saias'||product.category==='calcas';
      swings.push({ ax:0,az:0,vx:0,vz:0,hook:new THREE.Vector3(side*RAIL.x,RAIL.y,z),yaw:side*-Math.PI/2,mesh:pivot,clipped });
      hi++;
    }
  }
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
  const heroSwing: Swing = { ax:0,az:0,vx:0,vz:0,hook:HERO_HANGER.clone(),yaw:-Math.PI/2,mesh:new THREE.Group(),clipped:false };
  const writeHero = () => {
    tmpE.set(heroSwing.ax, heroSwing.yaw, heroSwing.az, 'YXZ');
    tmpQ.setFromEuler(tmpE);
    base.compose(heroSwing.hook, tmpQ, one);
    out.multiplyMatrices(base, offHanger);
    hangers.setMatrixAt(heroHangerIndex, out);
    hooks.setMatrixAt(heroHangerIndex, out);
  };
  writeHero();

  // pódio central
  const podium = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.1, 0.2, 64), kit.travertine);
  podium.position.set(PODIUM.x, 0.1, PODIUM.z);
  podium.receiveShadow = true;
  podium.castShadow = true;
  g.add(podium);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.012, 8, 96), kit.brass);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(PODIUM.x, 0.2, PODIUM.z);
  g.add(ring);
  g.add(contact(kit, 3.2, 3.2, PODIUM.x, PODIUM.z));

  // arcos de categoria no fundo
  const archPanels: THREE.MeshStandardMaterial[] = [];
  const labels = ['VESTIDOS', 'CAMISAS', 'BOLSAS'];
  ARCHES.forEach((x, i) => {
    const fr = archFrame(2.0, 3.4, 0.14, 0.3, kit.travertine);
    fr.position.set(x, 0, zBack + 0.01);
    g.add(fr);
    const mat = new THREE.MeshStandardMaterial({ map: kit.glowTex, emissiveMap: kit.glowTex, emissive: new THREE.Color('#f6e2bf'), emissiveIntensity: 0.25, roughness: 0.95 });
    archPanels.push(mat);
    const panel = archPanel(2.0, 3.4, mat);
    panel.position.set(x, 0, zBack + 0.012);
    g.add(panel);
    const label = plane(1.9, 0.3, new THREE.MeshStandardMaterial({ map: labelTexture(labels[i]!), transparent: true, alphaTest: 0.05, metalness: 0.8, roughness: 0.35 }));
    label.position.set(x, 3.86, zBack + 0.05);
    g.add(label);
    const plinth = box(1.3, 0.32, 0.7, kit.travertine, x, 0.16, zBack + 0.7);
    g.add(plinth);
    g.add(contact(kit, 1.9, 1.2, x, zBack + 0.7));
  });
  // Photo displays retain their own visual identity on actual supports.
  const archDress=supportedProduct(kit,'vestidos-03',1.48,.32);
  archDress.position.set(ARCHES[0]!,0,zBack+.7);g.add(archDress);
  const archShirt=supportedProduct(kit,'camisas-04',.72,1.84,true);
  archShirt.position.set(ARCHES[1]!,0,zBack+.7);g.add(archShirt);
  for(const [dx,slug,height] of [[-.28,'bolsas-01',.34],[.3,'bolsas-02',.28]] as const) {
    const display=supportedProduct(kit,slug,height,.32);
    display.position.set(ARCHES[2]!+dx,0,zBack+.7);g.add(display);
  }

  // provador: divisória, cortina de veludo, espelho em arco, pufe
  // alcova aberta para a frente: parede lateral em x=2.6, cortina recolhida à direita
  const part = box(0.12, H, 3.6, kit.plaster, 2.6, H / 2, -15.4);
  g.add(part);
  g.add(box(2.72, 0.24, 0.14, kit.plaster, 3.9, H - 0.12, -13.6)); // verga da alcova
  const curtainGeo = new THREE.PlaneGeometry(0.9, 3.3, 40, 1);
  const cp = curtainGeo.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < cp.count; i++) cp.setZ(i, Math.sin(cp.getX(i) * 34) * 0.05);
  curtainGeo.computeVertexNormals();
  const curtain = new THREE.Mesh(curtainGeo, kit.velvet);
  curtain.position.set(4.7, 1.7, -13.66);
  g.add(curtain);
  g.add(box(2.6, 0.03, 0.03, kit.brass, 3.9, 3.42, -13.66));
  const mirrorFrame = archFrame(1.2, 2.5, 0.07, 0.05, kit.brass);
  mirrorFrame.position.set(FITTING.x, 0.25, zBack + 0.02);
  g.add(mirrorFrame);
  let mirror: Reflector | null = null;
  if (tier === 'cinema') {
    const shape = new THREE.Shape();
    shape.moveTo(-0.6, 0); shape.lineTo(-0.6, 1.9); shape.absarc(0, 1.9, 0.6, Math.PI, 0, true); shape.lineTo(0.6, 0); shape.lineTo(-0.6, 0);
    mirror = new Reflector(new THREE.ShapeGeometry(shape, 32), {
      clipBias: 0.003,
      textureWidth: Math.round(innerWidth * dpr * 0.45),
      textureHeight: Math.round(innerHeight * dpr * 0.45),
      color: 0xd9d2c6,
    });
    mirror.position.set(FITTING.x, 0.25, zBack + 0.03);
    mirror.visible = false;
    g.add(mirror);
  } else {
    const fake = archPanel(1.2, 2.5, new THREE.MeshStandardMaterial({ color: '#cfd3cf', roughness: 0.08, metalness: 0.9, envMapIntensity: 1.4 }));
    fake.position.set(FITTING.x, 0.25, zBack + 0.03);
    g.add(fake);
  }
  const pouf = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.42, 32), kit.velvet);
  pouf.position.set(4.75, 0.21, -16.4);
  g.add(pouf);
  g.add(contact(kit, 0.9, 0.9, 4.75, -16.4));
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.06, 40), kit.brass);
  stand.position.set(FITTING.x, 0.03, FITTING.z);
  g.add(stand);
  g.add(contact(kit, 1.4, 1.4, FITTING.x, FITTING.z));

  // A selected product is a frontal supported photograph, never a claimed 360 try-on.
  const fittingDisplay=new THREE.Group();fittingDisplay.name='fitting-product-display';
  fittingDisplay.position.set(FITTING.x,0,FITTING.z);fittingDisplay.visible=false;g.add(fittingDisplay);
  let fittingProductId:string|null=null;
  const setProduct=(id:string|null) => {
    if(id===fittingProductId)return;
    fittingProductId=id;
    [...fittingDisplay.children].forEach(disposeProductDisplay);
    if(!id){fittingDisplay.visible=false;return;}
    const product=productById(id);
    if(!product){fittingProductId=null;return;}
    const height=DISPLAY_HEIGHT[product.category];
    fittingDisplay.add(supportedProduct(kit,product.slug,height,.065));
  };

  // luz
  const hemi = new THREE.HemisphereLight('#fff4e4', '#a48c6c', 1.05);
  g.add(hemi);
  const podiumSpot = spot('#ffe9c9', 70, [0.6, H - 0.05, -6.6], [0, 0.9, -8], 0.42, 0.65);
  if (tier === 'cinema') {
    podiumSpot.castShadow = true;
    podiumSpot.shadow.mapSize.set(1024, 1024);
    podiumSpot.shadow.bias = -0.0004;
    podiumSpot.shadow.normalBias = 0.02;
    podiumSpot.shadow.camera.near = 1;
    podiumSpot.shadow.camera.far = 8;
  }
  g.add(podiumSpot, podiumSpot.target);
  for (const side of [-1, 1]) {
    const s = spot('#ffe4bd', 42, [side * 2.4, H - 0.05, -7], [side * RAIL.x, 1.2, -7], 0.95, 0.85);
    g.add(s, s.target);
  }
  const backSpot = spot('#ffe6c0', 50, [-1.2, H - 0.05, -13.4], [-1.2, 1.4, zBack], 0.85, 0.9);
  g.add(backSpot, backSpot.target);
  // faixa de luz dourada que atravessa o tecido no capítulo "detalhe"
  const sweep = spot('#ffd28a', 0, [-1.6, 2.6, -6.4], [0, 1.0, -8], 0.16, 0.55);
  g.add(sweep, sweep.target);
  const fitSpot = spot('#ffeacc', 34, [3.9, H - 0.05, -14.0], [FITTING.x, 1.0, FITTING.z], 0.6, 0.8);
  g.add(fitSpot, fitSpot.target);

  // Keep distant products in scene; architectural occlusion and frustum culling handle visibility.
  // atualização: molas dos cabides + foco dos arcos + espelho
  const proj = new THREE.Vector3();
  let t = 0;
  let heroKicked = false;
  return {
    group: g,
    mirror,
    setProduct,
    update(dt, ctx) {
      fittingDisplay.visible=!!fittingProductId&&ctx.fittingActive;
      t += dt;
      const k = 26; // rigidez da mola
      const c = 2.6; // amortecimento
      const camPos = (ctx.camera as THREE.PerspectiveCamera).position;
      swings.forEach((s, i) => {
        const dx = camPos.x - s.hook.x;
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
        s.vx += Math.sin(t * 0.7 + i) * 0.002;
        s.vx += (-k * s.ax - c * s.vx) * dt;
        s.vz += (-k * s.az - c * s.vz) * dt;
        s.ax = THREE.MathUtils.clamp(s.ax + s.vx * dt, -0.12, 0.12);
        s.az = THREE.MathUtils.clamp(s.az + s.vz * dt, -0.12, 0.12);
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
      if (mirror) mirror.visible = ctx.fittingActive;
      if (ctx.sweep >= 0) {
        const sx = -0.9 + ctx.sweep * 1.8;
        sweep.target.position.set(sx, 1.2 - ctx.sweep * 0.5, PODIUM.z);
        sweep.target.updateMatrixWorld();
        sweep.intensity = 90 * Math.sin(Math.min(1, Math.max(0, ctx.sweep)) * Math.PI);
      } else sweep.intensity = 0;
    },
  };
}
