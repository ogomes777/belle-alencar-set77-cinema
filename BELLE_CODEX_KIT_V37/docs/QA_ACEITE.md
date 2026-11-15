# Contrato de qualidade / aceite dos efeitos V37

## Geração de provas
- Comparar V36 (baseline) e V37 (preview) na MESMA resolução, estado de loja, tema e ponto de scroll.
- Gravar vídeo em 1440x900 e 390x844: rolagem contínua da landing descendo, depois subindo, com paradas nas fronteiras.
- Screenshots por seção: início, meio da passagem e fim. Salvar `docs/qa-v37/{desktop,mobile}/` no ambiente local de testes; não publicar mídia com dados pessoais.
- Testar no Chrome com GPU/software, Edge/Chrome Windows e mobile real se disponível.

## Matriz funcional que bloqueia release

| Cenário | Deve acontecer |
|---|---|
| Hero entrada V36 | 3D original sem painéis novos |
| Passarela touch/drag | looks navegam, controles clicam, recortes não cobrem vestidos |
| Ocasiões GSAP | carrossel preservado sem transform de dupla autoria |
| Catálogo | filtros, peças e preços não ficam escondidos |
| Quick view | abrir, tamanho, adicionar sacola, sair com Esc e foco devolvido |
| Vídeo roupa | scrub dependente de scroll, ida/volta, 4 cards conectados ao movimento |
| Lojas | seleção de cidade persiste, globo continua funcional, links/WhatsApp íntegros |
| FAQ | details nativo abre e fecha por touch e teclado |
| Theme | claro/escuro/rosé com contraste correto |
| Reduced motion / essential | conteúdo estático 100% visível |
| 360/390/768/1440 | sem overflow horizontal, overlap de heading, máscaras persistentes |
| Wheel inverso/touch inverso | transição reverte corretamente ou permanece no estado definido, sem flashes |
| Hash jump/reload/BFCache | não deixa conteúdo cortado ou scroll bloqueado |

## Gate anti-V35
FALHAR se houver:
- `.bm35-stage`, `#belleMicroStage`, `.ct33-wipe`, `#belleCoutureWipe`, `.md-runway-veil` montados.
- `body >` overlay de transição com `position:fixed`, `inset:0`, altura da viewport.
- uma transição aditiva sobre o DOM inteiro do filme e mais de uma passagem ativa ao mesmo tempo.
- elementos comerciais com opacidade 0 depois da cena estabilizada.
- drift de scroll / blank sections / texto duplicado.

## Critério de finalização
Só propor PR e preview com evidências de todos os itens. Não entregar como 'perfeito' se não houver gravação e conferência da arte. A revisão humana define aceitação estética; os testes automatizados validam parte da engenharia, não o prêmio.
