import React from 'react';
import { useI18n } from '../../i18n/i18n.js';

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-slate-200/70 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-slate-600 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-semibold text-slate-800">{t('app.title')}</span> — {t('footer.offlineFirstRuleBased')}
          </div>
          <div className="text-slate-500">© {new Date().getFullYear()}</div>
        </div>
      </div>
    </footer>
  );
}
