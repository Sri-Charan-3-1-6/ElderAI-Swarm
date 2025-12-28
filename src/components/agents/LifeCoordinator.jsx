import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Car, CheckCircle2, ClipboardList, CreditCard, Plus, ShoppingCart, Stethoscope } from 'lucide-react';
import { getItem, storageKeys, subscribe, setItem, appendActivity } from '../../utils/storageUtils.js';
import { toast, notifyBrowser } from '../../utils/notificationUtils.js';
import { downloadIcsFile, downloadTextFile } from '../../utils/deviceActions.js';
import { useI18n } from '../../i18n/i18n.js';

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function daysInCalendar(monthDate) {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const startDay = start.getDay();
  const total = end.getDate();
  const slots = [];

  for (let i = 0; i < startDay; i++) slots.push(null);
  for (let d = 1; d <= total; d++) slots.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), d));
  while (slots.length % 7 !== 0) slots.push(null);
  return slots;
}

export default function LifeCoordinator() {
  const { ta } = useI18n();
  const [appointments, setAppointments] = useState(() => getItem(storageKeys.appointments, []));
  const [tasks, setTasks] = useState(() => getItem(storageKeys.tasks, []));
  const [month, setMonth] = useState(() => new Date());

  useEffect(() => subscribe(storageKeys.appointments, setAppointments), []);
  useEffect(() => subscribe(storageKeys.tasks, setTasks), []);

  const todayISO = new Date().toISOString().slice(0, 10);

  const agenda = useMemo(() => {
    const today = new Date();
    const items = [
      { time: '07:00 AM', title: ta('Morning medicines'), type: 'medicine' },
      { time: '09:00 AM', title: ta('Morning walk'), type: 'activity' },
      { time: '10:30 AM', title: ta('Doctor appointment (Dr. Shah)'), type: 'health' },
      { time: '01:00 PM', title: ta('Lunch'), type: 'meal' },
      { time: '03:00 PM', title: ta('Family call'), type: 'family' },
      { time: '07:00 PM', title: ta('Evening medicines'), type: 'medicine' }
    ];

    const apptsToday = (appointments ?? []).filter((a) => a.dateISO?.slice(0, 10) === today.toISOString().slice(0, 10));
    const merged = [...items, ...apptsToday.map((a) => ({ time: new Date(a.dateISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), title: a.title, type: a.type }))];
    return merged;
  }, [appointments, ta]);

  const days = useMemo(() => daysInCalendar(month), [month]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return [...(appointments ?? [])]
      .filter((a) => new Date(a.dateISO).getTime() >= now)
      .sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO))
      .slice(0, 6);
  }, [appointments]);

  const markTaskDone = (id) => {
    const next = (tasks ?? []).map((t) => (t.id === id ? { ...t, status: 'done' } : t));
    setItem(storageKeys.tasks, next);
    appendActivity({ id: `act_${Date.now()}`, type: 'task', title: ta('Task completed'), ts: new Date().toISOString(), detail: next.find((t) => t.id === id)?.title ?? '' });
    toast({ title: ta('Task completed'), message: ta('Nice work. Everything is saved locally.'), type: 'success' });
  };

  const createTask = (title, dueInDays = 2) => {
    const next = [
      {
        id: `t_${Date.now()}`,
        title,
        dueInDays,
        status: 'open'
      },
      ...(tasks ?? [])
    ];
    setItem(storageKeys.tasks, next);
    appendActivity({ id: `act_${Date.now()}`, type: 'task', title: ta('Task created'), ts: new Date().toISOString(), detail: title });
    return next;
  };

  const bookDoctorAppointment = () => {
    const start = new Date();
    start.setDate(start.getDate() + 3);
    start.setHours(11, 0, 0, 0);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    const appt = {
      id: `ap_${Date.now()}`,
      title: ta('Doctor appointment'),
      dateISO: start.toISOString(),
      location: ta('Clinic'),
      type: 'health',
      notes: ta('Bring latest reports and medicine list.')
    };

    setItem(storageKeys.appointments, [appt, ...(appointments ?? [])]);
    appendActivity({ id: `act_${Date.now()}`, type: 'appointment', title: ta('Appointment added'), ts: new Date().toISOString(), detail: appt.title });

    downloadIcsFile('doctor-appointment.ics', {
      title: appt.title,
      startISO: appt.dateISO,
      endISO: end.toISOString(),
      description: appt.notes,
      location: appt.location
    });

    toast({ title: ta('Appointment created'), message: ta('Saved locally and exported as a calendar file (.ics).'), type: 'success' });
    notifyBrowser(ta('Appointment created'), { body: ta('Saved locally and exported as a calendar file (.ics).') });
  };

  const orderGroceries = () => {
    createTask(ta('Order groceries'), 1);
    const list = [ta('Milk'), ta('Vegetables'), ta('Fruits'), ta('Idli/dosa batter'), ta('Medicines refill (if needed)')];
    downloadTextFile('grocery-list.txt', `${ta('Grocery list')}\n\n${list.map((x) => `- ${x}`).join('\n')}\n\n${ta('Created by ElderAI Swarm.')}`);
    toast({ title: ta('Grocery list ready'), message: ta('Saved as a text file for sharing/printing.'), type: 'success' });
  };

  const payBills = () => {
    createTask(ta('Pay electricity bill'), 2);
    downloadTextFile(
      'bill-payment-note.txt',
      `${ta('Bill payment note')}\n\n- ${ta('Electricity bill')}: ${ta('pending')}\n- ${ta('Created')}: ${new Date().toLocaleString()}\n\n(${ta('You can attach this note to your banking/payment workflow.')})`
    );
    toast({ title: ta('Bill payment task created'), message: ta('Saved locally with a note file export.'), type: 'success' });
  };

  const bookTransportation = () => {
    createTask(ta('Book transportation'), 1);
    downloadTextFile(
      'transport-request.txt',
      `${ta('Transportation request')}\n\n- ${ta('Purpose')}: ${ta('Appointment')} / ${ta('Errand')}\n- ${ta('Pickup')}: ${ta('Home')}\n- ${ta('Created')}: ${new Date().toLocaleString()}\n\n(${ta('Use your preferred cab/transport provider.')})`
    );
    toast({ title: ta('Transport request created'), message: ta('Saved locally and exported as a text file.'), type: 'success' });
  };

  const addAppointment = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(11, 0, 0, 0);
    const appt = {
      id: `ap_${Date.now()}`,
      title: ta('Physiotherapy session'),
      dateISO: d.toISOString(),
      location: ta('Home visit'),
      type: 'health',
      notes: ta('Gentle knee exercises.')
    };

    const next = [appt, ...(appointments ?? [])];
    setItem(storageKeys.appointments, next);
    toast({ title: ta('Appointment added'), message: ta('Saved locally.'), type: 'success' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">{ta('Life Coordinator')}</h2>
          <p className="mt-1 text-slate-600">{ta('Calendar, agenda and tasks (offline-first).')}</p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-extrabold text-white shadow-card transition hover:brightness-110"
          onClick={addAppointment}
          aria-label={ta('Add appointment')}
        >
          <Plus aria-hidden="true" /> {ta('Add Appointment')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100 p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">{ta('Calendar')}</h3>
            <div className="flex items-center gap-2">
              <button className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-extrabold text-slate-800" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label={ta('Previous month')}>
                {ta('Prev')}
              </button>
              <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-extrabold text-slate-800">
                <CalendarDays aria-hidden="true" className="h-4 w-4" />
                {month.toLocaleDateString([], { month: 'long', year: 'numeric' })}
              </div>
              <button className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-extrabold text-slate-800" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label={ta('Next month')}>
                {ta('Next')}
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{ta(d)}</div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
            {days.map((d, idx) => {
              if (!d) return <div key={idx} className="h-14 rounded-xl bg-slate-50" />;
              const iso = d.toISOString().slice(0, 10);
              const isToday = iso === todayISO;
              const hasAppt = (appointments ?? []).some((a) => a.dateISO?.slice(0, 10) === iso);
              return (
                <div
                  key={idx}
                  className={
                    'h-14 rounded-xl border p-2 text-left transition ' +
                    (isToday ? 'border-primary bg-primary/10' : 'border-slate-200 bg-white')
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className={"text-sm font-extrabold " + (isToday ? 'text-primary' : 'text-slate-900')}>{d.getDate()}</div>
                      {hasAppt ? <span className="h-2 w-2 rounded-full bg-warning" aria-label={ta('Has appointment')} /> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100 p-5">
            <h3 className="text-lg font-bold">{ta("Today's Agenda")}</h3>
            <div className="mt-4 space-y-2">
              {agenda.map((a, i) => (
                <div key={i} className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-500">{a.time}</div>
                  <div className="mt-1 font-extrabold text-slate-900">{a.title}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100 p-5">
            <h3 className="text-lg font-bold">{ta('Upcoming Appointments')}</h3>
            <div className="mt-4 space-y-3">
              {upcoming.map((a) => (
                <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="font-extrabold text-slate-900">{a.title}</div>
                  <div className="mt-1 text-sm text-slate-700">{new Date(a.dateISO).toLocaleString()}</div>
                  <div className="text-sm text-slate-600">{a.location}</div>
                  <div className="mt-2 text-xs text-slate-500">{ta('Reminder')}: {ta('ON')}</div>
                </div>
              ))}
              {!upcoming.length ? <div className="rounded-xl bg-slate-50 p-4 text-slate-700">{ta('No upcoming appointments.')}</div> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100 p-5">
          <h3 className="text-lg font-bold">{ta('Task List')}</h3>
          <div className="mt-4 space-y-3">
            {(tasks ?? []).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div>
                  <div className="font-extrabold text-slate-900">{t.title}</div>
                  <div className="text-sm text-slate-600">{ta('Due in')} {t.dueInDays} {ta('days')}</div>
                </div>
                {t.status === 'done' ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-sm font-extrabold text-success">
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> {ta('Done')}
                  </span>
                ) : (
                  <button
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-extrabold text-white"
                    onClick={() => markTaskDone(t.id)}
                    aria-label={ta('Mark task as done')}
                  >
                    {ta('Done')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100 p-5 xl:col-span-2">
          <h3 className="text-lg font-bold">{ta('Quick Actions')}</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <ActionCard icon={<Stethoscope aria-hidden="true" />} title={ta('Book Doctor Appointment')} desc={ta('Creates a calendar event (.ics) and saves it locally.')} onClick={bookDoctorAppointment} />
            <ActionCard icon={<ShoppingCart aria-hidden="true" />} title={ta('Order Groceries')} desc={ta('Creates a task and exports a grocery list file.')} onClick={orderGroceries} />
            <ActionCard icon={<CreditCard aria-hidden="true" />} title={ta('Pay Bills')} desc={ta('Creates a task and exports a payment note file.')} onClick={payBills} />
            <ActionCard icon={<Car aria-hidden="true" />} title={ta('Book Transportation')} desc={ta('Creates a task and exports a transport request file.')} onClick={bookTransportation} />
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-700">
              <ClipboardList aria-hidden="true" className="h-4 w-4" /> {ta('Recent Activities')}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <div className="font-extrabold">{ta('Grocery delivered')}</div>
                <div className="text-sm text-slate-600">{ta('Yesterday')}</div>
              </div>
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <div className="font-extrabold">{ta('Electricity bill paid')}</div>
                <div className="text-sm text-slate-600">{ta('3 days ago')}</div>
              </div>
              <div className="rounded-lg bg-white p-3 shadow-sm">
                <div className="font-extrabold">{ta('Doctor appointment booked')}</div>
                <div className="text-sm text-slate-600">{ta('Last week')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ icon, title, desc, onClick }) {
  return (
    <button
      className="rounded-card bg-slate-900 p-5 text-left text-white shadow-card transition hover:bg-slate-800 focus:outline-none"
      onClick={onClick}
      aria-label={title}
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">{icon}</span>
        <div>
          <div className="text-lg font-extrabold">{title}</div>
          <div className="text-white/80">{desc}</div>
        </div>
      </div>
    </button>
  );
}
