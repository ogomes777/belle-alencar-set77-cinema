/**
 * Planta única da boutique Belle (metros). Fonte compartilhada entre cena,
 * câmera, navegação em primeira pessoa, picking e QA. Sem dependência de
 * Three.js para ser testável em Node.
 *
 * Eixos: x para a direita de quem entra, y para cima, z negativo entra na loja.
 * z = 0 é o plano da vitrine/fachada; a porta fica recuada em z = DOOR.z.
 * Referências: docs/hero-pov/05_FIDELIDADE_VISUAL.md (quadro 02 governa a planta).
 */
export const EYE = 1.62;

export const ROOM = { x: 4.2, zFront: -0.9, zBack: -18.2, h: 3.7 } as const;
export const DOOR = { halfW: 1.25, h: 2.92, z: -0.9, leafW: 1.22 } as const;
/** Painéis de nogueira que ladeiam a porta pelo lado interno (quadro 06). */
export const WOOD_PANEL = { x0: DOOR.halfW, x1: 2.95 } as const;

/** Araras livres: varão de latão, dois montantes e bases de pedra (quadros 02/03/05). */
export const RAIL = { y: 1.86, x: 2.95, z0: -4.0, z1: -9.4, slots: 18, baseW: 0.5, baseD: 0.36, baseH: 0.3, garmentHalf: 0.46 } as const;
/** Banco de travertino no fim de cada arara: expositor de bolsas e bandeja de joias. */
export const SHELF = { x: 2.95, z0: -9.95, z1: -11.35, h: 0.64, d: 0.52, slots: 6 } as const;

export const ARCHES = { z: [-3.9, -7.3, -10.7, -14.1], w: 2.1, h: 3.05, depth: 0.32 } as const;
export const TRACKS = { x: [-1.9, 0, 1.9], step: 1.3 } as const;

/** Suporte de latão onde o vestido protagonista pousa (fora do corredor central). */
export const HERO_STAND = { x: -1.55, z: -12.6 } as const;
/** Pedestal baixo com a bolsa Belle (alvo do voo até a sacola). */
export const BAG_PEDESTAL = { x: -1.45, z: -15.6, r: 0.42, h: 0.84 } as const;
export const BACK_MIRROR = { x: -0.6, w: 1.35, h: 2.75 } as const;
export const CURTAIN_ARCH = { x: 2.3, w: 2.1, h: 3.05 } as const;

/** Provador: sala atrás do arco com cortina, à direita do eixo. */
export const FITTING = {
  x0: 0.5, x1: 4.2, z0: -18.2, z1: -22.2,
  mirrorX: 1.85, mirrorW: 1.3, mirrorH: 2.7,
  standX: 3.05, standZ: -21.45,
  chairX: 1.05, chairZ: -21.15,
} as const;

export type Side = 'left' | 'right';
export const SIDE_SIGN: Record<Side, 1 | -1> = { left: -1, right: 1 };

/** Posição z de cada cabide no varão (ordem estável, do mais próximo da porta ao fundo). */
export function slotZ(index: number, slots = RAIL.slots): number {
  const inset = 0.28;
  const span = (RAIL.z0 - inset) - (RAIL.z1 + inset);
  return RAIL.z0 - inset - (index / Math.max(1, slots - 1)) * span;
}
export function shelfSlotZ(index: number, slots = SHELF.slots): number {
  const inset = 0.18;
  const span = (SHELF.z0 - inset) - (SHELF.z1 + inset);
  return SHELF.z0 - inset - (index / Math.max(1, slots - 1)) * span;
}
/** Cabide reservado ao vestido protagonista (lado direito). */
export const HERO_SLOT = 17;
/** Passo entre cabides quando a página é agrupada (arara real: peças encostadas). */
export const RAIL_PITCH = 0.2;
export const RAIL_CENTER_Z = -6.5;
/** z do k-ésimo de n cabides agrupados em torno do centro do varão. */
export function clusterZ(k: number, n: number): number {
  return RAIL_CENTER_Z + ((n - 1) / 2 - k) * RAIL_PITCH;
}
/** Ângulo das peças: 55% voltadas para a porta, como numa arara real vista do corredor. */
export const GARMENT_TURN = 0.55;

