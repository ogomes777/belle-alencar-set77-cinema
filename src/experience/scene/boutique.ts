/**
 * Boutique Belle · loja única em 3D (planta em ./layout.ts).
 * Travertino, piso espinha de peixe escuro, trilhos de spots, nichos em arco,
 * duas araras livres com bases de pedra e cabides de madeira, pedestal com a
 * bolsa Belle, espelho em arco no fundo, arco com cortina e provador.
 * Produtos: recortes alpha oficiais do kit (2.5D) em cartões levemente
 * convexos, reutilizados por slot; nunca peças cenográficas elevadas.
 */
import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { archPanel, archReveal, box, contact, plane, spot, wallWithArches, type Kit } from './kit';
import { ARCHES, BACK_MIRROR, BAG_PEDESTAL, CURTAIN_ARCH, DOOR, FITTING, HERO_SLOT, HERO_STAND, RAIL, ROOM, SHELF, SIDE_SIGN, TRACKS, WOOD_PANEL, shelfSlotZ, slotZ, type Side } from './layout';
import { productById } from '../../commerce/catalog.demo';
import type { Product } from '../../commerce/types';
import { DISPLAY_HEIGHT, cardMetrics, disposeProductDisplay, garmentCardGeometry, placeholderTexture, productTexture, supportedProduct } from './product';
import type { SidePlan } from '../rack-state';
import { isAccessory } from '../rack-state';
import type { Tier } from '../../core/tier';

export const HERO_HANGER = new THREE.Vector3(RAIL.x, RAIL.y, slotZ(HERO_SLOT));
export const HERO_STAND_POS = new THREE.Vector3(HERO_STAND.x, 1.34, HERO_STAND.z);
export const FITTING_POS = new THREE.Vector3(FITTING.standX, 1.34, FITTING.standZ);

export interface BoutiqueCtx {
  camera: THREE.Camera;
  camVel: number;
  pointer: THREE.Vector2 | null;
  pointerVel: number;
  fittingActive: boolean;
  heroOnRail: boolean;
  sweep: number;
  /** 0 fechada → 1 aberta (cortina do provador). */
  curtain: number;
  /** espelhos com reflexo em tempo real neste quadro */
  mirrorsLive: { back: boolean; fitting: boolean };
}

export interface PickHit { product: Product; side: Side; index: number; kind: 'hanger' | 'shelf' }

export interface BoutiqueHandle {
  group: THREE.Group;
  update(dt: number, ctx: BoutiqueCtx): void;
  /** Atribui produtos aos slots de um lado (plano de rack-state). */
  applyPlan(side: Side, plan: SidePlan): void;
  pick(ndc: THREE.Vector2, camera: THREE.Camera): PickHit | null;
  hover(ndc: THREE.Vector2, camera: THREE.Camera): PickHit | null;
  select(id: string | null): void;
  hideProduct(id: string, hide: boolean): void;
  productPosition(id: string): { position: THREE.Vector3; width: number; height: number } | null;
  /** Ponto central do varão de um lado (alvo de olhar). */
  railFocus(side: Side): THREE.Vector3;
  setFittingProduct(id: string | null): void;
  bagPosition(): THREE.Vector3;
  bagWidth(): number;
  impactBag(): void;
  bagHit(ndc: THREE.Vector2, camera: THREE.Camera): boolean;
  /** Reflexos reais disponíveis (tier cinema). */
  hasReflectors(): boolean;
  dropReflectors(): void;
  dispose(): void;
}

interface Slot {
  side: Side; index: number; kind: 'hanger' | 'shelf';
  pivot: THREE.Group; card: THREE.Mesh; material: THREE.MeshStandardMaterial;
  product: Product | null; hidden: boolean;
  hook: THREE.Vector3; natural: number; yaw: number;
  ax: number; az: number; vx: number; vz: number; focus: number; focusV: number;
  hangerIndex: number; clipped: boolean;
  mediaSerial: number;
}

const CARD_GEO = garmentCardGeometry(0.075, 14);
const SHELF_GEO = garmentCardGeometry(0.03, 8);

