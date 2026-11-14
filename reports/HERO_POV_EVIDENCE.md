# Hero POV 360 · evidências de entrega

Data: 14/11/2026. Branch de trabalho: `claude/nifty-galileo-91h4v9`.
SHA base (produção confirmada na Vercel, `belle-alencar-set77.vercel.app`): `0829f7517e21f94f5386f09a5d525d1270d30baa` (`claude/wonderful-meitner-kt2rnw`, V52).
A branch indicada pela sessão apontava para `aef55aa` (352 commits atrás da produção); foi avançada por fast-forward até o SHA de produção antes de qualquer edição.

SHA final: ver `git log -1` desta branch (preenchido na seção "Commits").

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

(Tabela preenchida a partir dos logs em `reports/evidence/hero-pov/logs/`.)

## Comparativos dos seis quadros

`reports/evidence/hero-pov/compare-0N.jpg` (referência · render · sobreposição 50 %) e `pose-0N.png` (render 1600×900 sem interface). Desvios em `docs/hero-pov/09_DESVIOS_DE_ARTE.md`.

## Vídeo

`reports/evidence/hero-pov/percurso-hero-pov.webm`: scroll até a sala → Explorar a loja → Ver a entrada → Arara direita → toque e filtro de categoria → Arara esquerda → Ver peça → Retomar o filme (1280×720, Chromium com renderização por software).

## Medições

(Preenchidas a partir de `measure.json`.)

## Pendências e limitações

- Aparelhos reais (Android intermediário, iPhone, Safari desktop) não foram testados nesta nuvem: só Chromium com SwiftShader. As medições abaixo são de laboratório em CPU e não representam fps de GPU real.
- Peças sem malha 3D; o estudo procedural do vestido protagonista continua explicitamente conceitual.
- O quadro 02 tem inconsistência geométrica interna (ver desvios); marcos horizontais atendem à tolerância, verticais do fundo não.
- Produção não foi alterada. Preview publicado conforme a seção "Preview".
