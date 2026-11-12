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


## Evolução geográfica — 12/11/2026

Substitui as limitações anteriores de ausência de contornos/etapas geográficas:
- Países Natural Earth 1:110m e limites de MG/GO 1:50m, domínio público, simplificados localmente. Fonte em docs/licenses/GEOGRAPHY.md.
- Mesma projeção esférica para contornos e coordenadas dos quatro centros urbanos; etiquetas próximas e linhas-guia. Lojas não são apresentadas como coordenadas de levantamento cadastral.
- Câmera contínua Brasil → estado → cidade em 4,2s; movimento reduzido vai direto ao destino. Arraste manual interrompe a navegação automática.
- Ao selecionar uma loja fora da área visível do globo, a esfera entra na tela; restauração inicial da loja não rola a página.
- Google Maps aparece dentro da área da esfera sob clique explícito. Voltar preserva a seleção. Mapa/rotas usam endereço da loja; nada simula ruas ou atribuições Google.
- Sacola surge na progressão .61 do capítulo do vestido, atravessa os capítulos e se separa nos quatro destinos. Retorno do scroll reverte o percurso.
- Projeções geográficas são pré-calculadas ao carregar; malha luminosa deixa de ser desenhada no zoom urbano; render suspenso fora da tela.

Validação adicional: 40 testes unitários, build aprovado, percurso estado/cidade/mapa/retorno em 360/390/768/1440, sem overflow nem exceções JS. Voo verificado nos progressos 0/.1/.5/.9/1 e no retorno. Evidências em reports/city-globe/geographic. Cartografia Google externa não pode ser validada visualmente sob a política de rede atual. Não houve publicação. Não há garantia de FPS em aparelhos físicos; a navegação continua sendo uma esfera editorial com mapa incorporado, não um motor Google Earth.


## Correção da regressão de malha e arraste

A aproximação geográfica desativava a rede acima de 6x e deixava a escala em até 30x após o pointerdown. Corrigido: rede e camada interna mantêm raio constante, inclusive durante a aproximação; o percurso retorna ao globo em 5,2s. Interrupção manual restaura suavemente a escala e ajusta a sensibilidade enquanto ela decai. Movimento reduzido mantém a esfera em escala normal.

Build e 40 testes aprovados. Regressão em Chromium 390px/toque e 1440px/mouse: arrastar durante o zoom mantém resposta e malha visível. Capturas recovered-390.png e recovered-1440.png revisadas. Não publicado nesta sessão.
