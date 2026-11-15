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
        const light = 60 + r() * 9;
        x.fillStyle = `hsl(${hue}, ${20 + r() * 8}%, ${light}%)`;
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

let brandLogo: HTMLImageElement | null = null;
/** Logo oficial vetorizado (public/brand), carregado antes de montar a cena. */
export function setBrandLogo(img: HTMLImageElement | null): void {
  brandLogo = img;
}

/** Letreiro em latão. Usa o logo oficial quando disponível; senão, tipografia. */
export function signTexture(): THREE.CanvasTexture {
  if (brandLogo) {
    const w = 2048;
    const hgt = 980;
    const [c, x] = canvas(w, hgt);
    const ratio = brandLogo.naturalWidth / brandLogo.naturalHeight || 2.07;
    const dh = hgt * 0.92;
    const dw = Math.min(w * 0.96, dh * ratio);
    x.drawImage(brandLogo, (w - dw) / 2, (hgt - dw / ratio) / 2, dw, dw / ratio);
    x.globalCompositeOperation = 'source-in';
    const g = x.createLinearGradient(0, 0, 0, hgt);
    g.addColorStop(0, '#f7e6bb');
    g.addColorStop(0.5, '#d4b273');
    g.addColorStop(1, '#a8854c');
    x.fillStyle = g;
    x.fillRect(0, 0, w, hgt);
    const t = toTexture(c);
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.userData.aspect = w / hgt;
    return t;
  }
  const w = 2048;
  const hgt = 360;
  const [c, x] = canvas(w, hgt);
  x.clearRect(0, 0, w, hgt);
  const grad = x.createLinearGradient(0, 40, 0, 250);
  grad.addColorStop(0, '#f6e3b4');
  grad.addColorStop(0.5, '#d2b072');
  grad.addColorStop(1, '#a8854c');
  x.fillStyle = grad;
  x.textAlign = 'center';
  x.textBaseline = 'alphabetic';
  x.font = `400 190px 'Cormorant Garamond', Georgia, serif`;
  drawTracked(x, 'BELLE ALENCAR', w / 2, 220, 34);
  x.font = `600 46px 'DM Sans Variable', 'DM Sans', sans-serif`;
  x.fillStyle = '#cdb07a';
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

/* ===================== Hero POV 360 · materiais adicionais ===================== */

/** Nogueira escura com veio vertical (painéis da entrada e cabides). */
export function walnut(size = 512, seed = 11, base = '#3b2719'): THREE.CanvasTexture {
  const [c, x] = canvas(size);
  const r = rng(seed);
  x.fillStyle = base;
  x.fillRect(0, 0, size, size);
  for (let i = 0; i < 160; i++) {
    const px = r() * size;
    const w = 1 + r() * 7;
    x.fillStyle = r() > 0.5 ? `rgba(90,58,34,${0.05 + r() * 0.18})` : `rgba(18,10,6,${0.06 + r() * 0.2})`;
    x.beginPath();
    x.moveTo(px, 0);
    for (let y = 0; y <= size; y += 24) x.lineTo(px + Math.sin(y * 0.02 + i) * 6 + (r() - 0.5) * 2, y);
    x.lineTo(px + w, size);
    for (let y = size; y >= 0; y -= 24) x.lineTo(px + w + Math.sin(y * 0.021 + i) * 6, y);
    x.closePath();
    x.fill();
  }
  for (let i = 0; i < 260; i++) {
    x.fillStyle = `rgba(0,0,0,${r() * 0.06})`;
    x.fillRect(r() * size, r() * size, 1, 8 + r() * 30);
  }
  return toTexture(c);
}

/** Linho/veludo champagne com trama fina e variação por prega (cortina). */
export function linen(size = 512, seed = 17, base = '#b49770'): THREE.CanvasTexture {
  const [c, x] = canvas(size);
  const r = rng(seed);
  x.fillStyle = base;
  x.fillRect(0, 0, size, size);
  for (let i = 0; i < size; i += 2) {
    x.fillStyle = `rgba(255,236,200,${0.03 + r() * 0.06})`;
    x.fillRect(i, 0, 1, size);
    x.fillStyle = `rgba(70,45,20,${r() * 0.06})`;
    x.fillRect(0, i, size, 1);
  }
  for (let i = 0; i < 2200; i++) {
    x.fillStyle = r() > 0.5 ? `rgba(255,240,210,${r() * 0.12})` : `rgba(60,38,18,${r() * 0.1})`;
    x.fillRect(r() * size, r() * size, 1 + r() * 2, 1);
  }
  return toTexture(c);
}

/** Bouclé creme: laçadas claras sobre fundo marfim (poltrona do provador). */
export function boucle(size = 512, seed = 23): THREE.CanvasTexture {
  const [c, x] = canvas(size);
  const r = rng(seed);
  x.fillStyle = '#e6dccb';
  x.fillRect(0, 0, size, size);
  for (let i = 0; i < 6000; i++) {
    const s = 1.5 + r() * 3.5;
    x.fillStyle = r() > 0.4 ? `rgba(255,252,244,${0.25 + r() * 0.5})` : `rgba(150,130,105,${0.08 + r() * 0.25})`;
    x.beginPath();
    x.arc(r() * size, r() * size, s, 0, Math.PI * 2);
    x.fill();
  }
  return toTexture(c);
}

/** Travertino com poros e juntas de chapa (paredes grandes). */
export function travertineSlab(size = 1024, seed = 31): THREE.CanvasTexture {
  const [c, x] = canvas(size);
  const r = rng(seed);
  x.fillStyle = '#e2d5c0';
  x.fillRect(0, 0, size, size);
  for (let i = 0; i < 140; i++) {
    const y = r() * size;
    const hgt = 1 + r() * 14;
    const l = 72 + r() * 16;
    x.fillStyle = `hsla(${33 + r() * 9}, ${16 + r() * 14}%, ${l}%, ${0.1 + r() * 0.2})`;
    x.beginPath();
    x.moveTo(0, y);
    for (let px = 0; px <= size; px += 24) x.lineTo(px, y + Math.sin(px * 0.013 + i) * 3 + (r() - 0.5) * 2);
    x.lineTo(size, y + hgt);
    for (let px = size; px >= 0; px -= 24) x.lineTo(px, y + hgt + Math.sin(px * 0.011 + i) * 2.5);
    x.closePath();
    x.fill();
  }
  for (let i = 0; i < 2600; i++) {
    x.fillStyle = `rgba(105,82,55,${0.06 + r() * 0.16})`;
    const w = 1 + r() * 6;
    x.beginPath();
    x.ellipse(r() * size, r() * size, w, 0.6 + r() * 1.6, 0, 0, Math.PI * 2);
    x.fill();
  }
  // juntas de chapa (2 × 2 por tile)
  x.strokeStyle = 'rgba(95,78,58,0.28)';
  x.lineWidth = 2;
  for (const f of [0, 0.5]) {
    x.beginPath(); x.moveTo(f * size, 0); x.lineTo(f * size, size); x.stroke();
    x.beginPath(); x.moveTo(0, f * size); x.lineTo(size, f * size); x.stroke();
  }
  return toTexture(c);
}

/** Carvalho/nogueira em espinha de peixe, mais escuro e quente (piso da boutique). */
export function herringboneDark(size = 1024, seed = 29): THREE.CanvasTexture {
  const [c, x] = canvas(size);
  const r = rng(seed);
  x.fillStyle = '#5a3a24';
  x.fillRect(0, 0, size, size);
  const pw = size / 16;
  const pl = pw * 4;
  for (let row = -4; row < 24; row++) {
    for (let col = -4; col < 12; col++) {
      const ox = col * pl * 0.5 * 2 * 0.70710678 * 2;
      const oy = row * pw * 1.41421356 * 2;
      for (let k = 0; k < 2; k++) {
        x.save();
        x.translate(ox + k * pw * 0.70710678 * 2, oy + k * pw * 0.70710678 * 2);
        x.rotate(k === 0 ? Math.PI / 4 : -Math.PI / 4);
        const hue = 27 + r() * 6;
        const light = 22 + r() * 9;
        x.fillStyle = `hsl(${hue}, ${9 + r() * 6}%, ${light}%)`;
        x.fillRect(0, 0, pl, pw);
        for (let g = 0; g < 8; g++) {
          x.strokeStyle = `rgba(30,16,8,${0.08 + r() * 0.12})`;
          x.lineWidth = 0.5 + r() * 1.2;
          x.beginPath();
          const gy = r() * pw;
          x.moveTo(0, gy);
          x.bezierCurveTo(pl * 0.3, gy + (r() - 0.5) * 5, pl * 0.7, gy + (r() - 0.5) * 5, pl, gy);
          x.stroke();
        }
        x.strokeStyle = 'rgba(20,10,5,0.55)';
        x.lineWidth = 1.3;
        x.strokeRect(0, 0, pl, pw);
        x.restore();
      }
    }
  }
  return toTexture(c);
}

/** Oclusão ambiente de canto: faixa escura na aresta que desvanece (cantos parede/piso/teto). */
export function cornerShade(): THREE.CanvasTexture {
  const [c, x] = canvas(8, 256);
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, 'rgba(34,22,12,0.62)');
  g.addColorStop(0.18, 'rgba(34,22,12,0.3)');
  g.addColorStop(0.55, 'rgba(34,22,12,0.08)');
  g.addColorStop(1, 'rgba(34,22,12,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 8, 256);
  const t = toTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}
