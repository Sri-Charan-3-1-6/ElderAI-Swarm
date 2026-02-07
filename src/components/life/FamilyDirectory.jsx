import React, { useState } from 'react';
import { Phone, Video, MessageSquare, Gift } from 'lucide-react';
import { useI18n } from '../../i18n/i18n.js';

export default function FamilyDirectory({ family, onChange }) {
  const { ta } = useI18n();
  const [form, setForm] = useState({ name: '', relation: '', phone: '', whatsapp: '' });

  const add = () => {
    if (!form.name.trim()) return;
    onChange([{ id: `f_${Date.now()}`, ...form }, ...family]);
    setForm({ name: '', relation: '', phone: '', whatsapp: '' });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)', gap: 'clamp(0.5rem, 2vw, 0.75rem)', display: 'flex', flexDirection: 'column' }}>
      <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>{ta('Family Directory')}</div>
      <div className="grid sm:grid-cols-2" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
        <input className="rounded-xl border border-slate-200 bg-white font-semibold" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }} placeholder={ta('Name')} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        <input className="rounded-xl border border-slate-200 bg-white font-semibold" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }} placeholder={ta('Relation')} value={form.relation} onChange={(e) => setForm((p) => ({ ...p, relation: e.target.value }))} />
        <input className="rounded-xl border border-slate-200 bg-white font-semibold" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }} placeholder={ta('Phone')} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
        <input className="rounded-xl border border-slate-200 bg-white font-semibold" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }} placeholder={ta('WhatsApp')} value={form.whatsapp} onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))} />
      </div>
      <button className="rounded-xl bg-primary font-extrabold text-white" style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }} onClick={add} aria-label={ta('Add family contact')}>{ta('Add contact')}</button>

      <div style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', display: 'flex', flexDirection: 'column' }}>
        {family.map((f) => (
          <div key={f.id} className="rounded-xl border border-slate-200 bg-white" style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{f.name}</div>
                <div className="text-slate-700" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{f.relation}</div>
              </div>
              <div className="flex" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
                {f.phone ? (
                  <a className="rounded-full bg-slate-900 text-white" style={{ padding: 'clamp(0.375rem, 1.5vw, 0.5rem)', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} href={`tel:${f.phone}`} aria-label="Call">
                    {React.cloneElement(<Phone />, { style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })}
                  </a>
                ) : null}
                {f.whatsapp ? (
                  <a className="rounded-full bg-green-600 text-white" style={{ padding: 'clamp(0.375rem, 1.5vw, 0.5rem)', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} href={`https://wa.me/${f.whatsapp.replace(/[^0-9]/g, '')}`} aria-label="WhatsApp">
                    {React.cloneElement(<MessageSquare />, { style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })}
                  </a>
                ) : null}
                <button className="rounded-full bg-slate-100 text-slate-800" style={{ padding: 'clamp(0.375rem, 1.5vw, 0.5rem)', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Video call">
                  {React.cloneElement(<Video />, { style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })}
                </button>
              </div>
            </div>
            {f.birthday ? <div className="mt-1 inline-flex items-center rounded-full bg-slate-900 font-bold text-white" style={{ gap: 'clamp(0.125rem, 0.5vw, 0.25rem)', paddingLeft: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingRight: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingTop: 'clamp(0.125rem, 0.5vw, 0.25rem)', paddingBottom: 'clamp(0.125rem, 0.5vw, 0.25rem)', fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{React.cloneElement(<Gift />, { style: { width: 'clamp(0.5rem, 2vw, 0.75rem)', height: 'clamp(0.5rem, 2vw, 0.75rem)' } })} Birthday {f.birthday}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

