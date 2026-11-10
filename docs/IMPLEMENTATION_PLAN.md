# PLANO DE IMPLEMENTAÇÃO | BELLE ALENCAR CINEMA V4

> Escrito por: direção criativa, story director, arquitetura frontend, 3D/cloth, GSAP, commerce, performance e acessibilidade (papéis de `.claude/agents/`). Baseado em AUDIT_V3, MASTER_BRIEF, STORYBOARD, SCENE_CAMERA_RIG, DRESS_LIFE_3D e STORE_COMMERCE_CONTRACT.

## 1. Conceito de direção
**"Uma tarde na Belle."** Uma câmera na altura dos olhos (1,62 m) passeia por um corredor de shopping em travertino, para diante da vitrine, atravessa as portas de vidro e caminha pela boutique. Um vestido sai da arara e acompanha você até o provador. O filme inteiro é um plano-sequência numa única coordenada de mundo: nenhum capítulo reinicia a cena.

Paleta física: travertino claro, carvalho em espinha de peixe, gesso marfim, latão escovado, vidro. Luz de fim de tarde na galeria e spots quentes dentro da loja. O dourado aparece só como acento (latão, letreiro, fio de luz no tecido).

## 2. Mapa de cenas (scroll = tempo do filme)
Coordenadas em metros. Fachada em z=0, corredor em z>0, boutique em z<0. Câmera em altura humana; lente 40° vertical (~35–50 mm) no cenário e 24° (~85 mm) no macro.

| # | Capítulo (âncora) | p (progresso) | Câmera → alvo | Ação 3D | Texto / CTA | Técnicas do atlas |
|---|---|---|---|---|---|---|
| 00 | Selo (`#inicio`, overlay) | antes do filme | — | Monograma desenhado por traço + máscara (1,6 s, uma vez por sessão, "Pular") | — | 01.03, 01.13, 01.14, 12.x SVG draw |
| 01 | A vitrine | 0.00 | (0,1.62,11) → (0,1.9,0) | Galeria em travertino, piso polido com reflexo, vitrines acesas, letreiro | "O look começa aqui. O resto é seu." · Ver a coleção · Escolher minha loja | 16.01, 04.06, 05.13, 04.09 |
| 02 | A porta | 0.14 | (0,1.62,3.2) → (0,1.7,-4) | Portas pivotam para dentro e a câmera cruza o limiar | "Entre. Fique à vontade." | 03.10, 16.20, 05.03 |
| 03 | Sala viva | 0.28 | (-1.1,1.62,-3.2) → (3.4,1.45,-6.5) | Araras com cabides em mola reagem à passagem da câmera e ao ponteiro | "Cada arara tem uma história." · Ver vestidos | 06.03, 09.06, 17.12, 16.07 |
| 04 | O vestido desperta | 0.42 | (0.4,1.5,-4.6) → (1.8,1.35,-7.2) | O vestido-estudo sai do cabide e voa até o pódio; a física do tecido responde à aceleração | "Tem peça que você vê. Tem peça que você já imagina usando." | 17.05, 17.12, 20.12, 20.13 |
| 05 | Fio e caimento | 0.56 | (0.38,1.02,-7.3) → (0,0.95,-8) fov 24 | Macro na trama: normal map de sarja, *sheen*, faixa de luz dourada atravessa o tecido | "No detalhe, tudo muda." · Ver detalhes | 16.16, 05.13, 17.18, 16.09 |
| 06 | Universo das categorias | 0.68 | truck de (-3,1.62,-11) a (3,1.62,-11) → arcos do fundo | Três arcos no fundo: Vestidos · Conjuntos · Acessórios; cada um ilumina quando é o foco | Filtrar categoria (deep link no catálogo) | 16.03, 03.14, 05.19 |
| 07 | Provador | 0.84 | (1.0,1.45,-11.6) → (3.4,1.2,-14.4) | O vestido acompanha a câmera até o espelho; silhueta e tom trocam por controle; órbita por arrasto | "O próximo favorito pode estar aqui." · silhueta / tom · Ver na coleção | 06.13 (conceitual), 06.15, 09.01, 06.07 |
| 08 | Saída | 1.00 | recuo e fade para o marfim | O palco congela e o render para; o catálogo DOM assume | — | 03.11, 13.x |
| 09 | Coleção (`#colecao`) | DOM | — | Catálogo demonstrativo, filtros, quick view com FLIP, wishlist, sacola | Adicionar à sacola · Ver no provador 3D | 06.05, 06.06, 06.16, 07.15, 07.16 |
| 10 | Minha Belle (`#lojas`) | DOM | — | Quatro unidades, preferência persistida, sacola por filial | Definir minha loja · Falar com a Belle | 11.x, 08.x |
| 11 | Última página | DOM | — | Selo, contato e informações reais | Atendimento | 12.x |

