/**
 * DressRig · vestido-estudo procedural com saia em física de tecido.
 * - Corpete rígido (Lathe) preso ao grupo.
 * - Saia simulada em ESPAÇO DE MUNDO (Verlet): a inércia aparece de graça
 *   quando o vestido sai da arara, voa e para no pódio/provador.
 * - "Corpo" invisível como colisor elíptico + memória de forma suave
 *   (anágua) para silhuetas estáveis; dobras emergem de vento e inércia.
 * NÃO é uma peça do acervo. Ver docs/DRESS_LIFE_3D.md (gate) e ASSETS_MISSING #4.
 */
import * as THREE from 'three';
import { VerletCloth } from './verlet';
import { SILHOUETTES, TONES, type DressParams, type Silhouette } from '../../core/dress';

const Z_RATIO = 0.78; // seção elíptica do corpo
const WAIST_R = 0.128;

/** Raio do corpo-colisor por altura local (y=0 cintura, negativo para baixo). */
export function bodyRadius(y: number): number {
  const d = -y;
  if (d <= 0) return WAIST_R * 0.96;
  if (d < 0.2) return WAIST_R + (0.172 - WAIST_R) * Math.sin((d / 0.2) * Math.PI * 0.5);
  if (d < 0.58) return 0.172 + (0.112 - 0.172) * ((d - 0.2) / 0.38);
  return Math.max(0.07, 0.112 + (0.074 - 0.112) * ((d - 0.58) / 0.47));
}

/** Raio de repouso da saia para a silhueta, v ∈ [0,1] da cintura à barra. */
export function restRadius(sil: Silhouette, v: number): number {
  const spec = SILHOUETTES[sil];
  const y = -v * spec.length;
  const body = bodyRadius(y) * 1.08;
  let r: number;
  if (sil === 'marcante') {
    const knee = 0.7;
    r = v < knee ? body : body + (spec.hem - body) * Math.pow((v - knee) / (1 - knee), 1.6);
  } else if (sil === 'classico') {
    r = WAIST_R + (spec.hem - WAIST_R) * Math.pow(v, 0.85);
  } else {
    r = WAIST_R + (spec.hem - WAIST_R) * Math.pow(v, 0.78);
  }
  return Math.max(r, body);
}

interface Quality {
  cols: number;
  rows: number;
  iterations: number;
}

export class DressRig {
  readonly group = new THREE.Group();
  readonly skirt: THREE.Mesh;
  readonly material: THREE.MeshPhysicalMaterial;
  private bodice: THREE.Group;
  private cloth!: VerletCloth;
  private cols = 0;
  private rows = 0;
  private geo!: THREE.BufferGeometry;
  private local: Float32Array = new Float32Array(0); // posições de repouso locais
  private restR: Float32Array = new Float32Array(0);
  private smooth: Float32Array = new Float32Array(0);
  private params: DressParams = { silhouette: 'fluido', tone: 'perola' };
  private acc = 0;
  private lastPin = new THREE.Vector3();
  private inv = new THREE.Matrix4();
  private v3 = new THREE.Vector3();
  private targetColor = new THREE.Color();
  private targetSheen = new THREE.Color();
  private memory = 1;
  private time = 0;
  /** 0 = em repouso; 1 = desperto/voando (sopro e vento) */
  energy = 0;
  /** vento global em m/s² (direção de mundo) */
  wind = new THREE.Vector3(0.6, 0, 0.3);
  /** impulso do usuário (arraste no provador) */
  spin = 0;
  /** semente das dobras (godês) — varia o caimento entre peças */
  foldSeed = 3;

  constructor(private quality: Quality, weave: THREE.Texture) {
    weave.repeat.set(26, 18);
    this.material = new THREE.MeshPhysicalMaterial({
      color: TONES.perola.base,
      roughness: 0.62,
      metalness: 0,
      sheen: 1,
      sheenColor: new THREE.Color(TONES.perola.sheen),
      sheenRoughness: 0.32,
      normalMap: weave,
      normalScale: new THREE.Vector2(0.45, 0.45),
      side: THREE.DoubleSide,
    });
    this.targetColor.set(TONES.perola.base);
    this.targetSheen.set(TONES.perola.sheen);
    this.bodice = this.buildBodice();
    this.group.add(this.bodice);
    this.skirt = new THREE.Mesh(new THREE.BufferGeometry(), this.material);
    this.skirt.frustumCulled = false;
    this.skirt.castShadow = true;
    this.skirt.receiveShadow = true;
    this.build(this.params.silhouette);
  }

