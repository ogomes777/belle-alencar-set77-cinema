# RELEASE REPORT | BELLE ALENCAR CINEMA V4 (PREVIEW)

Data: 10/11/2026 · Branch: `claude/bold-dijkstra-jyzqak` · Commit publicado: `64dfe1a` · Versão `4.0.0`

## 1. Publicação (somente PREVIEW)
| Item | Valor |
|---|---|
| Deployment | `dpl_HHYAtXTTrEeNkWTuKUyrpNyCW4S9`, estado **READY**, target **preview** |
| URL do preview | https://belle-alencar-set77-56x1zb6cx-ogomes77-s-projects.vercel.app |
| Alias do branch | https://belle-alencar-set77-git-claude-bold-598bab-ogomes77-s-projects.vercel.app |
| Proteção | Vercel Authentication (SSO) ativa em previews: precisa estar logado na conta/time da Vercel |
| Produção | **Não foi tocada.** `belle-alencar-set77.vercel.app` continua servindo a V3 (`dpl_2hH6ucpRuhgzjoAg4BGDsR3ZmgzE`) |
| Configuração do projeto | Não alterada: build e framework vêm do `vercel.json` do repositório |
| Verificação pós-deploy | HTML do build servido (bundle `/assets/index-kAgjTTFD.js`), cabeçalhos de segurança aplicados, `x-robots-tag: noindex`, pôster `/posters/provador-p.jpg` → 200 `image/jpeg` |

**Rollback:** nada a desfazer em produção. Para descartar o preview, apague o deployment acima no painel da Vercel. Para voltar à V3 local: `npm run legacy`. Antes de promover a V4 para produção: aprovação do cliente, ativos oficiais e item 6 abaixo.

## 2. O que foi construído (real e funcionando)
- **Filme em primeira pessoa com câmera real** (Three.js r187), em um plano-sequência controlado pelo scroll nativo: galeria em travertino com reflexo planar no piso → vitrine com letreiro em latão sobre faixa de bronze → portas de vidro que pivotam → salão em carvalho com araras → vestido que sai do cabide e voa até o pódio → macro na trama com faixa de luz dourada → arcos de categoria → provador com espelho real.
- **Vestido-estudo com física de tecido**: saia em Verlet no espaço do mundo (inércia do voo), corpo-colisor invisível, memória e restauração de forma, vento com rajadas, sopro por energia de scroll, arraste e teclado no provador, 3 silhuetas × 5 tons. Rotulado em todo lugar como **estudo 3D procedural, não peça do acervo**.
- **Araras com cabides em mola** que reagem à passagem da câmera e ao ponteiro (instanciadas).
- **Tiers**: CINEMA (reflexos, sombra, DPR ≤ 1,75), TOUCH (DPR ≤ 1,25, sem reflexo planar, tecido mais leve), STATIC (reduced-motion, Save-Data, sem WebGL, contexto perdido, FPS baixo ou "Movimento: essencial") com **14 pôsteres renderizados do próprio 3D** (desktop e retrato). Governador de FPS em tempo de execução.
- **Intro do monograma** (traço + máscara + cortina), 1,75 s, uma vez por sessão, encerra com qualquer tecla/toque/roda.
- **Comércio multiloja tipado** (agente commerce-engineer): contratos TS, 4 lojas, 12 referências **demonstrativas** sem preço, filtros (categoria, ocasião, tamanho, silhueta), quick view com FLIP, favoritos, busca, sacola de interesse **por filial**, troca de loja com decisão explícita e revalidação, envio da sacola para o WhatsApp oficial com mensagem copiada, checkout desativado com motivo. Ponte para o filme: "Ver no provador 3D" veste o estudo e leva ao capítulo 07; "Ver peças nesta linha" filtra a coleção.

## 3. Evidências de teste (executadas nesta sessão)
- `npm test` (Vitest): **26/26** (18 de lógica + 8 de integração DOM).
- `npm run e2e` (Playwright/Chromium): **50/50**: zero erros de console e zero 4xx/5xx em 360/390/768/1440; sem overflow horizontal em 9 paradas por viewport; intro; reduced-motion sem canvas; seletor de loja nunca abre sozinho; persistência de cidade, `?loja=` e `?cidade=`; sacola por filial e troca com decisão; deep link `?peca=`; foco entra e volta; 1º Tab no skip link; render loop ativo no palco e **parado fora dele**; draw calls ≤ 120.
- Laboratório (Chromium headless, sem throttling, **não é dado de campo**): LCP 108 ms (390) / 100 ms (1440); CLS 0 / 0,001.
- Draw calls medidos: 25–88 no CINEMA (88 inclui o passe de reflexo da galeria), 22 no TOUCH. Triângulos: 54k–123k.
- Bundle: shell + comércio 19,8 KB gzip + CSS 9,2 KB; chunk 3D carregado depois da 1ª pintura: three 147 KB + gsap 53,5 KB + cena 16,9 KB (gzip).
- Capturas: `docs/qa/*.png` (E2E) e as capturas por capítulo feitas durante o desenvolvimento.

## 4. Limitações de teste (honestas)
- Só Chromium está instalado no container: **Firefox, WebKit/Safari iOS e Chrome Android reais não foram testados**.
- WebGL no container roda em SwiftShader (software). FPS em GPU real **não foi medido**; o governador e os tiers foram exercitados, não validados em aparelho.
- O preview publicado está atrás de SSO; a suíte E2E rodou no build local (`vite preview`), não na URL publicada.
- Core Web Vitals de campo: inexistentes (sem tráfego/RUM).

## 5. Problemas conhecidos
| Sev. | Item |
|---|---|
| P2 | Rótulos "VESTIDOS/CONJUNTOS/ACESSÓRIOS" dos arcos 3D ficam acima do enquadramento em parte do capítulo 06 (os botões DOM cobrem a função). |
| P2 | No header a 390 px, "Escolher loja" aparece truncado antes da escolha. |
| P2 | Sem autocolisão no tecido: em giros muito rápidos a saia pode se cruzar por um instante antes da restauração de forma. |
| P2 | Monograma é provisório (tipográfico) até o vetor oficial. |
Nenhum P0/P1 aberto pelos critérios de `docs/QA_PLAN.md` dentro do que foi possível testar.

## 6. Pendências antes de produção comercial
1. Vetor oficial do monograma e do lettering (o JPEG do kit está corrompido).
2. Fotos oficiais multiângulo, catálogo com SKU/preço/grade e direitos de uso (substituem `catalog.demo.ts`).
3. Estoque por filial e regras de reserva; endereços, horários e WhatsApp de Frutal, Catalão e Mineiros.
4. Backend autorizado (Auth, RLS, LGPD) para conta, preferência server-side e checkout. Hoje nada é cobrado nem enviado a servidor.
5. QA em Safari iOS, Chrome Android e Firefox; medição de FPS e CWV em aparelho real.
6. Aprovação formal de copy e direção pelo cliente.

## 7. Nota de autorização
Publicado como **preview** conforme `prompts/04_QA_E_RELEASE.md`. Nenhum alias de produção, domínio, variável de ambiente ou configuração de projeto foi alterado.
