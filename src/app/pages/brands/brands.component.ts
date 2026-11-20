import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { IconComponent } from '../../components/icon/icon.component';
import { PageStateComponent } from '../../components/page-state/page-state.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';
import { BrandDto, BrandRequest } from '../../models/category-brand.model';
import { BrandsApiService } from '../../services/brands-api.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ToastService } from '../../services/toast.service';
import { applyServerErrors } from '../../utils/server-errors';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, MatCheckboxModule, MatFormFieldModule, MatInputModule, PageStateComponent, TranslatePipe],
  templateUrl: './brands.component.html',
  styleUrl: './brands.component.css'
})
export class BrandsComponent implements OnInit {
  private readonly api = inject(BrandsApiService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly fb = inject(FormBuilder);

  protected readonly translation = inject(TranslationService);
  protected readonly brands = signal<BrandDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly saving = signal(false);
  protected readonly formOpen = signal(false);
  protected readonly editing = signal<BrandDto | null>(null);
  protected readonly otherErrors = signal<string[]>([]);

  protected readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(100)]),
    description: this.fb.nonNullable.control(''),
    logoUrl: this.fb.nonNullable.control(''),
    isActive: this.fb.nonNullable.control(true)
  });

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    try {
      const response = await firstValueFrom(this.api.getAll());
      this.brands.set(response.data ?? []);
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected openNew(): void {
    this.editing.set(null);
    this.otherErrors.set([]);
    this.form.reset({ name: '', description: '', logoUrl: '', isActive: true });
    this.formOpen.set(true);
  }

  protected edit(brand: BrandDto): void {
    this.editing.set(brand);
    this.otherErrors.set([]);
    this.form.reset({
      name: brand.name,
      description: brand.description ?? '',
      logoUrl: brand.logoUrl ?? '',
      isActive: brand.isActive
    });
    this.formOpen.set(true);
  }

  protected cancel(): void {
    this.formOpen.set(false);
    this.editing.set(null);
  }

  protected errorText(name: string): string {
    const errors = this.form.get(name)?.errors;
    if (!errors) { return ''; }
    if (errors['server']) { return String(errors['server']); }
    if (errors['required']) { return this.translation.t('form.required'); }
    if (errors['maxlength']) { return `${this.translation.t('form.maxLength')} ${errors['maxlength'].requiredLength}`; }
    return '';
  }

  protected async save(): Promise<void> {
    this.otherErrors.set([]);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) {
      return;
    }

    const value = this.form.getRawValue();
    const request: BrandRequest = {
      name: value.name.trim(),
      description: value.description.trim(),
      logoUrl: value.logoUrl.trim() || null,
      isActive: value.isActive
    };

    this.saving.set(true);
    try {
      const current = this.editing();
      const response = current
        ? await firstValueFrom(this.api.update(current.id, request))
        : await firstValueFrom(this.api.create(request));
      this.toast.showSuccess(response.message || this.translation.t('brand.saved'));
      this.cancel();
      await this.load();
    } catch (error) {
      this.otherErrors.set(applyServerErrors(this.form, error));
    } finally {
      this.saving.set(false);
    }
  }

  protected setActive(brand: BrandDto, isActive: boolean): Promise<void> {
    return this.run(() => firstValueFrom(this.api.setActive(brand.id, isActive)));
  }

  protected async remove(brand: BrandDto): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.translation.t('brand.deleteTitle'),
      message: this.translation.t('brand.deleteMessage'),
      confirmLabel: this.translation.t('common.delete'),
      cancelLabel: this.translation.t('common.cancel')
    });
    if (confirmed) {
      await this.run(() => firstValueFrom(this.api.remove(brand.id)));
    }
  }

  private async run(action: () => Promise<{ message: string }>): Promise<void> {
    try {
      const response = await action();
      if (response.message) {
        this.toast.showSuccess(response.message);
      }
      await this.load();
    } catch {
      // The HTTP error interceptor shows the server message (for example 409 conflicts).
    }
  }
}
