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

  const greeting = useMemo(() => ta(greetingForNow()), [time, ta]);

  const primaryContact = useMemo(() => {
    const list = Array.isArray(profile?.contacts) ? profile.contacts : [];
    return list.find((c) => c?.role === 'family') ?? list.find((c) => c?.isEmergency) ?? list[0] ?? null;
  }, [profile]);

  const logAction = (type, title, detail) => {
    appendActivity({ id: `act_${Date.now()}`, type, title: ta(title), ts: new Date().toISOString(), detail: detail ? ta(detail) : '' });
  };

  const logProfileFieldIfChanged = (fieldLabel, before, after) => {
    const b = String(before ?? '').trim();
    const a = String(after ?? '').trim();
    if (b === a) return;
    logAction('activity', ta('Profile updated'), fieldLabel);
  };

  const callFamily = () => {
    const ok = startPhoneCall(primaryContact?.phone, {
      label: primaryContact?.name || ta('Family contact'),
      toast
    });
    if (!ok) toast({ title: ta('Call Family'), message: ta('No phone number set in Profile → Contacts.'), type: 'warning' });
    speak(ta(`Calling ${primaryContact?.name || ta('your family contact')}.`), { rate: 0.8, lang: langToSpeechLocale(lang) });
    logAction('call', ta('Call started'), primaryContact?.name || ta('Family contact'));
  };

  const triggerEmergency = () => {
    setScreen('emergency');
    // Best-effort: start a call to the configured family emergency contact.
    startPhoneCall(primaryContact?.phone, { label: `${ta('Emergency contact')} ${primaryContact?.name || ta('contact')}`, toast });
    speak(ta('Emergency activated. Calling your emergency contact now.'), { rate: 0.8, lang: langToSpeechLocale(lang) });
    logAction('emergency', ta('Emergency triggered from Elder device'), primaryContact?.name || ta('Emergency contact'));
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
    <div className="min-h-screen bg-app-bg text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-6">
        {screen === 'home' ? (
          <>
            <div className="rounded-2xl bg-white shadow-card border-2 border-slate-700" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
              <div className="font-extrabold leading-tight" style={{ fontSize: 'clamp(2rem, 8vw, 2.25rem)' }}>{ta(greeting)}, {profile?.name || ta('Elder User')}!</div>
              <div className="mt-2 font-extrabold text-slate-900" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="mt-1 font-semibold text-slate-600" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{time.toLocaleDateString()}</div>
              <div className="mt-1 text-slate-600" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('Tap a big button below.')}</div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
              <BigSquareButton
                color="primary"
                icon={React.cloneElement(<MessageCircle aria-hidden="true" />, { style: { width: 'clamp(2rem, 7vw, 2.5rem)', height: 'clamp(2rem, 7vw, 2.5rem)' } })}
                label={ta('Talk to AI Friend')}
                onClick={() => {
                  setScreen('talk');
                  logAction('chat', 'Opened Daily Companion', 'Talk');
                }}
              />
              <BigSquareButton color="success" icon={React.cloneElement(<PhoneCall aria-hidden="true" />, { style: { width: 'clamp(2rem, 7vw, 2.5rem)', height: 'clamp(2rem, 7vw, 2.5rem)' } })} label={ta('Call Family')} onClick={callFamily} />
              <BigSquareButton
                color="purple"
                icon={React.cloneElement(<Pill aria-hidden="true" />, { style: { width: 'clamp(2rem, 7vw, 2.5rem)', height: 'clamp(2rem, 7vw, 2.5rem)' } })}
                label={ta('My Medicines')}
                onClick={() => {
                  setScreen('medicines');
                  logAction('medicine', 'Opened Medicines', 'Medicines');
                }}
              />
              <BigSquareButton color="danger" icon={React.cloneElement(<Siren aria-hidden="true" />, { style: { width: 'clamp(2rem, 7vw, 2.5rem)', height: 'clamp(2rem, 7vw, 2.5rem)' } })} label={ta('Emergency Help')} onClick={triggerEmergency} />
              <div className="sm:col-span-2">
                <BigSquareButton
                  color="slate"
                  icon={React.cloneElement(<UserRound aria-hidden="true" />, { style: { width: 'clamp(2rem, 7vw, 2.5rem)', height: 'clamp(2rem, 7vw, 2.5rem)' } })}
                  label={ta('Profile & Contacts')}
                  onClick={() => {
                    setScreen('profile');
                    logAction('activity', 'Opened Profile & Contacts', 'Profile');
                  }}
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-white shadow-card ring-1 ring-slate-100" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between" style={{ gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
                <div>
                  <div className="font-extrabold" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>{ta('Live Voice Translation')}</div>
                  <div className="mt-1 text-slate-600" style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>{ta('Tap the mic, speak, and it will translate + speak back.')}</div>
                </div>
                <div className="flex flex-wrap items-center" style={{ gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
                  <label className="font-semibold text-slate-700" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
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
                  <label className="font-semibold text-slate-700" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
                    {ta('To')}
                    <select
                      className="ml-2 rounded-lg bg-white ring-1 ring-slate-200 focus:outline-none font-semibold text-slate-800"
                      style={{ paddingLeft: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingRight: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingTop: 'clamp(0.25rem, 1vw, 0.375rem)', paddingBottom: 'clamp(0.25rem, 1vw, 0.375rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}
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

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
                <div className="rounded-xl bg-white border border-slate-600" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
                  <div className="font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{ta('Heard')}</div>
                  <div className="mt-1 font-semibold text-slate-900" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{vtOriginal || '—'}</div>
                </div>
                <div className="rounded-xl bg-white border border-slate-600" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
                  <div className="font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{ta('Translated')}</div>
                  <div className="mt-1 font-semibold text-slate-900" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{vtTranslated || '—'}</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="mb-4 flex items-center justify-between">
            <button
              className="inline-flex items-center rounded-xl bg-white font-extrabold shadow-card ring-1 ring-slate-100"
              style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1.25rem, 5vw, 1.5rem)', minHeight: '44px' }}
              onClick={() => setScreen('home')}
              aria-label={ta('Back to home')}
            >
              {React.cloneElement(<ArrowLeft aria-hidden="true" />, { style: { width: 'clamp(1rem, 4vw, 1.5rem)', height: 'clamp(1rem, 4vw, 1.5rem)' } })} {ta('Home')}
            </button>
            <div className="font-bold text-slate-600" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('Elder Interface')}</div>
          </div>
        )}

        {screen === 'talk' ? (
          <div className="rounded-2xl bg-white shadow-card ring-1 ring-slate-100" style={{ padding: 'clamp(0.75rem, 2.5vw, 1.5rem)' }}>
            <div className="font-extrabold mb-3" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>{ta('Talk to AI Friend')}</div>
            <div style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>
              <DailyCompanion />
            </div>
          </div>
        ) : null}

        {screen === 'medicines' ? (
          <div className="rounded-2xl bg-white shadow-card ring-1 ring-slate-100" style={{ padding: 'clamp(0.75rem, 2.5vw, 1.5rem)' }}>
            <div className="font-extrabold mb-3" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>{ta('My Medicines')}</div>
            <div style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>
              <MedicineBuddy />
            </div>
          </div>
        ) : null}

        {screen === 'emergency' ? (
          <div className="rounded-2xl bg-white shadow-card ring-1 ring-slate-100" style={{ padding: 'clamp(0.75rem, 2.5vw, 1.5rem)' }}>
            <div className="font-extrabold mb-3" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>{ta('Emergency Help')}</div>
            <div style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>
              <EmergencyResponder />
            </div>
          </div>
        ) : null}

        {screen === 'profile' ? (
          <div className="rounded-2xl bg-white shadow-card ring-1 ring-slate-100" style={{ padding: 'clamp(0.75rem, 2.5vw, 1.5rem)' }}>
            <div className="font-extrabold mb-3" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>{ta('Profile & Contacts')}</div>

            <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
              <div className="rounded-xl bg-white border border-slate-600" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
                <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Elder Profile')}</div>

                <label className="mt-3 block">
                  <div className="font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{ta('Name')}</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white font-semibold"
                    style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }}
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
                  <div className="font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{ta('Age')}</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white font-semibold"
                    style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }}
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
                  <div className="font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{ta('Language')}</div>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white font-semibold"
                    style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }}
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
                  <div className="font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{ta('Home address')}</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white font-semibold"
                    style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }}
                    value={profile?.location?.address ?? ''}
                    onChange={(e) => updateProfile((p) => ({ ...p, location: { ...(p?.location ?? {}), address: e.target.value } }))}
                    onFocus={(e) => {
                      e.currentTarget.dataset.prev = e.currentTarget.value;
                    }}
                    onBlur={(e) => logProfileFieldIfChanged('Address', e.currentTarget.dataset.prev, e.target.value)}
                    aria-label={ta('Home address')}
                  />
                </label>

                <div className="mt-3 rounded-xl bg-white border border-slate-600 shadow-sm" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
                  <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Live location')}</div>
                  <div className="mt-2 text-slate-700" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
                    {ta('Coordinates')}: <span className="font-extrabold">{Number(profile?.location?.coordinates?.lat ?? 0).toFixed(5)}, {Number(profile?.location?.coordinates?.lng ?? 0).toFixed(5)}</span>
                  </div>
                  <div className="mt-1 font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>
                    {ta('Last updated')}: {profile?.location?.lastUpdatedISO ? new Date(profile.location.lastUpdatedISO).toLocaleString() : '—'}
                    {Number.isFinite(Number(profile?.location?.accuracyM)) ? ` • ${ta('Accuracy')} ~${Math.round(Number(profile.location.accuracyM))}${ta('m')}` : ''}
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
                    <button
                      className="rounded-lg bg-slate-900 font-extrabold text-white"
                      style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }}
                      type="button"
                      onClick={captureLocationOnce}
                      aria-label={ta('Capture current location')}
                    >
                      {ta('Capture current location')}
                    </button>
                    <label className="inline-flex items-center font-extrabold text-slate-900" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(profile?.location?.trackingEnabled)}
                        onChange={(e) => toggleLiveTracking(e.target.checked)}
                        aria-label={ta('Toggle live location tracking')}
                      />
                      {ta('Live tracking')}
                    </label>
                  </div>
                  <div className="mt-2 font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>
                    {ta('Note: Location works only after you allow browser permission.')}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white border border-slate-600" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
                <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Contacts')}</div>
                <div className="mt-3 space-y-2">
                  {(Array.isArray(profile?.contacts) ? profile.contacts : []).map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-xl bg-white border border-slate-600 shadow-sm" style={{ gap: 'clamp(0.5rem, 1.5vw, 0.75rem)', padding: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-900 truncate">
                          {c.name} {c.isEmergency ? <span className="ml-2 rounded-full bg-danger/10 font-extrabold text-danger" style={{ paddingLeft: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingRight: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingTop: 'clamp(0.125rem, 0.5vw, 0.25rem)', paddingBottom: 'clamp(0.125rem, 0.5vw, 0.25rem)', fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{ta('Emergency')}</span> : null}
                        </div>
                        <div className="text-slate-600 truncate" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{c.relation || ta('Contact')} • {c.phone || ta('No number')}</div>
                      </div>
                      <div className="flex shrink-0 items-center" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
                        <button
                          className="rounded-lg bg-slate-900 font-extrabold text-white"
                          style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }}
                          onClick={() => startPhoneCall(c.phone, { label: c.name, toast })}
                          aria-label={`${ta('Call')} ${c.name}`}
                          type="button"
                        >
                          {ta('Call')}
                        </button>
                        <button
                          className="rounded-lg bg-slate-100 font-extrabold text-slate-900"
                          style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }}
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
                          className="rounded-lg bg-danger font-extrabold text-white"
                          style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }}
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

                <div className="mt-4 rounded-xl bg-white border border-slate-600 shadow-sm" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
                  <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Add contact')}</div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
                    <input
                      className="rounded-xl border border-slate-200 bg-white font-semibold"
                      style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }}
                      placeholder={ta('Name')}
                      value={newContact.name}
                      onChange={(e) => setNewContact((s) => ({ ...s, name: e.target.value }))}
                      aria-label={ta('Contact name')}
                    />
                    <input
                      className="rounded-xl border border-slate-200 bg-white font-semibold"
                      style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }}
                      placeholder={ta('Phone')}
                      inputMode="tel"
                      value={newContact.phone}
                      onChange={(e) => setNewContact((s) => ({ ...s, phone: e.target.value }))}
                      aria-label={ta('Contact phone')}
                    />
                    <input
                      className="rounded-xl border border-slate-200 bg-white font-semibold"
                      style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }}
                      placeholder={ta('Relation (e.g., Son, Daughter, Neighbor)')}
                      value={newContact.relation}
                      onChange={(e) => setNewContact((s) => ({ ...s, relation: e.target.value }))}
                      aria-label={ta('Contact relation')}
                    />
                    <button
                      className="rounded-xl bg-primary font-extrabold text-white shadow-card"
                      style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }}
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

                  <label className="mt-3 inline-flex items-center font-semibold text-slate-700" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
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
        <div className="mx-auto max-w-5xl" style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
          <div className="grid grid-cols-4 items-center" style={{ gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
            <div className="col-span-2">
              <EmergencyButton onPress={triggerEmergency} size="lg" label={ta('EMERGENCY')} />
            </div>
            <button
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white font-extrabold shadow-card"
              style={{ height: 'clamp(3.5rem, 12vw, 4rem)', minHeight: '44px' }}
              onClick={() => setScreen('home')}
              aria-label={ta('Home')}
            >
              {React.cloneElement(<Home aria-hidden="true" />, { style: { width: 'clamp(1.25rem, 5vw, 1.75rem)', height: 'clamp(1.25rem, 5vw, 1.75rem)' } })}
            </button>
            <button
              className={
                'inline-flex items-center justify-center rounded-xl font-extrabold shadow-card ' +
                (listening ? 'bg-primary text-white' : 'bg-slate-900 text-white')
              }
              style={{ height: 'clamp(3.5rem, 12vw, 4rem)', minHeight: '44px' }}
              onClick={toggleContinuousListening}
              aria-label={ta('Toggle voice listening')}
            >
              {listening ? ta('Listening…') : ta('Voice')}
            </button>
          </div>
          <div className="mt-2 text-center text-slate-600" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Voice commands: "Emergency", "Medicine", "Talk", "Call family", "Profile", "Help".')}</div>
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
      className={`w-full rounded-2xl ${map[color] ?? map.primary} shadow-card transition hover:brightness-110 focus:outline-none flex flex-col items-center justify-center`}
      style={{ height: 'clamp(8rem, 28vw, 8.75rem)', gap: 'clamp(0.5rem, 1.5vw, 0.75rem)', minHeight: '44px' }}
      onClick={onClick}
      aria-label={label}
    >
      {icon}
      <div className="font-extrabold" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>{label}</div>
    </button>
  );
}

