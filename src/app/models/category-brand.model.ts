export interface CategoryDto {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  iconUrl: string | null;
  displayOrder: number;
  parentId: string | null;
  isActive: boolean;
  isArchived: boolean;
  productCount: number;
}

export interface CategoryRequest {
  name: string;
  nameAr: string;
  description: string;
  iconUrl: string | null;
  displayOrder: number;
  parentId: string | null;
  isActive: boolean;
}

export interface BrandDto {
  id: string;
  name: string;
  description: string;
  logoUrl: string | null;
  isActive: boolean;
  productCount: number;
}

export interface BrandRequest {
  name: string;
  description: string;
  logoUrl: string | null;
  isActive: boolean;
}
