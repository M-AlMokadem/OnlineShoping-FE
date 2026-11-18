import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { PageStateComponent } from '../../components/page-state/page-state.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';
import { ProductDto } from '../../models/product.model';
import { CatalogueApiService } from '../../services/catalogue-api.service';
import { CompareSelectionService } from '../../services/compare-selection.service';

export interface CompareRow {
  label: string;
  values: string[];
  differs: boolean;
}

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [RouterLink, MatButtonModule, PageStateComponent, TranslatePipe],
  templateUrl: './compare.component.html',
  styleUrl: './compare.component.css'
})
export class CompareComponent implements OnInit {
  private readonly api = inject(CatalogueApiService);

  protected readonly translation = inject(TranslationService);
  protected readonly selection = inject(CompareSelectionService);
  protected readonly products = signal<ProductDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);

  protected readonly rows = computed<CompareRow[]>(() => {
    const products = this.products();
    const t = (key: string) => this.translation.t(key);
    const specKeys = [...new Set(products.flatMap((product) => Object.keys(product.specifications ?? {})))];
    const rows: CompareRow[] = [
      this.row(t('compare.brand'), products.map((product) => product.brand)),
      this.row(t('compare.price'), products.map((product) => `${product.price} ${product.currency}`)),
      this.row(t('compare.availability'), products.map((product) => t('availability.' + product.availability))),
      ...specKeys.map((key) => this.row(key, products.map((product) => product.specifications?.[key] ?? t('common.noValue'))))
    ];
    return rows;
  });

  ngOnInit(): void {
    void this.load();
  }

  protected remove(id: string): void {
    this.selection.remove(id);
    void this.load();
  }

  protected clear(): void {
    this.selection.clear();
    this.products.set([]);
  }

  protected async load(): Promise<void> {
    const ids = this.selection.ids();
    this.failed.set(false);
    if (ids.length < 2) {
      this.products.set([]);
      return;
    }

    this.loading.set(true);
    try {
      const response = await firstValueFrom(this.api.compare(ids));
      this.products.set(response.data ?? []);
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  private row(label: string, values: string[]): CompareRow {
    return { label, values, differs: new Set(values).size > 1 };
  }
}
