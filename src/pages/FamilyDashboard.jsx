import React, { useEffect, useMemo, useState } from 'react';
import { Download, HeartPulse, Pill, ShieldAlert, Sparkles, CalendarDays, Activity, MapPin, CheckCircle2 } from 'lucide-react';
import AgentCard from '../components/shared/AgentCard.jsx';
import StatusIndicator from '../components/shared/StatusIndicator.jsx';
import HealthGuardian from '../components/agents/HealthGuardian.jsx';
import MedicineBuddy from '../components/agents/MedicineBuddy.jsx';
import EmergencyResponder from '../components/agents/EmergencyResponder.jsx';
import DailyCompanion from '../components/agents/DailyCompanion.jsx';
import LifeCoordinator from '../components/agents/LifeCoordinator.jsx';
import { appendActivity, getItem, storageKeys, subscribe, touchLastActive, updateProfile } from '../utils/storageUtils.js';
import { computeHealthScore, latestVitals } from '../utils/healthSimulator.js';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useI18n } from '../i18n/i18n.js';

function downloadHtmlReport(filename, html) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function latestActivityISO(activities, types) {
  const set = new Set(Array.isArray(types) ? types : [types]);
  const a = (activities ?? []).find((x) => set.has(x?.type));
  return a?.ts ?? null;
}

