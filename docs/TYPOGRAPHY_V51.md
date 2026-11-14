# Belle V51 | Sistema tipográfico cinematográfico

## Cinco papéis editoriais

1. **Gebuk:** interface, chamadas de ação, etiquetas, navegação e chips. Substituto OFL temporário: **Righteous**.
2. **Allesya:** assinatura, ênfases caligráficas e detalhes emocionais de títulos. Substituto OFL temporário: **Pinyon Script**.
3. **Savage Roses:** títulos de campanha, fechamento, capítulos de navegação e manifestos. Substituto OFL temporário: **Bodoni Moda**.
4. **Wasted Vindey:** títulos editoriais, storytelling e grandes chamadas do filme. Substituto OFL temporário: **Italiana**.
5. **Playfair Display:** corpo de texto, informações comerciais, produtos, formulários e tipografia de leitura. **Família original licenciada sob SIL OFL 1.1**.

## Uso comercial e licenças

**Não incorporar os arquivos gratuitos de uso pessoal** das quatro famílias pagas em produção. Antes de carregar as originais em CSS, a Belle/SET77 deve obter as versões de **webfont** com licença aplicável ao domínio, e validar o EULA de cada estúdio. Uma licença desktop não equivale necessariamente à licença web.

Fontes de referência:
- Gebuk / Sealoung: https://sealoung.com/product/gebuk/
- Allesya / Diki Prayoga: verificar licença de uso comercial e web com o fabricante
- Savage Roses / 7NTypes: https://www.creativefabrica.com/product/savage-roses/ (confirmar direitos de webfont, não apenas design impresso)
- Wasted Vindey / Koplexs Studio: https://www.myfonts.com/collections/wasted-vindey-font-koplexs-studio/
- Playfair Display: https://github.com/google/fonts/blob/main/ofl/playfairdisplay/OFL.txt

Os tokens CSS `--v51-gebuk`, `--v51-allesya`, `--v51-savage`,
`--v51-wasted`, `--v51-playfair` priorizam as fontes originais quando
devidamente instaladas e disponíveis. A versão pública carrega somente as
alternativas OFL pela Google Fonts. **Não afirmar que as quatro famílias
pagas já estão renderizando em dispositivos reais.**

## Motion e legibilidade

- Revelação editorial curta por IntersectionObserver, sem trocar nós do texto ou criar overlays permanentes.
- Respeita `prefers-reduced-motion`, `perf-lite`, navegação por teclado e três temas.
- Sem partículas/fontes rasterizadas ou animação de filtros em loop.
- Menus, lojas, formulário, catálogo, busca e sacola permanecem com textos selecionáveis.
- O filme continua usando seu próprio diretor de scroll, sem nova orquestração.
- Copys prioritárias atualizadas em PT/EN/ES/IT no dicionário de tradução. As ressalvas do catálogo demonstrativo permanecem.
