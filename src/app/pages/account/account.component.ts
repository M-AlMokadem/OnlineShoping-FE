import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { IconComponent } from '../../components/icon/icon.component';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { AuthService } from '../../services/auth.service';
import { WishlistService } from '../../services/wishlist.service';

export const ACCOUNT_TABS = [
  { id: 'orders', icon: 'package', label: 'account.orders' },
  { id: 'addresses', icon: 'pin', label: 'account.addresses' },
  { id: 'wishlist', icon: 'heart', label: 'account.wishlist' },
  { id: 'settings', icon: 'settings', label: 'account.settings' },
  { id: 'notifications', icon: 'bell', label: 'account.notifications' },
  { id: 'help', icon: 'help', label: 'account.help' }
];

export const ORDER_STATUSES = ['all', 'processing', 'delivered', 'cancelled'];

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [RouterLink, IconComponent, ProductCardComponent, TranslatePipe],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly wishlist = inject(WishlistService);
  protected readonly user = this.auth.currentUser;
  protected readonly tabs = ACCOUNT_TABS;
  protected readonly statuses = ORDER_STATUSES;
  protected readonly orderStatus = signal('all');
  protected readonly initial = computed(() => (this.user()?.fullName?.trim()[0] ?? '').toUpperCase());
  protected readonly tab = toSignal(
    this.route.queryParamMap.pipe(map((params) => {
      const requested = params.get('tab') ?? 'orders';
      return ACCOUNT_TABS.some((entry) => entry.id === requested) ? requested : 'orders';
    })),
    { initialValue: 'orders' });
  protected readonly activeLabel = computed(() => ACCOUNT_TABS.find((entry) => entry.id === this.tab())?.label ?? 'account.orders');

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/');
  }
}
