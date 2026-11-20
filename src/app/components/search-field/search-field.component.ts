import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-search-field',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    @if (variant === 'pill') {
      <form class="pill-form" role="search" (ngSubmit)="submitted.emit()">
        <input type="search" [placeholder]="placeholder" [attr.aria-label]="label" [name]="name" [ngModel]="value" (ngModelChange)="valueChanged($event)">
        <button type="submit" class="pill-submit" [attr.aria-label]="label">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        </button>
      </form>
    } @else {
    <form class="search-form" (ngSubmit)="submitted.emit()">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>{{ label }}</mat-label>
        <input matInput type="search" [placeholder]="placeholder" [name]="name" [ngModel]="value" (ngModelChange)="valueChanged($event)">
        @if (value) {
          <button mat-icon-button matSuffix type="button" aria-label="Clear search" (click)="clear()">
            <mat-icon>close</mat-icon>
          </button>
        }
      </mat-form-field>
      <button mat-flat-button type="submit">Search</button>
    </form>
    }
  `,
  styles: [`
    :host { display: block; }
    .search-form { display: flex; gap: 0.6rem; align-items: flex-start; }
    mat-form-field { width: 260px; }
    .pill-form { position: relative; display: flex; align-items: center; }
    .pill-form input { width: 100%; box-sizing: border-box; padding: 0.7rem 1.1rem; padding-inline-end: 2.8rem; border: 1px solid var(--border, #e6e8ee); border-radius: 999px; background: var(--bg, #f5f6f8); font: inherit; font-size: 0.9rem; color: inherit; outline: none; }
    .pill-form input:focus { border-color: var(--brand, #e60000); background: #ffffff; }
    .pill-submit { position: absolute; inset-inline-end: 0.9rem; display: grid; place-items: center; border: 0; background: none; color: var(--text-muted, #6b7185); cursor: pointer; padding: 0; }
    @media (max-width: 900px) {
      .search-form { width: 100%; }
      mat-form-field { flex: 1; width: auto; }
    }
  `]
})
export class SearchFieldComponent {
  @Input() label = 'Search';
  @Input() placeholder = '';
  @Input() name = 'search';
  @Input() variant: 'default' | 'pill' = 'default';
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() submitted = new EventEmitter<void>();

  clear(): void {
    this.value = '';
    this.valueChange.emit(this.value);
    this.submitted.emit();
  }

  valueChanged(value: string): void {
    this.value = value;
    this.valueChange.emit(value);
  }
}
