/**
 * Texturas procedurais em canvas. Nenhuma mídia de terceiros:
 * pedra, madeira, gesso, trama e letreiro são gerados aqui.
 */
import * as THREE from 'three';

type Ctx = CanvasRenderingContext2D;

function canvas(w: number, h = w): [HTMLCanvasElement, Ctx] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  return [c, ctx];
}

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

function toTexture(c: HTMLCanvasElement, repeat: [number, number] = [1, 1], color = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

/** Travertino claro: veios horizontais, poros, variação de tom. */
export function travertine(size = 1024, seed = 3): THREE.CanvasTexture {
  const [c, x] = canvas(size);
  const r = rng(seed);
  x.fillStyle = '#e4d9c6';
  x.fillRect(0, 0, size, size);
  for (let i = 0; i < 90; i++) {
    const y = r() * size;
    const hgt = 2 + r() * 22;
    const l = 70 + r() * 18;
    x.fillStyle = `hsla(${34 + r() * 8}, ${18 + r() * 14}%, ${l}%, ${0.08 + r() * 0.18})`;
    x.beginPath();
    x.moveTo(0, y);
    for (let px = 0; px <= size; px += 32) x.lineTo(px, y + Math.sin(px * 0.01 + i) * 4 + (r() - 0.5) * 3);
    x.lineTo(size, y + hgt);
    for (let px = size; px >= 0; px -= 32) x.lineTo(px, y + hgt + Math.sin(px * 0.012 + i) * 3);
    x.closePath();
    x.fill();
  }
  for (let i = 0; i < 1400; i++) {
    x.fillStyle = `rgba(120,96,64,${0.05 + r() * 0.12})`;
    const w = 1 + r() * 5;
    x.fillRect(r() * size, r() * size, w, 1 + r() * 1.5);
  }
  return toTexture(c);
}

/** Piso polido da galeria: placas de 1,2 m com rejunte fino e veios suaves. */
export function polishedStone(size = 1024, seed = 9): THREE.CanvasTexture {
  const [c, x] = canvas(size);
  const r = rng(seed);
  const tiles = 2;
  const ts = size / tiles;
  for (let ty = 0; ty < tiles; ty++) {
    for (let tx = 0; tx < tiles; tx++) {
      const l = 88 + r() * 4;
      x.fillStyle = `hsl(38, 22%, ${l}%)`;
      x.fillRect(tx * ts, ty * ts, ts, ts);
      for (let v = 0; v < 7; v++) {
        x.strokeStyle = `rgba(150,128,98,${0.06 + r() * 0.1})`;
        x.lineWidth = 0.6 + r() * 2.2;
        x.beginPath();
        let px = tx * ts + r() * ts;
        let py = ty * ts;
        x.moveTo(px, py);
        while (py < (ty + 1) * ts) {
          py += 12 + r() * 30;
          px += (r() - 0.5) * 40;
          x.lineTo(px, py);
        }
        x.stroke();
      }
    }
  }
  x.strokeStyle = 'rgba(120,100,76,0.35)';
  x.lineWidth = 2;
  for (let i = 0; i <= tiles; i++) {
    x.beginPath();
    x.moveTo(i * ts, 0);
    x.lineTo(i * ts, size);
    x.moveTo(0, i * ts);
    x.lineTo(size, i * ts);
    x.stroke();
  }
  return toTexture(c);
}

/** Carvalho claro em espinha de peixe. */
export function herringbone(size = 1024, seed = 21): THREE.CanvasTexture {
  const [c, x] = canvas(size);
  const r = rng(seed);
  x.fillStyle = '#b89470';
  x.fillRect(0, 0, size, size);
  const pw = size / 16; // largura da tábua
  const pl = pw * 4; // comprimento
  x.save();
  for (let row = -4; row < 24; row++) {
    for (let col = -4; col < 12; col++) {
      const ox = col * pl * 0.5 * 2 * 0.70710678 * 2;
      const oy = row * pw * 1.41421356 * 2;
      for (let k = 0; k < 2; k++) {
        x.save();
        x.translate(ox + k * pw * 0.70710678 * 2, oy + k * pw * 0.70710678 * 2);
        x.rotate(k === 0 ? Math.PI / 4 : -Math.PI / 4);
        const hue = 28 + r() * 8;
        const light = 52 + r() * 14;
        x.fillStyle = `hsl(${hue}, ${32 + r() * 10}%, ${light}%)`;
        x.fillRect(0, 0, pl, pw);
        for (let g = 0; g < 7; g++) {
          x.strokeStyle = `rgba(90,58,30,${0.05 + r() * 0.08})`;
          x.lineWidth = 0.5 + r();
          x.beginPath();
          const gy = r() * pw;
          x.moveTo(0, gy);
          x.bezierCurveTo(pl * 0.3, gy + (r() - 0.5) * 6, pl * 0.7, gy + (r() - 0.5) * 6, pl, gy);
          x.stroke();
        }
        x.strokeStyle = 'rgba(60,40,22,0.45)';
        x.lineWidth = 1.2;
        x.strokeRect(0, 0, pl, pw);
        x.restore();
      }
    }
  }
  x.restore();
  return toTexture(c);
}

/** Gesso marfim com textura sutil. */
export function plaster(size = 512, seed = 5, base = '#efe7da'): THREE.CanvasTexture {
  const [c, x] = canvas(size);
  const r = rng(seed);
  x.fillStyle = base;
  x.fillRect(0, 0, size, size);
  for (let i = 0; i < 2600; i++) {
    x.fillStyle = r() > 0.5 ? `rgba(255,255,255,${r() * 0.07})` : `rgba(110,90,60,${r() * 0.05})`;
    const s = 2 + r() * 10;
    x.beginPath();
    x.arc(r() * size, r() * size, s, 0, Math.PI * 2);
    x.fill();
  }
  return toTexture(c);
}

/** Normal map de sarja (trama diagonal) para o tecido: revela fio no macro. */
export function weaveNormal(size = 512): THREE.CanvasTexture {
  const [c, x] = canvas(size);
  const img = x.createImageData(size, size);
  const threads = 64;
  const height = (u: number, v: number) => {
    const fu = (u * threads) % 1;
    const fv = (v * threads) % 1;
    const iu = Math.floor(u * threads);
    const iv = Math.floor(v * threads);
    const over = (iu + iv) % 4 < 2; // sarja 2/2
    const warp = Math.sin(fu * Math.PI);
    const weft = Math.sin(fv * Math.PI);
    return over ? warp * 0.9 + weft * 0.25 : weft * 0.9 + warp * 0.25;
  };
  const e = 1 / size;
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const u = i / size;
      const v = j / size;
      const dx = height(u + e, v) - height(u - e, v);
      const dy = height(u, v + e) - height(u, v - e);
      let nx = -dx * 2.2;
      let ny = -dy * 2.2;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      const k = (j * size + i) * 4;
      img.data[k] = (nx * 0.5 + 0.5) * 255;
      img.data[k + 1] = (ny * 0.5 + 0.5) * 255;
      img.data[k + 2] = (nz / len) * 0.5 * 255 + 127;
      img.data[k + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  return toTexture(c, [1, 1], false);
}

/** Letreiro em latão: BELLE ALENCAR / MODA & ACESSÓRIOS. */
export function signTexture(): THREE.CanvasTexture {
  const w = 2048;
  const hgt = 360;
  const [c, x] = canvas(w, hgt);
  x.clearRect(0, 0, w, hgt);
  const grad = x.createLinearGradient(0, 40, 0, 250);
  grad.addColorStop(0, '#f0d9a6');
  grad.addColorStop(0.45, '#b8955a');
  grad.addColorStop(1, '#8c6c3c');
  x.fillStyle = grad;
  x.textAlign = 'center';
  x.textBaseline = 'alphabetic';
  x.font = `400 190px 'Cormorant Garamond', Georgia, serif`;
  drawTracked(x, 'BELLE ALENCAR', w / 2, 220, 34);
  x.font = `600 46px 'DM Sans Variable', 'DM Sans', sans-serif`;
  x.fillStyle = '#9a7b4a';
  drawTracked(x, 'MODA & ACESSÓRIOS', w / 2, 316, 22);
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Texto genérico em latão (rótulos dos arcos). */
export function labelTexture(text: string, opts: { color?: string; size?: number; tracking?: number } = {}): THREE.CanvasTexture {
  const w = 1024;
  const hgt = 160;
  const [c, x] = canvas(w, hgt);
  x.fillStyle = opts.color ?? '#9a7b4a';
  x.textAlign = 'center';
  x.font = `600 ${opts.size ?? 64}px 'DM Sans Variable', 'DM Sans', sans-serif`;
  drawTracked(x, text, w / 2, 104, opts.tracking ?? 26);
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Monograma gravado no vidro (provisório: ver docs/ASSETS_MISSING.md #1). */
export function monogramTexture(color = 'rgba(255,248,232,0.85)'): THREE.CanvasTexture {
  const s = 512;
  const [c, x] = canvas(s);
  x.fillStyle = color;
  x.textAlign = 'center';
  x.font = `400 260px 'Cormorant Garamond', Georgia, serif`;
  x.fillText('B', s / 2 - 52, s / 2 + 70);
  x.font = `italic 400 260px 'Cormorant Garamond', Georgia, serif`;
  x.fillText('A', s / 2 + 58, s / 2 + 110);
  x.strokeStyle = color;
  x.lineWidth = 3;
  x.beginPath();
  x.arc(s / 2, s / 2 + 10, 210, 0, Math.PI * 2);
  x.stroke();
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Sombra de contato (gradiente radial) para assentar objetos no piso. */
export function contactShadow(): THREE.CanvasTexture {
  const s = 256;
  const [c, x] = canvas(s);
  const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(40,28,16,0.55)');
  g.addColorStop(0.45, 'rgba(40,28,16,0.22)');
  g.addColorStop(1, 'rgba(40,28,16,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, s, s);
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Gradiente vertical quente para fundos de nicho (luz rebatida). */
export function glowPanel(top = '#fff3dc', bottom = '#e7d2ae'): THREE.CanvasTexture {
  const [c, x] = canvas(64, 256);
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 256);
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

function drawTracked(x: Ctx, text: string, cx: number, y: number, tracking: number) {
  const chars = [...text];
  const widths = chars.map((ch) => x.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1);
  let px = cx - total / 2;
  const align = x.textAlign;
  x.textAlign = 'left';
  chars.forEach((ch, i) => {
    x.fillText(ch, px, y);
    px += widths[i]! + tracking;
  });
  x.textAlign = align;
}