  private buildBodice(): THREE.Group {
    const g = new THREE.Group();
    const profile = [
      [WAIST_R, 0],
      [0.138, 0.06],
      [0.156, 0.16],
      [0.163, 0.22],
      [0.155, 0.29],
      [0.142, 0.335],
      [0.136, 0.345],
    ].map(([r, y]) => new THREE.Vector2(r!, y!));
    const lathe = new THREE.LatheGeometry(profile, 40);
    lathe.scale(1, 1, Z_RATIO);
    const bodice = new THREE.Mesh(lathe, this.material);
    bodice.castShadow = true;
    g.add(bodice);
    // costura da cintura
    const seam = new THREE.Mesh(new THREE.TorusGeometry(WAIST_R + 0.002, 0.006, 6, 48), this.material);
    seam.rotation.x = Math.PI / 2;
    seam.scale.set(1, Z_RATIO, 1);
    g.add(seam);
    // alças
    for (const s of [-1, 1]) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.07 * s, 0.335, 0.105),
        new THREE.Vector3(0.088 * s, 0.47, 0.06),
        new THREE.Vector3(0.094 * s, 0.53, 0),
        new THREE.Vector3(0.088 * s, 0.47, -0.06),
        new THREE.Vector3(0.07 * s, 0.335, -0.1),
      ]);
      const strap = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.0055, 5, false), this.material);
      g.add(strap);
    }
    return g;
  }

  /** (Re)constrói a malha/simulação da saia para uma silhueta. */
  build(sil: Silhouette): void {
    const spec = SILHOUETTES[sil];
    const C = this.quality.cols;
    const R = this.quality.rows;
    this.cols = C;
    this.rows = R;
    const n = C * (R + 1);
    const cloth = new VerletCloth(n);
    cloth.iterations = this.quality.iterations;
    cloth.damping = 0.982;
    this.local = new Float32Array(n * 3);
    this.restR = new Float32Array(R + 1);
    this.group.updateMatrixWorld(true);
    const m = this.group.matrixWorld;
    for (let row = 0; row <= R; row++) {
      const v = row / R;
      const rr = row === 0 ? WAIST_R : restRadius(sil, v);
      this.restR[row] = rr;
      const y = -v * spec.length;
      // godês: ondulação da barra que cresce da cintura para baixo
      const folds = 6 + (this.foldSeed % 4);
      const amp = (sil === 'marcante' ? 0.03 + Math.max(0, v - 0.7) * 0.22 : 0.085) * v;
      for (let col = 0; col < C; col++) {
        const a = (col / C) * Math.PI * 2;
        const i = row * C + col;
        const fr = row === 0 ? 1 : 1 + amp * Math.sin(a * folds + this.foldSeed * 1.7) + amp * 0.45 * Math.sin(a * (folds * 2 + 1) - this.foldSeed);
        const lx = Math.sin(a) * rr * fr;
        const lz = Math.cos(a) * rr * Z_RATIO * fr;
        this.local[i * 3] = lx;
        this.local[i * 3 + 1] = y;
        this.local[i * 3 + 2] = lz;
        this.v3.set(lx, y, lz).applyMatrix4(m);
        cloth.set(i, this.v3.x, this.v3.y, this.v3.z);
        if (row === 0) cloth.pinned[i] = 1;
      }
    }
    const bend = 0.32 + spec.stiffness * 0.5;
    for (let row = 0; row <= R; row++) {
      for (let col = 0; col < C; col++) {
        const i = row * C + col;
        const right = row * C + ((col + 1) % C);
        cloth.link(i, right, 1);
        cloth.link(i, row * C + ((col + 2) % C), bend);
        if (row < R) {
          const down = (row + 1) * C + col;
          cloth.link(i, down, 1);
          cloth.link(i, (row + 1) * C + ((col + 1) % C), 0.6);
          cloth.link(right, down, 0.6);
          if (row < R - 1) cloth.link(i, (row + 2) * C + col, bend);
        }
      }
    }
    this.cloth = cloth;
    this.memory = 2.4 + spec.stiffness * 3.6;
    this.lastPin.set(this.cloth.pos[0]!, this.cloth.pos[1]!, this.cloth.pos[2]!);
    this.buildGeometry();
  }

  private buildGeometry(): void {
    const C = this.cols;
    const R = this.rows;
    const vc = (C + 1) * (R + 1);
    const pos = new Float32Array(vc * 3);
    const uv = new Float32Array(vc * 2);
    const idx: number[] = [];
    for (let row = 0; row <= R; row++) {
      for (let col = 0; col <= C; col++) {
        const k = row * (C + 1) + col;
        uv[k * 2] = col / C;
        uv[k * 2 + 1] = 1 - row / R;
        if (row < R && col < C) {
          const a = k;
          const b = k + 1;
          const c = k + C + 1;
          const d = c + 1;
          idx.push(a, c, b, b, c, d);
        }
      }
    }
    this.geo?.dispose();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(idx);
    this.geo = geo;
    this.skirt.geometry = geo;
    this.upload();
  }

  private upload(): void {
    const C = this.cols;
    const R = this.rows;
    const attr = this.geo.getAttribute('position') as THREE.BufferAttribute;
    const out = attr.array as Float32Array;
    const p = this.cloth.pos;
    for (let row = 0; row <= R; row++) {
      for (let col = 0; col <= C; col++) {
        const src = (row * C + (col % C)) * 3;
        const dst = (row * (C + 1) + col) * 3;
        out[dst] = p[src]!;
        out[dst + 1] = p[src + 1]!;
        out[dst + 2] = p[src + 2]!;
      }
    }
    // suavização laplaciana leve só na malha exibida (a simulação fica intacta)
    const sm = this.smooth.length === out.length ? this.smooth : (this.smooth = new Float32Array(out.length));
    sm.set(out);
    for (let row = 1; row < R; row++) {
      for (let col = 0; col <= C; col++) {
        const k = (row * (C + 1) + col) * 3;
        const l = (row * (C + 1) + (col === 0 ? C - 1 : col - 1)) * 3;
        const r = (row * (C + 1) + (col === C ? 1 : col + 1)) * 3;
        const u = k - (C + 1) * 3;
        const d = k + (C + 1) * 3;
        for (let c = 0; c < 3; c++) {
          out[k + c] = sm[k + c]! * 0.5 + (sm[l + c]! + sm[r + c]! + sm[u + c]! + sm[d + c]!) * 0.125;
        }
      }
    }
    attr.needsUpdate = true;
    this.geo.computeVertexNormals();
    // costura: média das normais nas colunas 0 e C para não marcar a emenda
    const nAttr = this.geo.getAttribute('normal') as THREE.BufferAttribute;
    const nn = nAttr.array as Float32Array;
    for (let row = 0; row <= R; row++) {
      const a = row * (C + 1) * 3;
      const b = (row * (C + 1) + C) * 3;
      for (let c = 0; c < 3; c++) {
        const m = (nn[a + c]! + nn[b + c]!) * 0.5;
        nn[a + c] = nn[b + c] = m;
      }
    }
    nAttr.needsUpdate = true;
  }

  setParams(next: DressParams): void {
    const silChanged = next.silhouette !== this.params.silhouette;
    this.params = { ...next };
    this.targetColor.set(TONES[next.tone].base);
    this.targetSheen.set(TONES[next.tone].sheen);
    if (silChanged) this.build(next.silhouette);
  }

  getParams(): DressParams {
    return this.params;
  }

  /**
   * Parked garment: reset the world-space cloth vertices AND their previous
   * Verlet positions to the same clean silhouette as the bodice.
   * This is essential when the hero returns to the hanger or a deep scroll
   * jump changes its transform: an old world-space skirt must never remain
   * at the previous camera location or fold onto itself.
   */
  restPose(): void {
    this.group.updateMatrixWorld(true);
    const m = this.group.matrixWorld;
    for (let i = 0; i < this.cloth.count; i++) {
      const k = i * 3;
      this.v3.set(this.local[k]!, this.local[k+1]!, this.local[k+2]!).applyMatrix4(m);
      this.cloth.set(i, this.v3.x, this.v3.y, this.v3.z);
    }
    this.acc = 0;
    this.spin = 0;
    this.upload();
  }

  /** Avança a simulação. dt em segundos (real). */
  update(dt: number): void {
    this.time += dt;
    this.material.color.lerp(this.targetColor, Math.min(1, dt * 4));
    this.material.sheenColor.lerp(this.targetSheen, Math.min(1, dt * 4));
    this.group.updateMatrixWorld(true);
    const step = 1 / 60;
    this.acc = Math.min(this.acc + dt, step * 3);
    let steps = 0;
    while (this.acc >= step && steps < 3) {
      this.step(step);
      this.acc -= step;
      steps++;
    }
    if (steps) this.upload();
  }

  private step(dt: number): void {
    const cloth = this.cloth;
    const C = this.cols;
    const R = this.rows;
    const m = this.group.matrixWorld;
    this.inv.copy(m).invert();
    const p = cloth.pos;
    const v3 = this.v3;

    // 1) teleporte: se a âncora saltou (scroll rápido/deep link), translada tudo
    v3.set(this.local[0]!, this.local[1]!, this.local[2]!).applyMatrix4(m);
    const jx = v3.x - p[0]!;
    const jy = v3.y - p[1]!;
    const jz = v3.z - p[2]!;
    if (jx * jx + jy * jy + jz * jz > 0.3 * 0.3) {
      for (let i = 0; i < cloth.count; i++) {
        const k = i * 3;
        p[k] = p[k]! + jx; p[k + 1] = p[k + 1]! + jy; p[k + 2] = p[k + 2]! + jz;
        cloth.prev[k] = cloth.prev[k]! + jx; cloth.prev[k + 1] = cloth.prev[k + 1]! + jy; cloth.prev[k + 2] = cloth.prev[k + 2]! + jz;
      }
    }

    // 2) âncoras da cintura seguem o grupo
    for (let col = 0; col < C; col++) {
      const k = col * 3;
      v3.set(this.local[k]!, this.local[k + 1]!, this.local[k + 2]!).applyMatrix4(m);
      cloth.pin(col, v3.x, v3.y, v3.z);
    }

    // 3) forças: gravidade, vento com ruído, sopro (energia), memória de forma
    const t = this.time;
    const e = this.energy;
    const gust = 0.55 + 0.45 * Math.sin(t * 0.9) * Math.sin(t * 0.37 + 1.3);
    const wx = this.wind.x * (0.35 + e * 1.4) * gust;
    const wz = this.wind.z * (0.35 + e * 1.4) * gust;
    const ox = m.elements[12]!;
    const oy = m.elements[13]!;
    const oz = m.elements[14]!;
    for (let row = 1; row <= R; row++) {
      const v = row / R;
      const rr = this.restR[row]!;
      for (let col = 0; col < C; col++) {
        const i = row * C + col;
        const k = i * 3;
        // posição local para forças radiais
        v3.set(p[k]!, p[k + 1]!, p[k + 2]!).applyMatrix4(this.inv);
        const a = (col / C) * Math.PI * 2;
        const lx = v3.x;
        const lz = v3.z / Z_RATIO;
        const d = Math.hypot(lx, lz) || 1e-5;
        const flutter = Math.sin(t * 2.3 + a * 3 + v * 5) * 0.5 + Math.sin(t * 3.7 - a * 2 + v * 9) * 0.3;
        const radial = (rr - d) * this.memory + e * v * (1.6 + flutter * 1.4);
        // direção radial em mundo (aprox. pela posição relativa à âncora)
        const rx = (p[k]! - ox);
        const rz = (p[k + 2]! - oz);
        const rl = Math.hypot(rx, rz) || 1e-5;
        const lift = e * v * v * (1.4 + flutter);
        cloth.addForce(
          i,
          (rx / rl) * radial + wx * v * (1 + flutter * 0.6),
          -9.8 * (1 - e * 0.55) + lift,
          (rz / rl) * radial + wz * v * (1 + flutter * 0.6),
        );
        // giro do usuário: arrasto tangencial na barra
        if (this.spin !== 0) {
          cloth.addForce(i, Math.cos(a) * this.spin * v * 2.5, 0, -Math.sin(a) * this.spin * v * 2.5);
        }
      }
    }
    void oy;

    cloth.integrate(dt);
    // restauração de forma (desfaz "nós" sem autocolisão): puxa cada ponto para a
    // silhueta desenhada, mais forte em repouso, quase nula quando o vestido voa.
    const restore = Math.min(0.2, (0.6 + 3.2 * (1 - e) * (1 - e)) * dt);
    for (let i = C; i < cloth.count; i++) {
      const k = i * 3;
      v3.set(this.local[k]!, this.local[k + 1]!, this.local[k + 2]!).applyMatrix4(m);
      p[k] = p[k]! + (v3.x - p[k]!) * restore;
      p[k + 1] = p[k + 1]! + (v3.y - p[k + 1]!) * restore;
      p[k + 2] = p[k + 2]! + (v3.z - p[k + 2]!) * restore;
    }
    for (let it = 0; it < cloth.iterations; it++) {
      cloth.satisfy();
      if (it % 2 === 1 || it === cloth.iterations - 1) this.collide();
    }
    this.spin *= 0.9;
  }

  /** Mantém a saia fora do corpo invisível (elipse por altura). */
  private collide(): void {
    const cloth = this.cloth;
    const p = cloth.pos;
    const m = this.group.matrixWorld;
    const v3 = this.v3;
    for (let i = this.cols; i < cloth.count; i++) {
      const k = i * 3;
      v3.set(p[k]!, p[k + 1]!, p[k + 2]!).applyMatrix4(this.inv);
      const r = bodyRadius(Math.min(0, v3.y));
      const ex = v3.x / r;
      const ez = v3.z / (r * Z_RATIO);
      const q = ex * ex + ez * ez;
      if (q < 1 && v3.y < 0.02 && v3.y > -1.2) {
        const s = 1 / Math.sqrt(q || 1e-6);
        v3.x *= s;
        v3.z *= s;
        v3.applyMatrix4(m);
        p[k] = v3.x;
        p[k + 1] = v3.y;
        p[k + 2] = v3.z;
      }
    }
  }

  /** Pré-assenta a simulação (posters / troca de silhueta sem "pop"). */
  settle(seconds = 1.2): void {
    const steps = Math.round(seconds * 60);
    this.group.updateMatrixWorld(true);
    for (let s = 0; s < steps; s++) {
      this.time += 1 / 60;
      this.step(1 / 60);
    }
    this.upload();
  }

  addTo(scene: THREE.Object3D): void {
    scene.add(this.group);
    scene.add(this.skirt);
  }

  dispose(): void {
    this.geo.dispose();
    this.material.dispose();
  }
}

