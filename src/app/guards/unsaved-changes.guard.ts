import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { TranslationService } from '../i18n/translation.service';
import { ConfirmDialogService } from '../services/confirm-dialog.service';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  if (!component.hasUnsavedChanges()) {
    return true;
  }

  const translation = inject(TranslationService);
  return inject(ConfirmDialogService).confirm({
    title: translation.t('form.unsavedTitle'),
    message: translation.t('form.unsavedMessage'),
    confirmLabel: translation.t('form.leave'),
    cancelLabel: translation.t('form.stay')
  });
};
