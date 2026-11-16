import { describe, expect, it } from 'vitest';
import { insideStore, Navigator } from '../../src/experience/nav';
import { buildObstacles, DESTINATIONS, RAIL, ROOM, FITTING, WAYPOINTS, CURTAIN_ARCH, DOOR } from '../../src/experience/scene/layout';

const nav = new Navigator();

describe('Hero POV · navegação com colisão', () => {
  it('todos os destinos e pontos de passagem são posições livres', () => {
    for (const [id, d] of Object.entries(DESTINATIONS)) expect(nav.blocked({ x: d.x, z: d.z }), id).toBe(false);
    for (const w of WAYPOINTS) expect(nav.blocked({ x: w.x, z: w.z }), w.id).toBe(false);
  });
  it('cada ligação do grafo é um segmento livre', () => {
    const byId = new Map(WAYPOINTS.map((w) => [w.id, w]));
    for (const w of WAYPOINTS) for (const link of w.links) {
      const other = byId.get(link)!;
      expect(other, `${w.id}→${link}`).toBeTruthy();
      expect(nav.clear(w, other), `${w.id}→${link}`).toBe(true);
    }
  });
  it('não atravessa o varão da arara nem as paredes', () => {
    const start = { x: 1.2, z: -6.7 };
    const through = nav.move(start, { x: RAIL.x + 0.6, z: -6.7 });
    expect(through.x).toBeLessThan(RAIL.x - 0.46);
    const wall = nav.move({ x: 0, z: -6 }, { x: ROOM.x + 1, z: -6 });
    expect(wall.x).toBeLessThan(ROOM.x);
    const door = nav.move({ x: 0, z: -2 }, { x: 0, z: 1.5 });
    expect(door.z).toBeLessThan(DOOR.z);
    const back = nav.move({ x: -0.6, z: -15 }, { x: -0.6, z: -20 });
    expect(back.z).toBeGreaterThan(ROOM.zBack);
  });
  it('passa pelo arco da cortina até o provador e para no espelho', () => {
    const inside = nav.move({ x: CURTAIN_ARCH.x, z: -16.5 }, { x: CURTAIN_ARCH.x, z: -19.6 });
    expect(inside.z).toBeLessThan(ROOM.zBack);
    const mirror = nav.move(inside, { x: 2.5, z: -23 });
    expect(mirror.z).toBeGreaterThan(FITTING.z1);
  });
  it('varredura em passo grande (baixa taxa de quadros) não permite tunelamento', () => {
    const far = nav.move({ x: 0, z: -4 }, { x: 0, z: -40 });
    expect(far.z).toBeGreaterThan(FITTING.z1);
    expect(far.z).toBeGreaterThan(ROOM.zBack - 0.01);
  });
  it('rota da arara direita até a esquerda contorna o salão sem colisão', () => {
    const path = nav.route({ x: 1.35, z: -6.7 }, 'araraEsquerda');
    let cursor = { x: 1.35, z: -6.7 };
    for (const p of path) { expect(nav.clear(cursor, p)).toBe(true); cursor = p; }
    expect(cursor).toEqual({ x: DESTINATIONS.araraEsquerda.x, z: DESTINATIONS.araraEsquerda.z });
  });
  it('rota da entrada ao provador passa pelo fundo e chega ao destino', () => {
    const path = nav.route({ x: 0, z: -2.4 }, 'provador');
    expect(path.length).toBeGreaterThanOrEqual(1);
    let cursor = { x: 0, z: -2.4 };
    for (const p of path) { expect(nav.clear(cursor, p)).toBe(true); cursor = p; }
    expect(cursor.z).toBeCloseTo(DESTINATIONS.provador.z, 5);
  });
  it('rota de dentro do provador até a entrada sai pelo arco', () => {
    const path = nav.route({ x: 2.5, z: -19.6 }, 'entrada');
    let cursor = { x: 2.5, z: -19.6 };
    for (const p of path) { expect(nav.clear(cursor, p)).toBe(true); cursor = p; }
    expect(cursor.z).toBeCloseTo(DESTINATIONS.entrada.z, 5);
  });
  it('um ponto dentro de um obstáculo é devolvido a uma posição livre', () => {
    const free = nav.nearestFree({ x: RAIL.x, z: -6.5 });
    expect(nav.blocked(free)).toBe(false);
    const obstacles = buildObstacles();
    expect(obstacles.length).toBeGreaterThan(10);
  });
  it('câmera ainda fora da loja (shopping/vestíbulo) começa a visita na entrada, por dentro', () => {
    for (const p of [{ x: 0, z: 9.2 }, { x: 0.4, z: -0.5 }, { x: 9.3, z: -0.5 }, { x: -6, z: 3 }]) {
      const s = nav.nearestFree(p);
      expect(insideStore(s), JSON.stringify(p)).toBe(true);
      expect(s).toEqual({ x: DESTINATIONS.entrada.x, z: DESTINATIONS.entrada.z });
    }
    expect(insideStore(nav.nearestFree({ x: 1.0, z: -6 }))).toBe(true);
  });
});
