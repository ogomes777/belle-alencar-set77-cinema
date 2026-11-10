/**
 * VESTIDO → BOLSA (docs do kit: BAG_FLIGHT_SPEC). Requisito obrigatório.
 * - Clone visual do MESMO recorte/variante, fundo alfa, position: fixed.
 * - Trajetória Bézier cúbica: sobe um pouco, cruza a tela e desce na boca da bolsa.
 * - Pêndulo físico em torno do gancho, excitado pela aceleração da própria trajetória;
 *   saia em camada separada com atraso (follow-through). Amplitude cai nos 25% finais.
 * - Perspectiva por escala + sombra que encolhe; entra ENTRE o fundo e o lábio frontal.
 * - Impacto só quando a barra cruza a boca; o fantasma some depois de entrar.
 * - Cancelável (Esc, resize, aba oculta): conclui o estado sem fantasma órfão.
 */
export interface FlightTarget {
  mouth(): { x: number; y: number; w: number };
  /** z-index entre fundo e frente (oclusão real) */
  ghostZ: number;
  impact(): void;
}

export interface FlightOptions {
  from: HTMLElement; // elemento visível de origem (imagem do vestido)
  image: string; // URL do mesmo recorte
  target: FlightTarget;
  onImpact: () => void; // adicionar/persistir aqui (contador só muda no impacto)
  duration?: number;
}

const prefersReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let running = false;

export function isFlying(): boolean {
  return running;
}

