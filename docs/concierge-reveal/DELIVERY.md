# Atendimento Belle — revelação editorial por pincel

Escopo: substituir somente a foto do provador em #atendimento pela Billie com duas camadas alinhadas. No mobile a área visual antecede a copy e os CTAs; desktop mantém a composição de duas colunas. Enquadramento do joelho para cima.

Referência: MP4 anexado 18.24.05 e código-prompt Pink Rider. O prompt é tratado como referência técnica: nenhuma outra modelo, marca, paleta rosa, navbar ou página standalone foi incorporada. As duas imagens do ZIP foram inspecionadas: Billie com blusa/short e vestido isolado, ambos RGBA1024×1536. A segunda camada foi produzida com ferramenta de edição visual usando as duas imagens, preservando pose e rosto. É uma composição editorial sintética, não simulação de prova física ou promessa de caimento.

Assets comerciais: public/concierge/billie-original.webp e billie-champagne.webp, 768×1152. Masters fornecidos permanecem nos anexos e master editado em /workspace/generated_images. Os arquivos publicados mantêm alpha real.

Implementação: canvas local com máscara de pincel orgânica e buffer separado, exclusão da imagem-base antes de compor o vestido; rastro de1,1s, máximo120carimbos. Sem novos pacotes. Render somente com rastro ativo e seção visível, pausa em aba oculta. Movimento reduzido/essential usa composição estática original. Touch pan-y preserva scroll vertical. Imagem original permanece fallback se JS/imagem editada falhar. CTAWhatsApp/Instagram preservados. CSSV37 de cortina da foto exclui o novo componente para não disputar propriedades.

QA Chromium:360/390/768/1440; ponteiro real e toqueCDP revelam pixels, o buffer retorna exatamente à imagem original após1,4s, reduced impede pintura, semoverflow, CTA preservado, sem exceções JS. Screenshots em reports/concierge. Build e npmtest executados; logs locais /tmp/reveal-build.log e /tmp/reveal-test.log. Sem garantia de desempenho em aparelhos físicos.

Sem deploy realizado. Branch de revisão feat/belle-concierge-brush-reveal. Trabalho de QA da V37 preexistente no diretório foi preservado sem incluí-lo neste commit.
