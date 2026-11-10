# AUDITORIA V3 | DIAGNÓSTICO DO CÓDIGO REAL

Data: 09/11/2026 · Executor: SET77 Labs (sessão Claude Code) · Fonte: código do ZIP `BELLE_ALENCAR_SET77_CINEMA_MASTER`, preservado em `legacy/v3/`.

## Método
1. Leitura integral de `index.html`, `styles.css`, `cinema.css`, `maximum.css`, `app.js`, `cinema.js`, `maximum.js`, `silk.js`, `scripts/*`.
2. Execução real em Chromium headless (Playwright) a 1440×900 e 390×844, com captura de console, falhas de rede, LCP e overflow.

## Medições (Chromium headless, rede de container, sem throttling — não é dado de campo)
| Viewport | Load | LCP (lab) | scrollHeight | Overflow horizontal | Erros console | Requests falhos |
|---|---|---|---|---|---|---|
| 1440×900 | 3,36 s | 0,80 s | 19.845 px | não | 0 | 0 |
| 390×844 | 3,27 s | 0,53 s | 14.716 px | não | 0 | 0 |

## O que funciona
- Escolha de cidade com `localStorage` + `?cidade=` na URL; diálogos nativos `<dialog>`.
- Reduced-motion e Save-Data são respeitados em vários módulos.
- Shader de tecido abstrato (Three r187) pausado fora da viewport e em aba oculta.
- Sem erros de console; nenhuma requisição falha na rodada.

## Problemas encontrados
| ID | Severidade | Problema | Evidência |
|---|---|---|---|
| A1 | P0 | **Monograma oficial corrompido.** `assets/brand/ba-monogram-reference.jpg` (170×160) contém dados JPEG truncados: blocos amarelos e ruído, nenhum desenho legível. Não pode ser usado como ativo. | Conversão via PIL e inspeção visual |
| A2 | P1 | Modal de cidade abre sozinho após 1,65 s e cobre o primeiro capítulo, o que obriga uma decisão antes de explorar (o brief proíbe isso). | `app.js` `setTimeout(openDialog,1650)`; captura em 1440 |
| A3 | P1 | O "portal" é CSS 2D (`--door`, `--dolly` alimentando transforms), sem geometria nem câmera; o brief proíbe "imagens planas ampliadas como cenário". No mobile vira um `setTimeout` que não acompanha o scroll. | `maximum.js` `applyPortal` |
| A4 | P1 | 15 imagens Unsplash usadas como editorial/"vestido". São fotos de terceiros que parecem mercadoria, o que o manifesto proíbe. | `index.html` (15 URLs) |
| A5 | P1 | Narrativa fragmentada: 15 seções independentes (filme, manifesto, matéria, ateliê, quebra, lookbook, tátil, plano, cortina…) sem uma câmera compartilhada, com a numeração de capítulos inconsistente (01, 02, 03, 02, 05, 06, 03, 07, 09, 04). | `index.html` `section-top` |
| A6 | P1 | Não existe catálogo, variante, sacola ou wishlist. A jornada comercial termina num link genérico. | código |
| A7 | P2 | Três folhas CSS sobrepostas (`styles` + `cinema` + `maximum`, 60 KB) e três IIFEs JS com estado duplicado (reduced/lite/low calculados 3×). | arquivos |
| A8 | P2 | GSAP e Three via CDN sem lockfile/integridade; Google Fonts de terceiros (LGPD/latência). | `index.html` |
| A9 | P2 | "Vestido" do ateliê é um `clip-path` CSS; o shader `silk.js` é um plano ondulado, não uma peça. Os dois estão corretamente rotulados como estudo, mas não cumprem o "vestido vivo". | `styles.css`, `silk.js` |
| A10 | P2 | Perfil "Minhas preferências" guarda nome em `localStorage` sem aviso de finalidade (dado pessoal sem necessidade). | `app.js` |

## Decisão
Reconstrução total autorizada e justificada por A3, A5 e A6: os dois pilares (filme em primeira pessoa com câmera física e jornada comercial) não existem na V3 e não cabem na estrutura atual. Mantemos da V3: paleta, tipografia Cormorant (equidade de marca), copy aprovada de direção ("O look começa aqui. O resto é seu.", "Entre. Fique à vontade."), cidades e regras de persistência. A V3 fica em `legacy/v3/` para referência e rollback (`npm run legacy`).
