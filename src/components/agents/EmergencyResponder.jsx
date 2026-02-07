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
      label: `${ta('Emergency contact')} ${emergencyContact?.name || ta('contact')}`
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
      `${ta('Incident type')}: ${ta(incident.type || '')}`,
      `${ta('Source')}: ${ta(incident.source || '')}`,
      `${ta('Time')}: ${new Date(incident.startedAtISO).toLocaleString()}`,
      `${ta('Location')}: ${incident.location?.address}`,
      `${ta('Response started')}: ${ta('immediate')}`,
      `${ta('Estimated help arrival')}: ${incident.etaMinutes} ${ta('minutes')}`,
      `${ta('Status')}: ${ta(incident.status || '')}`,
      '',
      `${ta('Timeline')}:`,
      ...(incident.timeline ?? []).map((t) => `- ${formatAtMs(t.atMs)} — ${ta(t.label || '')}`),
      '',
      `${ta('Emergency contact')}: ${emergencyContact?.name || ''} (${emergencyContact?.phone || ''})`
    ].join('\n');

    downloadTextFile(`emergency-report-${incident.id}.txt`, lines);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-extrabold tracking-tight" style={{ fontSize: 'clamp(1.5rem, 6vw, 1.875rem)' }}>{ta('Emergency Responder')}</h2>
        <p className="mt-1 text-slate-600" style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>{ta('Offline emergency workflow with timeline, contact, and location.')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 'clamp(1rem, 3vw, 1.5rem)' }}>
        <div className="rounded-card bg-white shadow-card border-2 border-slate-700 lg:col-span-2" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
          <div className="rounded-2xl bg-danger text-white" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
            <div className="flex items-center justify-between" style={{ gap: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
              <div>
                <div className="font-extrabold leading-tight" style={{ fontSize: 'clamp(2rem, 8vw, 2.25rem)' }}>{ta('EMERGENCY')}</div>
                <div className="mt-1 font-semibold text-white/90" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('Or say "HELP" to activate (voice)')}</div>
              </div>
              <div className="hidden sm:flex items-center justify-center rounded-2xl bg-white/15 animate-pulseSoft" style={{ width: 'clamp(3.5rem, 12vw, 4rem)', height: 'clamp(3.5rem, 12vw, 4rem)' }}>
                {React.cloneElement(<Siren />, { 'aria-hidden': true, style: { width: 'clamp(2rem, 7vw, 2.5rem)', height: 'clamp(2rem, 7vw, 2.5rem)' } })}
              </div>
            </div>
            <div className="mt-4">
              <EmergencyButton onPress={triggerEmergency} size="xl" label={ta('EMERGENCY BUTTON')} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2" style={{ gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
            <div className="rounded-card bg-white border-2 border-slate-700" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
              <div className="flex items-center font-extrabold text-slate-700" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
                {React.cloneElement(<PhoneCall />, { 'aria-hidden': true, style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })} {ta('Emergency contacts')}
              </div>
              <div className="mt-3">
                {(contacts.length ? contacts : []).map((c) => (
                  <div key={c.id} className="mb-3 flex items-center justify-between rounded-xl bg-white border border-slate-600 shadow-sm" style={{ gap: 'clamp(0.625rem, 2vw, 0.75rem)', padding: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-900 truncate" style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>{c.name}</div>
                      <div className="text-slate-700" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{c.relation}{c.isEmergency ? ` • ${ta('Emergency')}` : ''}</div>
                      <div className="font-semibold text-slate-700" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{c.phone || ta('No phone set')}</div>
                    </div>
                    <button
                      className="inline-flex items-center justify-center rounded-lg bg-slate-900 font-extrabold text-white"
                      style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', minHeight: '44px' }}
                      onClick={() => startPhoneCall(c.phone, { label: c.name })}
                      aria-label={ta(`Call ${c.name}`)}
                    >
                      {React.cloneElement(<PhoneCall />, { 'aria-hidden': true, style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })} {ta('Call')}
                    </button>
                  </div>
                ))}

                <div className="mt-2 rounded-xl bg-white border border-slate-600 shadow-sm" style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
                  <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Add contact')}</div>
                  <div className="mt-2 grid grid-cols-1" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
                    <input className="w-full rounded-lg border border-slate-200" style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.875rem, 3.5vw, 1rem)', minHeight: '44px' }} value={newContact.name} onChange={(e) => setNewContact((s) => ({ ...s, name: e.target.value }))} placeholder={ta('Name')} aria-label={ta('Contact name')} />
                    <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
                      <input className="w-full rounded-lg border border-slate-200" style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.875rem, 3.5vw, 1rem)', minHeight: '44px' }} value={newContact.relation} onChange={(e) => setNewContact((s) => ({ ...s, relation: e.target.value }))} placeholder={ta('Relation (e.g., Son, Daughter)')} aria-label={ta('Contact relation')} />
                      <input className="w-full rounded-lg border border-slate-200" style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.875rem, 3.5vw, 1rem)', minHeight: '44px' }} value={newContact.phone} onChange={(e) => setNewContact((s) => ({ ...s, phone: e.target.value }))} placeholder={ta('Phone')} aria-label={ta('Contact phone')} />
                    </div>
                    <div className="flex items-center justify-between" style={{ gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
                      <label className="inline-flex items-center font-semibold text-slate-700" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
                        <input type="checkbox" checked={newContact.isEmergency} onChange={(e) => setNewContact((s) => ({ ...s, isEmergency: e.target.checked }))} style={{ minWidth: '20px', minHeight: '20px' }} />
                        {ta('Emergency contact')}
                      </label>
                      <button
                        className="rounded-lg bg-primary font-extrabold text-white"
                        style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.75rem, 2.5vw, 1rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }}
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

            <div className="rounded-card bg-white border-2 border-slate-700" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
              <div className="flex items-center font-extrabold text-slate-700" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
                {React.cloneElement(<MapPin />, { 'aria-hidden': true, style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })} {ta('Location')}
              </div>
              <div className="mt-3 text-slate-800" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{profile?.location?.address || ta('Address not set')}</div>
              <div className="mt-1 font-semibold text-slate-700" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Offline map preview')}</div>
            </div>
          </div>

          {active ? (
            <div className="mt-6 rounded-card border border-danger/30 bg-danger/5" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
              <div className="flex items-center text-danger" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
                {React.cloneElement(<ShieldAlert />, { 'aria-hidden': true, style: { width: 'clamp(1rem, 4vw, 1.5rem)', height: 'clamp(1rem, 4vw, 1.5rem)' } })}
                <div className="font-extrabold" style={{ fontSize: 'clamp(1.125rem, 4.5vw, 1.25rem)' }}>🚨 {ta('EMERGENCY DETECTED')}</div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2" style={{ gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
                <div className="rounded-xl bg-white border border-slate-600 shadow" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
                  <div className="font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{ta('Incident type')}</div>
                  <div className="mt-1 font-extrabold" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta(active.type || '')}</div>

                  <div className="mt-3 font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{ta('Status')}</div>
                  <div className="mt-1 inline-flex items-center rounded-full bg-danger/10 font-extrabold text-danger" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', padding: 'clamp(0.25rem, 1vw, 0.375rem) clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
                    {React.cloneElement(<Clock />, { 'aria-hidden': true, style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })} {ta('Active')}
                  </div>

                  <div className="mt-3 font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{ta('ETA')}</div>
                  <div className="mt-1 font-extrabold" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{active.etaMinutes} {ta('min')}</div>
                </div>

                <div className="rounded-xl bg-white border border-slate-600 shadow" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
                  <div className="font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{ta('Map')}</div>
                  <img className="mt-2 w-full rounded-xl border border-slate-200" src={mapSrc} alt={ta('Static map')} />
                  <div className="mt-2 text-slate-700" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Distance to hospital')}: {active.distanceKm} {ta('km')}</div>
                </div>
              </div>

              <div className="mt-5">
                <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Emergency Timeline')}</div>
                <div className="mt-3" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
                  {(active.timeline ?? []).map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl bg-white border border-slate-600 shadow-sm" style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
                      <div className="font-semibold text-slate-800" style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>{ta(t.label || '')}</div>
                      <div className="text-slate-600" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{formatAtMs(t.atMs)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
                <button
                  className="inline-flex items-center justify-center rounded-lg bg-slate-900 font-extrabold text-white"
                  style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.75rem, 2.5vw, 1rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', minHeight: '44px' }}
                  onClick={() => downloadReport(active)}
                  aria-label={ta('Download emergency report')}
                >
                  {React.cloneElement(<Download />, { 'aria-hidden': true, style: { width: 'clamp(0.875rem, 3.5vw, 1.25rem)', height: 'clamp(0.875rem, 3.5vw, 1.25rem)' } })} {ta('Download Report')}
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-lg bg-success font-extrabold text-white"
                  style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.75rem, 2.5vw, 1rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', minHeight: '44px' }}
                  onClick={() => {
                    setEmergencyResolved(active.id);
                    appendActivity({ id: `act_${Date.now()}`, type: 'emergency', title: ta('Emergency resolved'), ts: new Date().toISOString(), detail: ta(`Incident ${active.id}`) });
                  }}
                  aria-label={ta('Mark resolved')}
                >
                  {React.cloneElement(<CheckCircle2 />, { 'aria-hidden': true, style: { width: 'clamp(0.875rem, 3.5vw, 1.25rem)', height: 'clamp(0.875rem, 3.5vw, 1.25rem)' } })} {ta('Mark Resolved')}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 3vw, 1.5rem)' }}>
          <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
            <h3 className="font-bold" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('Past Emergencies')}</h3>
            <div className="mt-3 text-slate-600" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Logs (stored locally)')}</div>

            <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
              {(emergencies ?? []).slice(0, 5).map((e) => (
                <div key={e.id} className="rounded-xl bg-white border border-slate-600" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
                  <div className="flex items-center justify-between">
                      <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>{ta(e.type || '')}</div>
                      <span className={"rounded-full font-extrabold " + (e.status === 'resolved' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger')} style={{ padding: 'clamp(0.25rem, 1vw, 0.375rem) clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>
                        {ta(e.status || '')}
                    </span>
                  </div>
                  <div className="mt-1 text-slate-700" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{new Date(e.startedAtISO).toLocaleString()}</div>
                  <div className="mt-1 text-slate-600" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Status tracked locally')}</div>
                </div>
              ))}
              {!(emergencies ?? []).length ? <div className="rounded-xl bg-white border border-slate-600 text-slate-700" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>{ta('No past emergencies yet.')}</div> : null}
            </div>
          </div>

          <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
            <h3 className="font-bold" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('Voice Keyword')}</h3>
            <div className="mt-2 text-slate-700" style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>{ta('Say')} <span className="font-extrabold">{ta('HELP')}</span> {ta('to trigger emergency (in Daily Companion / Elder Interface).')}</div>
            <div className="mt-3 text-slate-600" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('If speech is not supported, the UI will still work with buttons.')}</div>
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

