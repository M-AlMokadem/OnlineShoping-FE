import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IconComponent } from '../../components/icon/icon.component';
import { ProductImageComponent } from '../../components/product-image/product-image.component';
import { PageStateComponent } from '../../components/page-state/page-state.component';
import { HasUnsavedChanges } from '../../guards/unsaved-changes.guard';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';
import { BrandDto, CategoryDto } from '../../models/category-brand.model';
import { PERMISSIONS } from '../../models/permissions';
import { ProductAuditEntry, ProductDto, ProductReadiness, ProductRequest } from '../../models/product.model';
import { AuthService } from '../../services/auth.service';
import { BrandsApiService } from '../../services/brands-api.service';
import { CategoriesApiService } from '../../services/categories-api.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ProductListStateService } from '../../services/product-list-state.service';
import { ProductsApiService } from '../../services/products-api.service';
import { ToastService } from '../../services/toast.service';
import { applyServerErrors } from '../../utils/server-errors';
import { StatusAction, statusActionsFor, statusPillClass, stockLevel } from '../../utils/product-status';

export type { StatusAction };

export type ProductSection = 'basic' | 'pricing' | 'inventory' | 'images' | 'specs' | 'status' | 'history';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    DatePipe,
    IconComponent,
    ProductImageComponent,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PageStateComponent,
    TranslatePipe
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css'
})
export class ProductFormComponent implements OnInit, HasUnsavedChanges {
  private readonly api = inject(ProductsApiService);
  private readonly categoriesApi = inject(CategoriesApiService);
  private readonly brandsApi = inject(BrandsApiService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly listState = inject(ProductListStateService);
  private readonly fb = inject(FormBuilder);

  protected readonly translation = inject(TranslationService);
  protected readonly productId = this.route.snapshot.paramMap.get('id');
  protected readonly isNew = !this.productId;

  protected readonly product = signal<ProductDto | null>(null);
  protected readonly readiness = signal<ProductReadiness | null>(null);
  protected readonly audit = signal<ProductAuditEntry[]>([]);
  protected readonly categories = signal<CategoryDto[]>([]);
  protected readonly brands = signal<BrandDto[]>([]);
  protected readonly loading = signal(!this.isNew);
  protected readonly notFound = signal(false);
  protected readonly saving = signal(false);
  protected readonly otherErrors = signal<string[]>([]);

  protected readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]),
    nameAr: this.fb.nonNullable.control('', [Validators.maxLength(150)]),
    sku: this.fb.nonNullable.control('', [Validators.maxLength(64), Validators.pattern(/^[A-Za-z0-9._-]*$/)]),
    shortDescription: this.fb.nonNullable.control('', [Validators.maxLength(300)]),
    shortDescriptionAr: this.fb.nonNullable.control('', [Validators.maxLength(300)]),
    description: this.fb.nonNullable.control('', [Validators.maxLength(4000)]),
    descriptionAr: this.fb.nonNullable.control('', [Validators.maxLength(4000)]),
    categoryId: new FormControl<string | null>(null),
    brandId: new FormControl<string | null>(null),
    price: new FormControl<number | null>(null, [Validators.min(0)]),
    originalPrice: new FormControl<number | null>(null, [Validators.min(0)]),
    stockQuantity: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0)]),
    imageUrl: this.fb.nonNullable.control(''),
    specs: this.fb.array<FormGroup<{ key: FormControl<string>; value: FormControl<string> }>>([])
  });

  protected readonly status = computed(() => this.product()?.status ?? null);
  protected readonly isArchived = computed(() => this.status() === 'Archived');
  protected readonly canSave = computed(() => {
    if (this.isArchived()) {
      return false;
    }
    return this.auth.hasPermission(this.isNew ? PERMISSIONS.productsCreate : PERMISSIONS.productsEdit);
  });
  protected readonly canEditSku = this.auth.hasPermission(PERMISSIONS.productsEditSku);

  protected readonly categoryOptions = computed(() => {
    const current = this.product();
    const options = this.categories();
    if (current?.categoryId && !options.some((option) => option.id === current.categoryId)) {
      return [...options, { id: current.categoryId, name: current.categoryName, nameAr: current.categoryNameAr } as CategoryDto];
    }
    return options;
  });

  protected readonly brandOptions = computed(() => {
    const current = this.product();
    const options = this.brands();
    if (current?.brandId && !options.some((option) => option.id === current.brandId)) {
      return [...options, { id: current.brandId, name: current.brandName } as BrandDto];
    }
    return options;
  });

  protected readonly statusActions = computed<StatusAction[]>(() =>
    this.isNew ? [] : statusActionsFor(this.status(), (permission) => this.auth.hasPermission(permission))
  );

  protected readonly activeSection = signal<ProductSection>('basic');
  protected readonly sections = computed<{ id: ProductSection; labelKey: string }[]>(() => {
    const list: { id: ProductSection; labelKey: string }[] = [
      { id: 'basic', labelKey: 'pf.basic' },
      { id: 'pricing', labelKey: 'pf.pricing' },
      { id: 'inventory', labelKey: 'pf.inventory' },
      { id: 'images', labelKey: 'pf.images' },
      { id: 'specs', labelKey: 'pf.specs' },
      { id: 'status', labelKey: 'pf.status' }
    ];
    return this.isNew ? list : [...list, { id: 'history', labelKey: 'pf.history' }];
  });

  protected readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  protected readonly discountPercent = computed(() => {
    const value = this.formValue();
    const price = Number(value.price);
    const original = Number(value.originalPrice);
    return value.price != null && value.originalPrice != null && original > 0 && price < original
      ? Math.round((1 - price / original) * 100)
      : 0;
  });
  protected readonly previewImage = computed(() => (this.formValue().imageUrl ?? '').trim());
  protected readonly stockPreview = computed(() => {
    const quantity = Number(this.formValue().stockQuantity ?? 0);
    return quantity > 0 ? 'InStock' : 'OutOfStock';
  });
  protected readonly lowStock = computed(() => stockLevel({ status: 'Published', stockQuantity: Number(this.formValue().stockQuantity ?? 0) }) === 'low');
  protected readonly statusPillClass = statusPillClass;

  protected get specs(): FormArray {
    return this.form.controls.specs;
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  async ngOnInit(): Promise<void> {
    if (this.isNew && !this.canSave()) {
      this.form.disable();
    }

    void this.loadOptions();
    if (this.productId) {
      await this.loadProduct(this.productId);
    }
  }

  protected setSection(section: ProductSection): void {
    this.activeSection.set(section);
  }

  protected backLink(): { path: string[]; queryParams: Record<string, unknown> } {
    return { path: ['/admin/products'], queryParams: this.listState.queryParams };
  }

  protected addSpec(key = '', value = ''): void {
    this.specs.push(this.fb.nonNullable.group({ key, value }));
    this.form.markAsDirty();
  }

  protected removeSpec(index: number): void {
    this.specs.removeAt(index);
    this.form.markAsDirty();
  }

  protected errorText(name: string): string {
    const control = this.form.get(name);
    return control ? this.controlError(control) : '';
  }

  protected categoryName(category: CategoryDto): string {
    return this.translation.localized(category.name, category.nameAr);
  }

  protected missingLabel(field: string): string {
    return this.translation.t('readiness.' + field);
  }

  protected async save(): Promise<void> {
    if (!this.canSave() || this.saving()) {
      return;
    }

    this.otherErrors.set([]);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    try {
      const request = this.buildRequest();
      const response = this.productId
        ? await firstValueFrom(this.api.update(this.productId, request))
        : await firstValueFrom(this.api.create(request));

      this.applyProduct(response.data);
      this.toast.showSuccess(response.message || this.translation.t('product.saved'));
      if (this.isNew) {
        await this.router.navigate(['/admin/products', response.data.id]);
      } else {
        await this.loadSideData(response.data.id);
      }
    } catch (error) {
      this.applyServerErrors(error);
    } finally {
      this.saving.set(false);
    }
  }

  protected async changeStatus(action: StatusAction): Promise<void> {
    const current = this.product();
    if (!current || this.saving()) {
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

    this.saving.set(true);
    try {
      const response = await firstValueFrom(this.api.setStatus(current.id, action.status));
      this.applyProduct(response.data);
      this.toast.showSuccess(response.message || this.translation.t('product.statusUpdated'));
      await this.loadSideData(current.id);
    } catch (error) {
      const missing = (error as HttpErrorResponse)?.error?.data?.missingFields as ProductReadiness['missingFields'] | undefined;
      if (missing?.length) {
        this.readiness.set({ isReady: false, missingFields: missing });
      }
    } finally {
      this.saving.set(false);
    }
  }

  private async loadProduct(id: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.api.getById(id));
      this.applyProduct(response.data);
      this.loading.set(false);
    } catch {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    await this.loadSideData(id);
  }

  private async loadSideData(id: string): Promise<void> {
    const [readiness, audit] = await Promise.allSettled([
      firstValueFrom(this.api.getReadiness(id)),
      firstValueFrom(this.api.getAudit(id))
    ]);
    this.readiness.set(readiness.status === 'fulfilled' ? readiness.value.data : null);
    this.audit.set(audit.status === 'fulfilled' ? audit.value.data ?? [] : []);
  }

  private async loadOptions(): Promise<void> {
    try {
      const [categories, brands] = await Promise.all([
        firstValueFrom(this.categoriesApi.getAll(false, true)),
        firstValueFrom(this.brandsApi.getAll(true))
      ]);
      this.categories.set(categories.data ?? []);
      this.brands.set(brands.data ?? []);
    } catch {
      this.categories.set([]);
      this.brands.set([]);
    }
  }

  private applyProduct(product: ProductDto): void {
    this.product.set(product);
    this.specs.clear();
    Object.entries(product.specifications ?? {}).forEach(([key, value]) => this.specs.push(this.fb.nonNullable.group({ key, value })));
    this.form.patchValue({
      name: product.name,
      nameAr: product.nameAr ?? '',
      sku: product.sku ?? '',
      shortDescription: product.shortDescription ?? '',
      shortDescriptionAr: product.shortDescriptionAr ?? '',
      description: product.description ?? '',
      descriptionAr: product.descriptionAr ?? '',
      categoryId: product.categoryId,
      brandId: product.brandId,
      price: product.price,
      originalPrice: product.originalPrice,
      stockQuantity: product.stockQuantity,
      imageUrl: product.imageUrl ?? ''
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();

    if (product.status === 'Archived' || !this.canSave()) {
      this.form.disable({ emitEvent: false });
    } else {
      this.form.enable({ emitEvent: false });
      if (!this.isNew && !this.canEditSku) {
        this.form.controls.sku.disable({ emitEvent: false });
      }
    }
  }

  private buildRequest(): ProductRequest {
    const value = this.form.getRawValue();
    const specifications: Record<string, string> = {};
    for (const spec of value.specs) {
      if (spec.key.trim()) {
        specifications[spec.key.trim()] = spec.value.trim();
      }
    }

    return {
      name: value.name.trim(),
      nameAr: value.nameAr.trim(),
      sku: value.sku.trim() || null,
      shortDescription: value.shortDescription.trim(),
      shortDescriptionAr: value.shortDescriptionAr.trim(),
      description: value.description.trim(),
      descriptionAr: value.descriptionAr.trim(),
      categoryId: value.categoryId || null,
      brandId: value.brandId || null,
      price: value.price ?? null,
      originalPrice: value.originalPrice ?? null,
      stockQuantity: value.stockQuantity ?? 0,
      imageUrl: value.imageUrl.trim() || null,
      specifications
    };
  }

  private applyServerErrors(error: unknown): void {
    this.otherErrors.set(applyServerErrors(this.form, error, ['specs']));
  }

  private controlError(control: AbstractControl): string {
    const errors = control.errors;
    if (!errors) {
      return '';
    }
    if (errors['server']) { return String(errors['server']); }
    if (errors['required']) { return this.translation.t('form.required'); }
    if (errors['minlength']) { return `${this.translation.t('form.minLength')} ${errors['minlength'].requiredLength}`; }
    if (errors['maxlength']) { return `${this.translation.t('form.maxLength')} ${errors['maxlength'].requiredLength}`; }
    if (errors['pattern']) { return this.translation.t('form.skuPattern'); }
    if (errors['min']) { return this.translation.t('form.nonNegative'); }
    return '';
  }
}
