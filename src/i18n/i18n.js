import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from './translations.js';
import { getItem, storageKeys, subscribe, updateProfile } from '../utils/storageUtils.js';
import { translateText } from '../utils/translateUtils.js';

function normalizeLang(input) {
  const raw = String(input || '').trim().toLowerCase();
  if (raw.startsWith('te') || raw.includes('telugu') || raw.includes('తెలుగు')) return 'te';
  if (raw.startsWith('kn') || raw.includes('kannada') || raw.includes('ಕನ್ನಡ')) return 'kn';
  if (raw.startsWith('ml') || raw.includes('malayalam') || raw.includes('മലയാള')) return 'ml';
  if (raw.startsWith('mr') || raw.includes('marathi') || raw.includes('मराठी')) return 'mr';
  if (raw.startsWith('bn') || raw.includes('bengali') || raw.includes('বাংলা')) return 'bn';
  if (raw.startsWith('ta') || raw.includes('tamil') || raw.includes('தமிழ்')) return 'ta';
  if (raw.startsWith('hi') || raw.includes('hindi') || raw.includes('हिंदी')) return 'hi';
  return 'en';
}

function languageLabelFromCode(code) {
  const l = normalizeLang(code);
  if (l === 'ta') return 'Tamil';
  if (l === 'hi') return 'Hindi';
  if (l === 'te') return 'Telugu';
  if (l === 'kn') return 'Kannada';
  if (l === 'ml') return 'Malayalam';
  if (l === 'mr') return 'Marathi';
  if (l === 'bn') return 'Bengali';
  return 'English';
}

function deepGet(obj, path) {
  const parts = String(path || '').split('.').filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

const I18nContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key, fallback) => fallback || key,
  ta: (text) => text
});

export function I18nProvider({ children }) {
  const [profile, setProfile] = useState(() => getItem(storageKeys.profile, { language: 'English' }));
  const [, bump] = useState(0);

  useEffect(() => subscribe(storageKeys.profile, setProfile), []);

  const lang = useMemo(() => normalizeLang(profile?.language), [profile?.language]);

  const setLang = (nextLang) => {
    const normalized = normalizeLang(nextLang);
    const label = languageLabelFromCode(normalized);
    updateProfile((p) => ({ ...(p ?? {}), language: label }));
  };

  const ta = useMemo(() => {
    const cacheStorageKey = 'elderai.i18n.runtimeCache.v1';
    const inFlight = new Set();
    const cache = new Map();

    try {
      const raw = localStorage.getItem(cacheStorageKey);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === 'object') {
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'string') cache.set(k, v);
        }
      }
    } catch {
      // ignore
    }

    const persist = () => {
      try {
        const obj = Object.fromEntries(cache.entries());
        localStorage.setItem(cacheStorageKey, JSON.stringify(obj));
      } catch {
        // ignore
      }
    };

    const keyFor = (text) => `${lang}||${String(text || '')}`;

    return (text) => {
      const src = String(text ?? '');
      if (!src) return '';
      if (lang === 'en') return src;

      const k = keyFor(src);
      const cached = cache.get(k);
      if (cached) return cached;

      if (!inFlight.has(k)) {
        inFlight.add(k);
        translateText({ text: src, from: 'en', to: lang })
          .then((out) => {
            const translated = String(out || '').trim();
            if (translated && translated !== src) {
              cache.set(k, translated);
              persist();
              bump((n) => (n + 1) % 100000);
            }
          })
          .finally(() => {
            inFlight.delete(k);
          });
      }

      return src;
    };
  }, [lang]);

  const t = useMemo(() => {
    const dict = translations[lang] || translations.en;
    return (key, fallback) => {
      const val = deepGet(dict, key);
      if (typeof val === 'string') return val;

      const enVal = deepGet(translations.en, key);
      if (typeof enVal === 'string') {
        return lang === 'en' ? enVal : ta(enVal);
      }

      return fallback ?? key;
    };
  }, [lang, ta]);

  const value = useMemo(() => ({ lang, setLang, t, ta }), [lang, t, ta]);

  return React.createElement(I18nContext.Provider, { value }, children);
}

export function useI18n() {
  return useContext(I18nContext);
}

export function langToSpeechLocale(lang) {
  const l = normalizeLang(lang);
  if (l === 'ta') return 'ta-IN';
  if (l === 'hi') return 'hi-IN';
  if (l === 'te') return 'te-IN';
  if (l === 'kn') return 'kn-IN';
  if (l === 'ml') return 'ml-IN';
  if (l === 'mr') return 'mr-IN';
  if (l === 'bn') return 'bn-IN';
  return 'en-IN';
}

export function langLabel(lang) {
  return languageLabelFromCode(lang);
}

