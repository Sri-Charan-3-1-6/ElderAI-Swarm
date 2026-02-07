import React, { useMemo } from 'react';
import { Droplet, Plus, RefreshCcw } from 'lucide-react';

export default function HydrationTracker({ hydration, onUpdate }) {
  const today = new Date().toISOString().slice(0, 10);
  const goal = hydration?.goal ?? 8;
  const intake = hydration?.date === today ? hydration?.intake ?? 0 : 0;

  const percent = useMemo(() => Math.min(100, Math.round((intake / Math.max(1, goal)) * 100)), [intake, goal]);

  const addGlass = () => {
    onUpdate?.({ date: today, intake: intake + 1, goal, remindersEnabled: true });
  };

  const reset = () => {
    onUpdate?.({ date: today, intake: 0, goal, remindersEnabled: true });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center font-extrabold text-slate-900" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>
          {React.cloneElement(<Droplet className="text-primary" />, { style: { width: 'clamp(1rem, 4vw, 1.5rem)', height: 'clamp(1rem, 4vw, 1.5rem)' } })} Hydration
        </div>
        <div className="font-bold text-slate-600" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>Goal: {goal} glasses</div>
      </div>

      <div className="mt-4 flex items-center" style={{ gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
        <button
          type="button"
          onClick={addGlass}
          className="flex-1 rounded-xl bg-primary font-extrabold text-white shadow-card"
          style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.75rem, 2.5vw, 1rem)', paddingBottom: 'clamp(0.75rem, 2.5vw, 1rem)', fontSize: 'clamp(1.25rem, 5vw, 1.5rem)', minHeight: '44px' }}
          aria-label="Add water intake"
        >
          {React.cloneElement(<Plus className="mr-2 inline" />, { style: { width: 'clamp(1rem, 4vw, 1.5rem)', height: 'clamp(1rem, 4vw, 1.5rem)' } })} I drank a glass
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-slate-100 font-extrabold text-slate-900"
          style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }}
          aria-label="Reset hydration"
        >
          {React.cloneElement(<RefreshCcw className="mr-1 inline" />, { style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })} Reset
        </button>
      </div>

      <div className="mt-4 w-full rounded-full bg-slate-200" style={{ height: 'clamp(0.75rem, 3vw, 1rem)' }}>
        <div className="rounded-full bg-success" style={{ width: `${percent}%`, height: 'clamp(0.75rem, 3vw, 1rem)' }} />
      </div>
      <div className="mt-2 font-semibold text-slate-700" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{intake} / {goal} glasses today</div>
      <div className="text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>Reminder every 2 hours while goal not met.</div>
    </div>
  );
}

