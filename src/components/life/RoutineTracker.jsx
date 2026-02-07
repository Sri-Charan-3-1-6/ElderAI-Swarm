import React from 'react';
import { Sun, Moon, Coffee } from 'lucide-react';

export default function RoutineTracker({ routines, onChange }) {
  const sections = [
    { key: 'morning', title: 'Morning', icon: <Sun /> },
    { key: 'afternoon', title: 'Afternoon', icon: <Coffee /> },
    { key: 'evening', title: 'Evening', icon: <Moon /> }
  ];

  const toggle = (key, id) => {
    const next = { ...routines, [key]: routines[key].map((r) => (r.id === id ? { ...r, done: !r.done } : r)) };
    onChange(next);
  };

  const progress = (items) => Math.round((items.filter((i) => i.done).length / Math.max(1, items.length)) * 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
      <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>Daily Routine Tracker</div>
      <div className="mt-3 grid md:grid-cols-3" style={{ gap: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
        {sections.map((s) => (
          <div key={s.key} className="rounded-xl border border-slate-200 bg-white" style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center font-extrabold text-slate-900" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{React.cloneElement(s.icon, { style: { width: 'clamp(1rem, 4vw, 1.25rem)', height: 'clamp(1rem, 4vw, 1.25rem)' } })} {s.title}</div>
              <div className="font-bold text-slate-600" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{progress(routines[s.key])}%</div>
            </div>
            <div className="mt-2" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', display: 'flex', flexDirection: 'column' }}>
              {routines[s.key].map((r) => (
                <label key={r.id} className="flex items-center font-semibold text-slate-800" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
                  <input type="checkbox" checked={r.done} onChange={() => toggle(s.key, r.id)} /> {r.text}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

