import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResult } from '../models/api-result.model';
import { CategoryDto, CategoryRequest } from '../models/category-brand.model';
import { HttpResponseModel } from '../models/http-response.model';
import { normalizeApiResponse } from '../models/normalize-api-response';
import { PublicService } from './public.service';

@Injectable({ providedIn: 'root' })
export class CategoriesApiService {
  private readonly publicService = inject(PublicService);
  private readonly controller = 'categories';

  getAll(includeArchived = false, activeOnly = false): Observable<ApiResult<CategoryDto[]>> {
    return this.publicService.getData<HttpResponseModel<CategoryDto[]>>(this.controller, { includeArchived, activeOnly })
      .pipe(map((response) => normalizeApiResponse(response)));
  }

  create(request: CategoryRequest): Observable<ApiResult<CategoryDto>> {
    return this.publicService.post<HttpResponseModel<CategoryDto>>(request, this.controller)
      .pipe(map((response) => normalizeApiResponse(response)));
  }

  update(id: string, request: CategoryRequest): Observable<ApiResult<CategoryDto>> {
    return this.publicService.put<HttpResponseModel<CategoryDto>>(request, this.controller, id)
      .pipe(map((response) => normalizeApiResponse(response)));
  }

  reorder(ids: string[]): Observable<ApiResult<CategoryDto[]>> {
    return this.publicService.put<HttpResponseModel<CategoryDto[]>>({ ids }, this.controller, 'reorder')
      .pipe(map((response) => normalizeApiResponse(response)));
  }

  setActive(id: string, isActive: boolean): Observable<ApiResult<CategoryDto>> {
    return this.publicService.put<HttpResponseModel<CategoryDto>>({ isActive }, this.controller, `${id}/active`)
      .pipe(map((response) => normalizeApiResponse(response)));
  }

  archive(id: string): Observable<ApiResult<CategoryDto>> {
    return this.publicService.put<HttpResponseModel<CategoryDto>>({}, this.controller, `${id}/archive`)
      .pipe(map((response) => normalizeApiResponse(response)));
  }

  restore(id: string): Observable<ApiResult<CategoryDto>> {
    return this.publicService.put<HttpResponseModel<CategoryDto>>({}, this.controller, `${id}/restore`)
      .pipe(map((response) => normalizeApiResponse(response)));
  }
}
