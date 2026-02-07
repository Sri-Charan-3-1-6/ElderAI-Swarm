import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, CalendarDays, HeartPulse, Home, Pill, ShieldCheck, Sparkles } from 'lucide-react';
import MedicineList from './components/MedicineList.jsx';
import AddMedicineForm from './components/AddMedicineForm.jsx';
import HistoryCalendar from './components/HistoryCalendar.jsx';
import DailySummary from './components/DailySummary.jsx';
import NotificationHandler from './components/NotificationHandler.jsx';
import EmergencyButton from './components/EmergencyButton.jsx';
import EmergencyModal from './components/EmergencyModal.jsx';
import EmergencyContacts from './components/EmergencyContacts.jsx';
import EmergencyHistory from './components/EmergencyHistory.jsx';
import EmergencyTest from './components/EmergencyTest.jsx';
import HealthDashboard from './components/health/HealthDashboard.jsx';
import LifeDashboard from './components/life/LifeDashboard.jsx';
import Header from './components/layout/Header.jsx';
import BottomNav from './components/layout/BottomNav.jsx';
import { useI18n } from './i18n/i18n.js';
import { ensureSampleData, loadDailyLogs, loadMedicines, saveDailyLog, saveMedicines } from './utils/storage.js';
import { getItem, setItem, storageKeys } from './utils/storageUtils.js';
import { requestNotificationPermission, sendNotification } from './utils/notifications.js';
import { speakReminder } from './utils/speech.js';
import { getCurrentTime, getTodayDate, getYesterdayDate, isNewDay, lastNDates, toMinutes } from './utils/timeHelpers.js';
import {
  loadEmergencyContacts,
  saveEmergencyContacts,
  loadEmergencyLogs,
  saveEmergencyLogs,
  markEmergencyResolved,
  updateEmergencyNotes
} from './utils/emergency.js';
import AICompanion from './components/companion/AICompanion.jsx';

