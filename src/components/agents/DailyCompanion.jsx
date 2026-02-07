import React from 'react';
import { useI18n } from '../../i18n/i18n.js';

export default function DailyCompanion() {
  const { ta } = useI18n();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 3vw, 1.5rem)' }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h2 className="font-extrabold tracking-tight" style={{ fontSize: 'clamp(1.5rem, 6vw, 1.875rem)' }}>{ta('Daily Companion')}</h2>
          <p className="text-slate-600" style={{ marginTop: 'clamp(0.5rem, 2vw, 0.875rem)', fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>{ta('Your AI companion - Ready to rebuild')}</p>
        </div>
      </div>

      <div className="rounded-card bg-white shadow-card border-2 border-slate-700" style={{ padding: 'clamp(1rem, 4vw, 1.5rem)' }}>
        <div className="text-center" style={{ paddingTop: 'clamp(2rem, 5vw, 3rem)', paddingBottom: 'clamp(2rem, 5vw, 3rem)' }}>
          <p className="text-slate-600" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('Daily Companion content cleared. Ready for rebuild.')}</p>
        </div>
      </div>
    </div>
  );
}

