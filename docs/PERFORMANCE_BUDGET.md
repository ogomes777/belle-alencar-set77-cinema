# BUDGET DE PERFORMANCE / CINEMA CONTROLADO
Metas de campo CWV p75: LCP até 2,5s, INP até 200ms, CLS até 0,1 (orientações de referência). Não alegar que o site já as cumpre.
Hero: carregar poster e texto; GLB/Three, vídeo, shader só sob demanda ou depois da primeira pintura.
DPR: até 1.5 mobile, 2 desktop se GPU suportar e FPS medido. Uma cena WebGL ativa. Reduzir draw calls, geometria, texturas, offscreen alpha e shadow passes.
Touch: nunca bloquear rolagem vertical; botão skip cinematográfico. onVisibilityHidden parar renderLoop. Descarregar GLB fora de cena.
Sem JS: hero e CTA devem estar visíveis. Reduced-motion: estado estático, iluminação legível, sem flashes.
Auditar Chrome Android real, Safari iOS, Firefox desktop, 360x800, 390x844, 768x1024, 1440x900.
