/// <reference types="jasmine" />

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardComponent, activityLabelKey } from './dashboard.component';

const summary = {
  totalProducts: 10, publishedProducts: 6, draftProducts: 2, inactiveProducts: 1, archivedProducts: 1,
  lowStockProducts: 3, outOfStockProducts: 2, lowStockThreshold: 5, totalCategories: 2, totalBrands: 1,
  productsByCategory: [{ categoryId: 'c1', name: 'Phones', nameAr: '', count: 4 }, { categoryId: 'c2', name: 'Audio', nameAr: '', count: 2 }],
  recentActivities: [
    { productId: 'p1', productName: 'iPhone 15', action: 'Created', field: 'status', oldValue: null, newValue: 'Draft', userName: 'Admin', createdOnUtc: new Date().toISOString() },
    { productId: 'p1', productName: 'iPhone 15', action: 'Updated', field: 'price', oldValue: '1', newValue: '2', userName: null, createdOnUtc: new Date().toISOString() }
  ]
};

describe('DashboardComponent', () => {
  it('renders KPI values, category bars and recent activities', async () => {
    TestBed.configureTestingModule({ imports: [DashboardComponent], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const httpTesting = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    httpTesting.expectOne('http://localhost:5186/api/dashboard/summary').flush({ success: true, data: summary });
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const values = Array.from(element.querySelectorAll('.kpi-value')).map((node) => node.textContent?.trim());
    expect(values).toEqual(['10', '6', '3', '2']);
    expect(element.querySelectorAll('[data-testid="category-bars"] li').length).toBe(2);
    const activities = element.querySelectorAll('[data-testid="activities"] li');
    expect(activities.length).toBe(2);
    expect(activities[0].textContent).toContain('iPhone 15');
    expect(activities[0].textContent).toContain('Admin');
    httpTesting.verify();
  });

  it('maps audit entries to activity labels', () => {
    expect(activityLabelKey({ action: 'Created', field: 'status' })).toBe('dash.act.created');
    expect(activityLabelKey({ action: 'Updated', field: 'price' })).toBe('dash.act.price');
    expect(activityLabelKey({ action: 'Updated', field: 'stockQuantity' })).toBe('dash.act.stock');
    expect(activityLabelKey({ action: 'StatusChanged', field: 'status' })).toBe('dash.act.status');
    expect(activityLabelKey({ action: 'Updated', field: 'name' })).toBe('dash.act.updated');
  });
});
