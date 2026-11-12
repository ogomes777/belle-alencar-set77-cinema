---
name: belle-qa-multi-viewport
description: Executa regressão de scroll cinematográfico em 360, 390, 768, 1440 px, temas e reduced motion, incluindo captura de vídeo antes/depois.
---

# Skill: QA real da landing

## Planejamento
1. Salvar baseline V36 com mesmo viewport, sem mudar o fluxo de uso original.
2. Executar `npm ci`, `npm test`, `npm run build`, `npm run e2e`; coletar logs e erros.
3. Usar `qa/verify-boundaries.mjs` como base e ampliar para todas as fronteiras implementadas.
4. Capturar no mínimo 4 vídeos: desktop descendo, desktop subindo, mobile descendo, mobile subindo. Garantir que seções exibidas são as mesmas.
5. Fazer paradas a 25%, 50%, 75% da passagem. Navegar por menu e usar Back/Forward Cache. Testar `prefers-reduced-motion` e intensidade essential.
6. Diagnosticar FPS real com Chrome Performance ou Playwright trace; não afirmar que é garantido só com build verde.

## Sinais de reprovação
Texto duplicado, tela branca, overlay full screen, forma geométrica de fundo persistente, roupa escondida, card falso, scroll lateral, botão não acionável, input em modo inert, título cortado, 1 erro JS significativo.

## Entrega
`docs/qa-v37/ACCEPTANCE.md` com PASS/FAIL por cena e link/caminho das provas.
