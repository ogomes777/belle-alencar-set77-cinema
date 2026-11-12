/** Belle Alencar V28 · truly solid BA monogram, 360° in WebGL.
 * Original monogram silhouette (not separate A and B, not a sprite).
 */
import { BA_FOIL_CONTOURS } from './ba-contours';
import '../styles/finale-solid-v28.css';

type Three = typeof import('three');
export function buildBAShape(THREE:Three):import('three').Shape {
  const polys=BA_FOIL_CONTOURS.map(poly=>poly.map(([x,y])=>
    new THREE.Vector2((x-627)/420,(627-y)/420)));
  const shell=[...polys[0]!];
  if(!THREE.ShapeUtils.isClockWise(shell))shell.reverse();
  const shape=new THREE.Shape(shell);
  shape.closePath();
  for(const original of polys.slice(1)){
    const hole=[...original];
    if(THREE.ShapeUtils.isClockWise(hole))hole.reverse();
    const path=new THREE.Path(hole);path.closePath();shape.holes.push(path);
  }
  return shape;
}
export function buildBASolid(THREE:Three):import('three').Group {
  const depth=.38,bevel=.036,shape=buildBAShape(THREE);
  const geometry=new THREE.ExtrudeGeometry(shape,{
    depth,steps:1,bevelEnabled:true,bevelSize:.028,bevelThickness:bevel,
    bevelSegments:3,curveSegments:3
  });
  geometry.translate(0,0,-depth/2);
  geometry.computeVertexNormals();
  const face=new THREE.MeshPhysicalMaterial({
    color:0xeac069,metalness:.54,roughness:.21,clearcoat:.65,clearcoatRoughness:.2,
    emissive:0x2a1704,emissiveIntensity:.13,side:THREE.DoubleSide
  });
  const edge=new THREE.MeshPhysicalMaterial({
    color:0xbc8533,metalness:.6,roughness:.25,clearcoat:.3,
    emissive:0x2a1809,emissiveIntensity:.1,side:THREE.DoubleSide
  });
  const solid=new THREE.Mesh(geometry,[face,edge]);
  solid.name='Belle BA · extruded front/back/sides';
  const group=new THREE.Group();
  group.add(solid);
  // The polished front is rigidly mounted to the physically thick silhouette.
  // It vanishes from the camera when the object turns to show its solid rear.
  const texture=new THREE.TextureLoader().load('/brand/belle-ba-foil-v28.svg');
  texture.colorSpace=THREE.SRGBColorSpace;
  const foilMaterial=new THREE.MeshBasicMaterial({
    map:texture,transparent:true,alphaTest:.04,depthWrite:false,
    side:THREE.FrontSide,toneMapped:false,opacity:.94
  });
  const foil=new THREE.Mesh(
    new THREE.PlaneGeometry(1254/420,1254/420),foilMaterial
  );
  foil.position.z=depth/2+bevel+.008;
  foil.name='Belle BA · metallic art face';
  group.add(foil);
  return group;
}

