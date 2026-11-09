# MOTION SYSTEM | 371 PADRÕES COMO BIBLIOTECA
Consultar knowledge/MOTION_ATLAS_371.md para catálogo integral.

Motion deve ter uma gramática: **intenção → preparação → reveal → settle → permanência → transição**, e não “tudo rodando” todo o tempo.

Tier CINEMA: full WebGL+shader, 3D câmera, poucas partículas se tiver razão narrativa, GSAP scrub e áudio opcional.
Tier TOUCH: reduzir shaders, 1 cena ativa, touch gestures, parallax reduzido, DPR baixo.
Tier STATIC: reduced-motion, Save-Data, hardware fraco e falha GPU. Conteúdo pronto, sem bloquear nada.

Tokens sugeridos (ajustáveis via QA): 150ms feedback, 320ms UI, 700ms scene transition, 1100ms hero reveal. Springs por rig e interface.
Interações: hover nunca deve ser a única forma de descobrir uma peça; todos os controles precisam funcionar por toque/teclado.
Não ativar transições em elementos fora da tela; desconectar observers e liberar contexto WebGL em desmontagem.
GSAP ScrollTrigger responsável pela narrativa; para scroll básico preferir recursos nativos.
Reportar quais famílias do atlas foram aplicadas e motivo; **não há requisito de ativar literalmente 371**.
