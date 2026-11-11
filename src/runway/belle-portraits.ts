/**
 * Real, explicit Belle portrait slots.
 *
 * Add an authorized transparent portrait for EACH outfit in
 * public/assets/belle/portraits/, then fill its path below only after:
 * 1. confirming the owner identity and usage rights;
 * 2. confirming the outfit matches the exact three catalog references;
 * 3. validating transparency, mobile crop and color.
 *
 * No stranger, synthetic guess, or placeholder should be presented as Belle.
 * The empty mapping safely keeps the existing isolated-garment study active.
 */
export const BELLE_APPROVED_LOOK_IMAGES: Readonly<Record<string,string | undefined>> = Object.freeze({
  // champagne: '/assets/belle/portraits/champagne.webp',
  // vinho: '/assets/belle/portraits/vinho.webp',
  // azul: '/assets/belle/portraits/azul.webp',
  // noite: '/assets/belle/portraits/noite.webp',
  // oliva: '/assets/belle/portraits/oliva.webp',
  // 'azul-claro': '/assets/belle/portraits/azul-claro.webp',
});
