# BELLE ALENCAR · Ocasiões / Round Carousel V9
**SET77 Labs · 11/11/2026**

## Missão

Transformar os três cards já existentes de `#ocasioes` em uma experiência editorial de carrossel circular 3D inspirada no componente Round Carousel da Originkit enviado pelo cliente.

**A base da landing não foi recriada.** A passarela da Billie, a faixa infinita, o filme 3D, loader caligráfico, os quatro filtros do catálogo, lojas e sistema de compra permanecem intactos.

## Fonte da referência

- O usuário forneceu o próprio exemplo TSX do Round Carousel (React, `useRef` + `requestAnimationFrame`) e o vídeo `WhatsApp Video 2026-11-11 at 15.48.25.mp4` (~12 s a 30 fps).
- A sequência mostra cards com retratos coloridos orbitando em profundidade, card central dominante, periféricos oblíquos, e continuidade de giro ao arrastar. Os controles da interface exibem presets de 253×405, velocidade 5, tilt 0, perspectiva 3000 e raio dos cantos 60. Esses valores da *demonstração* não foram reproduzidos literalmente, pois a Belle tem apenas três categorias e textos/CTAs reais.
- **Não copiar nem usar as fotografias genéricas de pessoas na referência**. Os cards da Belle usam os recortes ilustrativos dos produtos já ligados ao catálogo demonstrativo.

## Engenharia implementada

### Modo cinema

- Três `li.occ-card` originais, nunca duplicados. No-JS mantém a grid normal.
- CSS 3D (`perspective`, `translate3d`, `rotateY` e `scale`) com ângulo circular de 120° para cada um dos três cards, orientação suavizada para fotografia legível.
- GSAP anima avanço/retorno por tween, easing e snap; não há render loop contínuo em repouso. **Não foi criado outro canvas Three.js.** O Three original já movimenta o filme; aqui compositor CSS evita gasto de GPU e memória extra.
- ScrollTrigger só ativa a cena quando ela entra na viewport e atualiza iluminação de fundo em deslocamento suave (máximo ~13 px).
- Avanço lento a cada ~7,9 s apenas no desktop enquanto visível e sem interação. Pausa com hover/foco; após arrastar ou clicar respeita intervalo de leitura.
- Arraste horizontal por pointer com limiar de intenção e breve inércia. `touch-action:pan-y` mantém scroll vertical nativo no mobile.
- Setas, foco, teclado (esquerda/direita/Home/End), live counter `01 / 03` e um único CTA tabulável por vez.
- Ao selecionar card lateral, ele vai para a frente. O botão do card ativo filtra/navega para a seção `#colecao` usando os atributos originais.

### Personalidade de cada ocasião

1. **Dia a dia:** marfim quente, luz difusa, camisa e bolsa como símbolos de rotina elegante. Copy: “Leveza para viver o agora. Presença em cada detalhe.”
2. **Para sair:** espresso e cetim, contraste mais dramático, vestido e bolsa marcantes. Copy: “Quando a noite começa, seu estilo conta a história.”
3. **Para celebrar:** champagne, brilho discreto e caimento, vestido + acessório. Copy: “Os momentos que ficam merecem um look à altura.”

Nada de fumaça, raios, efeitos genéricos, cards fluorescentes, autoplay rápido ou excesso de partículas.

### Mobile, acessibilidade e limites

- 360/390: carrossel responsivo com card principal central e prévias laterais, auto-rotação desativada, toque e setas de 44 px.
- 768: dimensões adaptadas e perspectiva menos agressiva; mantém scroll vertical.
- 1440: cena mais larga, três painéis em círculo e autoplay condicionado.
- Movimento reduzido ou intensidade `essential`: desmonta a camada GSAP e volta para **os três cards em grid/lista normais**, com todos os links acessíveis.
- Página/aba oculta: suspende animação; fora da seção: pausa autoplay; `ResizeObserver` garante recomputação sem rastrear layout por frame.
- Card de produto continua demonstrativo. Nenhum preço, estoque ou foto oficial foram inventados.
- Testes automatizados: `tests/e2e/occasions-round.mjs` + suites existentes no GitHub Actions.
- **Performance real (LCP, INP, FPS):** ainda deve ser medida em celular físico antes de prometer índices numéricos. JS de estilo é transform-only; impacto não é garantido como zero.

## Arquivos

- `index.html` (wrapper de cena, controles e copys)
- `src/occasions/carousel.ts` (GSAP/ScrollTrigger, arraste, foco, acessibilidade, fallback)
- `src/styles/occasions-carousel.css` (arte 3D, nuances por ocasião e responsividade)
- `src/main.ts` (mount após inicializar comércio e diretor de intensidade)
- `src/motion/director.ts` (revelação V8 mantém header, libera os cards para GSAP)
- `tests/e2e/occasions-round.mjs` (4 viewports + fluxo de compra e reduced)
- `.github/workflows/runway-qa.yml` (CI)

## Critérios de aceite

- Três cards com conteúdo original e filtros preservados.
- `#ocasioes` tem uma única instância de cada card: dia, noite e celebrar.
- Mobile navega por toque/setas sem bloquear scroll da página ou cortar títulos/CTA.
- Centro correto após cada snap e depois do loop.
- Desktop funciona com mouse/teclado, sem erro JS/overflow.
- Intensity essential e reduced motion restauram a grid estática.
- Filme/passarela/catalogo continuam passando no QA existente.
