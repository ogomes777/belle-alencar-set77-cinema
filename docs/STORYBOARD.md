# STORYBOARD EM 12 CENAS | CINEMA FIRST PERSON

| Cena | Título | O que acontece | Movimento e técnica | CTA |
|---|---|---|---|---|
| 00 | Selo Belle | Monograma BA em dourado emerge, desenho de linha e abertura por máscara | intro uma vez, SVG path draw, mask wipe, tempo curto | Pular intro |
| 01 | A vitrine | POV diante de uma boutique elegante em shopping com profundidade de vidro e reflexos | Three.js ou CSS 3D, câmera dolly, floor perspective, reflection, PBR | Entrar / Ver coleção |
| 02 | A porta | Portas de vidro abrem durante o scroll e câmera atravessa fisicamente limiar | linked scroll timeline, FLIP/cut continuidade, shader refração | Explorar vestidos |
| 03 | Sala viva | Rail de cabides e peças penduradas recebem iluminação e pequenos movimentos | spring physics, wind rigs, dynamic shadows, parallax | Escolher peça |
| 04 | O vestido desperta | Um vestido digital sai da arara, amplia, gira e flutua com tecido reativo | GLB + rig quando houver; até lá protótipo tecido abstrato com etiqueta | Ver detalhes |
| 05 | Fio e caimento | Macro no tecido, close de costura e luz; segue o mesmo vestido na cena | shader anisotrópico, close, light sweep, lens hover | Ver coleção |
| 06 | Universo das categorias | Câmera atravessa três espaços editoriais, vestidos/conjuntos/acessórios | transition morph com media, category rail, FLIP | Filtrar categoria |
| 07 | Provador | Variação em look, corpo/vestido, orbit apenas com asset verdadeiro, gestos | product turntable, spring, gestures, mobile fallback | Selecionar tamanho |
| 08 | Lookbook editorial | Filme / fotografias da coleção real com narrativa alternada | film scrub, match cut, type kinetic, sticky panel | Ver peça |
| 09 | Loja real | Exploração de produtos e preços por filial, detalhe e variantes | shared element, images, filters, quick view, microcart | Adicionar ao carrinho |
| 10 | Minha Belle | Cliente escolhe cidade ou usa a preferência da conta | location transition, preference state, auth quando implementado | Finalizar |
| 11 | Última página | Selo, editorial, contato, confiança e informações reais | restrained finale, CTA persistence, scroll exit | Atendimento |

## Continuidade
Não reiniciar a narrativa a cada section. A câmera viaja na mesma coordenada virtual com referências espaciais constantes. Passar um vestido de plano amplo para macro usando o mesmo asset, sem substituir o personagem por outra roupa.
Teste visual com captura frame 0/25/50/75/100 de cada cena.
A ordem pode evoluir se melhorar fluxo de compra.
