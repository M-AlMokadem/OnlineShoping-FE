import { CurrencyPipe, KeyValuePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IconComponent } from '../../components/icon/icon.component';
import { PageStateComponent } from '../../components/page-state/page-state.component';
import { ProductImageComponent } from '../../components/product-image/product-image.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';
import { ProductDto } from '../../models/product.model';
import { CatalogueApiService } from '../../services/catalogue-api.service';
import { CartService, toCartItem } from '../../services/cart.service';
import { CompareSelectionService } from '../../services/compare-selection.service';
import { ToastService } from '../../services/toast.service';
import { WishlistService } from '../../services/wishlist.service';
import { discountPercent } from '../../utils/product-display';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CurrencyPipe, KeyValuePipe, RouterLink, IconComponent, PageStateComponent, ProductImageComponent, TranslatePipe],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css'
})
export class ProductDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CatalogueApiService);
  private readonly toast = inject(ToastService);
  private readonly cart = inject(CartService);

  protected readonly translation = inject(TranslationService);
  protected readonly compare = inject(CompareSelectionService);
  protected readonly wishlist = inject(WishlistService);
  protected readonly product = signal<ProductDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly quantity = signal(1);
  protected readonly discountPercent = discountPercent;
  protected readonly inStock = computed(() => {
    const product = this.product();
    return !!product && product.availability !== 'OutOfStock' && product.stockQuantity > 0;
  });
  protected readonly maxQuantity = computed(() => Math.max(this.product()?.stockQuantity ?? 1, 1));

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

  protected changeQuantity(delta: number): void {
    this.quantity.update((value) => Math.min(Math.max(value + delta, 1), this.maxQuantity()));
  }

  protected addToCart(product: ProductDto): void {
    const result = this.cart.add(toCartItem(product), this.quantity());
    if (result === 'added') {
      this.toast.showSuccess(this.translation.t('cart.added'));
    } else if (result === 'limit') {
      this.toast.showError(this.translation.t('cart.maxReached'));
    } else {
      this.toast.showError(this.translation.t('cart.unavailable'));
    }
  }

  protected toggleWishlist(product: ProductDto): void {
    const added = this.wishlist.toggle(product);
    this.toast.showSuccess(this.translation.t(added ? 'wishlist.added' : 'wishlist.removed'));
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
