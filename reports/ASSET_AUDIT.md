# Auditoria dos48 produtos — alpha, identidade e conteudo visual

Data:10/11/2026. Baseline de codigo inspecionada:`4eca5fbd7cba78fd6fb86e70b099b72edc2701bd`. Branch de integracao:`fix/belle-alpha-product-cinema`.

## Resultado e limite da revisao

Os48 itens foram inspecionados visualmente no atlas do kit e, depois, em oito pranchas ampliadas com seis recortes por categoria, comparados sobre checkerboard e marfim. Foram abertos individualmente os PNG de `calcas-02` e `vestidos-06` para resolver ambiguidades. O PNG corrigido de `vestidos-06` e o WebP packshot final tambem foram abertos e revisados.

**Foi encontrado e corrigido um P0 real:** o vestido preto06 continha uma faixa marrom opaca na fenda que aparentava fragmento de perna. O restante do conjunto nao apresentou pessoas, partes humanas, manequim visivel, cenario, moldura opaca ou contornos amputados nas imagens revisadas. `calcas-02` tem duas pernas muito amplas e um vao central, portanto sua categoria de pantalona e adequada; nao foi trocada por saia.

Isto e revisao visual assistida do prototipo, nao aceite humano/comercial da Belle. Os48 continuam sinteticos, `isDemo=true`, preco nulo e estoque nao confirmado; nenhum deles comprova SKU oficial ou caimento3D real.

## Evidencia tecnica executada

- `python scripts/verify_kit.py` no kit: `KIT_VALIDATED`,818 indices de video; SHA256 do MP4:`29cded4d52d56eae6c1fa678768f4fa1916163dffd139b01f39ed9d9d6702af9`.
- SHA256SUMS do kit:346 arquivos conferidos, zero ausencias e zero divergencias. Originais do kit preservados fora do checkout.
- `python scripts/qa_novos_assets.py` no kit:48 produtos,8×6 categorias e144 arquivos alpha aprovados tecnicamente; esse teste sozinho nao detectou a perna.
- `python scripts/audit_product_alpha.py --report reports/ASSET_ALPHA_METRICS.json` no repositorio:48 produtos,8×6,144 arquivos, zero erros apos correcao. Formato, dimensoes do manifesto, alpha[0..255], quatro cantos, margem, silhueta nao vazia e equivalencia PNG/WebP alpha verificados.
- Detalhes por arquivo, percentuais realmente transparentes e SHA256 atuais em `ASSET_ALPHA_METRICS.json`.
- Pranchas finais em `assets/review-{categoria}.jpg`; cada coluna mostra o cutout ampliado e o packshot em marfim. Checkerboard so existe nestas evidencias, nunca dentro dos assets de produto.

## Substituicoes de baseline rastreadas

| Uso na baseline4eca5fb | Fonte antiga | Fonte nova / criterio |
|---|---|---|
| `src/commerce/catalog.demo.ts:375` | `/editorial/{slug}.webp` em todos os produtos | `cutouts/{slug}.webp` para cena/voo e `packshots/{slug}.webp` para UI; nome/categoria do novo manifesto |
| `src/experience/scene/facade.ts:144` | textura editorial antiga na vitrine | cutout com apoio e escala propria de roupa/bolsa |
| `src/experience/scene/boutique.ts:112` | textura editorial antiga no nicho | cutout com proporcao alpha e prateleira/pedestal |
| `src/film.ts:304` | `/editorial/{slug}.webp` no provador | produto isolado demonstrativo, sem prometer vestir uma pessoa nem360 real |
| `src/runway/runway.ts:27` | editorial antigo como modelo/plano | cutout correspondente ao mesmo ID na ficha e sacola |

A tabela registra a origem comprovada na baseline; validacao HTTP, cobertura dos fluxos e capturas das cenas integradas pertencem ao relatorio de release. Nao foi feita alegacao de teste de navegador nesta auditoria de arquivos.

## Revisao individual —48/48

