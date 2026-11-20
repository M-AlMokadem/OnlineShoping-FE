import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PageStateComponent } from '../../components/page-state/page-state.component';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';
import { BrandDto, CategoryDto } from '../../models/category-brand.model';
import { CatalogueFilters, PRODUCT_AVAILABILITIES, ProductAvailability, ProductDto, ProductSortBy, SortDirection } from '../../models/product.model';
import { CatalogueApiService } from '../../services/catalogue-api.service';
import { CompareSelectionService } from '../../services/compare-selection.service';
import { StorefrontService } from '../../services/storefront.service';

export const SORT_OPTIONS = [
  { value: 'updated:desc', label: 'catalogue.sort.newest' },
  { value: 'price:asc', label: 'catalogue.sort.priceAsc' },
  { value: 'price:desc', label: 'catalogue.sort.priceDesc' },
  { value: 'name:asc', label: 'catalogue.sort.nameAsc' }
];

const SORT_FIELDS: ProductSortBy[] = ['name', 'price', 'stock', 'updated'];

@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [FormsModule, RouterLink, PageStateComponent, ProductCardComponent, TranslatePipe],
  templateUrl: './catalogue.component.html',
  styleUrl: './catalogue.component.css'
})
export class CatalogueComponent implements OnInit {
  private readonly api = inject(CatalogueApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly storefront = inject(StorefrontService);

  protected readonly translation = inject(TranslationService);
  protected readonly compare = inject(CompareSelectionService);
  protected readonly availabilities = PRODUCT_AVAILABILITIES;
  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly pageSize = 12;

  protected readonly products = signal<ProductDto[]>([]);
  protected readonly brands = signal<BrandDto[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(1);
  protected readonly pageNumber = signal(1);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly filters = signal<CatalogueFilters>({});
  protected readonly sort = signal('updated:desc');
  protected readonly brandSearch = signal('');

  protected readonly categories = this.storefront.visibleCategories;
  protected readonly visibleBrands = computed(() => {
    const term = this.brandSearch().trim().toLowerCase();
    return this.brands().filter((brand) => brand.isActive && brand.productCount > 0 && (!term || brand.name.toLowerCase().includes(term)));
  });
  protected readonly selectedCategory = computed<CategoryDto | null>(() =>
    this.categories().find((category) => category.id === this.filters().categoryId) ?? null);
  protected readonly title = computed(() => {
    const category = this.selectedCategory();
    return category ? this.translation.localized(category.name, category.nameAr) : this.translation.t('catalogue.allProducts');
  });

  protected minPriceInput: number | null = null;
  protected maxPriceInput: number | null = null;

  ngOnInit(): void {
    void this.storefront.load();
    void this.loadBrands();
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const availability = params.get('availability');
      const sortBy = params.get('sortBy');
      const direction: SortDirection = params.get('sortDirection') === 'desc' ? 'desc' : 'asc';
      const hasSort = SORT_FIELDS.includes(sortBy as ProductSortBy);
      this.filters.set({
        searchedValue: params.get('search') ?? '',
        categoryId: params.get('categoryId') ?? '',
        brandId: params.get('brandId') ?? '',
        availability: PRODUCT_AVAILABILITIES.includes(availability as ProductAvailability) ? availability as ProductAvailability : '',
        minPrice: this.numberParam(params.get('minPrice')),
        maxPrice: this.numberParam(params.get('maxPrice')),
        sortBy: hasSort ? sortBy as ProductSortBy : 'updated',
        sortDirection: hasSort ? direction : 'desc'
      });
      this.sort.set(`${this.filters().sortBy}:${this.filters().sortDirection}`);
      this.minPriceInput = this.filters().minPrice ?? null;
      this.maxPriceInput = this.filters().maxPrice ?? null;
      this.pageNumber.set(Math.max(Number(params.get('page')) || 1, 1));
      void this.load();
    });
  }

  protected selectCategory(id: string): void {
    this.navigate({ categoryId: this.filters().categoryId === id ? '' : id });
  }

  protected selectBrand(id: string): void {
    this.navigate({ brandId: this.filters().brandId === id ? '' : id });
  }

  protected selectAvailability(value: ProductAvailability): void {
    this.navigate({ availability: this.filters().availability === value ? '' : value });
  }

  protected applyPrice(): void {
    this.navigate({ minPrice: this.minPriceInput, maxPrice: this.maxPriceInput });
  }

  protected changeSort(value: string): void {
    const [sortBy, sortDirection] = value.split(':') as [ProductSortBy, SortDirection];
    this.navigate({ sortBy, sortDirection });
  }

  protected clearSearch(): void {
    this.navigate({ searchedValue: '' });
  }

  protected reset(): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  protected goTo(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.navigate({}, page);
  }

  protected categoryName(category: CategoryDto): string {
    return this.translation.localized(category.name, category.nameAr);
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    try {
      const response = await firstValueFrom(this.api.browse(this.filters(), this.pageNumber(), this.pageSize));
      this.products.set(response.data?.items ?? []);
      this.totalCount.set(response.data?.totalCount ?? 0);
      this.totalPages.set(Math.max(response.data?.totalPages ?? 1, 1));
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  private navigate(changes: CatalogueFilters, page = 1): void {
    const next = { ...this.filters(), ...changes };
    const queryParams = {
      search: next.searchedValue?.trim() || null,
      categoryId: next.categoryId || null,
      brandId: next.brandId || null,
      availability: next.availability || null,
      minPrice: next.minPrice ?? null,
      maxPrice: next.maxPrice ?? null,
      sortBy: next.sortBy && `${next.sortBy}:${next.sortDirection}` !== 'updated:desc' ? next.sortBy : null,
      sortDirection: next.sortBy && `${next.sortBy}:${next.sortDirection}` !== 'updated:desc' ? next.sortDirection : null,
      page: page > 1 ? page : null
    };
    void this.router.navigate([], { relativeTo: this.route, queryParams });
  }

  private numberParam(value: string | null): number | null {
    const parsed = value === null || value === '' ? NaN : Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }

  private async loadBrands(): Promise<void> {
    try {
      const response = await firstValueFrom(this.api.getBrands());
      this.brands.set(response.data ?? []);
    } catch {
      this.brands.set([]);
    }
  }
}
