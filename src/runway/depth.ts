/** The reference's measured depth stops; one continuous position drives the scene. */
export const wrap = (x: number, n: number): number => ((x % n) + n) % n;
export const KX = [1.2, .744, .496, .346, .235, .15, .085];
const KF = [1.14, .89, .777, .704, .651, .616, .59];
const KH = [1.18, .832, .574, .436, .334, .258, .19];
const KB = [0, 0, 1.5, 4, 8, 12, 17];
const KO = [1, 1, 1, 1, .86, .5, 0];
export function depthAt(index: number, position: number) {
  let d = wrap(index - position, 6);
  if (d > 5) d -= 6;
  const k = Math.max(0, Math.min(6, d + 1));
  const a = Math.floor(k), b = Math.min(6, a + 1), t = k - a;
  const mix = (v: number[]) => v[a]! + (v[b]! - v[a]!) * t;
  return { x: mix(KX), feet: mix(KF), height: mix(KH), blur: mix(KB), opacity: mix(KO), z: 100 - Math.round(d * 10) };
}
export function railOffset(index: number, position: number, card: number) {
  const length = 12 * card;
  let y = wrap(index * card - position * 2 * card, length);
  if (y > length - card) y -= length;
  return y;
}
