# BELLE V59 · Reconstrução visual, não retoque da V58

**Fonte:** ZIP `BELLE_ALENCAR_HERO_POV_SET77.zip`, seis PNGs de `referencias/`. Referência 02 orienta a planta. Referência 06 é contracampo proposto, não fotografia física.

## O que mudou de fato

A arquitetura V58 (nichos vazios, fachada preta, piso claro e araras com fotos planas) foi retirada da renderização. Novo `src/experience/scene/atelier59.ts` gera um único ambiente com piso de madeira de espinha de peixe, paredes de calcário, teto quente, três trilhos de spots, laterais arqueadas, arara creme à esquerda e vinho/preto à direita, pedestal de bolsa, espelho e cortina no fundo, mobiliário de provador. A fachada agora é portal de pedra com três vãos físicos, vitrines profundas, letreiro Belle sobre pedra e porta dupla com puxadores, vista dos dois lados. `World` mantém câmera e progressão do filme e usa `POVWalk` no passeio. A seleção/paginação do catálogo por arara e a sacola de interesse permanecem ligadas ao contrato comercial.

**Os vestidos procedurais são estudos de volume 3D, NÃO digital twins nem fotografia de produto oficial.** As variantes comerciais do catálogo demonstrativo não são anunciadas como estoque real.

## Comparação dos seis ângulos

| Quadro | Decisão de geometria na V59 | Pendente para fidelidade final |
|---|---|---|
| 01 Fachada | Pedra em vez de barra preta; três grandes vãos; 2 vitrines com pedestais e um vestido vinho; bronze | Materiais PBR físicos, dobradiça/puxadores em escala e vidro/reflexos de shopping |
| 02 Planta central | Duas filas volumétricas de roupas e corredor central, piso de madeira escura, fundo com espelho à esquerda e cortina à direita | Arcos de laterais, dobras e profundidade exata ainda não coincidem com os pixels da referência |
| 03 Direita | Vestidos vinho/preto em suporte 3D, cabides triangulares, varão e pés de pedra | Trama real de tecido, comprimento/drapeados, cabide escuro mais realista |
| 04 Provador | Espelho arqueado, cortina com pregas geométricas, poltrona bouclé e pedestal | Reflexo móvel real em níveis de GPU baixos, cortina com textura e vestido champagne à escala |
| 05 Esquerda | Cetim champagne e creme em 3D, peças densas penduradas e bases próprias | Renda, costuras, silk shading e encaixe da posição da arara no enquadramento aprovado |
| 06 Contracampo | Mesmo acesso, mesmas folhas e puxadores da entrada | Shopping ainda é cenário procedural genérico, não reprodução verificada de arquitetura específica |

## Critérios cumpridos, limites conhecidos

- Mesmo mundo Three.js para todas as câmeras (não são PNGs projetados como paredes).
- Rotação horizontal contínua, scroll reversível, destino/caminhada, colisões ligadas ao mobiliário atual e interface comercial preservada.
- `npm run check`, `npm run typecheck`, `npm test` com 86/86 e `npm run build` passaram em sandbox para o código V59.
- O teste anterior de primeira renderização em Chromium + SwiftShader registrou aproximadamente 8,6 s: **não é performance aceitável de carregamento imediato em aparelho real e não foi apresentado como tal**.
- A fidelidade de fotografia arquitetônica e o FPS de iOS/Android físicos dependem de assets de 3D/fotografia, testes em GPUs reais e revisão no comparador original da ZIP.
- Não promover esta branch a produção sem validação dos seis ângulos. A V57 permanece publicada.

## Rastreabilidade

Branch: `feat/belle-v59-reference-rebuild`. Partida: V58 `bfd1f9ee80095080b543c105d83683f7832798a8`. Produção preservada: V57 `7026cea8eee8e88a68a8117f5ddd948b5a51f08c`.
