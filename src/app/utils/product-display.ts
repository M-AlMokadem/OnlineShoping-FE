import { ProductDto } from '../models/product.model';

const NEW_PRODUCT_DAYS = 30;

export function discountPercent(product: Pick<ProductDto, 'price' | 'originalPrice'>): number {
  if (!product.price || !product.originalPrice || product.originalPrice <= product.price) {
    return 0;
  }
  return Math.round((1 - product.price / product.originalPrice) * 100);
}

export function isNewProduct(product: Pick<ProductDto, 'createdOn'>): boolean {
  const created = Date.parse(product.createdOn);
  return !Number.isNaN(created) && Date.now() - created < NEW_PRODUCT_DAYS * 86_400_000;
}
