import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../components/icon/icon.component';
import { ProductImageComponent } from '../../components/product-image/product-image.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';
import { CartItem, CartService } from '../../services/cart.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, IconComponent, ProductImageComponent, TranslatePipe],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {
  private readonly toast = inject(ToastService);

  protected readonly cart = inject(CartService);
  protected readonly translation = inject(TranslationService);

  protected setQuantity(item: CartItem, delta: number): void {
    this.cart.setQuantity(item.productId, item.quantity + delta);
  }

  protected checkout(): void {
    this.toast.showSuccess(this.translation.t('cart.checkoutSoon'));
  }
}
