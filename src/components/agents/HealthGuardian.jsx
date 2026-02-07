import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell
} from 'recharts';
import { Activity, Footprints, HeartPulse, ShieldCheck, Thermometer, Wind } from 'lucide-react';
import StatusIndicator from '../shared/StatusIndicator.jsx';
import EmergencyButton from '../shared/EmergencyButton.jsx';
import { getItem, storageKeys, subscribe, updateHealth, appendActivity } from '../../utils/storageUtils.js';
import { useI18n } from '../../i18n/i18n.js';
import {
  chartLast24Hours,
  chartStepsWeek,
  computeHealthScore,
  latestVitals,
  sleepBreakdown,
  tickHealth
} from '../../utils/healthSimulator.js';
import { createEmergencyIncident, runEmergencySequence } from '../../utils/emergencySimulator.js';

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B'];

export default function HealthGuardian() {
  const { ta } = useI18n();
  const [health, setHealth] = useState(() => getItem(storageKeys.health, null));

  useEffect(() => subscribe(storageKeys.health, setHealth), []);

  useEffect(() => {
    // Real-time simulation (throttled)
    const id = window.setInterval(() => {
      updateHealth((cur) => {
        if (!cur) return cur;
        return tickHealth(cur);
      });
    }, 9000);
    return () => window.clearInterval(id);
  }, []);

  const vitals = useMemo(() => latestVitals(health ?? {}), [health]);
  const score = useMemo(() => computeHealthScore(vitals), [vitals]);

  const hr24 = useMemo(() => chartLast24Hours(health?.heartRate ?? [], 'bpm'), [health]);
  const stepsWeek = useMemo(() => chartStepsWeek(health?.steps ?? []), [health]);
  const sleepPie = useMemo(() => sleepBreakdown(health?.sleep ?? []), [health]);

  const stepsToday = (health?.steps ?? []).slice(-1)[0]?.steps ?? 1847;
  const goal = 5000;

  const testFall = () => {
    const incident = createEmergencyIncident({ type: 'Fall', source: 'Fall Detection Test', notes: 'Triggered from Health Guardian test button.' });
    runEmergencySequence(incident, () => {});
    appendActivity({
      id: `act_${Date.now()}`,
      type: 'emergency',
      title: ta('Fall detection test triggered'),
      ts: new Date().toISOString(),
      detail: ta('Emergency simulation executed.')
    });
  };

  const alertText = health?.alerts?.[0]?.text;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
        <div>
          <h2 className="font-extrabold tracking-tight" style={{ fontSize: 'clamp(1.5rem, 6vw, 1.875rem)' }}>{ta('Health Guardian')}</h2>
          <p className="mt-1 text-slate-600" style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>{ta('Real-time vitals, trends, fall detection and recommendations (offline simulation).')}</p>
        </div>
        <div className="rounded-card bg-white shadow-card border-2 border-slate-700" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
          <div className="font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{ta('Overall health score')}</div>
          <div className="mt-1 flex items-center" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
            <div className="font-extrabold" style={{ fontSize: 'clamp(1.5rem, 6vw, 1.875rem)' }}>{score}/100</div>
            <span className={"rounded-full font-bold " + (score >= 80 ? 'bg-success/10 text-success' : score >= 60 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger')} style={{ padding: 'clamp(0.25rem, 1vw, 0.375rem) clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
              {ta(score >= 80 ? 'All Systems Normal' : score >= 60 ? 'Needs Attention' : 'High Risk')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4" style={{ gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
        <StatCard title={ta('Heart Rate')} value={`${vitals.bpm} ${ta('bpm')}`} icon={React.cloneElement(<HeartPulse />, { style: { width: 'clamp(0.875rem, 3.5vw, 1.25rem)', height: 'clamp(0.875rem, 3.5vw, 1.25rem)' } })} pulse />
        <StatCard title={ta('Blood Pressure')} value={`${vitals.sys}/${vitals.dia} mmHg`} icon={React.cloneElement(<Activity />, { style: { width: 'clamp(0.875rem, 3.5vw, 1.25rem)', height: 'clamp(0.875rem, 3.5vw, 1.25rem)' } })} />
        <StatCard title={ta('Oxygen')} value={`${vitals.spo2}%`} icon={React.cloneElement(<Wind />, { style: { width: 'clamp(0.875rem, 3.5vw, 1.25rem)', height: 'clamp(0.875rem, 3.5vw, 1.25rem)' } })} />
        <StatCard title={ta('Temperature')} value={`${vitals.tempF}°F`} icon={React.cloneElement(<Thermometer />, { style: { width: 'clamp(0.875rem, 3.5vw, 1.25rem)', height: 'clamp(0.875rem, 3.5vw, 1.25rem)' } })} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3" style={{ gap: 'clamp(1rem, 3vw, 1.5rem)' }}>
        <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100 xl:col-span-2" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('Heart Rate (Last 24 hours)')}</h3>
            <div className="text-slate-600" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Updates every ~9s')}</div>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hr24} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[60, 110]} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
          <h3 className="font-bold" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('Sleep Quality (Last week)')}</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Pie data={sleepPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                  {sleepPie.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-slate-600" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Deep / Light / REM (hours)')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3" style={{ gap: 'clamp(1rem, 3vw, 1.5rem)' }}>
        <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100 xl:col-span-2" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
          <h3 className="font-bold" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('Activity (Steps this week)')}</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stepsWeek}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="steps" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
          <h3 className="font-bold" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('Activity Monitor')}</h3>
          <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
            <Row icon={React.cloneElement(<Footprints />, { style: { width: 'clamp(0.875rem, 3.5vw, 1.25rem)', height: 'clamp(0.875rem, 3.5vw, 1.25rem)' } })} label={ta('Steps today')} value={`${stepsToday.toLocaleString()} / ${goal.toLocaleString()}`} />
            <Row icon={React.cloneElement(<Activity />, { style: { width: 'clamp(0.875rem, 3.5vw, 1.25rem)', height: 'clamp(0.875rem, 3.5vw, 1.25rem)' } })} label={ta('Active minutes')} value={ta('23 minutes')} />
            <Row icon={React.cloneElement(<HeartPulse />, { style: { width: 'clamp(0.875rem, 3.5vw, 1.25rem)', height: 'clamp(0.875rem, 3.5vw, 1.25rem)' } })} label={ta('Calories burned')} value={ta('145 cal')} />
            <div className="mt-3 rounded-xl bg-white border border-slate-600" style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
              <div className="font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{ta('Progress')}</div>
              <div className="mt-2 h-3 w-full rounded-full bg-slate-200">
                <div className="h-3 rounded-full bg-primary" style={{ width: `${Math.min(100, Math.round((stepsToday / goal) * 100))}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2" style={{ gap: 'clamp(1rem, 3vw, 1.5rem)' }}>
        <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('Fall Detection Status')}</h3>
            <div className="flex items-center" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
              <StatusIndicator status="active" />
              <span className="font-semibold text-slate-700" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('ACTIVE')}</span>
            </div>
          </div>
          <div className="mt-3 text-slate-700" style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>{ta('Last 30 days: No falls detected')}</div>
          <div className="mt-1 text-slate-600" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Sensitivity: HIGH')}</div>
          <div className="mt-4">
            <button
              className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 font-bold text-white transition hover:bg-slate-800 focus:outline-none"
              style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.75rem, 2.5vw, 1rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }}
              onClick={testFall}
              aria-label={ta('Test fall detection')}
            >
              {ta('Test Fall Detection')}
            </button>
          </div>
        </div>

        <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('Health Alerts')}</h3>
            <span className="rounded-full bg-slate-100 font-bold text-slate-700" style={{ padding: 'clamp(0.25rem, 1vw, 0.375rem) clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{ta('Recent')}</span>
          </div>

          {alertText ? (
            <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 text-slate-800" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
              <div className="font-bold" style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>{alertText}</div>
              <div className="mt-1 text-slate-700" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Recommendation: Hydrate, rest, and re-check in 15 minutes.')}</div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-success/30 bg-success/10 text-slate-800" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
              <div className="font-bold" style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>{ta('No alerts right now')}</div>
              <div className="mt-1 text-slate-700" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Vitals are stable right now.')}</div>
            </div>
          )}

          <div className="mt-4">
            <EmergencyButton onPress={testFall} size="lg" label={ta('Emergency Test')} />
          </div>
        </div>
      </div>

      <div className="rounded-card bg-slate-900 text-white shadow-card" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
        <div className="flex items-center" style={{ gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
          <span className="inline-flex items-center justify-center rounded-xl bg-white/10" style={{ width: 'clamp(2rem, 7vw, 2.5rem)', height: 'clamp(2rem, 7vw, 2.5rem)' }}>
            {React.cloneElement(<ShieldCheck />, { 'aria-hidden': true, style: { width: '70%', height: '70%' } })}
          </span>
          <div>
            <div className="font-extrabold" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('Safety Tips')}</div>
            <div className="text-white/80" style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>{ta('Move slowly, keep floors dry, and keep a phone nearby.')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, pulse }) {
  return (
    <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{title}</div>
          <div className={"mt-1 font-extrabold text-slate-900 " + (pulse ? 'animate-pulseSoft' : '')} style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>{value}</div>
        </div>
        <div className="flex items-center justify-center rounded-xl bg-white border border-slate-600 text-slate-700" style={{ width: 'clamp(2.75rem, 9vw, 3rem)', height: 'clamp(2.75rem, 9vw, 3rem)' }}>{icon}</div>
      </div>
    </div>
  );
}

function Row({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white border border-slate-600" style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
      <div className="flex items-center text-slate-700" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
        <span className="text-slate-700">{icon}</span>
        <span className="font-semibold" style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>{label}</span>
      </div>
      <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>{value}</div>
    </div>
  );
}

