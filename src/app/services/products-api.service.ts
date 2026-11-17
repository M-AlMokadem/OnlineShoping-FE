import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResult } from '../models/api-result.model';
import { HttpResponseModel } from '../models/http-response.model';
import { PagedResult } from '../models/paged-result.model';
import { normalizeApiResponse } from '../models/normalize-api-response';
import {
  ProductDto,
  ProductRequest,
  ProductVerificationLogEntry,
  ProductVerificationStatus
} from '../models/product.model';
import { PublicService } from './public.service';

export type { ProductDto, ProductRequest };

@Injectable({ providedIn: 'root' })
export class ProductsApiService {
  private readonly publicService = inject(PublicService);
  private readonly controller = 'products';

  getPaged(
    pageNumber: number,
    pageSize: number,
    searchedValue = '',
    verificationStatus: ProductVerificationStatus | '' = ''
  ): Observable<ApiResult<PagedResult<ProductDto>>> {
    const params: Record<string, unknown> = { pageNumber, pageSize, SearchedValue: searchedValue };
    if (verificationStatus) {
      params['verificationStatus'] = verificationStatus;
    }

    return this.publicService.getData<HttpResponseModel<PagedResult<ProductDto>>>(this.controller, params)
      .pipe(map((response) => this.normalize(response)));
  }

  setVerification(id: string, status: ProductVerificationStatus): Observable<ApiResult<ProductDto>> {
    return this.publicService.put<HttpResponseModel<ProductDto>>({ status }, this.controller, `${id}/verification`)
      .pipe(map((response) => this.normalize(response)));
  }

  getVerificationHistory(id: string): Observable<ApiResult<ProductVerificationLogEntry[]>> {
    return this.publicService.getAll<ProductVerificationLogEntry>(`${this.controller}/${id}/verification-history`)
      .pipe(map((response) => this.normalize(response)));
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
