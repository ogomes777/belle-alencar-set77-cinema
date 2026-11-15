# Contrato técnico de motion e fluidez | Aceite V37

## Arquitetura
- Implementar motion no dono da seção ou novo módulo pequeno por fronteira, nunca compositor fixo global.
- Em GSAP/ScrollTrigger: timeline única por propriedade, `invalidateOnRefresh`, `onRefresh`, `kill` nos desmontes, refresh após load de conteúdo dinâmico com parcimônia.
- Em requestAnimationFrame: listener passivo, um frame por tick, progressão derivada de geometria estável, update só dentro do range, cleanup de observer e listeners.
- Nada de animar height, top, left, layout ou `filter:blur()` pesado em toda a página. Preferir transform/opacity/clip-path local e limitar área de repaint.
- Não adicionar fontes, vídeo, libraries ou canvas adicionais à hero; manter budgets de bundle.
- Não injetar HTML para título copiado, evitar clones semânticos e double-read por leitor de tela.

## Scroll bidirecional e retorno
Para cada transição: marcar `at 0`, `at .25`, `at .50`, `at .75`, `at 1`; em retorno verificar `1→0` e o mesmo enquadramento a cada valor. Testar scroll lento, rápido, touch, roda e clique por âncora. Pausar entre sessões: sem quadro branco, sombra permanente ou máscara parcial.

## Visibilidade e acessibilidade
- Conteúdo base SEM JS é visível e clicável.
- `prefers-reduced-motion:reduce`, modo essential, baixa memória e save-data oferecem a versão estática completa.
- Se um controlador quebrar ou evento falhar, remove a máscara e libera o conteúdo.
- Foco teclado visível, modal da loja e sacola preservados, `<summary>` do FAQ intacto.
- Acompanhamento de ARIA e conteúdo não duplicado.

## Alvos de qualidade (não garantias sem medição)
- Meta de fluidez em dispositivo representativo: ~60fps sem travadas sensíveis; registar FPS efetivo e long tasks do teste, não inventar.
- CLS evitável zero causado por motion; zero overflow lateral.
- JS principal e frames do filme não crescem sem justificativa.
- Tráfego de render não deve baixar novos vídeos apenas para transições.
- Respeitar navegadores sem WebGL e tier static.

## Guardrail dimensional
Nenhuma camada V37 pode usar `position:fixed`+`inset:0`+`background` sobre a viewport. Se a direção precisar de overlay cinematográfico, ele deve ser filho absoluto `inset:0` da MÍDIA LOCAL que está sendo revelada, com ponteiros desabilitados e destruído/ocultado ao concluir. Não usar bloqueios de scroll nem wrappers reparenting do DOM comercial.
