/**
 * Belle V87 · somente preview.
 * Reorganiza os elementos REAIS de comércio/preferências, sem cloná-los:
 * storeButton, searchButton, wishlistButton, bagButton e belleSettingsButton
 * mantêm seus listeners, IDs, estado e diálogos originais.
 * Temas e idiomas usam diretamente as funções oficiais de preferences/.
 */
import { getBelleLocale, setBelleLocale, type BelleLocale } from '../preferences/i18n';
import { setBelleTheme, type BelleTheme } from '../preferences/settings';

const langs: BelleLocale[] = ['pt','en','es','it'];
const themes: BelleTheme[] = ['light','dark','rose'];

const copy: Record<BelleLocale,{
  utilities:string; preferences:string; appearance:string; language:string;
  light:string; dark:string; rose:string; search:string; store:string;
  favorites:string; bag:string; settings:string; note:string
}> = {
  pt:{ utilities:'ACESSO RÁPIDO',preferences:'PREFERÊNCIAS',appearance:'TEMA',language:'IDIOMA',
    light:'Claro',dark:'Escuro',rose:'Rosé Gold',search:'Buscar',store:'Sua loja',
    favorites:'Favoritos',bag:'Sacola',settings:'Ajustes',note:'Suas escolhas são salvas neste navegador'},
  en:{ utilities:'QUICK ACCESS',preferences:'PREFERENCES',appearance:'THEME',language:'LANGUAGE',
    light:'Light',dark:'Dark',rose:'Rosé Gold',search:'Search',store:'Your store',
    favorites:'Favorites',bag:'Bag',settings:'Settings',note:'Your preferences are saved in this browser'},
  es:{ utilities:'ACCESOS RÁPIDOS',preferences:'PREFERENCIAS',appearance:'TEMA',language:'IDIOMA',
    light:'Claro',dark:'Oscuro',rose:'Rosé Gold',search:'Buscar',store:'Tu tienda',
    favorites:'Favoritos',bag:'Bolsa',settings:'Ajustes',note:'Tus preferencias se guardan en este navegador'},
  it:{ utilities:'ACCESSO RAPIDO',preferences:'PREFERENZE',appearance:'TEMA',language:'LINGUA',
    light:'Chiaro',dark:'Scuro',rose:'Rosé Gold',search:'Cerca',store:'Negozio',
    favorites:'Preferiti',bag:'Borsa',settings:'Impostazioni',note:'Le tue preferenze vengono salvate nel browser'},
};
const localeNames: Record<BelleLocale,string>={pt:'PT',en:'EN',es:'ES',it:'IT'};

function textEl(tag:string, className:string, text:string):HTMLElement {
  const el=document.createElement(tag);el.className=className;el.textContent=text;return el;
}

