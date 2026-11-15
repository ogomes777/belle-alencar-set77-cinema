# PROMPT MESTRE · CODEX EXECUTAR BELLE V37

**Você é o agente principal de engenharia frontend cinematográfica da SET77 Labs. Execução real, não conceitual.** Trabalhe no repositório já aberto, aplique as alterações e produza evidências verificáveis. Responda em português brasileiro. Se capacidades (navegador, URLs, mídias) faltarem, documente a lacuna com precisão, sem fingir teste nem render.

## MISSÃO (leia duas vezes)

Implementar na **landing real Belle Alencar** transições de passagem entre grandes páginas/seções, inspiradas na seleção AUTORAL inicial do documento `docs/MOTION_DIRECTION_V8.md` e nas demos de `https://promptfly.com.br/transicoes`. Queremos **filme contínuo, narrativa, luxo, tecido, luz, massa, revelação e reversibilidade**. A V35 tentou 22 efeitos e virou uma colagem de placas gigantes transparentes sobre tudo, inclusive filme e produto. Isso é um fracasso explícito, não uma base. A V36 removeu o motor poluído. Agora usar **poucos efeitos precisos, cada um com função editorial**, como um diretor de cinema montaria passagens, sem parecer demonstração de biblioteca.

O objetivo não é exibir a existência de todas as 22 técnicas; é tornar a Belle uma experiência coesa, premium e performática. Os 22 nomes são acervo de referência, não checklist de implementação.

## PRIMEIRO: VERIFICAR A VERDADE DO PROJETO

1. Mostrar `pwd`, `git status --short`, branch, último commit e `package.json` (sem segredos). Se houver trabalho não salvo, preservá-lo. Usar branch nova baseada na V36 limpa (`fix/belle-v36-remove-decorative-overlays` / commit equivalente), nunca partir da V35 poluída. Não aplicar `git reset --hard`.
2. Abrir a landing oficial `https://belle-alencar-set77.vercel.app/` e a GB `https://gb-imports-set77.vercel.app/#inicio` em navegador real, e a referência `https://promptfly.com.br/transicoes` (se o navegador estiver disponível). Verificar demonstradores por título: Cortina, Colunas, Varredura, Círculo, Dobra, Veludo, Moldura, Digitação. Extrair somente princípios observáveis: direção, duração aproximada, reversão, densidade de efeito, cor, acabamento. NÃO fingir que a página ou vídeo abriu se não abrir.
3. Inspecionar a arquitetura antes de escrever: `src/main.ts`, `src/film.ts`, `src/how-film.ts`, `src/commerce/collection-reveal.ts`, `src/occasions/carousel.ts`, `src/motion/stores-champagne.ts`, CSS respectivo, `src/shell/director.ts`, `index.html`, testes. Identificar scroll owners; não criar múltiplos controladores da mesma propriedade.
4. Criar `docs/qa-v37/BASELINE.md` com screenshot por seção em desktop/mobile para comparar V36 vs V37. Capturar o que está errado e o que já funciona sem alterar as composições.

## SELEÇÃO OBRIGATÓRIA, NÃO 22 AO MESMO TEMPO

Usar `docs/SELECTION_AND_SCENE_MAP.md` como fonte de verdade. A seleção inicial mais adequada é: **Cortina, Colunas, Varredura, Círculo, Dobra e Veludo**. **Moldura** e **Digitação** são microdetalhes opcionais somente se passarem no teste de sobriedade. **Carrossel/Pilha** não são uma camada nova: conservar as mecânicas já existentes da passarela e do catálogo editorial. `Rasgo`, `Pixels`, `Fatias`, `Cubo`, `Tinta`, `Queima`, `Retícula`, `Espiral`, `Canal`, `Partículas` e outras variações ficam **catalogadas, NÃO implementadas**.

**O efeito pertence à passagem de uma seção para outra, não à superfície da página inteira.** Cada fronteira tem 1 dono e 1 transição principal. Nunca 3 efeitos sequenciais em uma entrada nem animação global cobrindo tudo. Para o filme 3D inicial, **nenhuma nova camada**. O filme já tem seus sete capítulos e uma linguagem própria. A intro original é intocável.

