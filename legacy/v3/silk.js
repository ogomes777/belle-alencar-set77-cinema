
/* Abstract silk study rendered in 3D, not an actual photographed dress. */
const stage=document.getElementById('silkStage'),canvas=document.getElementById('silkCanvas');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,save=!!navigator.connection?.saveData,weak=!!(navigator.deviceMemory&&navigator.deviceMemory<=2);
const presets={perola:{c:[.82,.72,.59],light:[1,.95,.85],energy:.7},champagne:{c:[.72,.53,.36],light:[.98,.81,.57],energy:1.1},noite:{c:[.26,.23,.25],light:[.68,.55,.48],energy:.85}};
let active='perola',setPreset=null;
document.querySelectorAll('[data-silk]').forEach(b=>b.addEventListener('click',()=>{active=b.dataset.silk;document.querySelectorAll('[data-silk]').forEach(x=>{x.classList.toggle('is-active',x===b);x.setAttribute('aria-pressed',String(x===b))});if(setPreset)setPreset(active);else stage.style.filter=active==='noite'?'brightness(.74)':'none'}));
if(stage&&canvas&&!reduced&&!save&&!weak){
 try{
 const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js');
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(1.5,devicePixelRatio||1));
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(33,1,.1,100);camera.position.z=9;
 const uniforms={uTime:{value:0},uEnergy:{value:.7},uBase:{value:new THREE.Vector3(...presets.perola.c)},uLight:{value:new THREE.Vector3(...presets.perola.light)}};
 const vertex=[
 'uniform float uTime; uniform float uEnergy; varying vec2 vUv;',
 'void main(){ vUv=uv; vec3 p=position; p.z+=(sin(p.x*2.6+uTime*.48)*.28+sin(p.y*2.3-uTime*.32+p.x)*.23)*uEnergy;',
 'p.z+=sin(p.x*7.5+p.y*.8+uTime*.21)*.06; p.x+=sin(p.y*1.7+uTime*.23)*.14;',
 'gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }'
 ].join('\n');
 const fragment=[
 'precision highp float; uniform vec3 uBase; uniform vec3 uLight; uniform float uTime; varying vec2 vUv;',
 'void main(){float w=sin(vUv.x*26.0+sin(vUv.y*9.0+uTime*.3)*1.6);',
 'float folds=sin(vUv.x*48.0+vUv.y*4.0); float shine=pow(max(0.0,w*.5+.5),4.0);',
 'vec3 col=mix(uBase,uLight,clamp(.35+.39*w+.13*folds+.22*shine,0.0,1.0));',
 'col*=.76+.27*vUv.y; float edge=smoothstep(0.0,.02,vUv.x)*smoothstep(0.0,.02,1.0-vUv.x)*smoothstep(0.0,.02,vUv.y)*smoothstep(0.0,.02,1.0-vUv.y);',
 'gl_FragColor=vec4(col,edge);}'
 ].join('\n');
 const material=new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:fragment,side:THREE.DoubleSide,transparent:true,depthWrite:false});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(3.7,5.2,70,85),material);scene.add(mesh);mesh.rotation.z=-.08;
 const resize=()=>{let w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.render(scene,camera)};
 const ro=new ResizeObserver(resize);ro.observe(stage);resize();
 let visible=false,raf=0,last=0,px=0,py=0;
 const animate=t=>{raf=0;if(!visible||document.hidden)return;const dt=Math.min(.05,(t-last)/1000||.016);last=t;uniforms.uTime.value+=dt;mesh.rotation.y+=(px*.12-mesh.rotation.y)*.04;mesh.rotation.x+=(py*.08-mesh.rotation.x)*.04;renderer.render(scene,camera);raf=requestAnimationFrame(animate)};
 const start=()=>{if(visible&&!document.hidden&&!raf){last=0;raf=requestAnimationFrame(animate)}};const stop=()=>{if(raf)cancelAnimationFrame(raf);raf=0};
 const io=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible)start();else stop()},{threshold:.05});io.observe(stage);
 stage.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect();px=((e.clientX-r.left)/r.width-.5)*2;py=((e.clientY-r.top)/r.height-.5)*2},{passive:true});
 stage.addEventListener('pointerleave',()=>{px=0;py=0},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else start()});
 setPreset=name=>{const p=presets[name];uniforms.uBase.value.set(...p.c);uniforms.uLight.value.set(...p.light);uniforms.uEnergy.value=p.energy;renderer.render(scene,camera)};
 stage.classList.add('is-webgl');
 }catch(e){console.warn('Belle: using CSS textile fallback',e)}
}
