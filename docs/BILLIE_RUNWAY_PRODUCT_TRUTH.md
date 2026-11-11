# BELLE ALENCAR · PASSARELA · AUDITORIA DE CORRESPONDÊNCIA

**Situação em 11/11/2026:** o print do usuário mostra que o Look 15 tem vestido champagne assimétrico, bolsa shoulder marfim e anel solitário nos três cards. Retratos anteriores foram gerados com traje incompatível. **Não publicar os retratos anteriores como peças reais da Belle.**

## Fonte de verdade

`src/runway/data.ts` aponta exatamente três `Product` objetos por look, oriundos de `src/commerce/catalog.demo.ts` e `catalog.data.ts`.

A passarela deve exibir a **mesma peça exata** visualmente, e não substitutos aproximados do mesmo tom.

| Nº | Key | Peça 1 (principal) | Peça 2 | Peça 3 |
|---|---|---|---|---|
| 15 | champagne | `vestidos-01`: vestido champagne assimétrico, longo, drapeado em um ombro | `bolsas-01`: bolsa shoulder marfim pequena, alça superior, fecho dourado | `aneis-01`: anel solitário dourado, pedra central de cristal |
| 16 | vinho | `croppeds-02`: cropped vinho de cetim, alças finas e drapeado frontal | `saias-02`: saia plissada areia midi, pregas marcadas | `bolsas-02`: bolsa de mão dourado champagne estruturada |
| 17 | azul | `camisas-03`: camisa azul alongada de listras discretas | `calcas-01`: calça pantalona off-white, cintura alta, pernas amplas | `pulseiras-01`: pulseira elos dourados encorpados |
| 18 | noite | `vestidos-02`: vestido vinho midi com laço estruturado no busto | `bolsas-03`: bolsa matelassê PRETA, corrente dourada | `aneis-02`: anel de pedra rosé em aro dourado cravejado |
| 19 | oliva | `croppeds-04`: cropped verde oliva frente única, gola alta e volume franzido | `saias-04`: saia curta tweed creme, bolsos, botões dourados | `bolsas-04`: tote areia, forma ampla, alças curtas |
| 20 | azul-claro | `vestidos-05`: vestido azul claro longo, decote assimétrico e saia ampla | `bolsas-06`: bolsa champagne drapeada, detalhe de laço frontal | `aneis-05`: anel dourado trançado, pontos de brilho |

## Correção aplicada no código

- Nos seis casos sem fotografia final validada, os três recortes individuais exibidos no **palco** são os **mesmos recortes e IDs** exibidos nos três **cards**. Não há mais silhuetas genéricas soltas sem a bolsa/joia.
- Os recortes no palco constituem **composição de produtos**, não fotografia da Billie vestindo roupa.
- O campo `BELLE_APPROVED_LOOK_IMAGES` continua vazio por segurança: o arquivo não deve ser preenchido com imagens geradas de trajes falsos.
- Teste automatizado: cada trio `[data-product-id]` do palco deve ser idêntico ao trio `[data-product]` no rail, para todos os seis looks.

## Falta para o resultado final solicitado

A usuária referência da loja só pode aparecer em versões de conjunto após produzir **seis retratos editoriais transparentes**, cada qual com as **três peças visualmente idênticas** às imagens de `public/assets/belle/products/cutouts/<slug>.webp`, preservando rosto e corpo da proprietária sem fingir que uma peça aproximada é o item em venda.

Para cada look, preparar contato visual lado a lado (retrato + 3 packshots reais), conferir tecido, cor, comprimento, gola/alça, fivela, bolsa, pedra e formato do anel; avaliar realismo do recorte em fundo xadrez e em fundo champagne. **Somente integrar após aprovação humana dessas seis comparações**.

Não publicar fontes de fotos privadas da proprietária em repositório público. Preview pode ter composição temporária com produtos demonstrativos, sem alegar roupa vestida pela pessoa.
