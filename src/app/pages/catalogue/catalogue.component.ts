import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { PageStateComponent } from '../../components/page-state/page-state.component';
import { SearchFieldComponent } from '../../components/search-field/search-field.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';
import { BrandDto, CategoryDto } from '../../models/category-brand.model';
import { CatalogueFilters, PRODUCT_AVAILABILITIES, ProductDto } from '../../models/product.model';
import { CatalogueApiService } from '../../services/catalogue-api.service';
import { CompareSelectionService } from '../../services/compare-selection.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, RouterLink, MatButtonModule, MatCardModule, PageStateComponent, SearchFieldComponent, TranslatePipe],
  templateUrl: './catalogue.component.html',
  styleUrl: './catalogue.component.css'
})
export class CatalogueComponent implements OnInit {
  private readonly api = inject(CatalogueApiService);
  private readonly toast = inject(ToastService);

  protected readonly translation = inject(TranslationService);
  protected readonly compare = inject(CompareSelectionService);
  protected readonly availabilities = PRODUCT_AVAILABILITIES;
  protected readonly pageSize = 12;

  protected readonly products = signal<ProductDto[]>([]);
  protected readonly categories = signal<CategoryDto[]>([]);
  protected readonly brands = signal<BrandDto[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(1);
  protected readonly pageNumber = signal(1);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);

  protected filters: CatalogueFilters = this.emptyFilters();

  ngOnInit(): void {
    void this.loadFilterOptions();
    void this.load();
  }

  protected search(): void {
    this.pageNumber.set(1);
    void this.load();
  }

  protected reset(): void {
    this.filters = this.emptyFilters();
    this.search();
  }

  protected goTo(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.pageNumber.set(page);
    void this.load();
  }

  protected name(product: ProductDto): string {
    return this.translation.localized(product.name, product.nameAr);
  }

  protected toggleCompare(product: ProductDto): void {
    const result = this.compare.toggle(product);
    if (result === 'limit') {
      this.toast.showError(this.translation.t('compare.limit'));
    } else if (result === 'category') {
      this.toast.showError(this.translation.t('compare.sameCategory'));
    }
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    try {
      const response = await firstValueFrom(this.api.browse(this.filters, this.pageNumber(), this.pageSize));
      this.products.set(response.data?.items ?? []);
      this.totalCount.set(response.data?.totalCount ?? 0);
      this.totalPages.set(Math.max(response.data?.totalPages ?? 1, 1));
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected categoryName(category: CategoryDto): string {
    return this.translation.localized(category.name, category.nameAr);
  }

  private async loadFilterOptions(): Promise<void> {
    try {
      const [categories, brands] = await Promise.all([
        firstValueFrom(this.api.getCategories()),
        firstValueFrom(this.api.getBrands())
      ]);
      this.categories.set(categories.data ?? []);
      this.brands.set(brands.data ?? []);
    } catch {
      this.categories.set([]);
      this.brands.set([]);
    }
  }

  private emptyFilters(): CatalogueFilters {
    return { searchedValue: '', brandId: '', categoryId: '', availability: '', minPrice: null, maxPrice: null };
  }
}
