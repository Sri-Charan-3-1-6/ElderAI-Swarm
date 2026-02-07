import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, ClipboardList, Droplet, HeartPulse, PlusCircle, Stethoscope, Thermometer, Timer } from 'lucide-react';
import DailyCheckIn from './DailyCheckIn.jsx';
import VitalsEntry from './VitalsEntry.jsx';
import HealthCharts from './HealthCharts.jsx';
import SymptomTracker from './SymptomTracker.jsx';
import HealthReport from './HealthReport.jsx';
import HydrationTracker from './HydrationTracker.jsx';
import { HEALTH_KEYS, computeHealthScore, correlateMissedMedicines, detectAlerts, summarizeCompliance } from '../../utils/healthCalculations.js';
import { getItem, setItem } from '../../utils/storageUtils.js';
import { sendNotification } from '../../utils/notifications.js';
import { getTodayDate } from '../../utils/timeHelpers.js';
import { useI18n } from '../../i18n/i18n.js';

const PANELS = ['overview', 'checkin', 'vitals', 'charts', 'symptoms', 'hydration', 'report'];

export default function HealthDashboard({ dailyLogs }) {
  const { ta } = useI18n();
  const [active, setActive] = useState('overview');
  const [checkIns, setCheckIns] = useState(() => getItem(HEALTH_KEYS.CHECK_INS, []));
  const [vitals, setVitals] = useState(() => getItem(HEALTH_KEYS.VITALS, []));
  const [symptoms, setSymptoms] = useState(() => getItem(HEALTH_KEYS.SYMPTOMS, []));
  const [hydration, setHydration] = useState(() => getItem(HEALTH_KEYS.HYDRATION, { date: getTodayDate(), intake: 0, goal: 8, remindersEnabled: true }));
  const [alerts, setAlerts] = useState([]);

  useEffect(() => setItem(HEALTH_KEYS.CHECK_INS, checkIns), [checkIns]);
  useEffect(() => setItem(HEALTH_KEYS.VITALS, vitals), [vitals]);
  useEffect(() => setItem(HEALTH_KEYS.SYMPTOMS, symptoms), [symptoms]);
  useEffect(() => setItem(HEALTH_KEYS.HYDRATION, hydration), [hydration]);

  const compliance = useMemo(() => summarizeCompliance(dailyLogs), [dailyLogs]);

  const latestCheckIn = checkIns.slice(-1)[0];
  const latestVitals = useMemo(() => {
    const bp = [...vitals].filter((v) => v.type === 'bp').slice(-1)[0];
    const hr = [...vitals].filter((v) => v.type === 'heart').slice(-1)[0];
    const wt = [...vitals].filter((v) => v.type === 'weight').slice(-1)[0];
    const temp = [...vitals].filter((v) => v.type === 'temp').slice(-1)[0];
    const sugar = [...vitals].filter((v) => v.type === 'sugar').slice(-1)[0];
    return {
      bp: bp?.bp,
      heartRate: hr?.heartRate,
      weight: wt?.weight,
      temperature: temp?.temperature,
      bloodSugar: sugar?.bloodSugar
    };
  }, [vitals]);

  const healthScore = useMemo(() => computeHealthScore({ latestCheckIn, latestVitals, compliancePercent: compliance.compliancePercent }), [latestCheckIn, latestVitals, compliance]);
  const missCorrelation = useMemo(() => correlateMissedMedicines({ checkIns, medicineLogs: dailyLogs }), [checkIns, dailyLogs]);

  useEffect(() => {
    const weightTrend = vitals.filter((v) => v.type === 'weight').slice(-8);
    const todays = checkIns.filter((c) => c.date === getTodayDate());
    const lastCheckDate = checkIns.slice(-1)[0]?.date;
    const daysSinceCheck = lastCheckDate ? Math.max(0, Math.round((Date.now() - new Date(lastCheckDate).getTime()) / (24 * 60 * 60 * 1000))) : 3;
    const nextAlerts = detectAlerts({ checkIns, vitals, weightTrend, hydration, missedDays: daysSinceCheck });
    setAlerts(nextAlerts);
  }, [checkIns, vitals, hydration]);

  useEffect(() => {
    if (!hydration?.remindersEnabled) return;
    const lastNotified = Number(localStorage.getItem('health.lastHydrationReminder') || 0);
    const now = Date.now();
    if (now - lastNotified > 2 * 60 * 60 * 1000 && (hydration.goal ?? 8) > (hydration.intake ?? 0)) {
      sendNotification('Time to drink water', 'Tap to log a glass.');
      localStorage.setItem('health.lastHydrationReminder', String(now));
    }
    const id = window.setInterval(() => {
      const ts = Date.now();
      if (ts - Number(localStorage.getItem('health.lastHydrationReminder') || 0) > 2 * 60 * 60 * 1000 && (hydration.goal ?? 8) > (hydration.intake ?? 0)) {
        sendNotification('Time to drink water', 'Tap to log a glass.');
        localStorage.setItem('health.lastHydrationReminder', String(ts));
      }
    }, 60 * 1000);
    return () => window.clearInterval(id);
  }, [hydration]);

  const handleCheckIn = (entry) => {
    setCheckIns((prev) => [...prev, entry].slice(-120));
    setActive('overview');
  };

  const handleVitals = (entry) => {
    setVitals((prev) => [...prev, entry].slice(-180));
  };

  const handleSymptom = (entry) => {
    setSymptoms((prev) => [...prev, entry].slice(-100));
    setActive('overview');
  };

  const handleFall = (entry) => {
    const enriched = { ...entry, type: 'fall' };
    setSymptoms((prev) => [...prev, enriched].slice(-100));
    sendNotification('Fall logged', 'Call family if hurt.');
  };

  const handleHydration = (state) => setHydration(state);

  const cards = [
    { key: 'checkin', title: 'Daily Check-In', icon: <ClipboardList className="h-5 w-5" /> },
    { key: 'vitals', title: 'Enter Vitals', icon: <HeartPulse className="h-5 w-5" /> },
    { key: 'hydration', title: 'Hydration', icon: <Droplet className="h-5 w-5" /> },
    { key: 'symptoms', title: 'Symptoms/Falls', icon: <AlertTriangle className="h-5 w-5" /> },
    { key: 'charts', title: 'Charts', icon: <BarChart3 className="h-5 w-5" /> },
    { key: 'report', title: 'Doctor Report', icon: <Stethoscope className="h-5 w-5" /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 3vw, 1.5rem)' }}>
      <header className="bg-white shadow-card border-2 border-slate-700" style={{ 
        borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
        padding: 'clamp(1rem, 3vw, 1.25rem)'
      }}>
        <div className="flex flex-wrap items-center justify-between" style={{ gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
          <div>
            <div className="text-slate-500" style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', fontWeight: '600' }}>{ta('Health Guardian')}</div>
            <h2 style={{ fontSize: 'clamp(2rem, 7vw, 2.25rem)', fontWeight: '900', lineHeight: 1.2 }}>{ta('Health Monitoring')}</h2>
            <div className="text-slate-600" style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)', fontWeight: '600' }}>{ta('Daily check-ins, vitals, hydration, symptoms, reports.')}</div>
          </div>
          <div className="bg-slate-900 text-white" style={{ 
            borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
            padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.875rem, 3vw, 1rem)'
          }}>
            <div className="text-white/80" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)', fontWeight: '600', textTransform: 'uppercase' }}>{ta('Today score')}</div>
            <div className="flex items-center" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(2rem, 7vw, 2.25rem)', fontWeight: '900' }}>
              {healthScore}<span style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)', fontWeight: '600' }}>/100</span>
            </div>
            <div className="text-white/80" style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', fontWeight: '600' }}>Medicine compliance: {compliance.compliancePercent}%</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3" style={{ marginTop: 'clamp(0.75rem, 2vw, 1rem)' }}>
          <SummaryCard icon={<HeartPulse className="h-5 w-5" />} label="Latest BP" value={latestVitals?.bp ? `${latestVitals.bp.systolic}/${latestVitals.bp.diastolic}` : 'Not set'} tone="primary" />
          <SummaryCard icon={<Activity className="h-5 w-5" />} label="Heart Rate" value={latestVitals?.heartRate ? `${latestVitals.heartRate} bpm` : 'Add'} tone="success" />
          <SummaryCard icon={<Thermometer className="h-5 w-5" />} label="Temperature" value={latestVitals?.temperature ? `${latestVitals.temperature}°F` : 'Add'} tone="warning" />
        </div>
      </header>

      {alerts.length ? (
        <div className="border border-warning/40 bg-warning/10 text-slate-800" style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(0.375rem, 1.5vw, 0.5rem)',
          borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
          padding: 'clamp(0.875rem, 3vw, 1rem)'
        }}>
          <div className="flex items-center" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)', fontWeight: '800' }}>
            {React.cloneElement(<AlertTriangle />, { style: { width: 'clamp(1rem, 4vw, 1.25rem)', height: 'clamp(1rem, 4vw, 1.25rem)' } })} Health alerts
          </div>
          {alerts.map((a, i) => (
            <div key={i} className="bg-white text-slate-800 border border-slate-600" style={{ 
              borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
              padding: 'clamp(0.625rem, 2vw, 0.75rem)',
              fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
              fontWeight: '700'
            }}>{a}</div>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-3" style={{ gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
        {cards.map((c) => (
          <button
            type="button"
            key={c.key}
            onClick={() => setActive(c.key)}
            className={
              'border shadow-sm transition text-left ' +
              (active === c.key ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-900')
            }
            style={{ 
              borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
              padding: 'clamp(0.875rem, 3vw, 1rem)'
            }}
            aria-label={c.title}
          >
            <div className="flex items-center" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)', fontWeight: '800' }}>
              {React.cloneElement(c.icon, { style: { width: 'clamp(1rem, 4vw, 1.25rem)', height: 'clamp(1rem, 4vw, 1.25rem)' } })} {c.title}
            </div>
            <div className="text-white/80 text-slate-600" style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', fontWeight: '600' }}>Quick access</div>
          </button>
        ))}
      </div>

      {active === 'overview' ? (
        <div className="grid md:grid-cols-2" style={{ gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
          <HydrationTracker hydration={hydration} onUpdate={handleHydration} />
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
            <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>Wellness summary</div>
            <div className="rounded-xl bg-white border border-slate-600 font-semibold text-slate-700" style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>Weekly summary: {summaryText(checkIns)}</div>
            <div className="rounded-xl bg-white border border-slate-600 font-semibold text-slate-700" style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>Missed medicines + unwell days: {missCorrelation}</div>
            <div className="rounded-xl bg-white border border-slate-600 font-semibold text-slate-700" style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>Last check-in: {latestCheckIn?.date || 'No check-in yet'}</div>
            <div className="grid grid-cols-2" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
              <button className="rounded-xl bg-primary font-extrabold text-white" style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }} onClick={() => setActive('checkin')}>{ta('Daily Check-In')}</button>
              <button className="rounded-xl bg-slate-900 font-extrabold text-white" style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }} onClick={() => setActive('vitals')}>{ta('Enter Vitals')}</button>
            </div>
          </div>
        </div>
      ) : null}

      {active === 'checkin' ? <DailyCheckIn onSave={handleCheckIn} entries={checkIns} /> : null}
      {active === 'vitals' ? <VitalsEntry onSave={handleVitals} entries={vitals} /> : null}
      {active === 'charts' ? <HealthCharts checkIns={checkIns} vitals={vitals} /> : null}
      {active === 'symptoms' ? <SymptomTracker onAddSymptom={handleSymptom} symptoms={symptoms} onLogFall={handleFall} /> : null}
      {active === 'hydration' ? <HydrationTracker hydration={hydration} onUpdate={handleHydration} /> : null}
      {active === 'report' ? <HealthReport checkIns={checkIns} vitals={vitals} medicineCompliance={compliance} medicineMissCorrelation={missCorrelation} /> : null}
    </div>
  );
}

function SummaryCard({ icon, label, value, tone = 'primary' }) {
  const map = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning'
  };
  return (
    <div className="border border-slate-200 bg-white" style={{ 
      borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
      padding: 'clamp(0.875rem, 3vw, 1rem)'
    }}>
      <div className="flex items-center text-slate-600" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', fontWeight: '700' }}>
        {React.cloneElement(icon, { style: { width: 'clamp(1rem, 4vw, 1.25rem)', height: 'clamp(1rem, 4vw, 1.25rem)' } })} {label}
      </div>
      <div className={map[tone] || map.primary} style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)', fontWeight: '900' }}>{value}</div>
    </div>
  );
}

function summaryText(checkIns) {
  const last7 = checkIns.slice(-7);
  const good = last7.filter((c) => c.feeling === 'great' || c.feeling === 'good').length;
  const ok = last7.filter((c) => c.feeling === 'okay').length;
  const not = last7.filter((c) => c.feeling === 'not-well' || c.feeling === 'bad').length;
  return `${good} good days, ${ok} okay, ${not} concerning`;
}

