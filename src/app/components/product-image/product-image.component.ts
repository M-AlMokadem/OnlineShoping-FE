import { Component, input, signal } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-product-image',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (src() && !failed()) {
      <img [src]="src()" [alt]="alt()" [attr.loading]="eager() ? 'eager' : 'lazy'" (error)="failed.set(true)">
    } @else {
      <span class="placeholder"><app-icon name="image"></app-icon></span>
    }
  `,
  styles: [`
    :host { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #f1f2f6; }
    img { width: 100%; height: 100%; object-fit: contain; }
    .placeholder { color: #b4b9c9; font-size: 2.4rem; display: inline-flex; }
  `]
})
export class ProductImageComponent {
  readonly src = input<string | null>(null);
  readonly alt = input('');
  readonly eager = input(false);
  protected readonly failed = signal(false);
}