export function flyToBag(o: FlightOptions): Promise<void> {
  if (running) return Promise.resolve(); // idempotência: sem add duplicado
  const r0 = o.from.getBoundingClientRect();
  if (prefersReduced() || r0.width < 4) {
    o.onImpact();
    o.target.impact();
    return Promise.resolve();
  }
  running = true;
  const W = r0.width;
  const H = r0.height;
  // gancho = topo-centro do recorte (onde o vestido "pende")
  const p0 = { x: r0.left + W / 2, y: r0.top + H * 0.03 };
  const m = o.target.mouth();
  // ao fim, o vestido deve caber na boca: altura final ~ 1,25 × largura da boca
  const sEnd = Math.max(0.035, (m.w * 1.25) / H);
  const p3 = { x: m.x, y: m.y - H * sEnd * 0.35 };
  const dx = p3.x - p0.x;
  const dy = p3.y - p0.y;
  // arco: sobe com clareza, cruza a tela e desce por cima da boca da bolsa
  const lift = Math.min(260, Math.max(110, Math.hypot(dx, dy) * 0.34));
  const p1 = { x: p0.x + dx * 0.22, y: p0.y - lift };
  const p2 = { x: p3.x - Math.sign(dx || 1) * 26, y: Math.min(p3.y - H * sEnd * 2.2, p0.y - lift * 0.55) };

  const ghost = document.createElement('div');
  ghost.className = 'dress-ghost';
  ghost.style.width = `${W}px`;
  ghost.style.height = `${H}px`;
  ghost.style.zIndex = String(o.target.ghostZ);
  ghost.innerHTML = `<div class="dress-ghost__shadow"></div><div class="dress-ghost__top" style="background-image:url('${o.image}')"></div><div class="dress-ghost__skirt" style="background-image:url('${o.image}')"></div>`;
  document.body.appendChild(ghost);
  const skirt = ghost.querySelector<HTMLElement>('.dress-ghost__skirt')!;
  const shadow = ghost.querySelector<HTMLElement>('.dress-ghost__shadow')!;
  o.from.classList.add('is-departing');

  const D = o.duration ?? 860;
  const ANT = 130; // antecipação: peça cede e inclina antes de partir
  let theta = 0;
  let omega = 0;
  let phi = 0; // atraso da saia
  let phiV = 0;
  let prevVx = 0;
  let prevT = 0;
  let lastX: number | null = null;
  let kicked = false;
  let impacted = false;
  let done = false;
  let raf = 0;
  const t0 = performance.now();

  const bez = (t: number, a: number, b: number, c: number, d: number) => {
    const u = 1 - t;
    return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
  };
  // ritmo: arranca rápido, desacelera ao chegar (ease-out com início suave)
  const ease = (t: number) => t * t * (3 - 2 * t) * 0.35 + (1 - Math.pow(1 - t, 3)) * 0.65;
  const scaleAt = (t: number) => {
    const lift = Math.sin(Math.min(1, t / 0.18) * Math.PI) * 0.05; // sobe um pouco ao destacar
    const k = Math.pow(t, 1.35);
    return (1 + lift) * (1 - k) + sEnd * k;
  };

  return new Promise<void>((resolve) => {
    const finish = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      if (!impacted) {
        impacted = true;
        o.onImpact();
        o.target.impact();
      }
      ghost.remove();
      o.from.classList.remove('is-departing');
      running = false;
      removeEventListener('keydown', onKey, true);
      removeEventListener('resize', finish);
      document.removeEventListener('visibilitychange', onVis);
      resolve();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') finish(); };
    const onVis = () => { if (document.hidden) finish(); };
    addEventListener('keydown', onKey, true);
    addEventListener('resize', finish);
    document.addEventListener('visibilitychange', onVis);

    const frame = (now: number) => {
      const el = now - t0;
      if (el < ANT) {
        // antecipação: o vestido "respira" e inclina 1,5°
        const a = Math.sin((el / ANT) * Math.PI);
        ghost.style.transform = `translate3d(${p0.x - W / 2}px, ${p0.y - H * 0.03}px, 0) rotate(${(-1.5 * a).toFixed(2)}deg) scale(${(1 + 0.025 * a).toFixed(4)})`;
        raf = requestAnimationFrame(frame);
        return;
      }
      const raw = Math.min(1, (el - ANT) / D);
      if (!kicked) { kicked = true; omega = 1.1 * Math.sign(dx || -1); } // a barra atrasa na partida
      const t = ease(raw);
      const x = bez(t, p0.x, p1.x, p2.x, p3.x);
      const y = bez(t, p0.y, p1.y, p2.y, p3.y);
      const s = scaleAt(t);
      // física: aceleração horizontal do gancho excita o pêndulo (rad)
      const dt = Math.max(1 / 240, Math.min(1 / 30, (now - (prevT || now - 16)) / 1000));
      prevT = now;
      const vx = lastX === null ? 0 : (x - lastX) / dt;
      lastX = x;
      const ax = (vx - prevVx) / dt;
      prevVx = vx;
      const k = 70; // rigidez (spec: 60–110)
      const c = 9.5; // amortecimento (spec: 9–18)
      omega += (-k * theta - c * omega + ax * 0.00016) * dt;
      theta += omega * dt;
      const fade = raw > 0.75 ? 1 - ((raw - 0.75) / 0.25) * 0.75 : 1; // orienta-se para a boca
      theta = Math.max(-0.3, Math.min(0.3, theta)) * (raw > 0.75 ? 0.985 : 1);
      // saia segue com atraso
      phiV += (-110 * phi - 11 * phiV - omega * 9) * dt;
      phi += phiV * dt;
      const rot = theta * fade;
      ghost.style.transform = `translate3d(${(x - W / 2).toFixed(1)}px, ${(y - H * 0.03).toFixed(1)}px, 0) rotate(${rot.toFixed(4)}rad) scale(${s.toFixed(4)})`;
      skirt.style.transform = `rotate(${(phi * fade * 0.8).toFixed(4)}rad)`;
      shadow.style.opacity = String(0.35 * (1 - raw));
      // impacto: quando a barra (base) do vestido cruza a boca
      const hemY = y - H * 0.03 + H * s * 0.97;
      if (!impacted && raw > 0.6 && hemY >= m.y + 2) {
        impacted = true;
        o.onImpact();
        o.target.impact();
      }
      if (raw >= 1) {
        // afunda mais 110 ms atrás do lábio antes de sumir
        const sink = Math.min(1, (el - ANT - D) / 110);
        ghost.style.transform = `translate3d(${(x - W / 2).toFixed(1)}px, ${(y - H * 0.03 + sink * H * s * 0.6).toFixed(1)}px, 0) rotate(0rad) scale(${(s * (1 - sink * 0.35)).toFixed(4)})`;
        if (sink >= 1) return finish();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  });
}
