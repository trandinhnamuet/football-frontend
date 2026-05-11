'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Lang } from '../lib/i18n';

const I18N_STORAGE_KEY_VI = 'lffc_i18n_vi';
const I18N_STORAGE_KEY_EN = 'lffc_i18n_en';

interface AppContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextType>({
  lang: 'vi',
  setLang: () => {},
  theme: 'light',
  setTheme: () => {},
  t: (k) => k,
});

function deepMerge(base: any, overrides: any): any {
  if (!overrides || typeof overrides !== 'object') return base;
  const result = { ...base };
  for (const key of Object.keys(overrides)) {
    if (typeof overrides[key] === 'object' && overrides[key] !== null && !Array.isArray(overrides[key])) {
      result[key] = deepMerge(base[key] || {}, overrides[key]);
    } else {
      result[key] = overrides[key];
    }
  }
  return result;
}

function loadI18nOverrides(storageKey: string, defaults: any): any {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return defaults;
    return deepMerge(defaults, JSON.parse(saved));
  } catch {
    return defaults;
  }
}

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('vi');
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);
  const [i18nData, setI18nData] = useState(translations);

  useEffect(() => {
    const savedLang = (localStorage.getItem('lffc_lang') as Lang) || 'vi';
    const savedTheme = (localStorage.getItem('lffc_theme') as 'dark' | 'light') || 'dark';
    setLangState(savedLang);
    setThemeState(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    setI18nData({
      vi: loadI18nOverrides(I18N_STORAGE_KEY_VI, translations.vi),
      en: loadI18nOverrides(I18N_STORAGE_KEY_EN, translations.en),
    });
    setMounted(true);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem('lffc_lang', l);
  }

  function setTheme(t: 'dark' | 'light') {
    setThemeState(t);
    localStorage.setItem('lffc_theme', t);
    document.documentElement.setAttribute('data-theme', t);
  }

  function t(key: string): string {
    const parts = key.split('.');
    let obj: any = i18nData[lang];
    for (const p of parts) {
      obj = obj?.[p];
      if (obj === undefined) return key;
    }
    return typeof obj === 'string' ? obj : key;
  }

  return (
    <AppContext.Provider value={{ lang, setLang, theme, setTheme, t }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
