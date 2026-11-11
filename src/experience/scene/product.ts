/**
 * Front-facing photographic displays for the supplied alpha product studies.
 * These are explicitly 2.5D display photographs, not reconstructed cloth/digital twins.
 * Optical bounds determine both size and the physical hanger/shelf contact point.
 */
import * as THREE from 'three';
import { productBySlug } from '../../commerce/catalog.demo';
import type { Product } from '../../commerce/types';
import type { Kit } from './kit';
import { box, contact } from './kit';

export function sceneProduct(slug: string): Product {
  const product = productBySlug(slug);
  if (!product?.cutout) throw new Error(`Scene product is missing its canonical alpha cutout: ${slug}`);
  return product;
}

export const DISPLAY_HEIGHT = {
  vestidos: 1.48, camisas: .72, croppeds: .38, saias: .72, calcas: 1.08,
  bolsas: .34, pulseiras: .105, aneis: .065,
} as const;

export function productDisplay(product: Product, height: number, anchor: 'top' | 'bottom' = 'bottom'): THREE.Group {
  const group = new THREE.Group();
  group.name = `product:${product.slug}`;
  group.userData.dynamic = true; // Async texture loading must not lose its geometry to static batching.
  group.userData.productId = product.id;
  group.userData.mediaReady = false;
  group.userData.mediaFailed = false;
  group.userData.mediaType = 'alpha-photograph-2.5d';
  const dimensions = product.cutoutSize ?? [600, 900];
  const raw = product.cutoutBounds ?? [0, 0, dimensions[0], dimensions[1]];
  const [l, t, r, b] = [raw[0]/dimensions[0], raw[1]/dimensions[1], raw[2]/dimensions[0], raw[3]/dimensions[1]];
  const canvasHeight = height / Math.max(.01, b - t);
  const canvasWidth = canvasHeight * dimensions[0] / dimensions[1];
  const material = new THREE.MeshStandardMaterial({
    // Cutout photos are opaque pixels + alpha discard, NOT blended transparent
    // sheets. A transparent render pass sorts intersecting dresses by object
    // center, causing front/back popping as the camera moves between walls.
    transparent: false, alphaTest: .22, alphaToCoverage: true,
    depthWrite: true, depthTest: true, side: THREE.DoubleSide,
    roughness: .82, metalness: 0, envMapIntensity: .18,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(canvasWidth, canvasHeight), material);
  // Align the opaque garment, rather than its transparent canvas, to the support.
  mesh.position.x = (.5 - (l + r) / 2) * canvasWidth;
  mesh.position.y = ((anchor === 'top' ? t : b) - .5) * canvasHeight;
  mesh.userData.productMedia = true;
  mesh.receiveShadow = true;
  mesh.visible = false;
  group.add(mesh);
  group.userData.displayHeight = height;
  group.userData.displayWidth = canvasWidth * (r - l);
  let disposed = false;
  material.addEventListener('dispose', () => { disposed = true; material.map?.dispose(); });
  group.userData.mediaPromise = new Promise<void>((resolve) => {
    new THREE.TextureLoader().load(product.cutout!, (texture) => {
      if (disposed) { texture.dispose(); resolve(); return; }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 2;
      material.map = texture;
      material.needsUpdate = true;
      mesh.visible = true;
      group.userData.mediaReady = true;
      resolve();
    }, undefined, () => { group.userData.mediaFailed = true; resolve(); });
  });
  return group;
}

/** Fine brushed-gold support; clips are used for waists, shoulder hangers for tops. */
export function displayHanger(kit: Kit, width: number, clipped = false): THREE.Group {
  const group = new THREE.Group();
  const hook = new THREE.Mesh(new THREE.TorusGeometry(.032, .004, 6, 16, Math.PI * 1.45), kit.brass);
  hook.rotation.z = -.35;
  hook.position.set(0, .057, 0);
  group.add(hook);
  if (clipped) {
    group.add(box(width, .014, .018, kit.brass, 0, .006));
    for (const x of [-width * .34, width * .34]) group.add(box(.025, .048, .024, kit.brass, x, -.012));
  } else {
    const points = [new THREE.Vector3(-width/2, -.055, 0), new THREE.Vector3(0, .035, 0), new THREE.Vector3(width/2, -.055, 0)];
    const shoulder = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 12, .005, 5, false), kit.brass);
    group.add(shoulder, box(width, .008, .01, kit.brass, 0, -.055));
  }
  return group;
}

/** Boutique display with a genuine 3D stand/shelf and a correctly scaled photo. */
export function supportedProduct(kit: Kit, slug: string, height: number, baseY: number, top = false): THREE.Group {
  const product = sceneProduct(slug), root = new THREE.Group();
  const clothing = ['vestidos','camisas','croppeds','saias','calcas'].includes(product.category);
  const photo = productDisplay(product, height, top ? 'top' : 'bottom');
  photo.position.y = baseY;
  root.add(photo);
  const width = photo.userData.displayWidth as number;
  if (clothing) {
    const topY = top ? baseY : baseY + height;
    const hanger = displayHanger(kit, Math.min(.45, Math.max(.25, width*.75)), product.category === 'saias' || product.category === 'calcas');
    hanger.position.set(0, topY + .018, -.025);
    root.add(hanger);
    // Support remains behind the garment and reaches the hook; nothing floats in an empty frame.
    const poleHeight = topY + .12;
    root.add(box(.012, poleHeight, .012, kit.brass, 0, poleHeight/2, -.085));
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(.14, .16, .035, 24), kit.brass);
    foot.position.set(0, .018, -.085); root.add(foot);
  } else {
    // Accessories are seated on shelves/pads, never suspended on clothing hangers.
    const padWidth = product.category === 'bolsas' ? Math.max(.38, width+.06) : Math.max(.16, width+.05);
    const pedestal = box(padWidth, baseY, product.category === 'bolsas' ? .28 : .16, kit.travertine, 0, baseY/2, -.018);
    pedestal.receiveShadow = true; root.add(pedestal);
  }
  root.add(contact(kit, Math.max(.2,width*.95), Math.max(.14,width*.42),0,-.035,.004));
  return root;
}

export function sceneProductReadiness(root: THREE.Object3D): { total: number; ready: number; failed: number } {
  let total=0,ready=0,failed=0;
  root.traverse(object => {
    if (!object.userData.productId) return;
    total++; if(object.userData.mediaReady)ready++; if(object.userData.mediaFailed)failed++;
  });
  return { total,ready,failed };
}

export function disposeProductDisplay(root: THREE.Object3D): void {
  root.traverse(object => {
    const mesh=object as THREE.Mesh;
    mesh.geometry?.dispose();
    if(mesh.userData.productMedia) {
      const material=mesh.material;
      if(Array.isArray(material))material.forEach(m=>m.dispose()); else material?.dispose();
    }
  });
  root.removeFromParent();
}

/** Static poster capture must wait for the actual alpha textures, not just a WebGL frame. */
export async function waitForSceneProducts(root: THREE.Object3D): Promise<void> {
  const promises: Promise<void>[]=[];
  root.traverse(object=>{
    if(object.userData.mediaPromise)promises.push(object.userData.mediaPromise as Promise<void>);
  });
  await Promise.all(promises);
}
