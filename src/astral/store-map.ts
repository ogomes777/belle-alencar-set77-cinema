import { commerceApi } from '../commerce/api';
import { CITIES } from './geography';
import { STORES } from '../commerce/stores';
/** The real Google map is loaded only on explicit entry; globe state is retained underneath. */
export function initStoreMap(): void {
  const canvas=document.querySelector<HTMLCanvasElement>('.stores__orbit');
  if(!canvas)return;
  const stage=document.createElement('div');stage.className='stores__geo-stage';
  canvas.before(stage);stage.append(canvas);
  const enter=document.createElement('button');enter.type='button';enter.className='btn btn--line stores__enter-map';
  enter.textContent='Explorar esta cidade no Google Maps';enter.hidden=true;stage.append(enter);
  const dialog=document.createElement('dialog');dialog.className='stores-map';
  dialog.innerHTML='<form method="dialog"><button autofocus aria-label="Voltar ao globo">← Voltar ao globo</button></form><h2>Encontre sua Belle</h2><iframe title="Google Maps — endereço da loja" referrerpolicy="no-referrer-when-downgrade"></iframe><a target="_blank" rel="noopener noreferrer">Abrir rotas no Google Maps ↗</a>';
  stage.append(dialog);
  let trigger:HTMLElement|null=null;
  function open(href:string,source:HTMLElement){
    trigger=source;
    const query=new URL(href).searchParams.get('query');
    dialog.querySelector('iframe')!.src=`https://maps.google.com/maps?q=${encodeURIComponent(query??'')}&z=16&output=embed`;
    dialog.querySelector('a')!.href=href;
    dialog.show();stage.classList.add('is-map');dialog.querySelector('button')!.focus();
  }
  document.querySelectorAll<HTMLAnchorElement>('#lojas .store-card__map').forEach(link=>link.addEventListener('click',event=>{
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    event.preventDefault();open(link.href,link);
  }));
  enter.addEventListener('click',()=>{
    const city=CITIES.find(c=>c.name===commerceApi()?.storeCity());if(!city)return;
    const store=STORES[city.id];
    open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.address}, ${store.city} ${store.state}`)}`,enter);
  });
  window.addEventListener('belle:city-map',((event:CustomEvent<string>)=>{
    const city=CITIES.find(c=>c.id===event.detail);if(!city||city.name!==commerceApi()?.storeCity())return;
    const store=STORES[city.id];
    open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.address}, ${store.city} ${store.state}`)}`,enter);
  }) as EventListener);
  function sync(){enter.hidden=!commerceApi()?.hasStore();if(dialog.open)dialog.close();}
  queueMicrotask(()=>{sync();commerceApi()?.onChange(sync);});
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();dialog.close();}});
  dialog.addEventListener('close',()=>{stage.classList.remove('is-map');dialog.querySelector('iframe')!.src='about:blank';trigger?.focus();});
}
