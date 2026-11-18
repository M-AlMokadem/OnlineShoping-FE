import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup } from '@angular/forms';
import { ErrorResult } from '../models/error-result.model';

// Sets server validation messages on matching controls and returns messages for unmatched fields.
export function applyServerErrors(form: FormGroup, error: unknown, ignore: string[] = []): string[] {
  const payload = (error as HttpErrorResponse)?.error as ErrorResult | undefined;
  const fieldErrors = payload?.data?.errors;
  if (!fieldErrors || typeof fieldErrors !== 'object') {
    return [];
  }

  const unmatched: string[] = [];
  for (const [field, messages] of Object.entries(fieldErrors)) {
    const controlName = Object.keys(form.controls).find((name) => name.toLowerCase() === field.toLowerCase() && !ignore.includes(name));
    const control = controlName ? form.get(controlName) : null;
    if (control) {
      control.setErrors({ server: messages[0] });
      control.markAsTouched();
    } else {
      unmatched.push(...messages);
    }
  }
  return unmatched;
}
