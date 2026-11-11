# Scroll Couture — Belle Alencar

Base: `7d922d2de14d24229ffa6487c2fef0bb4f0d9627` (`feat/belle-adaptive-glass-header-v14`). O instalador do kit passou em dry-run e foi aplicado em branch de desenvolvimento. A seção #como-comprar foi substituída; o restante da landing foi preservado. O diretor de movimento anterior para essa seção foi removido para não competir com o novo driver.

O vídeo é controlado pelo scroll nativo, com seeks serializados e reversíveis, quatro cards progressivos e CTA real para loja e coleção. Há poster e fallback para falha de mídia, movimento reduzido, modo essencial e condições de economia de dados. Em telas pequenas, o botão flutuante de contato é ocultado apenas enquanto a seção está visível para não cobrir os CTAs; o link de WhatsApp e fluxo da sacola permanecem no site.

Origem: o vídeo original do ZIP tem SHA-256 `61bb8b423072d1e0d3f21df9f61dc321065fb6beca95b25d239b1fcaaded78b4`, idêntico ao MP4 anexado. O original está preservado no pacote fora do repositório. O site usa cópias H.264 otimizadas e sem áudio do kit, 3,733 s (720×404 mobile, 1280×720 desktop).

## QA local

- TypeScript, 34 testes unitários, build Vite e `npm run check`: aprovados.
- Chromium em 360×640, 390×844, 768×900, 1024×900 e 1440×900: sem overflow; vídeo avançou aproximadamente 0,24→3,64 s e voltou a 0,66 s; quatro cards e CTAs ativos ao fim. Capturas nesta pasta.
- Movimento reduzido e falha simulada do MP4: fallback legível e interativo. Seletor de loja abriu pelo CTA; link para coleção funcionou.
- Inspeção visual detectou e corrigiu sobreposição do botão flutuante sobre o CTA. Os momentos de entrada dos cards foram ajustados ao avanço do tecido.
- A regressão ampla detectou falhas de rede para `fonts.googleapis.com` (CONNECT bloqueado pelo ambiente) e requisições de vídeo canceladas durante navegação; também falharam duas verificações de foco do quick view e ocorreu timeout no clique da ocasião (tests/e2e/run.mjs:203). A suíte geral terminou incompleta; essas falhas precisam ser investigadas antes de produção.
- Safari/iOS, Android físico, touch físico, medição real de INP/CLS/LCP e Preview público não foram validados. O comportamento de seek depende do decoder do aparelho.

## Publicação

Não houve deploy de produção. Ferramentas Vercel não foram expostas nesta sessão e `https://api.vercel.com/v2/user` retornou `CONNECT 403`; o Preview não pôde ser criado ou conferido. Publicar a branch em Preview após restabelecer acesso, repetir os fluxos de navegação, loja, catálogo, sacola e WhatsApp e validar em dispositivos reais antes de considerar produção.
