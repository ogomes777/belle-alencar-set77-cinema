# REFERENCE_DIFF · arara viva e voo até a bolsa

Fonte: `reference/video/REFERENCIA_ORIGINAL_27s_818quadros.mp4` do kit Living Palace (464×832, 30 fps, 818 quadros). **O vídeo e os quadros NÃO foram versionados** (o repositório é público; direitos do vídeo não confirmados). Análise feita localmente: quadros a 10 fps de todo o vídeo, recortes ampliados da tela do notebook e trechos a 30 fps nas transições. A tela é filmada de lado por celular; medidas abaixo são relativas à largura do varão e aproximadas (não houve homografia completa).

| Timecode | Observado (evidência) | Classificação | Implementação Belle | Fidelidade |
|---|---|---|---|---|
| 0,0–1,4 s | Peça sob o cursor cresce para ~1,3–1,6× da largura das vizinhas e vai para frente; inclina ~10° no cabide | observado | `rack.ts`: magnificação gaussiana (σ≈1,08 slot), escala-alvo 1+0,5·g; z por magnificação; pêndulo no gancho | alta |
| 4,2–7,3 s | Vizinhas **abrem espaço** e as distantes se comprimem conforme o cursor anda (efeito "dock"); a peça sob o cursor permanece sob ele | observado | afastamento SPREAD=0,62 slot com compensação L (a peça sob o foco não foge do cursor) | alta |
| 6,3 s | Peça que sai do foco balança com borrão de movimento | observado | pêndulo excitado pela **aceleração do próprio cabide** (torque ∝ +aₓ) e pelo roçar do cursor; k=30, c=1,7 (~0,9 Hz, 2–3 oscilações) | alta (valores ajustados por inspeção) |
| 10,6–11,8 s | Arara mostra outras peças à direita (deslizou) | observado | drag 1:1 + inércia + snap no item central; trackpad horizontal; deslizamento automático perto das pontas | média (gesto exato wheel×drag não aferível) |
| todo o vídeo | Etiqueta escura sob a peça focada com nome/preço | observado | `.rack__label` segue a peça; "preço" substituído por "Clique para ver · estudo 3D" (sem preço inventado) | alta |
| 1,47–1,60 s | Ficha creme surge por cima da arara (escala+fade), modelo à esquerda, nome/preço/tamanhos/CTA à direita, fundo desfocado | observado | `viewer.ts`: FLIP da MESMA imagem do cabide para a ficha; painel 0,965→1; info em stagger; backdrop blur 12px | alta (sem modelo: estudo 3D rotulado) |
| 2,27–2,50 s | Ao fechar, a mesma peça volta ampliada e faz pêndulo amortecido (dir→esq→assenta) | observado | FLIP reverso ao cabide atual + impulso ω=1,25 e foco mantido 1,6 s | alta |
| 7,63–7,97 s | Painel vertical "lineup" da bolsa com miniaturas, fundo muito desfocado | observado | clique na bolsa abre a sacola de interesse (lista com o mesmo recorte de cada peça) | média |
| — | **Miniatura do vestido voando até a bolsa** | **solicitado pelo usuário** (trajetória granular não visível na captura; nada medido aqui) | `flight.ts`: antecipação 130 ms; Bézier com subida; pêndulo físico + saia defasada; escala 1→~0,09; oclusão entre fundo e lábio da bolsa; impacto com squash/alça/brilho; contador só no impacto | requisito atendido; evidência em vídeo 25 fps (ver abaixo) |
| — | Entrada da arara | solicitado (BEAT M003) | cabides pousam em cascata do centro para os lados, 75 ms entre pares | — |

## Evidência do voo (gravação Playwright, 25 fps, 1280×800)
0 ms: barra atrasa e a peça sobe inclinada · 80–200 ms: arco para a esquerda, escala caindo · 320–440 ms: desce sobre a boca · 400–520 ms: entra entre fundo e lábio · ~560 ms: impacto (quique, alça, contador "1") · 880 ms: imagem da ficha retorna à opacidade total.

## Diferenças conscientes
- Sem modelo real nem fotos de produto: a ficha mostra o mesmo recorte 3D com selo "Estudo 3D · demonstração".
- Headline, marca e peças da referência **não** foram copiadas: copy própria ("Passe a mão pela arara."), palácio marfim/latão, vestidos renderizados do estudo 3D Belle.
