import { commerceApi } from '../commerce/api';
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
  let frame = 0, visible = false, angle = -2.42, last = 0, size = 0;
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
  const cities = [
    {name:'Araxá',lat:-19.593,lon:-46.941,state:'Minas Gerais'},
    {name:'Frutal',lat:-20.025,lon:-48.935,state:'Minas Gerais'},
    {name:'Catalão',lat:-18.165,lon:-47.946,state:'Goiás'},
    {name:'Mineiros',lat:-17.565,lon:-52.554,state:'Goiás'},
  ];
  let selected:string|null=null, zoom=1, focusAt=0, arrival=1;
  // Scroll-derived arrival is reversible and does not intercept page scrolling.
  const flight=document.createElement('span');flight.className='stores__flight';flight.setAttribute('aria-hidden','true');
  flight.innerHTML='<img src="/brand/belle-bag.webp" width="76" height="76" alt="">';
  const bagImage=new Image();bagImage.src='/brand/belle-bag.webp';bagImage.onload=()=>wake();
  document.body.append(flight);
  let flightFrame=0;
  function updateFlight(){
    flightFrame=0;
    const how=document.querySelector<HTMLElement>('#como-comprar');
    if(!how||selected||still()){flight.hidden=true;arrival=1;return;}
    const rect=how.getBoundingClientRect(),target=canvas!.getBoundingClientRect();
    const start=scrollY+rect.top+Math.max(0,rect.height-innerHeight)*.86;
    const finish=scrollY+target.top+target.height*.5-innerHeight*.55;
    const p=Math.max(0,Math.min(1,(scrollY-start)/Math.max(1,finish-start)));
    flight.hidden=p<=0||p>=1;arrival=p;
    const x=innerWidth*.5+(target.x+target.width*.5-innerWidth*.5)*p;
    const y=innerHeight*.5+(target.y+target.height*.5-innerHeight*.5)*p-Math.sin(p*Math.PI)*90;
    flight.style.transform=`translate3d(${x-38}px,${y-38}px,0) rotate(${Math.sin(p*Math.PI)*-18}deg) scale(${1-p*.4})`;
  }
  window.addEventListener('scroll',()=>{if(!flightFrame)flightFrame=requestAnimationFrame(updateFlight);},{passive:true});
  flight.hidden=true;
  const caption=document.createElement('p'); caption.className='stores__globe-caption';
  caption.setAttribute('role','status'); caption.textContent='Quatro cidades conectadas · arraste para girar';
  canvas.insertAdjacentElement('afterend',caption);
  function syncCity(){
    const next=commerceApi()?.storeCity()??null;
    if(next===selected)return;
    selected=next;flight.hidden=true;arrival=1;focusAt=performance.now();velocityX=velocityY=0;
    const city=cities.find(c=>c.name===selected);
    if(city){
      // Face the actual city coordinates toward the camera before the two-stage approach.
      angle=(city.lon-90)*Math.PI/180;orientation=[0,0,0,1];rotate(0,-city.lat*Math.PI/180);
      caption.textContent=`${city.state} → ${city.name} · Ver no mapa para o endereço da loja`;
    }
    wake();
  }
  queueMicrotask(()=>{syncCity();commerceApi()?.onChange(syncCity);});
  rotate(0,.34);
  let pulseX = -9999, pulseY = -9999, pulseAt = 0;
  function draw(now: number) {
    frame=0;
    if (!visible || document.hidden) return;
    if (!still() && last) {
      const dt=Math.min(40,now-last); if(!selected) angle += dt*.00018;
      if (!dragging && (Math.abs(velocityX)+Math.abs(velocityY)>.00001)) {
        rotate(velocityX*dt,velocityY*dt);const damping=Math.exp(-dt/420);velocityX*=damping;velocityY*=damping;
      }
    }
    last=now;
    const approach=selected?Math.min(1,(now-focusAt)/1800):0;
    zoom=selected?(still()?1.12:1+.06*Math.min(1,approach*2)+.06*Math.max(0,approach*2-1)):1;
    const dpr=Math.min(devicePixelRatio||1,mobile ? 1.15 : 1.5), w=canvas!.clientWidth;
    if (size!==w || canvas!.width!==Math.round(w*dpr)) {size=w;canvas!.width=Math.round(w*dpr);canvas!.height=Math.round(w*dpr);}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,w);
    const radius=w*.44*zoom, c=Math.cos(angle), s=Math.sin(angle);
    const [qx,qy,qz,qw]=orientation;
    function project(p:{x:number;y:number;z:number}) {
      const x=p.x*c+p.z*s,z=-p.x*s+p.z*c,y=p.y;
      const tx=2*(qy*z-qz*y),ty=2*(qz*x-qx*z),tz=2*(qx*y-qy*x);
      return {x:w/2+(x+qw*tx+qy*tz-qz*ty)*radius,
        y:w/2+(y+qw*ty+qz*tx-qx*tz)*radius,z:z+qw*tz+qx*ty-qy*tx};
    }
    // A restrained atmospheric halo gives the network a sense of light in space.
    const glow=ctx.createRadialGradient(w/2,w/2,radius*.18,w/2,w/2,radius*1.3);
    glow.addColorStop(0,'rgba(255,255,255,0)');glow.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,w,w);
    const projected=points.map(project);
    ctx.globalCompositeOperation='source-over';
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
    paths.forEach((path,i)=>{ctx.strokeStyle=`rgba(168,${95+i*9},${25+i*4},${.07+i*.09})`;ctx.stroke(path);});
    projected.forEach((p,i)=>{const depth=(p.z+1)/2;const pulse=.6+.4*Math.sin(angle*5+i*.17)**2; const hover=hovering ? Math.max(0,1-Math.hypot(p.x-pointerX,p.y-pointerY)/(w*.23)) : 0;ctx.fillStyle=`rgba(190,${Math.round(110+depth*45)},${Math.round(20+depth*30)},${Math.min(1,(.34+depth*.66)*pulse+hover*.4)})`;ctx.beginPath();ctx.arc(p.x,p.y,.6+depth*1.05,0,Math.PI*2);ctx.fill();});
    // A few quiet light impulses travel through the network like signals between cities.
    if (!still()) for(let i=0;i<14;i++) {
      const edge=edges[(i*311)%edges.length]; if(!edge) continue;
      const a=projected[edge[0]]!,b=projected[edge[1]]!;
      const phase=(now*.00028+i*.173)%1, x=a.x+(b.x-a.x)*phase,y=a.y+(b.y-a.y)*phase;
      ctx.fillStyle='rgba(255,229,178,.8)';ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fill();
    }
    ctx.globalCompositeOperation='source-over';
    // Geographic anchors with separated callouts: cities are close on a world globe.
    cities.forEach((city,i)=>{
      if(selected && city.name!==selected)return;
      const lat=city.lat*Math.PI/180,lon=city.lon*Math.PI/180;
      const p=project({x:Math.cos(lat)*Math.cos(lon),y:-Math.sin(lat),z:Math.cos(lat)*Math.sin(lon)});
      if(p.z<-.12)return;
      const side=i%2?1:-1, split=still()?1:Math.max(0,Math.min(1,(arrival-.65)/.35));
      const labelX=selected?w*.5:w*.5+(w*(side>0?.78:.22)-w*.5)*split;
      const labelY=selected?w*.28:w*.5+(w*(i<2?.2:.8)-w*.5)*split;
      ctx.strokeStyle='rgba(149,102,34,.55)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(labelX,labelY+12);ctx.stroke();
      ctx.fillStyle='#ad791d';ctx.beginPath();ctx.arc(p.x,p.y,3+(still()?0:Math.sin(now*.003+i)*1.2),0,Math.PI*2);ctx.fill();
      if(bagImage.complete&&bagImage.naturalWidth)ctx.drawImage(bagImage,labelX-22,labelY-38,44,44);
      ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillStyle='#594323';ctx.fillText(city.name,labelX,labelY+23);
    });
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
