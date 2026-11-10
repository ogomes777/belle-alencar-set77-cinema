/**
 * FERRAMENTA INTERNA (não vai para produção): renderiza recortes de vestidos do
 * estudo 3D com fundo transparente para a arara, a ficha e o voo até a bolsa.
 * Uso: /tools/sprite.html?sil=fluido&tone=perola  → window.__spriteReady = true
 * Enquadramento fixo para todos (escala física coerente entre peças).
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { DressRig } from '../src/experience/cloth/dress';
import { weaveNormal } from '../src/experience/textures';
import type { Silhouette, Tone } from '../src/core/dress';

declare global { interface Window { __spriteReady?: boolean } }

const q = new URLSearchParams(location.search);
const sil = (q.get('sil') ?? 'fluido') as Silhouette;
const tone = (q.get('tone') ?? 'perola') as Tone;
const W = Number(q.get('w') ?? 720);
const H = Number(q.get('h') ?? 1200);
const seed = Number(q.get('seed') ?? 3);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.getElementById('host')!.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

// luz de estúdio de boutique: chave quente alta à esquerda, preenchimento, recorte
scene.add(new THREE.HemisphereLight('#fff6ea', '#b9a586', 1.15));
const key = new THREE.DirectionalLight('#ffe8c8', 2.4); key.position.set(-1.6, 2.4, 2.6); scene.add(key);
const fill = new THREE.DirectionalLight('#f3efe8', 0.8); fill.position.set(2.2, 0.6, 1.8); scene.add(fill);
const rim = new THREE.DirectionalLight('#fff1d6', 1.4); rim.position.set(0.4, 1.6, -2.4); scene.add(rim);

// câmera fixa: gancho no topo, barra do longo fluido perto do pé
const cam = new THREE.PerspectiveCamera(17, W / H, 0.1, 50);
cam.position.set(0, -0.22, 7.1);
cam.lookAt(0, -0.22, 0);

const dress = new DressRig({ cols: 56, rows: 30, iterations: 9 }, weaveNormal());
dress.foldSeed = seed;
dress.addTo(scene);
dress.setParams({ silhouette: sil, tone });
dress.build(sil);
dress.material.color.set(dress.material.color); // força tom final

// cabide de latão: gancho + pescoço + ombros (contato com as alças)
const brass = new THREE.MeshStandardMaterial({ color: '#c09a5b', metalness: 1, roughness: 0.28, envMapIntensity: 1.4 });
const tube = (pts: THREE.Vector3[], r = 0.0065) =>
  new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, r, 8, false), brass);
const hook: THREE.Vector3[] = [];
for (let i = 0; i <= 20; i++) {
  const a = Math.PI * 1.15 * (i / 20) - Math.PI * 0.1;
  hook.push(new THREE.Vector3(Math.cos(a) * 0.035 - 0.035, 0.705 + Math.sin(a) * 0.035, 0));
}
const hanger = new THREE.Group();
hanger.add(tube([...hook, new THREE.Vector3(-0.07, 0.69, 0), new THREE.Vector3(-0.004, 0.64, 0), new THREE.Vector3(0, 0.6, 0)]));
hanger.add(tube([new THREE.Vector3(0, 0.6, 0), new THREE.Vector3(-0.12, 0.565, 0.004), new THREE.Vector3(-0.215, 0.525, 0.01), new THREE.Vector3(-0.2, 0.515, 0.01), new THREE.Vector3(0, 0.515, 0.012), new THREE.Vector3(0.2, 0.515, 0.01), new THREE.Vector3(0.215, 0.525, 0.01), new THREE.Vector3(0.12, 0.565, 0.004), new THREE.Vector3(0, 0.6, 0)], 0.007));
scene.add(hanger);

// assentamento físico: leve brisa para dobras assimétricas, depois repouso
let s = seed;
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
dress.wind.set(0.5 + rnd() * 0.6, 0, 0.3 + rnd() * 0.5);
dress.energy = 0.22;
dress.group.rotation.y = (rnd() - 0.5) * 0.25;
dress.settle(2.0);
dress.energy = 0.06;
dress.settle(1.6);
dress.material.color.set(dress.material.color);
for (let i = 0; i < 90; i++) dress.update(1 / 60);
renderer.render(scene, cam);
window.__spriteReady = true;
