import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResult } from '../models/api-result.model';
import { BrandDto, BrandRequest } from '../models/category-brand.model';
import { HttpResponseModel } from '../models/http-response.model';
import { normalizeApiResponse } from '../models/normalize-api-response';
import { PublicService } from './public.service';

@Injectable({ providedIn: 'root' })
export class BrandsApiService {
  private readonly publicService = inject(PublicService);
  private readonly controller = 'brands';

  getAll(activeOnly = false): Observable<ApiResult<BrandDto[]>> {
    return this.publicService.getData<HttpResponseModel<BrandDto[]>>(this.controller, { activeOnly })
      .pipe(map((response) => normalizeApiResponse(response)));
  }

  create(request: BrandRequest): Observable<ApiResult<BrandDto>> {
    return this.publicService.post<HttpResponseModel<BrandDto>>(request, this.controller)
      .pipe(map((response) => normalizeApiResponse(response)));
  }

  update(id: string, request: BrandRequest): Observable<ApiResult<BrandDto>> {
    return this.publicService.put<HttpResponseModel<BrandDto>>(request, this.controller, id)
      .pipe(map((response) => normalizeApiResponse(response)));
  }

  setActive(id: string, isActive: boolean): Observable<ApiResult<BrandDto>> {
    return this.publicService.put<HttpResponseModel<BrandDto>>({ isActive }, this.controller, `${id}/active`)
      .pipe(map((response) => normalizeApiResponse(response)));
  }

  remove(id: string): Observable<ApiResult<boolean>> {
    return this.publicService.delete<HttpResponseModel<boolean>>(this.controller, id)
      .pipe(map((response) => normalizeApiResponse(response)));
  }
}