export function buildBoutique(kit: Kit, tier: Tier, dpr: number): BoutiqueHandle {
  const g = new THREE.Group();
  g.name = 'boutique';
  const { x: X, zFront, zBack, h: H } = ROOM;
  const L = zFront - zBack;
  const zc = (zFront + zBack) / 2;
  const cinema = tier === 'cinema';
  const disposables: { dispose(): void }[] = [];

  // ---------- piso, teto, paredes ----------
  const floor = plane(X * 2, L + 0.02, kit.oakDark, 1.7);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.001, zc);
  floor.receiveShadow = true;
  g.add(floor);
  const fitFloor = plane(FITTING.x1 - FITTING.x0, FITTING.z0 - FITTING.z1, kit.oakDark, 1.7);
  fitFloor.rotation.x = -Math.PI / 2;
  fitFloor.position.set((FITTING.x0 + FITTING.x1) / 2, 0.001, (FITTING.z0 + FITTING.z1) / 2);
  g.add(fitFloor);
  const ceil = plane(X * 2, L, kit.ceiling, 3);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, H, zc);
  g.add(ceil);
  const fitCeil = plane(FITTING.x1 - FITTING.x0, FITTING.z0 - FITTING.z1, kit.ceiling, 3);
  fitCeil.rotation.x = Math.PI / 2;
  fitCeil.position.set((FITTING.x0 + FITTING.x1) / 2, H, (FITTING.z0 + FITTING.z1) / 2);
  g.add(fitCeil);

  // Paredes laterais em travertino com nichos em arco (recuo iluminado).
  const nicheGlow = new THREE.MeshStandardMaterial({ map: kit.glowTex, color: '#f1e5d2', emissiveMap: kit.glowTex, emissive: new THREE.Color('#f4e0bf'), emissiveIntensity: 0.26, roughness: 0.9 });
  for (const side of [-1, 1] as const) {
    const arches = ARCHES.z.map((z) => ({ x: (z - zc) * side * -1, w: ARCHES.w, h: ARCHES.h }));
    // A parede é construída no plano local (u ao longo de z, v = y) e girada para o lado.
    const wall = wallWithArches(L, H, arches, kit.travertineSlab, 1.6);
    wall.rotation.y = side * -Math.PI / 2;
    wall.position.set(side * X, 0, zc);
    wall.receiveShadow = true;
    g.add(wall);
    for (const z of ARCHES.z) {
      const reveal = archReveal(ARCHES.w, ARCHES.h, ARCHES.depth, kit.travertineLight);
      reveal.rotation.y = side * -Math.PI / 2;
      reveal.position.set(side * X, 0, z);
      g.add(reveal);
      const back = archPanel(ARCHES.w, ARCHES.h, nicheGlow);
      back.rotation.y = side * -Math.PI / 2;
      back.position.set(side * (X + ARCHES.depth - 0.005), 0, z);
      g.add(back);
    }
    // rodapé de latão
    g.add(box(0.02, 0.07, L, kit.brassSatin, side * (X - 0.01), 0.035, zc));
  }
  // Parede do fundo com o arco do espelho e o arco da cortina (aberto para o provador).
  const backWall = wallWithArches(X * 2, H, [
    { x: BACK_MIRROR.x, w: BACK_MIRROR.w + 0.16, h: BACK_MIRROR.h + 0.28 },
    { x: CURTAIN_ARCH.x, w: CURTAIN_ARCH.w, h: CURTAIN_ARCH.h },
  ], kit.travertineSlab, 1.6);
  backWall.position.set(0, 0, zBack);
  g.add(backWall);
  g.add(box(X * 2, 0.07, 0.02, kit.brassSatin, 0, 0.035, zBack + 0.01));
  // nicho raso do espelho do fundo + passagem da cortina
  const mirrorReveal = archReveal(BACK_MIRROR.w + 0.16, BACK_MIRROR.h + 0.28, 0.16, kit.travertineLight);
  mirrorReveal.position.set(BACK_MIRROR.x, 0, zBack);
  g.add(mirrorReveal);
  const curtainReveal = archReveal(CURTAIN_ARCH.w, CURTAIN_ARCH.h, 0.45, kit.travertineLight);
  curtainReveal.position.set(CURTAIN_ARCH.x, 0, zBack);
  g.add(curtainReveal);
  // Provador: paredes
  const fitLeft = plane(FITTING.z0 - FITTING.z1, H, kit.travertineSlab, 1.6);
  fitLeft.rotation.y = Math.PI / 2;
  fitLeft.position.set(FITTING.x0, H / 2, (FITTING.z0 + FITTING.z1) / 2);
  g.add(fitLeft);
  const fitRight = plane(FITTING.z0 - FITTING.z1, H, kit.travertineSlab, 1.6);
  fitRight.rotation.y = -Math.PI / 2;
  fitRight.position.set(FITTING.x1, H / 2, (FITTING.z0 + FITTING.z1) / 2);
  g.add(fitRight);
  const fitBack = wallWithArches(FITTING.x1 - FITTING.x0, H, [{ x: FITTING.mirrorX - (FITTING.x0 + FITTING.x1) / 2, w: FITTING.mirrorW + 0.14, h: FITTING.mirrorH + 0.26 }], kit.travertineSlab, 1.6);
  fitBack.position.set((FITTING.x0 + FITTING.x1) / 2, 0, FITTING.z1);
  g.add(fitBack);
  const fitMirrorReveal = archReveal(FITTING.mirrorW + 0.14, FITTING.mirrorH + 0.26, 0.14, kit.travertineLight);
  fitMirrorReveal.position.set(FITTING.mirrorX, 0, FITTING.z1);
  g.add(fitMirrorReveal);
  // Lado de trás da parede do fundo, visto do provador (entre o arco e as laterais).
  const fitFront = wallWithArches(FITTING.x1 - FITTING.x0, H, [{ x: CURTAIN_ARCH.x - (FITTING.x0 + FITTING.x1) / 2, w: CURTAIN_ARCH.w, h: CURTAIN_ARCH.h }], kit.travertineSlab, 1.6);
  fitFront.rotation.y = Math.PI;
  fitFront.position.set((FITTING.x0 + FITTING.x1) / 2, 0, FITTING.z0 - 0.45);
  g.add(fitFront);

  // Parede interna da entrada: gesso claro com o vão da porta e painéis de nogueira.
  const front = new THREE.Shape();
  front.moveTo(-X, 0); front.lineTo(-DOOR.halfW, 0); front.lineTo(-DOOR.halfW, DOOR.h + 0.08); front.lineTo(DOOR.halfW, DOOR.h + 0.08);
  front.lineTo(DOOR.halfW, 0); front.lineTo(X, 0); front.lineTo(X, H); front.lineTo(-X, H); front.closePath();
  const frontMesh = new THREE.Mesh(new THREE.ShapeGeometry(front), kit.travertineSlab);
  const fuv = frontMesh.geometry.getAttribute('uv') as THREE.BufferAttribute;
  const fpos = frontMesh.geometry.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < fpos.count; i++) fuv.setXY(i, (fpos.getX(i) + X) / 1.6, fpos.getY(i) / 1.6);
  frontMesh.rotation.y = Math.PI;
  frontMesh.position.z = zFront;
  g.add(frontMesh);
  for (const side of [-1, 1] as const) {
    const w = WOOD_PANEL.x1 - WOOD_PANEL.x0;
    const panel = box(w, H - 0.02, 0.07, kit.walnut, side * (WOOD_PANEL.x0 + w / 2), (H - 0.02) / 2, zFront - 0.04);
    g.add(panel);
    // junta vertical de latão entre a nogueira e a pedra
    g.add(box(0.012, H, 0.08, kit.brassSatin, side * WOOD_PANEL.x1, H / 2, zFront - 0.045));
    // retorno da nogueira no vão da porta
    g.add(box(0.07, DOOR.h + 0.08, 0.9, kit.walnut, side * (DOOR.halfW + 0.035), (DOOR.h + 0.08) / 2, zFront - 0.45));
  }
  g.add(box(DOOR.halfW * 2 + 0.14, 0.09, 0.9, kit.walnut, 0, DOOR.h + 0.125, zFront - 0.45));

  // ---------- trilhos de spots no teto ----------
  const headGeo = new THREE.CylinderGeometry(0.028, 0.03, 0.09, 12);
  const lensGeo = new THREE.CircleGeometry(0.02, 12);
  lensGeo.rotateX(Math.PI / 2);
  const headCount = TRACKS.x.length * Math.ceil(L / TRACKS.step) + 6;
  const heads = new THREE.InstancedMesh(headGeo, kit.black, headCount);
  const lenses = new THREE.InstancedMesh(lensGeo, kit.light, headCount);
  let hi = 0;
  const m4 = new THREE.Matrix4();
  for (const x of TRACKS.x) {
    g.add(box(0.03, 0.03, L - 1.4, kit.black, x, H - 0.015, zc));
    for (let z = zFront - 1.2; z > zBack + 0.6; z -= TRACKS.step) {
      if (hi >= headCount) break;
      m4.makeTranslation(x, H - 0.085, z);
      heads.setMatrixAt(hi, m4);
      m4.makeTranslation(x, H - 0.131, z);
      lenses.setMatrixAt(hi, m4);
      hi++;
    }
  }
  // trilho curto no provador
  g.add(box(0.03, 0.03, 3.2, kit.black, (FITTING.x0 + FITTING.x1) / 2, H - 0.015, (FITTING.z0 + FITTING.z1) / 2));
  for (const z of [-19.0, -20.3, -21.6]) {
    if (hi >= headCount) break;
    m4.makeTranslation((FITTING.x0 + FITTING.x1) / 2, H - 0.085, z); heads.setMatrixAt(hi, m4);
    m4.makeTranslation((FITTING.x0 + FITTING.x1) / 2, H - 0.131, z); lenses.setMatrixAt(hi, m4);
    hi++;
  }
  heads.count = lenses.count = hi;
  g.add(heads, lenses);

  // ---------- araras livres ----------
  const hangerShape = new THREE.Shape();
  hangerShape.moveTo(-0.215, -0.085); hangerShape.quadraticCurveTo(-0.08, -0.02, 0, 0); hangerShape.quadraticCurveTo(0.08, -0.02, 0.215, -0.085);
  hangerShape.lineTo(0.215, -0.118); hangerShape.lineTo(0.2, -0.118); hangerShape.quadraticCurveTo(0.07, -0.058, 0, -0.04); hangerShape.quadraticCurveTo(-0.07, -0.058, -0.2, -0.118);
  hangerShape.lineTo(-0.215, -0.118); hangerShape.closePath();
  const hangerGeo = new THREE.ExtrudeGeometry(hangerShape, { depth: 0.013, bevelEnabled: false });
  hangerGeo.translate(0, 0, -0.0065);
  const barGeo = new THREE.BoxGeometry(0.4, 0.012, 0.012);
  barGeo.translate(0, -0.118, 0);
  const hookGeo = new THREE.TorusGeometry(0.03, 0.0035, 6, 16, Math.PI * 1.25);
  hookGeo.rotateZ(-Math.PI * 0.14);
  hookGeo.translate(0, 0.026, 0);
  const hangerSlots = RAIL.slots * 2 + 1;
  const hangerWood = new THREE.InstancedMesh(hangerGeo, kit.walnut, hangerSlots);
  const hangerBars = new THREE.InstancedMesh(barGeo, kit.walnut, hangerSlots);
  const hangerHooks = new THREE.InstancedMesh(hookGeo, kit.brassSatin, hangerSlots);
  const hiddenM = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let i = 0; i < hangerSlots; i++) { hangerWood.setMatrixAt(i, hiddenM); hangerBars.setMatrixAt(i, hiddenM); hangerHooks.setMatrixAt(i, hiddenM); }
  g.add(hangerWood, hangerBars, hangerHooks);

  const slots: Slot[] = [];
  const sides: Record<Side, { hangers: Slot[]; shelf: Slot[] }> = { left: { hangers: [], shelf: [] }, right: { hangers: [], shelf: [] } };
  let hangerCursor = 0;
  const makeSlot = (side: Side, index: number, kind: 'hanger' | 'shelf', hook: THREE.Vector3, natural: number): Slot => {
    const pivot = new THREE.Group();
    pivot.userData.dynamic = true;
    pivot.matrixAutoUpdate = false;
    const material = new THREE.MeshStandardMaterial({
      map: placeholderTexture(), transparent: false, alphaTest: 0.22, alphaToCoverage: cinema,
      depthWrite: true, side: THREE.DoubleSide, roughness: 0.84, metalness: 0, envMapIntensity: 0.16,
    });
    const card = new THREE.Mesh(kind === 'hanger' ? CARD_GEO : SHELF_GEO, material);
    card.visible = false;
    card.receiveShadow = true;
    card.userData.productMedia = true;
    pivot.add(card);
    g.add(pivot);
    const slot: Slot = {
      side, index, kind, pivot, card, material, product: null, hidden: false,
      hook, natural, yaw: natural, ax: 0, az: 0, vx: 0, vz: 0, focus: 0, focusV: 0,
      hangerIndex: kind === 'hanger' ? hangerCursor++ : -1, clipped: false, mediaSerial: 0,
    };
    slots.push(slot);
    sides[side][kind === 'hanger' ? 'hangers' : 'shelf'].push(slot);
    return slot;
  };
  for (const side of ['left', 'right'] as const) {
    const s = SIDE_SIGN[side];
    const natural = s * -Math.PI / 2;
    const x = s * RAIL.x;
    // varão, montantes e bases de pedra
    const len = RAIL.z0 - RAIL.z1;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, len + 0.04, 14), kit.brassSatin);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(x, RAIL.y, (RAIL.z0 + RAIL.z1) / 2);
    g.add(bar);
    for (const z of [RAIL.z0, RAIL.z1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, RAIL.y - RAIL.baseH + 0.03, 14), kit.brassSatin);
      post.position.set(x, RAIL.baseH + (RAIL.y - RAIL.baseH + 0.03) / 2, z);
      g.add(post);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 8), kit.brassSatin);
      cap.position.set(x, RAIL.y + 0.02, z);
      g.add(cap);
      const base = box(RAIL.baseW, RAIL.baseH, RAIL.baseD, kit.travertineLight, x, RAIL.baseH / 2, z);
      base.castShadow = cinema; base.receiveShadow = true;
      g.add(base);
      g.add(contact(kit, RAIL.baseW + 0.5, RAIL.baseD + 0.5, x, z));
    }
    // sombra de contato das peças no piso (uma faixa suave sob o varão)
    const strip = contact(kit, 1.1, len - 0.4, x, (RAIL.z0 + RAIL.z1) / 2, 0.0045);
    (strip.material as THREE.Material).opacity = 0.75;
    g.add(strip);
    for (let i = 0; i < RAIL.slots; i++) {
      makeSlot(side, i, 'hanger', new THREE.Vector3(x, RAIL.y, slotZ(i)), natural);
    }
    // banco de pedra no fim da arara (acessórios)
    const shelfLen = SHELF.z0 - SHELF.z1;
    const bench = box(SHELF.d, SHELF.h, shelfLen, kit.travertineLight, s * SHELF.x, SHELF.h / 2, (SHELF.z0 + SHELF.z1) / 2);
    bench.receiveShadow = true; bench.castShadow = cinema;
    g.add(bench);
    g.add(contact(kit, SHELF.d + 0.6, shelfLen + 0.5, s * SHELF.x, (SHELF.z0 + SHELF.z1) / 2));
    for (let i = 0; i < SHELF.slots; i++) {
      makeSlot(side, i, 'shelf', new THREE.Vector3(s * (SHELF.x - 0.02), SHELF.h + 0.004, shelfSlotZ(i)), natural);
    }
  }
  // cabide reservado ao vestido protagonista (direita): o índice é o último da instância
  const heroHangerIndex = hangerCursor;
  const heroSwing = { ax: 0, az: 0, vx: 0, vz: 0, yaw: -Math.PI / 2 };
  const usableHangers = (side: Side) => sides[side].hangers.filter((s) => !(side === 'right' && s.index === HERO_SLOT));

  // ---------- suporte do vestido protagonista (fora do corredor) ----------
  const heroStand = new THREE.Group();
  heroStand.position.set(HERO_STAND.x, 0, HERO_STAND.z);
  heroStand.add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.035, 36), kit.brassSatin));
  heroStand.children[0]!.position.y = 0.018;
  const heroPole = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 1.2, 10), kit.brassSatin);
  heroPole.position.y = 0.6;
  heroStand.add(heroPole);
  g.add(heroStand);
  g.add(contact(kit, 1.1, 1.1, HERO_STAND.x, HERO_STAND.z));

  // ---------- pedestal com a bolsa Belle ----------
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(BAG_PEDESTAL.r, BAG_PEDESTAL.r + 0.01, BAG_PEDESTAL.h, 40), kit.travertineLight);
  pedestal.position.set(BAG_PEDESTAL.x, BAG_PEDESTAL.h / 2, BAG_PEDESTAL.z);
  pedestal.castShadow = cinema; pedestal.receiveShadow = true;
  g.add(pedestal);
  g.add(contact(kit, BAG_PEDESTAL.r * 3.2, BAG_PEDESTAL.r * 3.2, BAG_PEDESTAL.x, BAG_PEDESTAL.z));
  const bag = buildBelleBag(kit);
  bag.position.set(BAG_PEDESTAL.x, BAG_PEDESTAL.h, BAG_PEDESTAL.z);
  bag.rotation.y = 0.35;
  g.add(bag);
  let bagPulse = 0;

  // ---------- espelhos ----------
  const mirrorTex = Math.max(256, Math.min(1024, Math.round(Math.min(innerWidth, innerHeight) * dpr * 0.45)));
  const backMirror = buildMirror(BACK_MIRROR.w, BACK_MIRROR.h, cinema, mirrorTex, kit);
  backMirror.group.position.set(BACK_MIRROR.x, 0.22, zBack + 0.06);
  g.add(backMirror.group);
  const fitMirror = buildMirror(FITTING.mirrorW, FITTING.mirrorH, cinema, mirrorTex, kit);
  fitMirror.group.position.set(FITTING.mirrorX, 0.2, FITTING.z1 + 0.06);
  g.add(fitMirror.group);
  let reflectors = cinema;

  // ---------- cortina do arco (duas folhas) e drapeado do provador ----------
  const curtainRod = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, CURTAIN_ARCH.w + 0.3, 10), kit.brassSatin);
  curtainRod.rotation.z = Math.PI / 2;
  curtainRod.position.set(CURTAIN_ARCH.x, CURTAIN_ARCH.h - 0.08, zBack + 0.1);
  g.add(curtainRod);
  const curtainPanels: THREE.Mesh[] = [];
  for (const side of [-1, 1] as const) {
    const geo = pleatedPanel(CURTAIN_ARCH.w / 2 + 0.08, CURTAIN_ARCH.h - 0.14, 40, 0.08);
    // origem na borda externa, para abrir deslizando até o montante do arco
    geo.translate(-side * (CURTAIN_ARCH.w / 4 + 0.04), 0, 0);
    const panel = new THREE.Mesh(geo, kit.linen);
    panel.userData.dynamic = true;
    panel.position.set(CURTAIN_ARCH.x + side * (CURTAIN_ARCH.w / 2 + 0.04), (CURTAIN_ARCH.h - 0.14) / 2, zBack + 0.12);
    g.add(panel);
    curtainPanels.push(panel);
  }
  const drape = new THREE.Mesh(pleatedPanel(FITTING.z0 - FITTING.z1 - 0.35, H - 0.12, 64, 0.1), kit.linen);
  drape.rotation.y = -Math.PI / 2;
  drape.position.set(FITTING.x1 - 0.14, (H - 0.12) / 2, (FITTING.z0 + FITTING.z1) / 2 - 0.15);
  g.add(drape);
  g.add(box(0.03, 0.03, FITTING.z0 - FITTING.z1 - 0.3, kit.brassSatin, FITTING.x1 - 0.14, H - 0.1, (FITTING.z0 + FITTING.z1) / 2 - 0.15));

  // ---------- provador: poltrona bouclé, suporte de latão ----------
  const chair = buildChair(kit);
  chair.position.set(FITTING.chairX, 0, FITTING.chairZ);
  chair.rotation.y = 0.55;
  g.add(chair);
  g.add(contact(kit, 1.5, 1.5, FITTING.chairX, FITTING.chairZ));
  const fitStand = new THREE.Group();
  fitStand.position.set(FITTING.standX, 0, FITTING.standZ);
  const fitFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.035, 36), kit.brassSatin);
  fitFoot.position.y = 0.018;
  const fitPole = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 1.9, 10), kit.brassSatin);
  fitPole.position.y = 0.95;
  const fitArm = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.5, 10), kit.brassSatin);
  fitArm.rotation.z = Math.PI / 2;
  fitArm.position.y = 1.9;
  fitStand.add(fitFoot, fitPole, fitArm);
  g.add(fitStand);
  g.add(contact(kit, 1.2, 1.2, FITTING.standX, FITTING.standZ));
  const fittingDisplay = new THREE.Group();
  fittingDisplay.name = 'fitting-product-display';
  fittingDisplay.userData.dynamic = true;
  fittingDisplay.position.set(FITTING.standX, 0, FITTING.standZ);
  fittingDisplay.visible = false;
  g.add(fittingDisplay);
  let fittingProductId: string | null = null;

  // ---------- luz ----------
  g.add(new THREE.HemisphereLight('#fff0d8', '#a88e6c', 0.72));
  const lights: THREE.SpotLight[] = [];
  const addSpot = (color: string, intensity: number, from: [number, number, number], to: [number, number, number], angle: number, pen = 0.8) => {
    const s = spot(color, intensity, from, to, angle, pen);
    g.add(s, s.target);
    lights.push(s);
    return s;
  };
  for (const s of [-1, 1] as const) {
    addSpot('#ffe3bd', 52, [s * 1.9, H - 0.06, -5.2], [s * RAIL.x, 0.9, -5.6], 0.95, 0.85);
    if (cinema) addSpot('#ffe3bd', 46, [s * 1.9, H - 0.06, -8.3], [s * RAIL.x, 0.9, -8.6], 0.95, 0.85);
    // lavagem quente dos nichos atrás das araras
    addSpot('#ffdcae', 30, [s * 2.6, H - 0.06, -7.3], [s * (X + 0.2), 2.0, -7.3], 0.75, 0.9);
  }
  addSpot('#ffe6c7', 44, [0, H - 0.06, -2.6], [0, 0, -3.2], 0.8, 0.9);
  const heroSpot = addSpot('#ffe9cc', 60, [-0.6, H - 0.06, -11.4], [HERO_STAND.x, 1.0, HERO_STAND.z], 0.5, 0.7);
  if (cinema) {
    heroSpot.castShadow = true;
    heroSpot.shadow.mapSize.set(1024, 1024);
    heroSpot.shadow.bias = -0.0004;
    heroSpot.shadow.normalBias = 0.02;
    heroSpot.shadow.camera.near = 1;
    heroSpot.shadow.camera.far = 7;
  }
  addSpot('#ffe3c0', 48, [-0.2, H - 0.06, -15.6], [BACK_MIRROR.x, 1.3, zBack], 0.7, 0.85);
  addSpot('#ffdfb6', 40, [CURTAIN_ARCH.x, H - 0.06, -16.2], [CURTAIN_ARCH.x, 1.3, zBack], 0.7, 0.85);
  addSpot('#ffe8cf', 50, [2.5, H - 0.06, -20.2], [FITTING.standX, 1.0, FITTING.standZ], 0.7, 0.8);
  if (cinema) addSpot('#ffe3c0', 34, [1.6, H - 0.06, -20.0], [FITTING.chairX, 0.6, FITTING.chairZ], 0.7, 0.85);
  addSpot('#ffe0b8', 42, [3.4, H - 0.06, -19.6], [FITTING.x1, 1.2, -20.8], 0.8, 0.9);
  const sweep = spot('#ffd28a', 0, [-2.6, 2.6, -11.6], [HERO_STAND.x, 1.0, HERO_STAND.z], 0.16, 0.55);
  g.add(sweep, sweep.target);

  // ---------- estado de seleção e picking ----------
  const raycaster = new THREE.Raycaster();
  let hoverId: string | null = null;
  let selectedId: string | null = null;
  const proj = new THREE.Vector3();
  const tmpQ = new THREE.Quaternion();
  const tmpE = new THREE.Euler();
  const one = new THREE.Vector3(1, 1, 1);
  const base = new THREE.Matrix4();
  const out = new THREE.Matrix4();
  const hangerOffset = new THREE.Matrix4().makeTranslation(0, -0.03, 0);

  function assign(slot: Slot, product: Product | null): void {
    if (slot.product?.id === product?.id) return;
    slot.product = product;
    slot.hidden = false;
    slot.mediaSerial++;
    const serial = slot.mediaSerial;
    if (!product) {
      slot.card.visible = false;
      slot.material.map = placeholderTexture();
      slot.material.needsUpdate = true;
      delete slot.pivot.userData.productId;
      delete slot.pivot.userData.mediaPromise;
      slot.pivot.userData.mediaReady = false;
      return;
    }
    const height = DISPLAY_HEIGHT[product.category];
    const m = cardMetrics(product, height);
    slot.clipped = product.category === 'saias' || product.category === 'calcas';
    slot.card.scale.set(m.w, m.h, 1);
    if (slot.kind === 'hanger') {
      const drop = slot.clipped ? 0.118 : 0.052;
      slot.card.position.set(m.dx, -drop + m.top, 0.012);
      slot.card.rotation.set(0, 0, 0);
    } else {
      slot.card.position.set(m.dx, m.top + height, 0.0);
      slot.card.rotation.set(-0.22, 0, 0);
    }
    slot.pivot.userData.productId = product.id;
    slot.pivot.userData.displayWidth = m.opaqueW;
    slot.pivot.userData.mediaReady = false;
    slot.pivot.userData.mediaFailed = false;
    const tex = productTexture(product);
    slot.pivot.userData.mediaPromise = tex.promise;
    const apply = (t: THREE.Texture | null) => {
      if (serial !== slot.mediaSerial) return; // troca rápida de categoria: mídia obsoleta
      if (!t) { slot.card.visible = false; slot.pivot.userData.mediaFailed = true; return; }
      slot.pivot.userData.mediaReady = true;
      slot.material.map = t;
      slot.material.needsUpdate = true;
      slot.card.visible = !slot.hidden;
    };
    if (tex.texture) apply(tex.texture); else { slot.card.visible = false; void tex.promise.then(apply); }
  }

  function writeSlot(slot: Slot): void {
    tmpE.set(slot.ax, slot.yaw, slot.az, 'YXZ');
    tmpQ.setFromEuler(tmpE);
    base.compose(slot.hook, tmpQ, one);
    slot.pivot.matrix.copy(base);
    slot.pivot.matrixWorldNeedsUpdate = true;
    if (slot.hangerIndex >= 0) {
      const show = !!slot.product && !slot.hidden;
      if (show) {
        out.multiplyMatrices(base, hangerOffset);
        hangerWood.setMatrixAt(slot.hangerIndex, out);
        hangerHooks.setMatrixAt(slot.hangerIndex, out);
        hangerBars.setMatrixAt(slot.hangerIndex, slot.clipped ? out : hiddenM);
      } else {
        hangerWood.setMatrixAt(slot.hangerIndex, hiddenM);
        hangerHooks.setMatrixAt(slot.hangerIndex, hiddenM);
        hangerBars.setMatrixAt(slot.hangerIndex, hiddenM);
      }
    }
  }
  const writeHero = () => {
    tmpE.set(heroSwing.ax, heroSwing.yaw, heroSwing.az, 'YXZ');
    tmpQ.setFromEuler(tmpE);
    base.compose(HERO_HANGER, tmpQ, one);
    out.multiplyMatrices(base, hangerOffset);
    hangerWood.setMatrixAt(heroHangerIndex, out);
    hangerHooks.setMatrixAt(heroHangerIndex, out);
    hangerBars.setMatrixAt(heroHangerIndex, hiddenM);
  };
  slots.forEach(writeSlot);
  writeHero();
  hangerWood.instanceMatrix.needsUpdate = hangerHooks.instanceMatrix.needsUpdate = hangerBars.instanceMatrix.needsUpdate = true;

  const slotFor = (id: string) => slots.find((s) => s.product?.id === id) ?? null;
  function hitSlot(ndc: THREE.Vector2, camera: THREE.Camera): Slot | null {
    raycaster.setFromCamera(ndc, camera);
    const cards = slots.filter((s) => s.card.visible && s.product).map((s) => s.card);
    const hits = raycaster.intersectObjects(cards, false);
    if (hits.length) {
      const first = hits[0]!;
      // arquitetura à frente? (parede do fundo/paredes): o raio precisa chegar primeiro no cartão
      const found = slots.find((s) => s.card === first.object);
      if (found) return found;
    }
    // Fallback: recortes finos vistos de lado. Centro projetado e raio de toque apertado.
    let best: Slot | null = null, dist = 0.1;
    for (const s of slots) {
      if (!s.card.visible || !s.product) continue;
      proj.set(0, -0.6 * (s.card.scale.y), 0).applyMatrix4(s.pivot.matrixWorld).project(camera);
      if (proj.z < 0 || proj.z >= 1) continue;
      const d = Math.hypot(proj.x - ndc.x, proj.y - ndc.y);
      if (d < dist) { best = s; dist = d; }
    }
    return best;
  }
  const hitOf = (s: Slot | null): PickHit | null => (s && s.product ? { product: s.product, side: s.side, index: s.index, kind: s.kind } : null);

  const setFittingProduct = (id: string | null) => {
    if (id === fittingProductId) return;
    fittingProductId = id;
    [...fittingDisplay.children].forEach(disposeProductDisplay);
    if (!id) { fittingDisplay.visible = false; return; }
    const product = productById(id);
    if (!product) { fittingProductId = null; return; }
    fittingDisplay.add(supportedProduct(kit, product.slug, DISPLAY_HEIGHT[product.category], 0.1));
  };

  let t = 0;
  let heroKicked = false;
  const k = 34, c = 7.2;
  return {
    group: g,
    applyPlan(side, plan) {
      const hangers = usableHangers(side);
      const list = plan.hangers.filter((p): p is Product | null => true);
      // mantém o índice visual: cabide i recebe o i-ésimo produto da página
      for (let i = 0; i < hangers.length; i++) assign(hangers[i]!, list[i] ?? null);
      const shelf = sides[side].shelf;
      for (let i = 0; i < shelf.length; i++) assign(shelf[i]!, plan.shelf[i] ?? null);
    },
    pick(ndc, camera) { const s = hitSlot(ndc, camera); hoverId = s?.product?.id ?? null; return hitOf(s); },
    hover(ndc, camera) { const s = hitSlot(ndc, camera); hoverId = s?.product?.id ?? null; return hitOf(s); },
    select(id) { selectedId = id; },
    hideProduct(id, hide) { const s = slotFor(id); if (s) { s.hidden = hide; s.card.visible = !hide && !!s.material.map && s.material.map !== placeholderTexture(); } },
    productPosition(id) {
      const s = slotFor(id);
      if (!s) return null;
      const p = new THREE.Vector3(0, s.card.position.y, 0).applyMatrix4(s.pivot.matrixWorld);
      return { position: p, width: (s.pivot.userData.displayWidth as number) || 0.6, height: DISPLAY_HEIGHT[s.product!.category] };
    },
    railFocus(side) { return new THREE.Vector3(SIDE_SIGN[side] * RAIL.x, 1.3, (RAIL.z0 + RAIL.z1) / 2); },
    setFittingProduct,
    bagPosition() { bag.updateWorldMatrix(true, false); return bag.localToWorld(new THREE.Vector3(0, 0.58, 0.02)); },
    bagWidth() { return 0.35; },
    impactBag() { bagPulse = 1; },
    bagHit(ndc, camera) { raycaster.setFromCamera(ndc, camera); return raycaster.intersectObject(bag, true).length > 0; },
    hasReflectors() { return reflectors; },
    dropReflectors() { reflectors = false; backMirror.drop(); fitMirror.drop(); },
    update(dt, ctx) {
      t += dt;
      fittingDisplay.visible = !!fittingProductId && ctx.fittingActive;
      backMirror.setLive(reflectors && ctx.mirrorsLive.back);
      fitMirror.setLive(reflectors && ctx.mirrorsLive.fitting);
      // cortina: folhas deslizam para os montantes
      const open = THREE.MathUtils.clamp(ctx.curtain, 0, 1);
      for (const panel of curtainPanels) panel.scale.x = 1 - open * 0.8;
      if (bagPulse > 0) { bagPulse = Math.max(0, bagPulse - dt * 1.8); bag.rotation.z = Math.sin((1 - bagPulse) * 20) * 0.055 * bagPulse; bag.scale.y = 1 + Math.sin((1 - bagPulse) * 22) * 0.04 * bagPulse; }
      const camPos = (ctx.camera as THREE.PerspectiveCamera).position;
      slots.forEach((s, i) => {
        if (!s.product) { if (s.focus !== 0) { s.focus = 0; writeSlot(s); } return; }
        const isSelected = s.product.id === selectedId;
        const isHovered = s.product.id === hoverId;
        const goal = isSelected ? 0.8 : isHovered ? 0.3 : 0;
        s.focusV += (goal - s.focus) * 46 * dt;
        s.focusV *= Math.exp(-13 * dt);
        s.focus = THREE.MathUtils.clamp(s.focus + s.focusV * dt, 0, 0.85);
        const sign = SIDE_SIGN[s.side];
        if (s.kind === 'hanger') {
          s.hook.set(sign * (RAIL.x - 0.28 * s.focus), RAIL.y + s.focus * 0.05, slotZ(s.index));
          const face = Math.atan2(camPos.x - s.hook.x, camPos.z - s.hook.z);
          const delta = Math.atan2(Math.sin(face - s.natural), Math.cos(face - s.natural));
          const goalYaw = s.natural + THREE.MathUtils.clamp(delta, -0.75, 0.75) * s.focus;
          const deltaYaw = Math.atan2(Math.sin(goalYaw - s.yaw), Math.cos(goalYaw - s.yaw));
          s.yaw += deltaYaw * (1 - Math.exp(-dt * 9));
          const dx = camPos.x - s.hook.x, dz = camPos.z - s.hook.z;
          const d2 = dx * dx + dz * dz;
          if (d2 < 9 && ctx.camVel > 0.02) {
            const f = (ctx.camVel * 0.8) / (1 + d2);
            s.vz += f * sign * -0.5;
            s.vx += f * 0.25 * Math.sin(i * 1.7 + t);
          }
          if (ctx.pointer && ctx.pointerVel > 0.002) {
            proj.copy(s.hook).setY(1.3).project(ctx.camera);
            const pd = Math.hypot(proj.x - ctx.pointer.x, proj.y - ctx.pointer.y);
            if (pd < 0.12 && proj.z < 1) {
              s.vz += ctx.pointerVel * 12 * (0.12 - pd) * sign;
              s.vx += ctx.pointerVel * 4 * (0.12 - pd);
            }
          }
          s.vx += Math.sin(t * 0.88 + i * 0.67) * 0.014 * dt;
          s.vz += Math.sin(t * 0.73 + i * 0.91) * 0.018 * dt;
          if (isHovered) s.vx += Math.sin(t * 2.4 + i) * 0.1 * dt;
          s.vx += (-k * s.ax - c * s.vx) * dt;
          s.vz += (-k * s.az - c * s.vz) * dt;
          s.ax = THREE.MathUtils.clamp(s.ax + s.vx * dt, -0.1, 0.1);
          s.az = THREE.MathUtils.clamp(s.az + s.vz * dt, -0.1, 0.1);
        } else {
          s.hook.set(sign * (SHELF.x - 0.02 - 0.12 * s.focus), SHELF.h + 0.004 + s.focus * 0.02, shelfSlotZ(s.index));
          const face = Math.atan2(camPos.x - s.hook.x, camPos.z - s.hook.z);
          const delta = Math.atan2(Math.sin(face - s.natural), Math.cos(face - s.natural));
          const goalYaw = s.natural + THREE.MathUtils.clamp(delta, -0.6, 0.6) * s.focus;
          const deltaYaw = Math.atan2(Math.sin(goalYaw - s.yaw), Math.cos(goalYaw - s.yaw));
          s.yaw += deltaYaw * (1 - Math.exp(-dt * 9));
        }
        writeSlot(s);
      });
      // cabide vazio balança quando o vestido protagonista sai
      if (!ctx.heroOnRail && !heroKicked) { heroSwing.vz = 2.4; heroKicked = true; }
      if (ctx.heroOnRail) { heroKicked = false; heroSwing.vx = heroSwing.vz = heroSwing.ax = heroSwing.az = 0; }
      heroSwing.vx += (-k * heroSwing.ax - c * heroSwing.vx) * dt;
      heroSwing.vz += (-k * heroSwing.az - c * heroSwing.vz) * dt;
      heroSwing.ax += heroSwing.vx * dt;
      heroSwing.az += heroSwing.vz * dt;
      writeHero();
      hangerWood.instanceMatrix.needsUpdate = true;
      hangerHooks.instanceMatrix.needsUpdate = true;
      hangerBars.instanceMatrix.needsUpdate = true;
      if (ctx.sweep >= 0) {
        const sx = HERO_STAND.x - 0.7 + ctx.sweep * 1.4;
        sweep.target.position.set(sx, 1.2 - ctx.sweep * 0.5, HERO_STAND.z);
        sweep.target.updateMatrixWorld();
        sweep.intensity = 90 * Math.sin(Math.min(1, Math.max(0, ctx.sweep)) * Math.PI);
      } else sweep.intensity = 0;
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
      slots.forEach((s) => { s.material.dispose(); });
      backMirror.dispose();
      fitMirror.dispose();
    },
  };
}

