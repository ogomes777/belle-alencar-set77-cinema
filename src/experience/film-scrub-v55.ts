/** Film V55: continuous, frame-rate independent tracking of native scroll.
 * Large scroll deltas are FOLLOWED, never teleported through missing shots.
 * Explicit navigation/restoration can still use the exact state immediately.
 */
export function advanceFilmScrub(shown: number, target: number, dt: number, immediate = false): number {
  const from=Math.max(0,Math.min(1,Number.isFinite(shown)?shown:0));
  const to=Math.max(0,Math.min(1,Number.isFinite(target)?target:from));
  if (immediate) return to;
  const gap=to-from;
  if (Math.abs(gap)<.00007) return to;
  const seconds=Math.max(1/240,Math.min(.055,Number.isFinite(dt)?dt:1/60));
  const response=8.5+Math.min(1,Math.abs(gap)/.18)*6.5;
  const eased=Math.abs(gap)*(1-Math.exp(-response*seconds));
  // A single dropped render frame must never skip several authored camera shots.
  const step=Math.min(.021,Math.max(.003,seconds*1.1));
  return Math.max(0,Math.min(1,from+Math.sign(gap)*Math.min(Math.abs(gap),eased,step)));
}
