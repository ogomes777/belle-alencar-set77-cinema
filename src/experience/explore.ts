/**
 * Visita em primeira pessoa ("Explorar a loja"): olhar 360° sem limite de
 * revolução, pitch limitado, caminhada com colisão (nav.ts) e destinos
 * físicos com rota pelo grafo da planta. Sem pointer lock, giroscópio ou
 * fullscreen. Contrato: docs/hero-pov/06_EXPLORACAO_360.md.
 */
import * as THREE from 'three';
import { insideStore, Navigator, type P2 } from './nav';
import { CURTAIN_ARCH, DESTINATIONS, DOOR, EYE, FITTING, ROOM, type DestinationId } from './scene/layout';

const PITCH_LIMIT = THREE.MathUtils.degToRad(35);
const WALK_SPEED = 1.45; // m/s
const TURN_RATE = 5.2;   // rad/s (suavização para alvos de olhar)

export interface ExploreInfo {
  active: boolean; x: number; z: number; yaw: number; pitch: number;
  walking: boolean; destination: DestinationId | null; inFitting: boolean;
}

export class Explorer {
  active = false;
  x = 0;
  z = -2.4;
  /** yaw em radianos, 0 = olhando para o fundo da loja (−z); positivo gira para a direita. Acumula sem wrap. */
  yaw = 0;
  pitch = 0;
  readonly nav = new Navigator();
  private yawTarget: number | null = null;
  private pitchTarget: number | null = null;
  private route: P2[] = [];
  private destination: DestinationId | null = null;
  private keys = new Set<string>();
  private readonly fwd = new THREE.Vector3();

  /** Entra na visita a partir da pose atual do filme. */
  enter(pos: THREE.Vector3, tgt: THREE.Vector3): void {
    const inside = insideStore({ x: pos.x, z: pos.z });
    const start = this.nav.nearestFree({ x: pos.x, z: pos.z });
    this.x = start.x;
    this.z = start.z;
    if (inside) {
      const dx = tgt.x - pos.x, dz = tgt.z - pos.z, dy = tgt.y - pos.y;
      this.yaw = Math.atan2(dx, -dz);
      this.pitch = THREE.MathUtils.clamp(Math.atan2(dy, Math.hypot(dx, dz)), -PITCH_LIMIT, PITCH_LIMIT);
    } else {
      // câmera ainda chegando pelo filme: olha para dentro do salão
      this.yaw = 0;
      this.pitch = 0;
    }
    this.yawTarget = null;
    this.pitchTarget = null;
    this.route = [];
    this.destination = null;
    this.keys.clear();
    this.active = true;
  }

  exit(): void {
    this.active = false;
    this.route = [];
    this.destination = null;
    this.keys.clear();
  }

  /** Olhar livre (arraste): cancela alvos e rotas de olhar. */
  look(dYaw: number, dPitch: number): void {
    this.yaw += dYaw;
    this.pitch = THREE.MathUtils.clamp(this.pitch + dPitch, -PITCH_LIMIT, PITCH_LIMIT);
    this.yawTarget = null;
    this.pitchTarget = null;
  }

  /** Vira para um ponto do piso pelo menor caminho angular. */
  lookAt(x: number, z: number, pitch = 0): void {
    const goal = Math.atan2(x - this.x, -(z - this.z));
    this.yawTarget = this.yaw + wrap(goal - this.yaw);
    this.pitchTarget = THREE.MathUtils.clamp(pitch, -PITCH_LIMIT, PITCH_LIMIT);
  }

  /** "Ver a entrada": olha para a porta pelo lado interno. */
  lookEntrance(): void { this.lookAt(0, DOOR.z, 0.02); }
  /** "Centralizar visão": corredor (ou espelho do provador). */
  center(): void {
    if (this.inFitting()) this.lookAt(FITTING.mirrorX, FITTING.z1, 0);
    else { this.yawTarget = this.yaw + wrap(0 - this.yaw); this.pitchTarget = 0; }
  }

  goTo(id: DestinationId): void {
    this.destination = id;
    this.route = this.nav.route({ x: this.x, z: this.z }, id);
    this.pitchTarget = 0;
  }
  cancelRoute(): void { this.route = []; this.destination = null; }

  setKey(code: string, down: boolean): void {
    if (down) this.keys.add(code); else this.keys.delete(code);
    if (down) this.cancelRoute();
  }
  clearKeys(): void { this.keys.clear(); }

