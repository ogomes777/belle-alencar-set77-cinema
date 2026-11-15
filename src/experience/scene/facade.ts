/**
 * Fachada da boutique (quadro 01): portal de calcário com três vãos verticais,
 * porta dupla recuada em latão e vidro, letreiro oficial em latão aplicado
 * direto na pedra, vitrine esquerda com expositores de pedra (vaso de ramos e
 * bolsa) e vitrine direita com o vestido vinho em suporte. Portas pivotantes
 * abrem para dentro conforme o progresso do capítulo "porta".
 */
import * as THREE from 'three';
import { box, contact, glassMaterial, plane, scaleUV, spot, type Kit } from './kit';
import { signTexture } from '../textures';
import type { Tier } from '../../core/tier';
import { supportedProduct } from './product';
import { DOOR, ROOM } from './layout';

export interface FacadeHandle {
  group: THREE.Group;
  /** 0 fechada → 1 aberta */
  setDoors(open: number): void;
}

const WIN = { x0: 2.25, x1: 5.95, y0: 0.52, y1: 3.6, depth: 1.25 } as const;
const PORTAL = { halfW: 8, h: 5.6, depth: 0.5 } as const;

export function buildFacade(kit: Kit, tier: Tier): FacadeHandle {
  const g = new THREE.Group();
  g.name = 'facade';
  const cinema = tier === 'cinema';

  // ---------- portal de calcário com os três vãos ----------
  const s = new THREE.Shape();
  s.moveTo(-PORTAL.halfW, 0);
  s.lineTo(-DOOR.halfW - 0.2, 0);
  s.lineTo(-DOOR.halfW - 0.2, DOOR.h + 0.5);
  s.lineTo(DOOR.halfW + 0.2, DOOR.h + 0.5);
  s.lineTo(DOOR.halfW + 0.2, 0);
  s.lineTo(PORTAL.halfW, 0);
  s.lineTo(PORTAL.halfW, PORTAL.h);
  s.lineTo(-PORTAL.halfW, PORTAL.h);
  s.closePath();
  for (const side of [-1, 1]) {
    const x0 = Math.min(side * WIN.x0, side * WIN.x1), x1 = Math.max(side * WIN.x0, side * WIN.x1);
    const hole = new THREE.Path();
    hole.moveTo(x0, WIN.y0); hole.lineTo(x1, WIN.y0); hole.lineTo(x1, WIN.y1); hole.lineTo(x0, WIN.y1); hole.lineTo(x0, WIN.y0);
    s.holes.push(hole);
  }
  const portico = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: PORTAL.depth, bevelEnabled: false }), kit.travertineSlab);
  scaleUV(portico.geometry, 0.6);
  portico.position.z = -PORTAL.depth;
  portico.receiveShadow = true;
  g.add(portico);

  // recuo da entrada: paredes de calcário entre a fachada e a porta, verga e piso de pedra
  const recessDepth = -DOOR.z; // 0,9 m
  for (const side of [-1, 1]) {
    const wall = plane(recessDepth + 0.02, DOOR.h + 0.5, kit.walnut, 1.6);
    wall.rotation.y = side * -Math.PI / 2;
    wall.position.set(side * (DOOR.halfW + 0.2), (DOOR.h + 0.5) / 2, -recessDepth / 2);
    g.add(wall);
  }
  const lintel = plane((DOOR.halfW + 0.2) * 2, recessDepth + 0.02, kit.travertineSlab, 1.6);
  lintel.rotation.x = Math.PI / 2;
  lintel.position.set(0, DOOR.h + 0.5, -recessDepth / 2);
  g.add(lintel);
  const sill = plane((DOOR.halfW + 0.2) * 2, recessDepth, kit.stoneFloor, 1.2);
  sill.rotation.x = -Math.PI / 2;
  sill.position.set(0, 0.002, -recessDepth / 2);
  g.add(sill);
  g.add(box(DOOR.halfW * 2 + 0.1, 0.014, 0.12, kit.brassSatin, 0, 0.007, DOOR.z + 0.02)); // soleira

  // ---------- letreiro oficial em latão sobre a pedra ----------
  const signTex = signTexture();
  const signMat = new THREE.MeshStandardMaterial({ map: signTex, transparent: true, alphaTest: 0.08, metalness: 0.75, roughness: 0.38, envMapIntensity: 1.2, color: '#b98a44', emissive: new THREE.Color('#7a5420'), emissiveIntensity: 0.7 });
  const signH = 1.3;
  const aspect = (signTex.userData.aspect as number) || 2.07;
  const sign = plane(signH * aspect, signH, signMat);
  sign.position.set(0, 4.55, 0.03);
  g.add(sign);
  // downlights do teto do shopping lavando o calcário do pórtico e o letreiro
  for (const x of [-6.9, -4.1, 4.1, 6.9]) {
    const sp = new THREE.SpotLight('#ffd3a0', 20, 8, 0.5, 0.75, 2);
    sp.position.set(x, 5.5, 0.45);
    sp.target.position.set(x, 1.6, 0);
    g.add(sp, sp.target);
  }

  // ---------- molduras de latão: porta e vitrines ----------
  const frame = (x0: number, x1: number, y0: number, y1: number, z: number, t = 0.05) => {
    g.add(box(x1 - x0 + t, t, 0.07, kit.brassSatin, (x0 + x1) / 2, y1, z));
    g.add(box(x1 - x0 + t, t, 0.07, kit.brassSatin, (x0 + x1) / 2, y0, z));
    g.add(box(t, y1 - y0, 0.07, kit.brassSatin, x0, (y0 + y1) / 2, z));
    g.add(box(t, y1 - y0, 0.07, kit.brassSatin, x1, (y0 + y1) / 2, z));
  };
  frame(-DOOR.halfW - 0.02, DOOR.halfW + 0.02, 0.02, DOOR.h + 0.02, DOOR.z, 0.06);
  frame(-WIN.x1, -WIN.x0, WIN.y0, WIN.y1, 0.01);
  frame(WIN.x0, WIN.x1, WIN.y0, WIN.y1, 0.01);

  // ---------- vitrines: caixas de pedra com fundo quente ----------
  const windowBack = new THREE.MeshStandardMaterial({ map: kit.glowTex, color: '#cdb796', emissive: new THREE.Color('#e9c99a'), emissiveIntensity: 0.1, emissiveMap: kit.glowTex, roughness: 0.9 });
  const stripMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.86, 0.66).multiplyScalar(0.62) });
  for (const side of [-1, 1] as const) {
    const cx = side * (WIN.x0 + WIN.x1) / 2;
    const w = WIN.x1 - WIN.x0;
    const back = plane(w, WIN.y1 - WIN.y0, windowBack);
    back.position.set(cx, (WIN.y0 + WIN.y1) / 2, -WIN.depth);
    g.add(back);
    const plinth = box(w, WIN.y0, WIN.depth, kit.travertineLight, cx, WIN.y0 / 2, -WIN.depth / 2);
    plinth.receiveShadow = true;
    g.add(plinth);
    for (const inner of [-1, 1]) {
      const wall = plane(WIN.depth, WIN.y1 - WIN.y0, kit.travertineLight, 1.6);
      wall.rotation.y = inner * -Math.PI / 2;
      wall.position.set(cx + inner * w / 2, (WIN.y0 + WIN.y1) / 2, -WIN.depth / 2);
      g.add(wall);
    }
    const top = plane(w, WIN.depth, kit.plaster);
    top.rotation.x = Math.PI / 2;
    top.position.set(cx, WIN.y1, -WIN.depth / 2);
    g.add(top);
    g.add(box(w - 0.3, 0.02, 0.04, stripMat, cx, WIN.y1 - 0.015, -0.25));
    if (side === -1) {
      // vitrine esquerda: dois expositores de pedra, vaso com ramos vinho e bolsa
      const tall = box(0.62, 0.95, 0.62, kit.travertineLight, cx - 0.55, WIN.y0 + 0.475, -0.85);
      const low = box(0.62, 0.52, 0.62, kit.travertineLight, cx + 0.5, WIN.y0 + 0.26, -0.62);
      tall.castShadow = low.castShadow = cinema;
      g.add(tall, low);
      const vase = buildVase(kit);
      vase.position.set(cx - 0.55, WIN.y0 + 0.95, -0.85);
      g.add(vase);
      const bagDisplay = supportedProduct(kit, 'bolsas-05', 0.3, 0.02);
      bagDisplay.position.set(cx + 0.5, WIN.y0 + 0.52, -0.62);
      g.add(bagDisplay);
    } else {
      // vitrine direita: o vestido vinho em suporte de latão
      const dress = supportedProduct(kit, 'vestidos-02', 1.48, 0.06);
      dress.position.set(cx + 0.15, WIN.y0, -0.72);
      g.add(dress);
      g.add(contact(kit, 0.8, 0.5, cx + 0.15, -0.72, WIN.y0 + 0.004));
    }
    const glass = plane(w, WIN.y1 - WIN.y0, kit.glass);
    glass.position.set(cx, (WIN.y0 + WIN.y1) / 2, 0.012);
    g.add(glass);
    if (cinema) {
      const sp = spot('#ffdcae', 22, [cx, WIN.y1 - 0.1, -0.2], [cx, WIN.y0 + 0.6, -0.8], 0.8, 0.9);
      g.add(sp, sp.target);
    }
  }

  // ---------- portas: duas folhas de vidro com moldura fina e puxadores longos ----------
  const leaves: THREE.Group[] = [];
  const doorGlass = glassMaterial();
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.userData.dynamic = true;
    pivot.position.set(side * DOOR.halfW, 0, DOOR.z);
    const leaf = new THREE.Group();
    const w = DOOR.leafW;
    leaf.position.x = -side * w / 2;
    const glass = plane(w - 0.02, DOOR.h - 0.08, doorGlass);
    glass.position.y = DOOR.h / 2;
    leaf.add(glass);
    leaf.add(box(w, 0.045, 0.04, kit.brassSatin, 0, 0.025, 0));
    leaf.add(box(w, 0.045, 0.04, kit.brassSatin, 0, DOOR.h - 0.03, 0));
    leaf.add(box(0.045, DOOR.h, 0.04, kit.brassSatin, -w / 2, DOOR.h / 2, 0));
    leaf.add(box(0.045, DOOR.h, 0.04, kit.brassSatin, w / 2, DOOR.h / 2, 0));
    for (const zz of [0.075, -0.075]) {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.5, 12), kit.brassSatin);
      handle.position.set(-side * (w / 2 - 0.1), 1.25, zz);
      leaf.add(handle);
      for (const hy of [0.62, 1.88]) {
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.075, 8), kit.brassSatin);
        stem.rotation.x = Math.PI / 2;
        stem.position.set(-side * (w / 2 - 0.1), hy, zz / 2);
        leaf.add(stem);
      }
    }
    pivot.add(leaf);
    g.add(pivot);
    leaves.push(pivot);
  }

  // o espaço entre a fachada e a parede interna também existe atrás das vitrines
  void ROOM;
  return {
    group: g,
    setDoors(open: number) {
      const a = open * 1.5;
      leaves[0]!.rotation.y = a;
      leaves[1]!.rotation.y = -a;
      // de raspão (aberta, colada ao batente) o vidro não deve virar uma faixa cinza
      doorGlass.uniforms.uFres!.value = 1 - open * 0.9;
      doorGlass.uniforms.uOpacity!.value = 0.045 * (1 - open * 0.6);
    },
  };
}

