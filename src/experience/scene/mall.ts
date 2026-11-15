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
  if (tier === 'cinema') {
    void capturePoster;
    // reflexo planar real sob o piso semitransparente (só no tier CINEMA)
    reflector = new Reflector(new THREE.PlaneGeometry(W, L), {
      clipBias: 0.003,
      textureWidth: Math.round(innerWidth * dpr * 0.5),
      textureHeight: Math.round(innerHeight * dpr * 0.5),
      color: 0x6f675c,
    });
    reflector.rotation.x = -Math.PI / 2;
    reflector.position.set(0, -0.003, L / 2 + 0.2);
    g.add(reflector);
    floorMat.transparent = true;
    floorMat.opacity = 0.58;
    floorMat.color.set('#c2b5a1');
    floorMat.roughness = 0.32;
  }

  if (!reflector) {
    // Refletores em tempo real duplicam draw calls; piso especular mantém a estética com um passe.
    floorMat.roughness = 0.18;
    floorMat.metalness = 0.12;
    floorMat.envMapIntensity = 0.9;
    floorMat.color.set('#cfc4b3');
    floorMat.emissive = new THREE.Color('#5c4f3e');
    floorMat.emissiveIntensity = 0.55;
  }

  // teto e sancas de luz
  const ceil = plane(W, L, kit.plaster, 3);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, H, L / 2 + 0.2);
  g.add(ceil);
  const mallStrip = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.9, 0.76).multiplyScalar(1.05) });
  for (const x of [-3.2, 3.2]) {
    g.add(box(0.36, 0.05, L, mallStrip, x, H - 0.03, L / 2 + 0.2));
    g.add(box(0.6, 0.18, L, kit.plaster, x, H - 0.12, L / 2 + 0.2));
  }

  // paredes laterais com vitrines vizinhas (neutras, sem identidade)
  const glowMat = new THREE.MeshBasicMaterial({ map: kit.glowTex, color: new THREE.Color('#e8d5b5').multiplyScalar(1.05) });
  const mallStone = kit.travertine.clone();
  mallStone.emissive = new THREE.Color('#6b5a44');
  mallStone.emissiveIntensity = 0.5;
  for (const side of [-1, 1]) {
    const wall = plane(L, H, mallStone, 2);
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

  // fundo da galeria: parede de travertino com vitrine vizinha iluminada (sem marca)
  const far = plane(W, H, mallStone, 2);
  far.rotation.y = Math.PI;
  far.position.set(0, H / 2, L + 0.2);
  g.add(far);
  // pavimento superior da galeria (laje e guarda-corpo de vidro iluminado)
  g.add(box(W, 0.32, 3.2, kit.plaster, 0, 3.6, L - 1.4));
  g.add(box(W, 0.9, 0.04, kit.glass, 0, 4.2, L - 3.0));
  g.add(box(W, 0.04, 0.06, kit.brass, 0, 4.65, L - 3.0));
  for (const x of [-5.6, -1.9, 1.9, 5.6]) {
    const shop = plane(3.2, 2.6, glowMat);
    shop.rotation.y = Math.PI;
    shop.position.set(x, 1.6, L + 0.17);
    g.add(shop);
    const upper = plane(3.2, 1.2, glowMat);
    upper.rotation.y = Math.PI;
    upper.position.set(x, 4.5, L + 0.17);
    g.add(upper);
  }
  const farGlow = plane(6.4, 3.1, glowMat);
  farGlow.rotation.y = Math.PI;
  farGlow.position.set(0, 1.95, L + 0.18);
  g.add(farGlow);
  for (const x of [-3.3, 3.3]) g.add(box(0.06, 3.3, 0.06, kit.brass, x, 1.95, L + 0.16));

  // luz de fim de tarde vinda da claraboia + destaque do letreiro
  // Galeria iluminada pelo próprio teto: spots com alcance limitado (não entram na loja).
  for (const [x, z] of [[-3.2, 12], [3.2, 18], [-3.2, 26]] as const) {
    const s = new THREE.SpotLight('#ffe6c4', 48, 10, 0.9, 0.9, 2);
    s.position.set(x, H - 0.1, z);
    s.target.position.set(x, 0, z - (z < 4 ? 2.4 : 0));
    g.add(s, s.target);
  }
  if (tier === 'cinema') {
    const sign = spot('#ffe2b6', 55, [0, 5.3, 3.2], [0, 4.2, 0], 0.55, 0.8);
    g.add(sign, sign.target);
  }
  return { group: g, reflector };
}
