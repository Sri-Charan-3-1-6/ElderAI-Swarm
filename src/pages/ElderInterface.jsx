import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, PhoneCall, Pill, Siren, Home, ArrowLeft, UserRound } from 'lucide-react';
import EmergencyButton from '../components/shared/EmergencyButton.jsx';
import VoiceButton from '../components/shared/VoiceButton.jsx';
import DailyCompanion from '../components/agents/DailyCompanion.jsx';
import MedicineBuddy from '../components/agents/MedicineBuddy.jsx';
import EmergencyResponder from '../components/agents/EmergencyResponder.jsx';
import { toast } from '../utils/notificationUtils.js';
import { speak, startRecognition } from '../utils/speechUtils.js';
import { appendActivity, getItem, setOnline, storageKeys, subscribe, touchLastActive, updateProfile } from '../utils/storageUtils.js';
import { startPhoneCall } from '../utils/deviceActions.js';
import { getCurrentLocation, startLiveLocationTracking } from '../utils/locationUtils.js';
import { langToSpeechLocale, useI18n } from '../i18n/i18n.js';

function greetingForNow() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function ElderInterface() {
  const { lang, ta, setLang } = useI18n();
  const [screen, setScreen] = useState('home');
  const [time, setTime] = useState(() => new Date());
  const [listening, setListening] = useState(false);
  const [profile, setProfile] = useState(() => getItem(storageKeys.profile, { name: 'Elder User', contacts: [] }));
  const [newContact, setNewContact] = useState({ name: '', relation: 'Family', phone: '', role: 'family', isEmergency: true });
  const [vtFrom, setVtFrom] = useState(() => lang);
  const [vtTo, setVtTo] = useState(() => (lang === 'en' ? 'ta' : 'en'));
  const [vtOriginal, setVtOriginal] = useState('');
  const [vtTranslated, setVtTranslated] = useState('');
  const recRef = useRef(null);
  const listeningRef = useRef(false);
  const stopTrackingRef = useRef(null);

  useEffect(() => {
    setVtFrom(lang);
    setVtTo(lang === 'en' ? 'te' : 'en');
  }, [lang]);

  useEffect(() => {
    listeningRef.current = listening;
  }, [listening]);

  useEffect(() => {
    setOnline(true);
    const unsub = subscribe(storageKeys.profile, setProfile);
    const id = window.setInterval(() => {
      setTime(new Date());
      touchLastActive();
    }, 1000);
    return () => {
      unsub?.();
      window.clearInterval(id);
      try {
        stopTrackingRef.current?.();
      } catch {
        // ignore
      }
    };
  }, []);

  const setLocationFromReading = (reading, source) => {
    const lat = Number(reading?.lat) || 0;
    const lng = Number(reading?.lng) || 0;
    const accuracyM = Number.isFinite(Number(reading?.accuracyM)) ? Number(reading.accuracyM) : null;
    const tsISO = typeof reading?.tsISO === 'string' ? reading.tsISO : new Date().toISOString();

    updateProfile((p) => ({
      ...(p ?? {}),
      location: {
        ...(p?.location ?? {}),
        coordinates: { lat, lng },
        accuracyM,
        lastUpdatedISO: tsISO
      }
    }));

    logAction('activity', 'Location updated', source || 'Live');
  };

  const captureLocationOnce = async () => {
    try {
      const reading = await getCurrentLocation();
      setLocationFromReading(reading, 'Captured');
      toast({ title: ta('Location'), message: ta('Current location captured.'), type: 'success' });
      speak(ta('Location captured.'), { rate: 0.9, lang: langToSpeechLocale(lang) });
    } catch (err) {
      toast({ title: ta('Location'), message: err?.message || ta('Unable to capture location.'), type: 'error' });
    }
  };

  const toggleLiveTracking = async (enabled) => {
    if (!enabled) {
      try {
        stopTrackingRef.current?.();
      } catch {
        // ignore
      }
      stopTrackingRef.current = null;
      updateProfile((p) => ({ ...(p ?? {}), location: { ...(p?.location ?? {}), trackingEnabled: false } }));
      logAction('activity', 'Live location tracking stopped', 'Tracking');
      toast({ title: ta('Location'), message: ta('Live tracking stopped.'), type: 'success' });
      return;
    }

    try {
      // Best-effort: capture immediately so family sees it right away.
      const reading = await getCurrentLocation({ timeout: 8000 });
      setLocationFromReading(reading, 'Live');

      const stop = startLiveLocationTracking({
        onUpdate: (r) => setLocationFromReading(r, 'Live'),
        onError: (e) => {
          toast({ title: ta('Location'), message: e?.message || ta('Live tracking error.'), type: 'error' });
        }
      });

      stopTrackingRef.current = stop;
      updateProfile((p) => ({ ...(p ?? {}), location: { ...(p?.location ?? {}), trackingEnabled: true } }));
      logAction('activity', 'Live location tracking started', 'Tracking');
      toast({ title: ta('Location'), message: ta('Live tracking started.'), type: 'success' });
    } catch (err) {
      updateProfile((p) => ({ ...(p ?? {}), location: { ...(p?.location ?? {}), trackingEnabled: false } }));
      toast({ title: ta('Location'), message: err?.message || ta('Unable to start live tracking.'), type: 'error' });
    }
  };

  const greeting = useMemo(() => greetingForNow(), [time]);

  const primaryContact = useMemo(() => {
    const list = Array.isArray(profile?.contacts) ? profile.contacts : [];
    return list.find((c) => c?.role === 'family') ?? list.find((c) => c?.isEmergency) ?? list[0] ?? null;
  }, [profile]);

  const logAction = (type, title, detail) => {
    appendActivity({ id: `act_${Date.now()}`, type, title, ts: new Date().toISOString(), detail: detail || '' });
  };

  const logProfileFieldIfChanged = (fieldLabel, before, after) => {
    const b = String(before ?? '').trim();
    const a = String(after ?? '').trim();
    if (b === a) return;
    logAction('activity', 'Profile updated', fieldLabel);
  };

  const callFamily = () => {
    const ok = startPhoneCall(primaryContact?.phone, {
      label: primaryContact?.name || 'Family contact',
      toast
    });
    if (!ok) toast({ title: 'Call Family', message: 'No phone number set in Profile → Contacts.', type: 'warning' });
    speak(ta(`Calling ${primaryContact?.name || 'your family contact'}.`), { rate: 0.8, lang: langToSpeechLocale(lang) });
    logAction('call', 'Call started', primaryContact?.name || 'Family contact');
  };

  const triggerEmergency = () => {
    setScreen('emergency');
    // Best-effort: start a call to the configured family emergency contact.
    startPhoneCall(primaryContact?.phone, { label: `Emergency contact ${primaryContact?.name || 'contact'}`, toast });
    speak(ta('Emergency activated. Calling your emergency contact now.'), { rate: 0.8, lang: langToSpeechLocale(lang) });
    logAction('emergency', 'Emergency triggered from Elder device', primaryContact?.name || 'Emergency contact');
  };

  const handleVoiceCommand = (text) => {
    const t = (text || '').toLowerCase();
    if (!t) return;

    if (
      t.includes('emergency') ||
      t.includes('help') ||
      t.includes('உதவி') ||
      t.includes('அவசர') ||
      t.includes('मदद') ||
      t.includes('आपात')
    ) {
      triggerEmergency();
      return;
    }
    if (t.includes('medicine') || t.includes('tablet') || t.includes('மருந்த') || t.includes('दवा')) {
      setScreen('medicines');
      return;
    }
    if (t.includes('talk') || t.includes('friend') || t.includes('chat') || t.includes('பேச') || t.includes('बात')) {
      setScreen('talk');
      return;
    }
    if (t.includes('call') || t.includes('family') || t.includes('அழை') || t.includes('कॉल') || t.includes('परिवार')) {
      callFamily();
      return;
    }

    if (t.includes('profile') || t.includes('contacts') || t.includes('சுயவிவரம்') || t.includes('प्रोफ़ाइल')) {
      setScreen('profile');
      return;
    }

    toast({ title: ta('Voice command'), message: ta(`Heard: "${text}"`), type: 'info' });
  };

  const toggleContinuousListening = () => {
    if (listening) {
      try {
        recRef.current?.stop?.();
      } catch {
        // ignore
      }
      recRef.current = null;
      setListening(false);
      toast({ title: ta('Voice'), message: ta('Stopped listening.'), type: 'info' });
      return;
    }

    setListening(true);

    const start = () => {
      const rec = startRecognition({
        lang: langToSpeechLocale(profile?.language || lang),
        continuous: true,
        onResult: (txt) => handleVoiceCommand(txt),
        onEnd: () => {
          // auto-restart while enabled
          if (listeningRef.current) {
            window.setTimeout(() => {
              if (listeningRef.current) start();
            }, 250);
          }
        },
        onError: () => setListening(false)
      });
      recRef.current = rec;
      if (!rec) setListening(false);
    };

    start();
    toast({ title: ta('Voice'), message: ta('Listening for commands…'), type: 'info' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-6">
        {screen === 'home' ? (
          <>
            <div className="rounded-2xl bg-white shadow-card ring-1 ring-slate-100 p-6">
              <div className="text-4xl font-extrabold leading-tight">{ta(greeting)}, {profile?.name || ta('Elder User')}!</div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-600">{time.toLocaleDateString()}</div>
              <div className="mt-1 text-lg text-slate-600">{ta('Tap a big button below.')}</div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <BigSquareButton
                color="primary"
                icon={<MessageCircle aria-hidden="true" className="h-10 w-10" />}
                label={ta('Talk to AI Friend')}
                onClick={() => {
                  setScreen('talk');
                  logAction('chat', 'Opened Daily Companion', 'Talk');
                }}
              />
              <BigSquareButton color="success" icon={<PhoneCall aria-hidden="true" className="h-10 w-10" />} label={ta('Call Family')} onClick={callFamily} />
              <BigSquareButton
                color="purple"
                icon={<Pill aria-hidden="true" className="h-10 w-10" />}
                label={ta('My Medicines')}
                onClick={() => {
                  setScreen('medicines');
                  logAction('medicine', 'Opened Medicines', 'Medicines');
                }}
              />
              <BigSquareButton color="danger" icon={<Siren aria-hidden="true" className="h-10 w-10" />} label={ta('Emergency Help')} onClick={triggerEmergency} />
              <div className="sm:col-span-2">
                <BigSquareButton
                  color="slate"
                  icon={<UserRound aria-hidden="true" className="h-10 w-10" />}
                  label={ta('Profile & Contacts')}
                  onClick={() => {
                    setScreen('profile');
                    logAction('activity', 'Opened Profile & Contacts', 'Profile');
                  }}
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-white shadow-card ring-1 ring-slate-100 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-2xl font-extrabold">{ta('Live Voice Translation')}</div>
                  <div className="mt-1 text-slate-600">{ta('Tap the mic, speak, and it will translate + speak back.')}</div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-sm font-semibold text-slate-700">
                    {ta('From')}
                    <select
                      className="ml-2 rounded-lg bg-white px-2 py-1 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 focus:outline-none"
                      value={vtFrom}
                      onChange={(e) => setVtFrom(e.target.value)}
                      aria-label={ta('Translate from language')}
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
                  <label className="text-sm font-semibold text-slate-700">
                    {ta('To')}
                    <select
                      className="ml-2 rounded-lg bg-white px-2 py-1 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 focus:outline-none"
                      value={vtTo}
                      onChange={(e) => setVtTo(e.target.value)}
                      aria-label={ta('Translate to language')}
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
                  <VoiceButton
                    variant="compact"
                    lang={langToSpeechLocale(vtFrom)}
                    translateFrom={vtFrom}
                    translateTo={vtTo}
                    speakTranslation
                    onText={(txt) => setVtOriginal(String(txt || ''))}
                    onTranslation={(txt) => setVtTranslated(String(txt || ''))}
                    ariaLabel={ta('Live voice translation')}
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-500">{ta('Heard')}</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">{vtOriginal || '—'}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-500">{ta('Translated')}</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">{vtTranslated || '—'}</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="mb-4 flex items-center justify-between">
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-2xl font-extrabold shadow-card ring-1 ring-slate-100"
              onClick={() => setScreen('home')}
              aria-label={ta('Back to home')}
            >
              <ArrowLeft aria-hidden="true" /> {ta('Home')}
            </button>
            <div className="text-lg font-bold text-slate-600">{ta('Elder Interface')}</div>
          </div>
        )}

        {screen === 'talk' ? (
          <div className="rounded-2xl bg-white shadow-card ring-1 ring-slate-100 p-4 sm:p-6">
            <div className="text-2xl font-extrabold mb-3">{ta('Talk to AI Friend')}</div>
            <div className="text-2xl">
              <DailyCompanion />
            </div>
          </div>
        ) : null}

        {screen === 'medicines' ? (
          <div className="rounded-2xl bg-white shadow-card ring-1 ring-slate-100 p-4 sm:p-6">
            <div className="text-2xl font-extrabold mb-3">{ta('My Medicines')}</div>
            <div className="text-2xl">
              <MedicineBuddy />
            </div>
          </div>
        ) : null}

        {screen === 'emergency' ? (
          <div className="rounded-2xl bg-white shadow-card ring-1 ring-slate-100 p-4 sm:p-6">
            <div className="text-2xl font-extrabold mb-3">{ta('Emergency Help')}</div>
            <div className="text-2xl">
              <EmergencyResponder />
            </div>
          </div>
        ) : null}

        {screen === 'profile' ? (
          <div className="rounded-2xl bg-white shadow-card ring-1 ring-slate-100 p-4 sm:p-6">
            <div className="text-2xl font-extrabold mb-3">{ta('Profile & Contacts')}</div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-sm font-extrabold text-slate-900">{ta('Elder Profile')}</div>

                <label className="mt-3 block">
                  <div className="text-xs font-semibold text-slate-500">{ta('Name')}</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-semibold"
                    value={profile?.name ?? ''}
                    onChange={(e) => updateProfile((p) => ({ ...p, name: e.target.value }))}
                    onFocus={(e) => {
                      e.currentTarget.dataset.prev = e.currentTarget.value;
                    }}
                    onBlur={(e) => logProfileFieldIfChanged('Name', e.currentTarget.dataset.prev, e.target.value)}
                    aria-label={ta('Elder name')}
                  />
                </label>

                <label className="mt-3 block">
                  <div className="text-xs font-semibold text-slate-500">{ta('Age')}</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-semibold"
                    inputMode="numeric"
                    value={String(profile?.age ?? '')}
                    onChange={(e) => updateProfile((p) => ({ ...p, age: e.target.value }))}
                    onFocus={(e) => {
                      e.currentTarget.dataset.prev = e.currentTarget.value;
                    }}
                    onBlur={(e) => logProfileFieldIfChanged('Age', e.currentTarget.dataset.prev, e.target.value)}
                    aria-label={ta('Elder age')}
                  />
                </label>

                <label className="mt-3 block">
                  <div className="text-xs font-semibold text-slate-500">{ta('Language')}</div>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-semibold"
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

                <label className="mt-3 block">
                  <div className="text-xs font-semibold text-slate-500">{ta('Home address')}</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-semibold"
                    value={profile?.location?.address ?? ''}
                    onChange={(e) => updateProfile((p) => ({ ...p, location: { ...(p?.location ?? {}), address: e.target.value } }))}
                    onFocus={(e) => {
                      e.currentTarget.dataset.prev = e.currentTarget.value;
                    }}
                    onBlur={(e) => logProfileFieldIfChanged('Address', e.currentTarget.dataset.prev, e.target.value)}
                    aria-label={ta('Home address')}
                  />
                </label>

                <div className="mt-3 rounded-xl bg-white p-4 shadow-sm">
                  <div className="text-sm font-extrabold text-slate-900">{ta('Live location')}</div>
                  <div className="mt-2 text-sm text-slate-700">
                    {ta('Coordinates')}: <span className="font-extrabold">{Number(profile?.location?.coordinates?.lat ?? 0).toFixed(5)}, {Number(profile?.location?.coordinates?.lng ?? 0).toFixed(5)}</span>
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">
                    {ta('Last updated')}: {profile?.location?.lastUpdatedISO ? new Date(profile.location.lastUpdatedISO).toLocaleString() : '—'}
                    {Number.isFinite(Number(profile?.location?.accuracyM)) ? ` • ${ta('Accuracy')} ~${Math.round(Number(profile.location.accuracyM))}${ta('m')}` : ''}
                  </div>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <button
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-extrabold text-white"
                      type="button"
                      onClick={captureLocationOnce}
                      aria-label={ta('Capture current location')}
                    >
                      {ta('Capture current location')}
                    </button>
                    <label className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-900">
                      <input
                        type="checkbox"
                        checked={Boolean(profile?.location?.trackingEnabled)}
                        onChange={(e) => toggleLiveTracking(e.target.checked)}
                        aria-label={ta('Toggle live location tracking')}
                      />
                      {ta('Live tracking')}
                    </label>
                  </div>
                  <div className="mt-2 text-xs font-semibold text-slate-500">
                    {ta('Note: Location works only after you allow browser permission.')}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-sm font-extrabold text-slate-900">{ta('Contacts')}</div>
                <div className="mt-3 space-y-2">
                  {(Array.isArray(profile?.contacts) ? profile.contacts : []).map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm">
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-900 truncate">
                          {c.name} {c.isEmergency ? <span className="ml-2 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-extrabold text-danger">{ta('Emergency')}</span> : null}
                        </div>
                        <div className="text-sm text-slate-600 truncate">{c.relation || ta('Contact')} • {c.phone || ta('No number')}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-extrabold text-white"
                          onClick={() => startPhoneCall(c.phone, { label: c.name, toast })}
                          aria-label={`${ta('Call')} ${c.name}`}
                          type="button"
                        >
                          {ta('Call')}
                        </button>
                        <button
                          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-extrabold text-slate-900"
                          onClick={() =>
                            updateProfile((p) => ({
                              ...p,
                              contacts: (Array.isArray(p?.contacts) ? p.contacts : []).map((x) => (x.id === c.id ? { ...x, isEmergency: !x.isEmergency } : x))
                            }))
                          }
                          aria-label={`${ta('Toggle emergency for')} ${c.name}`}
                          type="button"
                        >
                          {c.isEmergency ? ta('Unset') : ta('Set')}
                        </button>
                        <button
                          className="rounded-lg bg-danger px-3 py-2 text-sm font-extrabold text-white"
                          onClick={() => {
                            updateProfile((p) => ({ ...p, contacts: (Array.isArray(p?.contacts) ? p.contacts : []).filter((x) => x.id !== c.id) }));
                            logAction('activity', 'Contact removed', c.name);
                          }}
                          aria-label={`${ta('Remove')} ${c.name}`}
                          type="button"
                        >
                          {ta('Remove')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
                  <div className="text-sm font-extrabold text-slate-900">{ta('Add contact')}</div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-semibold"
                      placeholder={ta('Name')}
                      value={newContact.name}
                      onChange={(e) => setNewContact((s) => ({ ...s, name: e.target.value }))}
                      aria-label={ta('Contact name')}
                    />
                    <input
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-semibold"
                      placeholder={ta('Phone')}
                      inputMode="tel"
                      value={newContact.phone}
                      onChange={(e) => setNewContact((s) => ({ ...s, phone: e.target.value }))}
                      aria-label={ta('Contact phone')}
                    />
                    <input
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg font-semibold"
                      placeholder={ta('Relation (e.g., Son, Daughter, Neighbor)')}
                      value={newContact.relation}
                      onChange={(e) => setNewContact((s) => ({ ...s, relation: e.target.value }))}
                      aria-label={ta('Contact relation')}
                    />
                    <button
                      className="rounded-xl bg-primary px-4 py-3 text-lg font-extrabold text-white shadow-card"
                      onClick={() => {
                        const name = (newContact.name || '').trim();
                        const phone = (newContact.phone || '').trim();
                        if (!name) {
                          toast({ title: ta('Contact'), message: ta('Please enter a name.'), type: 'warning' });
                          return;
                        }
                        updateProfile((p) => ({
                          ...p,
                          contacts: [
                            {
                              id: `c_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                              name,
                              phone,
                              relation: (newContact.relation || '').trim(),
                              role: 'family',
                              isEmergency: Boolean(newContact.isEmergency)
                            },
                            ...(Array.isArray(p?.contacts) ? p.contacts : [])
                          ]
                        }));
                        setNewContact({ name: '', relation: 'Family', phone: '', role: 'family', isEmergency: true });
                        toast({ title: ta('Contact'), message: ta('Saved.'), type: 'success' });
                        logAction('activity', 'Contact added', name);
                      }}
                      aria-label={ta('Add contact')}
                      type="button"
                    >
                      {ta('Add')}
                    </button>
                  </div>

                  <label className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(newContact.isEmergency)}
                      onChange={(e) => setNewContact((s) => ({ ...s, isEmergency: e.target.checked }))}
                      aria-label={ta('Mark new contact as emergency')}
                    />
                    {ta('Emergency contact')}
                  </label>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Bottom bar (always visible) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="grid grid-cols-4 gap-3 items-center">
            <div className="col-span-2">
              <EmergencyButton onPress={triggerEmergency} size="lg" label={ta('EMERGENCY')} />
            </div>
            <button
              className="inline-flex h-16 items-center justify-center rounded-xl bg-slate-900 text-white font-extrabold shadow-card"
              onClick={() => setScreen('home')}
              aria-label={ta('Home')}
            >
              <Home aria-hidden="true" className="h-7 w-7" />
            </button>
            <button
              className={
                'inline-flex h-16 items-center justify-center rounded-xl font-extrabold shadow-card ' +
                (listening ? 'bg-primary text-white' : 'bg-slate-900 text-white')
              }
              onClick={toggleContinuousListening}
              aria-label={ta('Toggle voice listening')}
            >
              {listening ? ta('Listening…') : ta('Voice')}
            </button>
          </div>
          <div className="mt-2 text-center text-sm text-slate-600">{ta('Voice commands: “Emergency”, “Medicine”, “Talk”, “Call family”, “Profile”, “Help”.')}</div>
        </div>
      </div>

      <div className="h-28" aria-hidden="true" />
    </div>
  );
}

function BigSquareButton({ color, icon, label, onClick }) {
  const map = {
    primary: 'bg-primary text-white',
    success: 'bg-success text-white',
    danger: 'bg-danger text-white',
    purple: 'bg-violet-600 text-white',
    slate: 'bg-slate-900 text-white'
  };

  return (
    <button
      className={`h-[140px] w-full rounded-2xl ${map[color] ?? map.primary} shadow-card transition hover:brightness-110 focus:outline-none flex flex-col items-center justify-center gap-3`}
      onClick={onClick}
      aria-label={label}
    >
      {icon}
      <div className="text-2xl font-extrabold">{label}</div>
    </button>
  );
}
