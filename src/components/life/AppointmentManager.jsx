import React, { useMemo, useState } from 'react';
import { BellRing, MapPin, Phone, Plus } from 'lucide-react';
import Calendar from '../shared/Calendar.jsx';
import { sendNotification } from '../../utils/notifications.js';
import { useI18n } from '../../i18n/i18n.js';

export default function AppointmentManager({ appointments, onChange, addTask }) {
  const { ta } = useI18n();
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState(new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState({ title: 'Doctor Visit', location: '', date: selected, time: '10:00', doctor: '', phone: '', needsTransport: false, notes: '' });

  const highlighted = useMemo(() => appointments.map((a) => a.dateISO.slice(0, 10)), [appointments]);
  const selectedAppointments = useMemo(() => appointments.filter((a) => a.dateISO.startsWith(selected)).sort((a, b) => a.dateISO.localeCompare(b.dateISO)), [appointments, selected]);

  const save = () => {
    if (!form.title.trim()) return;
    const dateISO = `${form.date}T${form.time || '10:00'}`;
    const appt = {
      id: `ap_${Date.now()}`,
      title: form.title.trim(),
      dateISO,
      location: form.location,
      doctorName: form.doctor,
      phone: form.phone,
      needsTransport: Boolean(form.needsTransport),
      notes: form.notes
    };
    onChange([appt, ...appointments].slice(0, 200));
    addTask?.({ id: `t_${Date.now()}`, text: `Get ready for ${appt.title}`, category: 'appointment', completed: false, priority: 'high', time: form.time, recurring: 'once' });
    sendNotification('Appointment added', `${appt.title} on ${new Date(dateISO).toLocaleString()}`);
  };

  return (
    <div className="border border-slate-200 bg-white shadow-sm" style={{ 
      borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
      padding: 'clamp(0.875rem, 3vw, 1rem)'
    }}>
      <div className="flex items-center text-slate-900" style={{ 
        gap: 'clamp(0.375rem, 1.5vw, 0.5rem)',
        fontSize: 'clamp(1.5rem, 6vw, 1.875rem)',
        fontWeight: '900',
        marginBottom: 'clamp(0.75rem, 2vw, 1rem)'
      }}>
        {React.cloneElement(<BellRing />, { style: { width: 'clamp(1.25rem, 5vw, 1.75rem)', height: 'clamp(1.25rem, 5vw, 1.75rem)' }, className: 'text-primary' })} Appointments
      </div>
      <div className="grid lg:grid-cols-3" style={{ gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
        <div className="lg:col-span-2">
          <Calendar
            month={month}
            onPrev={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            onNext={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            selectedISO={selected}
            onSelect={(iso) => {
              setSelected(iso);
              setForm((p) => ({ ...p, date: iso }));
            }}
            highlights={highlighted}
          />
        </div>
        <div className="border border-slate-200 bg-white" style={{ 
          borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
          padding: 'clamp(0.75rem, 2vw, 1rem)'
        }}>
          <div className="font-extrabold text-slate-900" style={{ 
            fontSize: 'clamp(1.125rem, 4.5vw, 1.25rem)',
            marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)'
          }}>{ta('Add appointment')}</div>
          <input className="w-full border border-slate-200 bg-white font-semibold" style={{ 
            borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
            padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.75rem, 2.5vw, 1rem)',
            fontSize: 'clamp(1rem, 4vw, 1.25rem)',
            height: 'clamp(3rem, 10vw, 3.5rem)',
            marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)'
          }} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder={ta('What?')} />
          <input className="w-full border border-slate-200 bg-white font-semibold" style={{ 
            borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
            padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.75rem, 2.5vw, 1rem)',
            fontSize: 'clamp(1rem, 4vw, 1.25rem)',
            height: 'clamp(3rem, 10vw, 3.5rem)',
            marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)'
          }} value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder={ta('Where?')} />
          <div className="grid grid-cols-2" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
            <input type="date" className="border border-slate-200 bg-white font-semibold" style={{ 
              borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
              padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.75rem, 2.5vw, 1rem)',
              fontSize: 'clamp(0.875rem, 3.5vw, 1.125rem)',
              height: 'clamp(3rem, 10vw, 3.5rem)'
            }} value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
            <input type="time" className="border border-slate-200 bg-white font-semibold" style={{ 
              borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
              padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.75rem, 2.5vw, 1rem)',
              fontSize: 'clamp(0.875rem, 3.5vw, 1.125rem)',
              height: 'clamp(3rem, 10vw, 3.5rem)'
            }} value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} />
          </div>
          <input className="w-full border border-slate-200 bg-white font-semibold" style={{ 
            borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
            padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.75rem, 2.5vw, 1rem)',
            fontSize: 'clamp(1rem, 4vw, 1.25rem)',
            height: 'clamp(3rem, 10vw, 3.5rem)',
            marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)'
          }} value={form.doctor} onChange={(e) => setForm((p) => ({ ...p, doctor: e.target.value }))} placeholder={ta('Doctor name')} />
          <input className="w-full border border-slate-200 bg-white font-semibold" style={{ 
            borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
            padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.75rem, 2.5vw, 1rem)',
            fontSize: 'clamp(1rem, 4vw, 1.25rem)',
            height: 'clamp(3rem, 10vw, 3.5rem)',
            marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)'
          }} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder={ta('Clinic phone')} />
          <label className="flex items-center font-semibold text-slate-700" style={{ 
            gap: 'clamp(0.375rem, 1.5vw, 0.5rem)',
            fontSize: 'clamp(0.875rem, 3vw, 1rem)',
            marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)',
            minHeight: '44px'
          }}>
            <input type="checkbox" checked={form.needsTransport} onChange={(e) => setForm((p) => ({ ...p, needsTransport: e.target.checked }))} style={{ width: 'clamp(1rem, 4vw, 1.25rem)', height: 'clamp(1rem, 4vw, 1.25rem)' }} /> Need transport?
          </label>
          <textarea className="w-full border border-slate-200 bg-white font-semibold" style={{ 
            borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
            padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.75rem, 2.5vw, 1rem)',
            fontSize: 'clamp(0.875rem, 3vw, 1rem)',
            minHeight: 'clamp(80px, 20vw, 100px)',
            marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)'
          }} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder={ta('Notes')} />
          <button type="button" onClick={save} className="flex w-full items-center justify-center bg-primary text-white" style={{ 
            gap: 'clamp(0.375rem, 1.5vw, 0.5rem)',
            borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
            padding: 'clamp(0.75rem, 2.5vw, 1rem) clamp(0.875rem, 3vw, 1rem)',
            fontSize: 'clamp(1rem, 4vw, 1.25rem)',
            fontWeight: '900',
            height: 'clamp(3.5rem, 10vw, 4rem)'
          }} aria-label="Save appointment">
            {React.cloneElement(<Plus />, { style: { width: 'clamp(1rem, 4vw, 1.25rem)', height: 'clamp(1rem, 4vw, 1.25rem)' } })} Save appointment
          </button>
        </div>
      </div>

      <div className="border border-slate-200 bg-white" style={{ 
        borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
        padding: 'clamp(0.75rem, 2vw, 1rem)',
        marginTop: 'clamp(0.75rem, 2vw, 1rem)'
      }}>
        <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(1.125rem, 4.5vw, 1.25rem)' }}>Appointments on {selected}</div>
        {!selectedAppointments.length ? <div className="bg-white font-semibold text-slate-700" style={{ 
          marginTop: 'clamp(0.375rem, 1.5vw, 0.5rem)',
          borderRadius: 'clamp(0.5rem, 2vw, 0.75rem)',
          padding: 'clamp(0.625rem, 2vw, 0.75rem)',
          fontSize: 'clamp(0.875rem, 3vw, 1rem)'
        }}>No appointments on this day.</div> : null}
        <div style={{ marginTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', display: 'flex', flexDirection: 'column', gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
          {selectedAppointments.map((a) => (
            <div key={a.id} className="bg-white border border-slate-600 shadow-sm" style={{ 
              borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
              padding: 'clamp(0.625rem, 2vw, 0.75rem)'
            }}>
              <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(1.125rem, 4.5vw, 1.25rem)' }}>{a.title}</div>
              <div className="text-slate-700" style={{ fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>{new Date(a.dateISO).toLocaleString()}</div>
              {a.location ? <div className="flex items-center text-slate-700" style={{ 
                fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                gap: 'clamp(0.25rem, 1vw, 0.375rem)',
                marginTop: 'clamp(0.25rem, 1vw, 0.375rem)'
              }}>
                {React.cloneElement(<MapPin />, { style: { width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' } })} {a.location}
              </div> : null}
              {a.phone ? (
                <div className="text-primary font-bold flex items-center" style={{ 
                  gap: 'clamp(0.375rem, 1.5vw, 0.5rem)',
                  fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                  marginTop: 'clamp(0.25rem, 1vw, 0.375rem)'
                }}>
                  {React.cloneElement(<Phone />, { style: { width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' } })}
                  <a href={`tel:${a.phone}`} className="underline">Call clinic</a>
                </div>
              ) : null}
              <div className="text-slate-600" style={{ 
                fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                marginTop: 'clamp(0.25rem, 1vw, 0.375rem)'
              }}>Reminder: 1 day & 2 hours before</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

