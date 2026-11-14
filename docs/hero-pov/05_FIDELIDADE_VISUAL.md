# Reprodução visual quadro a quadro

As cinco imagens aprovadas estão em `referencias/` como PNGs originais. O sexto quadro é uma proposta de contracampo para a porta vista de dentro. Os quadros guiam câmera, composição e acabamento. As cinco imagens foram geradas em separado e variam em alguns detalhes arquitetônicos. Reconstrua uma geometria coerente, use a hierarquia abaixo quando houver conflito e documente somente desvios materiais. Um match perfeito de pixels em todo ângulo depende de ter os mesmos modelos, texturas, luz e câmera das referências. O compromisso é reproduzir cada elemento verificável nos ângulos de aceite.

## Hierarquia espacial

| Referência | Autoridade principal | Detalhes a reproduzir |
|---|---|---|
| 01 Fachada | Entrada vista do shopping | Portal recuado de calcário, três vãos verticais, porta dupla central, letreiro físico com logo oficial, vitrine direita com vestido vinho, vitrine esquerda com expositores de pedra e reflexo do piso com queda de contraste. |
| 02 Sala | Planta interna e vista pelo vão de entrada | Duas linhas de varão livres com bases retangulares de pedra, piso espinha de peixe apontando para o fundo, três trilhos de spots, arco atrás de cada lado, espelho alto ligeiramente à esquerda do eixo, cortina à direita e pedestal pequeno com bolsa à esquerda. |
| 03 Arara direita | Acabamento da arara direita e pose oblíqua | Vinho e preto, tecido drapeado com sombra entre camadas, cabide escuro com gancho de metal, varão em diagonal, pés visíveis e corredor livre do lado esquerdo do quadro. |
| 04 Provador | Materiais, elementos e enquadramento de chegada | Espelho arqueado com perfil fino, vestido champagne em suporte ao lado, cortina pesada com pregas verticais até o piso e assento bouclé baixo. O reflexo é o do ambiente 3D que existe atrás da câmera. |
| 05 Arara esquerda | Acabamento da arara esquerda e pose oblíqua | Cetim e renda creme, perfil dos cabides e dos tecidos, metal champagne, pedra com poros, arara oposta percebida ao fundo. |
| 06 Porta por dentro | Contracampo, continuidade e orientação | Mesma porta, puxadores e vitrines da fachada. Preserve a posição física de cada arara. Ao olhar para trás, vinho/preto aparece à esquerda da tela. Shopping visível através do vidro com exposição e paralaxe críveis. |

## Método de reconstrução

1. Use coordenadas normalizadas nas imagens. Fixe câmera, aspect ratio, eixo, linhas de fuga, FOV e altura do olho antes de ajustar o modelo. Comece a 1,62 m de altura, com vertical reta. Salve cada pose com posição, quaternion ou mira, FOV, aspect e versão do asset. O contracampo usa o mesmo ambiente e o eixo de entrada.
2. Alinhe em bloco cinza. No desktop 16:9, compare sempre o canvas sem a interface e no mesmo crop. Pontos de controle iniciais do quadro 02, em x/y de 0 a 100%: topo dos montantes mais próximos esquerdo e direito (12,25) e (89,25), topo do arco do espelho (48,22), topo da cortina (62,24), fundo visível da parede central entre y=19% e y=61%. Tolerância inicial de 3 pontos percentuais para marcos principais visíveis, salvo oclusão ou correção documentada. Use o comparador para marcar e aferir os demais marcos diretamente na imagem.
3. Trave a planta e compare de novo com materiais. Use a pedra com juntas e poros finos, madeira com direção coerente, bronze com escovação suave, seda com reflexão direcional e renda com espessura perceptível. Reproduza brilhos locais sem estourar o creme. Compare recortes de porta/vidro, pés/sombra, cabide/tecido, pedra e espelho a 100%. Compare a posição e forma das sombras principais e transição entre luz e sombra.
4. Teste ângulos contínuos entre os quadros. Uma arara precisa conservar pés, comprimento e volume quando se olha de costas. O reflexo e as vitrines têm de corresponder à geometria da loja. Não use os PNGs como paredes, billboards ou substituto do cenário ao vivo. O catálogo real usa mídia autorizada. Se faltar volume para uma peça real, registre a lacuna no inventário e mantenha acesso ao detalhe 2D com a mídia disponível.
5. Faça captura mobile da mesma planta. Reenquadre para trazer os pontos de ação ao campo visível. Preserve profundidade e leitura dos materiais e das peças mesmo com redução de qualidade.

Abra `referencias/comparador.html` offline, selecione uma referência e carregue localmente a captura do render. Use a transparência ou a divisão vertical. A captura deve ter 16:9 para comparação direta. Nada é enviado pela página.

A densidade visual vem de juntas, textura de pedra, reflexos, caimento, luz e profundidade dos expositores. Mantenha essa riqueza em cada plano e deixe portas, circulação e controles fáceis de ler.
