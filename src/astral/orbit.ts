/** Original lightweight decorative approximation; not React Bits Astral Shell. */
export function initStoreOrbit(): void {
  const section = document.querySelector<HTMLElement>('#lojas');
  const canvas = section?.querySelector<HTMLCanvasElement>('.stores__orbit');
  if (!section || !canvas) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  const ctx = context;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const noise = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const points = Array.from({length: 900}, (_, i) => {
    const y = 1 - 2 * noise(i), r = Math.sqrt(1 - y*y), a = noise(i + 1000) * Math.PI * 2;
    return {x: Math.cos(a)*r,y,z: Math.sin(a)*r};
  });
  const edges: [number,number][] = [];
  points.forEach((p,i) => {
    const nearest = points.map((q,j) => ({j,d:(p.x-q.x)**2+(p.y-q.y)**2+(p.z-q.z)**2})).filter(o=>o.j>i && o.d<.045).sort((a,b)=>a.d-b.d).slice(0,6);
    nearest.forEach(q=>edges.push([i,q.j]));
  });
  let frame = 0, visible = false, angle = 0, last = 0, size = 0;
  function draw(now: number) {
    frame=0;
    if (!visible || document.hidden) return;
    if (!reduce.matches && last) angle += Math.min(40,now-last)*.00025;
    last=now;
    const dpr=Math.min(devicePixelRatio||1,1.5), w=canvas!.clientWidth;
    if (size!==w || canvas!.width!==Math.round(w*dpr)) {size=w;canvas!.width=Math.round(w*dpr);canvas!.height=Math.round(w*dpr);}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,w);
    const radius=w*.37, c=Math.cos(angle), s=Math.sin(angle);
    const projected=points.map(p=>{const x=p.x*c+p.z*s,z=-p.x*s+p.z*c;return {x:w/2+x*radius,y:w/2+p.y*radius,z};});
    ctx.globalCompositeOperation='lighter';
    for(const [a,b] of edges){const p=projected[a]!,q=projected[b]!,depth=(p.z+q.z+2)/4;ctx.strokeStyle=`rgba(255,150,0,${.08+depth*.23})`;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
    projected.forEach((p,i)=>{const depth=(p.z+1)/2;const pulse=.6+.4*Math.sin(angle*5+i*.17)**2;ctx.fillStyle=`rgba(255,${Math.round(155+depth*85)},${Math.round(35+depth*100)},${(.24+depth*.65)*pulse})`;ctx.beginPath();ctx.arc(p.x,p.y,.6+depth*1.05,0,Math.PI*2);ctx.fill();});
    ctx.globalCompositeOperation='source-over';
    if (!reduce.matches) frame=requestAnimationFrame(draw);
  }
  const wake=()=>{last=0;if(visible&&!document.hidden&&!frame) frame=requestAnimationFrame(draw)};
  if ('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible)wake();else {cancelAnimationFrame(frame);frame=0;}},{rootMargin:'100px'});
    observer.observe(canvas);
  } else { visible=true; wake(); }document.addEventListener('visibilitychange',wake);reduce.addEventListener('change',()=>{cancelAnimationFrame(frame);frame=0;wake()});window.addEventListener('resize',wake,{passive:true});
}
