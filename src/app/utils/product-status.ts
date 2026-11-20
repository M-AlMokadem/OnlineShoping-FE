import { PERMISSIONS } from '../models/permissions';
import { ProductDto, ProductStatus } from '../models/product.model';

export const LOW_STOCK_THRESHOLD = 5;

export interface StatusAction {
  status: ProductStatus;
  labelKey: string;
  icon: string;
  primary: boolean;
}

export function statusActionsFor(current: ProductStatus | null, can: (permission: string) => boolean): StatusAction[] {
  if (!current) {
    return [];
  }

  const canPublish = can(PERMISSIONS.productsPublish);
  const canArchive = can(PERMISSIONS.productsArchive);
  const canDeactivate = canPublish || can(PERMISSIONS.productsEdit);
  const actions: StatusAction[] = [];

  if (current === 'Archived') {
    if (canArchive) { actions.push({ status: 'Inactive', labelKey: 'product.restore', icon: 'restore', primary: true }); }
    return actions;
  }
  if ((current === 'Draft' || current === 'Inactive') && canPublish) {
    actions.push({ status: 'Published', labelKey: 'product.publish', icon: 'check', primary: true });
  }
  if ((current === 'Draft' || current === 'Published') && canDeactivate) {
    actions.push({ status: 'Inactive', labelKey: 'product.deactivate', icon: 'close', primary: false });
  }
  if (canArchive) {
    actions.push({ status: 'Archived', labelKey: 'product.archive', icon: 'archive', primary: false });
  }
  return actions;
}

export function statusPillClass(status: ProductStatus): string {
  switch (status) {
    case 'Published': return 'pill-success';
    case 'Inactive': return 'pill-warning';
    case 'Archived': return 'pill-dark';
    default: return 'pill-muted';
  }
}

export function stockLevel(product: Pick<ProductDto, 'status' | 'stockQuantity'>): 'out' | 'low' | null {
  if (product.status !== 'Published') {
    return null;
  }
  if (product.stockQuantity <= 0) {
    return 'out';
  }
  return product.stockQuantity <= LOW_STOCK_THRESHOLD ? 'low' : null;
}