/** Plano com pregas verticais (seno) e normais recalculadas. */
function pleatedPanel(w: number, h: number, segments: number, depth: number): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(w, h, segments, 2);
  const p = geo.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const pleat = Math.sin((x / w) * Math.PI * segments * 0.5) * depth;
    // as pregas abrem ligeiramente no pé da cortina
    p.setZ(i, pleat * (1 + (0.5 - y / h) * 0.25));
  }
  geo.computeVertexNormals();
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 0.9, uv.getY(i) * h / 0.9);
  return geo;
}

interface MirrorHandle { group: THREE.Group; setLive(live: boolean): void; drop(): void; dispose(): void }
function buildMirror(w: number, h: number, cinema: boolean, texSize: number, kit: Kit): MirrorHandle {
  const group = new THREE.Group();
  group.userData.dynamic = true;
  const shape = new THREE.Shape();
  const r = w / 2;
  shape.moveTo(-r, 0); shape.lineTo(-r, h - r); shape.absarc(0, h - r, r, Math.PI, 0, true); shape.lineTo(r, 0); shape.lineTo(-r, 0);
  const frame = new THREE.Mesh(new THREE.ExtrudeGeometry((() => {
    const o = new THREE.Shape();
    const R = r + 0.045;
    o.moveTo(-R, -0.045); o.lineTo(-R, h - r); o.absarc(0, h - r, R, Math.PI, 0, true); o.lineTo(R, -0.045); o.lineTo(-R, -0.045);
    const hole = new THREE.Path();
    hole.moveTo(r, 0); hole.lineTo(r, h - r); hole.absarc(0, h - r, r, 0, Math.PI, false); hole.lineTo(-r, 0); hole.lineTo(r, 0);
    o.holes.push(hole);
    return o;
  })(), { depth: 0.04, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2, curveSegments: 32 }), kit.brassSatin);
  frame.position.z = -0.02;
  group.add(frame);
  const staticSurface = new THREE.Mesh(new THREE.ShapeGeometry(shape, 32), new THREE.MeshPhysicalMaterial({ color: '#b9b3a8', metalness: 0.85, roughness: 0.16, envMapIntensity: 1.1 }));
  staticSurface.position.z = 0.001;
  group.add(staticSurface);
  let reflector: Reflector | null = null;
  if (cinema) {
    reflector = new Reflector(new THREE.ShapeGeometry(shape, 32), { clipBias: 0.003, textureWidth: texSize, textureHeight: texSize, color: 0xb0aaa0 });
    reflector.position.z = 0.002;
    reflector.visible = false;
    group.add(reflector);
  }
  return {
    group,
    setLive(live) {
      if (!reflector) return;
      reflector.visible = live;
      staticSurface.visible = !live;
    },
    drop() { if (reflector) { reflector.removeFromParent(); reflector.dispose(); reflector = null; staticSurface.visible = true; } },
    dispose() { reflector?.dispose(); },
  };
}