## COMO IMPLEMENTAR SEM POLUIR

- **Filme → Passarela:** preservar a faixa/marquee que costura capítulos; adicionar no máximo uma CORTINA editorial localizada no recorte da entrada real da passarela, curta, que abre revelando diretamente o conteúdo original. Não cobrir hero nem vestir o filme com painéis. Se interferir na câmera/drag, substituir por uma passagem cromática dentro do background local.
- **Passarela → Ocasiões:** COLUNAS como ritmo de entrada de **três módulos reais já existentes**, sem inserir três novas colunas decorativas. Cada grupo entra por deslocamento de 12–24px e revelação por `clip-path` apenas na moldura da cena, com stagger; não animar o cartão comercial duas vezes se o `occasions/carousel.ts` já controla transform.
- **Ocasiões → Coleção:** VARREDURA limpa: linha de luz e título da seção com máscara suave, dentro da seção, finalizando ANTES dos filtros e cards. `src/commerce/collection-reveal.ts` continua único dono das roupas e scroll. Não criar fundo retangular de 100vh.
- **Coleção → Como comprar/vídeo:** NÃO ADICIONAR efeito: conservar a passagem e o scrub do MP4 já controlados por `src/how-film.ts`, inclusive cartas lançadas conforme o vestido, indo e voltando. A única tarefa aqui é garantir que a junção visual anterior/seguinte não deixe gap ou sobreposição.
- **Como comprar → Lojas:** CÍRCULO ou IRIS apenas no fio de transição de entrada do mapa/globo, de forma local e leve; se interferir com o `stores-champagne.ts`, não duplicar. O globo e os botões são intocáveis.
- **Lojas → Atendimento:** CORTINA LATERAL restrita à foto do vestido (revelar o próprio elemento `img`) e à copy original com pequeno atraso, nunca painel cobrindo botões/WhatsApp.
- **Atendimento → Dúvidas:** DOBRA discreta no cabeçalho editorial, nunca sobre `<details>`/`<summary>`/foco. Manter FAQ nativo.
- **Dúvidas → Finale:** VELUDO como alteração de tonalidade/LUZ na textura de FUNDO local, sem cortina gigante ou novo full-screen. Preservar selo/BA existente.

**Moldura:** se couber, usar única hairline dourada em junção específica, não distribuir caixas e retângulos. **Digitação:** se couber, revelar apenas *uma* eyebrow sem alterar o texto semântico, nunca simular terminal gigante. Não implementar se o ganho visual for pequeno.

## CONTRATO DE SCROLL

Use native scrolling. Para um efeito scroll-scrub: valor único de progressão normalizado `[0,1]` calculado da geometria de **uma fronteira**; sem deslocar a posição do elemento que é usado como âncora de medição; `requestAnimationFrame`, listener passive, resize/BFCache/visibility cleanup. Ao descer: A→B. Ao subir: B→A. Ao parar no meio: geometria verdadeira sem branco, quebra ou retenção. Saltar por links de menu: revela seção final mesmo sem atravessar todo o percurso. Prefira timeline GSAP/ScrollTrigger já existente SE compatível e com `kill()` correto; não importar uma segunda cópia GSAP/Three.

Para transições de entrada apenas once-on-enter, usar IntersectionObserver com fail-open e não condicionar visibilidade do comércio ao JS. Texto renderiza normalmente sem CSS enhancement ou em `prefers-reduced-motion: reduce`. Um efeito não deve mais bloquear clique, sobrepor conteúdo ou reaparecer depois da entrada completa.

## CONTRATO VISUAL

Estilo Belle: bege/ivory/champagne/dourado sóbrio, riqueza em tipografia, boa luz, respiro negativo, imagens e vestidos originais. Sem filme novo, personagens novos, sombras pesadas, triângulos, retículas, cubos, partículas, ondas aleatórias, painéis com bordas enormes, brilho amarelo estourado, blurs permanentes ou espaços vazios. Nunca modificar identidade, fontes, imagens de roupa, cards, catálogo, rótulos, paleta base, navbar, opções ou fluxo de compra. Uma animação deve ter princípio, meio e fim com `transform` limpo e `will-change` retirado ao concluir.

