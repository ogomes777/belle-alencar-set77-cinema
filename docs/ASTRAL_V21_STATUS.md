# Astral Shell V21 — estado da integração

Base: `feat/belle-gilded-pulse-v20`, commit `e1ac6cd8902da7417816a2e871fe612f12868df5`. A seção `#lojas` possui as quatro unidades e seus controles originais. A branch de trabalho não altera o DOM, as animações nem a experiência comercial.

O kit e a gravação foram extraídos e revisados localmente. O vídeo anexado é idêntico ao vídeo do kit (SHA-256 `a1a6a046c9008fa1ad48a44b6131176d28c35655343d1fafa0abd617b88d9bf3`), 464×832, 30 fps, 26,428 s. As pranchas mostram uma esfera dourada de pontos e linhas com rotação e pulsos luminosos; a imagem é uma gravação de tela em perspectiva, não uma captura direta.

O componente original pago não está no kit nem no repositório. Não foi detectada `REACTBITS_LICENSE_KEY` no ambiente ou em `.env.local`. A ausência impede instalar a fonte licenciada, conferir sua API e montar/testar uma ilha React verdadeira. Nenhuma credencial foi impressa ou criada; `.env.local` está ignorado pelo Git. Nenhuma imitação ou conteúdo de terceiros foi adicionado. `src/astral/preset.ts` registra os parâmetros fornecidos para uso posterior; não está conectado ao site e não representa implementação funcional.

Para continuar, configure localmente uma licença React Bits Pro válida, sem enviar a chave na conversa, e disponibilize o ambiente autenticado. Então instale o componente original pelo registry autorizado, confirme seu export e suas props reais, integre a ilha somente em `#lojas`, e faça QA visual, performance, comércio e acessibilidade antes de preview ou produção.

Nenhum preview ou produção foi publicado. A Vercel não apresenta ferramenta disponível nesta sessão; acesso à API deve ser reconfirmado quando o componente estiver disponível. Os testes executados nesta branch validam apenas a base e o preset, não a esfera.

## Aproximação solicitada posteriormente

A pedido do usuário, foi criada uma aproximação original em Canvas 2D (`src/astral/orbit.ts`), aplicada apenas em `#lojas`. Ela não usa nem contém código do React Bits Pro, não implementa todas as interações do Astral Shell e não possui comprovação de equivalência percentual com o vídeo. A esfera usa pontos e linhas douradas, rotação, oscilação luminosa e pausa fora da tela, com quadro estático para movimento reduzido. Não intercepta os controles das lojas nem o scroll. A versão licenciada continua dependendo do acesso descrito acima.

A aproximação foi refinada com agrupamentos inspirados em coordenadas geográficas, conexões em profundidade e resposta visual de brilho ao ponteiro, arraste por mouse e pulso ao clique. Não é um mapa geográfico fiel nem o componente licenciado; não há medição que sustente 99% de equivalência. A interação é decorativa e touch mantém rolagem vertical. Chromium: verificadas resposta ao hover, quatro controles das lojas e ausência de overflow em 390, 768 e 1440 px. Imagens de evidência em `reports/astral/`. O toque em aparelho físico e performance real ainda exigem validação.

Refino posterior: halo sutil, pulsos de luz ao longo das conexões, redução do trabalho por frame fora de hover e pausa no modo essencial do site, além de `prefers-reduced-motion`. A verificação local posterior incluiu hover e layout em 390, 768 e 1440 px; não substitui a validação de performance em celulares físicos nem demonstra fidelidade percentual ao componente licenciado.

## Layout lateral e desempenho

Em desktop, os quatro cards estão em grade compacta à esquerda e o globo à direita. Em larguras menores, a composição fica em coluna para preservar os botões. Uma camada interna de pontos sugere mais profundidade. A rotação por arraste foi acelerada e aceita mouse e toque horizontal, enquanto `touch-action: pan-y` preserva o scroll vertical. A renderização agrupa conexões por intensidade e reduz a densidade e a resolução do canvas em telas pequenas; o modo essencial e movimento reduzido continuam respeitados.

QA local: typecheck, 34 testes unitários e build aprovados; Chromium em 390/768/1440 sem overflow, com quatro botões e resposta visual ao ponteiro; posição lateral confirmada em 1440. Em uma amostra local de 2,01 s com touch emulado foram observados 118 quadros de `requestAnimationFrame` e cinco eventos de movimento do ponteiro. É uma medição de laboratório, não garantia de FPS ou validação de toque em aparelhos físicos. A esfera continua uma representação estilizada, não um mapa fiel nem o componente React Bits Pro licenciado.