export function initFinaleSolid():void {
  const host=document.querySelector<HTMLElement>('[data-finale-solid]');
  if(!host)return;
  const canvas=host.querySelector<HTMLCanvasElement>('canvas');
  if(!canvas)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const isStill=()=>reduced.matches||document.documentElement.dataset.intensity==='essential';
  let active=true,visible=false,loading=false,ready=false,raf=0,last=0;
  let renderer:import('three').WebGLRenderer|undefined;
  let camera:import('three').PerspectiveCamera|undefined;
  let scene:import('three').Scene|undefined;
  let model:import('three').Group|undefined;
  let resize:ResizeObserver|undefined;
  const resources:{dispose():void}[]=[];
  const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=0;last=0;};
  const measure=()=>{
    if(!renderer||!camera)return;
    const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,w<560?1.35:1.65));
    renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.updateProjectionMatrix();
  };
  const draw=(now:number)=>{
    raf=0;
    if(!active||!visible||isStill()||document.hidden||!renderer||!camera||!scene||!model)return;
    const dt=last?Math.min(.045,(now-last)/1000):0;
    last=now;
    model.rotation.y=(model.rotation.y+dt*2*Math.PI/11.6)%(Math.PI*2);
    model.rotation.x=Math.sin(now*.00038)*.068;
    model.position.y=Math.sin(now*.001)*.016;
    renderer.render(scene,camera);
    if(!ready){ready=true;host.classList.add('is-3d-ready');}
    raf=requestAnimationFrame(draw);
  };
  const resume=()=>{
    if(!active)return;
    if(isStill()){stop();host.classList.remove('is-3d-ready');return;}
    if(document.hidden||!visible){stop();return;}
    if(!renderer&&!loading){void boot();return;}
    if(renderer&&!raf)raf=requestAnimationFrame(draw);
  };
  async function boot():Promise<void>{
    if(loading||renderer||isStill()||!active)return;
    loading=true;
    try {
      const THREE=await import('three');
      if(!active||isStill())return;
      renderer=new THREE.WebGLRenderer({
        canvas,alpha:true,antialias:true,powerPreference:'high-performance'
      });
      renderer.outputColorSpace=THREE.SRGBColorSpace;
      renderer.toneMapping=THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure=1.3;
      renderer.setClearColor(0,0);
      scene=new THREE.Scene();
      camera=new THREE.PerspectiveCamera(34,1,.1,40);
      camera.position.set(0,0,5.55);
      model=buildBASolid(THREE);
      model.rotation.y=-.07;
      scene.add(model);
      scene.add(new THREE.HemisphereLight(0xfff3d6,0x986a36,2.45));
      const key=new THREE.DirectionalLight(0xfff3d4,4.5);
      key.position.set(-3,5,6);scene.add(key);
      const sheen=new THREE.DirectionalLight(0xffd993,2.8);
      sheen.position.set(4,-2,5);scene.add(sheen);
      const back=new THREE.DirectionalLight(0xfff0bf,3.6);
      back.position.set(2,1,-7);scene.add(back);
      model.traverse(o=>{
        if(o instanceof THREE.Mesh){
          resources.push(o.geometry);
          for(const m of (Array.isArray(o.material)?o.material:[o.material])){
            resources.push(m);
            if('map' in m && m.map instanceof THREE.Texture)resources.push(m.map);
          }
        }
      });
      resize=new ResizeObserver(measure);
      resize.observe(host);measure();
      canvas.addEventListener('webglcontextlost',event=>{
        event.preventDefault();stop();host.classList.remove('is-3d-ready');
      },{passive:false});
      resume();
    }catch(error){
      console.warn('Belle BA: WebGL indisponível; imagem oficial mantida.',error);
      stop();host.classList.remove('is-3d-ready');
    }finally{loading=false;}
  }
  const observer=new IntersectionObserver(entries=>{
    visible=entries.some(e=>e.isIntersecting);
    if(!visible)stop();else resume();
  },{rootMargin:'200px 0px'});
  observer.observe(host);
  const mode=new MutationObserver(resume);
  mode.observe(document.documentElement,{attributes:true,attributeFilter:['data-intensity']});
  const visibility=()=>{if(document.hidden)stop();else resume();};
  document.addEventListener('visibilitychange',visibility);
  window.addEventListener('pageshow',resume);
  reduced.addEventListener?.('change',resume);
  window.addEventListener('pagehide',event=>{
    if(event.persisted){stop();return;}
    active=false;stop();observer.disconnect();mode.disconnect();resize?.disconnect();
    document.removeEventListener('visibilitychange',visibility);
    window.removeEventListener('pageshow',resume);
    reduced.removeEventListener?.('change',resume);
    resources.forEach(r=>r.dispose());
    renderer?.dispose();
  });
}
