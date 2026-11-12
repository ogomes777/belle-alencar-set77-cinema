# V37.4 · desempenho (medido)

Ambiente: Chromium headless, sem GPU (SwiftShader), 390×844, DPR 2, **CPU 4× mais lenta**. Isso exagera o custo de pintura em relação a um celular real com GPU; serve para comparar versões, não como FPS de aparelho. Safari/Firefox não disponíveis aqui (não testados).

## Causas encontradas (perfil de CPU, `qa/v37-profile.mjs`)
| Causa | Onde | Correção |
|---|---|---|
| `getBoundingClientRect` em todo quadro de scroll na página inteira → layout forçado (~2 s por rolagem completa) | `motion/stores-champagne.ts`, `astral/orbit.ts`, `how-film.ts`, transições V37 | `core/scroll-geometry.ts`: posições em cache (invalidadas por resize, ResizeObserver do body, load, fontes) + `scrollY` capturado no evento |
| `gsap.set` com `clip-path` em texto por card visível a cada quadro (parse + `getComputedStyle`) | `commerce/collection-reveal.ts` | escrita direta de `transform/opacity/clip-path` (mesmos valores e ordem; strings idênticas às do GSAP verificadas) + geometria em cache |
| Filme escrevendo no DOM síncrono em todo evento de scroll no tier estático, mesmo fora do filme | `film.ts` | sempre 1× por quadro; nenhuma escrita quando nada mudou |
| BA 3D criando WebGL + compilando shaders a 200 px da tela (pico ~200–400 ms no meio do scroll) | `finale/ba-solid.ts` | aquecimento a 1600 px em tempo ocioso + `renderer.compile` antecipado |
| Vidro desfocado re-borrado a cada quadro (header fixo, cards) e `drop-shadow` em recortes que se movem | CSS | **modo leve adaptativo** (`core/perf-guard.ts`, `styles/perf-lite.css`) |

## Modo leve adaptativo
Liga `html.perf-lite` se: memória ≤ 4 GB, ≤ 2 núcleos, economia de dados, **ou** mediana de quadros > 22 ms durante 90 quadros de scroll real. Troca `backdrop-filter` por superfícies quase opacas do mesmo tom, remove `drop-shadow` dos recortes em movimento, BA 3D em DPR 1 sem antialias. Layout, paleta, conteúdo e transições não mudam. `?perf=full` / `?perf=lite` forçam para QA.

## Resultado (ms por quadro, média/p95, `qa/v37-perf.mjs`)
| Seção | V36 | V37.4 completo | V37.4 leve |
|---|---|---|---|
| Ocasiões | 47–53 / 76–82 | 33–35 / 48–57 | 30–32 / 47–48 |
| Coleção | 47–64 / 61–105 | 35–40 / 52–59 | 36–37 / 54–71 |
| Atendimento | 18–25 / 23–48 | 26–30 / 32–50 | 21–24 / 27–36 |
| Dúvidas | 42–51 / 186–237 | 44–48 / 80–82 | 32–37 / 45–69 |
| Finale | 57–71 / 68–96 | 63–65 / 80–86 | 38–42 / 49–55 |

Perfil completo da página: chamadas de layout forçado caíram de ~2,5 s para ~50 ms.