/**
 * Vestido estático (arara/vitrine): mesma linguagem do DressRig,
 * dobras assadas na geometria. Barato para instanciar.
 */
export function staticDressGeometry(sil: Silhouette, seed = 1): THREE.BufferGeometry {
  const spec = SILHOUETTES[sil];
  const C = 36;
  const R = 14;
  const folds = 7 + (seed % 4);
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let row = 0; row <= R; row++) {
    const v = row / R;
    const base = row === 0 ? WAIST_R : restRadius(sil, v) * (0.9 - 0.1 * v * (1 - spec.stiffness));
    for (let col = 0; col <= C; col++) {
      const a = (col / C) * Math.PI * 2;
      const fold = 1 + Math.sin(a * folds + seed) * 0.07 * v + Math.sin(a * (folds + 3) - seed) * 0.03 * v;
      const r = base * fold;
      pos.push(Math.sin(a) * r, -v * spec.length * 0.985, Math.cos(a) * r * Z_RATIO);
      uv.push(col / C, 1 - v);
      if (row < R && col < C) {
        const k = row * (C + 1) + col;
        idx.push(k, k + C + 1, k + 1, k + 1, k + C + 1, k + C + 2);
      }
    }
  }
  const skirt = new THREE.BufferGeometry();
  skirt.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  skirt.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  skirt.setIndex(idx);
  const profile = [
    [WAIST_R, 0],
    [0.138, 0.06],
    [0.156, 0.16],
    [0.163, 0.22],
    [0.155, 0.29],
    [0.142, 0.335],
  ].map(([r, y]) => new THREE.Vector2(r!, y!));
  const bodice = new THREE.LatheGeometry(profile, 24);
  bodice.scale(1, 1, Z_RATIO);
  bodice.deleteAttribute('normal');
  skirt.computeVertexNormals();
  bodice.computeVertexNormals();
  return mergeSimple([skirt, bodice]);
}

/** Mescla geometrias indexadas com os mesmos atributos (position, normal, uv). */
export function mergeSimple(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const out = new THREE.BufferGeometry();
  const attrs = ['position', 'normal', 'uv'] as const;
  const data: Record<string, number[]> = { position: [], normal: [], uv: [] };
  const index: number[] = [];
  let offset = 0;
  for (const g of geos) {
    const gi = g.index ? g.toNonIndexed() : g;
    if (!gi.getAttribute('normal')) gi.computeVertexNormals();
    for (const a of attrs) {
      const at = gi.getAttribute(a);
      if (at) data[a]!.push(...Array.from(at.array as ArrayLike<number>));
    }
    const count = gi.getAttribute('position').count;
    for (let i = 0; i < count; i++) index.push(offset + i);
    offset += count;
  }
  out.setAttribute('position', new THREE.Float32BufferAttribute(data.position!, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(data.normal!, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(data.uv!, 2));
  out.setIndex(index);
  return out;
}
