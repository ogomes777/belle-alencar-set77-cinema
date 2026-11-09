# PUBLICAR REPOSITÓRIO SEM MISTURAR CLIENTES
1. Acesse https://github.com/new e crie um repositório **privado** `belle-alencar-set77-cinema`, vazio.
2. Extraia este ZIP na pasta `belle-alencar-set77-cinema`.
3. Abra terminal na pasta; execute:

```bash
git init
git branch -M main
git add .
git commit -m "feat: import Belle Alencar cinema master kit"
git remote add origin https://github.com/SEU_USUARIO/belle-alencar-set77-cinema.git
git push -u origin main
```

Substitua SEU_USUARIO pelo usuário GitHub correto. Não use URL falsa de repo existente.
4. Abra o projeto `belle-alencar-set77` na Vercel e vincule esse repositório em Settings → Git quando disponível. Faça backup da V3 e use preview branch para reconstruir, antes de trocar a produção.
5. `npm run dev` para testar a baseline; `npm run check` para verificação estrutural; Playwright opcional na etapa QA.
6. Não commitar senhas, tokens, `.env`, dados de clientes, certificados ou mídias sem direito.
