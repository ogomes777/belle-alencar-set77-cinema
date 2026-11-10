# Entrega de desenvolvimento — Belle Alencar / SET77

Data: 10/11/2026. Branch: `fix/belle-alpha-product-cinema`.
Base preservada: `4eca5fbd7cba78fd6fb86e70b099b72edc2701bd` da branch `claude/bold-dijkstra-jyzqak`.

## Implementação versionada

- `85e39a2` — instalação dos 48 produtos, 144 arquivos alpha, correção visual do vestido 06 e auditoria individual.
- `87b6573` — integração dos produtos em cinema, arara, passarela, provador, catálogo, fichas, favoritos, busca e sacola; testes e 14 pôsteres regenerados.
- O commit de documentação que contém este relatório reúne as evidências reais e os resultados abaixo.

Produtos continuam rotulados como demonstrações sintéticas. Preços, estoque e disponibilidade não foram inventados. Checkout permanece desabilitado.

## Arquivos e comportamento

`public/assets/belle/products/` contém os 48 conjuntos. `src/commerce/catalog.data.ts` e `catalog.demo.ts` conectam seis produtos a cada uma das oito categorias. IDs e variantes continuam compatíveis com a sacola anterior. `commerce/media.*` e `flight-origin.ts` mantêm proporções e o mesmo recorte óptico entre interfaces.

`src/experience/scene/{product,facade,boutique}.ts`, `world.ts` e `film.ts` integram os recortes frontais aos cabides e suportes, aguardam texturas antes dos pôsteres e ajustam enquadramento e profundidade. A peça escolhida no provador é identificada; não há promessa de prova virtual ou caimento real. O vestido procedural é identificado como estudo separado. Os materiais internos da boutique não são desenhados desnecessariamente atrás da fachada.

`src/rack/` implementa 30 roupas em cabides, alturas por categoria, arraste, inércia, cursor, teclado, foco, retorno e voo. Bolsas, pulseiras e anéis permanecem nas categorias e suportes adequados. A miniatura usa o mesmo produto, entra entre fundo e lábio da bolsa e somente então atualiza o contador. Cancelamentos e cliques repetidos não duplicam adições. Reduced motion usa adição direta.

`src/runway/`, `sections.ts`, `index.html` e os estilos mantêm a ordem narrativa, corrigem imagens sem carregamento, recortes mobile e associações incorretas entre look e ficha. Os editoriais antigos não são referenciados pelo código ativo; originais arquivados foram preservados.

## Verificação executada

| Verificação | Resultado |
|---|---|
| Scripts de integridade e QA do kit; instalador dry-run e apply | Aprovados; 48 conjuntos instalados |
| `python scripts/audit_product_alpha.py` | 48 produtos, oito categorias × seis, 144 arquivos, zero erros |
| Auditoria visual por categoria | 48 revisados; perna humana removida de vestidos-06, com antes/depois e proveniência em ASSET_AUDIT.md |
| `npm test` | 33/33, quatro arquivos |
| `npm run build` | TypeScript e Vite aprovados |
| `npm run check` | Estrutura aprovada |
| `node tests/e2e/products.mjs` | 127/127: 96 WebP carregados/decodificados/alpha, 48 fichas, filtros, quatro larguras, teclado, dez voos, contagem e identidade |
| `npm run e2e` | 73/73: navegação, comércio, arara, touch, reduced motion e WebGL |
| `node tests/e2e/runway.mjs` | 51/51: passarela em 360/390/1440, arraste, touch, favoritos, variantes, sacola e scroll nativo |
| WebGL real no Chromium | 45/45 instâncias prontas, zero falhas; 79 draw calls na regressão, render suspenso fora do palco |
| LCP/CLS de laboratório | 390: 1160 ms/0; 1440: 728 ms/0,001. Medições locais, não Core Web Vitals de produção. |

Logs completos em [evidence/logs](evidence/logs). Navegador: Chromium instalado no ambiente, com Playwright. Os testes novos não exigem alteração das dependências de produção.

## Evidências visuais

- [Gravação real da arara, fichas e dez adições](evidence/same-product-flight.webm): 1440×900, 25 fps, 86,32 s.
- [Arara / sala no desktop](evidence/sala-1440.png) e [mobile](evidence/sala-390.png).
- [Passarela mobile](evidence/passarela-390.png) e [catálogo desktop](evidence/colecao-1440.png).
- [Provador mobile](evidence/provador-390.png) e [sacola após dez adições](evidence/bag-after-ten.png).
- [Vitrine WebGL](evidence/webgl-vitrine.png), [boutique WebGL](evidence/webgl-sala.png), [provador WebGL](evidence/webgl-provador.png).
- Capturas `before-*` documentam a base anterior; as oito pranchas e o vestido corrigido estão em [assets](assets).

Foram revisados recortes, proporções, cabides, exibição frontal, correspondência de produtos e composição desktop/mobile. A gravação e as asserções de tempo comprovam a sequência do voo; screenshots isoladas não comprovam sua duração.

## Preview e bloqueio exato

**Não publicado nesta execução. Não há link de Preview confirmado. Produção não foi modificada.**

As ferramentas Vercel não estão expostas à sessão, apesar do plugin mencionado pelo usuário. Em 10/11/2026, a tentativa de acesso a `https://api.vercel.com/v2/user` falhou antes da autenticação: `curl: (56) CONNECT tunnel failed, response 403`. O domínio de produção também teve acesso bloqueado pelo proxy do ambiente. Isso impede criar ou validar um deployment por esse caminho. Não é evidência de falha do login do usuário.

## Promoção e rollback

1. Com acesso Vercel restabelecido, importar a branch `fix/belle-alpha-product-cinema` no projeto existente `belle-alencar-set77` como **Preview**, com `npm ci`, build `npm run build` e saída `dist`. Não criar um segundo projeto.
2. Registrar a URL e o ID do Preview, executar as três suítes E2E com `BASE` apontando para essa URL e revisar as capturas. Registrar também o ID do deployment atualmente em produção antes de qualquer promoção; não foi possível confirmá-lo nesta sessão.
3. Promover somente após aprovação explícita do usuário. O pedido atual preserva produção. Manter o deployment estável anterior para rollback no painel da Vercel; se necessário, promovê-lo novamente. O Preview pode ser descartado sem alterar produção.

## Pendências reais

Preview e validação pública estão bloqueados conforme acima. Safari, aparelhos iOS/Android físicos e meta de 60 fps não foram comprovados. A execução WebGL local usa renderização de software e não fundamenta promessa de desempenho em GPU física. São planos fotográficos 2.5D frontais; GLB completo, costas e tecido físico das peças reais não foram fornecidos. O catálogo comercial oficial, preços e estoque dependem da Belle. A implementação não representa compra ou prova virtual real.
