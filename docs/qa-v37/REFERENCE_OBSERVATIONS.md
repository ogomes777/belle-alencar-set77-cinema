# V37 — observações das referências

Data: 12/11/2026. Inspeção por Chromium headless 1440×900 e extração FFmpeg de quadros do MP4 original fornecido pelo usuário. Nenhum código/mídia de terceiros foi integrado à aplicação.

## Fontes e acesso

| Fonte | Resultado real |
|---|---|
| https://promptfly.com.br/transicoes | Chromium `page.goto`: `net::ERR_TUNNEL_CONNECTION_FAILED`. A demo ao vivo não pôde ser operada. |
| https://belle-alencar-set77.vercel.app/ | Mesmo erro de túnel. Não foi possível confirmar o deployment pelo navegador externo. |
| https://gb-imports-set77.vercel.app/#inicio | Mesmo erro de túnel. Engenharia da GB não foi observada nesta execução. |
| WhatsApp Video 2026-11-12 at 09.17.13.mp4, sediment file_00000000a58c820eb149f2c96bc0e421 | **Referência original válida**: gravação filmada da página Promptfly e seus demonstradores, duração 51,09s; não é vídeo da Belle/Billie/bug. |

O arquivo original permanece na pasta de anexos, fora do código público. As folhas de contato reduzidas em `reference/` documentam a análise; não são assets comerciais da landing. Amostragem geral a cada 2s e amostragem de 4 quadros/s nos intervalos 1–5s, 13–17s, 32–36s e 40–44s. Estes tempos pertencem à gravação, não à duração especificada pelo site.

## Observado vs. adaptação

| Família | Trecho observado | Inicial / intermediário / final observados | Reversão observada | Adaptação permitida |
|---|---|---|---|---|
| Cortina | 2,75–4,75s; quadro `v37-curtain.png` | Retângulo da demo com `Revela.`; máscara horizontal sólida preta cobre progressivamente a área; estados descoberto e totalmente coberto. | A sequência mostra cobertura e retirada da máscara; não comprova scrub da página ao vivo. | Revelar apenas o recorte original da entrada da passarela ou a imagem real do atendimento; nada sobre hero/controles. |
| Colunas | Mesma faixa, demo ao lado | Faixas verticais chegam/saem com deslocamentos diferentes, criando borda em degraus; conteúdo `Saem.` aparece entre estados. | Estados coberto/revelado repetem. | Ritmo nos três módulos reais; sem três novas placas e sem disputar o transform do carrossel. |
| Varredura | 13,75–16,75s; `v37-sweep.png` | Massa escura atravessa horizontalmente o retângulo da demo, acompanhada por faixa estreita na borda; conteúdo `Entra.`/`Volta.` é revelado. | Retorno da cobertura e nova retirada são visíveis. | Linha/varredura no cabeçalho da coleção, concluída antes do grid. Não mascarar produtos. |
| Círculo | 13,75–16,75s; demo direita | Círculo cresce/retrai a partir de um canto local; aparece um arco grande sobre o retângulo, até revelar `Abre.`/`Volta.`. | Retração do círculo aparece na gravação. | Somente ponte de fundo local para lojas; abandonar se o proprietário existente já faz a entrada. |
| Dobra | Aproximadamente 34–35,75s; `v37-fold.png` | Pequena dobra triangular/sombra no canto da página da demo; texto `Vira.`/`Volta.`. Área principal não tem placas soltas. | Há estados de canto levantado e de canto assentado; ciclo completo e ângulo exato não mensuráveis. | Movimento pequeno no cabeçalho editorial do FAQ; preservar details/summary. |
| Veludo | 41–43,75s; `v37-velvet.png` | Campo escuro com pregas verticais se desloca para o lado, revelando `Fecha.`; a borda do tecido tem massa/curvatura. | Fechamento/reabertura em ciclo aparentes; não se mediu interação de scroll. | Variação sutil de luz/tonalidade no fundo do finale; não transportar a cortina opaca da demo à landing. |
| Moldura | Por volta de 28–30s, folha geral | Linha retangular percorre a borda da própria demo; `Fecha.`. | Não medida. | Opcional; pode ser omitida para sobriedade. |
| Digitação | Por volta de 8–10s e 22s, folha geral | Texto da demo muda para `Escreve.` e passa por cobertura/linhas. | Não medida com precisão. | Opcional; não duplicar títulos nem texto semântico. |

## Limites de medição

Os estados 0/25/50/75/100% **não foram controlados nem medidos**: trata-se de uma filmagem de demos em reprodução e uma página em movimento. As folhas de contato são quadros em tempos conhecidos, não amostras de progresso normalizado. Reversibilidade por scroll, easing, perspectiva exata, velocidade em pixels/s e duração integral de cada ciclo permanecem **NÃO VERIFICADOS**. Não há base para alegar reprodução pixel-perfect.

A implementação Belle deve ser autoral: as famílias e suas direções vêm das observações acima; a faixa curta de progresso, os deslocamentos de 12–24px e o acabamento champagne são decisões do briefing V37, não medidas da Promptfly. A lista de 22 efeitos foi observada como acervo; não é checklist de instalação.
