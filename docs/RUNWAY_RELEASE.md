# Belle · passarela em profundidade · 10/11/2026

Implementação da mecânica do lookbook fornecido na primeira dobra da landing, preservando a boutique, catálogo e atendimento existentes.

## Referência e comportamento

O vídeo recebido tem 31,33 s, 832 × 464 e 30 fps. Foram extraídos e inspecionados os 940 quadros em dez pranchas numeradas, além de quatro pranchas maiores com amostras a cada 0,5 s. A referência é uma gravação de uma tela; as modelos são imagens em camadas com escala, desfoque e sombras, e não modelos WebGL animados.

No vídeo, o look frontal avança e sai pela direita; a fila ocupa a próxima profundidade e o trilho de produtos acompanha o movimento. Há pausas longas entre gestos: não se trata de autoplay. A sequência retorna do look 20 ao 15 sem encerrar a fila. O cursor passa de anel para cápsula durante o arraste.

O código anexado fornece os sete stops de profundidade, seis recortes de modelos e doze recortes de produtos. `src/runway/depth.ts` aplica esses stops; uma posição contínua controla a fila, o trilho e o número. O renderer usa CSS transforms, recorte SVG aninhado, snap e interpolação exponencial. Não cria um segundo contexto WebGL. A renderização e o cursor param em repouso ou fora da tela.

Adaptações para a Belle: marca e fontes locais, texto em português, acesso às quatro filiais, favoritos e sacola persistidos pelo comércio existente. O + abre o produto para escolher tamanho antes de adicionar. Não foram inventados preços ou estoque. A referência visual é identificada como editorial demonstrativo. A rolagem vertical permanece nativa para acessar a boutique; trackpad horizontal, Shift + roda, arraste, toque, setas e botões controlam os looks. Movimento reduzido aplica a posição diretamente. Controles de produtos fora do trilho visível ficam inertes.

O filme 3D inicia ao aproximar-se da seção. Sua suíte agora navega até o palco e aguarda avanço de frames com timeout explícito de 30 s: mede liveness em SwiftShader, não FPS de GPU real.

## Mídia original pendente

Os downloads de `images.higgs.ai` retornaram 403 no proxy. As duas sprites originais NÃO foram baixadas, nem seu aspecto final validado. O build testado mostra renders locais de vestidos e ilustrações procedurais como fallback identificado. Portanto, a composição final com modelos fotografadas ainda não está concluída.

O script `node scripts/fetch-runway-media.mjs` baixa os URLs fornecidos, mantém TLS, valida a assinatura WebP, grava por rename e informa SHA256. Após liberar `images.higgs.ai` e, se houver redirecionamento, `d8j0ntlcm91z4.cloudfront.net`, execute-o e depois `npm run build`. Os arquivos ficam em `src/runway/assets`, são empacotados pelo Vite e servidos localmente. O build sem esses arquivos não solicita mídias externas ao visitante. A entrada `sprite` também é usada pelo quick view.

## Validação executada

- `npm test`: 30/30, incluindo periodicidade em ambos os sentidos, ordenação da profundidade, sincronização das duas peças e ausência de preços inventados.
- `npm run build`: typecheck e build aprovados.
- `npm run check`: aprovado.
- Suíte existente `npm run e2e`: 73/73, incluindo arara, voo de peças, preferências, acessibilidade, WebGL e pausa do render fora do palco.
- `node tests/e2e/runway.mjs`: 51/51, em 360/390/768/1440; sem overflow ou erros de console; controles comerciais acessíveis, loop reverso, número e produtos sincronizados, favorito persistido, variante na sacola por filial, pointer drag, toque via eventos touch do Chromium, movimento reduzido e scroll vertical nativo. O CTA de atendimento fica oculto enquanto a passarela está visível para não cobrir as peças.
- Laboratório local da suíte completa: LCP 684 ms (390) / 524 ms (1440), CLS 0 / 0. Não são métricas de campo.
- Capturas finais: `docs/qa/runway-390.png`, `docs/qa/runway-1440.png`. São capturas do fallback; não demonstram as sprites originais.
- Chromium/SwiftShader. Safari, Firefox e dispositivos físicos não foram validados.

Na nuvem, as suítes usaram `NODE_PATH=/workspace/.belle-tools/node_modules NODE_OPTIONS=--require=/workspace/.belle-tools/system-chromium.cjs`, com o build servido por `npm run preview`. O servidor de desenvolvimento também está disponível via `npm run dev`.

## Publicação e configuração

Git HTTPS permite ler o repositório. As chamadas à API do GitHub e ao domínio de produção Vercel retornaram 403 de CONNECT no proxy. Não há ferramenta de deploy Vercel disponível nesta sessão. Um push não confirma um deploy nem a atualização do domínio público.

O serviço de configuração do ambiente retornou `INVALID_ARGUMENT` tanto na leitura do rascunho quanto na tentativa de salvar os domínios necessários. A persistência do rascunho e a publicação do ambiente NÃO foram confirmadas. Publicar o snapshot do ambiente e publicar a aplicação na Vercel são ações distintas.

Nas configurações do ambiente, os destinos relevantes são `images.higgs.ai`, `d8j0ntlcm91z4.cloudfront.net`, `api.github.com`, `api.vercel.com`, `vercel.com` e o domínio do projeto `belle-alencar-set77.vercel.app` (além do host de preview que a Vercel retornar). Preserve as permissões já existentes. Após a liberação, validar acesso, baixar as duas sprites, repetir o QA visual e publicar/validar um deployment real antes de afirmar que a landing está publicada.
