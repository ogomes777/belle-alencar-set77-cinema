# QA e aceite

A matriz original cobre a base do filme. Os gates do documento 08 acrescentam o fluxo 360°, o contracampo e a completude de categorias.

Registre o SHA base, o SHA avaliado, ambiente, versão do navegador, aparelho, viewport, tier, rede e resultado. Compare a mesma máquina e os mesmos capítulos entre antes e depois. Anote casos pendentes com o motivo.

| Verificação | Aceite |
|---|---|
| Primeiro frame e CTA | Marca e entrada legíveis no tema claro, escuro e custom. Coleção e escolha de loja alcançáveis imediatamente. |
| Fachada → porta → sala e retorno | Continuidade de escala e luz. Atravessa o vão, sem atravessar a folha fechada. Retorno por scroll até o topo recompõe o início sem corte, freeze ou tela preta. |
| As duas araras | Pés sustentam o varão. Vão e sombra de contato visíveis. Perspectiva oblíqua mostra parallax. A sala não exibe peças altas decorativas com aparência de alvo. |
| Arraste em desktop e touch real | Direita → direita, esquerda → esquerda, centro recuperável. Swipe vertical e pinch funcionam. Sem seleção depois de drag. Repita nos dois lados, em diagonal e com scroll rápido de saída/entrada. |
| Peça → tamanho → sacola | Exercite uma peça de cada lado. Detalhe corresponde ao ID visível. Estado e contagem persistem no fluxo atual. Teste cancelar, tamanho obrigatório e voltar à arara. |
| Vestido, detalhe, categorias, provador | Close sem clipping persistente. Categoria abre filtro correto. No provador, cor e vestido acompanham seleção, espelho se comporta com a perspectiva, CTA chega à coleção. |
| Teclado, contraste e foco | Controle lateral alcançável, rótulos claros e ordem de Tab previsível. Estados e seleção compreensíveis. Texto normal com contraste alvo de 4,5:1. Alvos principais de toque com área de pelo menos 44 × 44 CSS px. |
| Essencial, redução, WebGL off e rede lenta | Fachada e textos visíveis, catálogo utilizável. Testar falha no boot do 3D, alternância de modo em sala e retorno de aba oculta. |
| Âncoras e lifecycle | Testar entrada direta por hash, histórico, BFCache, mudança de orientação, resize e três ciclos de ida e volta. Console limpo de erros do escopo e sem contexto/render loop duplicado. |
| Regressão comercial e do shell | Busca, escolha de loja, favoritos, sacola, temas, idiomas e navegação posterior acessíveis. Sem migração de estado ou mudança de catálogo fora da tarefa. |

## Performance

Siga `docs/PERFORMANCE_BUDGET.md` do repo. Alvos de campo p75 já definidos ali: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1. Medidas de laboratório são comparativos do checkout e devem ser identificadas como tais. Limite inicial de DPR do projeto: 1,5 no mobile e 2 no desktop quando suportado. Use `window.__belle` se presente para comparar tier, frame time, DPR, draw calls e progresso. Registre tempo até o pôster e primeiro frame, bytes, frame time no trecho da porta/sala/provador e tarefas longas em inicialização. Use 60 FPS como meta em aparelho capaz. Se o trecho cair abaixo de 30 FPS sustentados em aparelho alvo, reduza reflexos/DPR/sombras ou custo de assets e meça de novo. Ajuste um efeito por vez.

Rode `npm run check`, `npm run typecheck`, `npm test`, `npm run build` e `npm run e2e` conforme a base ativa. Teste Chrome e Firefox desktop e Safari iOS/Chrome Android reais quando disponíveis. Matriz inicial: 360×800, 390×844, 768×1024 e 1440×900. Inclua comparação antes/depois de fachada, sala, os dois lados e provador e uma captura do fluxo scroll → arara → peça → scroll. Indique o procedimento de reversão para o SHA base ou para a implementação anterior se o projeto já usar feature flag.
