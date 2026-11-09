# ARQUITETURA ALVO
## Camadas
- CMS/data: stores, catalog, product variants, inventory, campaigns, price by store.
- Storefront: semântica HTML, SEO, busca, catálogo, páginas de produto, checkout quando apto.
- Experience: StoryController, CameraRig, SceneRouter, transitions, graphics renderer, MotionScheduler.
- Commerce state: selectedStore, cart, wishlist, userPreferences, auth, fulfillment, analytics consent.
- Observabilidade: LCP/CLS/INP, recursos WebGL, erros, conversão de etapa.

## Stack sugerido, não imposição
React + Vite/Next + TypeScript; Three.js ou R3F; GSAP/ScrollTrigger; Zustand/context para estado; CSS modules/design tokens; Supabase ou backend equivalente quando autorizado. Considerar solução estática modular se reduzir complexidade.

## Componentes
`ExperienceShell`, `IntroDirector`, `StoreFacadeScene`, `DollyController`, `RailScene`, `DressMesh`, `MaterialLab`, `CategoryPortal`, `FittingRoom`, `ProductGallery`, `StorePicker`, `CartDrawer`, `CheckoutGateway`, `MotionAccessibility`.
Se dados oficiais não existem, usar interface tipada e mock data claramente separada e impossibilitar compra real.

## UX resiliente
Sem JS pesado, a página precisa carregar logo, intro skip, texto, loja, contato e catálogo placeholder rotulado. WebGL é enhancement e jamais barreira ao conteúdo.
