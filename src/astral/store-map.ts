import { commerceApi } from '../commerce/api';
import { CITIES } from './geography';
import { STORES } from '../commerce/stores';
/** The real Google map is loaded only on explicit entry; globe state is retained underneath. */
export function initStoreMap(): void {
  const canvas=document.querySelector<HTMLCanvasElement>('.stores__orbit');
  if(!canvas)return;
  const stage=document.createElement('div');stage.className='stores__geo-stage';
  canvas.before(stage);
  // Keep the existing geographic canvas and marker hit targets. Move the V44
  // compact hierarchy into the same stage, not into a new grid column.
  const trail=document.querySelector<HTMLElement>('#lojas [data-geo-trail]');
  const caption=document.querySelector<HTMLElement>('#lojas .stores__globe-caption');
  stage.append(canvas);
  if(caption)stage.append(caption);
  if(trail)stage.append(trail);
  const enter=document.createElement('button');enter.type='button';enter.className='btn btn--line stores__enter-map';
  enter.classList.add('stores__maps-neon');
  enter.innerHTML=`<span class="stores__maps-icon" aria-hidden="true">
    <svg viewBox="0 0 32 32" width="23" height="23" focusable="false">
      <path fill="#4285F4" d="M16 2A11 11 0 0 0 5 13c0 6.6 8.2 15.6 10.4 17.9L16 31l4.1-7.1-8.3-8.7z"/>
      <path fill="#34A853" d="M16 2a11 11 0 0 1 9.8 6L16 16l-5.6-8A11 11 0 0 1 16 2z"/>
      <path fill="#FBBC05" d="M25.8 8A11 11 0 0 1 27 13c0 5.2-5.1 12-8.4 16.2l-2.6-7.4 3.9-6.5z"/>
      <path fill="#EA4335" d="M10.4 8 16 16l-3.6 7.6C9 19.5 5 14.7 5 13a11 11 0 0 1 5.4-5z"/>
      <circle cx="16" cy="13" r="3.7" fill="#fff"/>
    </svg></span><span class="stores__maps-text">Explorar esta cidade no Google Maps</span>`;
  enter.setAttribute('aria-label','Explorar a cidade selecionada no Google Maps');
  enter.hidden=true;stage.append(enter);
  const dialog=document.createElement('dialog');dialog.className='stores-map';
  dialog.innerHTML=`<div class="stores-map__bar">
    <span class="stores-map__eyebrow">BELLE ALENCAR · LOJAS</span>
    <form method="dialog"><button autofocus aria-label="Voltar ao globo">← Voltar ao globo</button></form>
  </div>
  <div class="stores-map__heading"><h2>Encontre sua Belle</h2>
    <p class="stores-map__sub">Seu destino, sua experiência.</p></div>
  <div class="stores-map__frame"><iframe title="Google Maps — endereço da loja"
    loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
  <div class="stores-map__foot"><span class="stores-map__address"></span>
    <a target="_blank" rel="noopener noreferrer">Abrir rotas no Maps ↗</a></div>`;
  stage.append(dialog);
  // An exact store address takes priority. Otherwise the map is explicitly
  // city-level, not a fabricated storefront entrance.
  const mapSearch=(city:typeof CITIES[number])=>{
    const store=STORES[city.id];
    const q=store.address?`${store.address}, ${store.city} ${store.state}`:`${store.city}, ${city.state}, Brasil`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  };
  let trigger:HTMLElement|null=null;
  function open(href:string,source:HTMLElement){
    trigger=source;
    const query=new URL(href).searchParams.get('query');
    dialog.querySelector('iframe')!.src=`https://maps.google.com/maps?q=${encodeURIComponent(query??'')}&z=16&output=embed`;
    dialog.querySelector('a')!.href=href;
    const resolved=CITIES.find(c=>query?.toLowerCase().includes(c.name.toLowerCase()));
    dialog.querySelector<HTMLElement>('.stores-map__address')!.textContent=resolved&&!STORES[resolved.id].address
      ?`${resolved.name} · localização da cidade (endereço da loja a confirmar)`
      :(query??'Localização da loja');
    const city=CITIES.find(c=>query?.toLowerCase().includes(c.name.toLowerCase()));
    dialog.querySelector('h2')!.textContent=city?`Belle em ${city.name}`:'Encontre sua Belle';
    if(!dialog.open)dialog.show();
    stage.classList.add('is-map');
    dialog.querySelector('button')!.focus();
  }
  document.querySelectorAll<HTMLAnchorElement>('#lojas .store-card__map').forEach(link=>link.addEventListener('click',event=>{
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();open(link.href,link);
  }));
  enter.addEventListener('click',()=>{
    const city=CITIES.find(c=>c.name===commerceApi()?.storeCity());if(!city)return;
    open(mapSearch(city),enter);
  });
  window.addEventListener('belle:city-map',((event:CustomEvent<string>)=>{
    const city=CITIES.find(c=>c.id===event.detail);if(!city||city.name!==commerceApi()?.storeCity())return;
    open(mapSearch(city),enter);
  }) as EventListener);
  function sync(){enter.hidden=!commerceApi()?.hasStore();if(dialog.open)dialog.close();}
  queueMicrotask(()=>{sync();commerceApi()?.onChange(sync);});
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();dialog.close();}});
  dialog.addEventListener('close',()=>{stage.classList.remove('is-map');dialog.querySelector('iframe')!.src='about:blank';trigger?.focus();});
}
