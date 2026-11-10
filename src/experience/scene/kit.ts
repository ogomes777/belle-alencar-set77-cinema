/** Materiais compartilhados e primitivas de cenografia. */
import * as THREE from 'three';
import * as T from '../textures';

export interface Kit {
  travertine: THREE.MeshStandardMaterial;
  stoneFloor: THREE.MeshStandardMaterial;
  oak: THREE.MeshStandardMaterial;
  plaster: THREE.MeshStandardMaterial;
  plasterWarm: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  velvet: THREE.MeshPhysicalMaterial;
  glass: THREE.ShaderMaterial;
  shadow: THREE.MeshBasicMaterial;
  light: THREE.MeshBasicMaterial;
  glowTex: THREE.Texture;
  weave: THREE.Texture;
  textures: THREE.Texture[];
}

export function createKit(): Kit {
  const trav = T.travertine();
  const stone = T.polishedStone();
  const oakTex = T.herringbone();
  const plas = T.plaster();
  const plasWarm = T.plaster(512, 8, '#eadcc6');
  const glowTex = T.glowPanel();
  const weave = T.weaveNormal();
  const shadowTex = T.contactShadow();

  const travertine = new THREE.MeshStandardMaterial({ map: trav, roughness: 0.78, metalness: 0 });
  const stoneFloor = new THREE.MeshStandardMaterial({ map: stone, roughness: 0.16, metalness: 0, envMapIntensity: 1.2 });
  const oak = new THREE.MeshStandardMaterial({ map: oakTex, roughness: 0.52, metalness: 0, envMapIntensity: 0.6 });
  const plaster = new THREE.MeshStandardMaterial({ map: plas, roughness: 0.92, metalness: 0 });
  const plasterWarm = new THREE.MeshStandardMaterial({ map: plasWarm, roughness: 0.9, metalness: 0 });
  const brass = new THREE.MeshStandardMaterial({ color: '#b8955a', roughness: 0.3, metalness: 1, envMapIntensity: 1.3 });
  const velvet = new THREE.MeshPhysicalMaterial({
    color: '#b79a76', roughness: 0.9, sheen: 1, sheenColor: new THREE.Color('#f4dfbd'), sheenRoughness: 0.5, side: THREE.DoubleSide,
  });
  const shadow = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, toneMapped: false });
  const light = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.94, 0.84).multiplyScalar(2.4) });

  return {
    travertine, stoneFloor, oak, plaster, plasterWarm, brass, velvet,
    glass: glassMaterial(), shadow, light, glowTex, weave,
    textures: [trav, stone, oakTex, plas, plasWarm, glowTex, weave, shadowTex],
  };
}

/**
 * Vidro com fresnel e reflexo "de ambiente" analítico (teto claro, piso escuro,
 * faixas diagonais que se movem com o ponto de vista). Barato e convincente,
 * sem passe de transmissão.
 */
export function glassMaterial(tint = '#dfe6e2', opacity = 0.07): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { uTint: { value: new THREE.Color(tint) }, uOpacity: { value: opacity } },
    vertexShader: /* glsl */ `
      varying vec3 vW; varying vec3 vN;
      void main(){
        vec4 w = modelMatrix * vec4(position,1.0);
        vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTint; uniform float uOpacity;
      varying vec3 vW; varying vec3 vN;
      void main(){
        vec3 V = normalize(vW - cameraPosition);
        vec3 N = normalize(vN); if (dot(V,N) > 0.0) N = -N;
        float fres = pow(1.0 - abs(dot(V, N)), 3.0);
        vec3 R = reflect(V, N);
        vec3 env = mix(vec3(0.52,0.47,0.41), vec3(1.0,0.97,0.92), smoothstep(-0.25, 0.55, R.y));
        float s1 = smoothstep(0.94, 1.0, sin((vW.x + vW.y * 0.55) * 1.6 + R.x * 2.6));
        float s2 = smoothstep(0.985, 1.0, sin((vW.x * 1.25 - vW.y * 0.35) * 4.2 + R.x * 3.4));
        float streak = s1 * 0.22 + s2 * 0.18;
        vec3 col = mix(uTint, env, 0.55 + fres * 0.4) + streak;
        float a = clamp(uOpacity + fres * 0.42 + streak * 0.55, 0.0, 0.8);
        gl_FragColor = vec4(col, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

export function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

/** Plano com UV em metros (textura repete a cada `tile` metros). */
export function plane(w: number, h: number, mat: THREE.Material, tile = 0): THREE.Mesh {
  const g = new THREE.PlaneGeometry(w, h);
  if (tile > 0) {
    const uv = g.getAttribute('uv') as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w / tile), uv.getY(i) * (h / tile));
  }
  return new THREE.Mesh(g, mat);
}

/** Contorno de arco (retângulo com topo semicircular). */
export function archPath(path: THREE.Path | THREE.Shape, w: number, h: number, x = 0, y = 0): void {
  const r = w / 2;
  path.moveTo(x - r, y);
  path.lineTo(x - r, y + h - r);
  path.absarc(x, y + h - r, r, Math.PI, 0, true);
  path.lineTo(x + r, y);
  path.lineTo(x - r, y);
}

/** Moldura de arco extrudada (anel), para nichos e espelho. */
export function archFrame(w: number, h: number, band: number, depth: number, mat: THREE.Material): THREE.Mesh {
  const outer = new THREE.Shape();
  archPath(outer, w + band * 2, h + band);
  const hole = new THREE.Path();
  const r = w / 2;
  hole.moveTo(r, 0);
  hole.lineTo(r, h - r);
  hole.absarc(0, h - r, r, 0, Math.PI, false);
  hole.lineTo(-r, 0);
  hole.lineTo(r, 0);
  outer.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(outer, { depth, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 32 });
  scaleUV(g, 0.5);
  return new THREE.Mesh(g, mat);
}

/** Painel em forma de arco (preenchimento do nicho / espelho). */
export function archPanel(w: number, h: number, mat: THREE.Material): THREE.Mesh {
  const s = new THREE.Shape();
  archPath(s, w, h);
  const g = new THREE.ShapeGeometry(s, 32);
  // UV 0..1 para gradientes
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, pos.getY(i) / h);
  return new THREE.Mesh(g, mat);
}

export function scaleUV(g: THREE.BufferGeometry, s: number): void {
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * s, uv.getY(i) * s);
}

export function contact(kit: Kit, w: number, d: number, x: number, z: number, y = 0.004): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), kit.shadow);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  m.renderOrder = 1;
  return m;
}

export function spot(
  color: THREE.ColorRepresentation,
  intensity: number,
  from: [number, number, number],
  to: [number, number, number],
  angle: number,
  penumbra = 0.7,
): THREE.SpotLight {
  const s = new THREE.SpotLight(color, intensity, 0, angle, penumbra, 2);
  s.position.set(...from);
  s.target.position.set(...to);
  return s;
}
