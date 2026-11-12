# V37.1 · revelações de passagem (propriedade de movimento)

**Mudança de direção pedida pelo cliente (12/11):** em vez de micro-detalhes discretos, revelações visíveis estilo transição de página da Promptfly em **toda** separação de seção, usando várias cores da paleta. Isso substitui os efeitos de título/foto da V37 (para manter um efeito por fronteira).

Arquitetura: um único controlador rAF (`src/motion/editorial-boundaries.ts`) mede o topo de cada seção e escreve `--v37-entry` (0→1, reversível). Cada seção recebe um `div.v37-veil` decorativo (`aria-hidden`, sem texto) **dentro dela**: `position:absolute; inset:0`, seção com `isolation:isolate` (fica sempre abaixo do header), `pointer-events:none`. O véu cobre a seção quando ela entra pela base da tela e se abre até 38% da viewport; com `.v37-done` ele recebe `display:none`. Nunca `position:fixed`. Sem JS, movimento reduzido, modo essencial, economia de dados ou memória baixa → sem véu.

| Passagem | Família | Cor (paleta Belle) | Como abre |
|---|---|---|---|
| Filme → Passarela | Cortina | champagne → champagne profundo, fio ouro | sobe e sai pelo topo |
| Passarela → Ocasiões | Colunas | ouro / marfim / ouro claro / marfim / ouro escuro | 5 colunas sobem em sequência; na volta, a da direita primeiro |
| Ocasiões → Coleção | Varredura | noite `#1c1814`, borda ouro claro | atravessa da direita para a esquerda |
| Coleção → Como comprar | Dobra | rosé / rosé profundo, sombra vinho na dobra | vira do canto inferior direito ao superior esquerdo |
| Como comprar → Lojas | Círculo | noite com anel dourado | íris abre a partir do globo |
| Lojas → Atendimento | Cortina lateral | areia → champagne, fio ouro | recolhe para a direita |
| Atendimento → Dúvidas | Fatias | papel / ouro claro alternados | 6 faixas recolhem alternando os lados |
| Dúvidas → Finale | Veludo | vinho com pregas, fio ouro | abre para a direita revelando o BA |

O filme 3D (7 capítulos) não recebe camada. Controladores originais (`film.ts`, `runway.ts`, `occasions/carousel.ts`, `collection-reveal.ts`, `how-film.ts`, `stores-champagne.ts`, `finale/ba-solid.ts`) não foram alterados.
