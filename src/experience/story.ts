/**
 * Roteiro de câmera e do vestido em função do progresso do filme.
 * Cada capítulo tem um intervalo [s, e] medido no DOM (o cartão de texto
 * fica fixo nesse intervalo). Dentro do intervalo a câmera "permanece"
 * (drift lento A→B); entre capítulos ela viaja (transição).
 * Ver docs/SCENE_CAMERA_RIG.md e docs/IMPLEMENTATION_PLAN.md §2.
 */
import * as THREE from 'three';
import { ARCHES, FITTING, HERO_HANGER, PODIUM } from './scene/boutique';

export type ChapterId = 'vitrine' | 'porta' | 'sala' | 'vestido' | 'detalhe' | 'categorias' | 'provador';
export interface Span { id: ChapterId; s: number; e: number }

interface Shot { pos: [number, number, number]; tgt: [number, number, number]; fov: number }
type V3 = [number, number, number];

const SHOTS: Record<ChapterId, [Shot, Shot]> = {
  vitrine: [
    { pos: [0.9, 1.62, 13.6], tgt: [-1.5, 2.15, 0], fov: 40 },
    { pos: [0.6, 1.62, 11.0], tgt: [-0.9, 2.05, 0], fov: 40 },
  ],
  porta: [
    { pos: [0, 1.62, 4.8], tgt: [0, 1.78, -2], fov: 40 },
    { pos: [0, 1.62, 2.8], tgt: [0, 1.7, -4], fov: 40 },
  ],
  sala: [
    { pos: [-1.0, 1.62, -3.1], tgt: [3.4, 1.42, -6.2], fov: 40 },
    { pos: [-1.25, 1.6, -3.9], tgt: [3.5, 1.4, -6.9], fov: 40 },
  ],
  vestido: [
    { pos: [0.1, 1.52, -4.4], tgt: [2.8, 1.38, -6.7], fov: 38 },
    { pos: [0, 1.45, -4.9], tgt: [0.1, 1.12, -8], fov: 38 },
  ],
  detalhe: [
    { pos: [0.78, 1.32, -6.85], tgt: [0.42, 1.08, -8], fov: 28 },
    { pos: [0.62, 0.9, -6.95], tgt: [0.36, 0.82, -8], fov: 26 },
  ],
  categorias: [
    { pos: [-3.2, 1.62, -11.6], tgt: [-3.6, 1.72, -17.2], fov: 40 },
    { pos: [0.7, 1.62, -11.9], tgt: [1.2, 1.72, -17.2], fov: 40 },
  ],
  provador: [
    { pos: [2.85, 1.56, -11.2], tgt: [3.75, 1.2, -15.5], fov: 36 },
    { pos: [3.15, 1.46, -12.0], tgt: [3.85, 1.12, -15.5], fov: 36 },
  ],
};

/** Keyframes extras na travessia da porta (gap porta → sala). */
const THRESHOLD: Shot = { pos: [0, 1.62, -0.7], tgt: [0, 1.6, -8], fov: 40 };

interface Key { p: number; pos: THREE.Vector3; tgt: THREE.Vector3; fov: number; travel: boolean }

export class Story {
  private keys: Key[] = [];
  spans: Span[] = [];

  setSpans(spans: Span[]): void {
    this.spans = spans;
    const keys: Key[] = [];
    spans.forEach((sp, i) => {
      const [a, b] = SHOTS[sp.id];
      keys.push(mk(sp.s, a, false), mk(sp.e, b, true));
      const next = spans[i + 1];
      if (sp.id === 'porta' && next) keys.push(mk((sp.e + next.s) / 2, THRESHOLD, true));
    });
    keys.sort((x, y) => x.p - y.p);
    this.keys = keys;
  }

  span(id: ChapterId): Span | undefined {
    return this.spans.find((s) => s.id === id);
  }

  /** Fração 0..1 dentro do capítulo (clamp). */
  local(id: ChapterId, p: number): number {
    const s = this.span(id);
    if (!s) return 0;
    return THREE.MathUtils.clamp((p - s.s) / Math.max(1e-6, s.e - s.s), 0, 1);
  }

