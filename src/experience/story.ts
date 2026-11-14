/**
 * Roteiro de câmera e do vestido em função do progresso do filme.
 * Cada capítulo tem um intervalo [s, e] medido no DOM (o cartão de texto
 * fica fixo nesse intervalo). Dentro do intervalo a câmera "permanece"
 * (drift lento A→B); entre capítulos ela viaja (transição).
 * As poses fixas de aceite (quadros 01–06) vivem em scene/layout.ts; os
 * capítulos passam por 01, 02, 03 e 04 e o quadro 06 é alcançado na visita.
 */
import * as THREE from 'three';
import { CURTAIN_ARCH, DOOR, HERO_STAND, FITTING, POSES, ROOM } from './scene/layout';
import { HERO_HANGER } from './scene/boutique';

export type ChapterId = 'vitrine' | 'porta' | 'sala' | 'vestido' | 'detalhe' | 'categorias' | 'provador';
export interface Span { id: ChapterId; s: number; e: number }

interface Shot { pos: [number, number, number]; tgt: [number, number, number]; fov: number }
type V3 = [number, number, number];
const pose = (id: string): Shot => { const p = POSES.find((x) => x.id === id)!; return { pos: p.pos, tgt: p.tgt, fov: p.fov }; };

const SHOTS: Record<ChapterId, [Shot, Shot]> = {
  vitrine: [
    { pos: [0.4, 1.52, 12.2], tgt: [-0.2, 2.15, 0], fov: 38 },
    pose('01'),
  ],
  porta: [
    { pos: [0, 1.58, 4.6], tgt: [0, 1.75, -2], fov: 42 },
    { pos: [0, 1.55, 1.6], tgt: [0, 1.6, -5], fov: 46 },
  ],
  sala: [
    pose('02'),
    { pos: [0.1, 1.45, -1.9], tgt: [0.6, 1.28, -16], fov: 50 },
  ],
  vestido: [
    pose('03'),
    { pos: [-0.3, 1.42, -8.6], tgt: [HERO_STAND.x, 1.2, HERO_STAND.z], fov: 42 },
  ],
  detalhe: [
    { pos: [-0.75, 1.3, -11.25], tgt: [HERO_STAND.x - 0.1, 1.1, HERO_STAND.z], fov: 28 },
    { pos: [-0.95, 0.95, -11.55], tgt: [HERO_STAND.x - 0.12, 0.84, HERO_STAND.z], fov: 26 },
  ],
  categorias: [
    { pos: [-0.3, 1.52, -12.4], tgt: [-0.5, 1.5, ROOM.zBack], fov: 44 },
    { pos: [0.9, 1.52, -14.6], tgt: [CURTAIN_ARCH.x, 1.45, ROOM.zBack], fov: 44 },
  ],
  provador: [
    pose('04'),
    { pos: [2.75, 1.4, -19.3], tgt: [1.95, 1.25, FITTING.z1], fov: 46 },
  ],
};

/** Keyframes extras: travessia da porta e do arco da cortina. */
const THRESHOLD: Shot = { pos: [0, 1.52, DOOR.z + 0.25], tgt: [0, 1.4, -14], fov: 50 };
const CURTAIN_PASS: Shot = { pos: [CURTAIN_ARCH.x, 1.5, ROOM.zBack + 0.2], tgt: [FITTING.mirrorX, 1.3, FITTING.z1], fov: 46 };

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
      if (sp.id === 'porta' && next) keys.push(mk(sp.e + (next.s - sp.e) * 0.5, THRESHOLD, true));
      if (sp.id === 'categorias' && next) keys.push(mk(sp.e + (next.s - sp.e) * 0.55, CURTAIN_PASS, true));
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
    const standPos = new THREE.Vector3(HERO_STAND.x, 1.34, HERO_STAND.z);
    const fitPos = new THREE.Vector3(FITTING.standX, 1.34, FITTING.standZ);
    out.atFitting = false;
    // fase 3: viagem suporte → provador (fim das categorias até início do provador)
    if (cat && prov && p > cat.s + (cat.e - cat.s) * 0.55) {
      const t = easeInOut(THREE.MathUtils.clamp((p - (cat.s + (cat.e - cat.s) * 0.55)) / Math.max(1e-6, prov.s - (cat.s + (cat.e - cat.s) * 0.55)), 0, 1));
      pathAt([standPos, new THREE.Vector3(0.6, 1.9, -15.2), new THREE.Vector3(CURTAIN_ARCH.x, 1.7, ROOM.zBack - 0.3), fitPos], t, out.pos);
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
    // fase 2: voo da arara ao suporte
    const t = easeInOut(THREE.MathUtils.clamp((v - 0.1) / 0.75, 0, 1));
    pathAt([railPos, new THREE.Vector3(1.9, 2.0, -8.4), new THREE.Vector3(-0.2, 1.8, -10.9), standPos], t, out.pos);
    out.yaw = Math.PI / 2 + t * (Math.PI * 2 - Math.PI / 2);
    out.energy = Math.min(1, Math.sin(Math.min(1, t * 1.15) * Math.PI) * 1.1) * (1 - t) + 0.3 * t;
    out.onRail = false;
  }

  doors(p: number): number {
    return easeInOut(this.local('porta', p));
  }

  /** Abertura da cortina do provador: abre no fim das categorias e permanece aberta no provador. */
  curtain(p: number): number {
    const cat = this.span('categorias');
    const prov = this.span('provador');
    if (!cat || !prov) return 0;
    const a = cat.s + (cat.e - cat.s) * 0.6;
    const b = prov.s;
    return easeInOut(THREE.MathUtils.clamp((p - a) / Math.max(1e-6, b - a), 0, 1));
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

function pathAt(pts: THREE.Vector3[], t: number, out: THREE.Vector3) {
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  curve.getPoint(t, out);
}
