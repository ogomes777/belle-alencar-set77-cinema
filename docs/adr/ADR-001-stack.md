# ADR-001 | Stack: Vite + TypeScript + Three.js + GSAP, sem framework de UI

## Contexto
A experiência é um único filme rolável com um palco WebGL e uma camada comercial (catálogo, sacola, lojas). O brief sugere React/Next/R3F "desde que haja motivo medido".

## Decisão
- **Vite 8 + TypeScript estrito** para módulos pequenos, contratos tipados e build com code-splitting.
- **Three.js r187 direto, sem R3F**: existe um único renderer e uma única cena; o reconciliador React não ajuda e só pesaria no bundle. O mundo 3D carrega por `import()` dinâmico depois da primeira pintura.
- **GSAP 3.15 (ScrollTrigger + Flip)** cuida do progresso do filme, dos reveals tipográficos e do FLIP card→detalhe.
- **DOM vanilla** com pequenos componentes funcionais e um store observável próprio (`src/core/store.ts`) para cidade, sacola, wishlist e tier.
- Fontes self-hosted via `@fontsource` (sem Google Fonts em runtime, melhor para LGPD e latência).
- Testes: Vitest (lógica comercial) e Playwright (E2E e capturas).

## Consequências
- Bundle inicial pequeno (shell + comércio). Three e GSAP ficam num chunk separado, carregado sob demanda.
- Migração futura para Next.js (SSR/SEO de PDP) é possível: `src/commerce` não depende do DOM nas regras.