  camera(p: number, outPos: THREE.Vector3, outTgt: THREE.Vector3): number {
    const k = this.keys;
    if (!k.length) return 40;
    if (p <= k[0]!.p) { outPos.copy(k[0]!.pos); outTgt.copy(k[0]!.tgt); return k[0]!.fov; }
    const last = k[k.length - 1]!;
    if (p >= last.p) { outPos.copy(last.pos); outTgt.copy(last.tgt); return last.fov; }
    let i = 0;
    while (i < k.length - 2 && p > k[i + 1]!.p) i++;
    const a = k[i]!;
    const b = k[i + 1]!;
    const raw = (p - a.p) / Math.max(1e-6, b.p - a.p);
    // segmentos de viagem com ease in-out; permanência quase linear
    const t = a.travel ? easeInOut(raw) : raw;
    const p0 = k[Math.max(0, i - 1)]!;
    const p3 = k[Math.min(k.length - 1, i + 2)]!;
    catmull(p0.pos, a.pos, b.pos, p3.pos, t, outPos);
    catmull(p0.tgt, a.tgt, b.tgt, p3.tgt, t, outTgt);
    return a.fov + (b.fov - a.fov) * t;
  }

  /** Estado do vestido protagonista. */
  dress(p: number, out: { pos: THREE.Vector3; yaw: number; energy: number; onRail: boolean; atFitting: boolean }): void {
    const v = this.local('vestido', p);
    const cat = this.span('categorias');
    const prov = this.span('provador');
    const railPos = new THREE.Vector3(HERO_HANGER.x, HERO_HANGER.y - 0.56, HERO_HANGER.z);
    const podiumPos = new THREE.Vector3(PODIUM.x, 1.34, PODIUM.z);
    const fitPos = new THREE.Vector3(FITTING.x, 1.34, FITTING.z);
    out.atFitting = false;
    // fase 3: viagem pódio → provador (fim das categorias até início do provador)
    if (cat && prov && p > cat.s + (cat.e - cat.s) * 0.55) {
      const t = easeInOut(THREE.MathUtils.clamp((p - (cat.s + (cat.e - cat.s) * 0.55)) / Math.max(1e-6, prov.s - (cat.s + (cat.e - cat.s) * 0.55)), 0, 1));
      pathAt([podiumPos, new THREE.Vector3(1.5, 1.8, -11.0), new THREE.Vector3(3.2, 1.6, -13.4), fitPos], t, out.pos);
      out.yaw = Math.PI * 2 + t * (Math.PI * 2 - 0.45);
      out.energy = 0.25 + Math.sin(t * Math.PI) * 0.65;
      out.onRail = false;
      out.atFitting = t >= 1;
      return;
    }
    // fase 1: na arara até 10% do capítulo "vestido"
    if (v <= 0.1) {
      out.pos.copy(railPos);
      out.yaw = Math.PI / 2;
      out.energy = 0;
      out.onRail = true;
      return;
    }
    // fase 2: voo da arara ao pódio
    const t = easeInOut(THREE.MathUtils.clamp((v - 0.1) / 0.75, 0, 1));
    pathAt([railPos, new THREE.Vector3(3.6, 1.95, -6.7), new THREE.Vector3(1.4, 1.72, -7.7), podiumPos], t, out.pos);
    out.yaw = Math.PI / 2 + t * (Math.PI * 2 - Math.PI / 2);
    out.energy = Math.min(1, Math.sin(Math.min(1, t * 1.15) * Math.PI) * 1.1) * (1 - t) + 0.3 * t;
    out.onRail = false;
  }

  /** Foco dos arcos de categoria (0..2), ou -5 fora do capítulo. */
  archFocus(p: number, camX: number): number {
    const s = this.span('categorias');
    if (!s || p < s.s - 0.02 || p > s.e + 0.02) return -5;
    return THREE.MathUtils.clamp((camX - ARCHES[0]!) / (ARCHES[1]! - ARCHES[0]!), 0, 2);
  }

  doors(p: number): number {
    return easeInOut(this.local('porta', p));
  }
}

function mk(p: number, s: Shot, travel: boolean): Key {
  return { p, pos: new THREE.Vector3(...(s.pos as V3)), tgt: new THREE.Vector3(...(s.tgt as V3)), fov: s.fov, travel };
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function catmull(p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3, t: number, out: THREE.Vector3) {
  const t2 = t * t;
  const t3 = t2 * t;
  out.set(0, 0, 0);
  const c = (a: number, b: number, c2: number, d: number) =>
    0.5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t2 + (-a + 3 * b - 3 * c2 + d) * t3);
  out.x = c(p0.x, p1.x, p2.x, p3.x);
  out.y = c(p0.y, p1.y, p2.y, p3.y);
  out.z = c(p0.z, p1.z, p2.z, p3.z);
}

const curveCache = new WeakMap<THREE.Vector3[], THREE.CatmullRomCurve3>();
function pathAt(pts: THREE.Vector3[], t: number, out: THREE.Vector3) {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  curveCache.set(pts, curve);
  curve.getPoint(t, out);
}
