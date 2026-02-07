import React, { useState } from 'react';
import { useI18n } from '../../i18n/i18n.js';

const feelings = [
  { value: 'great', label: 'Great 😊' },
  { value: 'good', label: 'Good 🙂' },
  { value: 'okay', label: 'Okay 😐' },
  { value: 'not-well', label: 'Not Well 😟' },
  { value: 'bad', label: 'Bad 😢' }
];

const painLocations = ['Head', 'Chest', 'Stomach', 'Joints', 'Other'];

export default function DailyCheckIn({ onSave, entries = [] }) {
  const { ta } = useI18n();
  const [form, setForm] = useState({
    feeling: 'good',
    sleepHours: 7,
    sleptWell: 'yes',
    pain: 'no',
    painLocation: 'Head',
    energy: 'medium',
    appetite: 'normal',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      feeling: form.feeling,
      sleep: { hours: Number(form.sleepHours), quality: form.sleptWell === 'yes' ? 'good' : 'poor' },
      pain: { has: form.pain === 'yes', location: form.pain === 'yes' ? form.painLocation : null },
      energy: form.energy,
      appetite: form.appetite,
      notes: form.notes?.trim()
    };
    onSave?.(payload);
  };

  const lastEntries = entries.slice(-5).reverse();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
      <h3 className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>{ta('Daily Health Check-In')}</h3>
      <p className="text-slate-600" style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>{ta('Answer quickly every morning. Large buttons for ease.')}</p>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div>
          <div className="font-bold text-slate-800" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('How do you feel today?')}</div>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
            {feelings.map((f) => (
              <button
                type="button"
                key={f.value}
                onClick={() => setForm((p) => ({ ...p, feeling: f.value }))}
                className={
                  'rounded-xl border font-extrabold ' +
                  (form.feeling === f.value ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-800')
                }
                style={{ height: 'clamp(3rem, 10vw, 3.5rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2" style={{ gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
          <div className="space-y-2">
            <label className="font-bold text-slate-800" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('Did you sleep well?')}</label>
            <div className="flex" style={{ gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
              {['yes', 'no'].map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setForm((p) => ({ ...p, sleptWell: v }))}
                  className={
                    'flex-1 rounded-xl border font-extrabold ' +
                    (form.sleptWell === v ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-800')
                  }
                  style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }}
                >
                  {v === 'yes' ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="0"
              max="14"
              value={form.sleepHours}
              onChange={(e) => setForm((p) => ({ ...p, sleepHours: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white font-semibold"
              style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1.125rem, 4.5vw, 1.25rem)', minHeight: '44px' }}
              placeholder={ta('Hours slept')}
            />
          </div>

          <div className="space-y-2">
            <label className="font-bold text-slate-800" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('Any pain today?')}</label>
            <div className="flex" style={{ gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
              {['yes', 'no'].map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setForm((p) => ({ ...p, pain: v }))}
                  className={
                    'flex-1 rounded-xl border px-4 py-3 text-lg font-extrabold ' +
                    (form.pain === v ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-800')
                  }
                >
                  {v === 'yes' ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
            {form.pain === 'yes' ? (
              <select
                className="w-full rounded-xl border border-slate-200 bg-white font-semibold"
                style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }}
                value={form.painLocation}
                onChange={(e) => setForm((p) => ({ ...p, painLocation: e.target.value }))}
              >
                {painLocations.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            ) : null}
          </div>
        </div>

        <div className="grid sm:grid-cols-3" style={{ gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
          <SelectCard
            label="Energy level"
            value={form.energy}
            options={[
              ['high', 'High'],
              ['medium', 'Medium'],
              ['low', 'Low']
            ]}
            onChange={(v) => setForm((p) => ({ ...p, energy: v }))}
          />
          <SelectCard
            label="Appetite"
            value={form.appetite}
            options={[
              ['good', 'Good'],
              ['normal', 'Normal'],
              ['poor', 'Poor']
            ]}
            onChange={(v) => setForm((p) => ({ ...p, appetite: v }))}
          />
        </div>

        <textarea
          className="w-full rounded-xl border border-slate-200 bg-white font-semibold"
          style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }}
          placeholder={ta('Notes (optional)')}
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
        />

        <button
          type="submit"
          className="w-full rounded-xl bg-primary font-extrabold text-white shadow-card"
          style={{ paddingTop: 'clamp(0.75rem, 2.5vw, 1rem)', paddingBottom: 'clamp(0.75rem, 2.5vw, 1rem)', fontSize: 'clamp(1.25rem, 5vw, 1.5rem)', minHeight: '44px' }}
          aria-label="Save check-in"
        >
          Save Check-In
        </button>
      </form>

      {lastEntries.length ? (
        <div className="mt-4 rounded-xl bg-white border border-slate-600" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
          <div className="font-bold text-slate-800" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('Recent check-ins')}</div>
          <div className="mt-2 grid sm:grid-cols-2" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
            {lastEntries.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-white" style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
                <div className="font-semibold text-slate-500" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{c.date}</div>
                <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{feelings.find((f) => f.value === c.feeling)?.label || 'Okay'}</div>
                <div className="text-slate-600" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>Sleep: {c.sleep?.hours} hrs • Energy: {c.energy}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SelectCard({ label, value, options, onChange }) {
  return (
    <div className="space-y-2">
      <div className="font-bold text-slate-800" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{label}</div>
      <div className="grid grid-cols-1" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
        {options.map(([val, text]) => (
          <button
            type="button"
            key={val}
            onClick={() => onChange(val)}
            className={
              'w-full rounded-xl border font-extrabold ' +
              (value === val ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-800')
            }
            style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

