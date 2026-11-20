import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResult } from '../models/api-result.model';
import { DashboardSummary } from '../models/dashboard.model';
import { normalizeApiResponse } from '../models/normalize-api-response';
import { PublicService } from './public.service';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly publicService = inject(PublicService);

  getSummary(): Observable<ApiResult<DashboardSummary>> {
    return this.publicService.getById<DashboardSummary>('dashboard', 'summary')
      .pipe(map((response) => normalizeApiResponse(response)));
  }
}
