import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IconComponent } from '../../components/icon/icon.component';
import { ProductImageComponent } from '../../components/product-image/product-image.component';
import { PageStateComponent } from '../../components/page-state/page-state.component';
import { PaginationControlsComponent } from '../../components/pagination-controls/pagination-controls.component';
import { SearchFieldComponent } from '../../components/search-field/search-field.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';
import { BrandDto, CategoryDto } from '../../models/category-brand.model';
import { PERMISSIONS } from '../../models/permissions';
import {
  DEFAULT_PRODUCT_QUERY,
  PRODUCT_AVAILABILITIES,
  PRODUCT_PAGE_SIZES,
  PRODUCT_STATUSES,
  ProductDto,
  ProductListQuery,
  ProductSortBy
} from '../../models/product.model';
import { AuthService } from '../../services/auth.service';
import { BrandsApiService } from '../../services/brands-api.service';
import { CategoriesApiService } from '../../services/categories-api.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ToastService } from '../../services/toast.service';
import { StatusAction, statusActionsFor, statusPillClass, stockLevel } from '../../utils/product-status';
import { ProductListStateService } from '../../services/product-list-state.service';
import { ProductsApiService } from '../../services/products-api.service';

export function parseProductQuery(params: { get(name: string): string | null }): ProductListQuery {
  const defaults = DEFAULT_PRODUCT_QUERY;
  const sortBy = params.get('sortBy') as ProductSortBy | null;
  const pageSize = Number(params.get('pageSize'));
  const pageNumber = Number(params.get('page'));
  const availability = params.get('availability');
  const status = params.get('status');

  return {
    search: params.get('search') ?? defaults.search,
    categoryId: params.get('categoryId') ?? defaults.categoryId,
    brandId: params.get('brandId') ?? defaults.brandId,
    availability: PRODUCT_AVAILABILITIES.find((value) => value === availability) ?? defaults.availability,
    status: PRODUCT_STATUSES.find((value) => value === status) ?? defaults.status,
    sortBy: sortBy && ['name', 'price', 'stock', 'updated'].includes(sortBy) ? sortBy : defaults.sortBy,
    sortDirection: params.get('sortDirection') === 'asc' ? 'asc' : params.get('sortDirection') === 'desc' ? 'desc' : defaults.sortDirection,
    pageSize: PRODUCT_PAGE_SIZES.includes(pageSize) ? pageSize : defaults.pageSize,
    pageNumber: Number.isInteger(pageNumber) && pageNumber >= 1 ? pageNumber : defaults.pageNumber
  };
}

