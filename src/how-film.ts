/** Belle Alencar | Scroll Couture. Progressive video scrubbing, sem scroll hijack. */
import type { Director } from './shell/director';

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (a: number, b: number, n: number) => {
  const t = clamp((n - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function initHowFilm(director: Director): () => void {
  const section = document.querySelector<HTMLElement>('#como-comprar');
  const video = section?.querySelector<HTMLVideoElement>('[data-how-video]');
  const bottom = section?.querySelector<HTMLElement>('.how__bottom');
  const cards = section ? Array.from(section.querySelectorAll<HTMLElement>('.how__steps li')) : [];
  if (!section || !video || !bottom || cards.length !== 4) return () => {};

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const lowTier = !!connection?.saveData || (typeof memory === 'number' && memory < 2);
  const canScrub = () => !!video.canPlayType('video/mp4') && !lowTier && !reducedMotion.matches;
  let observed = false;
  let loaded = false;
  let enhanced = false;
  let seeking = false;
  let destroyed = false;
  let frame = 0;
  let lastProgress = -1;
  let targetTime = 0;
  let lastInteractive = false;
  let intersection: IntersectionObserver | null = null;
  let resizeObserver: ResizeObserver | null = null;
  // Prevent the global floating contact button from covering section CTAs.
  const visibility = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(entries => {
    document.body.classList.toggle('is-how-visible', entries.some(entry => entry.isIntersecting));
  }, { threshold: 0.01 }) : null;
  visibility?.observe(section);

  // Fonte selecionada apenas ao se aproximar da seção. Nada de download no LCP.
  const loadMedia = () => {
    if (observed || !canScrub() || director.get() === 'essential') return;
    observed = true;
    // A video under 2 MB can buffer when the chapter approaches; do not
    // aggressively fetch it during the first hero's LCP.
    video.preload = 'auto';
    video.src = matchMedia('(max-width: 699px)').matches
      ? '/media/belle-scroll-mobile.mp4'
      : '/media/belle-scroll-desktop.mp4';
    video.load();
  };

  const attemptSeek = () => {
    if (!enhanced || !loaded || seeking || destroyed) return;
    if (Math.abs(video.currentTime - targetTime) < 0.045) return;
    try {
      seeking = true;
      video.currentTime = targetTime;
    } catch {
      seeking = false; // Falha de decodificação: o poster permanece útil.
    }
  };

  const render = () => {
    frame = 0;
    if (!enhanced || destroyed) return;
    const rect = section.getBoundingClientRect();
    const maxScroll = Math.max(1, section.offsetHeight - window.innerHeight);
    const progress = clamp(-rect.top / maxScroll);
    if (Math.abs(progress - lastProgress) < 0.0005) return;
    lastProgress = progress;

    // A passarela tem primazia até o tecido encostar na câmera.
    // Word-mask / editorial reveal follows the same scroll progress as video.
    section.style.setProperty('--how-title',String(smooth(0.0,0.19,progress)));
    section.style.setProperty('--how-intro', String(1 - smooth(0.24, 0.50, progress)));
    // The dress arrives first; four solid cards follow in a measured
    // golden cascade. Every number is derived from progress, so returning
    // upward automatically reverses the animation without a second timeline.
    section.style.setProperty('--how-wash', String(smooth(0.59, 0.94, progress)));
    section.style.setProperty('--how-bottom', String(smooth(0.61, 0.71, progress)));
    section.style.setProperty('--how-foot', String(smooth(0.90, 0.975, progress)));
    section.style.setProperty('--how-gold', String(smooth(0.56, 0.96, progress)));
    const mobile = window.innerWidth <= 600;
    cards.forEach((card, i) => {
      // Distinct arrivals. The stronger throw begins as the dress clears
      // the camera, but each card stays entirely driven by scroll position.
      const a = 0.642 + i * 0.059;
      const reveal = smooth(a, a + 0.146, progress);
      const sign = i % 2 === 0 ? -1 : 1;
      const settle = smooth(0,1,reveal);
      const overshoot = Math.sin(Math.PI*reveal) * (mobile ? .078 : .125);
      const scale = (mobile ? .48 : .33) + (mobile ? .52 : .67) * settle + overshoot;
      card.style.setProperty('--how-card', String(reveal));
      card.style.setProperty('--how-card-opacity', String(smooth(0, 0.23, reveal)));
      card.style.setProperty('--how-card-x', `${(sign * (mobile ? 44 : 164) * (1 - reveal)).toFixed(2)}px`);
      card.style.setProperty('--how-card-y', `${((mobile ? 88 : 186) * (1 - reveal)).toFixed(2)}px`);
      card.style.setProperty('--how-card-z', `${((mobile ? -58 : -280) * (1 - reveal)).toFixed(2)}px`);
      card.style.setProperty('--how-card-rotation', `${(sign * (mobile ? 14 : 30) * (1 - reveal)).toFixed(2)}deg`);
      card.style.setProperty('--how-card-tilt-x', `${((mobile ? 7 : 19) * (1 - reveal)).toFixed(2)}deg`);
      card.style.setProperty('--how-card-tilt-z', `${(sign * (mobile ? 3 : 8) * (1 - reveal)).toFixed(2)}deg`);
      card.style.setProperty('--how-card-scale', scale.toFixed(4));
      card.style.setProperty('--how-card-glow', String(smooth(0.28, 0.89, reveal)));
      card.style.setProperty('--how-card-impact', (Math.sin(Math.PI*reveal)**2).toFixed(4));
      // Light loop starts only after each solid card has landed; reverses on scroll-up.
      card.classList.toggle('is-how-settled', reveal >= 0.995);
    });

    const interactive = progress >= 0.955;
    if (interactive !== lastInteractive) {
      lastInteractive = interactive;
      bottom.inert = !interactive;
      section.classList.toggle('how--interactive', interactive);
    }
    if (loaded) {
      const safeEnd = Math.max(0, video.duration - 0.06);
      targetTime = safeEnd * smooth(0.01, 0.90, progress);
      attemptSeek();
    }
  };

  const schedule = () => {
    if (!frame && !destroyed) frame = requestAnimationFrame(render);
  };

  const activate = () => {
    if (!loaded || enhanced || director.get() === 'essential' || reducedMotion.matches) return;
    enhanced = true;
    lastInteractive = false;
    bottom.inert = true;
    section.classList.add('how--enhanced');
    lastProgress = -1;
    schedule();
  };

  const restore = () => {
    enhanced = false;
    bottom.inert = false;
    section.classList.remove('how--enhanced', 'how--interactive', 'how--video-ready');
    for (const key of ['--how-title', '--how-intro', '--how-wash', '--how-bottom', '--how-foot', '--how-gold']) section.style.removeProperty(key);
    cards.forEach(card => {
      card.classList.remove('is-how-settled');
      for (const name of ['--how-card', '--how-card-opacity', '--how-card-x',
        '--how-card-y', '--how-card-z', '--how-card-rotation', '--how-card-scale',
        '--how-card-glow', '--how-card-impact', '--how-card-tilt-x',
        '--how-card-tilt-z']) card.style.removeProperty(name);
    });
    lastProgress = -1;
    seeking = false;
    video.pause();
  };

  const onMetadata = () => {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    loaded = true;
    activate();
  };
  const onSeeked = () => {
    seeking = false;
    if (!enhanced) return;
    section.classList.add('how--video-ready');
    // Uma busca pode terminar depois de um scroll rápido: perseguir o último alvo.
    attemptSeek();
  };
  const onError = () => restore();
  const onPageShow = () => { lastProgress = -1; schedule(); };
  const onMotion = () => {
    if (director.get() === 'essential') restore();
    else { loadMedia(); activate(); }
  };
  const onReduced = () => {
    if (reducedMotion.matches) restore();
    else if (canScrub()) { loadMedia(); activate(); }
  };

  video.addEventListener('loadedmetadata', onMetadata);
  video.addEventListener('seeked', onSeeked);
  video.addEventListener('error', onError);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', onPageShow);
  reducedMotion.addEventListener?.('change', onReduced);
  director.onChange(onMotion);

  if (canScrub() && director.get() !== 'essential') {
    if ('IntersectionObserver' in window) {
      intersection = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { loadMedia(); intersection?.disconnect(); }
      }, { rootMargin: '700px 0px' });
      intersection.observe(section);
    } else loadMedia();
  }
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(section);
  }
  return () => {
    destroyed = true;
    if (frame) cancelAnimationFrame(frame);
    intersection?.disconnect();
    visibility?.disconnect();
    document.body.classList.remove('is-how-visible');
    resizeObserver?.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    window.removeEventListener('pageshow', onPageShow);
    reducedMotion.removeEventListener?.('change', onReduced);
    video.removeEventListener('loadedmetadata', onMetadata);
    video.removeEventListener('seeked', onSeeked);
    video.removeEventListener('error', onError);
    restore();
  };
}
