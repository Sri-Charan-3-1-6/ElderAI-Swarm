import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PhoneCall, Siren, MapPin, ShieldAlert, Download, Clock, CheckCircle2 } from 'lucide-react';
import EmergencyButton from '../shared/EmergencyButton.jsx';
import { getItem, storageKeys, subscribe, appendActivity, addEmergency, updateProfile } from '../../utils/storageUtils.js';
import { buildStaticMapDataUri, createEmergencyIncident, runEmergencySequence, setEmergencyResolved } from '../../utils/emergencySimulator.js';
import { downloadTextFile, startPhoneCall } from '../../utils/deviceActions.js';
import { useI18n } from '../../i18n/i18n.js';

export default function EmergencyResponder() {
  const { ta } = useI18n();
  const [emergencies, setEmergencies] = useState(() => getItem(storageKeys.emergencies, []));
  const [profile, setProfile] = useState(() => getItem(storageKeys.profile, { name: 'Elder User', contacts: [], location: { address: '' } }));
  const [active, setActive] = useState(null);
  const seqRef = useRef(null);

  const [newContact, setNewContact] = useState({ name: '', relation: '', phone: '', role: 'family', isEmergency: true });

  useEffect(() => subscribe(storageKeys.emergencies, setEmergencies), []);
  useEffect(() => subscribe(storageKeys.profile, setProfile), []);

  useEffect(() => {
    const current = emergencies.find((e) => e.status === 'active') ?? null;
    setActive(current);
  }, [emergencies]);

  const mapSrc = useMemo(
    () => buildStaticMapDataUri({ label: `${profile?.name || ta('Home')}`, nearest: ta('Nearest hospital (offline map)') }),
    [profile?.name, ta]
  );

  const contacts = useMemo(() => (Array.isArray(profile?.contacts) ? profile.contacts : []), [profile]);
  const emergencyContact = useMemo(
    () => contacts.find((c) => c?.isEmergency) ?? contacts.find((c) => c?.role === 'family') ?? contacts[0] ?? null,
    [contacts]
  );

  const triggerEmergency = () => {
    const incident = createEmergencyIncident({ type: 'Fall', source: 'Manual', notes: 'Triggered from Emergency Responder UI.' });
    addEmergency(incident);
    appendActivity({ id: `act_${Date.now()}`, type: 'emergency', title: ta('Emergency activated'), ts: new Date().toISOString(), detail: ta('Manual trigger.') });

    // Best-effort real action: start a phone call to the configured emergency contact.
    startPhoneCall(emergencyContact?.phone, {
      label: ta(`Emergency contact ${emergencyContact?.name || 'contact'}`)
    });

    seqRef.current?.cancel?.();
    seqRef.current = runEmergencySequence(incident, (updated) => {
      // Push latest state; storage already holds log, but ensure current incident visible.
      addEmergency(updated);
    });
  };

  const downloadReport = (incident) => {
    const lines = [
      ta('ElderAI Swarm — Emergency Report'),
      `${ta('Incident ID')}: ${incident.id}`,
      `${ta('Incident type')}: ${incident.type}`,
      `${ta('Source')}: ${incident.source}`,
      `${ta('Time')}: ${new Date(incident.startedAtISO).toLocaleString()}`,
      `${ta('Location')}: ${incident.location?.address}`,
      `${ta('Response started')}: ${ta('immediate')}`,
      `${ta('Estimated help arrival')}: ${incident.etaMinutes} ${ta('minutes')}`,
      `${ta('Status')}: ${incident.status}`,
      '',
      `${ta('Timeline')}:`,
      ...(incident.timeline ?? []).map((t) => `- ${formatAtMs(t.atMs)} — ${t.label}`),
      '',
      `${ta('Emergency contact')}: ${emergencyContact?.name || ''} (${emergencyContact?.phone || ''})`
    ].join('\n');

    downloadTextFile(`emergency-report-${incident.id}.txt`, lines);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">{ta('Emergency Responder')}</h2>
        <p className="mt-1 text-slate-600">{ta('Offline emergency workflow with timeline, contact, and location.')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100 p-5 lg:col-span-2">
          <div className="rounded-2xl bg-danger p-5 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-4xl font-extrabold leading-tight">{ta('EMERGENCY')}</div>
                <div className="mt-1 text-lg font-semibold text-white/90">{ta('Or say “HELP” to activate (voice)')}</div>
              </div>
              <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 animate-pulseSoft">
                <Siren aria-hidden="true" className="h-10 w-10" />
              </div>
            </div>
            <div className="mt-4">
              <EmergencyButton onPress={triggerEmergency} size="xl" label={ta('EMERGENCY BUTTON')} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-card bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-extrabold text-slate-700">
                <PhoneCall className="h-4 w-4" aria-hidden="true" /> {ta('Emergency contacts')}
              </div>
              <div className="mt-3">
                {(contacts.length ? contacts : []).map((c) => (
                  <div key={c.id} className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm">
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-900 truncate">{c.name}</div>
                      <div className="text-sm text-slate-700">{c.relation}{c.isEmergency ? ` • ${ta('Emergency')}` : ''}</div>
                      <div className="text-sm font-semibold text-slate-700">{c.phone || ta('No phone set')}</div>
                    </div>
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-extrabold text-white"
                      onClick={() => startPhoneCall(c.phone, { label: c.name })}
                      aria-label={ta(`Call ${c.name}`)}
                    >
                      <PhoneCall aria-hidden="true" className="h-4 w-4" /> {ta('Call')}
                    </button>
                  </div>
                ))}

                <div className="mt-2 rounded-xl bg-white p-3 shadow-sm">
                  <div className="text-sm font-extrabold text-slate-900">{ta('Add contact')}</div>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    <input className="w-full rounded-lg border border-slate-200 px-3 py-2" value={newContact.name} onChange={(e) => setNewContact((s) => ({ ...s, name: e.target.value }))} placeholder={ta('Name')} aria-label={ta('Contact name')} />
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <input className="w-full rounded-lg border border-slate-200 px-3 py-2" value={newContact.relation} onChange={(e) => setNewContact((s) => ({ ...s, relation: e.target.value }))} placeholder={ta('Relation (e.g., Son, Daughter)')} aria-label={ta('Contact relation')} />
                      <input className="w-full rounded-lg border border-slate-200 px-3 py-2" value={newContact.phone} onChange={(e) => setNewContact((s) => ({ ...s, phone: e.target.value }))} placeholder={ta('Phone')} aria-label={ta('Contact phone')} />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <input type="checkbox" checked={newContact.isEmergency} onChange={(e) => setNewContact((s) => ({ ...s, isEmergency: e.target.checked }))} />
                        {ta('Emergency contact')}
                      </label>
                      <button
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-extrabold text-white"
                        onClick={() => {
                          if (!newContact.name.trim()) return;
                          updateProfile((p) => ({
                            ...(p ?? {}),
                            contacts: [
                              {
                                id: `c_${Date.now()}`,
                                name: newContact.name.trim(),
                                relation: newContact.relation.trim(),
                                phone: newContact.phone.trim(),
                                role: 'family',
                                isEmergency: Boolean(newContact.isEmergency)
                              },
                              ...((p?.contacts ?? []) || [])
                            ]
                          }));
                          setNewContact({ name: '', relation: '', phone: '', role: 'family', isEmergency: true });
                        }}
                        aria-label={ta('Add contact')}
                      >
                        {ta('Add')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-card bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-extrabold text-slate-700">
                <MapPin className="h-4 w-4" aria-hidden="true" /> {ta('Location')}
              </div>
              <div className="mt-3 text-sm text-slate-800">{profile?.location?.address || ta('Address not set')}</div>
              <div className="mt-1 text-sm font-semibold text-slate-700">{ta('Offline map preview')}</div>
            </div>
          </div>

          {active ? (
            <div className="mt-6 rounded-card border border-danger/30 bg-danger/5 p-5">
              <div className="flex items-center gap-2 text-danger">
                <ShieldAlert aria-hidden="true" />
                <div className="text-xl font-extrabold">🚨 {ta('EMERGENCY DETECTED')}</div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-white p-4 shadow">
                  <div className="text-xs font-semibold text-slate-500">{ta('Incident type')}</div>
                  <div className="mt-1 text-lg font-extrabold">{active.type}</div>

                  <div className="mt-3 text-xs font-semibold text-slate-500">{ta('Status')}</div>
                  <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-danger/10 px-3 py-1 text-sm font-extrabold text-danger">
                    <Clock className="h-4 w-4" aria-hidden="true" /> {ta('Active')}
                  </div>

                  <div className="mt-3 text-xs font-semibold text-slate-500">{ta('ETA')}</div>
                  <div className="mt-1 text-lg font-extrabold">{active.etaMinutes} {ta('min')}</div>
                </div>

                <div className="rounded-xl bg-white p-4 shadow">
                  <div className="text-xs font-semibold text-slate-500">{ta('Map')}</div>
                  <img className="mt-2 w-full rounded-xl border border-slate-200" src={mapSrc} alt={ta('Static map')} />
                  <div className="mt-2 text-sm text-slate-700">{ta('Distance to hospital')}: {active.distanceKm} {ta('km')}</div>
                </div>
              </div>

              <div className="mt-5">
                <div className="text-sm font-extrabold text-slate-900">{ta('Emergency Timeline')}</div>
                <div className="mt-3 space-y-2">
                  {(active.timeline ?? []).map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
                      <div className="font-semibold text-slate-800">{t.label}</div>
                      <div className="text-sm text-slate-600">{formatAtMs(t.atMs)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-extrabold text-white"
                  onClick={() => downloadReport(active)}
                  aria-label={ta('Download emergency report')}
                >
                  <Download aria-hidden="true" /> {ta('Download Report')}
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-success px-4 py-3 text-sm font-extrabold text-white"
                  onClick={() => {
                    setEmergencyResolved(active.id);
                    appendActivity({ id: `act_${Date.now()}`, type: 'emergency', title: ta('Emergency resolved'), ts: new Date().toISOString(), detail: ta(`Incident ${active.id}`) });
                  }}
                  aria-label={ta('Mark resolved')}
                >
                  <CheckCircle2 aria-hidden="true" /> {ta('Mark Resolved')}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100 p-5">
            <h3 className="text-lg font-bold">{ta('Past Emergencies')}</h3>
            <div className="mt-3 text-sm text-slate-600">{ta('Logs (stored locally)')}</div>

            <div className="mt-4 space-y-3">
              {(emergencies ?? []).slice(0, 5).map((e) => (
                <div key={e.id} className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-slate-900">{e.type}</div>
                    <span className={"rounded-full px-3 py-1 text-xs font-extrabold " + (e.status === 'resolved' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger')}>
                      {e.status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-700">{new Date(e.startedAtISO).toLocaleString()}</div>
                  <div className="mt-1 text-sm text-slate-600">{ta('Status tracked locally')}</div>
                </div>
              ))}
              {!(emergencies ?? []).length ? <div className="rounded-xl bg-slate-50 p-4 text-slate-700">{ta('No past emergencies yet.')}</div> : null}
            </div>
          </div>

          <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100 p-5">
            <h3 className="text-lg font-bold">{ta('Voice Keyword')}</h3>
            <div className="mt-2 text-slate-700">{ta('Say')} <span className="font-extrabold">{ta('HELP')}</span> {ta('to trigger emergency (in Daily Companion / Elder Interface).')}</div>
            <div className="mt-3 text-sm text-slate-600">{ta('If speech is not supported, the UI will still work with buttons.')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatAtMs(ms) {
  const s = Math.floor(ms / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
