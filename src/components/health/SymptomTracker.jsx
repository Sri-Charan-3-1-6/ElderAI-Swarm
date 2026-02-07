import React, { useState } from 'react';
import { AlertTriangle, Camera, Clock, MapPin, PlusCircle } from 'lucide-react';
import { useI18n } from '../../i18n/i18n.js';

const locations = ['Bedroom', 'Bathroom', 'Kitchen', 'Stairs', 'Outside'];

export default function SymptomTracker({ onAddSymptom, symptoms = [], onLogFall }) {
  const { ta } = useI18n();
  const [form, setForm] = useState({
    description: '',
    startedAt: new Date().toISOString().slice(0, 10),
    severity: 5,
    trend: 'stable'
  });
  const [fall, setFall] = useState({ happened: false, where: 'Bedroom', hurt: 'no', couldGetUp: 'yes', notes: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.description.trim()) return;
    onAddSymptom?.({
      id: Date.now(),
      description: form.description.trim(),
      startedAt: form.startedAt,
      severity: Number(form.severity),
      trend: form.trend,
      createdAt: new Date().toISOString()
    });
    setForm((p) => ({ ...p, description: '' }));
  };

  const handleFall = () => {
    if (!fall.happened) return;
    const payload = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      location: fall.where,
      hurt: fall.hurt === 'yes',
      couldGetUp: fall.couldGetUp === 'yes',
      notes: fall.notes
    };
    onLogFall?.(payload);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
      <div className="flex items-center font-extrabold text-slate-900" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>
        {React.cloneElement(<PlusCircle className="text-primary" />, { style: { width: 'clamp(1rem, 4vw, 1.5rem)', height: 'clamp(1rem, 4vw, 1.5rem)' } })} Symptom Tracker
      </div>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <input
          className="w-full rounded-xl border border-slate-200 bg-white font-semibold"
          style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }}
          placeholder={ta("What's bothering you?")}
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        />
        <div className="grid sm:grid-cols-3" style={{ gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
          <label className="flex items-center rounded-xl bg-white font-semibold text-slate-700" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
            {React.cloneElement(<Clock />, { style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })}
            <span>Started</span>
            <input
              type="date"
              value={form.startedAt}
              onChange={(e) => setForm((p) => ({ ...p, startedAt: e.target.value }))}
              className="flex-1 bg-transparent text-right"
            />
          </label>
          <label className="flex items-center rounded-xl bg-white font-semibold text-slate-700" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
            <span>Severity</span>
            <input
              type="range"
              min="1"
              max="10"
              value={form.severity}
              onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value }))}
              className="flex-1"
            />
            <span className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{form.severity}/10</span>
          </label>
          <label className="flex items-center justify-between rounded-xl bg-white font-semibold text-slate-700" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
            <span>Trend</span>
            <select
              className="rounded-lg border border-slate-200 bg-white font-semibold"
              style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }}
              value={form.trend}
              onChange={(e) => setForm((p) => ({ ...p, trend: e.target.value }))}
            >
              <option value="better">Getting better</option>
              <option value="stable">Stable</option>
              <option value="worse">Getting worse</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap" style={{ gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
          <label className="flex cursor-pointer items-center rounded-xl border border-slate-200 bg-white font-semibold text-slate-700" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
            {React.cloneElement(<Camera />, { style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })}
            Add photo (open camera)
            <input type="file" accept="image/*" capture="environment" className="hidden" />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-primary font-extrabold text-white"
            style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }}
            aria-label="Save symptom"
          >
            Save Symptom
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-warning/40 bg-warning/10 text-slate-800" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
        <div className="flex items-center font-bold" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>
          {React.cloneElement(<AlertTriangle />, { style: { width: 'clamp(0.875rem, 3.5vw, 1.25rem)', height: 'clamp(0.875rem, 3.5vw, 1.25rem)' } })} Fall detection (manual)
        </div>
        <label className="mt-2 flex items-center font-semibold text-slate-700" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
          <input type="checkbox" checked={fall.happened} onChange={(e) => setFall((p) => ({ ...p, happened: e.target.checked }))} /> Did you fall today?
        </label>
        {fall.happened ? (
          <div className="mt-3 grid sm:grid-cols-2" style={{ gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
            <select
              className="rounded-xl border border-slate-200 bg-white font-semibold"
              style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }}
              value={fall.where}
              onChange={(e) => setFall((p) => ({ ...p, where: e.target.value }))}
            >
              {locations.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <div className="flex items-center" style={{ gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
              <label className="flex items-center font-semibold text-slate-700" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
                <input type="radio" name="hurt" value="yes" checked={fall.hurt === 'yes'} onChange={(e) => setFall((p) => ({ ...p, hurt: e.target.value }))} /> Hurt
              </label>
              <label className="flex items-center font-semibold text-slate-700" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
                <input type="radio" name="hurt" value="no" checked={fall.hurt === 'no'} onChange={(e) => setFall((p) => ({ ...p, hurt: e.target.value }))} /> No hurt
              </label>
            </div>
            <div className="flex items-center" style={{ gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
              <label className="flex items-center font-semibold text-slate-700" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
                <input type="radio" name="getup" value="yes" checked={fall.couldGetUp === 'yes'} onChange={(e) => setFall((p) => ({ ...p, couldGetUp: e.target.value }))} /> Could get up
              </label>
              <label className="flex items-center font-semibold text-slate-700" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
                <input type="radio" name="getup" value="no" checked={fall.couldGetUp === 'no'} onChange={(e) => setFall((p) => ({ ...p, couldGetUp: e.target.value }))} /> Could not get up
              </label>
            </div>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-white font-semibold"
              style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }}
              placeholder={ta('Notes')}
              value={fall.notes}
              onChange={(e) => setFall((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>
        ) : null}
        {fall.happened ? (
          <button
            type="button"
            onClick={handleFall}
            className="mt-3 w-full rounded-xl bg-danger px-4 py-3 text-lg font-extrabold text-white"
            aria-label="Log fall"
          >
            Log Fall & Notify
          </button>
        ) : null}
      </div>

      {symptoms.length ? (
        <div className="rounded-xl bg-white border border-slate-600 p-4">
          <div className="text-lg font-bold text-slate-800">{ta('Symptom history')}</div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {[...symptoms].slice(-6).reverse().map((s) => (
              <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="text-sm font-semibold text-slate-500">{s.startedAt}</div>
                <div className="text-lg font-extrabold text-slate-900">{s.description}</div>
                <div className="text-sm text-slate-700">Severity {s.severity}/10 • {s.trend}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