/** Destinos físicos da visita. Identidade fixa na planta, independentemente da orientação do visitante. */
export type DestinationId = 'entrada' | 'corredor' | 'araraEsquerda' | 'araraDireita' | 'fundo' | 'provador';
export interface Destination { x: number; z: number; lookX: number; lookZ: number }
export const DESTINATIONS: Record<DestinationId, Destination> = {
  entrada: { x: 0, z: -2.4, lookX: 0, lookZ: -14 },
  corredor: { x: 0, z: -6.8, lookX: 0, lookZ: -18.2 },
  araraEsquerda: { x: -1.35, z: -6.7, lookX: -2.95, lookZ: -7.0 },
  araraDireita: { x: 1.35, z: -6.7, lookX: 2.95, lookZ: -7.0 },
  fundo: { x: -0.2, z: -13.8, lookX: -0.6, lookZ: -18.2 },
  provador: { x: 2.3, z: -16.5, lookX: 2.3, lookZ: -19.5 },
};

export interface Waypoint { id: string; x: number; z: number; links: readonly string[] }
export const WAYPOINTS: readonly Waypoint[] = [
  { id: 'entrada', x: 0, z: -2.4, links: ['frente'] },
  { id: 'frente', x: 0, z: -4.6, links: ['entrada', 'corredor', 'araraEsquerda', 'araraDireita'] },
  { id: 'corredor', x: 0, z: -6.8, links: ['frente', 'araraEsquerda', 'araraDireita', 'fundoCorredor'] },
  { id: 'araraEsquerda', x: -1.35, z: -6.7, links: ['frente', 'corredor', 'fundoCorredor'] },
  { id: 'araraDireita', x: 1.35, z: -6.7, links: ['frente', 'corredor', 'fundoCorredor'] },
  { id: 'fundoCorredor', x: 0, z: -10.8, links: ['corredor', 'araraEsquerda', 'araraDireita', 'fundo', 'provador'] },
  { id: 'fundo', x: -0.2, z: -13.8, links: ['fundoCorredor', 'provador'] },
  { id: 'provador', x: 2.3, z: -16.5, links: ['fundo', 'fundoCorredor', 'provadorDentro'] },
  { id: 'provadorDentro', x: 2.5, z: -19.6, links: ['provador'] },
];

export interface Box { x0: number; x1: number; z0: number; z1: number; name?: string }
/** Raio da cápsula do visitante. */
export const WALK_RADIUS = 0.34;

