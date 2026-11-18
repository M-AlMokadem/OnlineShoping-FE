import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResult } from '../models/api-result.model';
import { HttpResponseModel } from '../models/http-response.model';
import { PagedResult } from '../models/paged-result.model';
import { normalizeApiResponse } from '../models/normalize-api-response';
import {
  ProductAuditEntry,
  ProductDto,
  ProductListQuery,
  ProductReadiness,
  ProductRequest,
  ProductStatus
} from '../models/product.model';
import { PublicService } from './public.service';

export type { ProductDto, ProductRequest };

@Injectable({ providedIn: 'root' })
export class ProductsApiService {
  private readonly publicService = inject(PublicService);
  private readonly controller = 'products';

  getPaged(query: ProductListQuery): Observable<ApiResult<PagedResult<ProductDto>>> {
    const params: Record<string, unknown> = {
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
      pageSize: query.pageSize,
      pageNumber: query.pageNumber
    };
    if (query.search.trim()) { params['search'] = query.search.trim(); }
    if (query.categoryId) { params['categoryId'] = query.categoryId; }
    if (query.brandId) { params['brandId'] = query.brandId; }
    if (query.availability) { params['availability'] = query.availability; }
    if (query.status) { params['status'] = query.status; }

    return this.publicService.getData<HttpResponseModel<PagedResult<ProductDto>>>(this.controller, params)
      .pipe(map((response) => normalizeApiResponse(response)));
  }

  getById(id: string): Observable<ApiResult<ProductDto>> {
    return this.publicService.getById<ProductDto>(this.controller, id)
      .pipe(map((response) => normalizeApiResponse(response)));
  }

  create(request: ProductRequest): Observable<ApiResult<ProductDto>> {
    return this.publicService.post<HttpResponseModel<ProductDto>>(request, this.controller)
      .pipe(map((response) => normalizeApiResponse(response)));
  }

  update(id: string, request: ProductRequest): Observable<ApiResult<ProductDto>> {
    return this.publicService.put<HttpResponseModel<ProductDto>>(request, this.controller, id)
      .pipe(map((response) => normalizeApiResponse(response)));
  }

  setStatus(id: string, status: ProductStatus): Observable<ApiResult<ProductDto>> {
    return this.publicService.put<HttpResponseModel<ProductDto>>({ status }, this.controller, `${id}/status`)
      .pipe(map((response) => normalizeApiResponse(response)));
  }

  getReadiness(id: string): Observable<ApiResult<ProductReadiness>> {
    return this.publicService.getById<ProductReadiness>(this.controller, `${id}/readiness`)
      .pipe(map((response) => normalizeApiResponse(response)));
  }

  getAudit(id: string): Observable<ApiResult<ProductAuditEntry[]>> {
    return this.publicService.getById<ProductAuditEntry[]>(this.controller, `${id}/audit`)
      .pipe(map((response) => normalizeApiResponse(response)));
  }
}
