# MOTION ATLAS 371 | O QUE FOI APLICADO E POR QUÊ

Critério (MOTION_ORCHESTRATION): cada técnica precisa ter função na história ou na compra. Gramática usada: **intenção → preparação → reveal → settle → permanência → transição**. Nenhuma técnica roda fora do palco visível.

## Protagonistas
| Família / técnica (atlas) | Onde | Função | Fallback |
|---|---|---|---|
| 01.03 Abertura por máscara · 01.13 intro once/session · 01.14 skip | Selo BA | Marca em 2 s sem bloquear | Sem intro em reduced-motion/sessão repetida |
| 16.01 Dolly-in · 03.10 scroll camera dolly · 16.20 continuidade entre seções | Filme inteiro | Um plano-sequência: galeria → porta → salão → provador | Pôster do capítulo |
| 04.01 Scene graph · 04.06 perspectiva · 04.09 PBR · 04.10 env map | Mundo 3D | Profundidade física real (não zoom de foto) | Pôsteres renderizados da mesma cena |
| 05.03 Vidro (fresnel analítico) · reflexo planar (Reflector) | Vitrine, portas, piso, espelho | "Vidro/reflexos" do brief com custo controlado | Sem reflexo planar no TOUCH |
| 17.12 Spring cloth solver · 17.05 vento · 20.12 follow-through · 20.13 secondary motion | Vestido-estudo | Tecido vivo que responde à inércia do voo e ao scroll | Pôster com tecido assentado |
| 06.03 Spring hangers · 09.06 spring settle | Araras | Cabides respondem à passagem da câmera e ao ponteiro | Estático |
| 16.16 Push-in de produto · 17.18 sheen de tecido · 05.13 light sweep | Capítulo "Detalhe" | Macro com normal map de sarja e faixa de luz dourada | Pôster |
| 16.03 Truck lateral · 05.19 color grading por capítulo (emissão dos arcos) | Categorias | Foco muda de arco conforme a câmera passa | Botões de categoria (sempre funcionam) |
| 06.15 Drag to orbit · 09.01 drag 1:1 · 06.07 swatch | Provador | Girar o estudo, trocar silhueta/tom | Ilustração SVG no tier estático |
| 02.04 Mask reveal por palavra | Títulos dos capítulos | Ritmo de leitura | Texto visível sem JS |
| 06.05/06.06 FLIP card → detalhe | Quick view | Continuidade produto → detalhe | Sem animação em reduced-motion |
| 07.13 Toast · 07.16 cart feedback · 07.15 wishlist | Comércio | Confirmar ações | — |
| 13.x Tiers + governador de FPS | Global | Performance controlada | STATIC |

## Rejeitadas (e por quê)
- Partículas/poeira, bloom forte, glitch, chromatic aberration: não servem à marca (ART_DIRECTION).
- Scroll hijack / pin que prende: substituído por cartões sticky sobre scroll nativo.
- 360 de produto / try-on: proibido sem ativos multivista oficiais (ASSETS_MISSING #4/#5).
- Scroll-film de vídeo: não há vídeo oficial.
- Áudio: sem razão narrativa e sem consentimento.
