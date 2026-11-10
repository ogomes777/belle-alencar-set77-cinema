/**
 * Fachada da boutique em z = 0: pórtico de travertino extrudado com aberturas reais,
 * molduras de latão, letreiro, duas vitrines com profundidade e portas de vidro
 * pivotantes (abrem para dentro conforme o progresso do capítulo "porta").
 */
import * as THREE from 'three';
import { box, contact, plane, scaleUV, spot, type Kit } from './kit';
import { signTexture, monogramTexture } from '../textures';
import { staticDressGeometry } from '../cloth/dress';
import { TONES, type Silhouette, type Tone } from '../../core/dress';
import type { Tier } from '../../core/tier';

export interface FacadeHandle {
  group: THREE.Group;
  /** 0 fechada → 1 aberta */
  setDoors(open: number): void;
}

const DOOR_W = 1.25; // meia-largura do vão
const DOOR_H = 3.1;

export function dressForm(kit: Kit, sil: Silhouette, tone: Tone, seed: number, waistY = 1.28): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({
    color: TONES[tone].base, roughness: 0.66, sheen: 1, sheenColor: new THREE.Color(TONES[tone].sheen), sheenRoughness: 0.35,
    normalMap: kit.weave, normalScale: new THREE.Vector2(0.3, 0.3), side: THREE.DoubleSide,
  });
  const dress = new THREE.Mesh(staticDressGeometry(sil, seed), mat);
  dress.position.y = waistY;
  dress.castShadow = true;
  g.add(dress);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.14, 16), kit.plasterWarm);
  neck.position.y = waistY + 0.4;
  g.add(neck);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 8), kit.brass);
  cap.position.y = waistY + 0.48;
  g.add(cap);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, waistY, 8), kit.brass);
  pole.position.y = waistY / 2;
  g.add(pole);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.03, 32), kit.brass);
  base.position.y = 0.015;
  g.add(base);
  return g;
}

