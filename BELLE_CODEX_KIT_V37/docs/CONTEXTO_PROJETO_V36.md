# Estado real da Belle em 12/11/2026 | Fonte para implementação V37

## Projeto correto
- Landing oficial: https://belle-alencar-set77.vercel.app/
- Repositório: https://github.com/ogomes777/belle-alencar-set77-cinema
- Base limpa de referência em 12/11/2026: branch `fix/belle-v36-remove-decorative-overlays`, commit de produção `7518b769118e4b1516a70ab09f246a1ec189eaa8` (validar antes de executar).
- Código: Vite + TypeScript, Three.js, GSAP + ScrollTrigger, HTML/CSS. Scripts conhecidos: `npm test`, `npm run build`, `npm run e2e`, `npm run preview`.
- Motivo da V36: remover o motor V35 (22 overlays) e o Motion Director V8 de runtime. **Não reativar nenhum deles.**

## História das falhas (a engenharia deve estudar)
- V33: painéis grandes `position:fixed` quase opacos e títulos duplicados; pareciam páginas falsas cobrindo a landing.
- V34: substituiu tudo por fachos de luz simples, perdeu semântica cinematográfica das referências.
- V35: implementou as 22 transições de uma vez, montando uma única stage de 16 painéis gigantes sobre toda a viewport; imagens e blocos comerciais pareciam cobertos por retângulos, círculos, grade, retícula e vidros. Foi rejeitada visualmente.
- V36: **remoção** desses compositores; 59 testes unitários, Chromium 360/390/768/1440, testes rápidos de loja/quick view passaram no último workflow. Isso NÃO autoriza efeito novo sem validação visual.

## Arquitetura de ownership (inspecionar estado vivo antes de tocar)

| Subexperiência | Arquivos/controladores existentes | Não fazer |
|---|---|---|
| Hero e 7 capítulos 3D | `src/film.ts`, `src/experience/*`, `src/styles/film.css` | Não criar outro canvas, overlays de capítulo ou duplicar câmera |
| Faixa entre filme e passarela | `.manifesto--ticker .band`, CSS `src/styles/sections.css` | Não quebrar continuidade/linha da faixa |
| Passarela e 18 produtos | `src/sections.ts`, `src/rack/*`, `src/styles/runway*.css` conforme repo | Não sobrepor controles, cards, drag, snap nem trocar fotos |
| Ocasiões / carrossel editorial | `src/occasions/carousel.ts` + CSS | Já controla 3D/transform; não animar transform de seus cards num segundo módulo |
| Coleção catálogo | `src/commerce/collection-reveal.ts` + `src/styles/collection-reveal.css` | É dono da revelação dos produtos. Não mexer nos cards ou filtros via sistema global |
| Como comprar, vídeo e quatro cards | `src/how-film.ts` e media MP4 no próprio repo | Scrub já bidirecional. Não criar um segundo timeline ou play independente |
| Lojas/globo | `src/motion/stores-champagne.ts`, `src/astral/orbit.ts`, `src/astral/store-map.ts` | Não alterar globo, pin, CTA, escolha de cidade; não duplicar reveal |
| FAQ | `#duvidas` em `index.html` com `details/summary` | Nunca transformar/mascarar controles/foco |
| Finale | `src/finale/ba-solid.ts` + CSS | Não duplicar monograma/selo |
| Header, preferências | `src/preferences/settings.ts`, `src/shell/header.ts` | Preservar claro/escuro/rosé, idioma, reduced motion, essencial |

## Restrições comerciais e artísticas
- Filiais: Araxá/Frutal/Catalão/Mineiros. Escolha da loja, sacola e WhatsApp precisam continuar responsivos.
- A composição de cada seção é autoral e aprovada como base. Não redesenhar hero, cards, roupas, estrutura, logos, tom de cor, copy nem tipografia.
- Paleta champagne/ivory/dourado refinada; evitar glamour de template genérico, brilho, fumaça e overlays gigantes.
- A mídia existente da Belle (inclusive vídeos com Billie) é MATERIAL DE PRODUÇÃO/QA, não vídeo de referência Promptfly. Nunca misturar os diretórios.

## Gatilhos de falha conhecidos
- Scroll rápido entre seções e retorno no sentido inverso.
- Dois controllers escrevendo transform/opacity no mesmo nó.
- Máscaras clip-path sobre elementos de layout responsivo que ficam invisíveis.
- Recalcular progresso por `getBoundingClientRect()` de um elemento que ele próprio está transformando.
- IDs de seção dentro do filme que não são quebras de página reais.
- `position: fixed` e z-index excedendo header/commerce.
- `IntersectionObserver` não disparar após hash/BFCache ou render dinâmico.
