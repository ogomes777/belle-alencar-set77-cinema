/**
 * Marca oficial Belle Alencar, vetorizada a partir de brand/MONOGRAMA_BA_REFERENCIA.jpg
 * e brand/LOGO_OFICIAL_REFERENCIA.jpg (kit Living Palace). Cor herdada (currentColor).
 * Substitui o monograma tipográfico provisório da V4.0.
 */
import * as MONO from './mono-path';
import * as LOGO from './logo-path';

type Variant = 'intro' | 'header' | 'footer' | 'finale';

export function monogramSVG(variant: Variant = 'header'): string {
  if (variant === 'footer' || variant === 'intro') {
    return `<svg class="mono mono--${variant} mono--logo" viewBox="${LOGO.VB}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path class="mono__shape" fill="currentColor" fill-rule="evenodd" d="${LOGO.D}"/>
    </svg>`;
  }
  const arch = variant === 'finale';
  const [x, y, w, h] = MONO.VB.split(' ').map(Number) as [number, number, number, number];
  const vb = arch ? `${x - w * 0.18} ${y - h * 0.16} ${w * 1.36} ${h * 1.3}` : MONO.VB;
  const cx = x + w / 2;
  const r = w * 0.62;
  const base = y + h * 1.12;
  return `<svg class="mono mono--${variant}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    ${arch ? `<path class="mono__arch" d="M${cx - r} ${base} V${y + r * 0.7} A${r} ${r} 0 0 1 ${cx + r} ${y + r * 0.7} V${base}" fill="none" stroke="currentColor" stroke-width="${w * 0.006}"/>` : ''}
    <path class="mono__shape" fill="currentColor" fill-rule="evenodd" d="${MONO.D}"/>
  </svg>`;
}

export function mountMonograms(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-monogram]').forEach((el) => {
    el.innerHTML = monogramSVG(el.dataset.monogram as Variant);
  });
}
