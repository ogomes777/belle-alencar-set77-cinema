# ANTI-PADRÕES: tudo que NÃO voltar à Belle

1. Placas quadradas sem sentido flutuando no cenário 3D e tapando produtos.
2. Retícula/pixels sobre Billie/vestidos, corte em modelos ou glamour de efeitos genéricos.
3. Mesma animação em todas as telas e vários efeitos empilhados na mesma fronteira.
4. Colunas enormes, caixas douradas, luz branca/âmbar estourada, manchas e sombras sem âncora no cenário.
5. Títulos duplicados como `Qual é o seu plano?` em dois planos de z-index.
6. Cards translúcidos falsos somando à UI já existente, alterando a estrutura de vendas.
7. Fundo cobrindo uma viewport com `z-index` alto enquanto o scroll passa atrás.
8. Regressão do vídeo guiado por scroll e os quatro cartões lançados pelo vestido.
9. Cortes bruscos entre sessões, espaços vazios, 100vh inventados, `scrollTrigger.pin` adicional.
10. Revelar que só funciona na descida; ao subir deve reverter ou conservar fim coerente (definir por cena).
11. Movimento permanente decorativo roubando atenção da roupa.
12. Esconder controles de loja/compra ou deixar elementos `inert` sem fallback.
13. Afirmar que a referência foi reproduzida fielmente sem abrir vídeo e analisar frames.
14. Fazer deploy em produção só porque o build passou.

## Regras positivas
- Luxo = menos elementos, mais intenção. Se o efeito chama atenção antes da peça, está errado.
- Luz revela material e estrutura, não cria uma segunda interface.
- Arquitetura de interações existente tem precedência sobre animações novas.
- Cada cena deve mostrar o porquê daquele movimento, não apenas qual biblioteca é usada.
