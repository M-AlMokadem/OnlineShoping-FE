import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResult } from '../models/api-result.model';
import { HttpResponseModel } from '../models/http-response.model';
import { normalizeApiResponse } from '../models/normalize-api-response';
import { BrandDto, CategoryDto } from '../models/category-brand.model';
import { PagedResult } from '../models/paged-result.model';
import { CatalogueFilters, ProductDto } from '../models/product.model';
import { PublicService } from './public.service';

@Injectable({ providedIn: 'root' })
export class CatalogueApiService {
  private readonly publicService = inject(PublicService);
  private readonly controller = 'catalogue';

  browse(filters: CatalogueFilters, pageNumber: number, pageSize: number): Observable<ApiResult<PagedResult<ProductDto>>> {
    const params: Record<string, unknown> = { pageNumber, pageSize };
    if (filters.searchedValue?.trim()) { params['searchedValue'] = filters.searchedValue.trim(); }
    if (filters.brandId) { params['brandId'] = filters.brandId; }
    if (filters.categoryId) { params['categoryId'] = filters.categoryId; }
    if (filters.availability) { params['availability'] = filters.availability; }
    if (filters.minPrice != null) { params['minPrice'] = filters.minPrice; }
    if (filters.maxPrice != null) { params['maxPrice'] = filters.maxPrice; }

    return this.publicService.getData<HttpResponseModel<PagedResult<ProductDto>>>(this.controller, params)
      .pipe(map((response) => normalizeApiResponse(response)));
  }

  getById(id: string): Observable<ApiResult<ProductDto>> {
    return this.publicService.getById<ProductDto>(this.controller, id)
      .pipe(map((response) => normalizeApiResponse(response)));
  }

  getCategories(): Observable<ApiResult<CategoryDto[]>> {
    return this.publicService.getAll<CategoryDto>(`${this.controller}/categories`)
      .pipe(map((response) => normalizeApiResponse(response)));
  }

  getBrands(): Observable<ApiResult<BrandDto[]>> {
    return this.publicService.getAll<BrandDto>(`${this.controller}/brands`)
      .pipe(map((response) => normalizeApiResponse(response)));
  }

  compare(ids: string[]): Observable<ApiResult<ProductDto[]>> {
    return this.publicService.getData<HttpResponseModel<ProductDto[]>>(`${this.controller}/compare`, { ids })
      .pipe(map((response) => normalizeApiResponse(response)));
  }
}
