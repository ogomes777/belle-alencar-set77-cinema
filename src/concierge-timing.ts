/** V78 · A short hold and controlled fade let visitors inspect the dress without a sticky overlay. */
export const REVEAL_HOLD_MS = 430;
export const REVEAL_FADE_MS = 1050;
export const REVEAL_DURATION_MS = REVEAL_HOLD_MS + REVEAL_FADE_MS;

/** Remaining opacity of a dress brush stamp as it ages, clamped to [0, 1]. */
export function revealBrushOpacity(ageMs:number):number{
  if(!Number.isFinite(ageMs))return 0;
  if(ageMs<=REVEAL_HOLD_MS)return 1;
  return Math.max(0,Math.min(1,(REVEAL_DURATION_MS-ageMs)/REVEAL_FADE_MS));
}