Todos os itens abaixo tiveram PNG/WebP/packshot tecnicamente aprovados. `bbox` e coordenada alpha do cutout atual. Os nomes sao do novo manifesto, e nao as descricoes divergentes que existiam na baseline.

| Slug | Nome canonico | Categoria | Canvas / bbox alpha | Fundo A=0 | Resultado visual |
|---|---|---|---|---|---|
| `camisas-01` | Camisa branca de corte estruturado | camisas | 376×492 / `30,30,346,462` | 40.43% | PASS demo — Gola, mangas e punhos completos; interior da gola e tecido, sem pescoco. |
| `camisas-02` | Camisa champagne com brilho acetinado | camisas | 399×489 / `30,30,369,459` | 41.18% | PASS demo — Brilho acetinado e mangas amplas; nenhum torso ou cenario. |
| `camisas-03` | Camisa azul de tecido listrado | camisas | 412×501 / `31,31,381,470` | 43.49% | PASS demo — Listras, mangas dobradas e barra arredondada coerentes. |
| `camisas-04` | Camisa rosé com laço | camisas | 412×498 / `31,31,381,467` | 41.15% | PASS demo — Laco frontal e punhos completos; silhueta de camisa. |
| `camisas-05` | Camisa utilitária areia | camisas | 400×501 / `31,31,369,470` | 39.06% | PASS demo — Bolsos, botoes e ombros utilitarios coerentes; nao e camisa chocolate antiga. |
| `camisas-06` | Camisa estampada de corrente dourada | camisas | 417×501 / `31,31,386,470` | 41.13% | PASS demo — Estampa de correntes e gola completas; sem logo legivel ou corpo. |
| `croppeds-01` | Cropped preto de corset | croppeds | 403×472 / `29,29,374,443` | 56.48% | PASS demo — Corpete preto com duas alcas, borda inferior completa. |
| `croppeds-02` | Cropped vinho de cetim drapeado | croppeds | 437×466 / `29,29,408,437` | 56.05% | PASS demo — Drapeado vinho com alcas, sem torso entre elas. |
| `croppeds-03` | Cropped champagne de um ombro | croppeds | 413×478 / `29,29,384,449` | 45.64% | PASS demo — Um ombro champagne, argola de tecido e contorno completos. |
| `croppeds-04` | Cropped verde oliva frente única | croppeds | 410×485 / `30,30,380,455` | 43.54% | PASS demo — Frente unica verde, gola vazada sem pescoco. |
| `croppeds-05` | Cropped branco com mangas bufantes | croppeds | 598×445 / `37,37,561,408` | 54.04% | PASS demo — Mangas bufantes e corpo curto unidos; ausencia de bracos. |
| `croppeds-06` | Cropped champagne com nó | croppeds | 436×479 / `29,29,407,450` | 56.32% | PASS demo — Alcas finas e no champagne; contorno completo. |
| `vestidos-01` | Vestido champagne assimétrico | vestidos | 308×489 / `30,30,278,459` | 61.48% | PASS demo — Vestido champagne assimetrico; sem braco/torso e barra inteira. |
| `vestidos-02` | Vestido vinho com laço no busto | vestidos | 207×438 / `27,27,180,411` | 55.21% | PASS demo — Vestido vinho com laco no busto, manga curta de tecido. |
| `vestidos-03` | Vestido renda off-white | vestidos | 340×455 / `28,28,312,427` | 62.05% | PASS demo — Renda off-white, duas alcas e saia; nao pessoa/modelo. |
| `vestidos-04` | Vestido longo floral | vestidos | 377×467 / `29,29,348,438` | 64.18% | PASS demo — Vestido floral com alcas e saia ampla; imagem/categoria corretas. |
| `vestidos-05` | Vestido azul fluido | vestidos | 336×517 / `32,32,304,485` | 61.96% | PASS demo — Vestido azul longo, frente unica e tecido plissado completo. |
| `vestidos-06` | Vestido preto com detalhe dourado | vestidos | 827×1629 / `38,38,793,1595` | 52.51% | PASS apos correcao — P0 original: faixa opaca cor de pele na fenda. Corrigido com imagegen, fenda agora transparente; ombro unico preto e flor dourada preservados. |
| `saias-01` | Saia acetinada pérola | saias | 287×488 / `30,30,257,458` | 51.47% | PASS demo — Saia acetinada perola: cintura e barra completas, sem pernas. |
| `saias-02` | Saia plissada areia | saias | 391×499 / `31,31,360,468` | 50.9% | PASS demo — Saia plissada areia, pregas e cintura coerentes. |
| `saias-03` | Saia envelope off-white | saias | 347×488 / `30,30,317,458` | 45.95% | PASS demo — Saia envelope off-white com laco e sobreposicao completa. |
| `saias-04` | Saia curta tweed claro | saias | 419×352 / `26,26,393,326` | 40.79% | PASS demo — Saia curta tweed, bolsos e botoes; nao vestido. |
| `saias-05` | Saia de camadas off-white | saias | 363×517 / `32,32,331,485` | 45.91% | PASS demo — Saia de camadas off-white: folhos sao tecido, nao fundo. |
| `saias-06` | Saia chocolate drapeada | saias | 308×517 / `32,32,276,485` | 40.57% | PASS demo — Saia chocolate drapeada com flor; nao a saia vinho dos dados antigos. |
| `calcas-01` | Calça pantalona off-white | calcas | 292×488 / `30,30,262,458` | 49.79% | PASS demo — Pantalona off-white: duas pernas e vao central transparente. |
| `calcas-02` | Calça chocolate de caimento amplo | calcas | 316×491 / `30,30,286,461` | 50.44% | PASS demo — Pantalona chocolate muito ampla: duas pernas separadas por vao central; nao classificar como saia. |
| `calcas-03` | Calça alfaiataria areia | calcas | 237×490 / `30,30,207,460` | 42.79% | PASS demo — Alfaiataria areia: duas pernas retas, cintura integra. |
| `calcas-04` | Calça reta preta | calcas | 217×489 / `30,30,187,459` | 51.15% | PASS demo — Calca preta reta, pernas isoladas e sem pes humanos. |
| `calcas-05` | Calça cargo oliva | calcas | 251×507 / `31,31,220,476` | 43.58% | PASS demo — Cargo oliva, bolsos laterais e cintura completos. |
| `calcas-06` | Calça jeans flare azul | calcas | 278×510 / `31,31,247,479` | 54.54% | PASS demo — Jeans flare azul, pernas abertas e barras completas. |
| `bolsas-01` | Bolsa shoulder marfim | bolsas | 445×500 / `31,31,414,469` | 66.14% | PASS demo — Shoulder marfim: alca completa e vao interno transparente. |
| `bolsas-02` | Bolsa de mão dourado champagne | bolsas | 404×422 / `26,26,378,396` | 56.93% | PASS demo — Bolsa de mao dourada: ferragem em no, nao texto/logo legivel. |
| `bolsas-03` | Bolsa matelassê preta | bolsas | 455×335 / `28,28,427,307` | 32.76% | PASS demo — Matelasse preta: corrente e fecho inteiros; vazios transparentes. |
| `bolsas-04` | Bolsa tote areia | bolsas | 456×472 / `29,29,427,443` | 50.37% | PASS demo — Tote areia: duas alcas e vao completos. |
| `bolsas-05` | Bolsa shoulder vinho | bolsas | 523×362 / `32,32,491,330` | 40.73% | PASS demo — Shoulder vinho: alca/fecho e tira integral; nao bolsa dourada antiga. |
| `bolsas-06` | Bolsa champagne drapeada | bolsas | 458×451 / `28,28,430,423` | 53.2% | PASS demo — Bolsa champagne drapeada: alca rigida completa. |
| `pulseiras-01` | Pulseira de elos dourados | pulseiras | 516×354 / `32,32,484,322` | 64.77% | PASS demo — Elos dourados, vazados e fecho completos; sem pulso. |
| `pulseiras-02` | Pulseira riviera delicada | pulseiras | 566×284 / `35,35,531,249` | 76.84% | PASS demo — Riviera delicada com pedras claras e fecho. |
| `pulseiras-03` | Bracelete escultural dourado | pulseiras | 535×300 / `33,33,502,267` | 58.13% | PASS demo — Bracelete escultural dourado aberto; sem braco. |
| `pulseiras-04` | Pulseira de pérolas | pulseiras | 555×374 / `34,34,521,340` | 48.75% | PASS demo — Pulseira de perolas: contas claras e vazado central completo. |
| `pulseiras-05` | Pulseira corda dourada | pulseiras | 541×367 / `33,33,508,334` | 77.22% | PASS demo — Corda dourada, fecho e abertura transparentes. |
| `pulseiras-06` | Pulseira com pingentes | pulseiras | 558×416 / `34,34,524,382` | 87.28% | PASS demo — Corrente delicada com pingentes: argolas, pedras e extensao completas. |
| `aneis-01` | Anel solitário de cristal | aneis | 507×321 / `31,31,476,290` | 66.72% | PASS demo — Solitario cristal com aro e garras, sem dedo. |
| `aneis-02` | Anel de pedra rosé | aneis | 515×356 / `32,32,483,324` | 59.71% | PASS demo — Anel de pedra rose com aro e halo; nenhuma mao. |
| `aneis-03` | Anel dourado de curvas | aneis | 473×383 / `29,29,444,354` | 52.11% | PASS demo — Anel dourado de curvas com aro interno transparente. |
| `aneis-04` | Anel cravejado de brilho fino | aneis | 522×288 / `32,32,490,256` | 51.51% | PASS demo — Anel cravejado com vazado central completo. |
| `aneis-05` | Anel trançado dourado | aneis | 515×261 / `32,32,483,229` | 60.73% | PASS demo — Anel trancado dourado, aro completo e sem dedo. |
| `aneis-06` | Anel statement de cristais | aneis | 510×438 / `31,31,479,407` | 64.52% | PASS demo — Anel statement de cristais, aro/garras completas. |