export function initBelleV87Preview():void {
  const panel=document.getElementById('belleMenuPanel');
  const inner=panel?.querySelector<HTMLElement>('.couture-nav__inner');
  if(!panel||!inner||document.getElementById('v87MenuTools'))return;

  const utilities=document.createElement('section');
  utilities.id='v87MenuTools';
  utilities.className='v87-tools';
  // A tradução genérica observa mutações. Nossos rótulos são traduzidos
  // explicitamente no evento localechange, evitando transformação dupla.
  utilities.dataset.i18nSkip='';
  utilities.setAttribute('aria-label','Preferências e atalhos');
  const kicker=textEl('p','v87-tools__kicker','ACESSO RÁPIDO');
  const actions=document.createElement('div');actions.className='v87-tools__actions';
  const toolMap=[
    {id:'storeButton',label:'store'},
    {id:'searchButton',label:'search'},
    {id:'wishlistButton',label:'favorites'},
    {id:'bagButton',label:'bag'},
    {id:'belleSettingsButton',label:'settings'},
  ] as const;
  const actionLabels:Record<string,HTMLElement>={};

  for(const item of toolMap){
    const real=document.getElementById(item.id);
    if(!real)continue;
    const cell=document.createElement('div');
    cell.className='v87-tools__cell v87-tools__cell--'+item.id;
    const name=textEl('span','v87-tools__action-name','');
    name.setAttribute('aria-hidden','true');
    actionLabels[item.label]=name;
    real.classList.add('v87-tools__button');
    cell.append(real,name);
    actions.append(cell);
  }
  // Remove apenas o invólucro vazio; os controles permanecem originais.
  document.getElementById('belleLocationDock')?.classList.add('v87-location-moved');
  const storeLabel=document.querySelector<HTMLElement>('#storeButton [data-store-label]');
  if(storeLabel)storeLabel.classList.add('v87-tools__store-label');

  const prefs=document.createElement('div');prefs.className='v87-tools__preferences';
  const themeGroup=document.createElement('div');themeGroup.className='v87-tools__preference';
  const themeTitle=textEl('span','v87-tools__preference-title','TEMA');
  const themeChoices=document.createElement('div');themeChoices.className='v87-tools__choices';
  themeChoices.setAttribute('role','group');themeChoices.setAttribute('aria-label','Tema');
  const themeButtons={} as Record<BelleTheme,HTMLButtonElement>;
  for(const t of themes){
    const button=document.createElement('button');
    button.type='button';button.dataset.v87Theme=t;button.className='v87-tools__choice';
    button.addEventListener('click',()=>setBelleTheme(t));
    themeChoices.append(button);themeButtons[t]=button;
  }
  themeGroup.append(themeTitle,themeChoices);

  const localeGroup=document.createElement('div');localeGroup.className='v87-tools__preference';
  const localeTitle=textEl('span','v87-tools__preference-title','IDIOMA');
  const localeChoices=document.createElement('div');localeChoices.className='v87-tools__choices';
  localeChoices.setAttribute('role','group');localeChoices.setAttribute('aria-label','Idioma');
  const languageButtons={} as Record<BelleLocale,HTMLButtonElement>;
  for(const lang of langs){
    const button=document.createElement('button');
    button.type='button';button.dataset.v87Locale=lang;
    button.className='v87-tools__choice v87-tools__choice--lang';
    button.textContent=localeNames[lang];
    button.addEventListener('click',()=>setBelleLocale(lang));
    localeChoices.append(button);languageButtons[lang]=button;
  }
  localeGroup.append(localeTitle,localeChoices);
  prefs.append(themeGroup,localeGroup);
  utilities.append(kicker,actions,prefs);
  // Os capítulos originais continuam no topo; serviços abaixo dos capítulos,
  // antes da faixa de links secundários existente.
  const secondary=inner.querySelector('.couture-nav__secondary');
  inner.insertBefore(utilities,secondary);

  const refresh=()=>{
    const locale=getBelleLocale();
    const words=copy[locale];
    kicker.textContent=words.utilities;
    themeTitle.textContent=words.appearance;
    localeTitle.textContent=words.language;
    themeChoices.setAttribute('aria-label',words.appearance);
    localeChoices.setAttribute('aria-label',words.language);
    const selected=document.documentElement.dataset.belleTheme||'light';
    for(const t of themes){
      const btn=themeButtons[t];
      btn.textContent=words[t];
      btn.setAttribute('aria-pressed',String(selected===t));
      btn.setAttribute('aria-label',words[t]);
    }
    for(const lang of langs){
      const btn=languageButtons[lang];
      btn.setAttribute('aria-pressed',String(locale===lang));
      btn.setAttribute('aria-label',({pt:'Português',en:'English',es:'Español',it:'Italiano'})[lang]);
    }
    for(const item of toolMap){
      const label=actionLabels[item.label];
      if(label)label.textContent=words[item.label];
    }
    document.documentElement.dataset.v87Preview='true';
  };

  window.addEventListener('belle:themechange',refresh);
  window.addEventListener('belle:localechange',refresh);
  refresh();
}
