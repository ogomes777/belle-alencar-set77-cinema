---
tipo: motion_matrix
projeto: BELLE_ALENCAR
status: base_interativa_v2
---
# Belle Alencar — Matriz de Motion

## Já implementado no preview
| Técnica | Intenção | Estado |
|---|---|---|
| Splash uma vez por navegador | Ritmo de entrada | Implementado, duração curta |
| Efeitos de entrada em camadas | Guiar leitura e destacar headline | Implementado |
| Progresso de scroll | Orientação de página | Implementado |
| Navbar compacta / backdrop blur | Economia de tela ao rolar | Implementado |
| Marquee editorial | Transição de capítulo | Implementado |
| Reveal com IntersectionObserver | Ritmo narrativo | Implementado |
| Hover zoom + filtros em editorial | Atenção sem impedir navegação | Implementado |
| Parallax do ponteiro apenas fino | Profundidade discreta | Implementado |
| Arara conceitual com 3 silhuetas | Interação e seleção | Implementado em CSS, **não produto real 3D** |
| Gestos de arraste / setas / clique | Acessibilidade e uso touch | Implementado |
| Modais de cidade + persistência local | UX multiunidade | Implementado |
| Reduced motion + save-data | Proteção de performance | Implementado, precisa QA real |

## Nível cinema (não implementado; depende de assets)
- Cloth simulation ou GLTF com tecido e vestido aprovados: só com geometria real/fotogrametria, vistas e autorização.
- Dolly de câmera para loja física / rack: referenciar geometria técnica GB Rail V11, redesenhar ambiente Belle, não copiar arquivos de mídia GB.
- Scroll film scrub: só com vídeo próprio, poster e codec mobile.
- Transições FLIP entre produto e detalhe: após existir catálogo e fotos reais.
- Vídeo de lookbook por capítulo e edição de retratos: após acervo e direitos.
- Shader/refração de tecido: medir desempenho no mobile; não obrigatório.
- Paleta de motion: easeOut .22/.82/.2/1, 160-450ms UI, 700-1100ms capítulos; sem camadas de partículas sem narrativa.

## Guardrails
- Conteúdo visível sem JS; nenhuma animação deve bloquear compra/consulta.
- `prefers-reduced-motion`, baixo poder gráfico, teclado e touch.
- Nunca anunciar 360 graus de roupa plana como geometria real.
- Never fabricate inventory, brand media, product labels.
- Auditoria Chrome, Firefox, Safari iOS, Android: CLS, LCP, INP, gestures, focus trap, overflow e pintura inicial.

## Base consultada
Engram: `12_MOTION_LIBRARY/INDEX_MOTION_PATTERNS.md`
GitHub GB: `ogomes777/gb-imports-set77` / `motion-core.js`, `gb-rail-v11.js`.


## Atualização CINEMA V2 (09/11/2026)
### Publicado e validado no servidor
- Filme de quatro atos com botão, swipe e GSAP ScrollTrigger pin/scrub desktop.
- Escultura abstracta de tecido em shader Three.js (r187), três moods; fallback CSS quando WebGL não é apropriado.
- Lookbook horizontal com teclado, clique e drag; mídias ilustrativas.
- Moodboard por ocasião com copy/visual em troca.
- Word-mask reveal por palavra com stagger, navegação por capítulos, microtransições.
- Novo runtime: `cinema.js`, `cinema.css`, `silk.js`.
- Bibliotecas de CDN: GSAP 3.15.0 + Three.js 0.187.0.
- Scripts sintaticamente validados e assets HTTP 200. Sem relatório de screenshot real ou CWV medido: QA visual ainda necessário.

### Escopo não entregue
Nenhuma autenticação multi-dispositivo, produto 360 real, provador virtual real, vídeo oficial, estoque, pagamento ou integração com a operação das lojas.
### Atlas
[[ATLAS_MOTION_WEB_2026]] contém 200+ padrões e técnicas de motion para curadoria consciente.
