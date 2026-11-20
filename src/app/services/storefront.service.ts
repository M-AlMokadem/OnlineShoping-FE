import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CategoryDto } from '../models/category-brand.model';
import { CatalogueApiService } from './catalogue-api.service';

@Injectable({ providedIn: 'root' })
export class StorefrontService {
  private readonly api = inject(CatalogueApiService);
  private loading: Promise<void> | null = null;

  readonly categories = signal<CategoryDto[]>([]);
  // Ordered tree-wise: each top-level category followed by its sub-categories.
  readonly visibleCategories = computed(() => {
    const active = this.categories().filter((category) => category.isActive && !category.isArchived);
    const byOrder = (a: CategoryDto, b: CategoryDto) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name);
    const ids = new Set(active.map((category) => category.id));
    const roots = active.filter((category) => !category.parentId || !ids.has(category.parentId)).sort(byOrder);
    return roots.flatMap((root) => [root, ...active.filter((category) => category.parentId === root.id).sort(byOrder)]);
  });

  readonly topLevelCategories = computed(() => {
    const visible = this.visibleCategories();
    const ids = new Set(visible.map((category) => category.id));
    return visible.filter((category) => !category.parentId || !ids.has(category.parentId));
  });

  load(): Promise<void> {
    this.loading ??= firstValueFrom(this.api.getCategories())
      .then((response) => this.categories.set(response.data ?? []))
      .catch(() => {
        this.loading = null;
      });
    return this.loading;
  }
}
