import { CurrencyPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';
import { ProductDto } from '../../models/product.model';
import { CartService, toCartItem } from '../../services/cart.service';
import { CompareSelectionService } from '../../services/compare-selection.service';
import { ToastService } from '../../services/toast.service';
import { WishlistService } from '../../services/wishlist.service';
import { discountPercent, isNewProduct } from '../../utils/product-display';
import { IconComponent } from '../icon/icon.component';
import { ProductImageComponent } from '../product-image/product-image.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, IconComponent, ProductImageComponent, TranslatePipe],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCardComponent {
  private readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);

  protected readonly translation = inject(TranslationService);
  protected readonly wishlist = inject(WishlistService);
  protected readonly compare = inject(CompareSelectionService);

  readonly product = input.required<ProductDto>();
  readonly showCompare = input(true);

  protected readonly discountPercent = discountPercent;
  protected readonly isNew = isNewProduct;

  protected addToCart(): void {
    const result = this.cart.add(toCartItem(this.product()));
    if (result === 'added') {
      this.toast.showSuccess(this.translation.t('cart.added'));
    } else if (result === 'limit') {
      this.toast.showError(this.translation.t('cart.maxReached'));
    } else {
      this.toast.showError(this.translation.t('cart.unavailable'));
    }
  }

  protected toggleWishlist(): void {
    const added = this.wishlist.toggle(this.product());
    this.toast.showSuccess(this.translation.t(added ? 'wishlist.added' : 'wishlist.removed'));
  }

  protected toggleCompare(): void {
    const result = this.compare.toggle(this.product());
    if (result === 'limit') {
      this.toast.showError(this.translation.t('compare.limit'));
    } else if (result === 'category') {
      this.toast.showError(this.translation.t('compare.sameCategory'));
    }
  }
}
