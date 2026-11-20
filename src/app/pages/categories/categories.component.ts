import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IconComponent } from '../../components/icon/icon.component';
import { PageStateComponent } from '../../components/page-state/page-state.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';
import { CategoryDto, CategoryRequest } from '../../models/category-brand.model';
import { CategoriesApiService } from '../../services/categories-api.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ToastService } from '../../services/toast.service';
import { applyServerErrors } from '../../utils/server-errors';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule, PageStateComponent, TranslatePipe],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnInit {
  private readonly api = inject(CategoriesApiService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly fb = inject(FormBuilder);

  protected readonly translation = inject(TranslationService);
  protected readonly categories = signal<CategoryDto[]>([]);
  protected readonly includeArchived = signal(false);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly saving = signal(false);
  protected readonly formOpen = signal(false);
  protected readonly editing = signal<CategoryDto | null>(null);
  protected readonly otherErrors = signal<string[]>([]);

  protected readonly parentOptions = computed(() =>
    this.categories().filter((category) => !category.isArchived && category.id !== this.editing()?.id));

  protected readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]),
    nameAr: this.fb.nonNullable.control('', [Validators.maxLength(100)]),
    description: this.fb.nonNullable.control(''),
    iconUrl: this.fb.nonNullable.control(''),
    displayOrder: this.fb.nonNullable.control(0, [Validators.min(0)]),
    parentId: new FormControl<string | null>(null),
    isActive: this.fb.nonNullable.control(true)
  });

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    try {
      const response = await firstValueFrom(this.api.getAll(this.includeArchived()));
      this.categories.set(response.data ?? []);
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected toggleArchived(checked: boolean): void {
    this.includeArchived.set(checked);
    void this.load();
  }

  protected openNew(): void {
    this.editing.set(null);
    this.otherErrors.set([]);
    this.form.reset({ name: '', nameAr: '', description: '', iconUrl: '', displayOrder: this.categories().length + 1, parentId: null, isActive: true });
    this.formOpen.set(true);
  }

  protected edit(category: CategoryDto): void {
    this.editing.set(category);
    this.otherErrors.set([]);
    this.form.reset({
      name: category.name,
      nameAr: category.nameAr ?? '',
      description: category.description ?? '',
      iconUrl: category.iconUrl ?? '',
      displayOrder: category.displayOrder,
      parentId: category.parentId,
      isActive: category.isActive
    });
    this.formOpen.set(true);
  }

  protected cancel(): void {
    this.formOpen.set(false);
    this.editing.set(null);
  }

  protected label(category: CategoryDto): string {
    return this.translation.localized(category.name, category.nameAr);
  }

  protected errorText(name: string): string {
    const errors = this.form.get(name)?.errors;
    if (!errors) { return ''; }
    if (errors['server']) { return String(errors['server']); }
    if (errors['required']) { return this.translation.t('form.required'); }
    if (errors['minlength']) { return `${this.translation.t('form.minLength')} ${errors['minlength'].requiredLength}`; }
    if (errors['maxlength']) { return `${this.translation.t('form.maxLength')} ${errors['maxlength'].requiredLength}`; }
    if (errors['min']) { return this.translation.t('form.nonNegative'); }
    return '';
  }

  protected async save(): Promise<void> {
    this.otherErrors.set([]);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) {
      return;
    }

    const value = this.form.getRawValue();
    const request: CategoryRequest = {
      name: value.name.trim(),
      nameAr: value.nameAr.trim(),
      description: value.description.trim(),
      iconUrl: value.iconUrl.trim() || null,
      displayOrder: value.displayOrder ?? 0,
      parentId: value.parentId || null,
      isActive: value.isActive
    };

    this.saving.set(true);
    try {
      const current = this.editing();
      const response = current
        ? await firstValueFrom(this.api.update(current.id, request))
        : await firstValueFrom(this.api.create(request));
      this.toast.showSuccess(response.message || this.translation.t('category.saved'));
      this.cancel();
      await this.load();
    } catch (error) {
      this.otherErrors.set(applyServerErrors(this.form, error));
    } finally {
      this.saving.set(false);
    }
  }

  protected canMove(category: CategoryDto, direction: -1 | 1): boolean {
    const list = this.activeList();
    const index = list.findIndex((item) => item.id === category.id);
    return index >= 0 && index + direction >= 0 && index + direction < list.length;
  }

  protected async move(category: CategoryDto, direction: -1 | 1): Promise<void> {
    if (!this.canMove(category, direction)) {
      return;
    }

    const ids = this.activeList().map((item) => item.id);
    const index = ids.indexOf(category.id);
    [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
    await this.run(() => firstValueFrom(this.api.reorder(ids)));
  }

  protected setActive(category: CategoryDto, isActive: boolean): Promise<void> {
    return this.run(() => firstValueFrom(this.api.setActive(category.id, isActive)));
  }

  protected async archive(category: CategoryDto): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.translation.t('category.archiveTitle'),
      message: this.translation.t('category.archiveMessage'),
      confirmLabel: this.translation.t('category.archive'),
      cancelLabel: this.translation.t('common.cancel')
    });
    if (confirmed) {
      await this.run(() => firstValueFrom(this.api.archive(category.id)));
    }
  }

  protected restore(category: CategoryDto): Promise<void> {
    return this.run(() => firstValueFrom(this.api.restore(category.id)));
  }

  private activeList(): CategoryDto[] {
    return this.categories().filter((category) => !category.isArchived);
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
