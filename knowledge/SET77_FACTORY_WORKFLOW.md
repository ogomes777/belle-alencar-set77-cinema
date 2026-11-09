---
tipo: workflow_reutilizavel
status: guia_humano_nao_agente_automatizado
versao: 1
---
# SET77 — Fábrica de Landings premium em 3 prompts

## Meta
Acelerar criação de protótipos visuais e sites comerciais sem sacrificar fonte factual, branding, motion e QA.
Padrões são reutilizáveis. Mídia de cliente A nunca é reutilizada em cliente B.

### PROMPT 01 | Intake + DNA + fonte
"Você é 7-strategy e 7-ux-architect. Recupere no Engram o DNA de marca, projetos correlatos, motion library e skills específicas. Leia o repositório real e o material do cliente. Gere FACTS.md (fonte, aprovado, pendente), ART_DIRECTION.md (paleta, tipo, composição, tom), CONTENT_MAP.md (seções + copy), DATA_CONTRACT.md (mídia real + origem + permissão). Não invente preço, dados, loja, contato ou promessa."

Gate: marca e mídia autorizadas, UX objetivo, briefing claro.

### PROMPT 02 | Código + motion com limites
"Você é 7-front-end, 7-motion-director e 7-product-viewer. Implementar a landing baseada na DNA e patterns do Engram, com estrutura modular versionada. Priorizar primeiro frame, hero, categorias, CTA, fluxo comercial e mobile. Aplicar gramática de animação coerente (intro discreta, scroll chapters, reveals, rail/spring onde cabível, microinterações, parallax leve, FLIP apenas com elementos reais). Dados por cliente devem viver em config, não espalhados no código. Nenhum 360 falso. Reducemotion, touch e fallback sem JS obrigatórios."

Gate: preview sem bloqueio, rotas/copy reais, sem console errors.

### PROMPT 03 | QA + release
"Você é 7-quality e 7-release. Verifique screenshot real desktop, tablet e smartphone; teclado, reduced-motion, LCP/CLS/INP, largura, legibilidade, first paint e assets 404. Execute flows de seleção, catálogo, contato, autenticação e pagamento somente quando implementados. Liste problemas P0/P1/P2; corrija e reteste. Publique preview Vercel, registre SHA/release e links no Engram. Não declare publicação ou aprovação sem conferir."

Gate: release com URL confirmada, fontes de produtos, checklist de pendências, rollback.

## Artefatos por cliente
`FACTS.md`, `ART_DIRECTION.md`, `CONTENT_MAP.md`, `MOTION_MATRIX.md`, `DATA_CONTRACT.md`, `QA_ACCEPTANCE.md`, `RELEASE.md`, `AGENTS.md`.

## Para Belle Alencar
Ver [[BELLE_ALENCAR]] e [[BELLE_ALENCAR_MOTION_MATRIX]].
Os agentes acima são papéis de execução descritos no cofre, não workers ativos automaticamente.
