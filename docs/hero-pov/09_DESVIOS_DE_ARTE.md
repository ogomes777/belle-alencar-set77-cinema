# Desvios documentados entre as referências e a loja 3D

As cinco imagens aprovadas foram geradas separadamente e não compartilham uma geometria única. A planta foi fechada pelo quadro 02 (`src/experience/scene/layout.ts`) e os demais quadros foram reproduzidos por composição. Abaixo, cada desvio material, o motivo e onde está no código.

| Quadro | Desvio | Motivo | Onde |
|---|---|---|---|
| 01 Fachada | O letreiro usa o arquivo oficial `public/brand/belle-alencar-logo.svg` (monograma + wordmark + subtítulo) e não apenas "BELLE ALENCAR" em caixa alta espaçada. | Autoridade 1 (marca fornecida) prevalece sobre a arte gerada. | `facade.ts` · `signTexture()` |
| 01 Fachada | As vitrines são caixas com fundo de pedra, sem ver a arara através delas. | O quadro 06 mostra a parede interna da entrada fechada em nogueira e travertino; manter as duas coisas exigiria vitrines passantes que contradizem o contracampo. | `facade.ts` `WIN`, `boutique.ts` parede frontal |
| 01 Fachada | Sem mesa redonda com vaso no eixo da porta. | O quadro 02 (autoridade de planta) mostra o corredor livre. O vaso de ramos vinho foi preservado na vitrine esquerda, como no próprio quadro 01. | `facade.ts` `buildVase()` |
| 02 Sala | Marcos verticais da parede do fundo (topo do espelho e da cortina) ficam entre 12 e 20 pp abaixo do alvo; marcos horizontais dos montantes e do eixo do espelho ficam dentro de 1 pp. | A referência combina um primeiro plano de lente grande-angular (montantes a 12 %/89 %) com um fundo que só caberia em uma lente de ~23°: não existe câmera pinhole que satisfaça os dois conjuntos. Preferimos a angular, que governa a sensação de entrada e o contracampo. | `layout.ts` `POSES['02']`, `LANDMARKS_02`; medição em `window.__belle.landmarks()` |
| 02/05 | As bases das araras são blocos retangulares de pedra nos dois lados. | 02 e 03 mostram blocos; 05 mostra cilindros. Uma arara só tem um tipo de pé. | `layout.ts` `RAIL.base*` |
| 03/05 | Peças das araras são fotografias frontais 2.5D oficiais do kit em cartões levemente convexos, não malhas com drapeado volumétrico. | Não há GLB das peças. O cartão convexo dá silhueta de perfil nas poses oblíquas; o cabide de madeira e o gancho são 3D. | `product.ts` `garmentCardGeometry()` |
| 04 Provador | O espelho é um reflexo real (Reflector) somente no tier cinema; em touch é uma lâmina metálica com env map. | Custo de um segundo passe de render no celular. | `boutique.ts` `buildMirror()` |
| 06 Porta por dentro | Reproduzido como proposta: o shopping aparece atrás do vidro com uma galeria neutra (sem marcas vizinhas). | Não existe levantamento do shopping; a galeria é cenográfica e neutra por contrato de mídia. | `mall.ts` |
| Geral | Removidas todas as peças decorativas elevadas dos nichos e os arcos de categoria com rótulos. | Pedido explícito: nada que pareça clicável sem ser. As categorias vivem no painel da arara e no capítulo 06. | `boutique.ts` |
