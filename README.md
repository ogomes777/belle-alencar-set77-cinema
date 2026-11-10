# BELLE ALENCAR | SET77 LABS | CINEMA V4

Boutique feminina cinematográfica em primeira pessoa (Three.js + GSAP) com jornada comercial multiloja (Araxá, Frutal, Catalão, Mineiros). **Pré-lançamento:** o vestido 3D é um estudo procedural e o catálogo é demonstrativo. Nada aqui é estoque real ou checkout.

## Rodar
```bash
npm install
npm run dev          # desenvolvimento (Vite)
npm test             # Vitest: lógica comercial + integração DOM
npm run build        # typecheck + build de produção em dist/
npm run preview      # serve dist/ em :4173
npm run e2e          # Playwright (com o preview rodando). SHOTS=1 salva capturas em docs/qa/
npm run check        # verificação estrutural
node scripts/render-posters.mjs   # regenera os pôsteres do modo estático a partir do 3D
npm run legacy       # V3 original (referência/rollback) em legacy/v3
```
Parâmetros úteis: `?tier=cinema|touch|static`, `?loja=araxa`, `?peca=vestido-longo-fluido`, `?categoria=vestidos`, `?gov=off` (só QA).

## Estrutura
- `index.html`: shell semântico, legível sem JS.
- `src/film.ts`: orquestrador do filme (scroll nativo → progresso, pôsteres, provador).
- `src/experience/`: chunk 3D lazy (`world.ts`, `story.ts`, `scene/*`, `cloth/*`, texturas procedurais).
- `src/commerce/`: contratos, lojas, catálogo demo, sacola por filial, UI (quick view, sacola, busca, lojas).
- `src/core/`, `src/shell/`, `src/styles/`: estado, tiers, a11y, intro, header, tokens.
- `tests/unit`, `tests/e2e`: suítes automatizadas.
- `docs/`: brief, storyboard, **AUDIT_V3, IMPLEMENTATION_PLAN, ASSETS_MISSING, QA_PLAN, MOTION_APPLIED, RELEASE_REPORT**, ADRs.
- `.claude/agents`, `.claude/skills`, `prompts/`, `knowledge/`: kit SET77 original.

## Estado
Ver `docs/RELEASE_REPORT.md` (o que foi construído, medido, publicado como preview e o que falta).
