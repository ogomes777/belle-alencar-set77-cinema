# CONTRATO MULTILOJA | CIDADE, CATALOGO E CARRINHO

## Tabelas propostas
stores(id,slug,city,state,address,active,contact,openingHours,fulfillmentRules)
products(id,slug,title,description,mediaRights,category,active)
variants(id,productId,size,color,sku)
store_inventory(storeId,variantId,availableQty,reservedQty,lastUpdated)
store_prices(storeId,variantId,priceCents,currency)
users(id,authProviderId)
user_preferences(userId,storeId,updatedAt)
cart(id,userIdOrSessionId,storeId,status)
cart_items(cartId,variantId,quantity,priceSnapshot)
orders(id,userId,storeId,status,total,fulfillment)

## Regras
- Seleção de filial persistida no navegador (visitante), sincronizada no perfil server-side só depois de Auth real.
- Usuário pode trocar unidade sempre, mas carrinho deve validar estoque/preço da nova unidade e exigir resolução explícita.
- Nunca misturar estoque de Frutal e Araxá sem regra comercial aprovada.
- Disponibilidade sempre consultada no servidor na finalização; reserva transacional.
- Integração Pix/cartão, frete/retirada, recibo e devolução só com regras aprovadas.
- Segurança: Auth oficial, autorização por unidade, políticas de acesso/RLS, rate limits, proteção LGPD.
- Sem backend, fluxo de adicionar ao carrinho pode ser somente protótipo local claramente rotulado, nunca cobrar de verdade.