export default function App() {
  const [medicines, setMedicines] = useState(() => ensureSampleData(loadMedicines()));
  const [dailyLogs, setDailyLogs] = useState(() => loadDailyLogs());
  const [currentPage, setCurrentPage] = useState('home');
  const [medicineView, setMedicineView] = useState('today');
  const [lastDate, setLastDate] = useState(getTodayDate());
  const [emergencyContacts, setEmergencyContacts] = useState(() => loadEmergencyContacts());
  const [emergencyLogs, setEmergencyLogs] = useState(() => loadEmergencyLogs());
  const [emergencyModal, setEmergencyModal] = useState(null);
  const hasNotifiedRef = useRef({});
  const { ta } = useI18n();

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    saveMedicines(medicines);
  }, [medicines]);

  useEffect(() => {
    saveDailyLog(dailyLogs);
  }, [dailyLogs]);

  useEffect(() => {
    saveEmergencyContacts(emergencyContacts);
  }, [emergencyContacts]);

  useEffect(() => {
    saveEmergencyLogs(emergencyLogs);
  }, [emergencyLogs]);

  useEffect(() => {
    const tick = () => {
      const nowDate = getTodayDate();
      const nowTime = getCurrentTime();

      if (isNewDay(lastDate, nowDate)) {
        setDailyLogs((prev) => ({ ...prev, [nowDate]: prev[nowDate] || {} }));
        hasNotifiedRef.current = {};
        setLastDate(nowDate);
      }

      const nowMinutes = toMinutes(nowTime);
      setDailyLogs((prev) => {
        const next = { ...prev };
        const todayLog = { ...(next[nowDate] || {}) };
        medicines.forEach((med) => {
          med.times.forEach((time) => {
            const key = `${med.id}@${time}`;
            const entry = todayLog[key] || { status: 'pending' };
            if (entry.status !== 'taken') {
              const timeMinutes = toMinutes(time);
              if (nowMinutes - timeMinutes >= 60 && entry.status !== 'missed') {
                todayLog[key] = { ...entry, status: 'missed', missedAt: nowTime, name: med.name, time };
              }
            }
          });
        });
        next[nowDate] = todayLog;
        return next;
      });

      medicines.forEach((med) => {
        med.times.forEach((time) => {
          const key = `${med.id}@${time}`;
          const notifiedKey = `${nowDate}-${key}-${nowTime}`;
          if (hasNotifiedRef.current[notifiedKey]) return;
          if (nowTime === time) {
            hasNotifiedRef.current[notifiedKey] = true;
            sendNotification(med.name, time);
            speakReminder(med.name, med.language || 'en-IN');
          }
        });
      });
    };

    tick();
    const id = window.setInterval(tick, 30000);
    return () => window.clearInterval(id);
  }, [medicines, lastDate]);

  const markTaken = (medId, time) => {
    const today = getTodayDate();
    const takenAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setDailyLogs((prev) => {
      const next = { ...prev };
      const day = next[today] ? { ...next[today] } : {};
      const key = `${medId}@${time}`;
      day[key] = { status: 'taken', takenAt };
      next[today] = day;
      return next;
    });
  };

  const addMedicine = (payload) => {
    const med = {
      id: Date.now(),
      name: payload.name.trim(),
      instructions: (payload.instructions || '').trim(),
      times: payload.times,
      language: payload.language || 'en-IN'
    };
    setMedicines((prev) => [...prev, med]);
    setCurrentPage('medicine');
    setMedicineView('today');
  };

  const deleteMedicine = (id) => {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
    setDailyLogs((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((day) => {
        const filtered = Object.fromEntries(
          Object.entries(next[day]).filter(([key]) => !key.startsWith(`${id}@`))
        );
        next[day] = filtered;
      });
      return next;
    });
  };

  const today = getTodayDate();
  const todayLog = dailyLogs[today] || {};
  const yesterdayLog = dailyLogs[getYesterdayDate()] || {};
  const weeklyDates = lastNDates(7);

  const flatToday = useMemo(() => {
    return medicines.flatMap((med) =>
      med.times.map((time) => {
        const key = `${med.id}@${time}`;
        const entry = todayLog[key] || { status: 'pending' };
        return {
          key,
          medId: med.id,
          name: med.name,
          time,
          instructions: med.instructions,
          status: entry.status,
          takenAt: entry.takenAt,
          missedAt: entry.missedAt,
          language: med.language
        };
      })
    );
  }, [medicines, todayLog]);

  const summary = useMemo(() => {
    const taken = flatToday.filter((i) => i.status === 'taken').length;
    const missed = flatToday.filter((i) => i.status === 'missed').length;
    const pending = flatToday.length - taken - missed;
    return { taken, missed, pending, total: flatToday.length };
  }, [flatToday]);

  const yesterdaySummary = useMemo(() => {
    const entries = Object.values(yesterdayLog || {});
    const total = entries.length;
    const taken = entries.filter((e) => e.status === 'taken').length;
    const missed = entries.filter((e) => e.status === 'missed').length;
    const pending = total - taken - missed;
    return { total, taken, missed, pending };
  }, [yesterdayLog]);

  const weeklyCompliance = useMemo(() => {
    const days = weeklyDates.map((d) => dailyLogs[d] || {});
    let totalDays = 0;
    let perfect = 0;
    days.forEach((day) => {
      const entries = Object.values(day);
      if (!entries.length) return;
      totalDays += 1;
      const allTaken = entries.length > 0 && entries.every((e) => e.status === 'taken');
      if (allTaken) perfect += 1;
    });
    const percent = totalDays ? Math.round((perfect / totalDays) * 100) : 0;
    return { totalDays, perfect, percent };
  }, [dailyLogs, weeklyDates]);

  const handleEmergencyLogged = (entry) => {
    setEmergencyLogs((prev) => [entry, ...prev]);
  };

  const handleResolve = (id, resolved) => {
    const next = markEmergencyResolved(id, resolved);
    setEmergencyLogs(next);
  };

  const handleNotes = (id, notes) => {
    const next = updateEmergencyNotes(id, notes);
    setEmergencyLogs(next);
  };

  const nextMedicine = useMemo(() => {
    const pending = flatToday.filter((i) => i.status !== 'taken');
    const sorted = [...pending].sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
    return sorted[0] || null;
  }, [flatToday]);

  const latestEmergency = emergencyLogs[0];

  const handleBack = () => setCurrentPage('home');

  return (
    <div className="min-h-screen bg-app-bg text-slate-900">
      <NotificationHandler />
      <Header
        currentPage={currentPage}
        showBack={currentPage !== 'home'}
        onBack={handleBack}
        onSettings={() => setCurrentPage('settings')}
      />

      <main className="mx-auto max-w-5xl space-y-6" style={{ 
        padding: 'clamp(0.75rem, 3vw, 1.25rem)',
        paddingBottom: 'clamp(6rem, 15vw, 7rem)',
        paddingTop: 'clamp(0.75rem, 2vw, 1rem)'
      }}>
        {currentPage === 'home' && (
          <div className="space-y-5">
            <DailySummary summary={summary} yesterday={yesterdaySummary} weekly={weeklyCompliance} />

            <div className="grid gap-4 lg:grid-cols-3">
              <HeroCard
                title={ta("Today's Medicines")}
                primary={ta(`${summary.taken}/${summary.total} taken`)}
                detail={ta(`Pending ${summary.pending} • Missed ${summary.missed}`)}
                accent="bg-gradient-to-br from-sky-500 to-indigo-600"
                onClick={() => setCurrentPage('medicine')}
              />
              <HeroCard
                title={ta('Health & Vitals')}
                primary={ta(`${weeklyCompliance.percent}% perfect days`)}
                detail={ta(`Logged ${weeklyCompliance.totalDays || 0} days this week`)}
                accent="bg-gradient-to-br from-emerald-500 to-teal-600"
                onClick={() => setCurrentPage('health')}
              />
              <HeroCard
                title={ta('Life & Care')}
                primary={ta(`${medicines.length} routines`)}
                detail={ta('Reminders, tasks, and coordination')}
                accent="bg-gradient-to-br from-amber-400 to-orange-500"
                onClick={() => setCurrentPage('life')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <NextMedicineCard
                item={nextMedicine}
                onMarkTaken={markTaken}
                onHear={(name, language) => speakReminder(name, language)}
                onOpenMedicine={() => setCurrentPage('medicine')}
              />
              <EmergencyStatusCard
                latest={latestEmergency}
                onOpen={() => setCurrentPage('emergency')}
              />
            </div>

            <section className="rounded-3xl bg-white p-5 shadow-card border-2 border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black">{ta('Your ElderAI Agents')}</h2>
                <div className="text-sm font-semibold text-slate-500">{ta('Tap to open')}</div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AgentTile
                  icon={<Pill className="h-7 w-7" />}
                  title={ta('Medicine Buddy')}
                  description={ta('Reminds, logs, and speaks out medicines.')}
                  badge={ta(`${summary.taken}/${summary.total} done`)}
                  color="bg-sky-50 text-sky-900"
                  onClick={() => setCurrentPage('medicine')}
                />
                <AgentTile
                  icon={<HeartPulse className="h-7 w-7" />}
                  title={ta('Health Guardian')}
                  description={ta('Vitals, hydration, symptoms, and wellness.')}
                  badge={ta(`${weeklyCompliance.percent}% this week`)}
                  color="bg-emerald-50 text-emerald-900"
                  onClick={() => setCurrentPage('health')}
                />
                <AgentTile
                  icon={<Sparkles className="h-7 w-7" />}
                  title={ta('Life Coordinator')}
                  description={ta('Routines, tasks, and family coordination.')}
                  badge={ta(`${medicines.length} routines`)}
                  color="bg-amber-50 text-amber-900"
                  onClick={() => setCurrentPage('life')}
                />
                <AgentTile
                  icon={<Bot className="h-7 w-7" />}
                  title={ta('Daily Companion')}
                  description={ta('Chat, entertainment, and caring prompts.')}
                  badge={ta('Offline-first')}
                  color="bg-indigo-50 text-indigo-900"
                  onClick={() => setCurrentPage('companion')}
                />
                <AgentTile
                  icon={<ShieldCheck className="h-7 w-7" />}
                  title={ta('Emergency Responder')}
                  description={ta('One-tap SOS, contacts, and history.')}
                  badge={latestEmergency ? ta('Recent activity') : ta('Ready')}
                  color="bg-rose-50 text-rose-900"
                  onClick={() => setCurrentPage('emergency')}
                />
              </div>
            </section>
          </div>
        )}

        {currentPage === 'medicine' && (
          <section className="space-y-4">
            <InlineTabs
              active={medicineView}
              onChange={(v) => setMedicineView(v)}
              items={[
                { key: 'today', label: ta('Today'), icon: <Home className="h-5 w-5" /> },
                { key: 'add', label: ta('Add'), icon: <CalendarDays className="h-5 w-5" /> },
                { key: 'history', label: ta('History'), icon: <CalendarDays className="h-5 w-5" /> }
              ]}
            />

            <DailySummary summary={summary} yesterday={yesterdaySummary} weekly={weeklyCompliance} />

            {medicineView === 'today' && (
              <MedicineList
                items={flatToday}
                onMarkTaken={markTaken}
                onHear={(name, language) => speakReminder(name, language)}
                onDelete={(medId) => deleteMedicine(medId)}
              />
            )}

            {medicineView === 'add' && (
              <AddMedicineForm
                onAdd={addMedicine}
                onCancel={() => setMedicineView('today')}
              />
            )}

            {medicineView === 'history' && (
              <HistoryCalendar logs={dailyLogs} medicines={medicines} />
            )}
          </section>
        )}

        {currentPage === 'health' && (
          <section className="space-y-4">
            <DailySummary summary={summary} yesterday={yesterdaySummary} weekly={weeklyCompliance} />
            <HealthDashboard dailyLogs={dailyLogs} />
          </section>
        )}

        {currentPage === 'companion' && (
          <AICompanion />
        )}

        {currentPage === 'life' && (
          <section className="space-y-4">
            <LifeDashboard medicines={medicines} />
          </section>
        )}

        {currentPage === 'emergency' && (
          <section className="space-y-4">
            <EmergencyContacts contacts={emergencyContacts} onChange={setEmergencyContacts} />
            <EmergencyTest onStart={() => setEmergencyModal({ testMode: true })} />
            <EmergencyHistory logs={emergencyLogs} onToggleResolved={handleResolve} onUpdateNotes={handleNotes} />
          </section>
        )}

        {currentPage === 'settings' && (
          <section className="space-y-4">
            <SettingsCard onBack={handleBack} />
          </section>
        )}

        {currentPage === 'onboarding' && (
          <section className="space-y-4">
            <OnboardingCard onFinish={handleBack} />
          </section>
        )}
      </main>

      <EmergencyButton onActivate={(opts) => setEmergencyModal({ testMode: opts?.testMode })} />
      {emergencyModal ? (
        <EmergencyModal
          contacts={emergencyContacts}
          testMode={Boolean(emergencyModal.testMode)}
          onClose={() => setEmergencyModal(null)}
          onLogged={handleEmergencyLogged}
        />
      ) : null}

      <BottomNav current={currentPage} onChange={(next) => {
        setCurrentPage(next);
        if (next === 'medicine') setMedicineView('today');
      }} />
    </div>
  );
}

