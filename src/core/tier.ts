/** Detecção de capacidade → tier de motion. Ver docs/IMPLEMENTATION_PLAN.md §3. */
import { readJSON, writeJSON } from './storage';

export type Tier = 'cinema' | 'touch' | 'static';
export type Intensity = 'cinema' | 'essential';

export interface Capabilities {
  reducedMotion: boolean;
  saveData: boolean;
  coarse: boolean;
  small: boolean;
  webgl2: boolean;
  cores: number;
  memory: number | null;
}

export function detectCapabilities(): Capabilities {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  let webgl2 = false;
  try {
    const c = document.createElement('canvas');
    webgl2 = !!c.getContext('webgl2');
  } catch {
    webgl2 = false;
  }
  return {
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: !!nav.connection?.saveData,
    coarse: matchMedia('(pointer: coarse)').matches,
    small: matchMedia('(max-width: 899px)').matches,
    webgl2,
    cores: nav.hardwareConcurrency || 4,
    memory: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null,
  };
}

export function resolveTier(c: Capabilities, intensity: Intensity, forced?: string | null): Tier {
  if (forced === 'cinema' || forced === 'touch' || forced === 'static') return forced;
  if (intensity === 'essential' || c.reducedMotion || c.saveData || !c.webgl2) return 'static';
  // On devices with fewer than four CPU cores, constructing the 3D scene can
  // cause long main-thread stalls. Preserve cinematic posters and navigation.
  if (c.cores < 4 || (c.memory !== null && c.memory < 3)) return 'static';
  if (c.coarse || c.small || (c.memory !== null && c.memory < 4)) return 'touch';
  return 'cinema';
}

export function loadIntensity(): Intensity {
  const v = readJSON<string>('intensity', 'cinema');
  return v === 'essential' ? 'essential' : 'cinema';
}

export function saveIntensity(v: Intensity): void {
  writeJSON('intensity', v);
}
