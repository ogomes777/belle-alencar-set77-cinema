---
tipo: projeto_cliente
cliente: Belle Alencar
status: preview_v2_publicado_nao_transacional
projeto_vercel: belle-alencar-set77
data: 2026-11-09
---
# Belle Alencar — experiência SET77 Labs

## Fonte factual
Instagram oficial informado pelo usuário: https://www.instagram.com/belle.alencar/
Marca fornecida: símbolo BA dourado sobre base creme, lettering BELLE ALENCAR, subtítulo MODA & ACESSÓRIOS.
Cidades expressamente listadas no perfil anexado: Araxá MG, Frutal MG, Catalão GO, Mineiros GO.
Araxá: Av. Vereador João Sena, 103, Centro, conforme bio. Não inferir endereços das demais lojas.
Atendimento oficial indicado no perfil: https://wa.me/message/YYDB5NC7JMUQP1

## Preview publicado
https://belle-alencar-set77.vercel.app
Vercel project id: prj_cZgNqeelJ1WMkJC0dI0pxw3WfkyY.
Código publicado como deployment direto (arquivos estáticos index.html, styles.css, app.js, favicon.svg e README.md); sem repositório Git conectado. A versão atual é preview de UX/UI.

## Direção artística
Luxo feminino editorial, creme, branco, areia e dourado escovado (não saturado); grafite para legibilidade.
Tipografia contraste serifada Cormorant Garamond + DM Sans.
Headline: "O look começa aqui. O resto é seu."
Seções: hero, categorias, manifesto, provador de silhuetas, editorial, cidade, encerramento.
Motion concentrado em narrativa e descoberta, não em efeitos gratuitos.

## Funções já desenvolvidas
- Escolha de unidade e armazenamento em localStorage.
- Parametro de cidade na URL (ex.: ?cidade=araxa), permitindo compartilhamento e alteração.
- Perfil de preferências local: nome e cidade sem senha; **não constitui autenticação nem cadastro de cliente em servidor**.
- Provador conceitual de três silhuetas ilustradas em CSS, seleção por clique, setas e arraste, legenda dinâmica.
- Scroll reveal, intro, marquees, parallax leve, hover, progress bar, header compacta, responsividade e fallback reduced-motion.
- Instagram e WhatsApp oficiais como canais de contato; sem checkout.

## Pendências indispensáveis antes de produção comercial
1. Aprovação formal da direção, copys, imagens, catálogo e marca pelo proprietário.
2. Substituir imagens editoriais de demonstração por fotografias/vídeos oficiais autorizados e variantes reais.
3. Integrar catálogo real e tabela de estoque por cidade (sem preço inventado), políticas de estoque/reserva.
4. Implementar Auth + perfil na base de dados (server-side), RLS, privacidade e LGPD; salvar unidade no perfil de conta.
5. Confirmar contatos, endereços, horários e logística de cada filial.
6. Criar checkout, pagamentos, frete e integrações apenas depois das regras de negócio.
7. QA cross-browser e Core Web Vitals mobile em aparelho real; validar qualidade visual.
8. Mover código para repositório Git próprio para versionar, abrir PR e ligar CI/CD da Vercel.

## Continuidade
[[BELLE_ALENCAR_MOTION_MATRIX]]
[[03_PROMPTS_FABRICA_LANDING_SET77]]
Base técnica consultada: [[GB_IMPORTS_DNA_TECNICO]] e [[INDEX_MOTION_PATTERNS]].
Não copiar identidade, mídia e assets GB. Usar somente padrões técnicos neutros.


## Release CINEMA V2 (09/11/2026)
- URL ativa: https://belle-alencar-set77.vercel.app/
- Deployment Vercel: `dpl_933LGSVM9Pvcu1C36W6eeaUi7rAM`, team `team_IRh8GF77UGWqblNqwxYQ5DIZ`, project `prj_cZgNqeelJ1WMkJC0dI0pxw3WfkyY`.
- Estado de publicação conferido: READY, alias oficial ativo, 200 nos documentos HTML/CSS/JS, avaliação de sintaxe PASS para scripts principais.
- Módulos adicionados: `cinema.css`, `cinema.js`, `silk.js`. GSAP 3.15.0 / ScrollTrigger e Three.js 0.187.0.
- Seções novas: filme de quatro atos com pin/scrub desktop e controle mobile, laboratório WebGL com shader de tecido abstrato e 3 tons, lookbook arrastável e acessível, escolha de ocasiões com CTA.
- Regras comerciais V1 mantidas: escolha de Araxá, Frutal, Catalão, Mineiros e preferência no browser. Perfil atual NÃO é conta real, não há estoque por filial, checkout ou preço.
- Próximos gates: assets oficiais e autorização; QA visual em navegador real com mobile e Safari; catálogo e backend; Git repository versionado.
- Estudo de motion catalogado em [[ATLAS_MOTION_WEB_2026]].
