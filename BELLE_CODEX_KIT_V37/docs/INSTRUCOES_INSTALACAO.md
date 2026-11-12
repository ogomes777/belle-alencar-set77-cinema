# Instalação e uso

1. Faça backup/commit do que houver na raiz do repositório real Belle antes de instalar.
2. Extraia o arquivo ZIP em uma pasta qualquer, fora do repositório.
3. No PowerShell, entre nessa pasta extraída e execute `./instalacao/INSTALAR_KIT.ps1 -RepoPath 'C:\\caminho\\belle-alencar-set77-cinema'`.
4. Abra o VS Code na raiz do repositório Belle. Reinicie o Codex para reconhecer novas skills, se necessário.
5. Na janela Codex, cole `BELLE_CODEX_KIT_V37/PROMPT_CODEX_EXECUTAR.md` integralmente ou envie: **'Leia e execute integralmente BELLE_CODEX_KIT_V37/PROMPT_CODEX_EXECUTAR.md seguindo AGENTS.md, skills e agentes. Não publique em produção.'**
6. Codex deve criar branch, executar alterações, salvar vídeos de QA e fornecer preview. A implementação não faz parte do ZIP: o ZIP é o pacote de execução contextualizada.

### Arquivos que ficam no repo depois de instalar
- `BELLE_CODEX_KIT_V37/` (docs, prompt, refs, QA)
- `.agents/skills/belle-*/SKILL.md` (skills Codex)
- `.codex/agents/belle_*.toml` (subagentes Codex)
- `AGENTS.md` na raiz: criado se não existia, ou apenas acrescentado um link de orientação com backup.

### Limite de confiança
O instalador não clona repo, não altera aplicação, não instala Node e não faz push/deploy. Caso o Codex não consiga abrir links externos, ele deve registrar a limitação e pedir as mídias originais no próprio ambiente de desenvolvimento; NÃO presumir que as viu.
