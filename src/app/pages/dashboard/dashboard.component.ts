import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IconComponent } from '../../components/icon/icon.component';
import { PageStateComponent } from '../../components/page-state/page-state.component';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { TranslationService } from '../../i18n/translation.service';
import { DashboardActivity, DashboardSummary } from '../../models/dashboard.model';
import { DashboardApiService } from '../../services/dashboard-api.service';

const MAX_CATEGORY_BARS = 8;

const TIME_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000]
];

export function activityLabelKey(activity: Pick<DashboardActivity, 'action' | 'field'>): string {
  if (activity.action === 'Created') { return 'dash.act.created'; }
  if (activity.action === 'StatusChanged') { return 'dash.act.status'; }
  const field = activity.field?.toLowerCase() ?? '';
  if (field.includes('price')) { return 'dash.act.price'; }
  if (field.includes('stock')) { return 'dash.act.stock'; }
  if (field === 'status') { return 'dash.act.status'; }
  return 'dash.act.updated';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, IconComponent, PageStateComponent, TranslatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private readonly api = inject(DashboardApiService);

  protected readonly translation = inject(TranslationService);
  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  protected readonly kpis = computed(() => {
    const data = this.summary();
    if (!data) {
      return [];
    }
    return [
      { key: 'dash.totalProducts', icon: 'box', tone: 'purple', value: data.totalProducts, hint: this.translation.t('dash.totalHint') },
      { key: 'dash.activeProducts', icon: 'check', tone: 'green', value: data.publishedProducts, hint: this.translation.t('dash.activeHint') },
      { key: 'dash.lowStock', icon: 'alert', tone: 'amber', value: data.lowStockProducts, hint: this.translation.t('dash.lowStockHint').replace('{n}', String(data.lowStockThreshold)) },
      { key: 'dash.outOfStock', icon: 'close', tone: 'red', value: data.outOfStockProducts, hint: this.translation.t('dash.outHint') }
    ];
  });

  protected readonly categoryBars = computed(() => {
    const rows = (this.summary()?.productsByCategory ?? []).slice(0, MAX_CATEGORY_BARS);
    const max = Math.max(...rows.map((row) => row.count), 1);
    return rows.map((row) => ({
      id: row.categoryId,
      label: this.translation.localized(row.name, row.nameAr),
      count: row.count,
      percent: Math.round((row.count / max) * 100)
    }));
  });

  protected readonly statusBars = computed(() => {
    const data = this.summary();
    if (!data) {
      return [];
    }
    const rows = [
      { status: 'Published', count: data.publishedProducts },
      { status: 'Draft', count: data.draftProducts },
      { status: 'Inactive', count: data.inactiveProducts },
      { status: 'Archived', count: data.archivedProducts }
    ];
    const total = Math.max(data.totalProducts, 1);
    return rows.map((row) => ({ ...row, percent: Math.round((row.count / total) * 100) }));
  });

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    try {
      const response = await firstValueFrom(this.api.getSummary());
      this.summary.set(response.data);
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected activityLabel(activity: DashboardActivity): string {
    return this.translation.t(activityLabelKey(activity));
  }

  protected activityIcon(activity: DashboardActivity): string {
    const key = activityLabelKey(activity);
    if (key === 'dash.act.created') { return 'plus'; }
    if (key === 'dash.act.price') { return 'tag'; }
    if (key === 'dash.act.stock') { return 'box'; }
    if (key === 'dash.act.status') { return 'refresh'; }
    return 'edit';
  }

  protected relativeTime(iso: string): string {
    const diff = new Date(iso).getTime() - Date.now();
    const formatter = new Intl.RelativeTimeFormat(this.translation.language(), { numeric: 'auto' });
    for (const [unit, size] of TIME_UNITS) {
      if (Math.abs(diff) >= size) {
        return formatter.format(Math.trunc(diff / size), unit);
      }
    }
    return formatter.format(0, 'second');
  }
}