Continuidade: o mesmo objeto `DressRig` existe da arara (cap. 03) ao provador (cap. 07). O macro (05) é a mesma malha com a câmera em 85 mm, não uma imagem trocada. "Ver no provador 3D", no catálogo, aplica os parâmetros da peça ao mesmo rig e leva o scroll até o capítulo 07 (shot E inverso).

## 3. Arquitetura de código
```
index.html                    shell semântico; conteúdo legível sem JS
src/main.ts                   boot: tier → intro → shell → comércio → lazy experience
src/core/                     store observável, storage seguro, tier, dom helpers, a11y
src/shell/                    intro (monograma), header, chapter rail, director (intensidade), monogram
src/experience/               (chunk lazy) world, camera rig, story timeline, posters
  scene/                      mall, facade, boutique, rails, lights, textures
  cloth/                      verlet solver, dress rig paramétrico, materiais de tecido
src/commerce/                 types, stores, catalog.demo, availability, cart, wishlist, ui/*
src/styles/                   tokens, base, shell, film, commerce
tests/unit                    vitest (cidade, sacola, disponibilidade, wishlist)
tests/e2e                     playwright: capturas 360/390/768/1440, fluxos e reduced-motion
scripts/                      doctor (estrutura), posters (frames do próprio 3D para fallback)
```

### Estado (fonte única)
`store.ts` expõe `storeId`, `bags: Record<storeId, CartItem[]>`, `wishlist`, `tier`, `intensity`. Persistência versionada (`belle:v4:*`). URL `?loja=` (aceita o legado `?cidade=`) sobrescreve a preferência ao abrir.

### Motion tiers
| Tier | Quando | Render |
|---|---|---|
| CINEMA | ponteiro fino, WebGL2, ≥4 núcleos, memória ≥4 GB ou desconhecida | DPR ≤1,75, reflexo planar no piso, tecido 36×24, sombra no pódio, câmera "respirando" |
| TOUCH | ponteiro grosso ou viewport <900 px | DPR ≤1,25, sem reflexo planar, tecido 26×16, menos cabides |
| STATIC | `prefers-reduced-motion`, Save-Data, sem WebGL, contexto perdido ou escolha "Essencial" | Pôsteres renderizados do próprio 3D por capítulo; nada anima; conteúdo completo |

Governador em tempo de execução: média de frame >22 ms por 2 s reduz o DPR em degraus, desliga o reflexo e, se continuar ruim, cai para STATIC.

## 4. Riscos e mitigação
| Risco | Mitigação |
|---|---|
| Tecido instável (explosão, tremor em repouso) | Verlet com passo fixo de 1/60, sub-iterações limitadas, colisor de "forma" elíptico, amortecimento, clamp de velocidade, teste de repouso |
| GPU fraca / iOS | Tiers, DPR clamp, render somente com o palco visível e a aba ativa, governador de FPS, pôsteres |
| Scroll hijack | Scroll nativo; câmera apenas *lê* o progresso (com suavização). Sem `pin` que prenda o usuário; texto rola normalmente |
| LCP alto por WebGL | Pôster + texto primeiro; Three carregado por `import()` em idle e crossfade quando o 1º frame estiver pronto |
| Confusão demo × real | Selos em toda ilustração e no estudo 3D; sacola chamada "sacola de interesse"; checkout desativado; preço "sob consulta" |
| Fonte do canvas antes do carregamento | `document.fonts.load` antes de gerar texturas de letreiro |

## 5. Pontos de integração futuros
- Catálogo real: implementar `CatalogSource` (`src/commerce/types.ts`) contra CMS/Supabase; UI já consome a interface.
- Disponibilidade: `AvailabilityProvider.check(storeId, variantIds)` contra servidor com reserva transacional.
- Auth: `PreferenceSync` (stub) para sincronizar `storeId` no perfil depois de Auth + RLS.
- Checkout: `CheckoutGateway` hoje retorna `{enabled:false, reason}`; ligar somente com backend autorizado.
- Analytics: `track()` no-op até existir consentimento.

## 6. Orçamento de performance (metas de laboratório; campo ainda não medido)
- JS inicial (shell + comércio) ≤ 60 KB gzip; chunk 3D (three + gsap + cena) ≤ 230 KB gzip, carregado depois da 1ª pintura.
- Draw calls ≤ 120 (CINEMA), ≤ 80 (TOUCH); triângulos ≤ 250k; texturas procedurais ≤ 1024².
- 1 renderer, 1 canvas, 1 cena. Render loop parado fora do palco e em aba oculta.
- LCP lab ≤ 2,5 s (390 e 1440), CLS ≤ 0,1, sem long task > 200 ms após interação.

## 7. Entregas
1. P01: este plano, AUDIT_V3, ASSETS_MISSING, QA_PLAN, ADR-001 e protótipo da fachada 3D com fallback.
2. P02: filme completo (capítulos 00–08), tiers, pôsteres.
3. P03: comércio multiloja tipado e testado.
4. P04: QA em 360/390/768/1440, reduced-motion, teclado; correções; RELEASE_REPORT.
