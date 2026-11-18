import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { PageStateComponent } from '../../components/page-state/page-state.component';
import { PaginationControlsComponent } from '../../components/pagination-controls/pagination-controls.component';
import { SearchFieldComponent } from '../../components/search-field/search-field.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';
import {
  PRODUCT_AVAILABILITIES,
  PRODUCT_CATEGORIES,
  ProductDto,
  ProductRequest,
  ProductVerificationLogEntry,
  ProductVerificationStatus,
  VERIFICATION_STATUSES
} from '../../models/product.model';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { AuthService } from '../../services/auth.service';
import { ProductsApiService } from '../../services/products-api.service';
import { ToastService } from '../../services/toast.service';

interface SpecRow {
  key: string;
  value: string;
}

interface ProductForm extends Omit<ProductRequest, 'specifications'> {
  specs: SpecRow[];
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, MatButtonModule, PageStateComponent, PaginationControlsComponent, SearchFieldComponent, TranslatePipe],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {
  private readonly api = inject(ProductsApiService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  protected readonly translation = inject(TranslationService);
  protected readonly isAdmin = inject(AuthService).hasRole('Admin');
  protected readonly categories = PRODUCT_CATEGORIES;
  protected readonly availabilities = PRODUCT_AVAILABILITIES;
  protected readonly statuses = VERIFICATION_STATUSES;
  protected readonly pageSize = 10;

  protected readonly products = signal<ProductDto[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(1);
  protected readonly pageNumber = signal(1);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly saving = signal(false);
  protected readonly editing = signal<ProductDto | null>(null);
  protected readonly formOpen = signal(false);
  protected readonly historyFor = signal<string | null>(null);
  protected readonly history = signal<ProductVerificationLogEntry[]>([]);

  protected searchTerm = '';
  protected statusFilter: ProductVerificationStatus | '' = '';
  protected form: ProductForm = this.emptyForm();

  ngOnInit(): void {
    void this.load();
  }

  protected search(): void {
    this.pageNumber.set(1);
    void this.load();
  }

  protected goTo(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.pageNumber.set(page);
      void this.load();
    }
  }

  protected openNew(): void {
    this.editing.set(null);
    this.form = this.emptyForm();
    this.formOpen.set(true);
  }

  protected edit(product: ProductDto): void {
    this.editing.set(product);
    this.form = {
      name: product.name,
      nameAr: product.nameAr,
      description: product.description,
      descriptionAr: product.descriptionAr,
      brand: product.brand,
      category: product.category,
      price: product.price,
      availability: product.availability,
      imageUrl: product.imageUrl,
      sourceName: product.sourceName,
      sourceUrl: product.sourceUrl,
      isActive: product.isActive,
      specs: Object.entries(product.specifications ?? {}).map(([key, value]) => ({ key, value }))
    };
    this.formOpen.set(true);
  }

  protected cancel(): void {
    this.formOpen.set(false);
    this.editing.set(null);
  }

  protected addSpec(): void {
    this.form.specs = [...this.form.specs, { key: '', value: '' }];
  }

  protected removeSpec(index: number): void {
    this.form.specs = this.form.specs.filter((_, position) => position !== index);
  }

  protected async save(): Promise<void> {
    if (!this.form.name.trim() || !this.form.brand.trim() || this.form.price < 0) {
      return;
    }

    const { specs, ...rest } = this.form;
    const specifications: Record<string, string> = {};
    for (const spec of specs) {
      if (spec.key.trim()) {
        specifications[spec.key.trim()] = spec.value.trim();
      }
    }

    const request: ProductRequest = {
      ...rest,
      name: rest.name.trim(),
      nameAr: rest.nameAr.trim(),
      brand: rest.brand.trim(),
      imageUrl: rest.imageUrl?.trim() || null,
      sourceUrl: rest.sourceUrl?.trim() || null,
      specifications
    };

    this.saving.set(true);
    try {
      const current = this.editing();
      if (current) {
        await firstValueFrom(this.api.update(current.id, request));
      } else {
        await firstValueFrom(this.api.create(request));
      }
      this.toast.showSuccess(this.translation.t('admin.saved'));
      this.cancel();
      await this.load();
    } catch {
      // The HTTP error interceptor already reports the failure.
    } finally {
      this.saving.set(false);
    }
  }

  protected async setStatus(product: ProductDto, status: ProductVerificationStatus): Promise<void> {
    try {
      await firstValueFrom(this.api.setVerification(product.id, status));
      this.toast.showSuccess(this.translation.t('admin.verificationUpdated'));
      await this.load();
    } catch {
      // Reported by the HTTP error interceptor (for example, incomplete product data).
    }
  }

  protected async remove(product: ProductDto): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.translation.t('admin.confirmDelete'),
      message: product.name,
      confirmLabel: this.translation.t('common.delete'),
      cancelLabel: this.translation.t('common.cancel')
    });
    if (!confirmed) {
      return;
    }

    try {
      await firstValueFrom(this.api.remove(product.id));
      this.toast.showSuccess(this.translation.t('admin.deleted'));
      await this.load();
    } catch {
      // Reported by the HTTP error interceptor.
    }
  }

  protected async toggleHistory(product: ProductDto): Promise<void> {
    if (this.historyFor() === product.id) {
      this.historyFor.set(null);
      return;
    }

    try {
      const response = await firstValueFrom(this.api.getVerificationHistory(product.id));
      this.history.set(response.data ?? []);
      this.historyFor.set(product.id);
    } catch {
      this.historyFor.set(null);
    }
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    try {
      const response = await firstValueFrom(
        this.api.getPaged(this.pageNumber(), this.pageSize, this.searchTerm.trim(), this.statusFilter)
      );
      this.products.set(response.data?.items ?? []);
      this.totalCount.set(response.data?.totalCount ?? 0);
      this.totalPages.set(Math.max(response.data?.totalPages ?? 1, 1));
    } catch {
      this.products.set([]);
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  private emptyForm(): ProductForm {
    return {
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      brand: '',
      category: 'MobilePhone',
      price: 0,
      availability: 'Unknown',
      imageUrl: null,
      sourceName: '',
      sourceUrl: null,
      isActive: true,
      specs: []
    };
  }
}
