# Hero POV 360 · evidências de entrega

Data: 14/11/2026. Branch de trabalho: `claude/nifty-galileo-91h4v9`.
SHA de partida (produção em 13/11): `0829f75` (V52). A branch indicada pela sessão apontava para `aef55aa` (352 commits atrás); foi avançada até a produção antes de qualquer edição.
Produção avançou para a V72 (`323d0ed`, `feat/belle-v72-couture-infinite-ticker`) durante o trabalho. A V72 foi integrada por merge (`a92f284`): tudo que existe na V72 continua; o hero é a única área alterada. Conflitos resolvidos a favor da produção (scrub contínuo V55, preload do logo).

## O que foi construído

| Área | Arquivos | Estado |
|---|---|---|
| Planta única e poses de aceite | `src/experience/scene/layout.ts` | Construído. Fonte única para cena, câmera, navegação, picking e QA. |
| Loja 3D (fachada, salão, araras livres, provador) | `scene/boutique.ts`, `scene/facade.ts`, `scene/mall.ts`, `scene/kit.ts`, `textures.ts` | Construído. Travertino, piso espinha de peixe, trilhos de spots, nichos em arco, duas araras com pés de pedra e cabides de madeira, pedestal com a sacola Belle, espelho em arco, arco com cortina, provador com poltrona bouclé e suporte. Sem peças decorativas elevadas. |
| Câmera do filme | `story.ts` | Construído. Capítulos passam pelas poses 01, 02, 03 e 04; travessia da porta e da cortina; olhar lateral no capítulo 03. |
| Visita em primeira pessoa | `explore.ts`, `nav.ts`, `world.ts` | Construído. Yaw sem limite de revolução, pitch ±35°, destinos físicos por grafo, WASD/setas, colisão por cápsula com varredura, retorno ao trilho por mistura. |
| Araras por categoria | `rack-state.ts`, `explore-ui.ts` | Construído. Estado por lado, categoria inteira da fonte canônica, páginas, seletor, vazio, "Ver peça" (ficha canônica), tamanho, voo até a sacola. |
| Fallback | `film.ts`, `styles/film.css` | Modo essencial/pôster mantém pôsteres regenerados, CTA de coleção por categoria no capítulo 03 e HUD oculta. |
| Peças 3D reais | — | **Pendente de ativo real.** As peças são fotografias frontais oficiais do kit (2.5D) em cartões convexos. Sem GLB não há volume de costas nem tecido físico das peças reais. |

## Verificação executada

Build final: V72 + hero (merge `a92f284` e seguintes). Logs em `reports/evidence/hero-pov/logs/`.

| Verificação | V72 + hero | V72 pura | Observação |
|---|---|---|---|
| `tsc` + `vite build` | aprovado | — | |
| Unitários (`vitest`) | 18 arquivos, 94 testes | — | inclui 16 novos de navegação/colisão e araras por categoria, e os da produção (scrub V55, mídia V54) |
| `npm run check` | aprovado | — | |
| `tests/e2e/hero-pov.mjs` (novo) | 33/33 | — | 360° nos dois sentidos, contracampo, destinos, colisão, Esc, categorias completas por lado, Ver peça, touch com swipe vertical, três ciclos, seis poses |
| `tests/e2e/run.mjs` | 101/105 | mesmas 4 falhas | as 4 são o vídeo V69 cancelado pelo navegador durante saltos de rolagem; idêntico na V72 pura |
| `tests/e2e/products.mjs` | 89/89 | — | |
| `tests/e2e/runway.mjs` | 59/59 | — | |
| V55 hero stability | falha | mesma falha | imagens das cidades no primeiro quadro; pré-existente |
| V61 / V62 / V65 | falham | saída idêntica | seletores desatualizados em versões posteriores; pré-existente |

## Comparativos dos seis quadros

`reports/evidence/hero-pov/compare-0N.jpg` (referência · render · sobreposição 50 %) e `pose-0N.png` (render 1600×900 sem interface). Desvios em `docs/hero-pov/09_DESVIOS_DE_ARTE.md`.

## Vídeo

`reports/evidence/hero-pov/percurso-hero-pov.mp4` (e `.webm`): 700 quadros, 24 fps, 1280×720, tier cinema com a interface real, renderizado quadro a quadro. Percurso: vitrine → scroll até a sala → Explorar a loja → Ver a entrada → Arara direita → toque numa peça (categoria inteira) → filtro Vestidos → Arara esquerda → Ver peça → Retomar o filme. Prancha: `percurso-quadros.jpg`.

## Medições

Laboratório nesta nuvem: Chromium com SwiftShader (renderização por CPU, sem GPU). Os intervalos de quadro batem no teto de 250 ms e **não representam aparelho real**; draw calls e triângulos sim são do conteúdo.

| Tier | Ponto | Draw calls | Triângulos | p50 ms | p95 ms |
|---|---|---|---|---|---|
| cinema | sala (trilho) | 290 | 109473 | 116.7 | 250 |
| cinema | visita · entrada | 284 | 109281 | 250 | 250 |
| cinema | visita · arara direita | 68 | 53153 | 250 | 250 |
| cinema | visita · arara esquerda | 64 | 46885 | 250 | 250 |
| cinema | visita · provador | 394 | 145812 | 250 | 250 |
| cinema | primeiro frame 3D (ms desde navegação) | 23307 ms | heap 14 MB | | |
| touch | sala (trilho) | 93 | 35414 | 83.3 | 250 |
| touch | visita · entrada | 87 | 35268 | 249.9 | 250 |
| touch | visita · arara direita | 24 | 22308 | 250 | 250 |
| touch | visita · arara esquerda | 31 | 22504 | 250 | 250 |
| touch | visita · provador | 18 | 14101 | 250 | 250 |
| touch | primeiro frame 3D (ms desde navegação) | 19805 ms | heap 13 MB | | |

O tier cinema inclui passes de reflexo real (piso, mármore, espelhos), sombras das araras e pós de cinema. O governador remove primeiro pós, reflexos e sombras, depois reduz a resolução, sem descartar controles nem IDs.

## Pendências e limitações

- Aparelhos reais (Android intermediário, iPhone, Safari desktop) não foram testados nesta nuvem: só Chromium com SwiftShader. As medições abaixo são de laboratório em CPU e não representam fps de GPU real.
- Peças sem malha 3D; o estudo procedural do vestido protagonista continua explicitamente conceitual.
- O quadro 02 tem inconsistência geométrica interna (ver desvios); marcos horizontais atendem à tolerância, verticais do fundo não.
- Aparelhos pendentes: Android intermediário, iPhone, Safari macOS e Firefox. Testados só Chromium desktop e emulação touch.
- Ativos pendentes: malhas 3D das peças (GLB), levantamento do shopping real e iluminação global pré-calculada (lightmaps exigem Blender, indisponível nesta nuvem).
