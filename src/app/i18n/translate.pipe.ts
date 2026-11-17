import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from './translation.service';

// Impure so it re-evaluates when the language signal changes.
@Pipe({ name: 't', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly translation = inject(TranslationService);

  transform(key: string): string {
    return this.translation.t(key);
  }
}
