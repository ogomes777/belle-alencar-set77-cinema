---
name: belle-reference-forensics
description: Analisa referências audiovisuais das transições da Promptfly, separando observação de hipótese, sem usar vídeos de diagnóstico da Belle como referência.
---

# Skill: perícia das referências Promptfly

## Quando usar
Antes de criar motion, ao comparar um MP4 original de transição ou a página `https://promptfly.com.br/transicoes`, ou quando pedirem fidelidade a vídeos.

## Procedimento
1. Abrir `docs/REFERENCIAS_E_PROVENIENCIA.md`, `docs/TEMPLATE_ANALISE_REFERENCIAS.md` e `docs/ACERVO_22_TRANSICOES.md`.
2. Conferir se cada arquivo em `referencias/videos_ORIGINAIS/` é realmente uma DEMO DA TRANSIÇÃO. Vídeo da Belle, de Billie, GB ou gravação de bug não é referência desta skill.
3. Assistir/inspecionar todos os estados significativos de cada demo selecionada: inicial, 25/50/75/final e reversão. Relatar tempo com a precisão que o vídeo permite.
4. Identificar a diferença entre page transition (troca real de rota) e scroll boundary (landing de página única). Não copiar literalmente o mecanismo sem adaptar à semântica da seção.
5. Documentar somente observações confirmadas. Campos não observados são `NÃO VERIFICADO`, nunca preenchidos por criatividade.
6. Extrair **princípios** de duração, densidade, direção e material. A adaptação Belle deve ser autoral.

## Saída exigida
`docs/qa-v37/REFERENCE_OBSERVATIONS.md` preenchido com links, arquivos, timestamps e lacunas. Nunca afirmar "assisti" sem assistir.