function HeroCard({ title, primary, detail, accent, onClick }) {
  const { ta } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full text-left text-white shadow-lg transition hover:shadow-xl ${accent}`}
      style={{
        borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
        padding: 'clamp(0.875rem, 3vw, 1rem)',
        minHeight: 'clamp(120px, 20vw, 150px)'
      }}
      aria-label={title}
    >
      <div style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', fontWeight: '600', opacity: 0.9 }}>{ta(title)}</div>
      <div style={{ marginTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(1.5rem, 5vw, 1.875rem)', fontWeight: '900', lineHeight: 1.2 }}>{ta(primary)}</div>
      <div style={{ marginTop: 'clamp(0.25rem, 1vw, 0.375rem)', fontSize: 'clamp(0.875rem, 3vw, 1rem)', fontWeight: '600', opacity: 0.9 }}>{ta(detail)}</div>
      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 text-sm font-bold opacity-0 transition group-hover:opacity-100" style={{
        padding: 'clamp(0.25rem, 1vw, 0.375rem) clamp(0.625rem, 2vw, 0.75rem)',
        fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)'
      }}>
        {ta('Open')}
      </div>
    </button>
  );
}

function NextMedicineCard({ item, onMarkTaken, onHear, onOpenMedicine }) {
  const { ta } = useI18n();
  if (!item) {
    return (
      <div className="bg-white shadow-card border-2 border-slate-700" style={{ borderRadius: 'clamp(1rem, 4vw, 1.5rem)', padding: 'clamp(1rem, 3vw, 1.25rem)' }}>
        <div style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)', fontWeight: '900' }}>{ta('All set for today')}</div>
        <div className="text-slate-600" style={{ marginTop: 'clamp(0.25rem, 1vw, 0.375rem)', fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>{ta('No pending medicines. Great job!')}</div>
        <button
          type="button"
          className="inline-flex items-center bg-slate-900 text-white"
          style={{
            marginTop: 'clamp(0.625rem, 2vw, 0.75rem)',
            gap: 'clamp(0.375rem, 1.5vw, 0.5rem)',
            borderRadius: 'clamp(0.625rem, 2.5vw, 0.75rem)',
            padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.875rem, 3vw, 1rem)',
            fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
            fontWeight: '700'
          }}
          onClick={onOpenMedicine}
        >
          {ta('Review schedule')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-card ring-1 ring-slate-100" style={{ borderRadius: 'clamp(1rem, 4vw, 1.5rem)', padding: 'clamp(1rem, 3vw, 1.25rem)' }}>
      <div className="text-slate-500" style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', fontWeight: '600' }}>{ta('Next medicine')}</div>
      <div className="text-slate-900" style={{ marginTop: 'clamp(0.25rem, 1vw, 0.375rem)', fontSize: 'clamp(1.5rem, 6vw, 1.875rem)', fontWeight: '900' }}>{item.name}</div>
      <div className="text-slate-800" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)', fontWeight: '800' }}>{item.time}</div>
      {item.instructions ? <div className="text-slate-600" style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)', fontWeight: '600', marginTop: 'clamp(0.25rem, 1vw, 0.375rem)' }}>{ta(item.instructions)}</div> : null}

      <div className="flex flex-wrap items-center" style={{ marginTop: 'clamp(0.875rem, 3vw, 1rem)', gap: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
        <button
          type="button"
          className="flex-1 bg-emerald-600 text-white shadow-lg hover:brightness-110"
          style={{
            borderRadius: 'clamp(0.625rem, 2.5vw, 0.75rem)',
            padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.875rem, 3vw, 1rem)',
            fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)',
            fontWeight: '900',
            minWidth: 'clamp(100px, 30vw, 150px)'
          }}
          onClick={() => onMarkTaken(item.medId, item.time)}
        >
          {ta('I took this')}
        </button>
        <button
          type="button"
          className="bg-slate-100 text-slate-800"
          style={{
            borderRadius: 'clamp(0.625rem, 2.5vw, 0.75rem)',
            padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.875rem, 3vw, 1rem)',
            fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)',
            fontWeight: '700'
          }}
          onClick={() => onHear(item.name, item.language)}
        >
          {ta('Hear reminder')}
        </button>
      </div>

      <button
        type="button"
        className="text-slate-600 underline"
        style={{
          marginTop: 'clamp(0.625rem, 2vw, 0.75rem)',
          fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
          fontWeight: '600'
        }}
        onClick={onOpenMedicine}
      >
        {ta('View full schedule')}
      </button>
    </div>
  );
}

function EmergencyStatusCard({ latest, onOpen }) {
  const { ta } = useI18n();
  return (
    <div className="bg-white shadow-card ring-1 ring-slate-100" style={{ borderRadius: 'clamp(1rem, 4vw, 1.5rem)', padding: 'clamp(1rem, 3vw, 1.25rem)' }}>
      <div className="flex items-center justify-between" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
        <div>
          <div className="text-slate-500" style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', fontWeight: '600' }}>{ta('Emergency readiness')}</div>
          <div className="text-slate-900" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.875rem)', fontWeight: '900', lineHeight: 1.3 }}>{latest ? ta('Recent activity logged') : ta('Ready and standing by')}</div>
          {latest ? <div className="text-slate-700" style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)', fontWeight: '600' }}>{latest.timestamp}</div> : <div className="text-slate-700" style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)', fontWeight: '600' }}>{ta('No incidents recorded')}</div>}
        </div>
        <ShieldCheck className="text-rose-500" style={{ width: 'clamp(2rem, 8vw, 3rem)', height: 'clamp(2rem, 8vw, 3rem)' }} aria-hidden="true" />
      </div>
      <div className="flex flex-wrap" style={{ marginTop: 'clamp(0.625rem, 2vw, 0.75rem)', gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
        <span className="rounded-full bg-rose-50 text-rose-800" style={{ padding: 'clamp(0.25rem, 1vw, 0.375rem) clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)', fontWeight: '700' }}>{ta('SOS ready')}</span>
        <span className="rounded-full bg-slate-100 text-slate-800" style={{ padding: 'clamp(0.25rem, 1vw, 0.375rem) clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)', fontWeight: '700' }}>{ta('Tap to review')}</span>
      </div>
      <button
        type="button"
        className="inline-flex items-center bg-rose-500 text-white shadow hover:brightness-110"
        style={{
          marginTop: 'clamp(0.875rem, 3vw, 1rem)',
          gap: 'clamp(0.375rem, 1.5vw, 0.5rem)',
          borderRadius: 'clamp(0.625rem, 2.5vw, 0.75rem)',
          padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.875rem, 3vw, 1rem)',
          fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
          fontWeight: '700'
        }}
        onClick={onOpen}
      >
        {ta('Open Emergency Responder')}
      </button>
    </div>
  );
}

function AgentTile({ icon, title, description, badge, color, onClick }) {
  const { ta } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-col items-start bg-white shadow-card border-2 border-slate-700 transition hover:-translate-y-0.5 hover:shadow-lg`}
      style={{
        gap: 'clamp(0.625rem, 2vw, 0.75rem)',
        borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
        padding: 'clamp(0.875rem, 3vw, 1rem)',
        minHeight: 'clamp(140px, 25vw, 180px)'
      }}
    >
      <div className={`flex items-center justify-center ${color}`} style={{ 
        width: 'clamp(2.5rem, 8vw, 3rem)', 
        height: 'clamp(2.5rem, 8vw, 3rem)', 
        borderRadius: 'clamp(0.625rem, 2.5vw, 0.75rem)'
      }}>
        {React.cloneElement(icon, { style: { width: 'clamp(1.25rem, 5vw, 1.75rem)', height: 'clamp(1.25rem, 5vw, 1.75rem)' } })}
      </div>
      <div>
        <div className="text-slate-900" style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)', fontWeight: '900', lineHeight: 1.3 }}>{ta(title)}</div>
        <div className="text-slate-600" style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', fontWeight: '600', marginTop: 'clamp(0.125rem, 0.5vw, 0.25rem)' }}>{ta(description)}</div>
      </div>
      <div className="rounded-full bg-slate-100 text-slate-700" style={{ 
        padding: 'clamp(0.25rem, 1vw, 0.375rem) clamp(0.625rem, 2vw, 0.75rem)', 
        fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)', 
        fontWeight: '700' 
      }}>{ta(badge)}</div>
    </button>
  );
}

