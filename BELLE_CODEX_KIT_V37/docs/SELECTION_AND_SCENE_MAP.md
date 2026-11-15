# SELEÇÃO CURADA DAS TRANSIÇÕES · V37

Esta é a **seleção inicial aprovada como direção**, originada do mapa V8 anterior à V35. Nem todas as 22 referências devem ser implementadas. Se uma cena já possui a transição correta, não duplicá-la.

## As 8 famílias escolhidas primeiro

| Nome da referência | Prioridade | Aplicação permitida | Restrições |
|---|---|---|---|
| **Cortina** | Alta | recorte de entrada da passarela; imagem do atendimento | Apenas dentro de container local, revelando arte real, sem painel geral |
| **Colunas** | Alta | transição para 3 ocasiões | Ritmo baseado nos módulos reais e dono de animação existente, sem criar placas novas |
| **Varredura** | Alta | cabeçalho da coleção | Fio de luz + máscara pequena no título; terminar ANTES dos produtos |
| **Círculo** | Média | ponte para a seção de lojas/globo | Íris sutil de background local, sem sobreposição ao globo/controladores |
| **Dobra** | Média | entrada do título do FAQ | Pequeno movimento editorial; `<details>` permanece intacto |
| **Veludo** | Média | passagem para finale | Só tonalidade/textura de fundo: nada de cortina gigante |
| **Moldura** | Opcional | UMA hairline em transição de capítulo real | Sem molduras gigantes, sem repetição em toda a página |
| **Digitação** | Opcional | uma única eyebrow em seção informativa | Revelação tipográfica progressiva sem alterar texto semântico / aria |

## Mapa de fronteiras, não de cards

| Fronteira real | Dono de cena original | Novo motion V37 | Proibido |
|---|---|---|---|
| Hero/7 capítulos do filme | Film Three.js scroll | **NENHUM** | Cortinas em cada capítulo; stage fixed; reanimar cards `.chapter__card` |
| Filme → faixa/ticker → passarela | Film + runway | **CORTINA local** na chegada da passarela, se visualmente segura | Cobrir a boutique, a faixa ou botões |
| Passarela → ocasiões | Occasions carousel | **COLUNAS** interpretadas no grupo real, sem disputa de transform | Três placas/transições distintas sobre cada card |
| Ocasiões → coleção | Collection reveal | **VARREDURA** no header da coleção (até o grid) | Partículas/pixels sobre vestidos, preço, cards |
| Coleção → como comprar | How film scrub | **NENHUMA** | Criar outra transição de 100vh ou mexer na seek timeline |
| Como comprar → lojas | Stores champagne / globo | **CÍRCULO** moderado, somente se não duplicar a entrada existente | Máscara sobre globo/mapa/CTA |
| Lojas → atendimento | Concierge media | **CORTINA LOCAL** apenas no media frame e a copy com offset curto | Overlay cobrindo toda viewport |
| Atendimento → dúvidas | FAQ nativo | **DOBRA** só na tipografia do cabeçalho | Animar `<details>` ou botões |
| Dúvidas → finale | BA Finale | **VELUDO** ambientado no fundo | Nova tela de loading, selo duplicado |

### Um efeito por fronteira
Se houver efeito ativo de sistema original, a decisão é uma destas: (a) preservar original e abandonar proposta nova; (b) ajustar o original no próprio módulo, sem segundo controller; (c) integrar no mesmo timeline quando houver evidente necessidade. É proibido instalar um segundo layer para “não mexer” no original, como foi feito na V35.

### Ritmo sugerido (hipótese, não medição da Promptfly)
- Duração percebida: 350–700ms para micro-revelações acionadas uma vez, ou progresso de scroll em faixa curta e coerente.
- Transform: cerca de 12–24px para lettering/elementos reais, reduzindo no mobile.
- Luz: apenas acento, opacidade baixa e duração breve; jamais brilho âmbar permanente.
- Conclusão de transição: conteúdo integral visível sem recorte, mesmo se a pessoa parar o scroll.
- No scroll reversível: A→B e B→A geometricamente coerentes, sem travar no meio.
- Usar os números após inspeção de referência e DOM, nunca aplicar cegamente.

## Arquivo histórico necessário
O repositório contém `docs/MOTION_DIRECTION_V8.md`, que documenta a seleção anterior. **Ler como fonte histórica de intenção, não como autorização para religar `src/motion/director.ts`.** V8 possuía bugs; este documento preserva apenas a curadoria artística.
