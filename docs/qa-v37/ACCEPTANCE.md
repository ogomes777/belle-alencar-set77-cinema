# V37 · aceite

Data 12/11/2026 (V37.4: 7 passagens, desempenho, e2e 105/105) · branch `claude/wonderful-meitner-kt2rnw` · produção **não** publicada.

## Testes
| Comando | Resultado |
|---|---|
| `npm ci` | ✅ |
| `npm test` | ✅ 65/65 (13 arquivos; +3 testes de contrato V37: monotonicidade/simetria, `v37-done`, âncora estável) |
| `npm run build` | ✅ (tsc + vite) |
| `npm run e2e` (V37) | ⚠️ 101–102/105. Falhas: `[360] loja, busca e sacola ≥40px` (**pré-existente**, falha igual na V36); `foco entra/volta no diálogo` e `ocasião "Para sair" filtra` — **instáveis**: reproduzidos isoladamente passam nas duas versões (foco) ou falham nas duas (clique no carrossel leva ~9s na V36 e V37). Não atribuíveis à V37. |
| `node qa/v37-modes.mjs` | ✅ 8/8 modos (abaixo) |

## Por modo (`qa/v37-modes.mjs`, saída em `modes.json`)
| Modo | Progresso monotônico | Reversível (mesmo Y → mesmo estado) | Overlay fixo ≥90% | Overflow X | CTAs clicáveis | Hash jump completa | Erros JS |
|---|---|---|---|---|---|---|---|
| 360 | ✅ | ✅ | ✅ nenhum | ✅ | ✅ | ✅ | ✅ 0 |
| 390 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 768 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1440 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1440 tema escuro (`dark`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 390 tema rosé (`rose`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1440 `prefers-reduced-motion` | estático (0 fronteiras ativas) ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1440 intensidade essencial | estático (0 fronteiras ativas) ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ |

## Por fronteira
| Fronteira | Efeito | Estado | Observação |
|---|---|---|---|
| Filme (7 capítulos) | nenhum | ✅ | Quadros do filme idênticos V36/V37 nos vídeos comparativos |
| Filme → Passarela | Cortina | ✅ | Só lettering; modelos/drag intactos (e2e boutique/runway passou) |
| Passarela → Ocasiões | Colunas | ✅ | Máscara no wrapper; carrossel continua dono do transform; botões clicáveis após conclusão |
| Ocasiões → Coleção | Varredura | ✅ | Termina antes de filtros/cards; cards não são estilizados |
| Coleção → Como comprar | nenhum | ✅ | `how-film.ts` intocado |
| Como comprar → Lojas | Círculo | ✅ (sutil) | Luz atrás do conteúdo; globo/CTA sem máscara |
| Lojas → Atendimento | Cortina lateral | ✅ | p=0,8 ≈ 90% da foto; botões WhatsApp/Instagram nunca mascarados |
| Atendimento → Dúvidas | Dobra | ✅ | `<details>/<summary>` sem estilos novos; summary clicável |
| Dúvidas → Finale | Veludo | ✅ | Fundo local, selo BA preservado |

## Não verificado / limites honestos
- **FPS em dispositivo real não medido.** Ambiente headless com SwiftShader; não afirmo 60fps. O custo do V37 é 1 `getBoundingClientRect` por fronteira por frame de scroll + propriedades CSS locais; o gargalo medido (lojas 14→5 fps) é igual na V36.
- BFCache e aba suspensa: cobertos por código (`pageshow`, `visibilitychange`) e testes unitários de destroy/reentrada, não por teste de navegador dedicado.
- Safari/Firefox não testados (só Chromium disponível).
- Wheel/touch físicos: simulados via `scrollTo` em contextos `hasTouch`; não há gesto real.

## V37.2 · fluidez medida (`qa/v37-perf.mjs`, 390px, DPR 2, CPU 4× mais lenta, ms por quadro média/p95)
| Passagem | V36 (2 execuções) | V37.2 (2 execuções) |
|---|---|---|
| Ocasiões | 47/77 · 42/63 | 46/69 · 52/83 |
| Coleção | 52/87 · 47/61 | 50/65 · 48/71 |
| Atendimento | 20/30 · 18/23 | 19/24 · 20/32 |
| Dúvidas | 44/214 · 42/186 | 42/199 · 46/211 |
| Finale | 60/72 · 57/68 | 62/75 · 63/81 |

A V37.2 fica dentro da variação da V36. Os picos de Dúvidas/Finale existem na V36 (canvas do BA e carrossel). Os números valem só para este ambiente headless, não para um aparelho real.

## V37.4
- `npm test` 67/67 · `npm run build` ✅ · `npm run e2e` **105/105** (primeira vez sem falhas; V36 tinha 104/105) · `qa/v37-modes.mjs` 8/8.
- Desempenho: ver `PERFORMANCE.md`.
