---
tipo: dna_tecnico_projeto
projeto: GB_IMPORTS
status: revisao_documental_nao_teste_de_producao
repo: ogomes777/gb-imports-set77
sha_tree: efcd3ce42c5b1d0a583f42c2ef433ff8e56b4fff
revisado_em: 2026-11-04
classificacao: interno
---

# GB Imports | DNA técnico e experiência reutilizável

## Estado documentado
`README.md` descreve o flagship como **protótipo navegável não transacional**: não há preço, estoque, checkout nem pedido real. Produção informada: https://gb-imports-set77.vercel.app. Documentação não substitui teste do deploy atual.

## Fonte de código
[[GB_IMPORTS_SET77_SOURCE_MAP]] e [repo](https://github.com/ogomes777/gb-imports-set77). Arquitetura modular estática com `styles.css`/`main.js`, `v03..v08`, `motion-core.js`, `look-fitting.js`, `gb-rail-v11.js`, `gb-puff-intro.js`, `gb-hero-cosmos-v46.js`, dados e scripts de curadoria.

## Sistema de cena
1. Intro puff pelúcia interativa com fallback poster, watchdog e boot paralelo.
2. Hero Tech Fleece, profundidade, atmosfera suave dual-theme, 3 capítulos no legado.
3. Arara/rail: física de cabides e gesto 1:1.
4. Catálogo editorial: cards, filtros, detalhe, interesse/sacola como demonstração.
5. Look Studio V20: corpo persistente e emotes, composição editorial sobre fotografias de produto.

## Limites do Look Studio
`docs/FIT_V20_FINAL_POLISH.md`: emotes PASSINHO, TCHAU, SALVE, 360°, PULAR; testes automatizados em Firefox para combinações desktop/mobile reportados no documento. QA físico Safari/iOS/Android ainda indicado como pendente. **Fotos planas de roupa não viram tecido 3D**; braços/mangas exigem novo acervo real para caimento correto.

## O que transportar
`motion-core.js`: Tokens, Prefs e ticker global, molas, interações por gesto e FLIP. `gb-puff-intro.js`: máquina de estados e watchdog. Mídias e identidade GB não devem ser transferidas para outros clientes.

## Prioridades de QA
Gestão de depth/z-index, fps em celular, primeira pintura sem flash, tema claro, alinhamento do roupa/corpo, reduced-motion, navegação e fallback. Decisões atuais de produto/identidade devem prevalecer sobre versões antigas.

## Relações
[[GB_MOTION_CORE_V07]], [[GB_PUFF_INTRO_V45]], [[GB_IMPORTS_DECISOES_MOTION_E_UX_2026]], [[GB_IMPORTS]].