# V38 · Menu de capítulos em tela cheia

Referência: agrumeafarm.it (código da página enviado pelo cliente + vídeo `WhatsApp Video 2026-11-12 at 17.30.05`). Reproduzida a **gramática de interação**, não a identidade: cores, fonte e textos são da Belle.

| Referência (observado) | Belle V38 |
|---|---|
| Pílula "MENU" + disco com losango; rótulo rola para "CLOSE", losango vira X | Pílula "Menu" → "Fechar" (letras rolam), disco dourado com losango → X; ≤560 px só o disco 44×44 |
| Painel cobre a tela descendo do topo (.9s, cubic-bezier(.645,.045,.355,1)), sai subindo (.975s) | Igual (`transform` apenas) |
| Títulos serifados em caixa alta, escada diagonal (margin-left = i/last) | 6 capítulos: A loja, Passarela, Ocasiões, Coleção, Lojas, Atendimento |
| Letras sobem por máscara com atraso por linha/letra | Igual (.36s + linha·80ms + letra·22ms) |
| Linhas divisórias se desenham (scaleX) com atraso | Igual |
| Item atual em cor clara + losango | Igual, ligado ao capítulo visível (aria-current) |
| Hover: cada letra rola (18ms/letra) | Igual (só com mouse) |
| Links secundários + legal | Como comprar, Dúvidas, WhatsApp ↗, Instagram ↗ · cidades |
| Fonte Ivymode (Adobe Fonts, licença da Agrumea) | **Bodoni Moda** (OFL, auto-hospedada, carregada só ao usar o menu) — a Ivymode não pode ser embutida sem licença própria |

Temas: claro = ouro champagne/tinta café/ativo marfim; escuro = ônix/tinta ouro/ativo marfim; rosé = rosé-ouro/tinta vinho/ativo marfim. Trocar o tema com o menu aberto atualiza na hora.

Comportamento: scroll travado com o menu aberto; Esc fecha; foco preso no menu e devolvido ao fechar; capítulo clicado → salto instantâneo sob o painel que sobe, com correção enquanto seções acima mudam de altura (corrige bug herdado da V36: link para Lojas parava 1.543 px antes porque o vídeo "Como comprar" cresce de 889 para 2.340 px ao ativar); a seção chega já revelada (transições V37). Movimento reduzido: abre/fecha sem animação.

QA: `npm test` 67/67 · `npm run e2e` 105/105 · `tests/e2e/header-glass.mjs` 122/122 (atualizado para o menu novo em 320–1440 px) · `qa/v37-modes.mjs` 8/8. Vídeos: `menu-light-1440.webm`, `menu-dark-390.webm`, `menu-rose-1440.webm`.
