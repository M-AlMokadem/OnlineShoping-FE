import { Location, isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, afterNextRender, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { IconComponent } from './components/icon/icon.component';
import { NavUserComponent } from './components/nav-user/nav-user.component';
import { SearchFieldComponent } from './components/search-field/search-field.component';
import { TranslatePipe } from './i18n/translate.pipe';
import { TranslationService } from './i18n/translation.service';
import { PERMISSIONS } from './models/permissions';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';
import { CompareSelectionService } from './services/compare-selection.service';
import { StorefrontService } from './services/storefront.service';
import { WishlistService } from './services/wishlist.service';

const NAV_CATEGORY_LIMIT = 6;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, IconComponent, NavUserComponent, SearchFieldComponent, TranslatePipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly translation = inject(TranslationService);
  protected readonly compare = inject(CompareSelectionService);
  protected readonly cart = inject(CartService);
  protected readonly wishlist = inject(WishlistService);
  protected readonly storefront = inject(StorefrontService);
  protected readonly canViewProducts = computed(() => this.authService.hasPermission(PERMISSIONS.productsView));
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects)
    ),
    { initialValue: this.location.path() }
  );
  protected readonly isAdminRoute = computed(() => /^\/admin(?:[/?#]|$)/.test(this.currentUrl()));
  protected readonly navCategories = computed(() => this.storefront.topLevelCategories().slice(0, NAV_CATEGORY_LIMIT));
  protected readonly categoryMenuOpen = signal(false);
  protected searchTerm = '';

  constructor() {
    afterNextRender(() => {
      this.cart.hydrate();
      this.wishlist.hydrate();
    });
    void this.storefront.load();
    if (this.isBrowser && this.authService.isAuthenticated()) {
      this.authService.loadProfile().catch(() => undefined);
    }
  }

  protected submitSearch(): void {
    const search = this.searchTerm.trim();
    void this.router.navigate(['/catalogue'], { queryParams: search ? { search } : {} });
  }

  protected categoryName(name: string, nameAr: string): string {
    return this.translation.localized(name, nameAr);
  }
}
