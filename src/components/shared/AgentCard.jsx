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
    <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-700">{icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">{title}</h3>
              <StatusIndicator status={status} />
            </div>
            {subtitle ? <div className="text-sm text-slate-600">{subtitle}</div> : null}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs font-semibold text-slate-500">{metricLabel}</div>
          <div className="mt-1 text-lg font-extrabold text-slate-900">{metricValue}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs font-semibold text-slate-500">{ta('Last activity')}</div>
          <div className="mt-1 text-sm font-semibold text-slate-800">{lastActivity}</div>
        </div>
      </div>

      <button
        className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 focus:outline-none"
        onClick={onView}
        aria-label={ta(`View details for ${title}`)}
      >
        {ta('View Details')}
      </button>
    </div>
  );
}
