# ATIVOS FALTANTES | PENDENTE DE ATIVO REAL

Tudo abaixo bloqueia a passagem de "pré-lançamento demonstrativo" para "loja real". Nenhum item foi inventado para preencher lacuna.

| # | Ativo | Situação | Impacto na entrega atual | Substituto honesto em uso |
|---|---|---|---|---|
| 1 | **Monograma BA vetorial oficial** | O JPEG de referência do kit está corrompido (ver AUDIT_V3 A1) | Marca exibida em versão tipográfica provisória | Monograma SVG desenhado com Cormorant Garamond, `src/shell/monogram.ts`. Trocar pelo vetor oficial (SVG/AI/PDF) |
| 2 | Logotipo / lettering oficial "BELLE ALENCAR — MODA & ACESSÓRIOS" | Não fornecido | Letreiro da fachada 3D usa a tipografia provisória | Texto em Cormorant gerado em canvas |
| 3 | Fotos oficiais de produto (frente/costas/lateral/detalhe) | Não fornecido | Catálogo sem foto real | Ilustrações vetoriais procedurais com selo "Ilustração · demonstração" |
| 4 | GLB / fotogrametria de vestido real | Não fornecido | Vestido 3D é estudo procedural | Vestido paramétrico com física de tecido, rotulado "Estudo 3D — não é peça do acervo" |
| 5 | Vistas multiângulo para 360 | Não fornecido | **Sem 360 de produto** (proibido simular com foto plana) | Órbita apenas no estudo 3D procedural, rotulada |
| 6 | Vídeo / ensaio Belle | Não fornecido | Sem scroll-film de vídeo | Filme feito com câmera real em cena 3D procedural |
| 7 | Planta / fotos da loja física | Não fornecido | Boutique 3D é direção de arte própria, não réplica | Ambiente modelado proceduralmente (pedra, carvalho, latão) |
| 8 | Catálogo com SKU, preço, grade, cor | Não fornecido | Sem preço; sacola não transaciona | `catalog.demo.ts` com 12 referências `DEMO-*`, `price: null`, `isDemo: true` |
| 9 | Estoque por filial | Não fornecido | Disponibilidade = "consultar loja" | `DemoAvailabilityProvider` retorna `unknown` |
| 10 | Endereços de Frutal, Catalão e Mineiros | Não confirmado | Mostra "endereço a confirmar" | Somente Araxá (Av. Vereador João Sena, 103, Centro) com fonte (bio) |
| 11 | WhatsApp por unidade | Só existe o link geral `wa.me/message/YYDB5NC7JMUQP1` | Todas as unidades usam o link geral, com aviso | Mensagem copiada para a área de transferência (o link curto não aceita texto) |
| 12 | Horários, políticas de troca, frete e retirada | Não fornecido | Não exibidos | Texto "confirme diretamente com a loja" |
| 13 | Backend / Auth / pagamento | Não autorizado nem conectado | Sem checkout, sem conta | Checkout desativado com explicação; preferência só no navegador |
| 14 | Autorização formal de copy e direção | Pendente | Copy marcada como direção sujeita à aprovação | — |

## Convenção para quando os ativos chegarem
- Produto: `public/products/{sku}/{front,back,side,detail}.webp` + entrada em `src/commerce/catalog.ts` com `isDemo: false` e `mediaRights`.
- GLB: `public/models/{sku}/dress_lod{0,1,2}.glb` + poster. O `DressRig` já aceita trocar a malha procedural por GLB mantendo a trajetória de câmera.
- Marca: `public/brand/ba-monogram.svg` substitui `monogram.ts`.
