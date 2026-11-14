# Orquestração de subagentes Codex

O agente principal coordena quatro papéis **consultivos e de execução separada**, se o Codex conectado suportar subagentes:

1. **Reference Forensics**: inspeciona vídeos/demos de transições Promptfly; registra evidência sem escrever código.
2. **Art Director**: propõe seleção curada e aprova/rejeita a estética, proibindo overlays poluentes.
3. **Motion Engineer**: identifica ownership e implementa as poucas passagens certas no código real.
4. **QA Guardian**: executa build, Chrome Playwright, celular e valida comércio/reduced-motion.

O agente principal é dono da integração, conflitos de arquivos, QA final e PR. Não deixar quatro agentes escrevendo no mesmo arquivo ao mesmo tempo. A cada passagem, Motion Engineer entrega diff; Art Director e QA validam; só então seguir.