/** Volumes de colisão (projeção no piso). Paredes são caixas espessas. */
export function buildObstacles(): Box[] {
  const X = ROOM.x;
  const list: Box[] = [
    { x0: -9, x1: -X, z0: -60, z1: 30, name: 'parede esquerda' },
    { x0: X, x1: 9, z0: -60, z1: 30, name: 'parede direita' },
    { x0: -9, x1: 9, z0: DOOR.z, z1: 30, name: 'fachada e porta' },
    { x0: -9, x1: CURTAIN_ARCH.x - CURTAIN_ARCH.w / 2, z0: -60, z1: ROOM.zBack, name: 'parede do fundo (esq.)' },
    { x0: CURTAIN_ARCH.x + CURTAIN_ARCH.w / 2, x1: 9, z0: FITTING.z0 - 0.5, z1: ROOM.zBack, name: 'parede do fundo (dir.)' },
    { x0: -9, x1: FITTING.x0, z0: -60, z1: ROOM.zBack, name: 'parede lateral do provador' },
    { x0: -9, x1: 9, z0: -60, z1: FITTING.z1, name: 'fundo do provador' },
    { x0: HERO_STAND.x - 0.3, x1: HERO_STAND.x + 0.3, z0: HERO_STAND.z - 0.3, z1: HERO_STAND.z + 0.3, name: 'suporte do vestido' },
    { x0: BAG_PEDESTAL.x - BAG_PEDESTAL.r, x1: BAG_PEDESTAL.x + BAG_PEDESTAL.r, z0: BAG_PEDESTAL.z - BAG_PEDESTAL.r, z1: BAG_PEDESTAL.z + BAG_PEDESTAL.r, name: 'pedestal da bolsa' },
    { x0: FITTING.chairX - 0.5, x1: FITTING.chairX + 0.5, z0: FITTING.chairZ - 0.5, z1: FITTING.chairZ + 0.5, name: 'poltrona' },
    { x0: FITTING.standX - 0.32, x1: FITTING.standX + 0.32, z0: FITTING.standZ - 0.32, z1: FITTING.standZ + 0.32, name: 'suporte do provador' },
    { x0: FITTING.x1 - 0.35, x1: FITTING.x1, z0: FITTING.z1, z1: FITTING.z0 - 0.4, name: 'cortina do provador' },
  ];
  for (const side of ['left', 'right'] as const) {
    const s = SIDE_SIGN[side];
    const cx = s * RAIL.x;
    list.push({ x0: Math.min(cx - RAIL.garmentHalf, cx + RAIL.garmentHalf), x1: Math.max(cx - RAIL.garmentHalf, cx + RAIL.garmentHalf), z0: RAIL.z1 - 0.3, z1: RAIL.z0 + 0.3, name: `arara ${side}` });
    list.push({ x0: Math.min(cx - 0.3, cx + 0.3), x1: Math.max(cx - 0.3, cx + 0.3), z0: SHELF.z1 - 0.1, z1: SHELF.z0 + 0.1, name: `banco ${side}` });
  }
  return list;
}

/** Pose de câmera fixa. `fov` é vertical, para 16:9. */
export interface Pose { id: string; pos: [number, number, number]; tgt: [number, number, number]; fov: number; label: string }
/** Seis poses fixas de aceite (docs/hero-pov/05). */
export const POSES: readonly Pose[] = [
  { id: '01', label: 'Fachada', pos: [0, 1.5, 9.2], tgt: [0, 2.05, 0], fov: 38 },
  { id: '02', label: 'Sala e araras', pos: [0, 1.3, 0.55], tgt: [0, 1.52, -18.2], fov: 50 },
  { id: '03', label: 'Arara direita', pos: [0.1, 1.32, -2.5], tgt: [3.0, 1.25, -7.4], fov: 50 },
  { id: '04', label: 'Provador', pos: [3.35, 1.42, -18.55], tgt: [2.15, 1.2, -22.2], fov: 50 },
  { id: '05', label: 'Arara esquerda', pos: [-0.75, 1.3, -2.9], tgt: [-2.9, 1.4, -7.9], fov: 50 },
  { id: '06', label: 'Porta por dentro', pos: [0, 1.45, -11.6], tgt: [0, 1.5, 0], fov: 50 },
];

/** Marcos projetáveis (x,y,z) com alvo em % da imagem (quadro 02). Tolerância inicial de 3 pp. */
export const LANDMARKS_02 = [
  { name: 'montante próximo esquerdo (topo)', p: [-RAIL.x, RAIL.y + 0.02, RAIL.z0] as [number, number, number], x: 12, y: 25 },
  { name: 'montante próximo direito (topo)', p: [RAIL.x, RAIL.y + 0.02, RAIL.z0] as [number, number, number], x: 89, y: 25 },
  { name: 'topo do arco do espelho', p: [BACK_MIRROR.x, 0.2 + BACK_MIRROR.h, ROOM.zBack] as [number, number, number], x: 48, y: 22 },
  { name: 'topo da cortina', p: [CURTAIN_ARCH.x, CURTAIN_ARCH.h, ROOM.zBack] as [number, number, number], x: 62, y: 24 },
  { name: 'base da parede do fundo', p: [0, 0, ROOM.zBack] as [number, number, number], x: 50, y: 61 },
];
