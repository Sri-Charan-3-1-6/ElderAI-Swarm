import React, { useMemo, useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { sendNotification } from '../../utils/notifications.js';
import { useI18n } from '../../i18n/i18n.js';

export default function TaskList({ tasks, onChange, upcomingAppointments = [], medicines = [] }) {
  const { ta } = useI18n();
  const [text, setText] = useState('');
  const [priority, setPriority] = useState('normal');

  const autoTasks = useMemo(() => {
    const medTasks = medicines.map((m) => ({ id: `med_${m.id}`, text: `${m.name} - take on time`, category: 'medicine', completed: false, priority: 'high' }));
    const apptTasks = upcomingAppointments.map((a) => ({ id: `appt_${a.id}`, text: `Prepare for ${a.title}`, category: 'appointment', completed: false, priority: 'high' }));
    return [...medTasks, ...apptTasks];
  }, [medicines, upcomingAppointments]);

  const toggle = (id) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed, completedDate: new Date().toISOString() } : t));
    onChange(updated);
    const done = updated.find((t) => t.id === id)?.completed;
    if (done) sendNotification('Task done', 'Great job!');
  };

  const addTask = () => {
    if (!text.trim()) return;
    onChange([{ id: `t_${Date.now()}`, text: text.trim(), category: 'personal', completed: false, priority, recurring: 'once' }, ...tasks]);
    setText('');
  };

  const openTasks = tasks.filter((t) => !t.completed);
  const doneTasks = tasks.filter((t) => t.completed).slice(-5);

  return (
    <div className="border border-slate-200 bg-white shadow-sm" style={{ 
      borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
      padding: 'clamp(0.875rem, 3vw, 1rem)'
    }}>
      <div className="flex items-center text-slate-900" style={{ 
        gap: 'clamp(0.375rem, 1.5vw, 0.5rem)',
        fontSize: 'clamp(1.5rem, 6vw, 1.875rem)',
        fontWeight: '900',
        marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)'
      }}>
        {React.cloneElement(<Sparkles />, { style: { width: 'clamp(1.25rem, 5vw, 1.75rem)', height: 'clamp(1.25rem, 5vw, 1.75rem)' }, className: 'text-primary' })} Task List
      </div>
      <div className="flex flex-wrap" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
        <input
          className="flex-1 border border-slate-200 bg-white font-semibold"
          style={{ 
            borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
            padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.75rem, 2.5vw, 1rem)',
            fontSize: 'clamp(1rem, 4vw, 1.25rem)',
            height: 'clamp(3rem, 10vw, 3.5rem)',
            minWidth: 'clamp(150px, 45vw, 200px)'
          }}
          placeholder={ta('Add a task')}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <select className="border border-slate-200 bg-white font-bold" style={{ 
          borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
          padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.75rem, 2.5vw, 1rem)',
          fontSize: 'clamp(0.875rem, 3vw, 1rem)',
          height: 'clamp(3rem, 10vw, 3.5rem)'
        }} value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
        <button className="bg-primary text-white" style={{ 
          borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
          padding: 'clamp(0.75rem, 2.5vw, 1rem) clamp(0.875rem, 3vw, 1rem)',
          fontSize: 'clamp(1rem, 4vw, 1.25rem)',
          fontWeight: '900',
          height: 'clamp(3rem, 10vw, 3.5rem)',
          minWidth: 'clamp(70px, 20vw, 90px)'
        }} onClick={addTask} aria-label={ta('Add task')}>{ta('Add')}</button>
      </div>

      <div className="bg-white border border-slate-600 font-semibold text-slate-700" style={{ 
        borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
        padding: 'clamp(0.625rem, 2vw, 0.75rem)',
        fontSize: 'clamp(0.875rem, 3vw, 1rem)',
        marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)'
      }}>Daily completion: {Math.round(((tasks.length - openTasks.length) / Math.max(1, tasks.length)) * 100)}%</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
        {[...autoTasks, ...openTasks].map((t) => (
          <div key={t.id} className="flex items-center justify-between bg-white border border-slate-600" style={{ 
            borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
            padding: 'clamp(0.625rem, 2vw, 0.75rem)',
            gap: 'clamp(0.5rem, 2vw, 1rem)',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: '1 1 auto', minWidth: 'clamp(150px, 50vw, 200px)' }}>
              <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)' }}>{t.text}</div>
              <div className="text-slate-600" style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)' }}>{t.category} • Priority {t.priority}</div>
            </div>
            <button
              className={'flex items-center font-extrabold ' + (t.completed ? 'bg-success/10 text-success' : 'bg-slate-900 text-white')}
              style={{ 
                gap: 'clamp(0.25rem, 1vw, 0.375rem)',
                borderRadius: 'clamp(1.25rem, 5vw, 1.5rem)',
                padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 2.5vw, 1rem)',
                fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                minHeight: '44px',
                whiteSpace: 'nowrap'
              }}
              onClick={() => toggle(t.id)}
            >
              {React.cloneElement(<CheckCircle2 />, { style: { width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' } })} {t.completed ? 'Done' : 'Mark done'}
            </button>
          </div>
        ))}
      </div>

      {doneTasks.length ? (
        <div className="bg-white border border-slate-600 shadow-sm" style={{ 
          borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
          padding: 'clamp(0.625rem, 2vw, 0.75rem)',
          marginTop: 'clamp(0.5rem, 1.5vw, 0.75rem)'
        }}>
          <div className="font-bold text-slate-700" style={{ fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>Recently done</div>
          <div className="grid grid-cols-2 font-semibold text-slate-800" style={{ 
            marginTop: 'clamp(0.375rem, 1.5vw, 0.5rem)',
            gap: 'clamp(0.375rem, 1.5vw, 0.5rem)',
            fontSize: 'clamp(0.875rem, 3vw, 1rem)'
          }}>
            {doneTasks.map((t) => (
              <div key={t.id} className="bg-white border border-slate-600" style={{ 
                borderRadius: 'clamp(0.5rem, 2vw, 0.75rem)',
                padding: 'clamp(0.375rem, 1.5vw, 0.5rem)'
              }}>{t.text}</div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

