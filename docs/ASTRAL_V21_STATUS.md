# Astral Shell V21 — estado da integração

Base: `feat/belle-gilded-pulse-v20`, commit `e1ac6cd8902da7417816a2e871fe612f12868df5`. A seção `#lojas` possui as quatro unidades e seus controles originais. A branch de trabalho não altera o DOM, as animações nem a experiência comercial.

O kit e a gravação foram extraídos e revisados localmente. O vídeo anexado é idêntico ao vídeo do kit (SHA-256 `a1a6a046c9008fa1ad48a44b6131176d28c35655343d1fafa0abd617b88d9bf3`), 464×832, 30 fps, 26,428 s. As pranchas mostram uma esfera dourada de pontos e linhas com rotação e pulsos luminosos; a imagem é uma gravação de tela em perspectiva, não uma captura direta.

O componente original pago não está no kit nem no repositório. Não foi detectada `REACTBITS_LICENSE_KEY` no ambiente ou em `.env.local`. A ausência impede instalar a fonte licenciada, conferir sua API e montar/testar uma ilha React verdadeira. Nenhuma credencial foi impressa ou criada; `.env.local` está ignorado pelo Git. Nenhuma imitação ou conteúdo de terceiros foi adicionado. `src/astral/preset.ts` registra os parâmetros fornecidos para uso posterior; não está conectado ao site e não representa implementação funcional.

Para continuar, configure localmente uma licença React Bits Pro válida, sem enviar a chave na conversa, e disponibilize o ambiente autenticado. Então instale o componente original pelo registry autorizado, confirme seu export e suas props reais, integre a ilha somente em `#lojas`, e faça QA visual, performance, comércio e acessibilidade antes de preview ou produção.

Nenhum preview ou produção foi publicado. A Vercel não apresenta ferramenta disponível nesta sessão; acesso à API deve ser reconfirmado quando o componente estiver disponível. Os testes executados nesta branch validam apenas a base e o preset, não a esfera.
