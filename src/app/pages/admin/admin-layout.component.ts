import { Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { IconComponent } from '../../components/icon/icon.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';
import { PERMISSIONS } from '../../models/permissions';
import { AuthService } from '../../services/auth.service';

interface AdminNavItem {
  key: string;
  icon: string;
  link?: string;
  exact?: boolean;
  permission?: string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { key: 'dashboard', icon: 'dashboard', link: '/admin', exact: true, permission: PERMISSIONS.productsView },
  { key: 'products', icon: 'box', link: '/admin/products', permission: PERMISSIONS.productsView },
  { key: 'categories', icon: 'grid', link: '/admin/categories', permission: PERMISSIONS.categoriesManage },
  { key: 'brands', icon: 'tag', link: '/admin/brands', permission: PERMISSIONS.brandsManage },
  { key: 'users', icon: 'users', link: '/admin/users', permission: PERMISSIONS.usersManage }
];

export const ADMIN_SOON_ITEMS: AdminNavItem[] = [
  { key: 'inventory', icon: 'clipboard' },
  { key: 'orders', icon: 'cart' },
  { key: 'customers', icon: 'user' },
  { key: 'promotions', icon: 'percent' },
  { key: 'reports', icon: 'chart' },
  { key: 'settings', icon: 'settings' }
];

export function adminTitleKey(url: string): string {
  const path = url.split(/[?#]/)[0].replace(/^\/admin\/?/, '');
  if (path === 'products/new') { return 'adm.title.productNew'; }
  if (path.startsWith('products/')) { return 'adm.title.productEdit'; }
  const section = path.split('/')[0];
  return `adm.title.${section || 'dashboard'}`;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, TranslatePipe],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  protected readonly translation = inject(TranslationService);
  protected readonly currentUser = this.auth.currentUser;
  protected readonly soonItems = ADMIN_SOON_ITEMS;
  protected readonly menuOpen = signal(false);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects)
    ),
    { initialValue: this.location.path() }
  );

  protected readonly navItems = computed(() => ADMIN_NAV_ITEMS.filter((item) => !item.permission || this.auth.hasPermission(item.permission)));
  protected readonly titleKey = computed(() => adminTitleKey(this.url()));
  protected readonly initials = computed(() =>
    (this.currentUser()?.fullName ?? '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
  );
  protected readonly roleLabel = computed(() => this.currentUser()?.roles?.[0] ?? '');

  protected logout(): void {
    void this.auth.logout();
  }
}