  step(dt: number): void {
    if (!this.active) return;
    // rota até um destino físico
    if (this.route.length) {
      const next = this.route[0]!;
      const dx = next.x - this.x, dz = next.z - this.z;
      const dist = Math.hypot(dx, dz);
      const stepLen = WALK_SPEED * dt;
      if (dist <= stepLen + 1e-4) {
        this.x = next.x; this.z = next.z;
        this.route.shift();
        if (!this.route.length && this.destination) {
          const d = DESTINATIONS[this.destination];
          this.lookAt(d.lookX, d.lookZ, 0);
          this.destination = null;
        }
      } else {
        const moved = this.nav.move({ x: this.x, z: this.z }, { x: this.x + (dx / dist) * stepLen, z: this.z + (dz / dist) * stepLen });
        if (Math.hypot(moved.x - this.x, moved.z - this.z) < stepLen * 0.2) {
          // preso: recalcula a rota uma vez, depois desiste sem travar o visitante
          if (this.destination) this.route = this.nav.route({ x: this.x, z: this.z }, this.destination);
          else this.route = [];
        } else {
          this.x = moved.x; this.z = moved.z;
          // olha na direção do deslocamento (sem forçar quando o usuário arrasta)
          const goal = Math.atan2(dx, -dz);
          if (this.yawTarget === null || this.destination) this.yawTarget = this.yaw + wrap(goal - this.yaw);
        }
      }
    } else if (this.keys.size) {
      // deslocamento manual relativo ao olhar
      let f = 0, s = 0;
      if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) f += 1;
      if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) f -= 1;
      if (this.keys.has('KeyD')) s += 1;
      if (this.keys.has('KeyA')) s -= 1;
      if (this.keys.has('ArrowRight')) this.yaw += 1.6 * dt;
      if (this.keys.has('ArrowLeft')) this.yaw -= 1.6 * dt;
      if (f || s) {
        const len = Math.hypot(f, s);
        const fx = Math.sin(this.yaw), fz = -Math.cos(this.yaw);
        const rx = Math.cos(this.yaw), rz = Math.sin(this.yaw);
        const stepLen = WALK_SPEED * dt;
        const moved = this.nav.move({ x: this.x, z: this.z }, {
          x: this.x + ((fx * f + rx * s) / len) * stepLen,
          z: this.z + ((fz * f + rz * s) / len) * stepLen,
        });
        this.x = moved.x; this.z = moved.z;
      }
    }
    // suavização dos alvos de olhar
    if (this.yawTarget !== null) {
      const d = this.yawTarget - this.yaw;
      const k = 1 - Math.exp(-dt * TURN_RATE);
      this.yaw += d * k;
      if (Math.abs(d) < 0.002) { this.yaw = this.yawTarget; this.yawTarget = null; }
    }
    if (this.pitchTarget !== null) {
      const d = this.pitchTarget - this.pitch;
      this.pitch += d * (1 - Math.exp(-dt * TURN_RATE));
      if (Math.abs(d) < 0.002) { this.pitch = this.pitchTarget; this.pitchTarget = null; }
    }
  }

  /** Pose de câmera (olho à altura humana). */
  pose(outPos: THREE.Vector3, outTgt: THREE.Vector3): void {
    outPos.set(this.x, EYE, this.z);
    this.fwd.set(Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), -Math.cos(this.yaw) * Math.cos(this.pitch));
    outTgt.copy(outPos).addScaledVector(this.fwd, 4);
  }

  inFitting(): boolean { return this.z < ROOM.zBack && this.x > FITTING.x0; }
  walking(): boolean { return this.route.length > 0 || this.keys.size > 0; }
  /** A cortina do provador abre quando o visitante se aproxima do arco. */
  curtainOpen(): number {
    const d = Math.hypot(this.x - CURTAIN_ARCH.x, this.z - ROOM.zBack);
    return THREE.MathUtils.clamp(1 - (d - 0.9) / 1.6, 0, 1);
  }
  info(): ExploreInfo {
    return { active: this.active, x: round(this.x), z: round(this.z), yaw: round(this.yaw), pitch: round(this.pitch), walking: this.walking(), destination: this.destination, inFitting: this.inFitting() };
  }
}

function wrap(a: number): number { return Math.atan2(Math.sin(a), Math.cos(a)); }
function round(v: number): number { return Math.round(v * 1000) / 1000; }