/** Poltrona bouclé baixa e arredondada, base de latão. */
function buildChair(kit: Kit): THREE.Group {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.4, 0.4, 36), kit.boucle);
  seat.position.y = 0.26;
  g.add(seat);
  const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.08, 36), kit.boucle);
  cushion.position.y = 0.5;
  g.add(cushion);
  const back = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.42, 36, 1, true, Math.PI * 0.62, Math.PI * 1.26), kit.boucle);
  back.position.y = 0.66;
  back.rotation.y = Math.PI;
  g.add(back);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.09, 10, 36, Math.PI * 1.26), kit.boucle);
  rim.rotation.x = Math.PI / 2;
  rim.rotation.z = Math.PI * 0.62 + Math.PI;
  rim.position.y = 0.87;
  g.add(rim);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.05, 32), kit.brassSatin);
  base.position.y = 0.03;
  g.add(base);
  return g;
}

/** Sacola Belle em couro claro com o lettering oficial (alvo do voo até a sacola). */
function buildBelleBag(kit: Kit): THREE.Group {
  const bag = new THREE.Group();
  bag.name = 'sacola-belle';
  bag.userData.dynamic = true;
  const leather = new THREE.MeshStandardMaterial({ color: '#e8ddc9', roughness: 0.53, metalness: 0.04, side: THREE.DoubleSide });
  const dark = new THREE.MeshStandardMaterial({ color: '#493b2d', roughness: 0.94 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.49, 0.51, 0.25), leather);
  body.position.y = 0.31; body.castShadow = true; bag.add(body);
  const mouth = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.18), dark);
  mouth.rotation.x = -Math.PI / 2; mouth.position.y = 0.571; bag.add(mouth);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.243, 0.013, 8, 36, Math.PI), kit.brassSatin);
  rim.rotation.x = Math.PI / 2; rim.scale.y = 0.47; rim.position.set(0, 0.572, 0.015); bag.add(rim);
  for (const side of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.17, 0.55, side * 0.078), new THREE.Vector3(-0.13, 0.8, side * 0.078), new THREE.Vector3(0.13, 0.8, side * 0.078), new THREE.Vector3(0.17, 0.55, side * 0.078)]);
    bag.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.012, 7, false), leather));
  }
  const officialLogo = new THREE.TextureLoader().load('/brand/belle-alencar-logo.svg', (texture) => { texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; texture.needsUpdate = true; });
  officialLogo.colorSpace = THREE.SRGBColorSpace;
  const foil = new THREE.Mesh(new THREE.PlaneGeometry(0.37, 0.178), new THREE.MeshBasicMaterial({ map: officialLogo, transparent: true, opacity: 0.97, depthWrite: false, alphaTest: 0.02, polygonOffset: true, polygonOffsetFactor: -1, toneMapped: false }));
  foil.name = 'logo-oficial-belle-alencar';
  foil.position.set(0, 0.325, 0.134);
  foil.renderOrder = 3;
  bag.add(foil);
  bag.add(box(0.075, 0.055, 0.015, kit.brassSatin, 0, 0.44, 0.135));
  return bag;
}
