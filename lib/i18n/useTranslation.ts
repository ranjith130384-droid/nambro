'use client';

import { useState, useEffect } from 'react';
import { Locale, getDictionary } from './dictionaries';

type Dictionary = ReturnType<typeof getDictionary>;

/**
 * A simple dot-notation path resolver for nested objects.
 */
function resolvePath(obj: any, path: string): string | undefined {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : undefined;
  }, obj) as string | undefined;
}

export function useTranslation() {
  const [locale, setLocale] = useState<Locale>('en');
  const [dictionary, setDictionary] = useState<Dictionary>(getDictionary('en'));

  useEffect(() => {
    // In a real app, you would sync this with a cookie or user profile
    const savedLocale = (typeof window !== 'undefined' ? localStorage.getItem('preferred_locale') as Locale : null) || 'en';
    setLocale(savedLocale);
    setDictionary(getDictionary(savedLocale));
  }, []);

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    setDictionary(getDictionary(newLocale));
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred_locale', newLocale);
    }
  };

  const t = (key: string): string => {
    const translation = resolvePath(dictionary, key);
    if (translation) return translation;

    // Fallback to English
    const fallbackTranslation = resolvePath(getDictionary('en'), key);
    return fallbackTranslation || key;
  };

  const formatCurrency = (amount: number, currency: 'INR' | 'AED' = 'INR'): string => {
    return new Intl.NumberFormat(locale === 'en' ? 'en-IN' : `${locale}-IN`, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return { t, locale, changeLocale, formatCurrency };
}