function InlineTabs({ items, active, onChange }) {
  const { ta } = useI18n();
  return (
    <div className="flex flex-wrap bg-white shadow-card border-2 border-slate-700" style={{ 
      gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', 
      borderRadius: 'clamp(0.75rem, 3vw, 1rem)', 
      padding: 'clamp(0.375rem, 1.5vw, 0.5rem)' 
    }}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`inline-flex items-center transition ${active === item.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
          style={{
            gap: 'clamp(0.375rem, 1.5vw, 0.5rem)',
            borderRadius: 'clamp(0.625rem, 2.5vw, 0.75rem)',
            padding: 'clamp(0.375rem, 1.5vw, 0.5rem) clamp(0.875rem, 3vw, 1rem)',
            fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
            fontWeight: '700',
            minHeight: '44px'
          }}
        >
          {React.cloneElement(item.icon, { style: { width: 'clamp(1rem, 4vw, 1.25rem)', height: 'clamp(1rem, 4vw, 1.25rem)' } })}
          {ta(item.label)}
        </button>
      ))}
    </div>
  );
}

function SettingsCard({ onBack }) {
  const { ta, setLang } = useI18n();
  const profile = getItem(storageKeys.profile, {});
  const [form, setForm] = useState(() => ({
    name: profile?.name || 'Elder User',
    age: profile?.age || '',
    language: profile?.language || 'English',
    conditions: Array.isArray(profile?.medicalHistory) ? profile.medicalHistory.join(', ') : '',
    allergies: Array.isArray(profile?.allergies) ? profile.allergies.join(', ') : '',
    doctorName: profile?.contacts?.find?.((c) => c.role === 'doctor')?.name || '',
    doctorPhone: profile?.contacts?.find?.((c) => c.role === 'doctor')?.phone || '',
    familyContact: profile?.contacts?.find?.((c) => c.isEmergency)?.name || ''
  }));
  const [saved, setSaved] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    const baseContacts = Array.isArray(profile?.contacts) ? profile.contacts : [];
    const withoutDoctor = baseContacts.filter((c) => c.role !== 'doctor');
    const contacts = [
      ...withoutDoctor,
      {
        id: baseContacts.find((c) => c.role === 'doctor')?.id || `c_${Date.now()}`,
        name: form.doctorName || 'Doctor',
        relation: 'Primary doctor',
        phone: form.doctorPhone || '',
        role: 'doctor',
        isEmergency: true
      }
    ];

    const next = {
      ...profile,
      name: form.name.trim() || 'Elder User',
      age: form.age || profile?.age || 70,
      language: form.language || 'English',
      medicalHistory: form.conditions
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      allergies: form.allergies
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      contacts
    };

    setItem(storageKeys.profile, next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-slate-100 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-black text-slate-900">{ta('Elder Details & Settings')}</div>
          <div className="text-sm font-semibold text-slate-600">{ta('Keep essentials handy for family and doctors.')}</div>
        </div>
        <button
          type="button"
          className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800"
          onClick={onBack}
        >
          {ta('Back to Home')}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <LabeledInput label={ta('Name')} value={form.name} onChange={(e) => update('name', e.target.value)} />
        <LabeledInput label={ta('Age')} value={form.age} onChange={(e) => update('age', e.target.value)} inputMode="numeric" />
        <LabeledSelect
          label={ta('Preferred language')}
          value={form.language}
          onChange={(e) => {
            update('language', e.target.value);
            setLang(e.target.value);
          }}
        />
        <LabeledInput label={ta('Primary conditions')} hint={ta('Comma separated')} value={form.conditions} onChange={(e) => update('conditions', e.target.value)} />
        <LabeledInput label={ta('Allergies')} hint={ta('Comma separated')} value={form.allergies} onChange={(e) => update('allergies', e.target.value)} />
        <LabeledInput label={ta('Doctor name')} value={form.doctorName} onChange={(e) => update('doctorName', e.target.value)} />
        <LabeledInput label={ta('Doctor phone')} value={form.doctorPhone} onChange={(e) => update('doctorPhone', e.target.value)} inputMode="tel" />
        <LabeledInput label={ta('Emergency contact')} value={form.familyContact} onChange={(e) => update('familyContact', e.target.value)} />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
          onClick={handleSave}
        >
          {ta('Save details')}
        </button>
        {saved ? <span className="text-sm font-semibold text-emerald-700">{ta('Saved')}</span> : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <PreferenceCard title={ta('Large text')} description={ta('Increase readability for elders.')} />
        <PreferenceCard title={ta('Voice prompts')} description={ta('Speak reminders out loud.')} />
        <PreferenceCard title={ta('Offline first')} description={ta('Keeps working without internet.')} />
        <PreferenceCard title={ta('Family view')} description={ta('Share updates with caregivers.')} />
      </div>
    </div>
  );
}

function LabeledInput({ label, hint, value, onChange, inputMode = 'text' }) {
  return (
    <label className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">
      <span className="text-slate-900">{label}</span>
      {hint ? <span className="text-xs font-medium text-slate-500">{hint}</span> : null}
      <input
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-900 focus:border-slate-400 focus:outline-none"
        value={value}
        onChange={onChange}
        inputMode={inputMode}
      />
    </label>
  );
}

function LabeledSelect({ label, value, onChange }) {
  return (
    <label className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">
      <span className="text-slate-900">{label}</span>
      <select
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-900 focus:border-slate-400 focus:outline-none"
        value={value}
        onChange={onChange}
      >
        <option value="English">English</option>
        <option value="Hindi">Hindi</option>
        <option value="Tamil">Tamil</option>
        <option value="Telugu">Telugu</option>
        <option value="Kannada">Kannada</option>
        <option value="Malayalam">Malayalam</option>
        <option value="Marathi">Marathi</option>
        <option value="Bengali">Bengali</option>
      </select>
    </label>
  );
}

function PreferenceCard({ title, description }) {
  const { ta } = useI18n();
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="text-lg font-black text-slate-900">{ta(title)}</div>
      <div className="text-sm font-semibold text-slate-600">{ta(description)}</div>
    </div>
  );
}

function OnboardingCard({ onFinish }) {
  const { ta } = useI18n();
  return (
    <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-slate-100 space-y-4">
      <div className="text-2xl font-black text-slate-900">{ta('Welcome to ElderAI Swarm')}</div>
      <div className="text-sm font-semibold text-slate-600">{ta('Follow these quick steps to get started.')}</div>
      <ol className="space-y-2 text-sm font-semibold text-slate-700">
        <li>{ta('1. Add medicines with times and instructions.')}</li>
        <li>{ta('2. Save emergency contacts and run a test alert.')}</li>
        <li>{ta('3. Explore Health Guardian and Life Coordinator.')}</li>
      </ol>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
        onClick={onFinish}
      >
        {ta('Go to Home')}
      </button>
    </div>
  );
}
