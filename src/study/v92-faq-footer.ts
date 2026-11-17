/**
 * Belle V92 · Published FAQ + Footer editorial section.
 * Reuses Belle's real theme/i18n state and real FAQ content.
 * The newsletter is explicitly a no-submission visual demonstration until a mailing provider is connected.
 */
import { getBelleLocale, type BelleLocale } from '../preferences/i18n';
import { setBelleTheme, type BelleTheme } from '../preferences/settings';

const copy:Record<BelleLocale,Record<string,string>>={
  pt:{
    faqEyebrow:'CONVERSA ABERTA',faqLineA:'Antes de',faqLineB:'escolher.',
    faqNote:'Sua experiência começa com as respostas certas. Escolha com calma, a Belle acompanha.',
    themeLabel:'Tema do estudo',newsletterEyebrow:'CARTA BELLE',newsletterTitle:'Novidades da Belle',
    emailLabel:'Seu e-mail',subscribe:'Quero receber',
    formHelp:'Prévia de cadastro. Nenhum e-mail é enviado.',
    formResult:'E-mail validado no estudo. Nenhum cadastro foi realizado.',
    explore:'EXPLORE',collection:'Coleção',runway:'Passarela',stores:'Nossas lojas',
    how:'Como comprar',connect:'CONECTE',instagram:'Instagram',consult:'Atendimento',
    belleDescriptor:'MODA & ACESSÓRIOS',creditLineA:'ESTRATÉGIA DE MARCA · DIREÇÃO CRIATIVA',
    creditLineB:'DESIGN DE EXPERIÊNCIA · ENGENHARIA DE DESIGN',
    light:'Claro',rose:'Rosé Gold',dark:'Escuro'
  },
  en:{
    faqEyebrow:'OPEN CONVERSATION',faqLineA:'Before you',faqLineB:'choose.',
    faqNote:'A thoughtful choice begins with clear answers. Take your time, Belle is here to help.',
    themeLabel:'Preview theme',newsletterEyebrow:'THE BELLE LETTER',newsletterTitle:'What’s new at Belle',
    emailLabel:'Your email',subscribe:'Get updates',
    formHelp:'Signup preview. No email will be sent.',
    formResult:'Email validated for this preview. No signup was submitted.',
    explore:'EXPLORE',collection:'Collection',runway:'Runway',stores:'Our stores',
    how:'How to shop',connect:'CONNECT',instagram:'Instagram',consult:'Style assistance',
    belleDescriptor:'FASHION & ACCESSORIES',creditLineA:'BRAND STRATEGY · CREATIVE DIRECTION',
    creditLineB:'EXPERIENCE DESIGN · DESIGN ENGINEERING',
    light:'Light',rose:'Rosé Gold',dark:'Dark'
  },
  es:{
    faqEyebrow:'CONVERSACIÓN ABIERTA',faqLineA:'Antes de',faqLineB:'elegir.',
    faqNote:'Una buena elección empieza con respuestas claras. Tómate tu tiempo, Belle te acompaña.',
    themeLabel:'Tema del estudio',newsletterEyebrow:'CARTA BELLE',newsletterTitle:'Novedades de Belle',
    emailLabel:'Tu correo',subscribe:'Quiero recibir',
    formHelp:'Vista previa del registro. No se envía ningún correo.',
    formResult:'Correo validado en el estudio. No se realizó ningún registro.',
    explore:'EXPLORA',collection:'Colección',runway:'Pasarela',stores:'Nuestras tiendas',
    how:'Cómo comprar',connect:'CONECTA',instagram:'Instagram',consult:'Asesoría',
    belleDescriptor:'MODA Y ACCESORIOS',creditLineA:'ESTRATEGIA DE MARCA · DIRECCIÓN CREATIVA',
    creditLineB:'DISEÑO DE EXPERIENCIAS · INGENIERÍA DE DISEÑO',
    light:'Claro',rose:'Rosé Gold',dark:'Oscuro'
  },
  it:{
    faqEyebrow:'CONVERSAZIONE APERTA',faqLineA:'Prima di',faqLineB:'scegliere.',
    faqNote:'Una scelta consapevole inizia dalle risposte giuste. Prenditi il tuo tempo, Belle è con te.',
    themeLabel:'Tema dello studio',newsletterEyebrow:'LETTERA BELLE',newsletterTitle:'Novità da Belle',
    emailLabel:'La tua email',subscribe:'Voglio ricevere',
    formHelp:'Anteprima iscrizione. Nessuna email viene inviata.',
    formResult:'Email convalidata nello studio. Nessuna iscrizione effettuata.',
    explore:'ESPLORA',collection:'Collezione',runway:'Passerella',stores:'I nostri negozi',
    how:'Come acquistare',connect:'CONTATTI',instagram:'Instagram',consult:'Assistenza',
    belleDescriptor:'MODA E ACCESSORI',creditLineA:'STRATEGIA DI MARCA · DIREZIONE CREATIVA',
    creditLineB:'DESIGN DELL’ESPERIENZA · INGEGNERIA DEL DESIGN',
    light:'Chiaro',rose:'Rosé Gold',dark:'Scuro'
  }
};
export function initBelleV89Study(){
  const section=document.querySelector<HTMLElement>('.faq--studio');
  const footer=document.querySelector<HTMLElement>('.site-footer--studio');
  if(!section||!footer)return;
  const theme=document.querySelector<HTMLSelectElement>('#v89ThemeControl');
  const form=document.querySelector<HTMLFormElement>('#v89NewsletterStudy');
  const status=document.querySelector<HTMLElement>('#v89NewsletterStatus');
  const qa=Array.from(section.querySelectorAll<HTMLDetailsElement>('.v89-faq__list details'));
  if(qa[0]&&!qa.some(x=>x.open))qa[0].open=true;
  // Exactly one expanded answer: accordion remains keyboard/native details accessible.
  for(const item of qa)item.addEventListener('toggle',()=>{
    if(item.open)for(const other of qa)if(other!==item)other.open=false;
  });
  const refresh=()=>{
    const locale=getBelleLocale();
    const words=copy[locale];
    for(const el of document.querySelectorAll<HTMLElement>('[data-v89-key]')){
      const key=el.dataset.v89Key||'';
      if(key==='formHelp'&&el.dataset.v89Submitted==='true')el.textContent=words.formResult??'';
      else if(words[key]!==undefined)el.textContent=words[key];
    }
    if(theme){
      const current=document.documentElement.dataset.belleTheme||'light';
      theme.value=current;
      for(const option of theme.options)option.textContent=words[option.value]||option.value;
      theme.setAttribute('aria-label',words.themeLabel??'Tema do estudo');
    }
  };
  theme?.addEventListener('change',()=>{
    const value=theme.value as BelleTheme;
    if(value==='light'||value==='rose'||value==='dark')setBelleTheme(value);
  });
  window.addEventListener('belle:themechange',refresh);
  window.addEventListener('belle:localechange',refresh);
  form?.addEventListener('submit',(event)=>{
    event.preventDefault();
    // Demonstration only. Never reads, transmits, stores, logs, or sends email data.
    if(!form.checkValidity()){form.reportValidity();return;}
    if(status){
      status.dataset.v89Submitted='true';
      status.textContent=copy[getBelleLocale()].formResult??'Nenhum cadastro foi enviado.';
    }
    const input=form.querySelector<HTMLInputElement>('input[type="email"]');
    if(input)input.value='';
  });
  refresh();
}