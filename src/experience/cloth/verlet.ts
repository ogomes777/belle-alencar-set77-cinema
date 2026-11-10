/**
 * Solver de tecido por integração de Verlet com restrições de distância
 * (estrutural, cisalhamento e dobra). Passo fixo, amortecimento e clamp
 * de velocidade para estabilidade (sem explosão, sem tremor em repouso).
 * Arrays planos (Float32Array) para não gerar lixo por frame.
 */
export interface Constraint {
  a: number;
  b: number;
  rest: number;
  k: number; // rigidez 0..1
}

export class VerletCloth {
  readonly count: number;
  pos: Float32Array;
  prev: Float32Array;
  acc: Float32Array;
  pinned: Uint8Array;
  constraints: Constraint[] = [];
  damping = 0.985;
  iterations = 6;
  maxStep = 0.08;

  constructor(count: number) {
    this.count = count;
    this.pos = new Float32Array(count * 3);
    this.prev = new Float32Array(count * 3);
    this.acc = new Float32Array(count * 3);
    this.pinned = new Uint8Array(count);
  }

  set(i: number, x: number, y: number, z: number): void {
    const k = i * 3;
    this.pos[k] = this.prev[k] = x;
    this.pos[k + 1] = this.prev[k + 1] = y;
    this.pos[k + 2] = this.prev[k + 2] = z;
  }

  link(a: number, b: number, k: number): void {
    const pa = a * 3;
    const pb = b * 3;
    const dx = this.pos[pb]! - this.pos[pa]!;
    const dy = this.pos[pb + 1]! - this.pos[pa + 1]!;
    const dz = this.pos[pb + 2]! - this.pos[pa + 2]!;
    this.constraints.push({ a, b, rest: Math.hypot(dx, dy, dz), k });
  }

  addForce(i: number, fx: number, fy: number, fz: number): void {
    const k = i * 3;
    this.acc[k] += fx;
    this.acc[k + 1] += fy;
    this.acc[k + 2] += fz;
  }

  /** Move um ponto fixo para um alvo (mantendo-o ancorado). */
  pin(i: number, x: number, y: number, z: number): void {
    const k = i * 3;
    this.prev[k] = this.pos[k]!;
    this.prev[k + 1] = this.pos[k + 1]!;
    this.prev[k + 2] = this.pos[k + 2]!;
    this.pos[k] = x;
    this.pos[k + 1] = y;
    this.pos[k + 2] = z;
  }

  integrate(dt: number): void {
    const { pos, prev, acc, pinned, damping, maxStep } = this;
    const dt2 = dt * dt;
    for (let i = 0; i < this.count; i++) {
      const k = i * 3;
      if (pinned[i]) {
        acc[k] = acc[k + 1] = acc[k + 2] = 0;
        continue;
      }
      for (let c = 0; c < 3; c++) {
        const p = pos[k + c]!;
        let v = (p - prev[k + c]!) * damping + acc[k + c]! * dt2;
        if (v > maxStep) v = maxStep;
        else if (v < -maxStep) v = -maxStep;
        prev[k + c] = p;
        pos[k + c] = p + v;
        acc[k + c] = 0;
      }
    }
  }

  satisfy(): void {
    const { pos, pinned, constraints } = this;
    const n = constraints.length;
    for (let c = 0; c < n; c++) {
      const s = constraints[c]!;
      const pa = s.a * 3;
      const pb = s.b * 3;
      const dx = pos[pb]! - pos[pa]!;
      const dy = pos[pb + 1]! - pos[pa + 1]!;
      const dz = pos[pb + 2]! - pos[pa + 2]!;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6;
      const diff = ((d - s.rest) / d) * s.k;
      const wa = pinned[s.a] ? 0 : 1;
      const wb = pinned[s.b] ? 0 : 1;
      const w = wa + wb;
      if (!w) continue;
      const fa = (diff * wa) / w;
      const fb = (diff * wb) / w;
      pos[pa] += dx * fa;
      pos[pa + 1] += dy * fa;
      pos[pa + 2] += dz * fa;
      pos[pb] -= dx * fb;
      pos[pb + 1] -= dy * fb;
      pos[pb + 2] -= dz * fb;
    }
  }
}
