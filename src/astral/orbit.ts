/** Original lightweight decorative approximation; not React Bits Astral Shell. */
export function initStoreOrbit(): void {
  const section = document.querySelector<HTMLElement>('#lojas');
  const canvas = section?.querySelector<HTMLCanvasElement>('.stores__orbit');
  if (!section || !canvas) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  const ctx = context;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => reduce.matches || document.documentElement.dataset.intensity === 'essential';
  const noise = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const mobile = matchMedia('(max-width: 700px)').matches;
  const points = Array.from({length: mobile ? 750 : 1050}, (_, i) => {
    const y = 1 - 2 * noise(i), r = Math.sqrt(1 - y*y), a = noise(i + 1000) * Math.PI * 2;
    return {x: Math.cos(a)*r,y,z: Math.sin(a)*r};
  });
  // Denser lights around broad geographic hubs suggest connected cities, not a literal map.
  const hubs: [number, number][] = [[40,-74],[51,0],[35,139],[19,73],[1,104],[-23,-46],[-34,-58],[30,31],[6,3],[-26,28],[37,-122],[39,116],[25,55],[48,2],[41,29],[-33,151]];
  for (let i=0;i<(mobile ? 300 : 420);i++) {
    const hub=hubs[i%hubs.length]!;
    const lat=(hub[0]+(noise(i+3000)-.5)*24)*Math.PI/180;
    const lon=(hub[1]+(noise(i+4000)-.5)*35)*Math.PI/180;
    points.push({x:Math.cos(lat)*Math.cos(lon),y:-Math.sin(lat),z:Math.cos(lat)*Math.sin(lon)});
  }
  // A restrained inner layer makes the depth legible without a second renderer.
  const inner = Array.from({length: 420}, (_,i) => {
    const y=1-2*noise(i+7000), r=Math.sqrt(1-y*y), a=noise(i+9000)*Math.PI*2;
    const depth=.35+noise(i+11000)*.48;
    return {x:Math.cos(a)*r*depth,y:y*depth,z:Math.sin(a)*r*depth};
  });
  const edges: [number,number][] = [];
  points.forEach((p,i) => {
    const nearest: {j:number;d:number}[] = [];
    for(let j=i+1;j<points.length;j++) {
      const q=points[j]!,d=(p.x-q.x)**2+(p.y-q.y)**2+(p.z-q.z)**2;
      if(d>=.045) continue;
      nearest.push({j,d}); nearest.sort((a,b)=>a.d-b.d);
      if(nearest.length>6) nearest.pop();
    }
    nearest.forEach(q=>edges.push([i,q.j]));
  });
  let frame = 0, visible = false, angle = 0, last = 0, size = 0;
  // Quaternion keeps both axes free through repeated full turns, without pole limits.
  let orientation: [number,number,number,number] = [0,0,0,1];
  let velocityX=0, velocityY=0, lastDragTime=0, activePointer=-1;
  let pointerX = -9999, pointerY = -9999, dragging = false, previousX = 0, previousY = 0;
  function rotate(dx:number,dy:number) {
    const ax=dy*.5, ay=dx*.5, sx=Math.sin(ax), cx=Math.cos(ax), sy=Math.sin(ay), cy=Math.cos(ay);
    const [x,y,z,w]=orientation, qx=sx*cy, qy=cx*sy, qz=sx*sy, qw=cx*cy;
    const nx=qw*x+qx*w+qy*z-qz*y, ny=qw*y-qx*z+qy*w+qz*x;
    const nz=qw*z+qx*y-qy*x+qz*w, nw=qw*w-qx*x-qy*y-qz*z;
    const n=Math.hypot(nx,ny,nz,nw)||1; orientation=[nx/n,ny/n,nz/n,nw/n];
  }
  let pulseX = -9999, pulseY = -9999, pulseAt = 0;
  function draw(now: number) {
    frame=0;
    if (!visible || document.hidden) return;
    if (!still() && last) {
      const dt=Math.min(40,now-last); angle += dt*.00042;
      if (!dragging && (Math.abs(velocityX)+Math.abs(velocityY)>.00001)) {
        rotate(velocityX*dt,velocityY*dt);const damping=Math.exp(-dt/420);velocityX*=damping;velocityY*=damping;
      }
    }
    last=now;
    const dpr=Math.min(devicePixelRatio||1,mobile ? 1.15 : 1.5), w=canvas!.clientWidth;
    if (size!==w || canvas!.width!==Math.round(w*dpr)) {size=w;canvas!.width=Math.round(w*dpr);canvas!.height=Math.round(w*dpr);}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,w);
    const radius=w*.37, c=Math.cos(angle), s=Math.sin(angle);
    const [qx,qy,qz,qw]=orientation;
    function project(p:{x:number;y:number;z:number}) {
      const x=p.x*c+p.z*s,z=-p.x*s+p.z*c,y=p.y;
      const tx=2*(qy*z-qz*y),ty=2*(qz*x-qx*z),tz=2*(qx*y-qy*x);
      return {x:w/2+(x+qw*tx+qy*tz-qz*ty)*radius,
        y:w/2+(y+qw*ty+qz*tx-qx*tz)*radius,z:z+qw*tz+qx*ty-qy*tx};
    }
    // A restrained atmospheric halo gives the network a sense of light in space.
    const glow=ctx.createRadialGradient(w/2,w/2,radius*.18,w/2,w/2,radius*1.3);
    glow.addColorStop(0,'rgba(119,65,12,.08)');glow.addColorStop(.72,'rgba(155,88,16,.10)');glow.addColorStop(1,'rgba(155,88,16,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,w,w);
    const projected=points.map(project);
    ctx.globalCompositeOperation='lighter';
    ctx.fillStyle='rgba(255,176,66,.42)';ctx.beginPath();
    for (const p of inner) { const q=project(p); ctx.moveTo(q.x+.65,q.y);ctx.arc(q.x,q.y,.65,0,Math.PI*2); }
    ctx.fill();
    const hovering=pointerX>-999, pulseLife=Math.max(0,1-(now-pulseAt)/1100);
    // Batch paths by brightness: a handful of strokes instead of thousands per frame.
    const paths=Array.from({length:8},()=>new Path2D());
    for(const [a,b] of edges){
      const p=projected[a]!,q=projected[b]!,depth=(p.z+q.z+2)/4;
      const mx=(p.x+q.x)/2,my=(p.y+q.y)/2;
      const hover=hovering ? Math.max(0,1-Math.hypot(mx-pointerX,my-pointerY)/(w*.23)) : 0;
      const click=pulseLife ? pulseLife*Math.max(0,1-Math.hypot(mx-pulseX,my-pulseY)/(w*.32)) : 0;
      const level=Math.min(7,Math.floor((.08+depth*.28+hover*.45+click*.35)*8));
      const path=paths[level]!;path.moveTo(p.x,p.y);path.lineTo(q.x,q.y);
    }
    ctx.lineWidth=.8;
    paths.forEach((path,i)=>{ctx.strokeStyle=`rgba(255,${150+i*11},${Math.max(0,i-3)*36},${.07+i*.09})`;ctx.stroke(path);});
    projected.forEach((p,i)=>{const depth=(p.z+1)/2;const pulse=.6+.4*Math.sin(angle*5+i*.17)**2; const hover=hovering ? Math.max(0,1-Math.hypot(p.x-pointerX,p.y-pointerY)/(w*.23)) : 0;ctx.fillStyle=`rgba(255,${Math.round(155+depth*85)},${Math.round(35+depth*100)},${Math.min(1,(.34+depth*.66)*pulse+hover*.4)})`;ctx.beginPath();ctx.arc(p.x,p.y,.6+depth*1.05,0,Math.PI*2);ctx.fill();});
    // A few quiet light impulses travel through the network like signals between cities.
    if (!still()) for(let i=0;i<14;i++) {
      const edge=edges[(i*311)%edges.length]; if(!edge) continue;
      const a=projected[edge[0]]!,b=projected[edge[1]]!;
      const phase=(now*.00028+i*.173)%1, x=a.x+(b.x-a.x)*phase,y=a.y+(b.y-a.y)*phase;
      ctx.fillStyle='rgba(255,229,178,.8)';ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fill();
    }
    ctx.globalCompositeOperation='source-over';
    if (!still()) frame=requestAnimationFrame(draw);
  }
  const wake=()=>{last=0;if(visible&&!document.hidden&&!frame) frame=requestAnimationFrame(draw)};
  canvas.addEventListener('pointermove', event => {
    const rect=canvas.getBoundingClientRect(); pointerX=event.clientX-rect.left; pointerY=event.clientY-rect.top;
    if (dragging && event.pointerId===activePointer) {
      const dx=(event.clientX-previousX)*.018,dy=(event.clientY-previousY)*.018;
      const now=performance.now(),dt=Math.max(8,now-lastDragTime);
      rotate(dx,dy);velocityX=Math.max(-.012,Math.min(.012,dx/dt));velocityY=Math.max(-.012,Math.min(.012,dy/dt));lastDragTime=now;
    }
    previousX=event.clientX;previousY=event.clientY;if(still())wake();
  }, {passive:true});
  canvas.addEventListener('pointerleave',()=>{ if(!dragging){pointerX=-9999;pointerY=-9999;if(still())wake();} });
  canvas.addEventListener('pointerdown',event=>{
    if(dragging || (event.pointerType==='mouse' && event.button!==0)) return;
    dragging=true;activePointer=event.pointerId;previousX=event.clientX;previousY=event.clientY;
    velocityX=0;velocityY=0;lastDragTime=performance.now();canvas.setPointerCapture(event.pointerId);
  });
  function release(event:PointerEvent) {
    if(event.pointerId!==activePointer) return;
    dragging=false;activePointer=-1;
    if(still() || event.type==='pointercancel' || performance.now()-lastDragTime>100){velocityX=0;velocityY=0;}
    const rect=canvas!.getBoundingClientRect();pulseX=event.clientX-rect.left;pulseY=event.clientY-rect.top;pulseAt=performance.now();wake();
  }
  canvas.addEventListener('pointerup',release);
  canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('lostpointercapture',release);
  new MutationObserver(()=>{cancelAnimationFrame(frame);frame=0;wake();}).observe(document.documentElement,{attributes:true,attributeFilter:['data-intensity']});
  if ('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible)wake();else {cancelAnimationFrame(frame);frame=0;}},{rootMargin:'100px'});
    observer.observe(canvas);
  } else { visible=true; wake(); }document.addEventListener('visibilitychange',wake);reduce.addEventListener('change',()=>{cancelAnimationFrame(frame);frame=0;wake()});window.addEventListener('resize',wake,{passive:true});
}
