---
name: belle-scroll-motion
description: Implementa scroll motion de fronteiras com GSAP ou requestAnimationFrame, sem scroll hijack, pin extra, overlays globais nem proprietários duplicados.
---

# Skill: motion engineer de fronteiras

## Antes do código
- Ler `docs/CONTRATO_MOTION_E_PERFORMANCE.md`.
- Desenhar ownership `seção → elemento → propriedades CSS → controller existente`.
- Comprovar que não existe `initCoutureV35`, `initCoutureTransitions`, `initMotionDirector` no `src/main.ts` atual.

## Implementar
1. Usar o **elemento original ou uma camada interna local** como superfície; nada fixo no viewport e nada anexo global no body.
2. Um controller por propriedade. Preferir ampliar o timeline existente caso ele controle a área, ou um slot local limitado se independente.
3. Cada novo efeito terá `init`, `update`, `destroy`, tratamento de `resize`, `pageshow`, visibilidade da aba e modo reduzido, sem observers órfãos.
4. Transformar `translate/opacity/clip-path` com limite de área e sem layout thrash, ler geometria do elemento estável não transformado.
5. Para scrub reversível, derivar o estado da posição real e não do delta de wheel. Recalcular ao retornar (inclusive BFCache).
6. Fallback é conteúdo visível sem JS e no tier essential.

## Verificar
- Scroll descendo/subindo/pausando; progresso determinístico.
- Sem duplicar timing GSAP e CSS transitório no mesmo atributo.
- Mobile respeita interação principal e vídeos lazy.
- Revisar CSS: nenhum `position:fixed` global, 100vh ou `z-index` invasivo.
