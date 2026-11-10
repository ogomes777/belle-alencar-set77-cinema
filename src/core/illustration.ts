/**
 * Ilustrações vetoriais procedurais (moda "flat" editorial).
 * Usadas no catálogo demonstrativo e no fallback do provador.
 * São desenhos, não fotos, e sempre recebem selo "Ilustração".
 */
import { SILHOUETTES, TONES, type Silhouette, type Tone } from './dress';

export type IllustrationKind = 'dress' | 'set' | 'bag' | 'earring' | 'belt';
export type Neckline = 'alca' | 'tomara' | 'v' | 'manga';

export interface IllustrationSpec {
  kind: IllustrationKind;
  tone: Tone;
  silhouette?: Silhouette;
  neckline?: Neckline;
  /** semente para variação de dobras */
  seed?: number;
}

let uid = 0;
const r = (n: number) => Math.round(n * 10) / 10;

function rand(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hanger(): string {
  return `<g class="ill-hanger" fill="none" stroke="#8c7a5c" stroke-width="2" stroke-linecap="round">
    <path d="M100 30 V22 a7 7 0 1 1 7 -7"/>
    <path d="M100 30 L62 44 Q58 46 62 47 H138 Q142 46 138 44 Z" stroke-linejoin="round"/>
  </g>`;
}

function defs(id: string, tone: Tone): string {
  const t = TONES[tone];
  return `<defs>
    <linearGradient id="g${id}" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="${t.shade}"/>
      <stop offset="0.38" stop-color="${t.base}"/>
      <stop offset="0.55" stop-color="${t.sheen}" stop-opacity="0.9"/>
      <stop offset="0.72" stop-color="${t.base}"/>
      <stop offset="1" stop-color="${t.shade}"/>
    </linearGradient>
    <linearGradient id="v${id}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.16"/>
    </linearGradient>
  </defs>`;
}

function dress(spec: IllustrationSpec, id: string): string {
  const sil = SILHOUETTES[spec.silhouette ?? 'fluido'];
  const rnd = rand(spec.seed ?? 7);
  const waistY = 112;
  const L = 60 + sil.length * 170;
  const hemY = Math.min(292, waistY + L);
  const hem = 18 + sil.hem * 95;
  const neck = spec.neckline ?? 'alca';
  let bodice = '';
  let straps = '';
  if (neck === 'tomara') {
    bodice = `M80 70 Q100 64 120 70 L121 ${waistY} L79 ${waistY} Z`;
  } else if (neck === 'v') {
    bodice = `M78 52 L100 82 L122 52 L121 ${waistY} L79 ${waistY} Z`;
    straps = `<path d="M84 47 L80 54 M116 47 L120 54" stroke="${TONES[spec.tone].shade}" stroke-width="3"/>`;
  } else if (neck === 'manga') {
    bodice = `M80 52 Q100 60 120 52 L121 ${waistY} L79 ${waistY} Z`;
    straps = `<path d="M80 52 L62 64 L66 92 L80 80 Z M120 52 L138 64 L134 92 L120 80 Z" fill="url(#g${id})"/>`;
  } else {
    bodice = `M80 66 Q90 74 100 68 Q110 74 120 66 L121 ${waistY} L79 ${waistY} Z`;
    straps = `<path d="M84 47 L82 67 M116 47 L118 67" stroke="${TONES[spec.tone].shade}" stroke-width="1.6"/>`;
  }
  // saia: marcante = sereia (afina no joelho e abre na barra)
  let skirt: string;
  if (spec.silhouette === 'marcante') {
    const kneeY = waistY + L * 0.68;
    skirt = `M79 ${waistY} C70 ${waistY + 30} 74 ${kneeY - 20} 82 ${kneeY} Q${100 - hem - 6} ${hemY - 8} ${100 - hem} ${hemY} Q100 ${hemY + 6} ${100 + hem} ${hemY} Q${100 + hem + 6} ${hemY - 8} 118 ${kneeY} C126 ${kneeY - 20} 130 ${waistY + 30} 121 ${waistY} Z`;
  } else {
    skirt = `M79 ${waistY} C${76 - hem * 0.15} ${waistY + L * 0.35} ${100 - hem * 0.92} ${hemY - L * 0.25} ${100 - hem} ${hemY} Q100 ${hemY + 7} ${100 + hem} ${hemY} C${100 + hem * 0.92} ${hemY - L * 0.25} ${124 + hem * 0.15} ${waistY + L * 0.35} 121 ${waistY} Z`;
  }
  let folds = '';
  const n = 5 + Math.round(sil.hem * 6);
  for (let i = 1; i < n; i++) {
    const u = i / n;
    const x0 = 80 + u * 40;
    const x1 = 100 - hem + u * hem * 2 + (rnd() - 0.5) * 6;
    const cx = (x0 + x1) / 2 + (rnd() - 0.5) * 10;
    folds += `<path d="M${r(x0)} ${waistY + 4} Q${r(cx)} ${r(waistY + L * 0.55)} ${r(x1)} ${r(hemY - 2)}" stroke="#000" stroke-opacity="${r(0.05 + rnd() * 0.07)}" stroke-width="${r(0.8 + rnd() * 1.6)}" fill="none"/>`;
  }
  return `${straps}
    <path d="${bodice}" fill="url(#g${id})"/>
    <path d="${skirt}" fill="url(#g${id})"/>
    <path d="${skirt}" fill="url(#v${id})"/>
    <clipPath id="c${id}"><path d="${skirt}"/></clipPath>
    <g clip-path="url(#c${id})">${folds}</g>
    <path d="M79 ${waistY} Q100 ${waistY + 4} 121 ${waistY}" stroke="${TONES[spec.tone].shade}" stroke-width="1.4" fill="none"/>`;
}

function set(spec: IllustrationSpec, id: string): string {
  const t = TONES[spec.tone];
  const wide = spec.silhouette !== 'marcante';
  const top = `<path d="M80 52 Q100 62 120 52 L140 66 L132 96 L122 88 L122 120 L78 120 L78 88 L68 96 L60 66 Z" fill="url(#g${id})"/>`;
  const bottom = wide
    ? `<path d="M78 128 L122 128 L140 288 L104 288 L100 170 L96 288 L60 288 Z" fill="url(#g${id})"/><path d="M78 128 L122 128 L140 288 L104 288 L100 170 L96 288 L60 288 Z" fill="url(#v${id})"/>`
    : `<path d="M78 128 L122 128 L130 236 Q100 244 70 236 Z" fill="url(#g${id})"/><path d="M78 128 L122 128 L130 236 Q100 244 70 236 Z" fill="url(#v${id})"/>`;
  return `${top}<path d="M78 128 H122" stroke="${t.shade}" stroke-width="3"/>${bottom}
    <path d="M100 130 V${wide ? 168 : 236}" stroke="#000" stroke-opacity=".08"/>`;
}

function bag(spec: IllustrationSpec, id: string): string {
  const t = TONES[spec.tone];
  return `<path d="M70 120 Q100 40 130 120" fill="none" stroke="${t.shade}" stroke-width="5"/>
    <path d="M52 120 H148 L140 230 H60 Z" fill="url(#g${id})"/>
    <path d="M52 120 H148 L140 230 H60 Z" fill="url(#v${id})"/>
    <path d="M56 150 H144" stroke="#000" stroke-opacity=".1"/>
    <rect x="93" y="142" width="14" height="16" rx="2" fill="#b49a64"/>`;
}

function earring(spec: IllustrationSpec, id: string): string {
  const drop = (x: number) => `<circle cx="${x}" cy="96" r="6" fill="#b49a64"/>
    <path d="M${x} 102 V128" stroke="#b49a64" stroke-width="1.5"/>
    <path d="M${x} 128 C${x - 22} 160 ${x - 16} 200 ${x} 206 C${x + 16} 200 ${x + 22} 160 ${x} 128 Z" fill="url(#g${id})"/>
    <path d="M${x - 4} 150 Q${x - 8} 176 ${x - 2} 194" stroke="#fff" stroke-opacity=".55" stroke-width="2" fill="none"/>`;
  return drop(72) + drop(128);
}

function belt(spec: IllustrationSpec, id: string): string {
  const t = TONES[spec.tone];
  return `<path d="M20 150 Q100 128 180 150 L180 172 Q100 150 20 172 Z" fill="url(#g${id})"/>
    <rect x="86" y="132" width="30" height="34" rx="4" fill="none" stroke="#b49a64" stroke-width="5"/>
    <path d="M101 136 V162" stroke="#b49a64" stroke-width="3"/>
    <path d="M30 160 Q100 140 170 160" stroke="${t.sheen}" stroke-opacity=".5" fill="none"/>`;
}

/** Retorna o SVG completo como string (seguro: só valores internos). */
export function illustrate(spec: IllustrationSpec, label = 'Ilustração demonstrativa'): string {
  const id = `i${++uid}`;
  const body =
    spec.kind === 'dress' ? hanger() + dress(spec, id)
    : spec.kind === 'set' ? hanger() + set(spec, id)
    : spec.kind === 'bag' ? bag(spec, id)
    : spec.kind === 'earring' ? earring(spec, id)
    : belt(spec, id);
  return `<svg class="ill" viewBox="0 0 200 300" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${defs(id, spec.tone)}<ellipse cx="100" cy="294" rx="54" ry="4" fill="#000" opacity=".07"/>${body}</svg>`;
}
