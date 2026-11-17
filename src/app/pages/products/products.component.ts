import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ProductDto, ProductsApiService } from '../../services/products-api.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent {
  private readonly productsApi = inject(ProductsApiService);
  private readonly toast = inject(ToastService);

  protected readonly products = signal<ProductDto[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly loadError = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected formValue = { name: '', description: '', price: 0, isActive: true };
  protected readonly pageNumber = signal(1);
  protected readonly totalPages = signal(1);

  constructor() {
    void this.loadProducts();
  }

  protected async search(): Promise<void> {
    this.pageNumber.set(1);
    await this.loadProducts();
  }

  protected edit(product: ProductDto): void {
    this.editingId.set(product.id);
    this.formValue = { name: product.name, description: product.description, price: product.price, isActive: product.isActive };
  }

  protected resetForm(): void {
    this.editingId.set(null);
    this.formValue = { name: '', description: '', price: 0, isActive: true };
  }

  protected async save(): Promise<void> {
    const value = this.formValue;
    if (!value.name.trim() || value.price < 0) {
      return;
    }

    this.isSaving.set(true);
    try {
      const request = { ...value, name: value.name.trim(), description: value.description.trim() };
      if (this.editingId()) {
        await firstValueFrom(this.productsApi.update(this.editingId()!, request));
        this.toast.showSuccess('Product updated successfully.');
      } else {
        await firstValueFrom(this.productsApi.create(request));
        this.toast.showSuccess('Product created successfully.');
      }
      this.resetForm();
      await this.loadProducts();
    } finally {
      this.isSaving.set(false);
    }
  }

  protected async remove(product: ProductDto): Promise<void> {
    if (!window.confirm(`Delete ${product.name}?`)) {
      return;
    }

    await firstValueFrom(this.productsApi.remove(product.id));
    this.toast.showSuccess('Product deleted successfully.');
    await this.loadProducts();
  }

  protected async previousPage(): Promise<void> {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((page) => page - 1);
      await this.loadProducts();
    }
  }

  protected async nextPage(): Promise<void> {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.update((page) => page + 1);
      await this.loadProducts();
    }
  }

  private async loadProducts(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(false);
    try {
      const result = await firstValueFrom(this.productsApi.getPaged(this.pageNumber(), 10, this.searchTerm().trim()));
      this.products.set(result.data.items ?? []);
      this.pageNumber.set(result.data.pageNumber ?? 1);
      this.totalPages.set(Math.max(result.data.totalPages ?? 1, 1));
    } catch {
      this.products.set([]);
      this.loadError.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }
}
