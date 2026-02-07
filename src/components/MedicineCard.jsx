
import React from 'react';
import { CheckCircle2, Clock, XCircle, Volume2, Trash2 } from 'lucide-react';
import { useI18n } from '../i18n/i18n.js';

const statusStyles = {
  taken: {
    bg: 'bg-emerald-100',
    border: 'border-emerald-400',
    text: 'text-emerald-900',
    icon: <CheckCircle2 style={{ width: 'clamp(1.25rem, 5vw, 1.75rem)', height: 'clamp(1.25rem, 5vw, 1.75rem)' }} className="text-emerald-700" aria-hidden="true" />,
    label: 'Taken'
  },
  pending: {
    bg: 'bg-amber-100',
    border: 'border-amber-400',
    text: 'text-amber-900',
    icon: <Clock style={{ width: 'clamp(1.25rem, 5vw, 1.75rem)', height: 'clamp(1.25rem, 5vw, 1.75rem)' }} className="text-amber-700" aria-hidden="true" />,
    label: 'Pending'
  },
  missed: {
    bg: 'bg-red-100',
    border: 'border-red-400',
    text: 'text-red-900',
    icon: <XCircle style={{ width: 'clamp(1.25rem, 5vw, 1.75rem)', height: 'clamp(1.25rem, 5vw, 1.75rem)' }} className="text-red-700" aria-hidden="true" />,
    label: 'Missed'
  }
};

export default function MedicineCard({ item, onMarkTaken, onHear, onDelete }) {
  const { ta } = useI18n();
  const style = statusStyles[item.status] || statusStyles.pending;

  return (
    <div className={`border ${style.border} ${style.bg} ${style.text} shadow-card ring-1 ring-black/5`} style={{ 
      borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
      padding: 'clamp(0.875rem, 3vw, 1rem)'
    }}>
      <div className="flex items-start justify-between" style={{ gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.25rem, 1vw, 0.375rem)' }}>
          <div style={{ fontSize: 'clamp(1.5rem, 6vw, 1.875rem)', fontWeight: '900', lineHeight: 1.2 }}>{item.name}</div>
          <div style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)', fontWeight: '800' }}>{item.time}</div>
          {item.instructions ? <div className="text-slate-800/90" style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)', fontWeight: '600' }}>{ta(item.instructions)}</div> : null}
          <div className="flex items-center" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(1rem, 4vw, 1.25rem)', fontWeight: '800' }}>
            {style.icon}
            <span>{ta(style.label)}</span>
            {item.takenAt ? <span className="text-emerald-800">• {ta('Taken at')} {item.takenAt}</span> : null}
            {item.missedAt ? <span className="text-red-800">• {ta('Missed at')} {item.missedAt}</span> : null}
          </div>
        </div>
        <button
          type="button"
          className="rounded-full bg-white/70 text-slate-800 shadow hover:shadow-lg transition"
          style={{ 
            padding: 'clamp(0.625rem, 2vw, 0.75rem)',
            minWidth: '44px',
            minHeight: '44px'
          }}
          aria-label={ta(`Play reminder for ${item.name}`)}
          onClick={() => onHear(item.name, item.language)}
        >
          <Volume2 style={{ width: 'clamp(1.5rem, 6vw, 2rem)', height: 'clamp(1.5rem, 6vw, 2rem)' }} />
        </button>
      </div>

      <div className="flex flex-wrap items-center" style={{ marginTop: 'clamp(0.875rem, 3vw, 1rem)', gap: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
        {item.status !== 'taken' ? (
          <button
            type="button"
            className="flex-1 bg-emerald-600 text-white shadow-lg transition hover:brightness-110"
            style={{ 
              height: 'clamp(4rem, 10vw, 5rem)',
              borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
              fontSize: 'clamp(1rem, 4vw, 1.5rem)',
              fontWeight: '900',
              minWidth: 'clamp(120px, 35vw, 180px)'
            }}
            onClick={() => onMarkTaken(item.medId, item.time)}
            aria-label={ta(`I took ${item.name}`)}
          >
            {ta('I took this')}
          </button>
        ) : null}

        {item.status === 'pending' ? (
          <button
            type="button"
            className="bg-white/70 text-slate-800 shadow"
            style={{ 
              height: 'clamp(3.5rem, 9vw, 4rem)',
              borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
              padding: '0 clamp(0.875rem, 3vw, 1rem)',
              fontSize: 'clamp(0.9rem, 3.5vw, 1.25rem)',
              fontWeight: '800'
            }}
            onClick={() => onHear(item.name, item.language)}
            aria-label={ta(`Hear reminder again for ${item.name}`)}
          >
            {ta('Hear reminder again')}
          </button>
        ) : null}

        <button
          type="button"
            className="bg-red-100 text-red-900 shadow hover:bg-red-200"
          style={{ 
            height: 'clamp(3.5rem, 9vw, 4rem)',
            borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
            padding: '0 clamp(0.875rem, 3vw, 1rem)',
            fontSize: 'clamp(0.9rem, 3.5vw, 1.25rem)',
            fontWeight: '800'
          }}
          onClick={() => onDelete(item.medId)}
          aria-label={ta(`Delete ${item.name}`)}
        >
          <div className="flex items-center" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
            <Trash2 style={{ width: 'clamp(1.25rem, 5vw, 1.5rem)', height: 'clamp(1.25rem, 5vw, 1.5rem)' }} /> {ta('Delete')}
          </div>
        </button>
      </div>
    </div>
  );
}

