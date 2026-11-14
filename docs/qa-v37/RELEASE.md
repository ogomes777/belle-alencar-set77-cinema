# V37 — revisão e publicação

Base: `fix/belle-v36-remove-decorative-overlays`, `712591e3d071e116450f85c3ebe9d776fbf583f1`, descendente de `7518b769118e4b1516a70ab09f246a1ec189eaa8` citado no pacote.
Branch de revisão: `fix/belle-v37-editorial-boundary-reveals`.

## Instalação do pacote

O instalador PowerShell foi lido e adaptado ao Linux: cópia conservadora para `BELLE_CODEX_KIT_V37/`, `.agents/skills/` e `.codex/agents/`; nenhum AGENTS.md existente foi substituído. Arquivos preexistentes não foram sobrescritos. Os arquivos do kit são instruções/contexto, não assets de runtime.

## Acesso constatado

- Plugin Vercel não exposto nas ferramentas desta sessão.
- `curl -I https://api.vercel.com/v9/projects`: HTTP403, resposta do proxy/envoy.
- `gh api repos/ogomes777/belle-alencar-set77-cinema`: Forbidden no acesso a api.github.com.
- Navegação externa aos sites: consultar REFERENCE_OBSERVATIONS.md.

Não há confirmação de deployment nem PR criados por esta sessão. Nenhuma promoção de produção foi executada.

## Revisar localmente

```sh
npm ci
npm test
npm run build
npm run preview -- --port 4173
```

Abrir http://localhost:4173 e comparar as evidências V36/V37 em `docs/qa-v37/`. Para criar um preview Vercel em ambiente autenticado, executar `vercel` na raiz (sem `--prod`) ou importar a branch de revisão no projeto existente. Validar o URL retornado antes de aprovar qualquer promoção. A produção exige autorização expressa posterior.
