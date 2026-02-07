import React, { useState } from 'react';
import { useI18n } from '../../i18n/i18n.js';

const normalRanges = {
  bp: 'Ideal: 120/80',
  hr: 'Normal: 60-100 bpm',
  weight: 'Weekly entry',
  sugar: 'Fasting < 100 • Post-meal < 140',
  temp: 'Normal: 97°F - 99°F'
};

export default function VitalsEntry({ onSave, entries = [] }) {
  const { ta } = useI18n();
  const [form, setForm] = useState({
    systolic: '',
    diastolic: '',
    heartRate: '',
    weight: '',
    sugarFasting: '',
    sugarPost: '',
    temperature: ''
  });

  const handleNumber = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const payloads = [];
    if (form.systolic && form.diastolic) {
      payloads.push({ id: `${now.getTime()}-bp`, type: 'bp', date, bp: { systolic: Number(form.systolic), diastolic: Number(form.diastolic) } });
    }
    if (form.heartRate) {
      payloads.push({ id: `${now.getTime()}-hr`, type: 'heart', date, heartRate: Number(form.heartRate) });
    }
    if (form.weight) {
      payloads.push({ id: `${now.getTime()}-wt`, type: 'weight', date, weight: Number(form.weight) });
    }
    if (form.sugarFasting || form.sugarPost) {
      payloads.push({ id: `${now.getTime()}-bs`, type: 'sugar', date, bloodSugar: { fasting: Number(form.sugarFasting || 0), postMeal: Number(form.sugarPost || 0) } });
    }
    if (form.temperature) {
      payloads.push({ id: `${now.getTime()}-temp`, type: 'temp', date, temperature: Number(form.temperature) });
    }
    payloads.forEach((p) => onSave?.(p));
  };

  const lastReadings = entries.slice(-10).reverse();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>{ta('Enter Vitals')}</h3>
          <p className="text-slate-600" style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>{ta('Manual entry for BP, heart rate, weight, sugar, temperature.')}</p>
        </div>
        <div className="rounded-xl bg-white font-extrabold text-slate-700" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Saved locally')}</div>
      </div>

      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <Section title="Blood Pressure" hint={normalRanges.bp}>
          <div className="flex items-center" style={{ gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
            <NumberBox placeholder="120" value={form.systolic} onChange={handleNumber('systolic')} />
            <span className="font-black text-slate-500" style={{ fontSize: 'clamp(1.5rem, 6vw, 1.875rem)' }}>/</span>
            <NumberBox placeholder="80" value={form.diastolic} onChange={handleNumber('diastolic')} />
          </div>
          <AlertText value={form.systolic && form.diastolic ? `${form.systolic}/${form.diastolic}` : ''} type="bp" />
        </Section>

        <Section title="Heart Rate" hint={normalRanges.hr}>
          <NumberBox placeholder="72" value={form.heartRate} onChange={handleNumber('heartRate')} suffix="bpm" />
          <AlertText value={form.heartRate} type="hr" />
        </Section>

        <div className="grid sm:grid-cols-2" style={{ gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
          <Section title="Weight" hint={normalRanges.weight}>
            <NumberBox placeholder="65" value={form.weight} onChange={handleNumber('weight')} suffix="kg" />
          </Section>
          <Section title="Temperature" hint={normalRanges.temp}>
            <NumberBox placeholder="98.4" value={form.temperature} onChange={handleNumber('temperature')} suffix="°F" step="0.1" />
            <AlertText value={form.temperature} type="temp" />
          </Section>
        </div>

        <Section title="Blood Sugar" hint={normalRanges.sugar}>
          <div className="grid sm:grid-cols-2" style={{ gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
            <NumberBox placeholder="95" value={form.sugarFasting} onChange={handleNumber('sugarFasting')} label="Fasting" />
            <NumberBox placeholder="130" value={form.sugarPost} onChange={handleNumber('sugarPost')} label="Post-meal" />
          </div>
          <AlertText value={{ fasting: form.sugarFasting, postMeal: form.sugarPost }} type="sugar" />
        </Section>

        <button
          type="submit"
          className="w-full rounded-xl bg-success font-extrabold text-white shadow-card"
          style={{ paddingTop: 'clamp(0.75rem, 2.5vw, 1rem)', paddingBottom: 'clamp(0.75rem, 2.5vw, 1rem)', fontSize: 'clamp(1.25rem, 5vw, 1.5rem)', minHeight: '44px' }}
          aria-label="Save vitals"
        >
          Save Vitals
        </button>
      </form>

      {lastReadings.length ? (
        <div className="mt-6 rounded-xl bg-white border border-slate-600" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
          <div className="font-bold text-slate-800" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('Recent readings')}</div>
          <div className="mt-2 grid sm:grid-cols-2" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
            {lastReadings.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 bg-white" style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
                <div className="font-semibold text-slate-500" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{r.date}</div>
                <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{renderReading(r)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Section({ title, hint, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
      <div className="font-bold text-slate-900" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{title}</div>
      <div className="text-slate-600" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{hint}</div>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function NumberBox({ placeholder, value, onChange, suffix, label, step }) {
  return (
    <label className="flex items-center rounded-xl border border-slate-200 bg-white font-semibold" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1.125rem, 4.5vw, 1.25rem)', minHeight: '44px' }}>
      {label ? <span className="font-bold text-slate-700" style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>{label}</span> : null}
      <input
        type="number"
        step={step || '1'}
        className="w-full bg-transparent font-black text-slate-900 focus:outline-none"
        style={{ fontSize: 'clamp(1.5rem, 6vw, 1.875rem)' }}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {suffix ? <span className="font-bold text-slate-500" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{suffix}</span> : null}
    </label>
  );
}

function AlertText({ value, type }) {
  if (!value) return null;
  const n = Number(value);
  let text = '';
  let tone = 'text-success';
  if (type === 'bp') {
    const [sys, dia] = value.split('/').map(Number);
    if (sys > 140 || dia > 90) {
      text = 'High blood pressure. Rest and recheck. Consider calling doctor.';
      tone = 'text-danger';
    } else if (sys < 90 || dia < 60) {
      text = 'Blood pressure is low. Hydrate and sit down.';
      tone = 'text-warning';
    } else {
      text = 'Blood pressure looks okay.';
    }
  }
  if (type === 'hr') {
    if (n > 100 || n < 55) {
      text = 'Heart rate outside normal range.';
      tone = 'text-warning';
    } else {
      text = 'Heart rate within normal range.';
    }
  }
  if (type === 'temp') {
    if (n > 100.4) {
      text = 'Fever detected. Monitor and call doctor if needed.';
      tone = 'text-danger';
    }
  }
  if (type === 'sugar') {
    const fasting = typeof value === 'object' ? Number(value.fasting ?? value) : Number(value);
    const post = typeof value === 'object' ? Number(value.postMeal ?? value) : Number(value);
    if (fasting > 140 || post > 200) {
      text = 'Blood sugar high. Follow diet and medicine plan.';
      tone = 'text-danger';
    }
  }
  return <div className={`font-bold ${tone}`} style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{text}</div>;
}

function renderReading(r) {
  switch (r.type) {
    case 'bp':
      return `${r.bp?.systolic}/${r.bp?.diastolic} mmHg`;
    case 'heart':
      return `${r.heartRate} bpm`;
    case 'weight':
      return `${r.weight} kg`;
    case 'sugar':
      return `Fasting ${r.bloodSugar?.fasting} • Post ${r.bloodSugar?.postMeal}`;
    case 'temp':
      return `${r.temperature} °F`;
    default:
      return 'Entry';
  }
}

