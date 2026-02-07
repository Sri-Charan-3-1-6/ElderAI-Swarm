import React, { useMemo } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

function buildDays(monthDate) {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const startDay = start.getDay();
  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= end.getDate(); d++) {
    days.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), d));
  }
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export default function Calendar({ month, onPrev, onNext, selectedISO, onSelect, highlights = [] }) {
  const days = useMemo(() => buildDays(month), [month]);
  const todayISO = new Date().toISOString().slice(0, 10);

  const highlightSet = new Set(highlights.map((d) => (typeof d === 'string' ? d : d?.toISOString?.().slice(0, 10))));

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center rounded-xl bg-white border border-slate-600 font-extrabold text-slate-800" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
          {React.cloneElement(<CalendarDays />, { style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })}
          {month.toLocaleDateString([], { month: 'long', year: 'numeric' })}
        </div>
        <div className="flex items-center" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
          <button className="rounded-lg bg-slate-100 font-extrabold text-slate-800" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }} onClick={onPrev} aria-label="Previous month">
            {React.cloneElement(<ChevronLeft />, { style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })}
          </button>
          <button className="rounded-lg bg-slate-100 font-extrabold text-slate-800" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }} onClick={onNext} aria-label="Next month">
            {React.cloneElement(<ChevronRight />, { style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })}
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 text-center font-bold text-slate-500" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
        {days.map((d, idx) => {
          if (!d) return <div key={idx} className="rounded-xl bg-white" style={{ height: 'clamp(3rem, 12vw, 3.5rem)' }} />;
          const iso = d.toISOString().slice(0, 10);
          const isToday = iso === todayISO;
          const isSelected = iso === selectedISO;
          const hasHighlight = highlightSet.has(iso);
          return (
            <button
              type="button"
              key={idx}
              onClick={() => onSelect?.(iso)}
              className={
                'rounded-xl border text-left transition focus:outline-none ' +
                (isSelected ? 'border-primary bg-primary/10 text-primary' : isToday ? 'border-slate-900 bg-slate-100' : 'border-slate-200 bg-white')
              }
              style={{ height: 'clamp(3rem, 12vw, 3.5rem)', minHeight: '44px', padding: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}
            >
              <div className="flex items-center justify-between">
                <div className="font-extrabold" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{d.getDate()}</div>
                {hasHighlight ? <span className="rounded-full bg-warning" style={{ height: 'clamp(0.375rem, 1.5vw, 0.5rem)', width: 'clamp(0.375rem, 1.5vw, 0.5rem)' }} aria-label="Has event" /> : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

