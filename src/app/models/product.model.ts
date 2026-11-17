export type ProductCategory = 'MobilePhone' | 'Accessory';
export type ProductAvailability = 'Unknown' | 'InStock' | 'OutOfStock';
export type ProductVerificationStatus = 'Pending' | 'Verified' | 'Rejected';

export const PRODUCT_CATEGORIES: ProductCategory[] = ['MobilePhone', 'Accessory'];
export const PRODUCT_AVAILABILITIES: ProductAvailability[] = ['InStock', 'OutOfStock', 'Unknown'];
export const VERIFICATION_STATUSES: ProductVerificationStatus[] = ['Pending', 'Verified', 'Rejected'];

export interface ProductDto {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  brand: string;
  category: ProductCategory;
  price: number;
  currency: string;
  availability: ProductAvailability;
  imageUrl: string | null;
  specifications: Record<string, string>;
  sourceName: string;
  sourceUrl: string | null;
  verificationStatus: ProductVerificationStatus;
  verifiedOn: string | null;
  isActive: boolean;
}

export interface ProductRequest {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  brand: string;
  category: ProductCategory;
  price: number;
  availability: ProductAvailability;
  imageUrl: string | null;
  specifications: Record<string, string>;
  sourceName: string;
  sourceUrl: string | null;
  isActive: boolean;
}

export interface ProductVerificationLogEntry {
  fromStatus: ProductVerificationStatus;
  toStatus: ProductVerificationStatus;
  reviewerId: string | null;
  reason: string;
  createdOn: string;
}

export interface CatalogueFilters {
  searchedValue?: string;
  brand?: string;
  category?: ProductCategory | '';
  availability?: ProductAvailability | '';
  minPrice?: number | null;
  maxPrice?: number | null;
}
