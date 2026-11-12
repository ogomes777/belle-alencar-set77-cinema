/**
 * World · um renderer, uma cena, uma câmera.
 * Lê o progresso do filme (não controla o scroll), suaviza, posiciona câmera e
 * vestido, e renderiza somente quando o palco está visível e a aba ativa.
 * Governador de FPS reduz DPR e efeitos antes de desistir para os pôsteres.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { bakeStatic, createKit } from './scene/kit';
import { buildMall } from './scene/mall';
import { buildFacade } from './scene/facade';
import { buildBoutique } from './scene/boutique';
import { sceneProductReadiness, waitForSceneProducts } from './scene/product';
import { DressRig } from './cloth/dress';
import { Story, type Span } from './story';
import type { Tier } from '../core/tier';
import type { DressParams } from '../core/dress';
import type { Product } from '../commerce/types';

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
  running: boolean;
  products: { total: number; ready: number; failed: number };
  progress: number;
  camera: number[];
  rail: {index:number;total:number};
  lookTarget: number[];
  orbit: {current:number;target:number;free:boolean};
}

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
  private slowFor = 0;
  private dpr: number;
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
  private railEngaged = false;
  private railPan = 0;
  private railPanGoal = 0;
  private roomOrbit = 1;
  private roomOrbitGoal = 1;
  private roomOrbitManual = false;
  // Suaviza a troca entre a parede direita e esquerda sem teletransportar
  // a câmera ou perder o ponto de vista da boutique.
  private roomFocus = new THREE.Vector3();
  private roomFocusReady = false;
  private railRested = false;
  private time = 0;
  private firstFrameSent = false;
  private failed = false;
  private resizeObs: ResizeObserver;
  private onVis = () => this.kick();
  private readonly pickPoint = new THREE.Vector2();
  private readonly projectPt = new THREE.Vector3();

  constructor(private opts: WorldOptions) {
    const { tier, container } = opts;
    const device = navigator as Navigator & {deviceMemory?:number};
    const lessCapable = (device.deviceMemory !== undefined && device.deviceMemory <= 4) || (device.hardwareConcurrency||4)<=4;
    this.dpr = Math.min(window.devicePixelRatio || 1, opts.poster ? 2 : tier === 'cinema' ? (lessCapable ? 1.2 : 1.5) : 1);
    this.renderer = new THREE.WebGLRenderer({ antialias: tier === 'cinema' || !!opts.poster, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.poster });
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.renderer.shadowMap.enabled = tier === 'cinema' && !lessCapable;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.fail('webgl-context-lost');
    });

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.05, 90);
    this.scene.background = new THREE.Color('#e7ddcd');
    this.scene.fog = new THREE.Fog('#e7ddcd', 24, 64);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.5;
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
    // Small changes still preserve smooth scrubbing.
    if(immediate || Math.abs(this.target-this.shown)>.16)this.shown=this.target;
    this.kick();
  }

  setDress(params: DressParams): void {
    this.fittingProductId = params.productId ?? null;
    this.boutique.setProduct(this.fittingProductId);
    this.dress.setParams(params);
    this.dress.energy = Math.max(this.dress.energy, 0.8);
    this.kick();
  }

  setRailEngaged(on:boolean):void{
    if(this.railEngaged!==on){
      this.roomFocusReady=false;
      this.roomOrbitManual=false;
      this.roomOrbitGoal=this.boutique.focusPoint().x>=0?1:-1;
      this.roomOrbit=this.roomOrbitGoal;
    }
    this.railEngaged=on;
    if(!on)this.railPanGoal=0;
  }
  setRailPointer(normalizedX:number|null):void{
    this.railPanGoal=THREE.MathUtils.clamp(normalizedX??0,-1,1);
    this.kick();
  }
  /** Drag on EMPTY floor/space is a first-person view rotation, independent
   * from the selected product. This is how visitors can reach the opposite wall.
   * Horizontal gestures do not change native vertical scroll progression. */
  orbitRail(deltaNormalized:number):void{
    if(!this.railEngaged)return;
    if(!this.roomOrbitManual){
      this.roomOrbitGoal=this.roomFocusReady?THREE.MathUtils.clamp(this.roomFocus.x/4.72,-1,1):
        (this.boutique.focusPoint().x>=0?1:-1);
      this.roomOrbitManual=true;
    }
    this.roomOrbitGoal=THREE.MathUtils.clamp(this.roomOrbitGoal+deltaNormalized*2.65,-1,1);
    this.kick();
  }
  /** A discreet, accessible companion to the first-person drag on touch. */
  lookAcrossRail():void {
    this.roomOrbitGoal=this.roomOrbitGoal>=0?-1:1;
    this.roomOrbitManual=true;
    this.kick();
  }
  /** Explicit selection hands control back to the physical hanger focus. */
  private followRailSelection():void{
    this.roomOrbitGoal=this.boutique.focusPoint().x>=0?1:-1;
    this.roomOrbitManual=false;
    this.kick();
  }
  railPosition(){return this.boutique.railPosition();}
  /** Smoothly prepare the physical rack for a purchase when the customer
   * navigates a long distance faster than the camera can travel.
   * No extra scene is created. Scroll keeps ownership of the chapter. */
  prepareRackPurchase(id:string):void {
    this.boutique.select(id);
    this.roomFocus.copy(this.boutique.focusPoint());
    this.roomFocusReady=true;
    this.followRailSelection();
    this.railPanGoal=0;
    this.kick();
  }

  /** Produtos sempre pertencem à arara interna, nunca a uma interface 2D separada. */
  browseRack(direction:number):Product|null {
    const product=this.boutique.browse(direction);
    this.followRailSelection();
    return product;
  }
  activeRackProduct():Product|null{return this.boutique.activeProduct();}
  pickRack(clientX:number,clientY:number):Product|null {
    this.toRay(clientX,clientY);
    const p=this.boutique.pick(this.pickPoint,this.camera);
    if(p)this.followRailSelection();
    this.kick();return p;
  }
  hoverRack(clientX:number,clientY:number):Product|null{
    this.toRay(clientX,clientY);
    const p=this.boutique.hover(this.pickPoint,this.camera);
    this.kick();return p;
  }
  bagHit(clientX:number,clientY:number):boolean {
    this.toRay(clientX,clientY);return this.boutique.bagHit(this.pickPoint,this.camera);
  }
  selectRack(id:string|null):void{this.boutique.select(id);this.kick();}
  hideRackProduct(id:string,hide:boolean):void{this.boutique.hideProduct(id,hide);this.kick();}
  impactBag():void{this.boutique.impactBag();this.kick();}
  private toRay(x:number,y:number):void {
    const r=this.opts.container.getBoundingClientRect();
    this.pickPoint.set((x-r.left)/Math.max(1,r.width)*2-1,-((y-r.top)/Math.max(1,r.height)*2-1));
  }
  private projectPoint(p:THREE.Vector3):{x:number;y:number;z:number} {
    this.projectPt.copy(p).project(this.camera);
    const r=this.opts.container.getBoundingClientRect();
    return {x:r.left+(this.projectPt.x+1)*r.width/2,y:r.top+(1-this.projectPt.y)*r.height/2,z:this.projectPt.z};
  }
  projectRackProduct(id:string):{x:number;y:number;w:number;h:number}|null {
    const item=this.boutique.productPosition(id);if(!item)return null;
    const a=this.projectPoint(item.position),b=this.projectPoint(item.position.clone().add(new THREE.Vector3(0,-item.height,0)));
    if(a.z>=1||a.z<=-1)return null;
    const h=Math.max(42,Math.abs(b.y-a.y));
    const w=Math.max(28,h*item.width/Math.max(.1,item.height));
    return {x:a.x-w/2,y:a.y,w,h};
  }
  projectBagMouth():{x:number;y:number;w:number} {
    const point=this.boutique.bagPosition(),center=this.projectPoint(point);
    const edge=this.projectPoint(point.clone().add(new THREE.Vector3(this.boutique.bagWidth()/2,0,0)));
    return {x:center.x,y:center.y,w:Math.max(22,Math.abs(edge.x-center.x)*2)};
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
      if(this.raf)cancelAnimationFrame(this.raf);
      this.raf=0;
      return;
    }
    // Re-entry from a long tab switch or another section must not consume
    // the missed time as an enormous cloth/camera physics step.
    this.last=performance.now();
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
    return { tier: this.opts.tier, dpr: this.dpr, frames: this.frames, drawCalls: r.calls, triangles: r.triangles, avgFrameMs: Math.round(this.frameAvg * 10) / 10, running: !!this.raf, products: sceneProductReadiness(this.scene), progress: Math.round(this.shown * 1000) / 1000, camera: [c.x, c.y, c.z].map((v) => Math.round(v * 100) / 100), rail: this.boutique.railPosition(), lookTarget: [this.lookTgt.x,this.lookTgt.y,this.lookTgt.z].map(v=>Math.round(v*100)/100),
      orbit: {current:+this.roomOrbit.toFixed(3),target:+this.roomOrbitGoal.toFixed(3),free:this.roomOrbitManual} };
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
    // dt real (até 250 ms) para a suavização não "atrasar" em GPU lenta;
    // a física usa passo fixo e as molas recebem dt limitado.
    const elapsed = Math.max(1 / 240, Math.min(0.25, (now - this.last) / 1000 || 1 / 60));
    const dt=Math.min(.055,elapsed);
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
    // progresso suavizado (equivalente a um scrub com inércia)
    const k = exact ? 1 : 1 - Math.exp(-dt * (this.opts.tier === 'cinema' ? 4.2 : 6));
    const before = this.shown;
    this.shown += (this.target - this.shown) * k;
    if (Math.abs(this.target - this.shown) < 1e-5) this.shown = this.target;
    const p = this.shown;
    const scrollSpeed = dt > 0 ? Math.abs(this.shown - before) / dt : 0;
    this.scrollEnergy += (Math.min(1, scrollSpeed * 18) - this.scrollEnergy) * Math.min(1, dt * 3);

    // câmera
    const fov=this.fitFov(this.story.camera(p,this.camPos,this.camTgt));
    // In-room first-person orbit: horizontal gestures explore the garments,
    // while vertical progress still owns the chapter transition.
    const sala=this.story.span('sala');
    const railStep = exact ? 1 : Math.min(1, dt * 6);
    this.railPan+=(this.railPanGoal-this.railPan)*railStep;
    const orbitStep=exact?1:1-Math.exp(-dt*3.65);
    this.roomOrbit+=(this.roomOrbitGoal-this.roomOrbit)*orbitStep;
    if(this.railEngaged && sala && p>=sala.s-.02 && p<=sala.e+.02){
      const point=this.boutique.focusPoint();
      if(!this.roomFocusReady){this.roomFocus.copy(this.camTgt);this.roomFocusReady=true;}
      // O alvo acompanha a arara com amortecimento, inclusive ao cruzar de parede.
      const focusStep=exact?1:1-Math.exp(-dt*3.0);
      this.roomFocus.lerp(point,focusStep);
      // Entradas e saídas da cena mantêm continuidade com o travelling do filme.
      const length=Math.max(.0001,sala.e-sala.s);
      const inWeight=THREE.MathUtils.smoothstep(p,sala.s,sala.s+length*.17);
      const outWeight=1-THREE.MathUtils.smoothstep(p,sala.e-length*.17,sala.e);
      const blend=THREE.MathUtils.clamp(inWeight*outWeight,0,1);
      // The panoramic look can be independent of selection while dragging.
      // Keep the eye near the CENTRAL aisle. Never teleport to a separate rail.
      const aimX=this.roomOrbitManual
        ?THREE.MathUtils.lerp(this.roomFocus.x,this.roomOrbit*4.72,.95)
        :this.roomFocus.x;
      const side=aimX>=0?1:-1;
      const camX=this.roomOrbitManual?-.32*this.roomOrbit:(side>0?-.65:.65);
      const camZ=THREE.MathUtils.clamp(this.roomFocus.z+3.25,-8.2,-2.9);
      this.camPos.x=THREE.MathUtils.lerp(this.camPos.x,camX,.34*blend);
      this.camPos.z=THREE.MathUtils.lerp(this.camPos.z,camZ,.54*blend);
      this.camTgt.x=THREE.MathUtils.lerp(this.camTgt.x,aimX+this.railPan*1.34,.78*blend);
      this.camTgt.y=THREE.MathUtils.lerp(this.camTgt.y,1.38,.54*blend);
      this.camTgt.z=THREE.MathUtils.lerp(this.camTgt.z,
        this.roomFocus.z-this.railPan*.75*side,.72*blend);
    } else this.roomFocusReady=false;
    if (!exact && this.opts.tier === 'cinema') {
      // câmera na mão, quase imperceptível (respiração do operador)
      const t = this.time;
      this.camPos.x += Math.sin(t * 0.63) * 0.006 + Math.sin(t * 1.7) * 0.002;
      this.camPos.y += Math.sin(t * 0.9 + 1) * 0.005;
      if (this.pointer) {
        this.camTgt.x += this.pointer.x * 0.22;
        this.camTgt.y += this.pointer.y * 0.12;
      }
    }
    const ck = exact ? 1 : 1 - Math.exp(-dt * 10);
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

    // portas e visibilidade de efeitos caros
    this.facade.setDoors(this.story.doors(p));
    if (this.mall.reflector) this.mall.reflector.visible = this.camera.position.z > -1.2;

    // vestido
    const d = this.dressState;
    this.story.dress(p, d);
    const inFitting = this.camera.position.z < -10.5 && this.camera.position.x > 1.5;
    this.dress.group.visible = !(inFitting && this.fittingProductId);
    this.dress.skirt.visible = this.dress.group.visible;
    this.dress.group.position.copy(d.pos);
    const bob = d.onRail ? 0 : Math.sin(this.time * 1.1) * 0.012 * (0.4 + d.energy);
    this.dress.group.position.y += bob;
    const yaw = d.yaw + (d.atFitting ? this.userYaw : 0) + (d.onRail ? 0 : Math.sin(this.time * 0.35) * 0.08);
    this.dress.group.rotation.set(0, yaw, 0);
    const targetEnergy = Math.min(1, d.energy + this.scrollEnergy * 0.35);
    this.dress.energy += (targetEnergy - this.dress.energy) * Math.min(1, dt * 2.5);
    if (exact) this.dress.energy = d.energy;
    // A simulated skirt stores vertices in WORLD coordinates, separately from
    // the bodice group. A frozen skirt at an old position causes the broken,
    // folded white dress on re-entry. Snap cleanly while hung, simulate only in flight.
    if(d.onRail){
      if(!this.railRested||exact)this.dress.restPose();
      this.railRested=true;
    } else {
      this.railRested=false;
      this.dress.update(exact ? 1/60 : dt);
    }

    // ponteiro
    if (this.pointer) {
      this.pointerVel = this.pointer.distanceTo(this.pointerPrev);
      this.pointerPrev.copy(this.pointer);
    } else this.pointerVel = 0;

    this.boutique.update(Math.min(dt, 0.05), {
      camera: this.camera,
      camVel,
      pointer: this.pointer,
      pointerVel: this.pointerVel,
      archFocus: this.story.archFocus(p, this.camera.position.x),
      fittingActive: this.camera.position.z < -10.5 && this.camera.position.x > 1.5,
      heroOnRail: d.onRail,
      sweep: this.story.span('detalhe') && p > this.story.span('detalhe')!.s - 0.03 && p < this.story.span('detalhe')!.e + 0.03 ? this.story.local('detalhe', p) : -1,
    });
  }

  private govern(dt: number): void {
    if (this.opts.governor === false) return;
    this.frameAvg += (dt * 1000 - this.frameAvg) * 0.05;
    if (this.frameAvg > 24) this.slowFor += dt;
    else this.slowFor = Math.max(0, this.slowFor - dt * 0.5);
    if (this.slowFor > 2) {
      this.slowFor = 0;
      if (this.dpr > 0.85) {
        this.dpr = Math.max(0.65, this.dpr - 0.2);
        this.renderer.setPixelRatio(this.dpr);
        this.resize();
      } else if (this.mall.reflector || this.boutique.mirror) {
        if (this.mall.reflector) this.mall.reflector.removeFromParent();
        if (this.boutique.mirror) this.boutique.mirror.removeFromParent();
        this.mall.reflector = null;
        this.boutique.mirror = null;
      } else {
        // A slow laptop is NOT a fatal renderer error. Previously this branch
        // permanently destroyed WebGL during a long session or scroll return.
        // Keep the scene alive with reduced render cost and preserve controls.
        this.renderer.shadowMap.enabled=false;
        this.dpr=Math.max(.65,Math.min(this.dpr,.75));
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
    // Story.step() always recomputes FOV from the authored lens value.
    // Reapplying fitFov(camera.fov) here compounded portrait zoom on resizes.
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
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose?.();
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
