# AGENTS.md / Governança dos agentes

## Orquestração
Os arquivos em .claude/agents/ representam papéis especializados. Apenas Claude/ambiente com execução de agentes pode ativá-los; arquivos markdown por si só **não executam robôs**.
Ordem: creative-director + brand-guardian → story-director + ux-commerce → technical-architect → gsap-director + threejs-engineer + cloth-engineer → frontend-architect + commerce-engineer → performance-guardian + accessibility → qa-director → release-manager.

## Gate obrigatório por cena
INPUT: objetivo, fonte de verdade, assets autorizados, storyboard.
BUILD: componente isolado, testes e fallback.
REVIEW: 3 ângulos / dispositivo, motion/sem motion, quebra de layout, sem console errors.
ACCEPT: merge somente se não regredir UX e performance.

## Escalada
Se não houver modelo 3D, vídeo oficial ou estoque, registrar "PENDENTE DE ATIVO REAL" e construir conceito separado.
Se uma animação exceder orçamento de GPU/CPU, usar tier menor e manter composição editorial.
Se o código atual estiver limitado, refatorar com justificativa, não preservar layout só por legado.

## Escopo
Ler CLAUDE.md + docs/MASTER_BRIEF.md antes de tocar código. Design sênior, elegância, conversão, 3D coerente e segurança de publicação.
