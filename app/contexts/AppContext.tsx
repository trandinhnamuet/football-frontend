'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Lang } from '../lib/i18n';
import { api } from '../lib/api';

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
    } else if (typeof overrides[key] === 'string' && overrides[key] !== '') {
      result[key] = overrides[key];
    }
  }
  return result;
}

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('vi');
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [i18nData, setI18nData] = useState(translations);

  useEffect(() => {
    const savedLang = (localStorage.getItem('lffc_lang') as Lang) || 'vi';
    const savedTheme = (localStorage.getItem('lffc_theme') as 'dark' | 'light') || 'dark';
    setLangState(savedLang);
    setThemeState(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Fetch global i18n overrides from backend
    api.getI18n().then(overrides => {
      setI18nData({
        vi: deepMerge(translations.vi, overrides.vi),
        en: deepMerge(translations.en, overrides.en),
      });
    }).catch(() => {
      // Fallback to base translations if API unavailable
    });
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
