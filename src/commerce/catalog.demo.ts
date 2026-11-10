/**
 * CATÁLOGO DEMONSTRATIVO — NÃO É ACERVO BELLE.
 * Referências genéricas para desenhar a jornada enquanto o catálogo oficial
 * (SKU, preço, grade, fotos) não é fornecido. Sem preço, sem estoque, sem nomes de coleção.
 */
import type { Category, Occasion, Product, Size, Variant, CatalogSource } from './types';
import type { Silhouette, Tone } from '../core/dress';
import type { IllustrationKind, Neckline } from '../core/illustration';

const APPAREL: Size[] = ['PP', 'P', 'M', 'G', 'GG'];
const ONE: Size[] = ['Único'];

interface Seed {
  n: number;
  slug: string;
  title: string;
  description: string;
  category: Category;
  occasion: Occasion;
  kind: IllustrationKind;
  tone: Tone;
  silhouette?: Silhouette;
  neckline?: Neckline;
}

const seeds: Seed[] = [
  { n: 101, slug: 'vestido-longo-fluido', title: 'Vestido longo fluido', description: 'Saia ampla que acompanha o passo, alças finas e decote suave. Desenho de referência para a linha fluida.', category: 'vestidos', occasion: 'celebrar', kind: 'dress', tone: 'perola', silhouette: 'fluido', neckline: 'alca' },
  { n: 102, slug: 'vestido-midi-ajustado', title: 'Vestido midi ajustado', description: 'Corpo ajustado até o joelho, alças finas e barra que abre no movimento. Estudo para a linha marcante.', category: 'vestidos', occasion: 'noite', kind: 'dress', tone: 'noite', silhouette: 'marcante', neckline: 'alca' },
  { n: 103, slug: 'vestido-evase-joelho', title: 'Vestido evasê na altura do joelho', description: 'Cintura marcada, alças finas e saia evasê. Estudo para a linha clássica.', category: 'vestidos', occasion: 'dia', kind: 'dress', tone: 'champagne', silhouette: 'classico', neckline: 'alca' },
  { n: 104, slug: 'vestido-longo-terracota', title: 'Vestido longo terracota', description: 'Saia longa e leve com alças finas. Estudo para dias quentes.', category: 'vestidos', occasion: 'dia', kind: 'dress', tone: 'terracota', silhouette: 'fluido', neckline: 'alca' },
  { n: 105, slug: 'vestido-midi-alcas', title: 'Vestido midi de alças', description: 'Silhueta ajustada com alças finas. Desenho de referência para a linha marcante.', category: 'vestidos', occasion: 'celebrar', kind: 'dress', tone: 'salvia', silhouette: 'marcante', neckline: 'alca' },
  { n: 106, slug: 'vestido-evase-vinho', title: 'Vestido evasê vinho', description: 'Evasê na altura do joelho, alças finas e cor profunda. Estudo para a linha clássica.', category: 'vestidos', occasion: 'noite', kind: 'dress', tone: 'vinho', silhouette: 'classico', neckline: 'alca' },
  { n: 107, slug: 'vestido-midi-rosa', title: 'Vestido midi rosa antigo', description: 'Ajustado no corpo com barra que abre. Estudo para a linha marcante.', category: 'vestidos', occasion: 'celebrar', kind: 'dress', tone: 'rosa', silhouette: 'marcante', neckline: 'alca' },
  { n: 108, slug: 'vestido-longo-azul-gelo', title: 'Vestido longo azul gelo', description: 'Saia ampla e leve em tom frio. Estudo para a linha fluida.', category: 'vestidos', occasion: 'celebrar', kind: 'dress', tone: 'gelo', silhouette: 'fluido', neckline: 'alca' },
  { n: 109, slug: 'vestido-evase-perola', title: 'Vestido evasê pérola', description: 'Evasê clássico em tom claro. Estudo para a linha clássica.', category: 'vestidos', occasion: 'dia', kind: 'dress', tone: 'perola', silhouette: 'classico', neckline: 'alca' },
  { n: 110, slug: 'vestido-midi-dourado', title: 'Vestido midi dourado', description: 'Ajustado e luminoso para a noite. Estudo para a linha marcante.', category: 'vestidos', occasion: 'noite', kind: 'dress', tone: 'dourado', silhouette: 'marcante', neckline: 'alca' },
  { n: 111, slug: 'vestido-longo-noite', title: 'Vestido longo noite', description: 'Longo fluido em tom escuro. Estudo para a linha fluida.', category: 'vestidos', occasion: 'noite', kind: 'dress', tone: 'noite', silhouette: 'fluido', neckline: 'alca' },
  { n: 201, slug: 'conjunto-pantalona', title: 'Conjunto blusa e pantalona', description: 'Blusa de manga curta e calça de perna ampla. Desenho de referência.', category: 'conjuntos', occasion: 'dia', kind: 'set', tone: 'perola', silhouette: 'fluido' },
  { n: 202, slug: 'conjunto-saia-midi', title: 'Conjunto blusa e saia midi', description: 'Blusa estruturada e saia reta midi. Desenho de referência.', category: 'conjuntos', occasion: 'noite', kind: 'set', tone: 'champagne', silhouette: 'marcante' },
  { n: 203, slug: 'conjunto-calca-ampla', title: 'Conjunto calça ampla', description: 'Blusa e calça de cintura alta em tom suave. Desenho de referência.', category: 'conjuntos', occasion: 'dia', kind: 'set', tone: 'salvia', silhouette: 'classico' },
  { n: 301, slug: 'bolsa-estruturada', title: 'Bolsa estruturada', description: 'Bolsa de mão com alça e fecho metálico. Desenho de referência.', category: 'acessorios', occasion: 'noite', kind: 'bag', tone: 'champagne' },
  { n: 302, slug: 'brincos-gota', title: 'Brincos gota', description: 'Par de brincos em gota com acabamento dourado. Desenho de referência.', category: 'acessorios', occasion: 'celebrar', kind: 'earring', tone: 'perola' },
  { n: 303, slug: 'cinto-fivela', title: 'Cinto com fivela', description: 'Cinto médio com fivela dourada. Desenho de referência.', category: 'acessorios', occasion: 'dia', kind: 'belt', tone: 'noite' },
];

