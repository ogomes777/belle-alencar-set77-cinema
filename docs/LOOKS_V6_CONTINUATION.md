# BELLE | PASSARELA DE CONJUNTOS (CONTINUIDADE V6)

Data: 11/11/2026. Alteração feita diretamente na mesma arquitetura e no mesmo componente `#passarela`, sem recriar a landing.

## Entregue em código
- Seis looks, cada um com EXATAMENTE três peças de categorias distintas.
- Ordem estável e identidade da mídia unificada com o catálogo de 48 itens de demonstração: `src/runway/data.ts`.
- Conjuntos: champagne (vestido/bolsa/anel), vinho e areia (cropped/saia/bolsa), azul e pérola (camisa/calça/pulseira), noite (vestido/bolsa/anel), oliva e creme (cropped/saia/bolsa), azul delicado (vestido/bolsa/anel).
- Deslocamento do trilho sincronizado com três cartões por look; seis posições circulares, snap, inércia, setas, drag, toque, navegação reversa e teclado preservados.
- Cada cartão abre exatamente sua peça no quick view, permite favoritar e usar fluxo de variantes/sacola já existente.
- Fallback de looks cropped+saia compõe dois recortes dos próprios produtos, sem simular fotografia de uma pessoa inexistente.
- Texto genérico sobre a faixa removido; faixa contínua de categorias/estrelas permanece imediatamente antes da passarela; nova linguagem visual champagne e tipografia Belle.
- Responsive/mobile, baixa movimentação e acessibilidade continuam respeitados.

## Pendência visual crítica: a própria Belle
As fotos da dona da boutique usadas como referência em conversa anterior **não estão acessíveis como arquivos nesta sessão**, nem existem no repositório. Não é seguro substituir o rosto por uma pessoa aleatória ou declarar equivalência visual.

**Contrato preparado:** `src/runway/belle-portraits.ts`. Só preencher o arquivo com URLs locais de cutouts autorizados após validar fotos de referência, consentimento, correspondência de rosto, proporções e vestuário dos looks. Recomenda-se seis recortes WebP com alpha por look, originados de material aprovado, sem deformar anatomia. Enquanto não houver assets, o palco usa somente recortes de peças demonstrativas.

## Situação comercial
O conjunto usa produtos sintéticos demonstrativos. Não afirmar que os looks são estoque real, roupas vestidas de verdade pela Belle, preço confirmado ou try-on 3D de peça oficial.

## QA
Coberto por mudanças em `tests/unit/runway.test.ts` e `tests/e2e/runway.mjs`. A aprovação depende de compilação/execução nos ambientes de teste, incluindo telas 360, 390, 768 e 1440, navegadores e dispositivos reais quando disponíveis. Não chamar de validado por apenas editar testes.

## Critérios visuais ao receber as fotos
1. Rosto e corpo preservados, mesmo sujeito em todos os seis quadros.
2. Bordas de recorte, cabelos/mãos, sombras de contato e escala plausíveis.
3. Produtos adequados ao look; o card e a foto não podem representar itens diferentes.
4. Sem artefatos em 360/390/768/1440 e sem 404.
5. Acessibilidade, custo de carregamento e opção de movimento reduzido.
