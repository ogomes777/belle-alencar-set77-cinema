---
name: belle-release-gate
description: Confere branch, commit, CI, checklist de performance e aprovação visual antes de permitir preview ou recomendar promoção à produção.
---

# Skill: gate de publicação

## Gates
- Repositório certo `ogomes777/belle-alencar-set77-cinema`.
- Origem V36 confirmada, sem perder dados locais.
- Alterações focadas apenas nas passagens aprovadas.
- Não existem motores V33/V35 reativados ou overlays equivalentes.
- `npm test`, `npm run build`, QA browser 4 tamanhos e smoke commerce APROVADOS.
- Evidências de scroll nos dois sentidos e aprovação estética humana.

## Política de release
Esta missão autoriza **edição e preview**, não promoção para o domínio de produção. Se o Codex possuir credenciais, não usá-las para criar deploy production sem autorização expressa. Sem acesso ao deploy, entregar branch/PR + instrução local de preview.

## Pós teste
Publicar diagnóstico honesto, código mudado, medição real (quando houver), lacunas, status visual por fronteira. Não chamar de perfeito sem ver.
