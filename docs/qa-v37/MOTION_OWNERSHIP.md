# V37 · propriedade de movimento (revisão Claude sobre o piloto Codex)

Base: `fix/belle-v36-remove-decorative-overlays` @ `712591e` → piloto Codex `fix/belle-v37-editorial-boundary-reveals` @ `ddf620c` → esta branch `claude/wonderful-meitner-kt2rnw`. Nada de V33/V35/Motion Director V8 foi religado (`src/motion/director.ts` e `couture-transitions-v33.ts` continuam sem import).

**Um único controlador** (`src/motion/editorial-boundaries.ts`): um rAF agendado por scroll passivo, leituras antes de escritas, escreve só `--v37-entry`, `--v37-light` e as classes `v37-boundary`/`v37-done` na `<section>`. Mede uma âncora que nunca é transformada. Ao concluir (`v37-done`) todas as máscaras saem do CSS; ao subir, a fronteira reentra (reversível). Reduced-motion, intensidade essencial, save-data e memória ≤2GB → nenhuma classe, conteúdo estático integral.

| Fronteira | Dono original (intocado) | V37 · efeito | Nó que o V37 estiliza | Âncora de medição |
|---|---|---|---|---|
| Intro + 7 capítulos | `film.ts` | **nenhum** | — | — |
| Filme → Passarela | `runway.ts` (modelos, drag, controles) | **Cortina** — lettering descoberto de baixo p/ cima | `.runway__intro` (clip-path) | `#passarela` |
| Passarela → Ocasiões | `occasions/carousel.ts` (transform/opacity dos cards) | **Colunas** — moldura sobe em 3 colunas escalonadas; ao voltar, a da direita recua primeiro | `.occ-round` wrapper (mask) — nunca os cards | `.occ-round` |
| Ocasiões → Coleção | `collection-reveal.ts` (cards, filtros) | **Varredura** — máscara dir→esq no título + empurrão 16px + fio de luz | `#colecaoTitle` (mask/translate), `.section-head::after` | `#colecao` |
| Coleção → Como comprar | `how-film.ts` (scrub MP4, 4 cartas) | **nenhum** | — | — |
| Como comprar → Lojas | `stores-champagne.ts` (copy/cards), `astral/*` (globo) | **Círculo** — íris de luz champagne atrás do conteúdo, nasce e some | `#lojas::before` (z-index −1, isolado) | `#lojas` |
| Lojas → Atendimento | sem controlador | **Cortina lateral** na própria foto + título com atraso | `.concierge__media img` (clip-path), `#conciergeTitle` (translate) | `#atendimento` |
| Atendimento → Dúvidas | `<details>` nativo | **Dobra** — eixo diagonal (canto inf. dir. → sup. esq.) só no título | `#faqTitle` | `#duvidas` |
| Dúvidas → Finale | `finale/ba-solid.ts` | **Veludo** — tom de fundo aprofunda a partir da direita | `.finale::before` (z-index −1, isolado) | `.finale` |

Moldura e Digitação: **não implementadas** (ganho visual pequeno; teste de sobriedade). Rasgo/Pixels/Fatias/Cubo/Tinta/Queima/Retícula/Espiral/Canal/Partículas: catalogadas, não implementadas.

### Divergências em relação ao piloto Codex (e por quê)
- Codex descartou Colunas/Círculo/Veludo. Reintroduzi os três **sem segundo dono de propriedade**: Colunas mascara o wrapper (o carrossel continua único dono do transform dos cards); Círculo e Veludo vivem em pseudo-elemento de fundo dentro de seção isolada (não cobrem globo/CTA/selo; Codex observou corretamente que no Veludo um overlay ficaria invisível sob o gradiente — o pseudo com `z-index:-1` + `isolation` resolve, desenhando acima do fundo e abaixo do conteúdo).
- Direções corrigidas para o que a Promptfly descreve/mostra ao vivo (ver REFERENCE_OBSERVATIONS).
- Adicionado estado `v37-done` (nenhuma máscara persiste após a passagem) e âncora explícita por fronteira.
