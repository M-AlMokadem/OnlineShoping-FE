export type ProductStatus = 'Draft' | 'Published' | 'Inactive' | 'Archived';
export type ProductAvailability = 'InStock' | 'OutOfStock';
export type ProductSortBy = 'name' | 'price' | 'stock' | 'updated';
export type SortDirection = 'asc' | 'desc';

export const PRODUCT_AVAILABILITIES: ProductAvailability[] = ['InStock', 'OutOfStock'];
export const PRODUCT_STATUSES: ProductStatus[] = ['Draft', 'Published', 'Inactive', 'Archived'];
export const PRODUCT_PAGE_SIZES = [20, 50, 100];

export interface ProductDto {
  id: string;
  name: string;
  nameAr: string;
  sku: string | null;
  shortDescription: string;
  shortDescriptionAr: string;
  description: string;
  descriptionAr: string;
  categoryId: string | null;
  categoryName: string;
  categoryNameAr: string;
  brandId: string | null;
  brandName: string;
  price: number | null;
  originalPrice: number | null;
  currency: string;
  stockQuantity: number;
  availability: ProductAvailability;
  imageUrl: string | null;
  specifications: Record<string, string>;
  status: ProductStatus;
  createdOn: string;
  lastUpdatedOn: string;
  lastUpdatedBy: string;
}

export interface ProductRequest {
  name: string;
  nameAr: string;
  sku: string | null;
  shortDescription: string;
  shortDescriptionAr: string;
  description: string;
  descriptionAr: string;
  categoryId: string | null;
  brandId: string | null;
  price: number | null;
  originalPrice: number | null;
  stockQuantity: number;
  imageUrl: string | null;
  specifications: Record<string, string>;
}

export interface ProductListQuery {
  search: string;
  categoryId: string;
  brandId: string;
  availability: ProductAvailability | '';
  status: ProductStatus | '';
  sortBy: ProductSortBy;
  sortDirection: SortDirection;
  pageSize: number;
  pageNumber: number;
}

export const DEFAULT_PRODUCT_QUERY: ProductListQuery = {
  search: '',
  categoryId: '',
  brandId: '',
  availability: '',
  status: '',
  sortBy: 'updated',
  sortDirection: 'desc',
  pageSize: 20,
  pageNumber: 1
};

export type ReadinessField = 'name' | 'sku' | 'category' | 'price' | 'description' | 'image';

export interface ProductReadiness {
  isReady: boolean;
  missingFields: ReadinessField[];
}

export interface ProductAuditEntry {
  id: string;
  action: 'Created' | 'Updated' | 'StatusChanged';
  field: string;
  oldValue: string | null;
  newValue: string | null;
  userId: string;
  userName: string;
  createdOnUtc: string;
}

export interface CatalogueFilters {
  searchedValue?: string;
  brandId?: string;
  categoryId?: string;
  availability?: ProductAvailability | '';
  minPrice?: number | null;
  maxPrice?: number | null;
  sortBy?: ProductSortBy;
  sortDirection?: SortDirection;
}