/** Vaso de cerâmica clara com ramos secos vinho (procedural, sem mídia externa). */
function buildVase(kit: Kit): THREE.Group {
  const g = new THREE.Group();
  const profile = [[0.1, 0], [0.17, 0.08], [0.2, 0.2], [0.17, 0.32], [0.11, 0.38], [0.1, 0.42]].map(([r, y]) => new THREE.Vector2(r!, y!));
  const vase = new THREE.Mesh(new THREE.LatheGeometry(profile, 28), kit.ceramic);
  vase.castShadow = true;
  g.add(vase);
  const twig = new THREE.MeshStandardMaterial({ color: '#4a1a22', roughness: 0.9 });
  const leaf = new THREE.MeshStandardMaterial({ color: '#6d2230', roughness: 0.85, side: THREE.DoubleSide });
  const leafGeo = new THREE.CircleGeometry(0.03, 6);
  const leaves = new THREE.InstancedMesh(leafGeo, leaf, 110);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  let li = 0;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const spread = 0.18 + (i % 3) * 0.1;
    const h = 0.75 + (i % 4) * 0.12;
    const pts = [new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(Math.cos(a) * spread * 0.4, 0.6, Math.sin(a) * spread * 0.4), new THREE.Vector3(Math.cos(a) * spread, 0.3 + h, Math.sin(a) * spread)];
    const curve = new THREE.CatmullRomCurve3(pts);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.004, 5, false), twig));
    for (let k = 0; k < 12 && li < 110; k++) {
      const p = curve.getPoint(0.45 + (k / 12) * 0.55);
      e.set(Math.sin(k * 2.1 + i), k * 0.7 + i, Math.cos(k * 1.3));
      q.setFromEuler(e);
      m.compose(p.add(new THREE.Vector3(Math.sin(k + i) * 0.05, 0, Math.cos(k * 1.7 + i) * 0.05)), q, new THREE.Vector3(1, 0.6, 1));
      leaves.setMatrixAt(li++, m);
    }
  }
  leaves.count = li;
  g.add(leaves);
  return g;
}
