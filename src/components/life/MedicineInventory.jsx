import React, { useEffect } from 'react';
import { AlertTriangle, Pill, Plus } from 'lucide-react';

export default function MedicineInventory({ medicines = [], inventory = {}, onChange, onLowSupply }) {
  const calculateDaysLeft = (med) => {
    const entry = inventory[med.id] || { pills: 30, daily: (med.times?.length || 1) };
    const daily = entry.daily || 1;
    return Math.floor((entry.pills || 0) / daily);
  };

  useEffect(() => {
    medicines.forEach((m) => {
      const days = calculateDaysLeft(m);
      if (days <= 3) onLowSupply?.(m);
    });
  });

  const updateCount = (id, delta) => {
    const current = inventory[id] || { pills: 0, daily: 1 };
    const next = { ...inventory, [id]: { ...current, pills: Math.max(0, (current.pills || 0) + delta) } };
    onChange(next);
  };

  const updateDaily = (id, daily) => {
    const current = inventory[id] || { pills: 0, daily: 1 };
    const next = { ...inventory, [id]: { ...current, daily: Math.max(1, daily) } };
    onChange(next);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)', gap: 'clamp(0.5rem, 2vw, 0.75rem)', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center font-extrabold text-slate-900" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>
        {React.cloneElement(<Pill className="text-primary" />, { style: { width: 'clamp(1.25rem, 5vw, 1.5rem)', height: 'clamp(1.25rem, 5vw, 1.5rem)' } })} Medicine Inventory
      </div>
      <div style={{ gap: 'clamp(0.5rem, 2vw, 0.75rem)', display: 'flex', flexDirection: 'column' }}>
        {medicines.map((m) => {
          const entry = inventory[m.id] || { pills: 30, daily: (m.times?.length || 1) };
          const daysLeft = calculateDaysLeft(m);
          const low = daysLeft < 7;
          return (
            <div key={m.id} className="rounded-xl border border-slate-200 bg-white" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(1.125rem, 5vw, 1.25rem)' }}>{m.name}</div>
                  <div className="text-slate-700" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>Pills: {entry.pills ?? 0} • Daily: {entry.daily ?? 1}</div>
                </div>
                <div className="font-black text-slate-900" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{daysLeft} days left</div>
              </div>
              {low ? (
                <div className="mt-2 flex items-center rounded-lg bg-warning/10 font-bold text-warning" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
                  {React.cloneElement(<AlertTriangle />, { style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })} Refill soon
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
                <button className="rounded-lg bg-primary font-extrabold text-white" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }} onClick={() => updateCount(m.id, 10)} aria-label="Add refill">
                  {React.cloneElement(<Plus className="mr-1 inline" />, { style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })} Refill +10
                </button>
                <button className="rounded-lg bg-slate-900 font-extrabold text-white" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }} onClick={() => updateCount(m.id, -1)} aria-label="Consume pill">
                  Consume 1
                </button>
                <label className="flex items-center font-semibold text-slate-700" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
                  Daily
                  <input
                    type="number"
                    className="rounded-lg border border-slate-200 bg-white" style={{ width: 'clamp(3rem, 12vw, 4rem)', paddingLeft: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingRight: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingTop: 'clamp(0.125rem, 0.5vw, 0.25rem)', paddingBottom: 'clamp(0.125rem, 0.5vw, 0.25rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }}
                    value={entry.daily ?? 1}
                    min="1"
                    onChange={(e) => updateDaily(m.id, Number(e.target.value))}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