## Correcao de vestidos-06

Antes/depois:`assets/vestidos-06-before-after.jpg`. A edicao foi feita com `image_gen`, usando como referencia o PNG original e solicitando retirar somente o residuo de pele da fenda, mantendo vestido preto de um ombro, drapeados e flor dourada. Foi usada saida com fundo transparente. Nenhuma ferramenta de pixels foi usada para pintar, reconstruir ou apagar a perna; o ajuste semantico foi feito pelo gerador de imagem.

Depois da edicao, o pipeline apenas reenquadrou o resultado com margem, converteu PNG/WebP preservando alpha e normalizou o packshot900×1125 com altura optica810px. O reenquadramento ignora alpha=1 quase invisivel fora do corpo para definir os limites opticos; nao altera RGB do tecido nem simula partes do produto. Nao foi afirmada identidade pixel-a-pixel: e uma correcao sintetica que preserva os elementos identificadores do mesmo estudo, nao uma fotografia oficial.

Artefato gerado original preservado externamente:`/workspace/generated_images/exec-8a44adc5-b325-406a-9ca8-3348edce9d80.png`; o kit original com defeito tambem permanece fora de `public/`. Os arquivos servidos sao `cutouts/vestidos-06.png`, `cutouts/vestidos-06.webp` e `packshots/vestidos-06.webp`. O manifesto instalado registra dimensoes, limites do packshot e `assetCorrection` com SHA256/proveniencia.

Limites finais:cutout827×1629,bbox(38,38,793,1595);packshot900×1125,bbox(254,139,646,949). A fenda deixa ver o fundo alpha, sem perna/cor de pele. O ouro permanece restrito ao broche.

## Gate remanescente

Nao ha P0 de conteudo de produto observado no conjunto final revisado. O aceite de composicao exige as capturas e testes de cenas/gestos no navegador; aprovacao humana da demo e confirmacao de catalogo oficial continuam pendentes. Imagens2D nao autorizam prova virtual nem giro360 de produto real.
