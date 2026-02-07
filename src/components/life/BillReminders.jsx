import React, { useMemo, useState } from 'react';
import { CreditCard, Timer } from 'lucide-react';
import { sendNotification } from '../../utils/notifications.js';
import { useI18n } from '../../i18n/i18n.js';

export default function BillReminders({ bills, onChange }) {
  const { ta } = useI18n();
  const [form, setForm] = useState({ name: 'Electricity', amount: '', dueDate: new Date().toISOString().slice(0, 10), method: 'Online', recurring: true });

  const save = () => {
    if (!form.name.trim()) return;
    const bill = {
      id: `b_${Date.now()}`,
      name: form.name.trim(),
      amount: Number(form.amount || 0),
      dueDate: form.dueDate,
      method: form.method,
      recurring: form.recurring,
      paid: false,
      history: []
    };
    onChange([bill, ...bills].slice(0, 100));
  };

  const markPaid = (id) => {
    const next = bills.map((b) => (b.id === id ? { ...b, paid: true, paidAt: new Date().toISOString(), history: [{ date: new Date().toISOString(), amount: b.amount }, ...(b.history || [])] } : b));
    onChange(next);
    sendNotification('Bill paid', 'Saved locally.');
  };

  const status = (bill) => {
    const diffDays = Math.ceil((new Date(bill.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (bill.paid) return 'Paid';
    if (diffDays < 0) return 'OVERDUE';
    if (diffDays <= 3) return 'Due soon';
    return `Due in ${diffDays} days`;
  };

  const overdueCount = useMemo(() => bills.filter((b) => !b.paid && new Date(b.dueDate).getTime() < Date.now()).length, [bills]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)', gap: 'clamp(0.5rem, 2vw, 0.75rem)', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center font-extrabold text-slate-900" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>
        {React.cloneElement(<CreditCard className="text-primary" />, { style: { width: 'clamp(1.25rem, 5vw, 1.5rem)', height: 'clamp(1.25rem, 5vw, 1.5rem)' } })} Bill Reminders
      </div>
      <div className="grid sm:grid-cols-2" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
        <input className="rounded-xl border border-slate-200 bg-white font-semibold" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder={ta('Bill name')} />
        <input className="rounded-xl border border-slate-200 bg-white font-semibold" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }} type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} placeholder={ta('Amount')} />
        <input className="rounded-xl border border-slate-200 bg-white font-semibold" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }} type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} />
        <input className="rounded-xl border border-slate-200 bg-white font-semibold" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }} value={form.method} onChange={(e) => setForm((p) => ({ ...p, method: e.target.value }))} placeholder={ta('Payment method')} />
      </div>
      <label className="flex items-center font-semibold text-slate-700" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
        <input type="checkbox" checked={form.recurring} onChange={(e) => setForm((p) => ({ ...p, recurring: e.target.checked }))} /> Auto-recurring monthly
      </label>
      <button className="rounded-xl bg-primary font-extrabold text-white" style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }} onClick={save} aria-label={ta('Save bill')}>{ta('Save bill')}</button>

      <div className="rounded-xl bg-white border border-slate-600 font-semibold text-slate-700" style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>Overdue: {overdueCount}</div>

      <div style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', display: 'flex', flexDirection: 'column' }}>
        {bills.map((b) => (
          <div key={b.id} className="rounded-xl border border-slate-200 bg-white" style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{b.name}</div>
                <div className="text-slate-700" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>Due {b.dueDate} • {b.method}</div>
              </div>
              <span className="rounded-full bg-slate-100 flex items-center font-bold text-slate-800" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.125rem, 0.5vw, 0.25rem)', paddingBottom: 'clamp(0.125rem, 0.5vw, 0.25rem)', gap: 'clamp(0.125rem, 0.5vw, 0.25rem)', fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>
                {React.cloneElement(<Timer />, { style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })} {status(b)}
              </span>
            </div>
            <div className="mt-2 font-semibold text-slate-700" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>Amount: ₹{b.amount || '-'} • Recurring: {b.recurring ? 'Yes' : 'No'}</div>
            {b.paid ? (
              <div className="mt-2 rounded-lg bg-success/10 font-bold text-success" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>Paid on {new Date(b.paidAt).toLocaleDateString()}</div>
            ) : (
              <button className="mt-2 rounded-lg bg-slate-900 font-extrabold text-white" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }} onClick={() => markPaid(b.id)} aria-label={ta('Mark bill paid')}>{ta('Mark as paid')}</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

