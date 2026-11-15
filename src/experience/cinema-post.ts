/**
 * Pós-processamento de cinema (tier cinema e pôsteres): render HDR, bloom
 * sutil nos pontos de luz e no latão, e um passe final de lente com vinheta,
 * leve aberração cromática nas bordas e grão de filme. O tone mapping e o
 * espaço de cor ficam no OutputPass (AgX). No tier touch não é usado.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const LensShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uVignette: { value: 0.32 },
    uGrain: { value: 0.035 },
    uAberration: { value: 0.0016 },
    uWarm: { value: new THREE.Vector3(1.03, 1.0, 0.94) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uVignette; uniform float uGrain; uniform float uAberration; uniform vec3 uWarm;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 c = vUv - 0.5;
      float r2 = dot(c, c);
      vec2 off = c * uAberration * (0.4 + r2 * 3.0);
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + off).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - off).b;
      col *= uWarm;
      float v = smoothstep(0.85, 0.18, r2 * (1.0 + uVignette));
      col *= mix(1.0 - uVignette, 1.0, v);
      float g = hash(vUv * vec2(1931.0, 1373.0) + fract(uTime * 7.13)) - 0.5;
      col += g * uGrain * (0.6 + 0.4 * (1.0 - dot(col, vec3(0.333))));
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export interface CinemaPost {
  render(dt: number): void;
  setSize(w: number, h: number, dpr: number): void;
  dispose(): void;
}

export function createCinemaPost(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera): CinemaPost {
  const size = renderer.getSize(new THREE.Vector2());
  const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.14, 0.4, 0.96);
  composer.addPass(bloom);
  const lens = new ShaderPass(LensShader);
  composer.addPass(lens);
  composer.addPass(new OutputPass());
  let t = 0;
  return {
    render(dt) { t += dt; lens.uniforms.uTime!.value = t; composer.render(dt); },
    setSize(w, h, dpr) { composer.setPixelRatio(dpr); composer.setSize(w, h); bloom.setSize(w * dpr, h * dpr); },
    dispose() { composer.dispose(); target.dispose(); bloom.dispose(); },
  };
}
