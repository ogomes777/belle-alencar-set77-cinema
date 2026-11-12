# V37 · propriedade de movimento

Base confirmada: branch remota `fix/belle-v36-remove-decorative-overlays`, HEAD `712591e3d071e116450f85c3ebe9d776fbf583f1`. O kit citava `7518b769...` como produção; não foi possível confirmar esse deployment. Não há reset nem reativação de V33/V35. A branch de entrada `work` em `aef55aa` foi preservada.

| Fronteira | Elemento/propriedades existentes | Decisão V37 e proprietário |
|---|---|---|
| Intro e sete capítulos | `film.ts` câmera, canvas, chapter cards | Preservados; nenhuma nova camada |
| Filme → passarela | `runway.ts` modelos/transform/opacity; `.runway__stage` controles | Cortina somente sobre a tipografia original `.runway__intro`, sem superfície extra; V37 `clip-path`/translate local |
| Passarela → ocasiões | `occasions/carousel.ts` GSAP possui chegada, transform, opacity dos três módulos | Preservado; Colunas adicional dispensada para evitar duas entradas |
| Ocasiões → coleção | `collection-reveal.ts` controla produtos, grid e handoff | Varredura da hairline do header e movimento de 12px do título original; V37 somente esses estilos |
| Coleção → como comprar | `how-film.ts` seek, texto e quatro cards | Preservado integralmente |
| Como comprar → lojas | `stores-champagne.ts` possui reveal da copy/cards; `astral/*` globo e navegação | Íris adicional dispensada, evita duplicação e preserva mapa/CTA |
| Lojas → atendimento | `concierge__media img` sem outro controlador ativo; copy original sem controlador V36 | Cortina lateral: clip suave da própria imagem e deslocamento curto do título; V37 |
| Atendimento → FAQ | `details/summary` nativo, header sem controlador ativo V36 | Dobra limitada ao título, 3° e 12px; V37 |
| FAQ → finale | `ba-solid.ts` monograma/canvas/rotação | Preservado: gradiente original `finale-solid-v28.css` já fornece a passagem tonal. A proposta Veludo adicional foi descartada porque seria invisível sob esse gradiente ou exigiria substituir a composição aprovada |

Um controlador V37 mede geometria das seções estáveis e escreve apenas `--v37-entry` nas mesmas. CSS consome a variável em descendentes autorizados. Nenhuma seção medida é transformada. Leituras agrupadas antes das escritas. Motion reduzido/essential, save-data e memória reportada ≤2GB removem enhancement; conteúdo base fica íntegro. Foco dentro da seção conclui a revelação. `pageshow`, hash, resize e visibility recalculam; destroy remove listeners/variáveis/classes. Não há loops rAF permanentes, pin ou listeners wheel/touch extras.

As seis famílias são uma seleção editorial: Colunas e Círculo já têm passagem equivalente no controlador original e são conservadas, não empilhadas. Veludo adicional foi descartado após revisar o gradiente original do finale. Moldura/Digitação opcionais descartadas por ganho pequeno.
