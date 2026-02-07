import React, { useState } from 'react';
import { CheckCircle2, Clock3, MapPin } from 'lucide-react';
import { useI18n } from '../i18n/i18n.js';

export default function EmergencyHistory({ logs, onToggleResolved, onUpdateNotes }) {
  const { ta } = useI18n();
  const [editing, setEditing] = useState({});

  const handleSaveNotes = (id) => {
    onUpdateNotes(id, editing[id] || '');
    setEditing((e) => ({ ...e, [id]: undefined }));
  };

  return (
    <div className="rounded-2xl bg-white shadow-card border-2 border-slate-700" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
      <h2 className="font-black" style={{ fontSize: 'clamp(1.5rem, 6vw, 1.875rem)' }}>{ta('Emergency History')}</h2>
      <p className="mt-1 font-semibold text-slate-600" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('Review past emergencies and resolutions.')}</p>

      <div className="mt-4" style={{ gap: 'clamp(0.5rem, 2vw, 0.75rem)', display: 'flex', flexDirection: 'column' }}>
        {logs.length === 0 ? (
          <div className="rounded-xl bg-slate-100 font-semibold text-slate-700" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.75rem, 2.5vw, 1rem)', paddingBottom: 'clamp(0.75rem, 2.5vw, 1rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('No emergencies logged yet.')}</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="rounded-xl border border-slate-200 bg-white" style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
              <div className="flex flex-wrap items-center justify-between" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
                <div className="font-black" style={{ fontSize: 'clamp(1.125rem, 5vw, 1.25rem)' }}>
                  {new Date(log.createdAt).toLocaleString()} • {ta(log.type)}
                  {log.testMode ? ` (${ta('Test')})` : ''}
                </div>
                <button
                  type="button"
                  onClick={() => onToggleResolved(log.id, !log.resolved)}
                  className={`rounded-lg font-extrabold ${log.resolved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}
                  style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }}
                >
                  {log.resolved ? ta('Resolved') : ta('Mark Resolved')}
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-center font-semibold text-slate-700" style={{ gap: 'clamp(0.5rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>
                {React.cloneElement(<Clock3 aria-hidden />, { style: { width: 'clamp(1rem, 4vw, 1.25rem)', height: 'clamp(1rem, 4vw, 1.25rem)' } })} {ta('Response')}: {log.responseMs ? Math.round(log.responseMs / 1000) + 's' : '—'}
                {React.cloneElement(<CheckCircle2 aria-hidden />, { style: { width: 'clamp(1rem, 4vw, 1.25rem)', height: 'clamp(1rem, 4vw, 1.25rem)' } })} {ta('Called')}: {log.contacts?.join(', ') || ta('n/a')}
                {React.cloneElement(<MapPin aria-hidden />, { style: { width: 'clamp(1rem, 4vw, 1.25rem)', height: 'clamp(1rem, 4vw, 1.25rem)' } })} {log.location?.address || ta('No location')}
              </div>

              <div className="mt-2">
                <label className="font-semibold text-slate-600" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Notes')}</label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-slate-300 font-semibold"
                  style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}
                  value={editing[log.id] ?? log.notes ?? ''}
                  onChange={(e) => setEditing((prev) => ({ ...prev, [log.id]: e.target.value }))}
                  rows={2}
                />
                <div className="mt-2 flex" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
                  <button
                    type="button"
                    className="rounded-lg bg-slate-900 font-extrabold text-white"
                    style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }}
                    onClick={() => handleSaveNotes(log.id)}
                  >
                    {ta('Save Notes')}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

