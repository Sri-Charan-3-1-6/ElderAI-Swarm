import React, { useMemo, useState } from 'react';
import { validatePhone } from '../utils/emergency.js';
import { useI18n } from '../i18n/i18n.js';

const PRIORITIES = ['Primary', 'Secondary', 'Tertiary', 'Other'];

export default function EmergencyContacts({ contacts, onChange }) {
  const { ta } = useI18n();
  const [draft, setDraft] = useState({ name: '', phone: '', relation: '', priority: 'Primary' });
  const [error, setError] = useState('');

  const ordered = useMemo(() => {
    const order = PRIORITIES;
    return [...(contacts || [])].sort((a, b) => order.indexOf(a.priority || 'Other') - order.indexOf(b.priority || 'Other'));
  }, [contacts]);

  const addContact = () => {
    if (!draft.name.trim()) {
      setError(ta('Name is required'));
      return;
    }
    if (!validatePhone(draft.phone)) {
      setError(ta('Enter phone with country code (e.g., +91-9876543210)'));
      return;
    }
    const next = [
      ...ordered,
      {
        id: Date.now(),
        name: draft.name.trim(),
        phone: draft.phone.trim(),
        relation: draft.relation.trim(),
        priority: draft.priority
      }
    ];
    onChange(next);
    setDraft({ name: '', phone: '', relation: '', priority: 'Secondary' });
    setError('');
  };

  const remove = (id) => {
    const next = ordered.filter((c) => c.id !== id);
    onChange(next);
  };

  return (
    <div className="rounded-2xl bg-white shadow-card border-2 border-slate-700" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
      <h2 className="font-black" style={{ fontSize: 'clamp(1.5rem, 6vw, 1.875rem)' }}>{ta('Emergency Contacts')}</h2>
      <p className="mt-1 font-semibold text-slate-600" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('Set 2-3 trusted people. Primary is called first.')}</p>

      <div className="mt-4 grid md:grid-cols-2" style={{ gap: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
        <label className="font-semibold" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', display: 'flex', flexDirection: 'column', fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>
          <span>{ta('Name')}</span>
          <input
            className="w-full rounded-xl border border-slate-300 font-semibold"
            style={{ height: 'clamp(2.5rem, 10vw, 3rem)', minHeight: '44px', paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1.125rem, 5vw, 1.25rem)' }}
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder={ta('Rajesh - Son')}
          />
        </label>
        <label className="font-semibold" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', display: 'flex', flexDirection: 'column', fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>
          <span>{ta('Phone (+ country code)')}</span>
          <input
            className="w-full rounded-xl border border-slate-300 font-semibold"
            style={{ height: 'clamp(2.5rem, 10vw, 3rem)', minHeight: '44px', paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1.125rem, 5vw, 1.25rem)' }}
            value={draft.phone}
            onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
            placeholder="+91-9876543210"
          />
        </label>
        <label className="font-semibold" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', display: 'flex', flexDirection: 'column', fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>
          <span>{ta('Relationship')}</span>
          <input
            className="w-full rounded-xl border border-slate-300 font-semibold"
            style={{ height: 'clamp(2.5rem, 10vw, 3rem)', minHeight: '44px', paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1.125rem, 5vw, 1.25rem)' }}
            value={draft.relation}
            onChange={(e) => setDraft((d) => ({ ...d, relation: e.target.value }))}
            placeholder={ta('Son, Daughter, Neighbor')}
          />
        </label>
        <label className="font-semibold" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', display: 'flex', flexDirection: 'column', fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>
          <span>{ta('Priority')}</span>
          <select
            className="w-full rounded-xl border border-slate-300 font-semibold"
            style={{ height: 'clamp(2.5rem, 10vw, 3rem)', minHeight: '44px', paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1.125rem, 5vw, 1.25rem)' }}
            value={draft.priority}
            onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}
          >
            {PRIORITIES.map((p) => (
              <option key={p}>{ta(p)}</option>
            ))}
          </select>
        </label>
      </div>

      {error ? <div className="mt-2 rounded-xl bg-red-100 font-semibold text-red-800" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{error}</div> : null}

      <div className="mt-3 flex flex-wrap" style={{ gap: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
        <button
          type="button"
          className="rounded-2xl bg-emerald-600 font-black text-white shadow-lg hover:brightness-110"
          style={{ height: 'clamp(2.5rem, 10vw, 3rem)', minHeight: '44px', paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', fontSize: 'clamp(1.125rem, 5vw, 1.25rem)' }}
          onClick={addContact}
        >
          {ta('Save Contact')}
        </button>
      </div>

      <div className="mt-4" style={{ gap: 'clamp(0.5rem, 2vw, 0.75rem)', display: 'flex', flexDirection: 'column' }}>
        {ordered.map((c, idx) => (
          <div
            key={c.id}
            className={`flex flex-wrap items-center justify-between rounded-xl border font-semibold ${idx === 0 ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'}`}
            style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}
          >
            <div style={{ gap: 'clamp(0.125rem, 0.5vw, 0.25rem)', display: 'flex', flexDirection: 'column' }}>
              <div className="font-black" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>{c.name}</div>
              <div className="text-slate-700" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>📞 {c.phone}</div>
              <div className="font-semibold text-slate-600" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta(c.relation || 'Relation not set')} • {ta(c.priority)}</div>
            </div>
            <button
              type="button"
              className="rounded-lg bg-red-100 font-extrabold text-red-900"
              style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }}
              onClick={() => remove(c.id)}
            >
              {ta('Remove')}
            </button>
          </div>
        ))}
        {!ordered.length ? <div className="rounded-xl bg-amber-100 font-semibold text-amber-900" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('Add at least one contact.')}</div> : null}
      </div>
    </div>
  );
}

