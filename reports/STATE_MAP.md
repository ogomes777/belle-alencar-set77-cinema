# STATE_MAP · arara, ficha, bolsa (implementado)

Fases (`window.__rack.debug().phase`): `rack-idle → rack-drag → rack-momentum → rack-settle → rack-idle`; `piece-anticipate → detail-opening → (ficha aberta) → rack-return`. O voo (`flight.ts`) tem antecipação → voo → impacto → afundar → fim, com trava de reentrada (`isFlying`).

Invariantes verificados por E2E (`tests/e2e/run.mjs`, bloco 6c):
- mesma peça (id/recorte) da arara à ficha e ao fantasma; Esc devolve o foco ao cabide de origem;
- contador muda só no impacto; 10 adições seguidas = contador 10, zero fantasmas, sem duplicar no clique repetido durante o voo;
- Esc no meio do voo conclui o estado (contador 1, nenhum fantasma);
- reduced-motion: adiciona sem trajetória; rolagem vertical nunca é sequestrada pela arara.
