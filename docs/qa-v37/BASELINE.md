# V37 · baseline V36 vs V37

- V36: `fix/belle-v36-remove-decorative-overlays` @ `712591e`, build local (`vite build`) servido em `:4174`.
- V37: esta branch, servida em `:4173`.
- Ferramenta: `qa/v37-capture.mjs` (Chromium headless, SwiftShader, CDP screenshot). Estágios: a seção de entrada percorreu 15%, 50% e 100% da viewport.

| Pasta | Conteúdo |
|---|---|
| `baseline/` | `v36-<viewport>-<seção>-<estágio>.jpg` — 1440×900 e 390×844 |
| `shots/` | `v37-...` mesmos enquadramentos |
| `video/` | `v3x-<vp>-scroll-down-up.webm` (descida contínua + subida) e `compare-v36-v37-<vp>.mp4` lado a lado |

## O que já funcionava na V36 (preservado)
Hero/filme 3D com 7 capítulos, faixa de categorias, passarela com 18 produtos, carrossel de ocasiões, revelação da coleção, scrub do vídeo "Como comprar", globo de lojas, atendimento, FAQ nativo, finale BA. Nenhuma composição foi alterada.

## O que estava "errado" na V36 (escopo V37)
Passagens entre seções eram cortes secos (V36 removeu os overlays V35 sem colocar nada no lugar). Não há bug visual de layout novo detectado nas capturas.

## Limitações das capturas
- Renderização por software: a seção de lojas cai para ~14→5 fps na V36 **e** na V37 (globo WebGL); algumas capturas 1440 saíram com atraso de quadro (registrado em `baseline/report.json` / `shots/report.json` como `shot timeout`). Não é medição de dispositivo real.
