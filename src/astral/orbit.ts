import { CITIES, spherePoint, journey } from './geography';
import { commerceApi } from '../commerce/api';
import { clampGlobeZoom, wheelGlobeZoom, pinchGlobeZoom, easeGlobeZoom } from './gestures';
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
  const cities=CITIES;
  type Border={name:string;kind:string;rings:number[][][]};
  let borders:{name:string;kind:string;rings:ReturnType<typeof spherePoint>[][]}[]=[];
  fetch('/geo/boundaries.json').then(r=>{if(!r.ok)throw Error('geo');return r.json();}).then((data:Border[])=>{borders=data.map(b=>({...b,rings:b.rings.map(r=>r.map(p=>spherePoint(p[1]!,p[0]!)))}));wake();}).catch(()=>{caption.textContent='Arraste para girar · escolha sua loja abaixo';});
  let navigation=true, mapAfterJourney=false, pendingEntry=false;
  let selected:string|null=null, zoom=1, focusAt=0, arrival=1;
  let manualZoom=1, manualZoomTarget=1;
  const touches=new Map<number,{x:number;y:number}>();
  let pinchDistance=0, dragTravel=0;
  const span=():number=>{const p=[...touches.values()];return p.length<2?0:Math.hypot(p[0]!.x-p[1]!.x,p[0]!.y-p[1]!.y);};
  // Scroll-derived arrival is reversible and does not intercept page scrolling.
  const flight=document.createElement('span');flight.className='stores__flight';flight.setAttribute('aria-hidden','true');
  flight.innerHTML='<img src="/brand/belle-bag.webp" width="76" height="76" alt="">';
  const bagImage=new Image();bagImage.src='/brand/belle-bag.webp';bagImage.onload=()=>wake();
  document.body.append(flight);
  let flightFrame=0;
  function updateFlight(){
    flightFrame=0;
    const how=document.querySelector<HTMLElement>('#como-comprar');
    if(!how||still()){flight.hidden=true;arrival=1;return;}
    const rect=how.getBoundingClientRect(),target=canvas!.getBoundingClientRect();
    const start=scrollY+rect.top+Math.max(0,rect.height-innerHeight)*.61;
    const finish=scrollY+target.top+target.height*.5-innerHeight*.55;
    const p=Math.max(0,Math.min(1,(scrollY-start)/Math.max(1,finish-start)));
    flight.hidden=p<=0||p>=1;arrival=p;
    const card=how.querySelector<HTMLElement>('.how__steps li')?.getBoundingClientRect();
    const originX=card?card.left+card.width*.5:innerWidth*.5;
    const originY=card?card.top+card.height*.3:innerHeight*.5;
    const x=originX+(target.x+target.width*.5-originX)*p;
    const y=originY+(target.y+target.height*.5-originY)*p-Math.sin(p*Math.PI)*90+Math.sin(Math.max(0,p-.78)*Math.PI/.22)*24;
    flight.style.transform=`translate3d(${x-38}px,${y-38}px,0) rotate(${Math.sin(p*Math.PI)*-18}deg) scale(${1-p*.4})`;
  }
  window.addEventListener('scroll',()=>{if(!flightFrame)flightFrame=requestAnimationFrame(updateFlight);},{passive:true});
  flight.hidden=true;
  const caption=document.createElement('p'); caption.className='stores__globe-caption';
  caption.setAttribute('role','status'); caption.textContent='Quatro cidades conectadas · arraste para girar';
  canvas.insertAdjacentElement('afterend',caption);
  function syncCity(userChange=false){
    const next=commerceApi()?.storeCity()??null;
    if(next===selected)return;
    selected=next;mapAfterJourney=false;flight.hidden=true;arrival=1;focusAt=performance.now();velocityX=velocityY=0;
    manualZoom=manualZoomTarget=1;
    const city=cities.find(c=>c.name===selected);
    if(city){
      // Face the actual city coordinates toward the camera before the two-stage approach.
      navigation=true;pendingEntry=!visible;
      const rect=canvas!.getBoundingClientRect();
      if(userChange&&(rect.bottom<80||rect.top>innerHeight-80))canvas!.scrollIntoView({behavior:still()?'auto':'smooth',block:'center'});
      caption.textContent=`${city.state} → ${city.name} · Ver no mapa para o endereço da loja`;
    }
    wake();
  }
  queueMicrotask(()=>{syncCity();commerceApi()?.onChange(()=>syncCity(true));});
  rotate(0,.34);
  const markerButtons=cities.map(city=>{
    const button=document.createElement('button');button.type='button';button.className='stores__city-hit';
    button.setAttribute('aria-label',`Explorar Belle ${city.name}`);button.hidden=true;
    button.addEventListener('click',async()=>{
      await commerceApi()?.selectStore(city.id,button);
      if(commerceApi()?.storeCity()!==city.name)return;
      selected=city.name;navigation=true;pendingEntry=false;focusAt=performance.now();mapAfterJourney=true;
      manualZoom=manualZoomTarget=1;
      velocityX=velocityY=0;wake();
    });
    queueMicrotask(()=>canvas!.parentElement!.append(button));return button;
  });
  let pulseX = -9999, pulseY = -9999, pulseAt = 0;
  function draw(now: number) {
    frame=0;
    if (!visible || document.hidden) return;
    const delta=Math.min(40,Math.max(1,now-last||16));
    if (!still() && last && !dragging && touches.size<2 && !navigation) {
      // Rotação 360° contínua nos dois eixos; gestos adicionam inércia.
      rotate(delta*.00024,delta*.000072);
      if (Math.abs(velocityX)+Math.abs(velocityY)>.00003) {
        rotate(velocityX*delta,velocityY*delta);
        const damping=Math.exp(-delta/660);
        velocityX*=damping;velocityY*=damping;
      } else {velocityX=0;velocityY=0;}
    }
    last=now;
    if(!navigation) {
      manualZoom=still()?1:easeGlobeZoom(manualZoom,manualZoomTarget,delta);
      zoom=manualZoom;
    }
    const city=cities.find(c=>c.name===selected);
    if(city&&navigation&&!pendingEntry){
      const camera=journey(city,still()?5400:now-focusAt);
      zoom=camera.zoom;angle=(camera.lon-90)*Math.PI/180;
      orientation=[0,0,0,1];rotate(0,-camera.lat*Math.PI/180);
      section!.dataset.geoStage=camera.label;
      const message=`${camera.label} · ${city.name}, ${city.state}`;
      if(caption.textContent!==message)caption.textContent=message;
      if(mapAfterJourney&&(still()||now-focusAt>=4200)){
        mapAfterJourney=false;navigation=false;zoom=1;
        window.dispatchEvent(new CustomEvent('belle:city-map',{detail:city.id}));
      }
      if(still()||now-focusAt>=5200){navigation=false;zoom=1;}
    }
    const dpr=Math.min(devicePixelRatio||1,mobile ? 1.15 : 1.5), w=canvas!.clientWidth;
    if (size!==w || canvas!.width!==Math.round(w*dpr)) {size=w;canvas!.width=Math.round(w*dpr);canvas!.height=Math.round(w*dpr);}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,w);
    const radius=w*.44*zoom, c=Math.cos(angle), s=Math.sin(angle);
    const [qx,qy,qz,qw]=orientation;
    function project(p:{x:number;y:number;z:number},scale=radius) {
      const x=p.x*c+p.z*s,z=-p.x*s+p.z*c,y=p.y;
      const tx=2*(qy*z-qz*y),ty=2*(qz*x-qx*z),tz=2*(qx*y-qy*x);
      return {x:w/2+(x+qw*tx+qy*tz-qz*ty)*scale,
        y:w/2+(y+qw*ty+qz*tx-qx*tz)*scale,z:z+qw*tz+qx*ty-qy*tx};
    }
    // Superfície profunda, sem anel preto nem stroke rígido no contorno.
    // O alpha cai até zero na borda; a própria malha luminosa define a esfera.
    ctx.save();ctx.beginPath();ctx.arc(w/2,w/2,w*.46,0,Math.PI*2);
    const surface=ctx.createRadialGradient(w*.42,w*.35,w*.01,w*.5,w*.5,w*.46);
    surface.addColorStop(0,'rgba(68,48,31,.98)');
    surface.addColorStop(.70,'rgba(36,27,21,.96)');
    surface.addColorStop(.88,'rgba(31,25,19,.76)');
    surface.addColorStop(1,'rgba(31,25,19,0)');
    ctx.fillStyle=surface;ctx.fill();ctx.clip();
    {
    const networkRadius=w*.44*Math.min(2.05,manualZoom);
    const projected=points.map(p=>project(p,networkRadius));
    ctx.globalAlpha=zoom>2?.7:1;
    ctx.globalCompositeOperation='lighter';
    ctx.fillStyle='rgba(255,176,66,.5)';ctx.beginPath();
    for (const p of inner) { const q=project(p,networkRadius); ctx.moveTo(q.x+.65,q.y);ctx.arc(q.x,q.y,.65,0,Math.PI*2); }
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
    ctx.lineWidth=mobile?.7:.85;
    paths.forEach((path,i)=>{ctx.strokeStyle=`rgba(255,${150+i*12},${35+i*14},${.16+i*.1})`;ctx.shadowColor='#ffb800';ctx.shadowBlur=mobile?0:(i>3?4:0);ctx.stroke(path);ctx.shadowBlur=0;});
    projected.forEach((p,i)=>{const depth=(p.z+1)/2;const pulse=.6+.4*Math.sin((still()?0:now*.0015)+i*.17)**2; const hover=hovering ? Math.max(0,1-Math.hypot(p.x-pointerX,p.y-pointerY)/(w*.23)) : 0;ctx.fillStyle=`rgba(255,${Math.round(170+depth*80)},${Math.round(65+depth*110)},${Math.min(1,(.34+depth*.66)*pulse+hover*.4)})`;ctx.beginPath();ctx.arc(p.x,p.y,.6+depth*1.05,0,Math.PI*2);ctx.fill();});
    // A few quiet light impulses travel through the network like signals between cities.
    if (!still()) for(let i=0;i<14;i++) {
      const edge=edges[(i*311)%edges.length]; if(!edge) continue;
      const a=projected[edge[0]]!,b=projected[edge[1]]!;
      const phase=(now*.00028+i*.173)%1, x=a.x+(b.x-a.x)*phase,y=a.y+(b.y-a.y)*phase;
      ctx.fillStyle='rgba(255,229,178,.8)';ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fill();
    }
    ctx.globalCompositeOperation='source-over';
    }
    ctx.globalAlpha=1;
    // All boundaries and pins share the same spherical geographic projection.
    for(const border of borders){
      if(zoom>8&&border.kind!=='state')continue;
      ctx.beginPath();
      for(const ring of border.rings){
        let pen=false;
        for(const point of ring){
          const q=project(point);
          if(q.z<0){pen=false;continue;}
          if(pen)ctx.lineTo(q.x,q.y);else ctx.moveTo(q.x,q.y);pen=true;
        }
      }
      ctx.lineWidth=border.kind==='state'?1.8:1;
      ctx.strokeStyle=border.kind==='state'?'rgba(255,218,135,.85)':'rgba(218,181,107,.22)';ctx.stroke();
    }
    if(zoom>2){
      for(const region of [{name:'Minas Gerais',lat:-18.5,lon:-44.6},{name:'Goiás',lat:-15.8,lon:-49.6}]){
        const p=project(spherePoint(region.lat,region.lon));
        if(p.z>0){ctx.font='12px sans-serif';ctx.fillStyle='#f1d7a1';ctx.textAlign='center';ctx.fillText(region.name,p.x,p.y);}
      }
    }
    // Geographic anchors with separated callouts: cities are close on a world globe.
    markerButtons.forEach(b=>{b.hidden=true;});
    cities.forEach((city,i)=>{
      if(selected && city.name!==selected)return;
      const lat=city.lat*Math.PI/180,lon=city.lon*Math.PI/180;
      const p=project({x:Math.cos(lat)*Math.cos(lon),y:-Math.sin(lat),z:Math.cos(lat)*Math.sin(lon)});
      if(p.z<-.12)return;
      const side=i%2?1:-1, split=still()?1:Math.max(0,Math.min(1,(arrival-.85)/.15));
      const labelX=selected?p.x:p.x+side*28*split;
      const labelY=selected?p.y-38:p.y+(i<2?48:-48)*split;
      const marker=markerButtons[i]!;
      if(labelX>20&&labelX<w-20&&labelY>35&&labelY<w-25){
        marker.hidden=false;marker.style.left=`${labelX/w*100}%`;marker.style.top=`${labelY-10}px`;
      }
      ctx.strokeStyle='rgba(219,177,94,.75)' ;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(labelX,labelY+12);ctx.stroke();
      ctx.fillStyle='#ad791d';ctx.beginPath();ctx.arc(p.x,p.y,3+(still()?0:Math.sin(now*.003+i)*1.2),0,Math.PI*2);ctx.fill();
      if(bagImage.complete&&bagImage.naturalWidth)ctx.drawImage(bagImage,labelX-17,labelY-30,34,34);
      ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff0cd';ctx.fillText(city.name,labelX,labelY+23);
    });
    ctx.restore();
    if (!still()) frame=requestAnimationFrame(draw);
  }
  const wake=()=>{last=0;if(visible&&!document.hidden&&!frame) frame=requestAnimationFrame(draw)};
  const manualControl=()=>{
    if(navigation){zoom=1;manualZoom=manualZoomTarget=1;}
    navigation=false;mapAfterJourney=false;pendingEntry=false;
  };
  canvas.addEventListener('wheel',event=>{
    if(still()||!visible)return;
    // Captura a roda apenas SOBRE o globo; scroll normal fora dele.
    event.preventDefault();
    manualControl();velocityX=velocityY=0;
    manualZoomTarget=wheelGlobeZoom(manualZoomTarget,event.deltaY);
    caption.textContent='Aproxime com a roda ou dois dedos · arraste para girar · explore a cidade no mapa';
    wake();
  },{passive:false});
  canvas.addEventListener('pointermove', event => {
    const rect=canvas.getBoundingClientRect();
    pointerX=event.clientX-rect.left;pointerY=event.clientY-rect.top;
    if(touches.has(event.pointerId))touches.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(touches.size>=2){
      const distance=span();
      if(pinchDistance>0&&!still()){
        manualControl();
        manualZoomTarget=pinchGlobeZoom(manualZoomTarget,distance,pinchDistance);
      }
      pinchDistance=distance;wake();return;
    }
    if(dragging && event.pointerId===activePointer){
      const pixelX=event.clientX-previousX,pixelY=event.clientY-previousY;
      dragTravel+=Math.hypot(pixelX,pixelY);
      const sensitivity=.014/Math.max(1,manualZoom*.62);
      const dx=pixelX*sensitivity,dy=pixelY*sensitivity;
      const now=performance.now(),dt=Math.max(8,now-lastDragTime);
      rotate(dx,dy);
      velocityX=Math.max(-.016,Math.min(.016,dx/dt));
      velocityY=Math.max(-.016,Math.min(.016,dy/dt));
      lastDragTime=now;
    }
    previousX=event.clientX;previousY=event.clientY;
    if(still())wake();
  },{passive:true});
  canvas.addEventListener('pointerleave',()=>{
    if(!dragging&&touches.size===0){pointerX=-9999;pointerY=-9999;if(still())wake();}
  });
  canvas.addEventListener('pointerdown',event=>{
    if(event.pointerType==='mouse'&&event.button!==0)return;
    if(event.pointerType==='touch'){
      touches.set(event.pointerId,{x:event.clientX,y:event.clientY});
      if(touches.size===2){
        manualControl();dragging=false;activePointer=-1;pinchDistance=span();
        velocityX=velocityY=0;
        canvas.setPointerCapture(event.pointerId);wake();return;
      }
    }
    if(dragging)return;
    manualControl();dragging=true;activePointer=event.pointerId;
    previousX=event.clientX;previousY=event.clientY;dragTravel=0;
    velocityX=velocityY=0;lastDragTime=performance.now();
    canvas.setPointerCapture(event.pointerId);wake();
  });
  function release(event:PointerEvent){
    if(event.pointerType==='touch')touches.delete(event.pointerId);
    if(pinchDistance>0){
      if(touches.size<2){pinchDistance=0;dragging=false;activePointer=-1;}
      wake();return;
    }
    if(event.pointerId!==activePointer)return;
    dragging=false;activePointer=-1;
    if(still()||event.type==='pointercancel'){
      velocityX=velocityY=0;
    }else if(dragTravel<6){
      // Um toque breve dá impulso, sem impedir um clique nos marcadores.
      velocityX=.004;velocityY=.0013;
    }else if(performance.now()-lastDragTime>120){
      velocityX=velocityY=0;
    }
    const rect=canvas!.getBoundingClientRect();
    pulseX=event.clientX-rect.left;pulseY=event.clientY-rect.top;
    pulseAt=performance.now();wake();
  }
  canvas.addEventListener('pointerup',release);
  canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('lostpointercapture',release);
  canvas.addEventListener('dblclick',()=>{
    manualZoomTarget=clampGlobeZoom(1);wake();
  });
  new MutationObserver(()=>{cancelAnimationFrame(frame);frame=0;wake();}).observe(document.documentElement,{attributes:true,attributeFilter:['data-intensity']});
  if ('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible){if(pendingEntry){pendingEntry=false;focusAt=performance.now();}wake();}else {cancelAnimationFrame(frame);frame=0;}},{rootMargin:'100px'});
    observer.observe(canvas);
  } else { visible=true; wake(); }document.addEventListener('visibilitychange',wake);reduce.addEventListener('change',()=>{cancelAnimationFrame(frame);frame=0;wake()});window.addEventListener('resize',wake,{passive:true});
}
