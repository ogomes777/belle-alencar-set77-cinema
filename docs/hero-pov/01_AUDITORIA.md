# Auditoria da landing

**Observação em 13/11/2026.** Navegador desktop com área de conteúdo aproximada de 1348 × 926. Usei rolagem, o trilho de capítulos e um arraste de teste na sala. Não houve ensaio em aparelho touch, inspeção de SKU a SKU ou medição de performance nesta etapa.

| Cena | O que apareceu na produção | Implicação no redesign |
|---|---|---|
| Vitrine | Placa escura com marca, porta dupla com contorno dourado e vitrines laterais. O card ocupa grande área à esquerda. O piso repete o reflexo da fachada. | Dar espessura ao portal, reduzir a competição com o card e graduar o reflexo. |
| Porta | A câmera aproxima os puxadores e deixa ver o piso, os arcos e o pedestal do salão. Cards de capítulos coexistem no enquadramento de transição. | Fazer o vão, a passagem e a oclusão contarem a entrada. Uma mensagem principal por enquadramento, quando necessária. |
| Sala | Nichos arqueados ao fundo e varão longo rente à parede. Há peças altas com leitura de vitrine, incluindo um top vinho acima da linha do varão. Um arraste de mouse no enquadramento observado não exibiu deslocamento lateral perceptível. | Separar fisicamente as araras das paredes. Retirar peças decorativas elevadas da sala. Tornar gesto e destino explícitos e validar com o mundo 3D carregado. |
| Vestido e detalhe | A aproximação de detalhe ocupa grande parte da tela com tecido claro e mostra o pedestal e o piso. | Preservar o close. Usar luz rasante e uma distância mínima que revele trama e costura. |
| Categorias | Painel funcional sobre nichos claros. | Manter as categorias utilizáveis e evitar produtos decorativos ambíguos no plano de fundo. |
| Provador | Espelho arqueado, cortina, base circular, vestido champagne e painel de seleção de modelos e cores. | Aumentar textura e contraste local. Validar espelho, enquadramento, seleção e acesso ao catálogo. |

O estado de renderização da sala durante o arraste não foi instrumentado. A observação acima não diagnostica a interação em todos os estados. O código lido contém gesto, troca de lado e seleção de peça, portanto o trabalho parte das funções existentes.

## Pontos de entrada lidos no GitHub

| Arquivo | Papel na base lida |
|---|---|
| `index.html`, `src/main.ts` | DOM do filme e ordem de inicialização. Comércio e shell antes do mundo lazy. |
| `src/film.ts` | Mede spans dos sete capítulos, deriva progresso de scroll, monta pôsteres e inicializa o 3D e o UI da arara. |
| `src/experience/story.ts` | Poses, look targets, FOV e percurso. Depende de posições exportadas por boutique. |
| `src/experience/world.ts` | Three.js, PMREM, loop de render, câmera, seleção e projeção da peça. O trecho lido mantém o olho perto do eixo central na sala. |
| `src/experience/scene/boutique.ts` | Dimensões, nichos, araras, vestido e espelho. Na branch lida, a lateral da sala chega a x=5,2 e o varão está em x=±4,72, ligado por suportes à parede. |
| `src/experience/scene/facade.ts`, `mall.ts`, `kit.ts`, `product.ts` | Módulos referenciados pelo mundo/cena para fachada, shopping, materiais e expositores. Confira a implementação do SHA ativo. |
| `src/experience/rail-ui.ts` | Gesto, setas de peças, troca de parede, clique por raycast, detalhe, tamanho e sacola. Há também captura de gesto sobre cards. |
| `src/shell/director.ts`, `src/core/tier.ts` | Intensidade e tiers de movimento. |
| `src/styles/film.css`, `luxe-glass.css`, `scene-rail.css`, `rack.css` | Camadas de UI a revisar no checkout. |
| `package.json`, `docs/PERFORMANCE_BUDGET.md` | Vite, TypeScript, Three.js, GSAP, scripts e metas de performance. |

As âncoras observadas são `#inicio`, `#porta`, `#sala`, `#vestido`, `#detalhe`, `#categorias` e `#provador`. O catálogo está em `#colecao`. Preserve os links e confira foco e scroll ao usar a navegação por capítulo.
