# Contrato técnico do hero

Este documento descreve a base do filme guiado. No modo Explorar a loja, aplique o contrato 360° do documento 06 e os estados de produto por lado do documento 07.

## Uma cena e um progresso de filme

Conserve Three.js + GSAP, DOM comercial e a inicialização lazy atual. Mantenha `film.ts` como orquestrador do progresso `p` de 0 a 1 derivado de scroll e `Story` como fonte de pose principal. Reaproveite o renderer de `World`. O pano de fundo da experiência ao vivo é um espaço 3D contínuo.

A estrutura nova da boutique precisa compartilhar ancoragens entre câmera, araras, vidro, vestido protagonista e provador. Ao alterar as constantes espaciais, recalcule poses, mira, picking e transições juntos. Valide a abertura da porta com o mesmo progresso de passagem, inclusive ao voltar, evitando clipping do painel, do puxador e da peça. No resize, recalcule spans e enquadramento e derive a pose do scroll atual.

## Deslocamento e gesto

Use um estado local da sala com alvo `left | center | right` e uma translação amortecida. A pose final combina a pose principal do filme com um peso da sala e a pose lateral. O peso se aproxima de 1 na área explorável e volta a 0 suavemente nas duas bordas do capítulo. Ao sair, finalize/cancele a interação e retorne ao centro pela mistura. A pose do próximo capítulo deriva da linha do tempo. Use amortecimento pelo delta de tempo e limite picos ao recuperar foco. Um caminho de posição e mira por lado basta se mantiver os volumes fora da área de colisão. Teste FOV e passagem no aspecto mobile, além do desktop.

| Entrada | Resultado |
|---|---|
| Roda, trackpad vertical ou swipe vertical | Scroll nativo contínuo, inclusive durante exploração |
| Arraste horizontal iniciado no controle “Arraste para olhar” ou em área livre do palco | Positivo leva à arara direita. Negativo leva à esquerda. Feedback já durante o movimento. |
| Botões “Arara esquerda”, “Centro”, “Arara direita” | Mesmos estados do gesto, com foco e seleção anunciáveis |
| Toque curto na peça visível | Detalhe do produto identificado. Se não existir um produto mapeado, não ofereça a peça como alvo. |
| Peça anterior/próxima e setas com foco na navegação de peças | Mudam o produto da arara ativa. Teclas em outros controles mantêm seu comportamento nativo. |
| Cancelamento, segundo dedo, saída da sala ou mudança para fallback | Encerra o gesto e libera captura. Mantém rolagem e acesso aos controles. |

Configure a superfície de gesto com `touch-action: pan-y pinch-zoom` desde a pintura. Use um limiar inicial como 10–14 px e predominância horizontal de 1,25× como valores para calibrar em hardware. Capture apenas depois da decisão horizontal e suprima o clique sintético do arraste. Um movimento vertical continua nativo desde o começo. Trate `pointercancel`, `lostpointercapture`, cliques em DOM interativo e multitoque. Limite a escuta à região relevante. Revise a captura sobre cards do baseline antes de mantê-la. O ícone de mão é acompanhado pelo rótulo e pelos botões, com foco visível.

## Produtos e espelho

- Faça o raycast a partir da câmera real e dos bounds atuais do canvas. Filtre por arara visível/ativa, ID válido e oclusão por arquitetura quando relevante. O volume da peça, a área projetada e a origem da animação de sacola devem acompanhar o mesmo objeto.
- Reuse `commerceApi()`, IDs atuais, escolha de tamanho, confirmação de unidade, persistência e aviso demonstrativo. Atualize o detalhe/seleção de forma consistente ao trocar de lado, fechar o painel ou alternar o tier. Aproveite a API de voo existente com alternativa estática.
- Para o volume, priorize malha otimizada de peças aprovadas, material PBR e silhueta de perfil. Onde houver somente arte frontal demonstrativa, limite o arco de aproximação da peça, concentre o volume nos looks que têm representação suficiente e use o painel de detalhe para leitura. Registre o ativo necessário. Evite efeito de imagem que gira automaticamente para encarar a câmera.
- Mantenha o vestido protagonista e o seletor de vestido/cor do provador. Para espelho real, aproveite o Reflector já referenciado pela boutique e limite resolução/atualização à visibilidade do capítulo. Faça o espelho responder ao ponto de vista sem expor duplicações ou oclusões erradas. Em tier leve use uma solução estática discreta se o custo exigir. Avalie cortina e espelho com um look claro e um escuro.

## Tiers e ciclo de vida

Pôster com enquadramento adequado na primeira pintura, canvas lazy e transição depois do primeiro frame com mídia de entrada pronta. Gere pôsteres da cena final por capítulo, retrato e paisagem. Use o fallback existente para essencial, movimento reduzido, ausência de WebGL e falhas recuperáveis. Dê acesso às peças por navegação HTML ou link de coleção no fallback. Preserve posição, foco e compra na troca de modo. Revise pause fora do filme/aba oculta, BFCache, perda de contexto, limpeza de listener/RAF e descarte de GPU para evitar duplicação na volta ao topo. Faça bake de luz indireta onde fizer sentido, instancie peças de mobiliário repetidas e carregue detalhes dos fundos de forma progressiva.