export function toQueryParams(query: ProductListQuery): Params {
  const defaults = DEFAULT_PRODUCT_QUERY;
  const params: Params = {};
  if (query.search.trim()) { params['search'] = query.search.trim(); }
  if (query.categoryId) { params['categoryId'] = query.categoryId; }
  if (query.brandId) { params['brandId'] = query.brandId; }
  if (query.availability) { params['availability'] = query.availability; }
  if (query.status) { params['status'] = query.status; }
  if (query.sortBy !== defaults.sortBy) { params['sortBy'] = query.sortBy; }
  if (query.sortDirection !== defaults.sortDirection) { params['sortDirection'] = query.sortDirection; }
  if (query.pageSize !== defaults.pageSize) { params['pageSize'] = query.pageSize; }
  if (query.pageNumber !== defaults.pageNumber) { params['page'] = query.pageNumber; }
  return params;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, IconComponent, ProductImageComponent, PageStateComponent, PaginationControlsComponent, SearchFieldComponent, TranslatePipe],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent {
  private readonly api = inject(ProductsApiService);
  private readonly categoriesApi = inject(CategoriesApiService);
  private readonly brandsApi = inject(BrandsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly listState = inject(ProductListStateService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private loadToken = 0;

  protected readonly translation = inject(TranslationService);
  protected readonly canCreate = this.auth.hasPermission(PERMISSIONS.productsCreate);
  protected readonly availabilities = PRODUCT_AVAILABILITIES;
  protected readonly statuses = PRODUCT_STATUSES;
  protected readonly pageSizes = PRODUCT_PAGE_SIZES;
  protected readonly sortOptions: ProductSortBy[] = ['name', 'price', 'stock', 'updated'];
  protected readonly statusPillClass = statusPillClass;
  protected readonly stockLevel = stockLevel;

  protected readonly query = signal<ProductListQuery>({ ...DEFAULT_PRODUCT_QUERY });
  protected readonly products = signal<ProductDto[]>([]);
  protected readonly categories = signal<CategoryDto[]>([]);
  protected readonly brands = signal<BrandDto[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(1);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly filtersOpen = signal(false);
  protected readonly changingId = signal<string | null>(null);

  protected searchTerm = '';

  constructor() {
    void this.loadFilterOptions();
    this.route.queryParamMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((params) => {
      const query = parseProductQuery(params);
      this.query.set(query);
      this.listState.queryParams = toQueryParams(query);
      this.searchTerm = query.search;
      if (query.categoryId || query.brandId || query.availability || query.status) {
        this.filtersOpen.set(true);
      }
      void this.load();
    });
  }

  protected applySearch(): void {
    this.navigate({ search: this.searchTerm, pageNumber: 1 });
  }

  protected setFilter(key: 'categoryId' | 'brandId' | 'availability' | 'status', value: string): void {
    this.navigate({ [key]: value, pageNumber: 1 } as Partial<ProductListQuery>);
  }

  protected setSort(sortBy: string): void {
    this.navigate({ sortBy: sortBy as ProductSortBy, pageNumber: 1 });
  }

  protected setDirection(sortDirection: string): void {
    this.navigate({ sortDirection: sortDirection === 'asc' ? 'asc' : 'desc', pageNumber: 1 });
  }

  protected actionsFor(product: ProductDto): StatusAction[] {
    return statusActionsFor(product.status, (permission) => this.auth.hasPermission(permission));
  }

  protected async changeStatus(product: ProductDto, action: StatusAction): Promise<void> {
    if (this.changingId()) {
      return;
    }
    if (action.status === 'Archived') {
      const confirmed = await this.confirmDialog.confirm({
        title: this.translation.t('product.archiveTitle'),
        message: this.translation.t('product.archiveMessage'),
        confirmLabel: this.translation.t('product.archive'),
        cancelLabel: this.translation.t('common.cancel')
      });
      if (!confirmed) {
        return;
      }
    }

    this.changingId.set(product.id);
    try {
      const response = await firstValueFrom(this.api.setStatus(product.id, action.status));
      this.toast.showSuccess(response.message || this.translation.t('product.statusUpdated'));
      await this.load();
    } catch {
      // The HTTP error interceptor already reports the failure.
    } finally {
      this.changingId.set(null);
    }
  }

  protected setPageSize(value: string): void {
    this.navigate({ pageSize: Number(value), pageNumber: 1 });
  }

  protected sortBy(column: ProductSortBy): void {
    const current = this.query();
    const sortDirection = current.sortBy === column && current.sortDirection === 'asc' ? 'desc' : 'asc';
    this.navigate({ sortBy: column, sortDirection, pageNumber: 1 });
  }

  protected sortIndicator(column: ProductSortBy): string {
    const current = this.query();
    if (current.sortBy !== column) {
      return '';
    }
    return current.sortDirection === 'asc' ? '▲' : '▼';
  }

  protected ariaSort(column: ProductSortBy): 'ascending' | 'descending' | 'none' {
    const current = this.query();
    if (current.sortBy !== column) {
      return 'none';
    }
    return current.sortDirection === 'asc' ? 'ascending' : 'descending';
  }

  protected reset(): void {
    this.searchTerm = '';
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  protected goTo(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.navigate({ pageNumber: page });
    }
  }

  protected open(product: ProductDto): void {
    void this.router.navigate(['/admin/products', product.id]);
  }

  protected categoryLabel(product: ProductDto): string {
    return this.translation.localized(product.categoryName, product.categoryNameAr) || this.translation.t('common.noValue');
  }

  protected categoryOption(category: CategoryDto): string {
    return this.translation.localized(category.name, category.nameAr);
  }

  protected async load(): Promise<void> {
    const token = ++this.loadToken;
    this.loading.set(true);
    this.failed.set(false);
    try {
      const response = await firstValueFrom(this.api.getPaged(this.query()));
      if (token !== this.loadToken) {
        return;
      }
      this.products.set(response.data?.items ?? []);
      this.totalCount.set(response.data?.totalCount ?? 0);
      this.totalPages.set(Math.max(response.data?.totalPages ?? 1, 1));
    } catch {
      if (token === this.loadToken) {
        this.failed.set(true);
      }
    } finally {
      if (token === this.loadToken) {
        this.loading.set(false);
      }
    }
  }

  private navigate(changes: Partial<ProductListQuery>): void {
    const next = { ...this.query(), ...changes };
    void this.router.navigate([], { relativeTo: this.route, queryParams: toQueryParams(next) });
  }

  private async loadFilterOptions(): Promise<void> {
    try {
      const [categories, brands] = await Promise.all([
        firstValueFrom(this.categoriesApi.getAll()),
        firstValueFrom(this.brandsApi.getAll())
      ]);
      this.categories.set(categories.data ?? []);
      this.brands.set(brands.data ?? []);
    } catch {
      this.categories.set([]);
      this.brands.set([]);
    }
  }
}