export function buildFacade(kit: Kit, tier: Tier): FacadeHandle {
  const g = new THREE.Group();
  g.name = 'facade';

  // pórtico com vão da porta e duas vitrines
  const s = new THREE.Shape();
  s.moveTo(-8, 0);
  s.lineTo(-DOOR_W, 0);
  s.lineTo(-DOOR_W, DOOR_H);
  s.lineTo(DOOR_W, DOOR_H);
  s.lineTo(DOOR_W, 0);
  s.lineTo(8, 0);
  s.lineTo(8, 5.4);
  s.lineTo(-8, 5.4);
  s.closePath();
  for (const x0 of [-5.6, 2.0]) {
    const hole = new THREE.Path();
    hole.moveTo(x0, 0.55);
    hole.lineTo(x0 + 3.6, 0.55);
    hole.lineTo(x0 + 3.6, 3.4);
    hole.lineTo(x0, 3.4);
    hole.lineTo(x0, 0.55);
    s.holes.push(hole);
  }
  const portico = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.4, bevelEnabled: false }), kit.travertine);
  scaleUV(portico.geometry, 0.5);
  portico.position.z = -0.2;
  portico.receiveShadow = true;
  g.add(portico);

  // faixa do letreiro e frisos de latão
  g.add(box(16, 0.04, 0.06, kit.brass, 0, 3.66, 0.23));
  g.add(box(16, 0.04, 0.06, kit.brass, 0, 4.86, 0.23));
  // faixa em bronze escuro: letras de latão ganham contraste e presença
  const fascia = box(16, 1.16, 0.05, new THREE.MeshStandardMaterial({ color: '#2a231c', roughness: 0.42, metalness: 0.35, envMapIntensity: 0.8 }), 0, 4.26, 0.205);
  g.add(fascia);
  const signMat = new THREE.MeshStandardMaterial({ map: signTexture(), transparent: true, alphaTest: 0.08, metalness: 0.85, roughness: 0.32, envMapIntensity: 1.6 });
  const sign = plane(6.2, 1.09, signMat);
  sign.position.set(0, 4.26, 0.235);
  g.add(sign);

  // molduras de latão: porta e vitrines
  const frame = (x0: number, x1: number, y0: number, y1: number) => {
    const t = 0.06;
    g.add(box(x1 - x0 + t, t, 0.08, kit.brass, (x0 + x1) / 2, y1, 0.21));
    g.add(box(x1 - x0 + t, t, 0.08, kit.brass, (x0 + x1) / 2, y0, 0.21));
    g.add(box(t, y1 - y0, 0.08, kit.brass, x0, (y0 + y1) / 2, 0.21));
    g.add(box(t, y1 - y0, 0.08, kit.brass, x1, (y0 + y1) / 2, 0.21));
  };
  frame(-DOOR_W, DOOR_W, 0.02, DOOR_H);
  frame(-5.6, -2.0, 0.55, 3.4);
  frame(2.0, 5.6, 0.55, 3.4);
  g.add(box(DOOR_W * 2, 0.012, 0.4, kit.brass, 0, 0.006, 0)); // soleira

  // vitrines: caixa rasa, fundo quente, plinto, manequins com vestidos-estudo
  const backMat = new THREE.MeshStandardMaterial({ map: kit.glowTex, emissive: new THREE.Color('#f3dfbd'), emissiveIntensity: 0.38, emissiveMap: kit.glowTex, roughness: 0.9 });
  const windows: { x: number; forms: [Silhouette, Tone, number, number][] }[] = [
    { x: -3.8, forms: [['fluido', 'champagne', -0.75, 3], ['classico', 'perola', 0.8, 5]] },
    { x: 3.8, forms: [['marcante', 'noite', -0.55, 2], ['fluido', 'terracota', 0.85, 8]] },
  ];
  for (const w of windows) {
    const back = plane(3.6, 2.85, backMat);
    back.position.set(w.x, 1.975, -1.35);
    g.add(back);
    const plinth = box(3.6, 0.55, 1.5, kit.travertine, w.x, 0.275, -0.6);
    plinth.receiveShadow = true;
    g.add(plinth);
    for (const side of [-1, 1]) {
      const wall = plane(1.5, 2.85, kit.plaster);
      wall.rotation.y = side * -Math.PI / 2;
      wall.position.set(w.x + side * 1.8, 1.975, -0.6);
      g.add(wall);
    }
    const top = plane(3.6, 1.5, kit.plaster);
    top.rotation.x = Math.PI / 2;
    top.position.set(w.x, 3.4, -0.6);
    g.add(top);
    g.add(box(3.4, 0.03, 0.05, kit.light, w.x, 3.38, -0.2));
    for (const [sil, tone, dx, seed] of w.forms) {
      const form = dressForm(kit, sil, tone, seed);
      form.position.set(w.x + dx, 0.55, -0.75);
      form.rotation.y = -dx * 0.25;
      g.add(form);
      g.add(contact(kit, 0.9, 0.7, w.x + dx, -0.75, 0.556));
    }
    const glass = plane(3.6, 2.85, kit.glass);
    glass.position.set(w.x, 1.975, 0.16);
    g.add(glass);
    if (tier === 'cinema') {
      const sp = spot('#ffe7c2', 18, [w.x, 3.3, 0.1], [w.x, 1.2, -0.8], 0.75, 0.9);
      g.add(sp, sp.target);
    }
  }

  // vestíbulo: laterais e teto entre fachada e salão (z 0.2 → -1.4)
  for (const side of [-1, 1]) {
    const wall = plane(1.6, DOOR_H, kit.plaster);
    wall.rotation.y = side * -Math.PI / 2;
    wall.position.set(side * DOOR_W, DOOR_H / 2, -0.6);
    g.add(wall);
  }
  const vtop = plane(DOOR_W * 2, 1.6, kit.plaster);
  vtop.rotation.x = Math.PI / 2;
  vtop.position.set(0, DOOR_H, -0.6);
  g.add(vtop);

  // portas: duas folhas de vidro com moldura e puxador vertical
  const leaves: THREE.Group[] = [];
  const mono = monogramTexture();
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.userData.dynamic = true;
    pivot.position.set(side * DOOR_W, 0, 0.05);
    const leaf = new THREE.Group();
    const w = DOOR_W - 0.02;
    leaf.position.x = -side * w / 2;
    const glass = plane(w, DOOR_H - 0.06, kit.glass);
    glass.position.y = DOOR_H / 2;
    leaf.add(glass);
    leaf.add(box(w, 0.05, 0.05, kit.brass, 0, 0.03, 0));
    leaf.add(box(w, 0.05, 0.05, kit.brass, 0, DOOR_H - 0.04, 0));
    leaf.add(box(0.05, DOOR_H, 0.05, kit.brass, -w / 2, DOOR_H / 2, 0));
    leaf.add(box(0.05, DOOR_H, 0.05, kit.brass, w / 2, DOOR_H / 2, 0));
    for (const zz of [0.06, -0.06]) {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.1, 12), kit.brass);
      // puxador junto à borda livre (centro do vão)
      handle.position.set(-side * (w / 2 - 0.14), 1.1, zz);
      leaf.add(handle);
    }
    if (side === -1) {
      const etch = plane(0.5, 0.5, new THREE.MeshBasicMaterial({ map: mono, transparent: true, depthWrite: false, opacity: 0.75 }));
      etch.position.set(0.1, 1.55, 0.005);
      leaf.add(etch);
    }
    pivot.add(leaf);
    g.add(pivot);
    leaves.push(pivot);
  }

  return {
    group: g,
    setDoors(open: number) {
      const a = open * 1.42;
      leaves[0]!.rotation.y = a;
      leaves[1]!.rotation.y = -a;
    },
  };
}
