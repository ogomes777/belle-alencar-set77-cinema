# Referência e adaptação — Belle Alencar

Referência local do kit: `REFERENCIA_ORIGINAL_27s_818quadros.mp4`, 464×832, 30 fps, duração 27,261667 s. Foram revisadas as pranchas de todos os quadros e sequências ampliadas extraídas a 10 fps. O vídeo original e o pacote interno não foram publicados neste repositório público.

| Trecho aproximado | Observação | Adaptação implementada |
|---|---|---|
| 0–1,4 s | Peça sob cursor cresce e avança sobre vizinhas | Foco por proximidade, profundidade e pêndulo independente no cabide. |
| 1,4–2,5 s | Ficha creme abre sobre fundo desfocado; volta à arara | Mesma identidade e recorte na ficha; retorno ao cabide com foco de teclado restaurado. |
| 4–7,3 s | Vizinhas abrem espaço com foco semelhante a um dock | Afastamento local, balanço amortecido e atraso da barra. |
| 7,6–8 s | Painel da bolsa com miniaturas | Sacola persistente com os mesmos produtos e variantes. |
| 10,6–11,8 s | Deslocamento horizontal revela outras peças | Arraste, inércia, wheel horizontal, setas, Home e End; rolagem vertical preservada. |

A trajetória exata da miniatura até a bolsa não é mensurável na captura da referência. Ela atende ao requisito explícito do usuário: mesma imagem, antecipação de 130 ms, arco Bézier de 860 ms, pêndulo e atraso da barra, afundamento de 160 ms entre fundo e lábio da bolsa. O contador muda após 92% desse afundamento. Esses tempos são parâmetros da implementação, não medições do vídeo original.

As 30 roupas são packshots sintéticos frontais; acessórios não são pendurados como vestidos. O provador apresenta a peça selecionada sem prometer simulação física real. Marca, textos e direção visual são próprios da Belle.

Evidência própria: `evidence/same-product-flight.webm` (gravação real do navegador a 25 fps; não constitui medição de fluidez a 60 fps). Os testes verificam a identidade do fantasma, ausência de incremento antecipado, dez adições e remoção de todos os fantasmas. Capturas isoladas podem ocorrer depois do movimento; a gravação e as asserções temporais são a evidência da sequência.
