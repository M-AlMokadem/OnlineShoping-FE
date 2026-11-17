import { DOCUMENT } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Language, TRANSLATIONS } from './translations';

export const LANGUAGE_STORAGE_KEY = 'onlineshoping.language';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly language = signal<Language>(this.readStoredLanguage());
  readonly direction = computed(() => (this.language() === 'ar' ? 'rtl' : 'ltr'));

  constructor() {
    effect(() => {
      const language = this.language();
      const root = this.document.documentElement;
      root.lang = language;
      root.dir = language === 'ar' ? 'rtl' : 'ltr';
      if (this.isBrowser) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      }
    });
  }

  toggle(): void {
    this.language.update((language) => (language === 'en' ? 'ar' : 'en'));
  }

  set(language: Language): void {
    this.language.set(language);
  }

  // Reads the language signal, so templates and computeds re-evaluate when it changes.
  t(key: string): string {
    return TRANSLATIONS[this.language()][key] ?? TRANSLATIONS.en[key] ?? key;
  }

  // Returns the Arabic text when Arabic is active and present, otherwise the English fallback.
  localized(english: string, arabic: string): string {
    return this.language() === 'ar' && arabic?.trim() ? arabic : english;
  }

  private readStoredLanguage(): Language {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) {
      return 'en';
    }

    return localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'ar' ? 'ar' : 'en';
  }
}
