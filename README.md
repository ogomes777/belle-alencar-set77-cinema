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


## Passarela em profundidade

A primeira dobra inclui seis looks em loop, arraste/toque, setas do teclado, botões anterior/próximo e trilho sincronizado com duas peças por look. A rolagem vertical continua levando para a boutique; trackpad horizontal ou Shift + roda controla a passarela. Movimento reduzido troca os looks diretamente.

As peças do editorial são demonstrativas, sem preço ou estoque real, e usam os mesmos favoritos e sacolas por filial. O botão + abre a escolha de tamanho antes de adicionar.

Para usar as duas sprites originais da referência fornecida, execute `node scripts/fetch-runway-media.mjs` e refaça o build. São necessários os domínios `images.higgs.ai` e, caso haja redirecionamento, `d8j0ntlcm91z4.cloudfront.net`. Sem as sprites, os estudos locais são exibidos com identificação; a interface não depende de requisições externas.

Teste específico: `node tests/e2e/runway.mjs` com Playwright disponível e `npm run preview` ativo. `BASE` altera o servidor; `SHOTS=1` salva capturas e `SHOTS_DIR` altera a pasta. Nesta nuvem: `NODE_PATH=/workspace/.belle-tools/node_modules NODE_OPTIONS=--require=/workspace/.belle-tools/system-chromium.cjs node tests/e2e/runway.mjs`.
