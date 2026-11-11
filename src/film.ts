/**
 * Orquestrador do filme (chunk principal, leve).
 * - Mede os capítulos no DOM e converte scroll nativo em progresso 0..1.
 * - Tier STATIC: pôsteres renderizados do próprio 3D, um por capítulo.
 * - Tier CINEMA/TOUCH: carrega o mundo 3D por import() depois da 1ª pintura.
 * - Provador: silhueta/tom, arraste e teclado; integração com o catálogo via bus.
 * Nunca intercepta a rolagem (sem scroll hijack).
 */
import { bus } from './core/bus';
import { productById, productBySlug } from './commerce/catalog.demo';
import { $, $$, clamp } from './core/dom';
import { detectCapabilities, resolveTier, type Tier } from './core/tier';

import type { DressParams, Silhouette, Tone } from './core/dress';
import type { Director } from './shell/director';
import type { World } from './experience/world';
import type { ChapterId, Span } from './experience/story';
import { initRoomRail } from './experience/rail-ui';

const CHAPTERS: ChapterId[] = ['vitrine', 'porta', 'sala', 'vestido', 'detalhe', 'categorias', 'provador'];
const LABELED: ChapterId[] = ['vestido', 'detalhe', 'provador'];

interface FilmDebug {
  tier: Tier;
  progress: number;
  chapter: string;
  world: () => ReturnType<World['info']> | null;
  posterReady?: boolean;
}

declare global {
  interface Window { __belle?: FilmDebug }
}

