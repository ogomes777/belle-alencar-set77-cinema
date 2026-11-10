# PLANO DE QA | COMO PROVAMOS QUE ESTÁ PRONTO

## Matriz de ambientes
| Ambiente | Disponível nesta sessão | Como |
|---|---|---|
| Chromium desktop 1440×900 | Sim | Playwright (`npm run e2e`) |
| Chromium 768×1024 / 390×844 / 360×800 | Sim | Playwright com `isMobile` + `hasTouch` |
| Firefox / WebKit | Não (só Chromium instalado no container) | Pendente: rodar `npx playwright install firefox webkit` em máquina com rede liberada |
| Safari iOS / Chrome Android reais | Não | Pendente de dispositivo físico |
| Core Web Vitals de campo | Não | Pendente de tráfego real + RUM consentido |

## Suítes automatizadas
1. **Unit (Vitest)**: troca de cidade, persistência, sacola por filial, resolução explícita na troca de loja, disponibilidade (provider falso com estoque e sem estoque), wishlist, parser de URL.
2. **E2E (Playwright, `tests/e2e/run.mjs`)**:
   - carga sem erro de console nem 404, nos 4 viewports;
   - sem overflow horizontal (`scrollWidth === clientWidth`);
   - intro aparece, "Pular" funciona e não volta na mesma sessão;
   - capturas por capítulo nos frames 0/25/50/75/100 % do filme (desktop e 390);
   - WebGL: canvas ativo em CINEMA; render loop parado quando o palco sai da tela (contador de frames estável);
   - reduced-motion: sem canvas, pôsteres visíveis, conteúdo completo;
   - teclado: Tab alcança header → CTA → catálogo; foco visível; Esc fecha drawers; foco devolvido ao gatilho;
   - cidade: escolher Frutal persiste após reload; `?loja=catalao` sobrescreve;
   - sacola: adicionar → contador → persistir após reload → trocar loja exige decisão → itens não migram sem escolha;
   - quick view por deep link `?peca=`;
   - LCP e CLS de laboratório via PerformanceObserver.

## Critérios P0/P1/P2
- **P0**: erro JS, CTA/loja/sacola inacessível, overflow horizontal, tela travada, conteúdo falso apresentado como real, checkout que cobra.
- **P1**: quebra visual em algum viewport, foco perdido, animação que trava o scroll, render ativo fora da tela, LCP lab > 2,5 s.
- **P2**: polimento, microdesalinhamento, copy.

Não declaramos "pronto" com P0/P1 aberto. Evidências em `docs/qa/` (capturas) e no RELEASE_REPORT.
