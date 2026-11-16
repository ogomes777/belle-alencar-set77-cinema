# Belle Alencar | Auditoria POV V58 e comparativos

**Base de produção preservada:** `7026cea8eee8e88a68a8117f5ddd948b5a51f08c` (V57).  
**Implementação:** branch `feat/belle-pov-v58-set77`.  
**Fonte visual/funcional:** `BELLE_ALENCAR_HERO_POV_SET77.zip`, `LEIA_PRIMEIRO.md`, `AGENTS.md`, `PROMPT_CLAUDE.md`, docs 01–08, seis PNGs e roteiro/skills da ZIP.  
**Autoridade de planta:** ângulo 02 (salão e araras). O ângulo 06 é um contracampo proposto, não fotografia comprovada da loja.

## Implementação e fidelidade

Uma cena Three.js foi mantida como fonte para os seis enquadramentos. A navegação do filme continua independente do modo explorar. O modo de visita compartilha exatamente a câmera, o espaço e os objetos do mesmo `World`; não projeta seis imagens em cartões 2D.

- Araras independentes, duas bases próprias de pedra por lateral, barras e postes de latão. Espaço atrás mantido, limites de colisão explícitos.
- Corredor central, fachada e porta compartilhada com o retorno ao shopping por rotação.
- Paleta de travertino quente, madeira escurecida, luz de teto/spot, cortina pregueada do fundo e superfície espelhada de baixo custo em duas áreas.
- Sem displays altos de roupas que pareciam peças clicáveis.
- `Explorar a loja`, arraste lateral, giro 360° sem corte no yaw, controle de pitch e destinos rápidos Entrada/Corredor/Arara Esquerda/Arara Direita/Provador.
- Colisão por subpassos: limites de parede, bases/volume das duas araras, pódio e divisória do provador.
- `Retomar o filme` mantém scroll original. Touch vertical não sofre bloqueio do gesto horizontal.
- Estados independentes `{categoria,produto,página}` para cada arara. Páginas físicas de oito posições e seleção exata pelo ID; botão `Ver peça selecionada`, tamanhos, seleção de unidade e sacola existentes. Todos os itens ativos da categoria são acessíveis.

**Inventário real:** pendente. A fonte atual contém 48 estudos sintéticos demonstrativos, 8 categorias: vestidos, camisas, croppeds, saias, calças, bolsas, pulseiras e anéis. Bermudas ainda não constam da fonte: não criar itens, preço, estoque ou fotografias fictícios.

## Comparador dos seis ângulos

O teste `tests/e2e/belle-v58-gallery.mjs` captura os seis renders reais, sem simular a imagem de referência como cena. A automação publica os PNGs, `comparador-seis-angulos.html`, métricas e o vídeo de percurso como artefato **BELLE-V58-POV-SIX-ANGLES-VIDEO** na aba GitHub Actions. O comparador aceita os PNGs originais da ZIP localmente, lado a lado.

| Ângulo | Implementado no mesmo cenário 3D | Diferença ainda relevante |
|---|---|---|
| 01 Fachada | Pórtico, duas vitrines, porta central, letreiro, metais dourados | Recuos, vegetação/vitrinismo, puxadores e reflexos do shopping ainda simplificados |
| 02 Salão central | Planta unificada, corredor livre, duas araras independentes, madeira, luz e cortina/espelho ao fundo | Piso, largura dos arcos e escala dos nichos não coincidem pixel a pixel com a foto de referência |
| 03 Arara direita | Barra de latão, suportes de pedra, cabides, peças pretas/vinho, espaço posterior | Os cutouts são estudos fotográficos 2,5D, não digital twins com drape e tecido multivista reais |
| 04 Provador | Divisória, cortina com pregas, espelho e pontos de luz | Espelho é solução estável/specular, sem reflexão fotorrealista de toda a sala; material de cortina carece de ativo físico aprovado |
| 05 Arara esquerda | Rack próprio, roupa clara e caminho de acesso | Densidade, recortes e dobras dos vestidos ainda variam dos PNGs de referência |
| 06 Contracampo da porta | Mesma entrada e geometria para olhar ao shopping | Shopping/galeria ainda é ambiente procedimental, não reconstrução validada do local real; referência é proposta |

## Testes executados e medições

Baseline anterior à implementação:
- `npm run check`, `npm run typecheck`, `npm run build`: aprovados.
- `npm test`: **78/78** aprovados.
- E2E original, sem browser provisionado: não iniciou por ausência do Chromium Playwright. Esse fato é de ambiente, não um teste aprovado.

Branch V58:
- `npm run check`, `npm run typecheck`, `npm run build`: aprovados.
- `npm test`: **86/86**, incluindo 8 testes novos para rotação completa, portas, colisões, estados e IDs/categorias.
- Chromium headless com SwiftShader, desktop 1440×810 em tier touch: primeiro estado 3D utilizável em **21.436 ms**; botão/visita/filtros/detalhe/retomar aprovados; 0 erros JS registrados.
- Chromium emulado mobile 390×844: **8.791 ms** até o primeiro estado 3D utilizável; touch/visita, filtros independentes, detalhe/retomar aprovados; 0 erros JS registrados.
- Modo estático emulado 390×844: **665 ms** para página carregada com catálogo e painel utilizáveis; canvas 3D propositalmente ausente; 0 erros JS registrados.
- Assets 2,5D em Chromium: **39/39** na cena inicial com `mediaReady=true`, **0** carregamentos falhos.

**Atenção:** esses tempos são observações de execução isolada em máquina de CI/sandbox e **GPU por software**, não garantias de LCP ou FPS em aparelhos reais. Testes de fluidez física em GPUs variadas, Safari iOS, Android físico, Firefox e verificação de parâmetros de bateria/reduced-motion ainda são pendentes. Não afirmar 60 FPS constante sem laboratório de dispositivos.

## Gatilhos de aceite pendentes para o visual final

1. Confirmar dimensionamento técnico da fachada, puxadores, vitrines e reflexos com planta/fotografias físicas da loja.
2. Substituir estudos 2,5D por ativos reais aprovados com vistas/GLB/tecidos para cada SKU, preservando integridade do catálogo.
3. Validar espelho real/reflexo e cortina em mobile sem dobrar draw calls ou derrubar FPS.
4. Inspecionar os seis ângulos no comparador, especialmente o fundo do salão e o shopping contracampo.
5. Validar toque em peça física para todos os materiais reais, e desempenho em iOS Safari/Android físico/Firefox.

**Publicação:** branch de preview; produção não foi alterada por este trabalho. O merge deve depender da revisão desses pontos, respeitando `AGENTS.md` do repositório e o gate de cena da ZIP.