export function initFilm(director: Director): void {
  const film = $('#filme');
  const stage = $('#filmStage');
  const canvasHost = $('#filmCanvas');
  const postersHost = $('#filmPosters');
  const label = $('#filmLabel');
  const bar = $('#filmProgress');
  if (!film || !stage || !canvasHost || !postersHost) return;

  const params = new URLSearchParams(location.search);
  const posterMode = params.get('poster') as ChapterId | null;
  const forced = params.get('tier');
  const caps = detectCapabilities();
  let tier: Tier = posterMode ? 'cinema' : resolveTier(caps, director.get(), forced);
  let world: World | null = null;
  let loading = false;
  let spans: Span[] = [];
  let progress = 0;
  let active: ChapterId = 'vitrine';
  let filmTop = 0;
  let range = 1;
  const dressParams: DressParams = { silhouette: 'fluido', tone: 'perola', productId: 'belle-demo-vestidos-01' };

  document.documentElement.dataset.tier = tier;
  const debug: FilmDebug = { tier, progress: 0, chapter: active, world: () => world?.info() ?? null };
  window.__belle = debug;
  const roomRail = initRoomRail(stage!, () => world);

  // ---------- medição ----------
  const articles = CHAPTERS.map((id) => $(`[data-chapter="${id}"]`, film)).filter(Boolean) as HTMLElement[];
  function measure(): void {
    const fr = film!.getBoundingClientRect();
    filmTop = fr.top + scrollY;
    range = Math.max(1, film!.offsetHeight - innerHeight);
    spans = articles.map((el) => {
      const r = el.getBoundingClientRect();
      const top = r.top + scrollY - filmTop;
      return {
        id: el.dataset.chapter as ChapterId,
        s: clamp(top / range, 0, 1),
        e: clamp((top + el.offsetHeight - innerHeight) / range, 0, 1),
      };
    });
    world?.setSpans(spans);
    onScroll();
  }

  // ---------- pôsteres (STATIC e fundo antes do 3D) ----------
  const posterEls = new Map<string, HTMLElement>();
  const first = $<HTMLImageElement>('[data-poster="vitrine"]', postersHost);
  if (first) posterEls.set('vitrine', first);
  function poster(id: ChapterId): HTMLElement {
    let el = posterEls.get(id);
    if (!el) {
      const pic = document.createElement('picture');
      pic.className = 'film__poster';
      pic.dataset.poster = id;
      pic.innerHTML = `<source media="(max-aspect-ratio: 4/5)" srcset="/posters/${id}-p.jpg"><img src="/posters/${id}.jpg" alt="" width="1600" height="1000" decoding="async">`;
      postersHost!.appendChild(pic);
      posterEls.set(id, pic);
      el = pic;
    }
    return el;
  }
  // a primeira imagem também ganha versão retrato
  if (first && !first.closest('picture')) {
    const pic = document.createElement('picture');
    pic.className = first.className;
    pic.dataset.poster = 'vitrine';
    first.className = '';
    first.removeAttribute('data-poster');
    first.replaceWith(pic);
    pic.innerHTML = '<source media="(max-aspect-ratio: 4/5)" srcset="/posters/vitrine-p.jpg">';
    pic.appendChild(first);
    posterEls.set('vitrine', pic);
  }
  function showPoster(id: ChapterId): void {
    const el = poster(id);
    posterEls.forEach((p, key) => p.classList.toggle('is-active', key === id));
    // pré-carrega o próximo
    const next = CHAPTERS[CHAPTERS.indexOf(id) + 1];
    if (next && tier === 'static') poster(next);
    void el;
  }

  // Arara física: integrada exclusivamente ao renderer Three.js.
  // Não existe uma segunda arara HTML sobreposta ao filme.

  // ---------- scroll → progresso ----------
  let ticking = false;
  function onScroll(): void {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      progress = clamp((scrollY - filmTop) / range, 0, 1);
      // "dentro do filme" só enquanto o palco cobre a maior parte da tela
      document.documentElement.classList.toggle('in-film', scrollY >= filmTop - innerHeight * 0.3 && scrollY <= filmTop + range + innerHeight * 0.15);
      debug.progress = progress;
      if (bar) bar.style.setProperty('--p', progress.toFixed(4));
      world?.setProgress(progress);
      let current: ChapterId = spans[0]?.id ?? 'vitrine';
      for (const sp of spans) if (progress >= sp.s - 0.012) current = sp.id;
      if (current !== active) setActive(current);
    });
  }
  function setActive(id: ChapterId): void {
    active = id;
    debug.chapter = id;
    document.documentElement.dataset.filmChapter = id;
    $$('[data-chapter-link]').forEach((a) => {
      const on = a.dataset.chapterLink === (id === 'vitrine' ? 'inicio' : id);
      a.toggleAttribute('aria-current', on);
      if (on) a.setAttribute('aria-current', 'step');
    });
    if (label) label.hidden = !LABELED.includes(id);
    // A câmera continua no cômodo enquanto exploramos a arara física.
    const onRoomRail = id === 'sala' && !posterMode && tier !== 'static';
    stage!.classList.toggle('is-room-rail', onRoomRail);
    roomRail.setActive(onRoomRail);
    world?.setRailEngaged(onRoomRail);
    if (!stage!.classList.contains('is-live')) showPoster(id);
    bus.emit('film:chapter', { id, index: CHAPTERS.indexOf(id) });
  }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => requestAnimationFrame(measure), { passive: true });
  if ('fonts' in document) document.fonts.ready.then(measure).catch(() => undefined);
  // Product previews can change chapter heights after font/image readiness.
  // Recompute normalized spans whenever the real document geometry changes.
  if (typeof ResizeObserver !== 'undefined') {
    const geometryObserver = new ResizeObserver(measure);
    geometryObserver.observe(film);
    articles.forEach(article => geometryObserver.observe(article));
  }
  measure();
  setActive('vitrine');

  // ---------- glass atelier · estreia editorial dos capítulos ----------
  // Progressive enhancement: all text remains accessible without JS/3D.
  // A single observer plays a one-shot reveal; no perpetual scroll handler
  // and no filter animation on low-powered mobile devices.
  const glassCards=Array.from(film.querySelectorAll<HTMLElement>('.chapter__card'));
  const reducedGlass=matchMedia('(prefers-reduced-motion: reduce)');
  glassCards.forEach(card=>{
    const glint=document.createElement('i');
    glint.className='chapter__glint';
    glint.setAttribute('aria-hidden','true');
    card.prepend(glint);
    if(matchMedia('(pointer:fine)').matches && !reducedGlass.matches){
      let raf=0,lastX=0,lastY=0;
      card.addEventListener('pointermove',event=>{
        lastX=event.clientX;lastY=event.clientY;
        if(raf)return;
        raf=requestAnimationFrame(()=>{
          raf=0;
          // At most one CSS style update per painted frame.
          const r=card.getBoundingClientRect();
          card.style.setProperty('--glass-x',((lastX-r.left)/Math.max(1,r.width)*100).toFixed(1)+'%');
          card.style.setProperty('--glass-y',((lastY-r.top)/Math.max(1,r.height)*100).toFixed(1)+'%');
        });
      },{passive:true});
    }
  });
  const glassObserver=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      const card=entry.target as HTMLElement;
      card.classList.add('is-glass-appeared');
      glassObserver.unobserve(card);
      if(!reducedGlass.matches && !document.documentElement.classList.contains('poster-mode')){
        card.animate([
          {opacity:0.62,transform:'translate3d(0,22px,0) scale(.985)'},
          {opacity:1,transform:'translate3d(0,0,0) scale(1)'}
        ],{duration:720,easing:'cubic-bezier(.16,1,.3,1)'});
      }
    }
  },{threshold:0.13,rootMargin:'0px 0px -6% 0px'});
  glassCards.forEach(card=>glassObserver.observe(card));

  // ---------- 3D sob demanda ----------
  async function startWorld(): Promise<void> {
    if (world || loading || tier === 'static') return;
    loading = true;
    stage!.classList.add('is-loading');
    try {
      // Critical: do not initialize WebGL or compile shaders while the short
      // opening curtain is on screen. Poster paints immediately without stalling.
      if (!posterMode) {
        await new Promise<void>(resolve => window.setTimeout(resolve, 1050));
        if ((tier as Tier) === 'static') { stage!.classList.remove('is-loading'); return; }
      }
      const mod = await import('./experience');
      if ((tier as Tier) === 'static') return;
      world = await mod.createWorld({
        container: canvasHost!,
        tier,
        poster: !!posterMode,
        governor: params.get('gov') !== 'off',
        onFirstFrame: () => {
          // A first GPU frame can precede alpha textures: avoid empty facade windows.
          const current=world;
          void current?.readyEntranceMedia().then(()=>{
            if(world!==current)return;
            stage!.classList.remove('is-loading');
            stage!.classList.add('is-live');
          }).catch(()=>stage!.classList.remove('is-loading'));
        },
        onFail: (reason) => {
          console.warn('[belle] 3D desativado, usando pôsteres:', reason);
          stopWorld();
          tier = 'static';
          document.documentElement.dataset.tier = tier;
          debug.tier = tier;
          showPoster(active);
        },
      });
      world.setSpans(spans);
      world.setDress(dressParams);
      await world.readyMedia();
      world.setProgress(progress, true);
      world.setRailEngaged(active === 'sala');
      roomRail.refresh();
      mod.initReveals(film!);
      if (posterMode) {
        const sp = spans.find((s) => s.id === posterMode);
        const p = sp ? sp.s + (sp.e - sp.s) * (posterMode === 'vestido' ? 0.95 : posterMode === 'provador' ? 0.35 : 0.5) : 0;
        if (posterMode === 'provador') world.setProgress(p, true);
        world.renderPoster(p);
        debug.posterReady = true;
      }
    } catch (err) {
      console.warn('[belle] falha ao carregar o 3D, mantendo pôsteres', err);
      stage!.classList.remove('is-loading');
      tier = 'static';
      document.documentElement.dataset.tier = tier;
      roomRail.setActive(false);
    } finally {
      loading = false;
    }
  }
  function stopWorld(): void {
    world?.destroy();
    world = null;
    roomRail.refresh();
    stage!.classList.remove('is-live', 'is-loading');
    showPoster(active);
  }

  // visibilidade do palco → liga/desliga o render loop
  new IntersectionObserver((entries) => {
    const vis = entries.some((e) => e.isIntersecting);
    world?.setVisible(vis);
  }, { rootMargin: '0px' }).observe(film);

  if (posterMode) {
    document.documentElement.classList.add('poster-mode', 'intro-seen');
    startWorld();
  } else if (tier !== 'static') {
    const preload = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      preload.disconnect();
      void startWorld();
    }, { rootMargin: '200px' });
    preload.observe(film);
  }

  director.onChange((intensity) => {
    const next = resolveTier(caps, intensity, forced);
    if (next === tier) return;
    tier = next;
    document.documentElement.dataset.tier = tier;
    debug.tier = tier;
    if (tier === 'static') stopWorld();
    else startWorld();
  });

  // ---------- ponteiro e arraste ----------
  const fine = matchMedia('(pointer: fine)').matches;
  if (fine) {
    addEventListener('pointermove', (e) => {
      if (!world) return;
      world.setPointer((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
    }, { passive: true });
    document.addEventListener('pointerleave', () => world?.setPointer(null));
  }
  let drag: { x: number; y: number; locked: boolean | null } | null = null;
  stage.addEventListener('pointerdown', (e) => {
    if (active !== 'provador') return;
    drag = { x: e.clientX, y: e.clientY, locked: null };
  });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (drag.locked === null && Math.hypot(dx, dy) > 6) drag.locked = Math.abs(dx) > Math.abs(dy);
    if (drag.locked) {
      world?.drag(dx / innerWidth);
      drag.x = e.clientX;
      drag.y = e.clientY;
    }
  }, { passive: true });
  addEventListener('pointerup', () => (drag = null));
  addEventListener('pointercancel', () => (drag = null));

  // ---------- provador · catálogo demonstrativo com cinco vestidos ----------
  // Os recortes são distintos e suas cores pertencem a cada peça.
  // Não inventar tonalidades/variantes que não existam no manifesto.
  const fitting = $('#fitting');
  const fittingStatic = $('#fittingStatic');
  const choices = $<HTMLElement>('#fittingChoices');
  const tones = $<HTMLElement>('#fittingTones');
  const fittingSelection = $<HTMLElement>('#fittingSelection');
  const selectedSlugs = ['vestidos-01','vestidos-02','vestidos-03','vestidos-05','vestidos-06'] as const;
  const selectedDresses = selectedSlugs.map(slug => productBySlug(slug)).filter((p): p is NonNullable<typeof p> => !!p);
  const colorMap: Record<string,string> = {
    'vestidos-01':'#ceb38b','vestidos-02':'#722b3c','vestidos-03':'#f0e6d3',
    'vestidos-05':'#abc5dc','vestidos-06':'#272326',
  };
  function selectDress(id: string): void {
    const selected = selectedDresses.find(p => p.id === id);
    if(!selected) return;
    dressParams.productId = selected.id;
    dressParams.silhouette = selected.silhouette ?? 'fluido';
    dressParams.tone = selected.tone;
    dressParams.label = selected.title;
    syncFitting();
  }
  function buildFittingControls(): void {
    if(!choices || !tones) return;
    choices.replaceChildren(...selectedDresses.map((p, i)=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='fitting__choice';
      button.dataset.dressId=p.id;
      button.setAttribute('aria-pressed','false');
      const number=document.createElement('span');
      number.className='fitting__number';
      number.textContent=String(i+1).padStart(2,'0');
      const title=document.createElement('span');
      title.className='fitting__model';
      title.textContent=p.title;
      button.append(number,title);
      return button;
    }));
    tones.replaceChildren(...selectedDresses.map(p=>{
      const button=document.createElement('button');
      button.type='button';
      button.className='fitting__tone';
      button.dataset.dressId=p.id;
      button.setAttribute('aria-pressed','false');
      button.setAttribute('aria-label',p.color+' · '+p.title);
      const sw=document.createElement('i');
      sw.className='fitting__swatch';
      sw.style.setProperty('--sw',colorMap[p.slug] ?? '#ceb38b');
      const name=document.createElement('span');
      name.textContent=p.color;
      button.append(sw,name);
      return button;
    }));
  }
  function syncFitting(): void {
    const selected = productById(dressParams.productId ?? '') ?? selectedDresses[0];
    if(!selected) return;
    choices?.querySelectorAll<HTMLButtonElement>('[data-dress-id]').forEach(btn=>
      btn.setAttribute('aria-pressed',String(btn.dataset.dressId===selected.id)));
    tones?.querySelectorAll<HTMLButtonElement>('[data-dress-id]').forEach(btn=>
      btn.setAttribute('aria-pressed',String(btn.dataset.dressId===selected.id)));
    if(fittingSelection) fittingSelection.textContent=selected.title+' · '+selected.color;
    if (fittingStatic && selected.cutout) {
      // Reuse the exact same image loaded by the WebGL fitting display.
      // Keep this as an accessible/fallback rendering; no made-up 360-degree garment.
      fittingStatic.dataset.productId=selected.id;
      fittingStatic.replaceChildren();
      const image=document.createElement('img');
      image.className='editorial-cutout';
      image.src=selected.cutout;
      image.alt=selected.title+' · vista frontal demonstrativa';
      image.width=selected.cutoutSize?.[0] ?? 600;
      image.height=selected.cutoutSize?.[1] ?? 900;
      const caption=document.createElement('p');
      caption.className='fineprint';
      caption.textContent=selected.title+' · produto demonstrativo, estoque sob consulta';
      fittingStatic.append(image,caption);
    }
    world?.setDress(dressParams);
  }
  buildFittingControls();
  fitting?.addEventListener('click',(event)=>{
    const button=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-dress-id]');
    if(!button || !fitting.contains(button))return;
    selectDress(button.dataset.dressId ?? '');
  });
  fitting?.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if ((e.target as HTMLElement).closest('fieldset')) return; // não rouba setas dos grupos
    e.preventDefault();
    world?.rotate(e.key === 'ArrowRight' ? 0.35 : -0.35);
  });
  $('#fittingToCatalog')?.addEventListener('click', () => {
    bus.emit('catalog:filter', { category: 'vestidos', silhouette: dressParams.silhouette });
  });
  bus.on('dress:try', (p) => {
    const requested=selectedDresses.find(d=>d.id===p.productId)
      ??selectedDresses.find(d=>d.tone===p.tone)
      ??selectedDresses[0];
    if(requested)selectDress(requested.id);
    const sp = spans.find((s) => s.id === 'provador');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (sp) scrollTo({ top: filmTop + (sp.s + (sp.e - sp.s) * 0.3) * range, behavior: reduce ? 'auto' : 'smooth' });
  });
  syncFitting();
}
