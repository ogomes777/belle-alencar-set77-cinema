# Belle V29 — Scroll stability / performance changes

## Actual fixes
1. Hero: no fixed additional 1050ms sleep; wait for actual intro completion, then one RAF. Brand SVG and typography preloads run in parallel. World camera receives CURRENT scroll position before all merchandise textures finish loading.
2. World: old governor used to call fail('low-fps'), destroying the scene after a slow spell. Now degrades DPR/shadows/reflections instead of failing. A context-loss remains a real failure.
3. World: stop offscreen RAF, cap simulation dt on resume; calculate portrait FOV from storyboard rather than repeatedly compounding current camera FOV. Catch up after scroll jumps, re-entry and BFCache.
4. Hardware: SwiftShader/llvmpipe detection selects static editorial poster tier automatically; weak CPUs/data saver/reduced motion already had static fallback. Real GPU devices keep touch/cinema tier.
5. Runway: cache ticker label height rather than getBoundingClientRect during every animated frame; avoid repeated inert/accessibility/text writes, clamp blur and disable blur on mobile, reduce needless ResizeObserver loops.
6. Ocasiões: full 360° revolution slowed to 54 seconds desktop and 72 seconds mobile; cap update cadence to 42fps desktop and 29fps mobile, keeping manual touch controls, stops and resumes.

## QA
- Vitest+Vite/tsc
- 390 / 768 / 1440 viewport; forced static on software and WebGL accelerated on genuine GPU.
- First entry -> Hero -> passarela -> ocasiões -> FAQ -> return top; repeated navigations; viewport resize; bfcache.
- Carousel automatic orbit and explicit pause, accessibility and link targets.
- Verify no errors and acceptable responsiveness; do NOT promise identical FPS on every device. Real-device measurements needed for hardware claims.
