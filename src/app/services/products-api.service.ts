import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResult } from '../models/api-result.model';
import { HttpResponseModel } from '../models/http-response.model';
import { PagedResult } from '../models/paged-result.model';
import { normalizeApiResponse } from '../models/normalize-api-response';
import { PublicService } from './public.service';

export interface ProductDto {
  id: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
}

export interface ProductRequest {
  name: string;
  description: string;
  price: number;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductsApiService {
  private readonly publicService = inject(PublicService);
  private readonly controller = 'products';

  getPaged(pageNumber: number, pageSize: number, searchedValue = ''): Observable<ApiResult<PagedResult<ProductDto>>> {
    return this.publicService.getFilterPaginationData<ProductDto>(
      this.controller,
      { isPaginationRequest: true, pageNumber, pageSize },
      { searchedValue, columnsKey: ['name', 'description'] }
    ).pipe(map((response) => this.normalize(response)));
  }

  create(request: ProductRequest): Observable<ApiResult<ProductDto>> {
    return this.publicService.post<HttpResponseModel<ProductDto>>(request, this.controller)
      .pipe(map((response) => this.normalize(response)));
  }

  update(id: string, request: ProductRequest): Observable<ApiResult<ProductDto>> {
    return this.publicService.put<HttpResponseModel<ProductDto>>(request, this.controller, id)
      .pipe(map((response) => this.normalize(response)));
  }

  remove(id: string): Observable<ApiResult<boolean>> {
    return this.publicService.delete<HttpResponseModel<boolean>>(this.controller, id)
      .pipe(map((response) => this.normalize(response)));
  }

  private normalize<T>(response: HttpResponseModel<T>): ApiResult<T> {
    return normalizeApiResponse(response);
  }
}
