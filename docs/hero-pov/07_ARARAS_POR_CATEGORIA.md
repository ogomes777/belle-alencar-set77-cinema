# Araras vivas por categoria

## Fonte e contrato

Leia o catálogo pela fonte usada no checkout ativo. Na branch auditada, `Category`, `SHOP_CATEGORIES` e `CATEGORY_LABEL` estão em `src/commerce/types.ts`; `CatalogSource` e `DEMO_CATALOG` são usados pela camada de comércio. O manifesto demonstra oito categorias. Bermudas ainda não aparecem nessa enumeração. Se o checkout já tiver dados reais para bermudas, preserve sua categoria independente e propague-a pela fonte, tradução, filtros, UI e arara. Se a fonte não contiver bermudas, trate como estado vazio quando solicitado por um filtro disponível. Não transforme saias em bermudas nem gere estoque.

| Evento | Resultado observável |
|---|---|
| Tocar um vestido à direita | Arara direita recebe todos os vestidos ativos. O vestido tocado mantém seleção e permanece no primeiro enquadramento possível. A arara esquerda conserva seu estado. |
| Tocar uma calça, saia, bermuda, cropped, camisa ou bolsa | A arara tocada recebe o conjunto integral da categoria real. Atualize rótulo e total com a mesma fonte. |
| Tocar pulseira ou anel | Mostre a categoria no expositor de bandeja integrado àquele lado. Bolsas usam ganchos ou prateleira apropriada. |
| Tocar outra peça da categoria já aberta | Muda seleção. Não reinicia a lista nem reposiciona o lado oposto. |
| Pressionar “Ver peça” | Abre o detalhe canônico do ID selecionado, com tamanho, disponibilidade conforme a fonte e sacola de interesse existente. Voltar mantém página e seleção. |
| Pressionar “Todas as categorias” ou “Voltar à seleção inicial” | Sai do filtro daquele lado e retorna à coleção de entrada da arara. Um seletor discreto de categorias permite trocar direto sem depender de uma peça inicial de cada categoria. |
| Categoria vazia | Informe “Nenhuma peça nesta categoria” e permita voltar ou escolher outra categoria. A arara oposta segue acessível. |
| Catálogo muda ou ativo de cena falha | Atualize pela revisão da fonte. Peça ativa com mídia limitada continua alcançável no painel com a mídia disponível. Se o ID ficar inativo, remova seleção e preserve acesso à lista. |

## Implementação

Guarde por lado `category | null`, `selectedProductId | null` e posição na lista. Derive o conjunto de IDs ativos com ordenação estável da fonte. Trocar rápido de categoria deve cancelar a aplicação de mídia obsoleta. Nunca descarte itens porque o varão tem poucos slots. Exiba uma janela paginada/virtualizada com total, navegação, saltos de página e lista acessível. O lote exibido usa apoios e espaçamento físicos, mantém profundidade e oferece área de toque. Posicione a primeira janela para conter o ID selecionado. Acompanhe o mesmo ID em mesh, raycast, item de teclado, miniatura, detalhe e sacola.

Use um contrato de mídia por categoria, carregue miniaturas e malhas sob demanda e reuse as instâncias dos slots. Acessórios preservam escala e ganham detalhe ampliado no painel. Se o catálogo for demonstrativo, indique isso no contexto comercial e respeite os rótulos existentes. Se os ativos disponíveis tiverem apenas imagem frontal, aponte isso na evidência e mantenha acesso ao produto. Nunca infira estoque ou preço a partir da visualização.

## Teste de completude

Para cada categoria existente, compare o conjunto exato de IDs alcançáveis ao resultado de filtrar os ativos da fonte. Teste categoria com 0, 1, exatamente uma página e mais de uma página. Percorra primeira, intermediária e última página. Cubra seleção de peça na última página, troca de lado, troca rápida de categoria, retorno do detalhe e reabertura do modo 360°. Teste uma peça por lado até a sacola e confirme que o estado persistido segue funcionando.
