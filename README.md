# BELLE ALENCAR | SET77 LABS | CINEMA V4

Boutique feminina cinematográfica em primeira pessoa (Three.js + GSAP) com jornada comercial multiloja (Araxá, Frutal, Catalão, Mineiros). **Pré-lançamento:** o vestido 3D é um estudo procedural e o catálogo é demonstrativo. Nada aqui é estoque real ou checkout.

## Rodar
```bash
npm ci
npm run dev          # desenvolvimento (Vite)
npm test             # Vitest: lógica comercial + integração DOM
npm run build        # typecheck + build de produção em dist/
npm run preview      # serve dist/ em :4173
npm run e2e          # Playwright (com o preview rodando). SHOTS=1 salva capturas em docs/qa/
npm run check        # verificação estrutural
node scripts/render-posters.mjs   # regenera os pôsteres do modo estático a partir do 3D
npm run legacy       # V3 original (referência/rollback) em legacy/v3
```
Parâmetros úteis: `?tier=cinema|touch|static`, `?loja=araxa`, `?peca=vestidos-01`, `?categoria=vestidos`, `?gov=off` (só QA).

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


## Produtos e passarela

A sequência preservada é filme → manifesto → faixa → passarela → ocasiões. Os 48 estudos sintéticos novos têm oito categorias com seis peças, IDs estáveis, cutouts para cenas/voo e packshots transparentes para catálogo, busca, ficha e sacola. Todos permanecem demonstrações: sem preço ou estoque confirmado, sem checkout.

`public/assets/belle/products/catalogo_48_novo.json` registra a origem fornecida e a correção do vestido 06. Nenhuma cena ativa usa as imagens antigas de `/editorial`. PNG/WebP transparentes são fotografias frontais 2.5D, não malhas 3D nem prova virtual. O estudo de tecido procedural é separado dos produtos.

A passarela tem seis looks em loop, arraste/toque, setas, botões e trilho sincronizado. A rolagem vertical permanece nativa. A arara contém as 30 roupas em cabides/presilhas; joias e bolsas ficam em expositores. A miniatura mantém a identidade da peça até entrar atrás da borda da bolsa; o contador atualiza no impacto.

Validação adicional:

```bash
python scripts/audit_product_alpha.py
node tests/e2e/products.mjs     # preview ativo, Playwright disponível
```

`BASE` altera o servidor. `SHOTS_DIR` e `VIDEO_DIR` alteram as pastas de evidência. Nesta nuvem, use `NODE_PATH=/workspace/.belle-tools/node_modules NODE_OPTIONS=--require=/workspace/.belle-tools/system-chromium.cjs` antes dos comandos de navegador para selecionar o Chromium instalado.

Consulte `reports/RELEASE_EVIDENCE.md` para commits, testes, capturas, limitações e situação real do Preview. Produção só após revisão visual e autorização expressa.
