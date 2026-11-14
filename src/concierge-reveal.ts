import './styles/concierge-reveal.css';
/** Local reversible paint trail. Both complete editorial layers share one registration. */
export function initConciergeReveal():()=>void {
 const root=document.querySelector<HTMLElement>('[data-concierge-reveal]');
 const canvas=root?.querySelector<HTMLCanvasElement>('canvas');
 if(!root||!canvas)return()=>{};
 const ctx=canvas.getContext('2d');if(!ctx)return()=>{};
 const mask=document.createElement('canvas'),buffer=document.createElement('canvas');
 const m=mask.getContext('2d')!,b=buffer.getContext('2d')!;
 const front=root.querySelector<HTMLImageElement>('.style-reveal__original')!;
 const back=new Image();back.src='/concierge/billie-champagne.webp';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),coarse=matchMedia('(pointer: coarse)');
 let frame=0,visible=false,disposed=false,width=0,height=0,dpr=1,last:{x:number;y:number}|null=null;
 type Stamp={x:number;y:number;t:number;lobes:{x:number;y:number;r:number}[]};
 let stamps:Stamp[]=[];
 const staticMode=()=>reduced.matches||document.documentElement.dataset.intensity==='essential';
 const hint=root.querySelector<HTMLElement>('.style-reveal__hint')!;
 function hintUpdate(){hint.textContent=coarse.matches?'Arraste sobre o look para revelar o vestido':'Passe o cursor para revelar o vestido';}
 function resize(){const r=canvas!.getBoundingClientRect();width=r.width;height=r.height;dpr=Math.min(devicePixelRatio||1,coarse.matches?1.25:1.5);for(const c of[canvas!,mask,buffer]){c.width=Math.round(width*dpr);c.height=Math.round(height*dpr);}stamps=[];last=null;wake();}
 function cover(c:CanvasRenderingContext2D,img:HTMLImageElement){const scale=Math.max(canvas!.width/img.naturalWidth,canvas!.height/img.naturalHeight)*(width<600?1.18:1.1);const w=img.naturalWidth*scale,h=img.naturalHeight*scale;c.drawImage(img,(canvas!.width-w)/2,0,w,h);}
 function draw(now:number){frame=0;if(disposed||!visible||document.hidden)return;
  stamps=staticMode()?[]:stamps.filter(s=>now-s.t<1100);
  ctx!.setTransform(1,0,0,1,0,0);ctx!.clearRect(0,0,canvas!.width,canvas!.height);
  if(!front.complete||!front.naturalWidth)return;
  cover(ctx!,front);
  if(stamps.length&&back.complete&&back.naturalWidth){
   m.setTransform(dpr,0,0,dpr,0,0);m.clearRect(0,0,width,height);m.fillStyle='#000';
   for(const s of stamps){const k=Math.min(1,(1-(now-s.t)/1100)/.75);for(const l of s.lobes){m.beginPath();m.arc(s.x+l.x*k,s.y+l.y*k,l.r*Math.pow(k,.8),0,Math.PI*2);m.fill();}}
   ctx!.globalCompositeOperation='destination-out';ctx!.drawImage(mask,0,0);ctx!.globalCompositeOperation='source-over';
   b.setTransform(1,0,0,1,0,0);b.clearRect(0,0,buffer.width,buffer.height);b.globalCompositeOperation='source-over';b.drawImage(mask,0,0);b.globalCompositeOperation='source-in';cover(b,back);ctx!.drawImage(buffer,0,0);
  }
  root!.classList.add('style-reveal--ready');
  if(stamps.length)frame=requestAnimationFrame(draw);
 }
 function wake(){if(!disposed&&visible&&!document.hidden&&!frame)frame=requestAnimationFrame(draw);}
 function stamp(x:number,y:number,t:number){const radius=width*(coarse.matches?.14:.12);stamps.push({x,y,t,lobes:Array.from({length:4},()=>{const a=Math.random()*Math.PI*2,r=Math.random()*radius*.4;return{x:Math.cos(a)*r,y:Math.sin(a)*r,r:radius*(.5+Math.random()*.5)};})});if(stamps.length>120)stamps.splice(0,stamps.length-120);}
 function pointer(e:PointerEvent){if(staticMode()||!back.complete||!back.naturalWidth)return;if(e.pointerType==='touch'&&e.type==='pointermove'&&!e.buttons)return;
  const r=canvas!.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,now=performance.now();
  if(last){const n=Math.min(20,Math.ceil(Math.hypot(x-last.x,y-last.y)/Math.max(8,width*.04)));for(let i=1;i<n;i++)stamp(last.x+(x-last.x)*i/n,last.y+(y-last.y)*i/n,now);}
  stamp(x,y,now);last={x,y};wake();
 }
 const leave=()=>{last=null;};
 const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible)wake();else{cancelAnimationFrame(frame);frame=0;stamps=[];}},{rootMargin:'80px'});observer.observe(root);
 const ro=new ResizeObserver(resize);ro.observe(canvas);
 root.addEventListener('pointermove',pointer,{passive:true});root.addEventListener('pointerdown',pointer,{passive:true});root.addEventListener('pointerleave',leave);root.addEventListener('pointerup',leave);
 const onMode=()=>{stamps=[];hintUpdate();wake();};const mo=new MutationObserver(onMode);mo.observe(document.documentElement,{attributes:true,attributeFilter:['data-intensity']});
 front.addEventListener('load',wake);back.addEventListener('load',wake);back.addEventListener('error',()=>{hint.textContent='Atendimento de estilo Belle Alencar';});reduced.addEventListener('change',onMode);coarse.addEventListener('change',onMode);document.addEventListener('visibilitychange',wake);
 hintUpdate();resize();
 const destroy=()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();ro.disconnect();mo.disconnect();root.removeEventListener('pointermove',pointer);root.removeEventListener('pointerdown',pointer);root.removeEventListener('pointerleave',leave);root.removeEventListener('pointerup',leave);front.removeEventListener('load',wake);back.removeEventListener('load',wake);reduced.removeEventListener('change',onMode);coarse.removeEventListener('change',onMode);document.removeEventListener('visibilitychange',wake);};
 if(import.meta.hot)import.meta.hot.dispose(destroy);return destroy;
}
