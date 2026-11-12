# Belle V26 — globo e lojas

Base: V25 d08f27e. Branch feat/belle-city-globe-v26.

Implementado:
- Fundo branco em #lojas, globo maior, contraste dourado ajustado para branco; título legível.
- Sacola original fornecida no ZIP, RGBA 1254×1254, convertida para WebP 384×384. Sem publicar fotos privadas.
- Voo reversível derivado do scroll entre o fim do filme e o globo; separação dos quatro marcadores. Movimento reduzido desativa voo/inércia.
- Coordenadas dos centros das quatro cidades, conectadas a etiquetas separadas para evitar sobreposição. Não são coordenadas geocodificadas das lojas.
- Seleção observa a API comercial existente; respeita resolução de troca de sacola. Orienta para a cidade e aproxima em duas etapas; mantém só o marcador selecionado.
- Endereços transcritos dos prints do cliente. Google Maps carrega sob clique, em dialog com Escape e retorno de foco, com link externo de rotas.
- Arraste livre nos dois eixos e inércia preservados; pausa fora da tela e na aba oculta.

Validação:
- Build TypeScript/Vite aprovado; 38 testes unitários aprovados.
- Chromium: 390/768/1440, quatro botões, sem overflow; screenshots em reports/city-globe.
- Mouse e toque CDP: rotação horizontal e vertical aprovadas.
- Seleção das quatro lojas, abertura/fechamento do mapa e ausência de exceções de execução aprovadas.
- Amostra de laboratório:121 rAF/2005ms. Não é medição de aparelho físico nem garantia de FPS da renderização.

Limites reais:
- Esfera procedural própria; não Astral Shell licenciado nem cartografia terrestre real. Aproximação em duas etapas não apresenta limites estaduais ou imagem de satélite.
- Maps embed depende da rede/Google; a verificação comprovou URL e modal, não carregamento cartográfico externo neste ambiente.
- Voo completo entre capítulos requer revisão adicional com vídeo em movimento; não declarar fidelidade integral à referência. O efeito de impacto/split ainda é uma aproximação.
- Nenhum deploy confirmado: plugin Vercel não disponível e API Vercel retorna HTTP403 neste ambiente. Produção preservada.
