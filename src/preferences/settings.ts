
/** V31 · Persistent Belle preferences: language + three full-page palettes. */
import { getBelleLocale, setBelleLocale, type BelleLocale } from './i18n';
export type BelleTheme = 'light'|'dark'|'rose';
const themeKey='belle:v31:theme';
function readTheme(): BelleTheme {
  try { const t=localStorage.getItem(themeKey);return t==='dark'||t==='rose'||t==='light'?t:'light'; }
  catch{return 'light';}
}
let theme:BelleTheme=readTheme();
export function setBelleTheme(next:BelleTheme){
 if(next!=='light'&&next!=='dark'&&next!=='rose')return;
 theme=next;
 document.documentElement.dataset.belleTheme=next;
 try{localStorage.setItem(themeKey,next);}catch{}
 window.dispatchEvent(new CustomEvent('belle:themechange',{detail:{theme:next}}));
}
const words:Record<BelleLocale,{
 eyebrow:string,title:string,appearance:string,appearanceHelp:string,
 language:string,languageHelp:string,footer:string,close:string,gear:string,
 light:string,dark:string,rose:string
}>={
 pt:{eyebrow:'ATELIER DIGITAL',title:'Sua experiência.',appearance:'Atmosfera',appearanceHelp:'Escolha sua paleta',language:'Idioma',languageHelp:'Quatro idiomas',footer:'Suas escolhas ficam salvas neste navegador.',close:'Fechar configurações',gear:'Configurações de idioma e tema',light:'Claro',dark:'Escuro',rose:'Custom · Rosé Gold'},
 en:{eyebrow:'DIGITAL ATELIER',title:'Your experience.',appearance:'Atmosphere',appearanceHelp:'Choose your palette',language:'Language',languageHelp:'Four languages',footer:'Your choices are saved in this browser.',close:'Close settings',gear:'Language and theme settings',light:'Light',dark:'Dark',rose:'Custom · Rosé Gold'},
 es:{eyebrow:'ATELIER DIGITAL',title:'Tu experiencia.',appearance:'Ambiente',appearanceHelp:'Elige tu paleta',language:'Idioma',languageHelp:'Cuatro idiomas',footer:'Tus preferencias se guardan en este navegador.',close:'Cerrar ajustes',gear:'Ajustes de idioma y tema',light:'Claro',dark:'Oscuro',rose:'Custom · Rosé Gold'},
 it:{eyebrow:'ATELIER DIGITALE',title:'La tua esperienza.',appearance:'Atmosfera',appearanceHelp:'Scegli la palette',language:'Lingua',languageHelp:'Quattro lingue',footer:'Le tue preferenze restano salvate nel browser.',close:'Chiudi impostazioni',gear:'Impostazioni lingua e tema',light:'Chiaro',dark:'Scuro',rose:'Custom · Rosé Gold'},
};
const icon='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 2.75h3l.6 2.2a8 8 0 0 1 1.8.8l2-.99 2.11 2.11-.99 2a8 8 0 0 1 .8 1.8l2.2.6v3l-2.2.6a8 8 0 0 1-.8 1.8l.99 2-2.11 2.11-2-.99a8 8 0 0 1-1.8.8l-.6 2.2h-3l-.6-2.2a8 8 0 0 1-1.8-.8l-2 .99-2.11-2.11.99-2a8 8 0 0 1-.8-1.8l-2.2-.6v-3l2.2-.6a8 8 0 0 1 .8-1.8l-.99-2L6.9 4.76l2 .99a8 8 0 0 1 1.8-.8l.6-2.2z"/><circle cx="12" cy="12" r="3.1"/></svg>';
const langs:{id:BelleLocale;iso:string;name:string}[]=[
 {id:'pt',iso:'BR',name:'Português'},{id:'en',iso:'EN',name:'English'},
 {id:'es',iso:'ES',name:'Español'},{id:'it',iso:'IT',name:'Italiano'}
];
const themes:BelleTheme[]=['light','dark','rose'];
export function initBelleSettings(){
 setBelleTheme(readTheme());
 const actions=document.querySelector<HTMLElement>('#siteHeader .site-actions');
 if(!actions||document.getElementById('belleSettingsButton'))return;
 const trigger=document.createElement('button');
 trigger.id='belleSettingsButton';trigger.type='button';trigger.className='icon-btn';
 trigger.setAttribute('aria-haspopup','dialog');
 trigger.setAttribute('aria-expanded','false');
 trigger.setAttribute('aria-controls','belleSettingsPanel');
 trigger.setAttribute('title',words[getBelleLocale()].gear);
 trigger.setAttribute('aria-label',words[getBelleLocale()].gear);
 trigger.dataset.i18nSkip='';
 trigger.innerHTML=icon;
 const menu=actions.querySelector('#belleMenuButton');
 if(menu)actions.insertBefore(trigger,menu);else actions.append(trigger);
 const panel=document.createElement('section');
 panel.id='belleSettingsPanel';panel.className='belle-settings';
 panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');
 panel.setAttribute('aria-label',words[getBelleLocale()].gear);
 panel.dataset.i18nSkip='';
 panel.hidden=true;document.body.append(panel);
 let open=false;
 function refresh(){
  const word=words[getBelleLocale()];
  trigger.setAttribute('aria-label',word.gear);trigger.title=word.gear;
  panel.setAttribute('aria-label',word.gear);
  // The settings panel is small enough to rebuild without touching content,
  // canvases, shop state or the main scroll position.
  panel.innerHTML='';
  const head=document.createElement('div');
  head.className='belle-settings__head';
  const heading=document.createElement('div');
  heading.innerHTML='<p class="belle-settings__eyebrow"></p><h2 class="belle-settings__title"></h2>';
  heading.querySelector('.belle-settings__eyebrow')!.textContent=word.eyebrow;
  heading.querySelector('.belle-settings__title')!.textContent=word.title;
  const close=document.createElement('button');
  close.type='button';close.className='belle-settings__close';close.dataset.closeSettings='';
  close.textContent='×';close.setAttribute('aria-label',word.close);
  head.append(heading,close);
  const tg=document.createElement('section');tg.className='belle-settings__group';
  const th=document.createElement('h3');th.className='belle-settings__group-title';
  const tlabel=document.createElement('span');tlabel.textContent=word.appearance;
  const thint=document.createElement('small');thint.textContent=word.appearanceHelp;th.append(tlabel,thint);
  const choices=document.createElement('div');choices.className='belle-settings__themes';choices.setAttribute('role','group');choices.setAttribute('aria-label',word.appearance);
  for(const item of themes){
   const btn=document.createElement('button');btn.type='button';btn.className='belle-settings__theme';btn.dataset.themeOption=item;
   btn.setAttribute('aria-pressed',String(theme===item));
   const sample=document.createElement('span');sample.className='belle-settings__sample belle-settings__sample--'+item;sample.setAttribute('aria-hidden','true');
   const label=document.createElement('span');label.className='belle-settings__theme-name';label.textContent=word[item];btn.append(sample,label);
   choices.append(btn);
  }
  tg.append(th,choices);
  const lg=document.createElement('section');lg.className='belle-settings__group';
  const lh=document.createElement('h3');lh.className='belle-settings__group-title';
  const llabel=document.createElement('span');llabel.textContent=word.language;
  const lhint=document.createElement('small');lhint.textContent=word.languageHelp;lh.append(llabel,lhint);
  const languageGrid=document.createElement('div');languageGrid.className='belle-settings__languages';
  languageGrid.setAttribute('role','group');languageGrid.setAttribute('aria-label',word.language);
  for(const item of langs){
   const btn=document.createElement('button');btn.type='button';btn.className='belle-settings__language';btn.dataset.langOption=item.id;
   btn.setAttribute('aria-pressed',String(getBelleLocale()===item.id));
   const iso=document.createElement('span');iso.className='belle-settings__lang-iso';iso.textContent=item.iso;
   const name=document.createElement('span');name.className='belle-settings__lang-name';name.textContent=item.name;
   btn.append(iso,name);languageGrid.append(btn);
  }
  lg.append(lh,languageGrid);
  const foot=document.createElement('p');foot.className='belle-settings__foot';foot.textContent=word.footer;
  panel.append(head,tg,lg,foot);
 }
 function toggle(value:boolean,restore=false){
  if(value===open)return;
  open=value;panel.hidden=!open;
  trigger.setAttribute('aria-expanded',String(open));
  if(open){
   refresh();panel.querySelector<HTMLButtonElement>('[data-close-settings]')?.focus({preventScroll:true});
  }else if(restore)trigger.focus({preventScroll:true});
 }
 trigger.addEventListener('click',()=>toggle(!open));
 panel.addEventListener('click',event=>{
  const target=event.target as Element;
  if(target.closest('[data-close-settings]')){toggle(false,true);return;}
  const themeButton=target.closest<HTMLButtonElement>('[data-theme-option]');
  if(themeButton){setBelleTheme(themeButton.dataset.themeOption as BelleTheme);refresh();return;}
  const langButton=target.closest<HTMLButtonElement>('[data-lang-option]');
  if(langButton){setBelleLocale(langButton.dataset.langOption as BelleLocale);refresh();return;}
 });
 document.addEventListener('pointerdown',event=>{
  if(open&&!panel.contains(event.target as Node)&&!trigger.contains(event.target as Node))toggle(false);
 },{passive:true});
 document.addEventListener('keydown',event=>{
  if(open&&event.key==='Escape'){event.preventDefault();toggle(false,true);}
 });
 window.addEventListener('belle:localechange',refresh);
 refresh();
}
