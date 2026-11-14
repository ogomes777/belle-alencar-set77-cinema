---
name: belle-commerce-guard
description: Protege catálogo, roupas, filtros, quick view, sacola, loja e CTA WhatsApp durante qualquer implementação visual.
---

# Skill: preservar o produto e a conversão

## Áreas sagradas
- `src/commerce/*`, `src/commerce/collection-reveal.ts` e CSS do catálogo.
- `#colecao`, filtros, tamanhos, preço, quick view e sacola.
- Passarela: drag, look atual, 18 itens, 6 looks, touch e CTA.
- Filiais e WhatsApp, acessibilidade do header, `#duvidas details`.

## Comportamento
1. Auditar se o efeito novo escreve opacity/transform/clip-path em cards comerciais existentes ou se intercepta cliques. Se sim, rejeitar a implementação.
2. Fazer smoke tests: abrir produto, selecionar tamanho, adicionar sacola, fechar com Escape, troca de loja, filtros, FAQ e botão de WhatsApp.
3. Acessibilidade: foco, leitor de tela, contraste, reduced motion.
4. Em caso de erro de animação, conteúdo permanece visível e touch funciona.
5. Não modificar precificação, estoque, textos legais, imagens ou estrutura comercial.

## Evidência
Tabela de testes com estado de viewport 390 e 1440 e screenshot/vídeo de interações.
