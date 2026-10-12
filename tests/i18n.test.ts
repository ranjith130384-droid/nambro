import { describe, it, expect } from 'vitest';
import { dictionaries, getDictionary, Locale } from '../lib/i18n/dictionaries';

describe('i18n Dictionaries', () => {
  const locales: Locale[] = ['en', 'hi', 'ta', 'ml'];

  it('supports all 4 core languages', () => {
    locales.forEach((locale) => {
      const dict = getDictionary(locale);
      expect(dict).toBeDefined();
      expect(dict.dashboard.roomMatrix).toBeDefined();
      expect(dict.dashboard.messCounter).toBeDefined();
      expect(dict.portal.identityPass).toBeDefined();
    });
  });

  it('falls back to English for unknown locales', () => {
    // @ts-expect-error testing invalid locale
    const dict = getDictionary('fr');
    expect(dict.dashboard.roomMatrix).toBe('Room Matrix');
  });
});
