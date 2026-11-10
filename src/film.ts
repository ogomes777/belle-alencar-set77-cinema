/**
 * Orquestrador do filme (chunk principal, leve).
 * - Mede os capítulos no DOM e converte scroll nativo em progresso 0..1.
 * - Tier STATIC: pôsteres renderizados do próprio 3D, um por capítulo.
 * - Tier CINEMA/TOUCH: carrega o mundo 3D por import() depois da 1ª pintura.
 * - Provador: silhueta/tom, arraste e teclado; integração com o catálogo via bus.
 * Nunca intercepta a rolagem (sem scroll hijack).
 */
import { bus } from './core/bus';
import { $, $$, clamp } from './core/dom';
import { detectCapabilities, resolveTier, type Tier } from './core/tier';
import { illustrate } from './core/illustration';
import type { DressParams, Silhouette, Tone } from './core/dress';
import type { Director } from './shell/director';
import type { World } from './experience/world';
import type { ChapterId, Span } from './experience/story';
import type { RackController } from './rack/rack';

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
  const dressParams: DressParams = { silhouette: 'fluido', tone: 'perola' };

  document.documentElement.dataset.tier = tier;
  const debug: FilmDebug = { tier, progress: 0, chapter: active, world: () => world?.info() ?? null };
  window.__belle = debug;

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

  // ---------- arara viva (independente do WebGL: funciona em todos os tiers) ----------
  let rack: RackController | null = null;
  let rackLoading: Promise<RackController | null> | null = null;
  function ensureRack(): Promise<RackController | null> {
    if (rack) return Promise.resolve(rack);
    if (!rackLoading) {
      rackLoading = import('./rack/rack')
        .then((m) => {
          rack = m.initRack(stage!, $('[data-chapter="sala"] .chapter__card', film!));
          (window as Window & { __rack?: RackController }).__rack = rack;
          return rack;
        })
        .catch((e) => { console.warn('[belle] arara indisponível', e); return null; });
    }
    return rackLoading;
  }

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
    // arara viva: assume o palco quando a câmera chega à arara
    const onRack = id === 'sala' && !posterMode;
    stage!.classList.toggle('is-rack', onRack);
    if (onRack) void ensureRack().then((r) => r?.setActive(active === 'sala'));
    else rack?.setActive(false);
    if (!world) showPoster(id);
    bus.emit('film:chapter', { id, index: CHAPTERS.indexOf(id) });
  }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => requestAnimationFrame(measure), { passive: true });
  if ('fonts' in document) document.fonts.ready.then(measure).catch(() => undefined);
  measure();
  setActive('vitrine');
  // pré-carrega a arara em idle para a chegada ser instantânea
  if (!posterMode) {
    const pre = () => setTimeout(() => void ensureRack(), 1200);
    if (document.readyState === 'complete') pre(); else addEventListener('load', pre, { once: true });
  }

  // ---------- 3D sob demanda ----------
  async function startWorld(): Promise<void> {
    if (world || loading || tier === 'static') return;
    loading = true;
    stage!.classList.add('is-loading');
    try {
      const mod = await import('./experience');
      if ((tier as Tier) === 'static') return;
      world = await mod.createWorld({
        container: canvasHost!,
        tier,
        poster: !!posterMode,
        governor: params.get('gov') !== 'off',
        onFirstFrame: () => {
          stage!.classList.remove('is-loading');
          stage!.classList.add('is-live');
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
      world.setProgress(progress, true);
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
    } finally {
      loading = false;
    }
  }
  function stopWorld(): void {
    world?.destroy();
    world = null;
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

  // ---------- provador ----------
  const fitting = $('#fitting');
  const fittingStatic = $('#fittingStatic');
  function syncFitting(): void {
    $$<HTMLButtonElement>('[data-silhouette]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.silhouette === dressParams.silhouette)));
    $$<HTMLButtonElement>('[data-tone]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tone === dressParams.tone)));
    if (fittingStatic) fittingStatic.innerHTML = illustrate({ kind: 'dress', silhouette: dressParams.silhouette, tone: dressParams.tone, seed: 11 }, 'Ilustração do estudo de vestido');
    world?.setDress(dressParams);
  }
  $$<HTMLButtonElement>('[data-silhouette]').forEach((b) => b.addEventListener('click', () => {
    dressParams.silhouette = b.dataset.silhouette as Silhouette;
    syncFitting();
  }));
  $$<HTMLButtonElement>('[data-tone]').forEach((b) => b.addEventListener('click', () => {
    dressParams.tone = b.dataset.tone as Tone;
    syncFitting();
  }));
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
    dressParams.silhouette = p.silhouette;
    dressParams.tone = p.tone;
    syncFitting();
    const sp = spans.find((s) => s.id === 'provador');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (sp) scrollTo({ top: filmTop + (sp.s + (sp.e - sp.s) * 0.3) * range, behavior: reduce ? 'auto' : 'smooth' });
  });
  syncFitting();
}
