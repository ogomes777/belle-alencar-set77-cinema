/**
 * Navegação em primeira pessoa: colisão de cápsula contra caixas no piso e
 * rota por grafo de pontos de passagem. Puro (sem Three.js) para testes.
 * Contrato: docs/hero-pov/06_EXPLORACAO_360.md.
 */
import { buildObstacles, DESTINATIONS, FITTING, ROOM, WAYPOINTS, WALK_RADIUS, type Box, type DestinationId } from './scene/layout';

/** Dentro da planta navegável (salão ou provador)? */
export function insideStore(p: P2): boolean {
  const hall = Math.abs(p.x) < ROOM.x && p.z < ROOM.zFront && p.z > ROOM.zBack;
  const fitting = p.x > FITTING.x0 && p.x < FITTING.x1 && p.z <= ROOM.zBack && p.z > FITTING.z1;
  return hall || fitting;
}

export interface P2 { x: number; z: number }

export class Navigator {
  readonly obstacles: Box[];
  readonly radius: number;
  constructor(obstacles: Box[] = buildObstacles(), radius = WALK_RADIUS) {
    this.obstacles = obstacles;
    this.radius = radius;
  }

  /** Empurra um ponto para fora de todas as caixas (duas passagens para quinas). */
  resolve(p: P2): P2 {
    const out = { x: p.x, z: p.z };
    const r = this.radius;
    for (let pass = 0; pass < 3; pass++) {
      let moved = false;
      for (const b of this.obstacles) {
        const cx = Math.max(b.x0, Math.min(b.x1, out.x));
        const cz = Math.max(b.z0, Math.min(b.z1, out.z));
        const dx = out.x - cx;
        const dz = out.z - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= r * r) continue;
        moved = true;
        if (d2 > 1e-9) {
          // Fora da caixa: afasta ao longo da normal do ponto mais próximo.
          const d = Math.sqrt(d2);
          out.x = cx + (dx / d) * r;
          out.z = cz + (dz / d) * r;
        } else {
          // Centro dentro da caixa: sai pelo eixo de menor penetração.
          const left = out.x - b.x0, right = b.x1 - out.x, front = b.z1 - out.z, back = out.z - b.z0;
          const m = Math.min(left, right, front, back);
          if (m === left) out.x = b.x0 - r;
          else if (m === right) out.x = b.x1 + r;
          else if (m === front) out.z = b.z1 + r;
          else out.z = b.z0 - r;
        }
      }
      if (!moved) break;
    }
    return out;
  }

  /**
   * Move de `from` para `to` sem atravessar nada. Avanço incremental em
   * subpassos ≤ r/2 (sem tunelamento em taxa de quadros baixa); quando o
   * passo completo é bloqueado, tenta cada eixo separadamente (deslize).
   */
  move(from: P2, to: P2): P2 {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 1e-6) return this.resolve(from);
    const steps = Math.max(1, Math.ceil(dist / (this.radius * 0.5)));
    const sx = dx / steps, sz = dz / steps;
    const stepLen = Math.hypot(sx, sz);
    let cur = this.resolve(from);
    for (let i = 0; i < steps; i++) {
      const next = this.tryStep(cur, sx, sz, stepLen)
        ?? this.tryStep(cur, sx, 0, stepLen)
        ?? this.tryStep(cur, 0, sz, stepLen);
      if (!next) break;
      cur = next;
    }
    return cur;
  }

  /** Um subpasso válido: resolvido, livre e sem salto maior que o próprio passo. */
  private tryStep(cur: P2, sx: number, sz: number, stepLen: number): P2 | null {
    if (Math.abs(sx) < 1e-9 && Math.abs(sz) < 1e-9) return null;
    const candidate = this.resolve({ x: cur.x + sx, z: cur.z + sz });
    if (this.blocked(candidate)) return null;
    const travelled = Math.hypot(candidate.x - cur.x, candidate.z - cur.z);
    if (travelled > stepLen * 1.6 + 1e-6 || travelled < 1e-5) return null;
    return candidate;
  }

  /** O ponto colide com algo? */
  blocked(p: P2): boolean {
    const r = this.resolve(p);
    return Math.hypot(r.x - p.x, r.z - p.z) > 1e-4;
  }

  /** Segmento livre de colisão (amostrado). */
  clear(a: P2, b: P2): boolean {
    const n = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / (this.radius * 0.5)));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      if (this.blocked({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t })) return false;
    }
    return true;
  }

  /** Ponto navegável mais próximo (usado ao entrar na visita a partir de qualquer pose do filme). */
  nearestFree(p: P2): P2 {
    // Fora da loja (câmera ainda no shopping/vestíbulo): começa na entrada, por dentro.
    if (!insideStore(p)) return { x: DESTINATIONS.entrada.x, z: DESTINATIONS.entrada.z };
    const r = this.resolve(p);
    if (!this.blocked(r) && insideStore(r)) return r;
    let best = r, bestD = Infinity;
    for (const w of WAYPOINTS) {
      const d = Math.hypot(w.x - p.x, w.z - p.z);
      if (d < bestD) { bestD = d; best = { x: w.x, z: w.z }; }
    }
    return best;
  }

  /** Rota do ponto atual até um destino: caminho de pontos (sem o ponto inicial). */
  route(from: P2, to: DestinationId): P2[] {
    const target = DESTINATIONS[to];
    const goal = { x: target.x, z: target.z };
    if (this.clear(from, goal)) return [goal];
    // ponto de partida: waypoint visível mais próximo
    const byId = new Map(WAYPOINTS.map((w) => [w.id, w]));
    let start: string | null = null, startD = Infinity;
    for (const w of WAYPOINTS) {
      const d = Math.hypot(w.x - from.x, w.z - from.z);
      if (d < startD && this.clear(from, w)) { startD = d; start = w.id; }
    }
    if (!start) {
      for (const w of WAYPOINTS) {
        const d = Math.hypot(w.x - from.x, w.z - from.z);
        if (d < startD) { startD = d; start = w.id; }
      }
    }
    let end: string | null = null, endD = Infinity;
    for (const w of WAYPOINTS) {
      const d = Math.hypot(w.x - goal.x, w.z - goal.z);
      if (d < endD && this.clear(w, goal)) { endD = d; end = w.id; }
    }
    if (!start || !end) return [goal];
    // BFS no grafo
    const prev = new Map<string, string | null>([[start, null]]);
    const queue = [start];
    while (queue.length) {
      const id = queue.shift()!;
      if (id === end) break;
      for (const next of byId.get(id)!.links) {
        if (prev.has(next)) continue;
        prev.set(next, id);
        queue.push(next);
      }
    }
    if (!prev.has(end)) return [goal];
    const chain: P2[] = [];
    for (let id: string | null = end; id; id = prev.get(id) ?? null) {
      const w = byId.get(id)!;
      chain.unshift({ x: w.x, z: w.z });
    }
    // encurta: pula pontos que já são visíveis em linha reta
    const path: P2[] = [];
    let cursor = from;
    for (let i = 0; i < chain.length; i++) {
      const later = chain[i + 1];
      if (later && this.clear(cursor, later)) continue;
      path.push(chain[i]!);
      cursor = chain[i]!;
    }
    if (!path.length || Math.hypot(path[path.length - 1]!.x - goal.x, path[path.length - 1]!.z - goal.z) > 1e-3) path.push(goal);
    return path;
  }
}