function fmtCoords(coords) {
  const lat = Number(coords?.lat);
  const lng = Number(coords?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '—';
  if (lat === 0 && lng === 0) return '—';
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export default function FamilyDashboard() {
  const { t, ta, lang, setLang } = useI18n();
  const [profile, setProfile] = useState(() => getItem(storageKeys.profile, null));
  const [clockNow, setClockNow] = useState(() => new Date());
  const [status, setStatus] = useState(() => getItem(storageKeys.appStatus, { online: true, lastActiveISO: new Date().toISOString() }));
  const [health, setHealth] = useState(() => getItem(storageKeys.health, null));
  const [meds, setMeds] = useState(() => getItem(storageKeys.medicines, []));
  const [activities, setActivities] = useState(() => getItem(storageKeys.activities, []));
  const [emergencies, setEmergencies] = useState(() => getItem(storageKeys.emergencies, []));
  const [chat, setChat] = useState(() => getItem(storageKeys.chat, []));

  const [contactDraft, setContactDraft] = useState({ name: '', relation: '', phone: '', isEmergency: true });

  const [activeAgent, setActiveAgent] = useState('overview');

  const logAction = (type, title, detail) => {
    appendActivity({ id: `act_${Date.now()}`, type, title, ts: new Date().toISOString(), detail: detail || '' });
  };

  const logProfileFieldIfChanged = (fieldLabel, before, after) => {
    const b = String(before ?? '').trim();
    const a = String(after ?? '').trim();
    if (b === a) return;
    logAction('activity', ta('Profile updated'), fieldLabel);
  };

  useEffect(() => subscribe(storageKeys.profile, setProfile), []);
  useEffect(() => subscribe(storageKeys.appStatus, setStatus), []);
  useEffect(() => subscribe(storageKeys.health, setHealth), []);
  useEffect(() => subscribe(storageKeys.medicines, setMeds), []);
  useEffect(() => subscribe(storageKeys.activities, setActivities), []);
  useEffect(() => subscribe(storageKeys.emergencies, setEmergencies), []);
  useEffect(() => subscribe(storageKeys.chat, setChat), []);

  useEffect(() => {
    const id = window.setInterval(() => setClockNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    touchLastActive();
  }, [activeAgent]);

  useEffect(() => {
    // Keep a small heartbeat so "last active" stays fresh while viewing the dashboard.
    const id = window.setInterval(() => touchLastActive(), 15000);
    return () => window.clearInterval(id);
  }, []);

  const vitals = useMemo(() => latestVitals(health ?? {}), [health]);
  const score = useMemo(() => computeHealthScore(vitals), [vitals]);

  const medsTaken = meds.filter((m) => m.taken).length;
  const medicinesTakenText = `${medsTaken}/${meds.length}`;

  const activeEmergency = emergencies.find((e) => e.status === 'active');

  const hrChart = useMemo(() => {
    const last = (health?.heartRate ?? []).slice(-24);
    return last.map((p) => ({
      t: new Date(p.tsISO).toLocaleTimeString([], { hour: '2-digit' }),
      bpm: p.bpm
    }));
  }, [health]);

  const reportHtml = useMemo(() => {
    const p = profile;
    const lastAct = new Date(status.lastActiveISO).toLocaleString();
    const html = `<!doctype html>
<html><head><meta charset="utf-8" />
<title>${ta('ElderAI Swarm Daily Report')}</title>
<style>
  body{font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; padding:24px; color:#0f172a}
  h1{margin:0 0 8px 0}
  .muted{color:#475569}
  .grid{display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:12px; margin-top:16px}
  .card{border:1px solid #e2e8f0; border-radius:12px; padding:12px}
  .tag{display:inline-block; padding:4px 10px; border-radius:999px; background:#eff6ff; color:#1d4ed8; font-weight:700}
</style>
</head><body>
  <h1>${ta('ElderAI Swarm — Daily Report')}</h1>
  <div class="muted">${ta('Generated offline. Use your browser “Print” and choose “Save as PDF”.')}</div>
  <div class="grid">
    <div class="card"><div class="muted">${ta('Parent')}</div><div style="font-size:18px;font-weight:800">${p?.name ?? ''} (${p?.age ?? ''})</div></div>
    <div class="card"><div class="muted">${ta('Last active')}</div><div style="font-size:18px;font-weight:800">${lastAct}</div></div>
    <div class="card"><div class="muted">${ta('Health score')}</div><div style="font-size:18px;font-weight:800">${score}/100</div></div>
    <div class="card"><div class="muted">${ta('Medicine compliance')}</div><div style="font-size:18px;font-weight:800">${medsTaken}/${meds.length}</div></div>
  </div>
  <div class="card" style="margin-top:16px">
    <div class="muted">${ta('Vitals snapshot')}</div>
    <div style="margin-top:8px">
      <span class="tag">${ta('HR')} ${vitals.bpm} ${ta('bpm')}</span>
      <span class="tag" style="margin-left:8px">${ta('BP')} ${vitals.sys}/${vitals.dia}</span>
      <span class="tag" style="margin-left:8px">${ta('O2')} ${vitals.spo2}%</span>
      <span class="tag" style="margin-left:8px">${ta('Temp')} ${vitals.tempF}°F</span>
    </div>
  </div>
  <div class="card" style="margin-top:16px">
    <div class="muted">${ta('Highlights')}</div>
    <ul>
      <li>${ta('AI interactions')}: ${(chat ?? []).length}</li>
      <li>${ta('Recent activities')}: ${(activities ?? []).length}</li>
      <li>${ta('Emergencies today')}: ${(emergencies ?? []).filter((e) => e.startedAtISO?.slice(0,10) === new Date().toISOString().slice(0,10)).length}</li>
    </ul>
  </div>
</body></html>`;
    return html;
  }, [profile, status.lastActiveISO, score, medsTaken, meds.length, vitals, chat, activities, emergencies, ta]);

  const monitoring = useMemo(() => {
    const maxISO = (isos) => {
      let best = 0;
      for (const iso of isos) {
        if (!iso) continue;
        const t = new Date(iso).getTime();
        if (Number.isFinite(t) && t > best) best = t;
      }
      return best ? new Date(best).toISOString() : null;
    };

    const healthISO = (() => {
      const h = health ?? {};
      const candidates = [];
      const keys = ['heartRate', 'bloodPressure', 'spo2', 'tempF', 'steps'];
      keys.forEach((k) => {
        const arr = Array.isArray(h?.[k]) ? h[k] : [];
        const last = arr.slice(-1)[0];
        if (last?.tsISO) candidates.push(last.tsISO);
      });
      return maxISO(candidates);
    })();

    const activitiesISO = (activities ?? [])[0]?.ts ?? null;
    const chatISO = (chat ?? []).slice(-1)[0]?.ts ?? null;
    const emergenciesISO = (() => {
      const e = (emergencies ?? [])[0];
      return e?.resolvedAtISO ?? e?.startedAtISO ?? null;
    })();

    const locationISO = profile?.location?.lastUpdatedISO ?? null;

    const medicineISO = (() => {
      const viaNotified = maxISO((meds ?? []).map((m) => m?.lastNotifiedAtISO));
      if (viaNotified) return viaNotified;
      const recentMedActivity = (activities ?? []).find((a) => a?.type === 'medicine');
      return recentMedActivity?.ts ?? null;
    })();

    return {
      health: fmtTime(healthISO),
      medicines: fmtTime(medicineISO),
      emergencies: fmtTime(emergenciesISO),
      chat: fmtTime(chatISO),
      activities: fmtTime(activitiesISO),
      location: fmtTime(locationISO),
      lastActive: fmtTime(status?.lastActiveISO),
      _raw: {
        healthISO,
        medicineISO,
        emergenciesISO,
        chatISO,
        activitiesISO,
        locationISO
      }
    };
  }, [health, meds, emergencies, activities, chat, status?.lastActiveISO, profile?.location?.lastUpdatedISO]);

  const agentLastUpdated = useMemo(() => {
    const lifeISO = latestActivityISO(activities, ['task', 'appointment']) || monitoring?._raw?.activitiesISO || null;
    return {
      health: monitoring?._raw?.healthISO ?? null,
      medicine: monitoring?._raw?.medicineISO ?? null,
      emergency: monitoring?._raw?.emergenciesISO ?? null,
      companion: monitoring?._raw?.chatISO ?? null,
      life: lifeISO
    };
  }, [activities, monitoring]);

  const page = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100 p-6 lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-slate-100" aria-label={ta('Profile photo placeholder')} />
              <div>
                <div className="text-2xl font-extrabold">{profile?.name}</div>
                <div className="text-slate-600">{ta('Age')} {profile?.age} • {profile?.language}</div>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  <span className="truncate">{profile?.location?.address}</span>
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-500">
                  {ta('Live location')}: {fmtCoords(profile?.location?.coordinates)}{profile?.location?.lastUpdatedISO ? ` • ${new Date(profile.location.lastUpdatedISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : ''}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <StatusIndicator status={status.online ? 'active' : 'inactive'} />
                <div className="text-sm font-extrabold text-slate-800">{status.online ? t('status.online') : t('status.offline')}</div>
              </div>
              <div className="mt-2 text-sm text-slate-600">{ta('Last active')}: {new Date(status.lastActiveISO).toLocaleString()}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold text-slate-500">{ta('Live clock')}</div>
              <div className="mt-1 text-lg font-extrabold text-slate-900">
                {clockNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-sm text-slate-600">{clockNow.toLocaleDateString()}</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Metric title={ta('Overall health')} value={`${score}/100`} badge={ta(score >= 80 ? 'All Systems Normal' : score >= 60 ? 'Needs Attention' : 'High Risk')} badgeTone={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger'} icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />} />
            <Metric title={ta('Steps today')} value={`${(health?.steps ?? []).slice(-1)[0]?.steps ?? 1847}`} icon={<Activity className="h-5 w-5" aria-hidden="true" />} />
            <Metric title={ta('Medicines taken')} value={medicinesTakenText} icon={<Pill className="h-5 w-5" aria-hidden="true" />} />
          </div>

          <div className="mt-6 rounded-2xl bg-slate-900 p-5 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-lg font-extrabold">{ta('Daily Report Summary')}</div>
                <div className="mt-1 text-white/80">{ta('Health trends, compliance, activities, and AI interactions.')}</div>
              </div>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-extrabold text-white hover:bg-white/15"
                onClick={() => {
                  downloadHtmlReport('elderai-daily-report.html', reportHtml);
                }}
                aria-label={ta('Download daily report')}
              >
                <Download aria-hidden="true" /> {ta('Download Report')}
              </button>
            </div>
            <div className="mt-4 h-44 rounded-xl bg-white/5 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hrChart}>
                  <XAxis dataKey="t" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#cbd5e1', fontSize: 12 }} domain={[60, 110]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="bpm" stroke="#3B82F6" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100 p-5">
            <div className="text-lg font-extrabold">{ta('Profile & Contacts')}</div>
            <div className="mt-3 space-y-3">
              <label className="block">
                <div className="text-xs font-semibold text-slate-500">{ta('Name')}</div>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={profile?.name ?? ''}
                  onChange={(e) => updateProfile((p) => ({ ...(p ?? {}), name: e.target.value }))}
                  onFocus={(e) => {
                    e.currentTarget.dataset.prev = e.currentTarget.value;
                  }}
                  onBlur={(e) => logProfileFieldIfChanged('Name', e.currentTarget.dataset.prev, e.target.value)}
                  aria-label={ta('Elder name')}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <div className="text-xs font-semibold text-slate-500">{ta('Age')}</div>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    inputMode="numeric"
                    value={profile?.age ?? ''}
                    onChange={(e) => updateProfile((p) => ({ ...(p ?? {}), age: e.target.value }))}
                    onFocus={(e) => {
                      e.currentTarget.dataset.prev = e.currentTarget.value;
                    }}
                    onBlur={(e) => logProfileFieldIfChanged('Age', e.currentTarget.dataset.prev, e.target.value)}
                    aria-label={ta('Elder age')}
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-slate-500">{ta('Language')}</div>
                  <select
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
                    value={lang}
                    onChange={(e) => {
                      const prev = profile?.language;
                      setLang(e.target.value);
                      logProfileFieldIfChanged('Language', prev, e.target.value);
                    }}
                    aria-label={ta('Preferred language')}
                  >
                    <option value="en">English</option>
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="kn">ಕನ್ನಡ (Kannada)</option>
                    <option value="ml">മലയാളം (Malayalam)</option>
                    <option value="mr">मराठी (Marathi)</option>
                    <option value="bn">বাংলা (Bengali)</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <div className="text-xs font-semibold text-slate-500">{ta('Address')}</div>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={profile?.location?.address ?? ''}
                  onChange={(e) => updateProfile((p) => ({ ...(p ?? {}), location: { ...(p?.location ?? {}), address: e.target.value } }))}
                  onFocus={(e) => {
                    e.currentTarget.dataset.prev = e.currentTarget.value;
                  }}
                  onBlur={(e) => logProfileFieldIfChanged('Address', e.currentTarget.dataset.prev, e.target.value)}
                  aria-label={ta('Address')}
                />
              </label>

              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-500">{ta('Live location')}</div>
                <div className="mt-1 text-sm font-extrabold text-slate-900">{fmtCoords(profile?.location?.coordinates)}</div>
                <div className="text-xs font-semibold text-slate-500">{ta('Updated')}: {profile?.location?.lastUpdatedISO ? new Date(profile.location.lastUpdatedISO).toLocaleString() : '—'}</div>
                <div className="text-xs font-semibold text-slate-500">{ta('Tracking')}: {profile?.location?.trackingEnabled ? ta('On') : ta('Off')}</div>
              </div>

              <div className="pt-2">
                <div className="text-sm font-extrabold text-slate-900">{ta('Contacts')}</div>
                <div className="mt-2 space-y-2">
                  {(profile?.contacts ?? []).map((c) => (
                    <div key={c.id} className="rounded-xl bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-extrabold truncate">{c.name}</div>
                          <div className="text-sm text-slate-600">{c.relation}{c.isEmergency ? ` • ${ta('Emergency')}` : ''}</div>
                          <div className="text-sm font-semibold text-slate-700">{c.phone || ta('No phone set')}</div>
                        </div>
                        <button
                          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-extrabold text-white"
                          onClick={() => {
                            updateProfile((p) => ({ ...(p ?? {}), contacts: (p?.contacts ?? []).filter((x) => x.id !== c.id) }));
                            logAction('activity', 'Contact removed', c.name);
                          }}
                          aria-label={ta(`Remove ${c.name}`)}
                        >
                          {ta('Remove')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-xl bg-slate-50 p-3">
                  <div className="text-sm font-extrabold text-slate-900">{ta('Add contact')}</div>
                  <div className="mt-2 space-y-2">
                    <input className="w-full rounded-lg border border-slate-200 px-3 py-2" value={contactDraft.name} onChange={(e) => setContactDraft((s) => ({ ...s, name: e.target.value }))} placeholder={ta('Name')} aria-label={ta('New contact name')} />
                    <div className="grid grid-cols-2 gap-2">
                      <input className="w-full rounded-lg border border-slate-200 px-3 py-2" value={contactDraft.relation} onChange={(e) => setContactDraft((s) => ({ ...s, relation: e.target.value }))} placeholder={ta('Relation')} aria-label={ta('New contact relation')} />
                      <input className="w-full rounded-lg border border-slate-200 px-3 py-2" value={contactDraft.phone} onChange={(e) => setContactDraft((s) => ({ ...s, phone: e.target.value }))} placeholder={ta('Phone')} aria-label={ta('New contact phone')} />
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <input type="checkbox" checked={contactDraft.isEmergency} onChange={(e) => setContactDraft((s) => ({ ...s, isEmergency: e.target.checked }))} />
                      {ta('Emergency contact')}
                    </label>
                    <button
                      className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-extrabold text-white"
                      onClick={() => {
                        if (!contactDraft.name.trim()) return;
                        updateProfile((p) => ({
                          ...(p ?? {}),
                          contacts: [
                            {
                              id: `c_${Date.now()}`,
                              name: contactDraft.name.trim(),
                              relation: contactDraft.relation.trim(),
                              phone: contactDraft.phone.trim(),
                              role: 'family',
                              isEmergency: Boolean(contactDraft.isEmergency)
                            },
                            ...((p?.contacts ?? []) || [])
                          ]
                        }));
                        logAction('activity', 'Contact added', contactDraft.name.trim());
                        setContactDraft({ name: '', relation: '', phone: '', isEmergency: true });
                      }}
                      aria-label={ta('Add contact')}
                    >
                      {ta('Add Contact')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100 p-5">
            <div className="flex items-center justify-between">
              <div className="text-lg font-extrabold">{ta('Real-time Monitoring')}</div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700">
                <StatusIndicator status={status.online ? 'active' : 'inactive'} /> {status.online ? ta('LIVE') : ta('OFFLINE')}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <MonitorItem label="Health" value={monitoring.health} />
              <MonitorItem label="Medicines" value={monitoring.medicines} />
              <MonitorItem label="Emergencies" value={monitoring.emergencies} />
              <MonitorItem label="Chat" value={monitoring.chat} />
              <MonitorItem label="Activities" value={monitoring.activities} />
              <MonitorItem label="Location" value={monitoring.location} />
              <MonitorItem label="Heartbeat" value={monitoring.lastActive} />
            </div>
          </div>

          <div className={"rounded-card shadow-card ring-1 p-5 " + (activeEmergency ? 'bg-danger/5 ring-danger/20' : 'bg-white ring-slate-100')}>
            <div className="flex items-center justify-between">
              <div className="text-lg font-extrabold">{ta('Emergency Alerts')}</div>
              <ShieldAlert className={"h-5 w-5 " + (activeEmergency ? 'text-danger' : 'text-slate-400')} aria-hidden="true" />
            </div>
            {activeEmergency ? (
              <div className="mt-3 rounded-xl bg-danger/10 p-4">
                <div className="font-extrabold text-danger">{ta('Emergency active')}: {activeEmergency.type}</div>
                <div className="mt-1 text-sm text-slate-700">{ta('Started')}: {new Date(activeEmergency.startedAtISO).toLocaleString()}</div>
                <button className="mt-3 w-full rounded-lg bg-danger px-4 py-3 text-sm font-extrabold text-white" onClick={() => setActiveAgent('emergency')} aria-label={ta('View emergency details')}>
                  {ta('View Details')}
                </button>
              </div>
            ) : (
              <div className="mt-3 rounded-xl bg-success/10 p-4">
                <div className="font-extrabold text-success">{ta('No emergencies today')}</div>
                <div className="mt-1 text-sm text-slate-700">{ta('System monitoring is active.')}</div>
              </div>
            )}
          </div>

          <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100 p-5">
            <div className="text-lg font-extrabold">{ta('Recent Activities')}</div>
            <div className="mt-3 max-h-[360px] space-y-2 overflow-auto pr-1" aria-label={ta('Activities timeline')}>
              {(activities ?? []).map((a) => (
                <div key={a.id} className="flex items-start justify-between rounded-xl bg-slate-50 p-3">
                  <div>
                    <div className="font-extrabold text-slate-900">{a.title}</div>
                    <div className="text-sm text-slate-600">{a.detail}</div>
                  </div>
                  <div className={"ml-3 text-xs font-bold " + colorByType(a.type)}>
                    {new Date(a.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold">{ta('AI Agents')}</h2>
            <p className="mt-1 text-slate-600">{ta('All five agents run offline-first with local persistence.')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <TabButton active={activeAgent === 'overview'} onClick={() => setActiveAgent('overview')} label={ta('Overview')} />
            <TabButton active={activeAgent === 'health'} onClick={() => setActiveAgent('health')} label={ta('Health')} />
            <TabButton active={activeAgent === 'medicine'} onClick={() => setActiveAgent('medicine')} label={ta('Medicine')} />
            <TabButton active={activeAgent === 'emergency'} onClick={() => setActiveAgent('emergency')} label={ta('Emergency')} />
            <TabButton active={activeAgent === 'companion'} onClick={() => setActiveAgent('companion')} label={ta('Companion')} />
            <TabButton active={activeAgent === 'life'} onClick={() => setActiveAgent('life')} label={ta('Life')} />
          </div>
        </div>

        {activeAgent === 'overview' ? (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <AgentCard
              title={ta('Health Guardian')}
              subtitle={ta('Vitals + charts')}
              icon={<HeartPulse aria-hidden="true" />}
              status={score >= 80 ? 'active' : score >= 60 ? 'alert' : 'alert'}
              metricLabel={ta('Heart Rate')}
              metricValue={`${vitals.bpm} ${ta('bpm')}`}
              lastActivity={`${ta('Updated')} ${fmtTime(agentLastUpdated.health)}`}
              onView={() => setActiveAgent('health')}
            />
            <AgentCard
              title={ta('Medicine Buddy')}
              subtitle={ta('Reminders + compliance')}
              icon={<Pill aria-hidden="true" />}
              status={medsTaken === meds.length ? 'active' : 'alert'}
              metricLabel={ta('Taken')}
              metricValue={medicinesTakenText}
              lastActivity={`${ta('Updated')} ${fmtTime(agentLastUpdated.medicine)}`}
              onView={() => setActiveAgent('medicine')}
            />
            <AgentCard
              title={ta('Emergency Responder')}
              subtitle={ta('Step-by-step response')}
              icon={<ShieldAlert aria-hidden="true" />}
              status={activeEmergency ? 'alert' : 'active'}
              metricLabel={ta('Emergency')}
              metricValue={activeEmergency ? ta('ACTIVE') : ta('None')}
              lastActivity={activeEmergency ? ta('Responding now') : `${ta('Updated')} ${fmtTime(agentLastUpdated.emergency)}`}
              onView={() => setActiveAgent('emergency')}
            />
            <AgentCard
              title={ta('Daily Companion')}
              subtitle={ta('Warm chat + voice')}
              icon={<Sparkles aria-hidden="true" />}
              status="active"
              metricLabel={ta('AI messages')}
              metricValue={`${(chat ?? []).filter((m) => m.from === 'ai').length}`}
              lastActivity={`${ta('Updated')} ${fmtTime(agentLastUpdated.companion)}`}
              onView={() => setActiveAgent('companion')}
            />
            <AgentCard
              title={ta('Life Coordinator')}
              subtitle={ta('Calendar + tasks')}
              icon={<CalendarDays aria-hidden="true" />}
              status="active"
              metricLabel={ta('Appointments')}
              metricValue={`${getItem(storageKeys.appointments, []).length}`}
              lastActivity={`${ta('Updated')} ${fmtTime(agentLastUpdated.life)}`}
              onView={() => setActiveAgent('life')}
            />
          </div>
        ) : (
          <div className="mt-6">
            {activeAgent === 'health' ? <HealthGuardian /> : null}
            {activeAgent === 'medicine' ? <MedicineBuddy /> : null}
            {activeAgent === 'emergency' ? <EmergencyResponder /> : null}
            {activeAgent === 'companion' ? <DailyCompanion /> : null}
            {activeAgent === 'life' ? <LifeCoordinator /> : null}
          </div>
        )}
      </div>
    </div>
  );

  return page;
}

function Metric({ title, value, icon, badge, badgeTone }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-500">{title}</div>
        <div className="text-slate-700">{icon}</div>
      </div>
      <div className="mt-1 text-2xl font-extrabold text-slate-900">{value}</div>
      {badge ? (
        <div className={"mt-2 inline-flex rounded-full px-3 py-1 text-xs font-extrabold " + tone(badgeTone)}>
          {badge}
        </div>
      ) : null}
    </div>
  );
}

function tone(t) {
  if (t === 'success') return 'bg-success/10 text-success';
  if (t === 'warning') return 'bg-warning/10 text-warning';
  if (t === 'danger') return 'bg-danger/10 text-danger';
  return 'bg-slate-200 text-slate-800';
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      className={
        'rounded-full px-4 py-2 text-sm font-extrabold transition focus:outline-none ' +
        (active ? 'bg-primary text-white' : 'bg-slate-100 text-slate-800 hover:bg-slate-200')
      }
      onClick={onClick}
      aria-label={label}
    >
      {label}
    </button>
  );
}

function colorByType(type) {
  if (type === 'medicine') return 'text-success';
  if (type === 'emergency') return 'text-danger';
  if (type === 'chat') return 'text-primary';
  return 'text-slate-500';
}

function MonitorItem({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-extrabold text-slate-900">{value}</div>
    </div>
  );
}
