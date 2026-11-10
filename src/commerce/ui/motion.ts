/** GSAP + Flip carregados sob demanda (primeiro quick view). */
type GsapMod = typeof import('gsap');
type FlipMod = typeof import('gsap/Flip');

let loading: Promise<{ gsap: GsapMod['gsap']; Flip: FlipMod['Flip'] } | null> | null = null;

export function loadGsap() {
  if (!loading) {
    loading = Promise.all([import('gsap'), import('gsap/Flip')])
      .then(([g, f]) => {
        g.gsap.registerPlugin(f.Flip);
        return { gsap: g.gsap, Flip: f.Flip };
      })
      .catch(() => null);
  }
  return loading;
}
