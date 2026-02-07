import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, CloudSun, FileText, ListChecks, ShoppingCart, Siren, Sparkles } from 'lucide-react';
import AppointmentManager from './AppointmentManager.jsx';
import TaskList from './TaskList.jsx';
import GroceryList from './GroceryList.jsx';
import BillReminders from './BillReminders.jsx';
import MedicineInventory from './MedicineInventory.jsx';
import FamilyDirectory from './FamilyDirectory.jsx';
import TransportBooking from './TransportBooking.jsx';
import RoutineTracker from './RoutineTracker.jsx';
import VoiceMemos from './VoiceMemos.jsx';
import { getItem, setItem } from '../../utils/storageUtils.js';
import { getWeather } from '../../utils/weatherAPI.js';
import { sendNotification } from '../../utils/notifications.js';
import { useI18n } from '../../i18n/i18n.js';

const KEYS = {
  appointments: 'life.appointments.v2',
  tasks: 'life.tasks.v2',
  groceries: 'life.groceries.v1',
  bills: 'life.bills.v1',
  inventory: 'life.inventory.v1',
  family: 'life.family.v1',
  routines: 'life.routines.v1'
};

export default function LifeDashboard({ medicines = [] }) {
  const { ta } = useI18n();
  const [appointments, setAppointments] = useState(() => getItem(KEYS.appointments, []));
  const [tasks, setTasks] = useState(() => getItem(KEYS.tasks, []));
  const [groceries, setGroceries] = useState(() => ensureGroceries(getItem(KEYS.groceries, defaultGroceries())));
  const [bills, setBills] = useState(() => getItem(KEYS.bills, []));
  const [inventory, setInventory] = useState(() => getItem(KEYS.inventory, {}));
  const [family, setFamily] = useState(() => getItem(KEYS.family, defaultFamily()));
  const [routines, setRoutines] = useState(() => getItem(KEYS.routines, defaultRoutine()));
  const [weather, setWeather] = useState({ temperature: 27, condition: 'Pleasant', suggestion: 'Enjoy your day!' });

  useEffect(() => setItem(KEYS.appointments, appointments), [appointments]);
  useEffect(() => setItem(KEYS.tasks, tasks), [tasks]);
  useEffect(() => setItem(KEYS.groceries, groceries), [groceries]);
  useEffect(() => setItem(KEYS.bills, bills), [bills]);
  useEffect(() => setItem(KEYS.inventory, inventory), [inventory]);
  useEffect(() => setItem(KEYS.family, family), [family]);
  useEffect(() => setItem(KEYS.routines, routines), [routines]);

  useEffect(() => {
    getWeather().then(setWeather);
  }, []);

  const upcomingAppointments = useMemo(() => appointments.filter((a) => new Date(a.dateISO).getTime() >= Date.now()).slice(0, 5), [appointments]);
  const dailyTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);

  const addTask = (task) => setTasks((prev) => [task, ...prev].slice(0, 200));
  const updateTasks = (next) => setTasks(next);

  const handleLowMedicine = (item) => {
    const name = item.name;
    if (!groceries.items.some((g) => g.name.toLowerCase() === name.toLowerCase())) {
      const next = { ...groceries, items: [{ id: `g_${Date.now()}`, name: `Buy ${name}`, category: 'Medicines', done: false }, ...groceries.items] };
      setGroceries(next);
      sendNotification('Medicine low', `Added "Buy ${name}" to grocery list.`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 3vw, 1.5rem)' }}>
      <header className="bg-white shadow-card border-2 border-slate-700" style={{ 
        borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
        padding: 'clamp(1rem, 3vw, 1.25rem)'
      }}>
        <div className="flex flex-wrap items-center justify-between" style={{ gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
          <div>
            <div className="text-slate-500" style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', fontWeight: '600' }}>{ta('Life Coordinator')}</div>
            <h2 style={{ fontSize: 'clamp(2rem, 7vw, 2.25rem)', fontWeight: '900', lineHeight: 1.2 }}>{ta('Daily Tasks & Appointments')}</h2>
            <div className="text-slate-600" style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)', fontWeight: '600' }}>{ta('Appointments, tasks, bills, groceries, transport, voice notes.')}</div>
          </div>
          <div className="bg-slate-900 text-white" style={{ 
            borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
            padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.875rem, 3vw, 1rem)'
          }}>
            <div className="text-white/80 flex items-center" style={{ 
              fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)',
              fontWeight: '600',
              textTransform: 'uppercase',
              gap: 'clamp(0.375rem, 1.5vw, 0.5rem)'
            }}>
              {React.cloneElement(<CloudSun />, { style: { width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' } })} Today
            </div>
            <div style={{ fontSize: 'clamp(1.5rem, 6vw, 1.875rem)', fontWeight: '900' }}>{weather.temperature}°C</div>
            <div className="text-white/80" style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', fontWeight: '600' }}>{weather.condition} • {weather.suggestion}</div>
          </div>
        </div>
      </header>

      <div className="grid md:grid-cols-2" style={{ gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
        <QuickCard icon={<CalendarDays className="h-5 w-5" />} title="Upcoming" value={`${upcomingAppointments.length} appointments`} tone="primary" />
        <QuickCard icon={<ListChecks className="h-5 w-5" />} title="Tasks" value={`${dailyTasks.length} open tasks`} tone="success" />
        <QuickCard icon={<ShoppingCart className="h-5 w-5" />} title="Groceries" value={`${groceries.items.filter((i) => !i.done).length} to buy`} tone="warning" />
        <QuickCard icon={<AlertTriangle className="h-5 w-5" />} title="Bills" value={`${bills.filter((b) => !b.paid).length} due`} tone="danger" />
      </div>

      <AppointmentManager
        appointments={appointments}
        onChange={setAppointments}
        addTask={addTask}
      />

      <TaskList
        tasks={tasks}
        onChange={updateTasks}
        upcomingAppointments={upcomingAppointments}
        medicines={medicines}
      />

      <div className="grid lg:grid-cols-2" style={{ gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
        <GroceryList groceries={groceries} onChange={setGroceries} />
        <BillReminders bills={bills} onChange={setBills} />
      </div>

      <div className="grid lg:grid-cols-2" style={{ gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
        <MedicineInventory inventory={inventory} onChange={setInventory} medicines={medicines} onLowSupply={handleLowMedicine} />
        <FamilyDirectory family={family} onChange={setFamily} />
      </div>

      <div className="grid lg:grid-cols-2" style={{ gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
        <TransportBooking />
        <RoutineTracker routines={routines} onChange={setRoutines} />
      </div>

      <div className="grid lg:grid-cols-2" style={{ gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
        <VoiceMemos />
        <div className="border border-slate-200 bg-white shadow-sm" style={{ 
          borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
          padding: 'clamp(0.875rem, 3vw, 1rem)'
        }}>
          <div className="flex items-center text-slate-900" style={{ 
            gap: 'clamp(0.375rem, 1.5vw, 0.5rem)',
            fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
            fontWeight: '900'
          }}>
            {React.cloneElement(<Siren />, { style: { width: 'clamp(1rem, 4vw, 1.25rem)', height: 'clamp(1rem, 4vw, 1.25rem)' }, className: 'text-danger' })} Safety reminders
          </div>
          <ul className="font-semibold text-slate-700" style={{ 
            marginTop: 'clamp(0.375rem, 1.5vw, 0.5rem)',
            fontSize: 'clamp(0.875rem, 3vw, 1rem)'
          }}>
            <li style={{ marginTop: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>Carry phone when walking.</li>
            <li style={{ marginTop: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>Keep floor dry to avoid slips.</li>
            <li style={{ marginTop: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>Plan transport a day before appointments.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function QuickCard({ icon, title, value, tone = 'primary' }) {
  const map = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger'
  };
  return (
    <div className="border border-slate-200 bg-white shadow-sm" style={{ 
      borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
      padding: 'clamp(0.875rem, 3vw, 1rem)'
    }}>
      <div className="flex items-center text-slate-700" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', fontWeight: '700' }}>
        {React.cloneElement(icon, { style: { width: 'clamp(1rem, 4vw, 1.25rem)', height: 'clamp(1rem, 4vw, 1.25rem)' } })} {title}
      </div>
      <div className={map[tone] || map.primary} style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)', fontWeight: '900' }}>{value}</div>
    </div>
  );
}

function defaultGroceries() {
  return {
    items: [
      { id: 'g1', name: 'Milk', category: 'Milk & Dairy', done: false },
      { id: 'g2', name: 'Rice', category: 'Rice & Grains', done: false },
      { id: 'g3', name: 'Bananas', category: 'Fruits & Vegetables', done: false }
    ]
  };
}

function ensureGroceries(value) {
  if (value && Array.isArray(value.items)) return value;
  return defaultGroceries();
}

function defaultFamily() {
  return [
    { id: 'f1', name: 'Daughter', relation: 'Family', phone: '+91-0000000001', whatsapp: '+91-0000000001', birthday: '1945-08-01' },
    { id: 'f2', name: 'Son', relation: 'Family', phone: '+91-0000000002', whatsapp: '+91-0000000002' }
  ];
}

function defaultRoutine() {
  return {
    morning: [
      { id: 'r1', text: 'Morning medicine', done: false },
      { id: 'r2', text: 'Breakfast', done: false },
      { id: 'r3', text: 'Short walk', done: false }
    ],
    afternoon: [
      { id: 'r4', text: 'Lunch', done: false },
      { id: 'r5', text: 'Afternoon medicine', done: false }
    ],
    evening: [
      { id: 'r6', text: 'Dinner', done: false },
      { id: 'r7', text: 'Evening medicine', done: false },
      { id: 'r8', text: 'Call family', done: false }
    ]
  };
}

