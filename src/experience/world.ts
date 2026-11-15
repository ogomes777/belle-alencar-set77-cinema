/**
 * World · um renderer, uma cena, uma câmera.
 * Lê o progresso do filme (não controla o scroll), suaviza, posiciona câmera e
 * vestido, e renderiza somente quando o palco está visível e a aba ativa.
 * Governador de FPS reduz DPR e efeitos antes de desistir para os pôsteres.
 * Hero POV 360: a mesma câmera alterna, por mistura suave, entre o trilho do
 * filme e a visita em primeira pessoa (explore.ts); as araras são vivas por
 * categoria (rack-state.ts) e as seis poses de aceite são reproduzíveis.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { bakeStatic, createKit } from './scene/kit';
import { buildMall } from './scene/mall';
import { buildFacade } from './scene/facade';
import { buildBoutique, type PickHit } from './scene/boutique';
import { disposeProductTextures, sceneProductReadiness, waitForSceneProducts } from './scene/product';
import { DressRig } from './cloth/dress';
import { Story, type ChapterId, type Span } from './story';
import { Explorer, type ExploreInfo } from './explore';
import { FITTING, LANDMARKS_02, POSES, ROOM, type DestinationId, type Side } from './scene/layout';
import type { SidePlan } from './rack-state';
import type { Tier } from '../core/tier';
import type { DressParams } from '../core/dress';

export interface WorldOptions {
  container: HTMLElement;
  tier: Exclude<Tier, 'static'>;
  poster?: boolean;
  /** false desativa o governador de FPS (somente QA). */
  governor?: boolean;
  onFirstFrame?: () => void;
  onFail?: (reason: string) => void;
}

export interface WorldInfo {
  tier: string;
  dpr: number;
  frames: number;
  drawCalls: number;
  triangles: number;
  avgFrameMs: number;
  /** intervalo entre quadros: p50/p95 (ms) da janela recente */
  frameP50: number;
  frameP95: number;
  running: boolean;
  products: { total: number; ready: number; failed: number };
  progress: number;
  camera: number[];
  lookTarget: number[];
  explore: ExploreInfo;
  exploreBlend: number;
  sideLook: number;
  reflectors: boolean;
  shadows: boolean;
  pose: string | null;
}

export interface LandmarkResult { name: string; x: number; y: number; targetX: number; targetY: number; dx: number; dy: number }

const IN_STORE: ChapterId[] = ['sala', 'vestido', 'detalhe', 'categorias', 'provador'];

export class World {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private story = new Story();
  private dress: DressRig;
  private fittingProductId: string | null = null;
  private facade;
  private boutique;
  private mall;
  private target = 0;
  private shown = 0;
  private visible = true;
  private raf = 0;
  private last = 0;
  private frames = 0;
  private frameAvg = 16;
  private frameWindow: number[] = [];
  private slowFor = 0;
  private dpr: number;
  private shadows: boolean;
  private pointer: THREE.Vector2 | null = null;
  private pointerPrev = new THREE.Vector2();
  private pointerVel = 0;
  private camPos = new THREE.Vector3();
  private camTgt = new THREE.Vector3();
  private lookPos = new THREE.Vector3();
  private lookTgt = new THREE.Vector3();
  private prevCam = new THREE.Vector3();
  private userYaw = 0;
  private dressState = { pos: new THREE.Vector3(), yaw: 0, energy: 0, onRail: true, atFitting: false };
  private scrollEnergy = 0;
  private chapter: ChapterId = 'vitrine';
  /** Olhar lateral no capítulo "sala" (−1 arara esquerda · 0 centro · 1 arara direita). */
  private sideLook = 0;
  private sideLookGoal = 0;
  readonly explorer = new Explorer();
  private exploreBlend = 0;
  private exploreGoal = 0;
  private fixedPose: string | null = null;
  private railRested = false;
  private time = 0;
  private firstFrameSent = false;
  private failed = false;
  private resizeObs: ResizeObserver;
  private onVis = () => this.kick();
  private readonly pickPoint = new THREE.Vector2();
  private readonly projectPt = new THREE.Vector3();
  private readonly ePos = new THREE.Vector3();
  private readonly eTgt = new THREE.Vector3();
  private readonly fwd = new THREE.Vector3();

