import rawProducts from '../../server/data/products.json';
import { DesignStyle, Product } from '../types';

const BASE_CATALOG_PRODUCTS = rawProducts as Product[];

const FINISH_VARIANTS = [
  { suffix: 'Matte White', priceMultiplier: 0.94, color: '#f8fafc', tags: ['matte', 'soft_white'] },
  { suffix: 'Polished Chrome', priceMultiplier: 0.98, color: '#cbd5e1', tags: ['chrome', 'bright'] },
  { suffix: 'Brushed Nickel', priceMultiplier: 1.04, color: '#94a3b8', tags: ['brushed_nickel', 'neutral'] },
  { suffix: 'Matte Black', priceMultiplier: 1.08, color: '#18181b', tags: ['matte_black', 'modern'] },
  { suffix: 'Warm Brass', priceMultiplier: 1.15, color: '#d4af37', tags: ['brass', 'warm'] },
  { suffix: 'Graphite Grey', priceMultiplier: 1.02, color: '#334155', tags: ['graphite', 'contemporary'] },
  { suffix: 'Natural Oak', priceMultiplier: 1.11, color: '#b45309', tags: ['wood', 'natural'] }
];

const STYLE_VARIANTS: { label: string; style: DesignStyle; priceMultiplier: number; tags: string[] }[] = [
  { label: 'Urban', style: 'minimalist_modern', priceMultiplier: 1.0, tags: ['urban', 'minimal'] },
  { label: 'Zen', style: 'japanese_zen', priceMultiplier: 1.06, tags: ['zen', 'spa'] },
  { label: 'Heritage', style: 'classic_luxury', priceMultiplier: 1.12, tags: ['heritage', 'classic'] },
  { label: 'Smart', style: 'contemporary', priceMultiplier: 1.09, tags: ['smart_ready', 'contemporary'] },
  { label: 'Signature', style: 'premium', priceMultiplier: 1.22, tags: ['signature', 'premium'] }
];

function uniqueList<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function expandProductCatalog(baseProducts: Product[]): Product[] {
  const generatedProducts: Product[] = [];

  baseProducts.forEach((product, productIndex) => {
    STYLE_VARIANTS.forEach((styleVariant, styleIndex) => {
      FINISH_VARIANTS.forEach((finishVariant, finishIndex) => {
        if (generatedProducts.length >= 220) return;

        const styleCompatible = product.styles.includes(styleVariant.style) ||
          product.styles.length < 3 ||
          styleIndex % 2 === productIndex % 2;
        if (!styleCompatible) return;

        const multiplier = styleVariant.priceMultiplier * finishVariant.priceMultiplier;
        const scaledWidth = product.width * (finishIndex % 3 === 0 ? 0.94 : finishIndex % 3 === 1 ? 1 : 1.06);
        const scaledDepth = product.depth * (styleIndex % 2 === 0 ? 1 : 0.96);

        generatedProducts.push({
          ...product,
          id: `${product.id}-${styleVariant.label.toLowerCase()}-${finishIndex + 1}`,
          name: `${styleVariant.label} ${product.name} - ${finishVariant.suffix}`,
          price: Math.max(2500, Math.round((product.price * multiplier) / 500) * 500),
          width: Number(scaledWidth.toFixed(2)),
          depth: Number(scaledDepth.toFixed(2)),
          height: Number(product.height.toFixed(2)),
          styles: uniqueList([...product.styles, styleVariant.style]),
          tags: uniqueList([...product.tags, ...styleVariant.tags, ...finishVariant.tags]),
          rating: Number(Math.min(5, product.rating + (styleIndex % 3) * 0.03).toFixed(1)),
          reviewsCount: product.reviewsCount + 8 + styleIndex * 7 + finishIndex * 3,
          finish: `${finishVariant.suffix} / ${product.finish}`,
          description: `${product.description} Variant tuned for ${styleVariant.style.replace('_', ' ')} bathrooms with ${finishVariant.suffix.toLowerCase()} detailing.`,
          color: finishVariant.color
        });
      });
    });
  });

  const byId = new Map<string, Product>();
  [...baseProducts, ...generatedProducts].forEach((product) => byId.set(product.id, product));
  return Array.from(byId.values());
}

export const CATALOG_PRODUCTS: Product[] = expandProductCatalog(BASE_CATALOG_PRODUCTS);
