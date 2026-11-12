# AGENTS.md · BELLE ALENCAR MOTION V37 (raiz do projeto, quando autorizado)

## Escopo inegociável
- EDITAR a landing já existente, nunca recriá-la. Inspecionar `git status`, branch, commits, arquivos e diretores de motion antes de editar.
- Ponto de partida obrigatório: **V36 limpa** `fix/belle-v36-remove-decorative-overlays` (ou produção equivalente, confirmar HEAD e deployment). Parar e reportar se a branch real divergir; não resetar dados do usuário.
- Implementar **apenas** transições nas fronteiras reais entre SEÇÕES, uma família por fronteira conforme `docs/SELECTION_AND_SCENE_MAP.md`. Não implementar as 22 só porque aparecem como referências.
- Jamais colocar efeito de página sobre todos os cards, peças, botões, FAQ, fotos ou corpo inteiro da página. Não criar outro filme nem uma stage fixed 100vh de fundo opaco.
- Preservar o 3D/film original, arara, roupas, Billie editorial, passarela, 18 produtos da passarela, 48 peças demonstrativas do catálogo, ações comerciais, vídeo scrub, globo, loja, filtros, busca, sacola, locale, configurações e identidade.
- Respeitar `prefers-reduced-motion` e intensidade essential; fallback SEM conteúdo invisível ou controle inert preso.
- Não introduzir scroll-jacking, scroll-padding artificial, ScrollTrigger pin adicional, novos overlays globais, `height: 800vh`, duplicação de textos, timelines de câmera, WebGL redundante ou libs adicionais sem justificativa.
- Não ler, imprimir, publicar ou versionar chaves, tokens, arquivos `.env`, mídias privadas e gravações não autorizadas.

## Como o Codex deve trabalhar
1. Ler `PROMPT_CODEX_EXECUTAR.md` e TODOS os docs em `docs/` antes de editar.
2. Verificar referências `https://promptfly.com.br/transicoes` e `https://gb-imports-set77.vercel.app/` quando houver navegador. Não inventar timing ou implementações observadas.
3. Criar `fix/belle-v37-editorial-boundary-reveals` a partir de V36 limpa, sem sobrescrever trabalhos locais.
4. Inventariar os controllers existentes e **definir quem é dono de cada `transform`, `opacity`, `clip-path`, `filter` e `inert`** antes de animar qualquer elemento.
5. Fazer implementação progressiva e testável; 1 fronteira aprovada por vez; escolher somente efeitos pertinentes e eliminar os que repetem a experiência existente.
6. Testar ida/volta e saltos rápidos em 360/390/768/1440, temas e mobile, com vídeos de QA próprios. Acessibilidade e clique real não são opcionais.
7. Rodar `npm ci`, `npm test`, `npm run build`, e QA Playwright. Se CI falhar, não declarar pronto.
8. Gerar evidências `docs/qa-v37/`, resumo das alterações e preview. Sem publicar em produção sem aprovação humana específica.

## Proibições dos erros V33/V35
- `#belleCoutureWipe`, `#belleMicroStage`, `.bm35-stage`, `.ct33-wipe`, `.md-runway-veil` ou qualquer equivalente acima do conteúdo.
- Efeitos `cortina + fatias + carrossel` sobre a mesma seção ou 22 grupos de painéis distribuídos por toda a landing.
- `position:fixed; inset:0` em uma nova layer de transição persistente; duplicar h1/h2 num elemento auxiliar; alterar composição das roupas/3D.
- Máscara em texto ou produto comercial que possa permanecer parcial após BFCache, mudança de aba, skip, reduzido ou salto por anchor.

## Aprovação visual
O produto/cliente precisa aprovar vídeos ou capturas reais ANTES de deploy de produção. Build verde ≠ estética correta nem 60 FPS.
