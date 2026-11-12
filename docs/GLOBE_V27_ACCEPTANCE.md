# Belle Alencar V27 · Globe motion, luminous title and Google Maps styling

## Scope
- Soft, alpha-faded dark sphere instead of the hard black ring. Keep globe network, city markers and geography data.
- Continuous yaw plus slower pitch in idle after automatic geographic navigation.
- Pointer drag with decaying momentum, tap impulse, two-touch pinch and bounded wheel zoom (1x–3.6x).
- Zoom follows a damped target and projects network depth locally; it is NOT Google Earth nor street-level rendering.
- Google Maps street tiles remain provided by the external embed, opened explicitly through the existing store actions.
- A single continuous white/champagne/gold light band crosses the whole section title. The overridden gradient was previously disabled in city-globe.css.
- Redesigned in-stage map pane with gold editorial hierarchy, no inner overflow bars and accessible return control.

## QA checklist
- Typecheck / Vite build / Vitest tests.
- Preview: HTML 200, JS/CSS 200, four stores and their buttons.
- Globe pointer drag/touch, wheel and pinch (normal motion); 1x zoom reset on double-click.
- Selected store -> Brazil/state/city route -> map -> return; map route link remains external.
- No wheel interception when mouse is outside globe.
- Reduced motion disables auto-rotation/glow and pinches leave the page readable.
- Capture desktop/mobile and report unknowns if browser/device verification unavailable.

## Known limits
- Globe is a bespoke canvas visualization, not an actual 3D engine or Earth map. Wheel/pinch zoom reveals more of the editorial geography only to a bounded scale; real roads are displayed in Google Maps.
- Google Maps iframe availability depends on third-party network/service.
