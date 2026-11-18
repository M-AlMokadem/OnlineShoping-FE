import { CurrencyPipe, KeyValuePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { PageStateComponent } from '../../components/page-state/page-state.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';
import { ProductDto } from '../../models/product.model';
import { CatalogueApiService } from '../../services/catalogue-api.service';
import { CompareSelectionService } from '../../services/compare-selection.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CurrencyPipe, KeyValuePipe, RouterLink, MatButtonModule, PageStateComponent, TranslatePipe],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css'
})
export class ProductDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CatalogueApiService);
  private readonly toast = inject(ToastService);

  protected readonly translation = inject(TranslationService);
  protected readonly compare = inject(CompareSelectionService);
  protected readonly product = signal<ProductDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    try {
      const response = await firstValueFrom(this.api.getById(id));
      this.product.set(response.data);
    } catch {
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected toggleCompare(product: ProductDto): void {
    const result = this.compare.toggle(product);
    if (result === 'limit') {
      this.toast.showError(this.translation.t('compare.limit'));
    } else if (result === 'category') {
      this.toast.showError(this.translation.t('compare.sameCategory'));
    }
  }
}