  constructor(private opts: WorldOptions) {
    const { tier, container } = opts;
    const device = navigator as Navigator & { deviceMemory?: number };
    const lessCapable = (device.deviceMemory !== undefined && device.deviceMemory <= 4) || (device.hardwareConcurrency || 4) <= 4;
    this.dpr = Math.min(window.devicePixelRatio || 1, opts.poster ? 2 : tier === 'cinema' ? (lessCapable ? 1.2 : 1.5) : 1);
    this.renderer = new THREE.WebGLRenderer({ antialias: tier === 'cinema' || !!opts.poster, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.poster });
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.98;
    this.shadows = tier === 'cinema' && !lessCapable;
    this.renderer.shadowMap.enabled = this.shadows;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.fail('webgl-context-lost');
    });

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.05, 90);
    this.scene.background = new THREE.Color('#e7ddcd');
    this.scene.fog = new THREE.Fog('#e7ddcd', 42, 120);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.46;
    pmrem.dispose();

    const kit = createKit();
    this.mall = buildMall(kit, tier, this.dpr, !!opts.poster);
    this.facade = buildFacade(kit, tier);
    this.boutique = buildBoutique(kit, tier, this.dpr);
    this.scene.add(this.mall.group, this.facade.group, this.boutique.group);
    bakeStatic(this.scene);

    const q = tier === 'cinema' || opts.poster ? { cols: 40, rows: 26, iterations: 7 } : { cols: 28, rows: 17, iterations: 5 };
    this.dress = new DressRig(q, kit.weave);
    this.dress.addTo(this.scene);

    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(container);
    this.resize();
    document.addEventListener('visibilitychange', this.onVis);
  }

  readyMedia(): Promise<void> { return waitForSceneProducts(this.scene); }
  /** Hero photographs must be decoded before switching off the facade poster. */
  readyEntranceMedia(): Promise<void> { return waitForSceneProducts(this.facade.group); }

  setSpans(spans: Span[]): void {
    this.story.setSpans(spans);
    this.kick();
  }

  setProgress(p: number, immediate = false): void {
    this.target = THREE.MathUtils.clamp(p, 0, 1);
    // A large chapter jump (fast wheel, PageUp, scrollbar grab or BFCache)
    // must not replay every missed chapter over several seconds.
    if (immediate || Math.abs(this.target - this.shown) > .16) this.shown = this.target;
    this.kick();
  }

  setDress(params: DressParams): void {
    this.fittingProductId = params.productId ?? null;
    this.boutique.setFittingProduct(this.fittingProductId);
    this.dress.setParams(params);
    this.dress.energy = Math.max(this.dress.energy, 0.8);
    this.kick();
  }

  // ---------- capítulo e olhar lateral (modo filme) ----------
  setChapter(id: ChapterId): void {
    if (id !== this.chapter) this.sideLookGoal = 0;
    this.chapter = id;
    this.kick();
  }
  /** A câmera está dentro da loja neste ponto do filme? */
  canExplore(): boolean {
    return IN_STORE.includes(this.chapter) || this.camPos.z < ROOM.zFront;
  }
  setSideLook(dir: -1 | 0 | 1): void { this.sideLookGoal = dir; this.kick(); }
  sideLookValue(): number { return this.sideLook; }

  /** Arraste normalizado (fração da largura/altura do palco). Filme: olhar lateral. Visita: yaw/pitch. */
  lookDelta(dx: number, dy: number): void {
    if (this.explorer.active) this.explorer.look(dx * 2.7, -dy * 1.9);
    else this.sideLookGoal = THREE.MathUtils.clamp(this.sideLookGoal + dx * 2.4, -1, 1);
    this.kick();
  }

  // ---------- visita em primeira pessoa ----------
  exploring(): boolean { return this.explorer.active; }
  enterExplore(): boolean {
    if (this.explorer.active) return true;
    this.explorer.enter(this.lookPos, this.lookTgt);
    this.exploreGoal = 1;
    this.kick();
    return true;
  }
  exitExplore(): void {
    if (!this.explorer.active) return;
    this.exploreGoal = 0;
    this.explorer.cancelRoute();
    this.explorer.clearKeys();
    this.kick();
  }
  goTo(id: DestinationId): void { if (this.explorer.active) { this.explorer.goTo(id); this.kick(); } }
  lookEntrance(): void { if (this.explorer.active) { this.explorer.lookEntrance(); this.kick(); } }
  lookCenter(): void {
    if (this.explorer.active) this.explorer.center(); else this.sideLookGoal = 0;
    this.kick();
  }
  setKey(code: string, down: boolean): void { if (this.explorer.active) { this.explorer.setKey(code, down); this.kick(); } }
  /** Vira para a arara de um lado (identidade física, independente da orientação atual). */
  faceSide(side: Side): void {
    if (this.explorer.active) { const f = this.boutique.railFocus(side); this.explorer.lookAt(f.x, f.z, -0.05); }
    else this.sideLookGoal = side === 'right' ? 1 : -1;
    this.kick();
  }

  // ---------- araras ----------
  applyPlan(side: Side, plan: SidePlan): void { this.boutique.applyPlan(side, plan); this.kick(); }
  pickRack(clientX: number, clientY: number): PickHit | null {
    this.toRay(clientX, clientY);
    const hit = this.boutique.pick(this.pickPoint, this.camera);
    this.kick();
    return hit;
  }
  hoverRack(clientX: number, clientY: number): PickHit | null {
    this.toRay(clientX, clientY);
    const hit = this.boutique.hover(this.pickPoint, this.camera);
    this.kick();
    return hit;
  }
  bagHit(clientX: number, clientY: number): boolean {
    this.toRay(clientX, clientY); return this.boutique.bagHit(this.pickPoint, this.camera);
  }
  selectRack(id: string | null): void { this.boutique.select(id); this.kick(); }
  hideRackProduct(id: string, hide: boolean): void { this.boutique.hideProduct(id, hide); this.kick(); }
  impactBag(): void { this.boutique.impactBag(); this.kick(); }
  private toRay(x: number, y: number): void {
    const r = this.opts.container.getBoundingClientRect();
    this.pickPoint.set((x - r.left) / Math.max(1, r.width) * 2 - 1, -((y - r.top) / Math.max(1, r.height) * 2 - 1));
  }
  private projectPoint(p: THREE.Vector3): { x: number; y: number; z: number } {
    this.projectPt.copy(p).project(this.camera);
    const r = this.opts.container.getBoundingClientRect();
    return { x: r.left + (this.projectPt.x + 1) * r.width / 2, y: r.top + (1 - this.projectPt.y) * r.height / 2, z: this.projectPt.z };
  }
  projectRackProduct(id: string): { x: number; y: number; w: number; h: number } | null {
    const item = this.boutique.productPosition(id); if (!item) return null;
    const a = this.projectPoint(item.position), b = this.projectPoint(item.position.clone().add(new THREE.Vector3(0, -item.height, 0)));
    if (a.z >= 1 || a.z <= -1) return null;
    const h = Math.max(42, Math.abs(b.y - a.y));
    const w = Math.max(28, h * item.width / Math.max(.1, item.height));
    return { x: a.x - w / 2, y: a.y, w, h };
  }
  projectBagMouth(): { x: number; y: number; w: number } {
    const point = this.boutique.bagPosition(), center = this.projectPoint(point);
    const edge = this.projectPoint(point.clone().add(new THREE.Vector3(this.boutique.bagWidth() / 2, 0, 0)));
    return { x: center.x, y: center.y, w: Math.max(22, Math.abs(edge.x - center.x) * 2) };
  }

  /** QA: renderiza um quadro e devolve PNG (independe de preserveDrawingBuffer). */
  snapshot(): string {
    this.step(0, true);
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  // ---------- QA: poses fixas e marcos ----------
  poseIds(): string[] { return POSES.map((p) => p.id); }
  setPose(id: string | null): boolean {
    if (id && !POSES.some((p) => p.id === id)) return false;
    this.fixedPose = id;
    this.kick();
    return true;
  }
  landmarks(): LandmarkResult[] {
    this.camera.updateMatrixWorld();
    return LANDMARKS_02.map((l) => {
      const v = new THREE.Vector3(...l.p).project(this.camera);
      const x = (v.x + 1) * 50, y = (1 - v.y) * 50;
      return { name: l.name, x: round1(x), y: round1(y), targetX: l.x, targetY: l.y, dx: round1(x - l.x), dy: round1(y - l.y) };
    });
  }

  /** ponteiro normalizado (-1..1) ou null quando sai. */
  setPointer(x: number | null, y = 0): void {
    if (x === null) { this.pointer = null; return; }
    if (!this.pointer) { this.pointer = new THREE.Vector2(x, y); this.pointerPrev.set(x, y); }
    this.pointer.set(x, y);
  }

  /** arraste horizontal no provador (pixels normalizados). */
  drag(dx: number): void {
    this.userYaw += dx * Math.PI * 1.6;
    this.dress.spin += -dx * 30;
    this.kick();
  }

  rotate(delta: number): void {
    this.userYaw += delta;
    this.dress.spin += -delta * 6;
    this.kick();
  }

  setVisible(v: boolean): void {
    if (this.visible === v) return;
    this.visible = v;
    if (!v) {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = 0;
      return;
    }
    // Re-entry from a long tab switch or another section must not consume
    // the missed time as an enormous cloth/camera physics step.
    this.last = performance.now();
    this.kick();
  }

  /** Prepara um quadro estável para pôster (sem animação pendente). */
  renderPoster(p: number): void {
    this.setProgress(p, true);
    this.step(0, true);
    this.dress.settle(2.2);
    for (let i = 0; i < 8; i++) this.step(1 / 60, true);
    this.renderer.render(this.scene, this.camera);
  }

  info(): WorldInfo {
    const r = this.renderer.info.render;
    const c = this.camera.position;
    const sorted = [...this.frameWindow].sort((a, b) => a - b);
    const q = (f: number) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * f))]! : 0);
    return {
      tier: this.opts.tier, dpr: this.dpr, frames: this.frames, drawCalls: r.calls, triangles: r.triangles,
      avgFrameMs: Math.round(this.frameAvg * 10) / 10, frameP50: round1(q(0.5)), frameP95: round1(q(0.95)),
      running: !!this.raf, products: sceneProductReadiness(this.scene), progress: Math.round(this.shown * 1000) / 1000,
      camera: [c.x, c.y, c.z].map((v) => Math.round(v * 100) / 100),
      lookTarget: [this.lookTgt.x, this.lookTgt.y, this.lookTgt.z].map((v) => Math.round(v * 100) / 100),
      explore: this.explorer.info(), exploreBlend: round1(this.exploreBlend), sideLook: round1(this.sideLook),
      reflectors: this.boutique.hasReflectors(), shadows: this.renderer.shadowMap.enabled, pose: this.fixedPose,
    };
  }

  private kick(): void {
    if (this.failed || this.opts.poster) return;
    if (this.raf || !this.visible || document.hidden) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  private loop = (now: number) => {
    this.raf = 0;
    if (!this.visible || document.hidden || this.failed) return;
    const elapsed = Math.max(1 / 240, Math.min(0.25, (now - this.last) / 1000 || 1 / 60));
    const dt = Math.min(.055, elapsed);
    this.last = now;
    this.step(dt, false);
    this.renderer.render(this.scene, this.camera);
    this.frames++;
    if (!this.firstFrameSent) {
      this.firstFrameSent = true;
      this.opts.onFirstFrame?.();
    }
    this.govern(elapsed);
    this.raf = requestAnimationFrame(this.loop);
  };

  private step(dt: number, exact: boolean): void {
    this.time += dt;
    const k = exact ? 1 : 1 - Math.exp(-dt * (this.opts.tier === 'cinema' ? 4.2 : 6));
    const before = this.shown;
    this.shown += (this.target - this.shown) * k;
    if (Math.abs(this.target - this.shown) < 1e-5) this.shown = this.target;
    const p = this.shown;
    const scrollSpeed = dt > 0 ? Math.abs(this.shown - before) / dt : 0;
    this.scrollEnergy += (Math.min(1, scrollSpeed * 18) - this.scrollEnergy) * Math.min(1, dt * 3);

    // ---- câmera do filme ----
    let fov = this.story.camera(p, this.camPos, this.camTgt);
    // olhar lateral no capítulo "sala": gira a direção do olhar em torno do olho
    const sala = this.story.span('sala');
    const lookStep = exact ? 1 : 1 - Math.exp(-dt * 4.2);
    this.sideLook += (this.sideLookGoal - this.sideLook) * lookStep;
    if (sala && Math.abs(this.sideLook) > 1e-3) {
      const length = Math.max(.0001, sala.e - sala.s);
      const inW = THREE.MathUtils.smoothstep(p, sala.s - length * 0.1, sala.s + length * .12);
      const outW = 1 - THREE.MathUtils.smoothstep(p, sala.e - length * .2, sala.e + length * 0.05);
      const w = THREE.MathUtils.clamp(inW * outW, 0, 1);
      if (w > 0) {
        this.fwd.subVectors(this.camTgt, this.camPos);
        const yaw = this.sideLook * 0.95 * w;
        const cos = Math.cos(yaw), sin = Math.sin(yaw);
        // yaw positivo gira para a direita (+x) quando se olha para −z
        const x = this.fwd.x * cos - this.fwd.z * sin;
        const z = this.fwd.x * sin + this.fwd.z * cos;
        this.fwd.x = x; this.fwd.z = z;
        this.camTgt.copy(this.camPos).add(this.fwd);
        // aproxima-se da arara escolhida (as peças ficam ao alcance do toque, também no celular)
        const reach = this.camera.aspect < 1 ? 1.0 : 0.6;
        this.camPos.x += this.sideLook * 0.45 * w;
        this.camTgt.x += this.sideLook * 0.45 * w;
        this.camPos.z -= Math.abs(this.sideLook) * w * reach * 2.2;
        this.camTgt.z -= Math.abs(this.sideLook) * w * reach * 2.2;
      }
    }
    if (!exact && this.opts.tier === 'cinema' && this.exploreBlend < 0.5) {
      const t = this.time;
      this.camPos.x += Math.sin(t * 0.63) * 0.006 + Math.sin(t * 1.7) * 0.002;
      this.camPos.y += Math.sin(t * 0.9 + 1) * 0.005;
      if (this.pointer) {
        this.camTgt.x += this.pointer.x * 0.2;
        this.camTgt.y += this.pointer.y * 0.11;
      }
    }
    // ---- visita em primeira pessoa ----
    const blendStep = exact ? 1 : Math.min(1, dt / 0.75);
    if (this.exploreGoal > this.exploreBlend) this.exploreBlend = Math.min(this.exploreGoal, this.exploreBlend + blendStep);
    else if (this.exploreGoal < this.exploreBlend) this.exploreBlend = Math.max(this.exploreGoal, this.exploreBlend - blendStep);
    if (this.explorer.active) {
      this.explorer.step(dt);
      this.explorer.pose(this.ePos, this.eTgt);
      const b = smooth(this.exploreBlend);
      this.camPos.lerp(this.ePos, b);
      this.camTgt.lerp(this.eTgt, b);
      fov = THREE.MathUtils.lerp(fov, 52, b);
      if (this.exploreGoal === 0 && this.exploreBlend === 0) this.explorer.exit();
    }
    // ---- pose fixa (QA) ----
    if (this.fixedPose) {
      const pose = POSES.find((x) => x.id === this.fixedPose)!;
      this.camPos.set(...pose.pos);
      this.camTgt.set(...pose.tgt);
      fov = pose.fov;
    }
    fov = this.fitFov(fov);
    const ck = exact || this.fixedPose ? 1 : 1 - Math.exp(-dt * 10);
    this.lookPos.lerp(this.camPos, ck);
    this.lookTgt.lerp(this.camTgt, ck);
    if (exact || this.frames === 0) { this.lookPos.copy(this.camPos); this.lookTgt.copy(this.camTgt); }
    this.camera.position.copy(this.lookPos);
    this.camera.lookAt(this.lookTgt);
    if (Math.abs(this.camera.fov - fov) > 0.01) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
    const camVel = dt > 0 ? this.prevCam.distanceTo(this.camera.position) / dt : 0;
    this.prevCam.copy(this.camera.position);

    // portas, cortina e visibilidade de efeitos caros
    this.facade.setDoors(this.fixedPose ? (this.fixedPose === '01' ? 0 : 1) : this.story.doors(p));
    if (this.mall.reflector) this.mall.reflector.visible = this.camera.position.z > -1.2;
    const curtain = Math.max(this.story.curtain(p), this.explorer.active ? this.explorer.curtainOpen() : 0, this.fixedPose === '04' ? 1 : 0);

    // vestido protagonista
    const d = this.dressState;
    this.story.dress(p, d);
    const cam = this.camera.position;
    const inFitting = cam.z < ROOM.zBack + 0.3 && cam.x > FITTING.x0;
    const fittingActive = inFitting || (cam.z < -14 && cam.x > 0.6 && this.fixedPose === '04');
    this.dress.group.visible = !(fittingActive && this.fittingProductId) && !(this.fixedPose && this.fixedPose !== '04');
    this.dress.skirt.visible = this.dress.group.visible;
    this.dress.group.position.copy(d.pos);
    const bob = d.onRail ? 0 : Math.sin(this.time * 1.1) * 0.012 * (0.4 + d.energy);
    this.dress.group.position.y += bob;
    const yaw = d.yaw + (d.atFitting ? this.userYaw : 0) + (d.onRail ? 0 : Math.sin(this.time * 0.35) * 0.08);
    this.dress.group.rotation.set(0, yaw, 0);
    const targetEnergy = Math.min(1, d.energy + this.scrollEnergy * 0.35);
    this.dress.energy += (targetEnergy - this.dress.energy) * Math.min(1, dt * 2.5);
    if (exact) this.dress.energy = d.energy;
    if (d.onRail) {
      if (!this.railRested || exact) this.dress.restPose();
      this.railRested = true;
    } else {
      this.railRested = false;
      this.dress.update(exact ? 1 / 60 : dt);
    }

    if (this.pointer) {
      this.pointerVel = this.pointer.distanceTo(this.pointerPrev);
      this.pointerPrev.copy(this.pointer);
    } else this.pointerVel = 0;

    // espelhos reais só quando estão à frente e perto o bastante
    this.camera.getWorldDirection(this.fwd);
    const backDist = Math.hypot(cam.x + 0.6, cam.z - ROOM.zBack);
    const backFacing = this.fwd.z < -0.15;
    const fitFacing = this.fwd.z < -0.1;
    const det = this.story.span('detalhe');
    this.boutique.update(Math.min(dt, 0.05), {
      camera: this.camera,
      camVel,
      pointer: this.pointer,
      pointerVel: this.pointerVel,
      fittingActive,
      heroOnRail: d.onRail,
      sweep: det && p > det.s - 0.03 && p < det.e + 0.03 ? this.story.local('detalhe', p) : -1,
      curtain,
      mirrorsLive: {
        back: cam.z > ROOM.zBack && backDist < 12 && backFacing,
        fitting: fitFacing && (inFitting || (cam.z < -15.5 && cam.x > 0.8)),
      },
    });
  }

  private govern(dt: number): void {
    if (this.opts.governor === false) return;
    this.frameAvg += (dt * 1000 - this.frameAvg) * 0.05;
    this.frameWindow.push(dt * 1000);
    if (this.frameWindow.length > 240) this.frameWindow.shift();
    if (this.frameAvg > 24) this.slowFor += dt;
    else this.slowFor = Math.max(0, this.slowFor - dt * 0.5);
    if (this.slowFor > 2) {
      this.slowFor = 0;
      // Ordem: reflexos e sombras primeiro, depois resolução. Controles e IDs permanecem.
      if (this.mall.reflector || this.boutique.hasReflectors()) {
        if (this.mall.reflector) this.mall.reflector.removeFromParent();
        this.mall.reflector = null;
        this.boutique.dropReflectors();
      } else if (this.renderer.shadowMap.enabled) {
        this.renderer.shadowMap.enabled = false;
      } else if (this.dpr > 0.85) {
        this.dpr = Math.max(0.65, this.dpr - 0.2);
        this.renderer.setPixelRatio(this.dpr);
        this.resize();
      } else {
        // A slow laptop is NOT a fatal renderer error: keep the scene alive.
        this.dpr = Math.max(.65, Math.min(this.dpr, .75));
        this.renderer.setPixelRatio(this.dpr);
        this.resize();
      }
    }
  }

  /** Em retrato, abre a lente para preservar o enquadramento horizontal da direção (base 1.35:1). */
  private fitFov(f: number): number {
    const a = this.camera.aspect;
    if (a >= 1.35) return f;
    const rad = THREE.MathUtils.degToRad(f);
    const h = 2 * Math.atan(Math.tan(rad / 2) * 1.35);
    const need = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(h / 2) / a));
    return Math.min(f * 1.75, need);
  }

  private resize(): void {
    const el = this.opts.container;
    const w = el.clientWidth || innerWidth;
    const h = el.clientHeight || innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // retrato: lens shift vertical — o assunto sobe para a metade livre acima da folha de texto
    if (w / h < 0.85) this.camera.setViewOffset(w, h, 0, Math.round(h * 0.17), w, h);
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
    this.kick();
  }

  private fail(reason: string): void {
    if (this.failed) return;
    this.failed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.opts.onFail?.(reason);
  }

  destroy(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.failed = true;
    document.removeEventListener('visibilitychange', this.onVis);
    this.resizeObs.disconnect();
    this.boutique.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose?.();
    });
    disposeProductTextures();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

function smooth(t: number): number { return t * t * (3 - 2 * t); }
function round1(v: number): number { return Math.round(v * 10) / 10; }
