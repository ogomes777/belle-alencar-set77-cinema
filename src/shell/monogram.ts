/**
 * Monograma BA PROVISÓRIO.
 * O JPEG de referência do kit está corrompido (docs/AUDIT_V3.md, A1).
 * Este desenho tipográfico (Cormorant Garamond) mantém a equidade visual da V3
 * até a chegada do vetor oficial. Substituir por /public/brand/ba-monogram.svg.
 */
export function monogramSVG(variant: 'intro' | 'header' | 'footer' | 'finale' = 'header'): string {
  const arch = variant === 'intro' || variant === 'finale';
  return `<svg class="mono mono--${variant}" viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    ${arch ? `<path class="mono__arch" d="M14 136 V58 A46 46 0 0 1 106 58 V136" fill="none" stroke="currentColor" stroke-width="1"/>
    <path class="mono__arch mono__arch--inner" d="M22 136 V60 A38 38 0 0 1 98 60 V136" fill="none" stroke="currentColor" stroke-width=".6"/>` : ''}
    <g class="mono__letters" font-family="'Cormorant Garamond', Georgia, serif" fill="currentColor">
      <text x="${arch ? 30 : 14}" y="${arch ? 100 : 96}" font-size="${arch ? 62 : 92}" font-weight="400">B</text>
      <text x="${arch ? 55 : 52}" y="${arch ? 110 : 112}" font-size="${arch ? 62 : 92}" font-weight="400" font-style="italic">A</text>
    </g>
  </svg>`;
}

export function mountMonograms(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-monogram]').forEach((el) => {
    const v = el.dataset.monogram as 'intro' | 'header' | 'footer' | 'finale';
    el.innerHTML = monogramSVG(v);
  });
}
