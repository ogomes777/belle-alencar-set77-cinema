# BELLE ALENCAR · SET77 LABS · KIT CODEX V37
**Missão:** micro-intros cinematográficas entre seções da landing real, sem poluição visual.
**Data do briefing:** 12/11/2026. **Linguagem:** PT-BR. **Entrega:** código implementado + testes + provas visuais. **Produção:** NÃO publicar sem aprovação.

## O que há neste pacote

- `PROMPT_CODEX_EXECUTAR.md` e `.txt`: instrução única para o Codex executar, não apenas discutir.
- `AGENTS.md`: regras de segurança e escopo. Leia mesmo que a raiz do repositório já tenha um AGENTS.md.
- `docs/`: contexto da V36, seleção criteriosa de transições, contratos técnicos, mapa de cenas, referências e critérios de aceite.
- `.agents/skills/*/SKILL.md`: seis skills instaláveis no Codex, no formato de descoberta de repositório.
- `.codex/agents/*.toml`: quatro subagentes especializados, sem configurar modelo ou acesso por conta própria.
- `qa/`: roteiro de validação e script Playwright complementar.
- `referencias/links/`: atalhos Windows para Promptfly, Belle, GB e repositórios.
- `referencias/videos_ORIGINAIS/`: local EXCLUSIVO para vídeos originais das demonstrações de transições.
- `instalacao/INSTALAR_KIT.ps1`: instalador conservador que cria skills/agentes sem apagar instruções existentes.

## REGRAS ABSOLUTAS PARA OS VÍDEOS

Os vídeos de demonstração da landing da Belle/Billie (WhatsApp Video, navegação, bug, gravações de testes) NÃO são referência de animação e NÃO entram neste ZIP.
As capturas recebidas em 12/11 mostram o defeito da V35 e também NÃO são referências aprovadas.
Os vídeos ORIGINAIS das transições Promptfly não estavam acessíveis como bytes autorizados no ambiente de preparação deste ZIP. Portanto esta edição **não inventa nem renomeia MP4s**. Incluímos URLs verificadas e os nomes das 22 referências; o Codex deve abrir a página ao vivo e observar as demos. Se o usuário tiver gravações originais, copiá-las em `referencias/videos_ORIGINAIS` antes de executar.
NÃO baixar/republicar conteúdo pago ou protegido da Promptfly sem permissão; documentação por observação e links é suficiente.

## Instalar com segurança no Windows (VS Code + Codex)

1. Abra **a pasta do repositório REAL** `ogomes777/belle-alencar-set77-cinema`, não uma cópia antiga.
2. Extraia este ZIP em uma pasta temporária ao lado do projeto.
3. Abra PowerShell na pasta extraída e execute `./instalacao/INSTALAR_KIT.ps1 -RepoPath "C:\\caminho\\do\\belle-alencar-set77-cinema"`. O script faz backup se houver conflito e NÃO substitui `AGENTS.md` pré-existente. Caso não queira usar script, copie manualmente `.agents/skills/`, `.codex/agents/` e a pasta `BELLE_CODEX_KIT_V37/` da distribuição para o repo, e cole o prompt no Codex.
4. Abra o Codex no VS Code com a pasta **raiz** do repositório, leia `BELLE_CODEX_KIT_V37/PROMPT_CODEX_EXECUTAR.md`, e mande executar.
5. NÃO dar push direto em produção. O Codex cria branch, faz QA e entrega preview para aprovação.

## Como saber se acertou

Sem placas, colunas translúcidas gigantes, cartões falsos, pixels sobre o vestido, textos duplicados, tela branca ou painéis flutuando na hero. Uma transição de passagem por vez; cada cena real se revela. Se precisar explicar o efeito, o efeito falhou.
