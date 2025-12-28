import React, { useEffect, useState } from 'react';
import { HeartPulse, Shield, Users } from 'lucide-react';
import Navigation from './Navigation.jsx';
import StatusIndicator from '../shared/StatusIndicator.jsx';
import { getItem, storageKeys, subscribe } from '../../utils/storageUtils.js';
import { useI18n } from '../../i18n/i18n.js';

export default function Header({ highContrast = false, onToggleContrast }) {
  const { t, lang, setLang } = useI18n();
  const [status, setStatus] = useState(() => getItem(storageKeys.appStatus, { online: true, lastActiveISO: new Date().toISOString() }));
  const [online, setOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  useEffect(() => {
    return subscribe(storageKeys.appStatus, setStatus);
  }, []);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const lastActive = new Date(status.lastActiveISO);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight">{t('app.title')}</span>
              <span className="hidden items-center gap-2 text-sm text-slate-600 sm:flex">
                <StatusIndicator status={status.online ? 'active' : 'inactive'} />
                <span>{status.online ? t('status.online') : t('status.offline')}</span>
              </span>
            </div>
            <div className="hidden text-xs text-slate-500 sm:block">
              {t('status.lastActive')} {lastActive.toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {!online ? (
            <div className="flex items-center gap-2 rounded-xl bg-warning/10 px-3 py-2 text-sm font-semibold text-warning">
              <span className="h-2 w-2 rounded-full bg-warning" aria-hidden="true" /> {t('status.offline')}
            </div>
          ) : null}

          <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <span className="font-semibold">{t('header.language')}</span>
            <select
              className="rounded-lg bg-white px-2 py-1 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 focus:outline-none"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label={t('header.language')}
            >
              <option value="en">English</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
              <option value="ml">മലയാളം (Malayalam)</option>
              <option value="mr">मराठी (Marathi)</option>
              <option value="bn">বাংলা (Bengali)</option>
            </select>
          </label>

          <button
            className={
              'rounded-xl px-3 py-2 text-sm font-semibold transition focus:outline-none ' +
              (highContrast ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200')
            }
            onClick={onToggleContrast}
            aria-label={t('header.contrast')}
            type="button"
          >
            {t('header.contrast')}
          </button>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <Users className="h-4 w-4" aria-hidden="true" />
            <span className="font-semibold">{t('header.familyView')}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <HeartPulse className="h-4 w-4 text-success" aria-hidden="true" />
            <span className="font-semibold">{t('header.offlineFirst')}</span>
          </div>
        </div>

        <Navigation />
      </div>
    </header>
  );
}
