# BELLE ALENCAR | SET77 LABS | CINEMA MASTER KIT
> Pacote técnico e criativo para reconstrução cinematográfica no Claude Code. Versão 1.0, 09/11/2026.

## Começar
1. Extraia este ZIP em uma pasta nova e abra a pasta inteira no VS Code / Claude Code.
2. Leia **LEIA_PRIMEIRO.md**, **CLAUDE.md**, **AGENTS.md**, **docs/MASTER_BRIEF.md** e **docs/STORYBOARD.md**.
3. Execute `npm run check` e `npm run dev`. O site atual está incluído como baseline navegável.
4. Rode em sequência **prompts/01_AUDITORIA_E_ARQUITETURA.md**, **02_RECONSTRUCAO_CINEMA.md**, **03_COMERCIO_MULTILOJA.md**, **04_QA_E_RELEASE.md**. Não tente um único prompt infinito.
5. Use os agentes/skills da pasta `.claude/`; as personas são arquivos de instrução e só executam quando chamados por um ambiente de agentes real.

## Regras inegociáveis
- Você **pode reescrever layout, seções e arquitetura inteiros**: identidade + objetivo de negócio são os únicos pilares.
- Fazer filme primeiro-pessoa em boutique/shopping; vestidos digitais vivos, transições com continuidade e catálogo encontrável.
- Produtos reais, estoque, variantes, pagamentos, endereço completo e prova social **somente com fonte aprovada**. Até lá usar representação conceitual explicitamente identificada.
- Garantir opção sem movimento, touch/teclado, mobile, performance e caminho de compra direto.
- Site atual: https://belle-alencar-set77.vercel.app (V3).
- O ZIP inclui código real da V3, monograma de referência e 371 técnicas do Motion Atlas. **Não inclui GLB de vestido, fotos de produto oficiais, cadastro Auth ou estoque real.**
- A publicação existente é um preview: não conectar checkout em produção sem backend e confirmação do cliente.

## Estrutura
- Raiz: HTML/CSS/JS estáticos do deploy existente.
- `.claude/agents/`: equipes especialistas de direção, 3D, motion,-commerce, QA e entrega.
- `.claude/skills/`: instruções práticas sob demanda.
- `docs/`: direção de arte, narrativa, contratos de dados, cenas, QA, orçamento de performance e plano.
- `prompts/`: quatro passes orquestrados para Claude.
- `knowledge/`: cópias dos estudos recuperados do SET77 COFRE.
- `scripts/`: servidor dev e verificação local.
- `assets/brand/`: monograma de referência da Belle recuperado do site.

## GitHub
O conector GitHub nesta sessão permite escrita em repositórios existentes, mas não oferece criação de novos. **Este ZIP está pronto para um repositório separado**, sem misturar material da Belle no repositório GB.
Crie um repositório privado chamado `belle-alencar-set77-cinema` e faça commit de todo o conteúdo (instruções em docs/GITHUB_E_VERCEL.md).
