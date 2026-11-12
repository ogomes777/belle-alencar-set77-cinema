# V37.2 · revelações cinematográficas de passagem (propriedade de movimento)

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
| Dúvidas → Finale | Veludo | champagne com pregas douradas (vinho removido a pedido) | abre para a direita revelando o BA |

O filme 3D (7 capítulos) não recebe camada. Controladores originais (`film.ts`, `runway.ts`, `occasions/carousel.ts`, `collection-reveal.ts`, `how-film.ts`, `stores-champagne.ts`, `finale/ba-solid.ts`) não foram alterados.

## V37.2 (cliente, 12/11): cartelas de título + revelação mais lenta + performance
- Inspirado na GB (observada ao vivo: painel na cor da marca com palavra-título grande antes de revelar a seção), cada véu tem duas fases: **título** (primeira metade: cartela em Cormorant surge no centro da tela, com fio dourado) e **abertura** (segunda metade). Títulos: *A passarela. · Para cada momento. · A coleção. · Do clique à loja. · Quatro cidades. · Com você. · Antes de escolher. · Assinatura.* (`aria-hidden`, sem duplicar leitura).
- Mais lento: começa quando a seção encosta na base da tela e termina quando ela chega ao topo (span 0,9 vh, antes 0,6).
- Link de menu/hash/âncora: a seção de destino chega já revelada (p=1) e assim fica até sair por baixo da tela.
- Performance: variáveis CSS escritas **no véu**, não na seção (a herança fazia cada quadro recalcular a seção inteira, 48 cards na coleção); véu limitado a 118vh; cartela só com transform/opacity; posição da cartela calculada pelo progresso (sem `sticky`, que quebra em seções com `overflow:hidden`). Medição `qa/v37-perf.mjs` (390px, CPU 4× mais lenta): V37.2 dentro do ruído da V36 em todas as passagens.

## V37.3 (cliente, 12/11): mais forte, mais limpo, mais leve
- **Cores fortes**: ouro rico (Passarela), café + ouro em colunas (Ocasiões), café (Coleção), rosé intenso (Como comprar), café (Lojas), bronze (Atendimento), faixas ouro/café (Dúvidas), veludo dourado (Finale). Título marfim com itálico champagne; nas cores claras (ouro/veludo) o acento é café.
- **Cartela de capítulo**: "01 · Passarela" … "08 · Assinatura" + título que sobe por máscara + fio que se abre. Finale: *Belle Alencar.*
- **Abertura com ease in-out** (smoothstep na 2ª metade) — começa suave, corta decidida.
- **Compositor**: véus cortados em peças (`.v37-veil__piece`: 5 colunas, 6 faixas, 1 nas demais) animadas só por `transform`; a Dobra usa recorte estático + translação diagonal. Única repintura: a íris do Círculo.
- Medição isolada (`VEILS=off|on node qa/v37-perf.mjs`, mesmo build, 3 rodadas intercaladas, 390px CPU 4×): custo dos véus entre 0 e ~4ms/quadro. O custo base dessas seções (~45–65ms/quadro nesse perfil, ~17ms em modo essencial) vem dos efeitos pré-existentes (carrossel 3D, BA 3D, globo), não das transições.
