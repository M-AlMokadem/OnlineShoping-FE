import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IconComponent } from '../../components/icon/icon.component';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';
import { CategoryDto } from '../../models/category-brand.model';
import { ProductDto } from '../../models/product.model';
import { CatalogueApiService } from '../../services/catalogue-api.service';
import { StorefrontService } from '../../services/storefront.service';

const FEATURED_COUNT = 10;
const CATEGORY_TILE_COUNT = 6;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, IconComponent, ProductCardComponent, TranslatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private readonly api = inject(CatalogueApiService);
  private readonly storefront = inject(StorefrontService);

  protected readonly translation = inject(TranslationService);
  protected readonly featured = signal<ProductDto[]>([]);
  protected readonly loading = signal(true);
  protected readonly tiles = computed(() => this.storefront.topLevelCategories().slice(0, CATEGORY_TILE_COUNT));
  protected readonly trust = [
    { icon: 'truck', title: 'home.trust.delivery', text: 'home.trust.deliveryText' },
    { icon: 'shield', title: 'home.trust.payment', text: 'home.trust.paymentText' },
    { icon: 'refresh', title: 'home.trust.returns', text: 'home.trust.returnsText' },
    { icon: 'badge', title: 'home.trust.brands', text: 'home.trust.brandsText' }
  ];

  async ngOnInit(): Promise<void> {
    void this.storefront.load();
    try {
      const response = await firstValueFrom(this.api.browse({ sortBy: 'updated', sortDirection: 'desc' }, 1, FEATURED_COUNT));
      this.featured.set(response.data?.items ?? []);
    } catch {
      this.featured.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  protected categoryName(category: CategoryDto): string {
    return this.translation.localized(category.name, category.nameAr);
  }

  protected categoryIcon(category: CategoryDto): string {
    const name = category.name.toLowerCase();
    if (name.includes('phone') && !name.includes('head')) { return 'phone'; }
    if (name.includes('tablet')) { return 'tablet'; }
    if (name.includes('laptop') || name.includes('notebook')) { return 'laptop'; }
    if (name.includes('audio') || name.includes('head')) { return 'headphones'; }
    if (name.includes('watch') || name.includes('wear')) { return 'watch'; }
    if (name.includes('home') || name.includes('speaker')) { return 'speaker'; }
    if (name.includes('charg') || name.includes('cable')) { return 'plug'; }
    if (name.includes('accessor') || name.includes('case')) { return 'case'; }
    return 'package';
  }
}
