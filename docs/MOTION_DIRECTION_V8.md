# BELLE ALENCAR · MOTION DIRECTION V8
**SET77 Labs · 11/11/2026 · Engenharia da experiência existente, não redesign**

## 1. Fontes e limites da análise

- Referência primária enviada pelo cliente: captura de `https://promptify.com.br/transicoes#cortina` com os nomes e tipos de 22 transições.
- Repositório real: `ogomes777/belle-alencar-set77-cinema`, base de produção `ec287b2`; intro caligráfica e Billie/editorial V7 preservadas.
- Contexto do projeto: evitar cópia cega de referências, manter a experiência cinematográfica com navegação, mobile, acessibilidade e commerce funcional.
- **Não foi possível reproduzir e medir ao vivo as demonstrações individuais da Promptify nesta execução.** A tabela abaixo inventaria os títulos e tipos visíveis na captura; a engenharia V8 é uma adaptação autoral, não código, implementação ou timing extraído das transições proprietárias.
- Não incorporar/transcrever scripts/GLSL premium fechados sem autorização. Não atribuir a Gomes ou Cruz decisões individuais que não estejam documentadas.

## 2. Inventário completo das 22 referências

| Nº | Referência | Tipo mostrado na captura | Uso deliberado na Belle |
|----|------------|--------------------------|-------------------------|
| 01 | Cortina | Overlay | Loader V7 e entrada de cena da passarela (sem bloquear scroll) |
| 02 | Colunas | Overlay | Cascata de três ocasiões, deslocamento curto e leve |
| 03 | Digitação | Texto | Palavra de apoio em Como Comprar, sem escrever ou apagar semântica |
| 04 | Sobreposição | Página | Bridge de transparência de iluminação entre capítulos, já presente no filme |
| 05 | Rasgo | Página | Catalogada; descartada da Belle por ruptura visual |
| 06 | Pixels | Overlay | Catalogada; não aplicar à fotografia/rostos por degradação |
| 07 | Varredura | Overlay | Cabeçalho da coleção e varredura luminosa de produto |
| 08 | Círculo | Overlay | Iris sutil nos cartões de lojas |
| 09 | Pilha | Página | Looks completos em sequência editorial |
| 10 | Moldura | Página | Linha metálica no topo de cada cena; não criar caixa gigante |
| 11 | Canto | Página | Catalogada; reservada para modal/contexto específico, sem nova página |
| 12 | Fatias | Página | Catalogada; não fragmentar modelos/retratos da Billie |
| 13 | Dobra | Página | Perguntas frequentes, em escala pequena e sem scroll trapping |
| 14 | Cubo | 3D | Catalogada; 3D já existe no filme real, dispensado para texto |
| 15 | Carrossel | Página | Mecânica de seleção da passarela já presente, não substituída |
| 16 | Tinta | WebGL | Catalogada; risco de custo de GPU/legibilidade no catálogo |
| 17 | Queima | WebGL | Catalogada; não combina com luxo sóbrio nem com acessibilidade |
| 18 | Retícula | WebGL | Catalogada; só seria aceitável sobre mídia específica, não global |
| 19 | Espiral | WebGL | Catalogada; não aplicar rotação à leitura/produto |
| 20 | Veludo | WebGL | Inspiração de tom e iluminação no encerramento, implementado em CSS, sem WebGL |
| 21 | Canal | WebGL | Catalogada; sem necessidade de distorção de cor/glitch |
| 22 | Partículas | WebGL | Catalogada; excluída do catálogo/checkout por distração e GPU |

**Não é uma promessa de 22 animações instaladas:** é a biblioteca de referências auditada visualmente pelo nome e priorizada. O conjunto de cenas V8 adota nove famílias com variações, combinadas por função.

## 3. Mapa do storytelling contínuo

| Capítulo | Entrada | Microexpressão | Continuidade |
|----------|---------|----------------|--------------|
| 00 Intro | Assinatura Belle manuscrita + floreio champagne | cortina dupla do loader V7 (preservada) | abre para a vitrine 3D |
| 01–07 Filme 3D | Câmera/scroll nativos existentes | cada `.chapter__card` ganha régua dourada ao ser visto | a mesma fotografia/luz conecta os capítulos |
| Faixa Belle | Marquee infinita intacta | sem interrupção no scroll | estabelece a próxima passagem |
| Passarela / Billie | Cortina lateral leve e metálica | título, look atual e botões em sequência | seis looks, 18 produtos e física do rail intactos |
| Ocasiões | Colunas | três cards com stagger e sweep refletido no cenário | foco em curadoria |
| Coleção | Varredura | título por máscara com fio dourado | culmina nos produtos clicáveis |
| Looks | Pilha | conjunto de cartões assenta em profundidade leve | conecta inspiração à compra |
| Como comprar | Digitação | eyebrow de leitura progressiva e quatro passos em crescendo | clareza transacional, sem digitar botão |
| Lojas | Círculo | cidades reveladas como quatro janelas | conexão com a loja local |
| Atendimento | Cortina lateral / luz | foto abre e texto responde, com parallax máximo de ±12px | um CTA principal, foco em confiança |
| Dúvidas | Dobra | FAQ encaixa linha por linha, mantendo `details` nativo | resolve objeções |
| Encerramento | Veludo interpretado em CSS | selo real e frase com luz discreta | CTA final sem um segundo loader |

## 4. Performance e acessibilidade (contrato técnico)

1. Native scroll sempre. Nenhum overlay fixo cobrindo a tela ao longo do site.
2. Sem importar uma segunda instância de Three.js ou duplicar a timeline do filme.
3. IO ativa efeitos uma vez, sem replay compulsivo a cada pequeno scroll.
4. Elementos e CTAs continuam no DOM; `aria`, foco, botões, modais e compra não são substituídos.
5. Reduced motion e intensidade essential eliminam as transformações e os cortes de cena.
6. BFCache, aba retomada e timeout de 6s liberam todos os elementos: nunca deixar conteúdo preso invisível.
7. Imagens do catálogo são carregadas pela infraestrutura existente, sem novo preload e sem redesenho dos 48 itens.
8. Desempenho precisa ser aferido em aparelho real; build verde não equivale a 60 FPS garantidos.
9. No mobile, desativar filtros e alterações de perspectiva pesadas; reduzir a duração, não reduzir a clareza.
10. Sem modificar identidade oficial Belle, retratos, estoque, preço, header ou integração WhatsApp.

## 5. Critérios de aceite

- Todas as nove seções alcançam `.md-in` em viewport 390/1440, sem branco persistente e sem overflow horizontal.
- O filme conserva os sete capítulos originais e sua câmera; só o detalhe editorial de entrada é adicionado.
- Passarela continua com seis looks, 18 produtos, drag/snap/favoritos e sacola.
- Intro caligráfica só na primeira visita, pulável e bloqueada em reduced-motion.
- FAQ mantém `details/summary` acessível.
- Testes em 360/390/768/1440 e Lighthouse/performance mobile manual recomendado antes da aprovação final.

## 6. Arquitetura

- `src/motion/director.ts`: diretor único das cenas e progressão leve, não interfere nos controladores do filme e runway.
- `src/styles/motion-director.css`: nove famílias e ajustes mobile/reduced.
- `src/main.ts`: integra depois dos módulos de conteúdo.
- `src/sections.ts`: conserva renderização e ações comerciais, sem segundo observador de reveals.
- `tests/e2e/motion-director.mjs`: regressão visual-funcional sobre cenas/reduced-motion.
