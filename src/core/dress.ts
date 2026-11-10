/**
 * Parâmetros do vestido-estudo procedural. Compartilhados entre o filme (3D)
 * e as ilustrações do catálogo para manter continuidade visual.
 * NÃO representam peças reais do acervo Belle.
 */
export type Silhouette = 'fluido' | 'marcante' | 'classico';
export type Tone = 'perola' | 'champagne' | 'noite' | 'terracota' | 'salvia';

export interface DressParams {
  silhouette: Silhouette;
  tone: Tone;
  /** Rótulo humano opcional (ex.: referência demo). */
  label?: string;
}

export interface ToneSpec {
  name: string;
  base: string; // cor do tecido
  sheen: string; // brilho de fibra
  shade: string; // sombra para ilustração
}

export const TONES: Record<Tone, ToneSpec> = {
  perola: { name: 'Pérola', base: '#e9dfcf', sheen: '#fff6e6', shade: '#c9bba4' },
  champagne: { name: 'Champagne', base: '#c9a77c', sheen: '#f3dcb3', shade: '#9c7b55' },
  noite: { name: 'Noite', base: '#2b2629', sheen: '#8a7a70', shade: '#171416' },
  terracota: { name: 'Terracota', base: '#b8735a', sheen: '#f0b89a', shade: '#8a4f3b' },
  salvia: { name: 'Sálvia', base: '#a9b19a', sheen: '#e3e8d6', shade: '#7f876f' },
};

export interface SilhouetteSpec {
  name: string;
  /** comprimento da saia em metros (cintura → barra) */
  length: number;
  /** raio da barra em repouso */
  hem: number;
  /** rigidez relativa de dobra (0..1) */
  stiffness: number;
  description: string;
}

export const SILHOUETTES: Record<Silhouette, SilhouetteSpec> = {
  fluido: { name: 'Fluido', length: 1.02, hem: 0.62, stiffness: 0.25, description: 'Longo, leve, com movimento.' },
  marcante: { name: 'Marcante', length: 0.78, hem: 0.36, stiffness: 0.55, description: 'Midi, ajustado, presença.' },
  classico: { name: 'Clássico', length: 0.6, hem: 0.46, stiffness: 0.45, description: 'Na altura do joelho, evasê.' },
};
