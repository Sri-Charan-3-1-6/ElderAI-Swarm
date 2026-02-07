import React from 'react';
import StatusIndicator from './StatusIndicator.jsx';
import { useI18n } from '../../i18n/i18n.js';

export default function AgentCard({
  title,
  subtitle,
  icon,
  status = 'active',
  metricLabel,
  metricValue,
  lastActivity,
  onView
}) {
  const { ta } = useI18n();

  return (
    <div className="rounded-card bg-white shadow-card border-2 border-slate-700" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
      <div className="flex items-start justify-between" style={{ gap: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
        <div className="flex items-center" style={{ gap: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
          <div className="flex items-center justify-center rounded-xl bg-white border border-slate-600 text-slate-700" style={{ height: 'clamp(2.5rem, 10vw, 3rem)', width: 'clamp(2.5rem, 10vw, 3rem)', minHeight: '44px', minWidth: '44px' }}>{icon}</div>
          <div>
            <div className="flex items-center" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
              <h3 className="font-bold" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{title}</h3>
              <StatusIndicator status={status} />
            </div>
            {subtitle ? <div className="text-slate-600" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{subtitle}</div> : null}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2" style={{ gap: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
        <div className="rounded-xl bg-white border border-slate-600" style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
          <div className="font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{metricLabel}</div>
          <div className="mt-1 font-extrabold text-slate-900" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{metricValue}</div>
        </div>
        <div className="rounded-xl bg-white border border-slate-600" style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
          <div className="font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{ta('Last activity')}</div>
          <div className="mt-1 font-semibold text-slate-800" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{lastActivity}</div>
        </div>
      </div>

      <button
        className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 font-bold text-white transition hover:bg-slate-800 focus:outline-none"
        style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }}
        onClick={onView}
        aria-label={ta(`View details for ${title}`)}
      >
        {ta('View Details')}
      </button>
    </div>
  );
}

