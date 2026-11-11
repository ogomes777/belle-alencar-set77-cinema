/**
 * Galeria do shopping (z > 0): piso polido com reflexo, colunas em travertino,
 * sancas de luz, vitrines vizinhas neutras (sem marcas). Ponto de vista inicial.
 */
import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { box, contact, plane, spot, type Kit } from './kit';
import type { Tier } from '../../core/tier';

export interface MallHandle {
  group: THREE.Group;
  reflector: Reflector | null;
}

export function buildMall(kit: Kit, tier: Tier, dpr: number, capturePoster = false): MallHandle {
  const g = new THREE.Group();
  g.name = 'mall';
  const W = 16;
  const L = 34;
  const H = 5.4;

  // piso: placas de 1,2 m (textura cobre 2,4 m)
  const floorMat = kit.stoneFloor.clone();
  const floor = plane(W, L, floorMat, 2.4);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, L / 2 + 0.2);
  floor.receiveShadow = true;
  g.add(floor);

  let reflector: Reflector | null = null;
  if (tier === 'cinema' && capturePoster) {
    // reflexo planar real sob o piso semitransparente (só no tier CINEMA)
    reflector = new Reflector(new THREE.PlaneGeometry(W, L), {
      clipBias: 0.003,
      textureWidth: Math.round(innerWidth * dpr * 0.5),
      textureHeight: Math.round(innerHeight * dpr * 0.5),
      color: 0x8f8678,
    });
    reflector.rotation.x = -Math.PI / 2;
    reflector.position.set(0, -0.003, L / 2 + 0.2);
    g.add(reflector);
    floorMat.transparent = true;
    floorMat.opacity = 0.8;
  }

  if (!reflector) {
    // Refletores em tempo real duplicam draw calls; piso especular mantém a estética com um passe.
    floorMat.roughness = 0.17;
    floorMat.metalness = 0.19;
    floorMat.envMapIntensity = 1.35;
  }

  // teto e sancas de luz
  const ceil = plane(W, L, kit.plaster, 3);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, H, L / 2 + 0.2);
  g.add(ceil);
  for (const x of [-3.2, 3.2]) {
    g.add(box(0.36, 0.05, L, kit.light, x, H - 0.03, L / 2 + 0.2));
    g.add(box(0.6, 0.18, L, kit.plaster, x, H - 0.12, L / 2 + 0.2));
  }

  // paredes laterais com vitrines vizinhas (neutras, sem identidade)
  const glowMat = new THREE.MeshBasicMaterial({ map: kit.glowTex, color: new THREE.Color('#e8d5b5').multiplyScalar(1.05) });
  for (const side of [-1, 1]) {
    const wall = plane(L, H, kit.travertine, 2);
    wall.rotation.y = side * -Math.PI / 2;
    wall.position.set(side * W / 2, H / 2, L / 2 + 0.2);
    g.add(wall);
    for (const z of [6, 18, 30]) {
      const glow = plane(4.6, 3.1, glowMat);
      glow.rotation.y = side * -Math.PI / 2;
      glow.position.set(side * (W / 2 - 0.02), 1.95, z);
      g.add(glow);
      const glass = plane(4.6, 3.1, kit.glass);
      glass.rotation.y = side * -Math.PI / 2;
      glass.position.set(side * (W / 2 - 0.08), 1.95, z);
      g.add(glass);
      g.add(box(0.06, 0.06, 4.7, kit.brass, side * (W / 2 - 0.08), 3.52, z));
      g.add(box(0.06, 0.06, 4.7, kit.brass, side * (W / 2 - 0.08), 0.38, z));
    }
    // colunas
    for (const z of [3, 12, 24]) {
      g.add(box(0.7, H, 0.7, kit.travertine, side * 6.4, H / 2, z));
      g.add(box(0.76, 0.14, 0.76, kit.brass, side * 6.4, 0.07, z));
      g.add(box(0.76, 0.06, 0.76, kit.brass, side * 6.4, H - 0.4, z));
      g.add(contact(kit, 1.8, 1.8, side * 6.4, z));
    }
    // bancos
    const bench = new THREE.Group();
    bench.add(box(2.0, 0.38, 0.5, kit.travertine, 0, 0.19, 0));
    bench.add(box(2.04, 0.06, 0.54, kit.oak, 0, 0.41, 0));
    bench.position.set(side * 4.7, 0, 8.5);
    g.add(bench);
    g.add(contact(kit, 2.8, 1.2, side * 4.7, 8.5));
  }

  // luz de fim de tarde vinda da claraboia + destaque do letreiro
  const sun = new THREE.DirectionalLight('#ffe6c4', 1.25);
  sun.position.set(5, 11, 16);
  sun.target.position.set(0, 1, 0);
  g.add(sun, sun.target);
  if (tier === 'cinema') {
    const sign = spot('#ffe2b6', 55, [0, 5.3, 3.2], [0, 4.2, 0], 0.55, 0.8);
    g.add(sign, sign.target);
  }
  return { group: g, reflector };
}