O MOBILE é produção, não versão resumida quebrada. Touch/scroll reversível sem lag ou tremedeira. Performance first: observar trace em 390px throttling, FPS/long tasks, peso JS. Se a regra criar layout thrash, fazer refactor antes de continuar.

## AGENTES E SKILLS

Invocar/consultar os subagentes `.codex/agents/` e skills `.agents/skills/` conforme disponíveis: `belle-reference-forensics`, `belle-art-direction`, `belle-scroll-motion`, `belle-commerce-guard`, `belle-qa-multi-viewport`, `belle-release-gate`. Não delegar tarefas sem compartilhamento do estado; o agente principal é responsável por integrar e verificar tudo. Se a instalação de subagentes não estiver ativa, seguir os arquivos de orientação em `agentes/` sequencialmente.

## PROCESSO DE EXECUÇÃO INEGOCIÁVEL

Fase A · Inventário e baseline: confirmar repo, conferir referências, ler código, decidir owner e mapa de fronteiras. Criar `docs/qa-v37/BASELINE.md`.
Fase B · Implementação em incrementos: primeiro UMA transição piloto (ex.: coleção varredura); comparar screenshot e vídeo; eliminar poluição; depois as demais. Não avançar enquanto a anterior interferir nos efeitos existentes.
Fase C · Refinamento editorial: correção de ritmo, entrada/saída e performance por tema/resolução. Não adicionar efeitos só por estarem na lista.
Fase D · QA funcional e visual rigoroso: rodar todos os testes e gravar vídeos de scroll contínuo descendo/subindo, inclusive paradas no meio da animação; relatório de erros e evidências.
Fase E · Preview apenas: criar PR com diff mínimo, preview Vercel (ou instruções exatas se deployment inacessível). Produção NÃO autorizada nesta tarefa.

## TESTES OBRIGATÓRIOS

- `npm ci`, `npm test`, `npm run build`, `npm run e2e` (corrigir testes pré-existentes de forma fundamentada, não ignorar falhas); `qa/verify-boundaries.mjs` como complemento se necessário.
- Chromium com 360, 390, 768 e 1440 px, `prefers-reduced-motion: reduce`, temas claro/escuro/rosé (verificar nomes reais nos atributos), modo de intensidade essencial, volta por wheel/touch, teclado, hash jump, BFCache, aba suspensa.
- Zero overlays globais persistentes, zero texto duplicado, zero overflow horizontal, zero conteúdo comercial escondido e zero erros JS. Conferir hero, vídeo de vestido, passarela, catálogo, quick view, filtros, sacola, loja e FAQ.
- Não afirmar 60fps sem medir. Não afirmar “pixel-perfect Promptfly” se os demos não foram medidos. Comparar vídeos antes/depois e **descartar** efeitos que piorem a V36.

## SAÍDA FINAL ESPERADA

1. Branch/commit(s) e resumo do diff arquivo a arquivo.
2. Matriz `docs/qa-v37/MOTION_OWNERSHIP.md` e `docs/qa-v37/REFERENCE_OBSERVATIONS.md` com observado vs inferido.
3. Capturas e vídeos QA em `docs/qa-v37/`, com evidências desktop/mobile e scroll inverso (apenas gravações do RESULTADO, fora de `referencias/videos_ORIGINAIS`).
4. Relatório `docs/qa-v37/ACCEPTANCE.md` com ✅/❌ por fronteira e por modo, URLs/erros/performance medidos.
5. Link de preview e PR; se não houver acesso Vercel/GitHub, entregar código local + comandos exatos para revisar. NÃO publicar produção.

**Se a primeira implementação deixar placas douradas sobre as roupas, títulos cortados, hero coberto ou áreas vazias, interrompa, reverta apenas essa alteração no branch e redesenhe o efeito. Não maquiar com outra camada. O padrão é cinema, não uma feira de transições.**
