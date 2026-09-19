import { Product, ProductCategory, DesignStyle } from '../../models/Product';
import { CATALOG_PRODUCTS } from '../../data/products';

export interface ProductFilterOptions {
  category?: ProductCategory;
  style?: DesignStyle;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  searchQuery?: string;
  maxWidth?: number;
  brand?: string;
}

export function searchProducts(options: ProductFilterOptions): Product[] {
  return CATALOG_PRODUCTS.filter(product => {
    if (options.category && product.category !== options.category) return false;
    if (options.style && !product.styles.includes(options.style)) return false;
    if (options.minPrice !== undefined && product.price < options.minPrice) return false;
    if (options.maxPrice !== undefined && product.price > options.maxPrice) return false;
    if (options.maxWidth !== undefined && product.width > options.maxWidth) return false;
    if (options.brand && product.brand && !product.brand.toLowerCase().includes(options.brand.toLowerCase())) return false;

    if (options.tags && options.tags.length > 0) {
      const hasTag = options.tags.some(tag => product.tags.includes(tag));
      if (!hasTag) return false;
    }

    if (options.searchQuery) {
      const q = options.searchQuery.toLowerCase();
      const matchesName = product.name.toLowerCase().includes(q);
      const matchesDesc = product.description.toLowerCase().includes(q);
      const matchesFinish = product.finish.toLowerCase().includes(q);
      if (!matchesName && !matchesDesc && !matchesFinish) return false;
    }

    return true;
  });
}

export function getProductById(id: string): Product | undefined {
  return CATALOG_PRODUCTS.find(p => p.id === id);
}

export function getProductsByCategory(category: ProductCategory): Product[] {
  return CATALOG_PRODUCTS.filter(p => p.category === category);
}