function variantsFor(id: string, sku: string, sizes: Size[]): Variant[] {
  return sizes.map((size) => ({ id: `${sku}-${size === 'Único' ? 'U' : size}`, productId: id, size, sku: `${sku}-${size === 'Único' ? 'U' : size}` }));
}

export const DEMO_CATALOG: Product[] = seeds.map((s) => {
  const sku = `DEMO-${s.n}`;
  const id = sku.toLowerCase();
  return {
    id,
    slug: s.slug,
    sku,
    title: s.title,
    description: s.description,
    category: s.category,
    occasion: s.occasion,
    silhouette: s.silhouette,
    tone: s.tone,
    illustration: { kind: s.kind, tone: s.tone, silhouette: s.silhouette, neckline: s.neckline, seed: s.n },
    cutout: s.kind === 'dress' && s.silhouette ? `/rack/${s.silhouette}-${s.tone}.webp` : undefined,
    variants: variantsFor(id, sku, s.category === 'acessorios' ? ONE : APPAREL),
    price: { priceCents: null, currency: 'BRL' },
    isDemo: true,
    mediaRights: { source: s.kind === 'dress' ? 'Render do estudo 3D procedural SET77 Labs' : 'Ilustração vetorial procedural SET77 Labs', status: 'demo', note: 'Não representa peça real nem estoque.' },
    active: true,
  };
});

export const demoCatalogSource: CatalogSource = {
  async list() {
    return DEMO_CATALOG;
  },
  async bySlug(slug) {
    return DEMO_CATALOG.find((p) => p.slug === slug);
  },
};

export const productById = (id: string) => DEMO_CATALOG.find((p) => p.id === id);
export const productBySlug = (slug: string) => DEMO_CATALOG.find((p) => p.slug === slug);
