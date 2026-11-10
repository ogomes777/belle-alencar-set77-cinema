# Imagens do lookbook

As duas sprites da referência enviada pelo usuário devem ficar aqui como `models.webp` e `pieces.webp`.
Execute `node scripts/fetch-runway-media.mjs` para baixar os URLs originais definidos em `../data.ts`, com TLS e validação do formato WebP, e depois `npm run build`.

Sem esses arquivos, a página usa os renders e ilustrações locais, com indicação de estudo demonstrativo. O build não solicita mídia externa ao visitante. As sprites adicionadas são empacotadas com hash pelo Vite.

Nenhum desses materiais representa catálogo, preço ou estoque oficial da Belle.
