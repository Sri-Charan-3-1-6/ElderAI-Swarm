import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, PhoneCall, MessageSquare, MapPin, CheckCircle2, XCircle, Clock3, TestTube } from 'lucide-react';
import { getCurrentLocation } from '../utils/location.js';
import { buildEmergencyMessage, buildSmsHref, buildWhatsAppHref, getPrimaryContact, logEmergency } from '../utils/emergency.js';

const ALERT_SRC =
  'data:audio/wav;base64,UklGRhQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQwAAAAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA';

export default function EmergencyModal({ contacts, onClose, onLogged, testMode = false }) {
  const [step, setStep] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [location, setLocation] = useState(null);
  const [smsDone, setSmsDone] = useState(false);
  const [callDone, setCallDone] = useState(false);
  const [logEntry, setLogEntry] = useState(null);
  const timers = useRef([]);
  const ticker = useRef(null);
  const wakeLockRef = useRef(null);
  const startTs = useRef(Date.now());

  const primary = useMemo(() => getPrimaryContact(contacts || []), [contacts]);
  const message = useMemo(
    () => buildEmergencyMessage({ name: 'Grandma', address: location?.address, time: new Date(), locationUrl: location?.mapUrl }),
    [location]
  );

  useEffect(() => {
    ticker.current = window.setInterval(() => setElapsed(Math.floor((Date.now() - startTs.current) / 1000)), 1000);
    runSequence();
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      clearInterval(ticker.current);
      try {
        wakeLockRef.current?.release?.();
      } catch {
        // ignore
      }
    };
  }, []);

  const runSequence = () => {
    try {
      wakeLockRef.current = navigator.wakeLock ? navigator.wakeLock.request('screen') : null;
    } catch {
      // ignore
    }

    try {
      navigator.vibrate?.([500, 200, 500, 200, 500]);
    } catch {
      // ignore
    }

    playAlert();

    timers.current.push(
      setTimeout(() => {
        setStep(2);
        if (!callDone && primary?.phone && !testMode) {
          callPrimary(primary.phone);
        }
        setCallDone(true);
      }, 2000)
    );

    timers.current.push(
      setTimeout(() => {
        setStep(3);
        sendSmsAll();
      }, 5000)
    );

    timers.current.push(
      setTimeout(async () => {
        setStep(4);
        const loc = await getCurrentLocation();
        setLocation(loc);
      }, 10000)
    );

    timers.current.push(
      setTimeout(() => {
        setStep(5);
        const logged = logEmergency({
          type: 'Manual Emergency Button',
          testMode,
          contacts: contacts?.map((c) => c.name) || [],
          smsSentTo: contacts?.map((c) => c.phone) || [],
          location,
          responseMs: Date.now() - startTs.current,
          resolved: false
        });
        setLogEntry(logged);
        onLogged?.(logged);
      }, 15000)
    );

    timers.current.push(setTimeout(() => setStep(6), 20000));
  };

  const playAlert = () => {
    try {
      const audio = new Audio(ALERT_SRC);
      audio.play().catch(() => {});
    } catch {
      // ignore
    }
  };

  const callPrimary = (phone) => {
    if (!phone) return;
    const href = `tel:${phone}`;
    if (!testMode) window.location.href = href;
  };

  const sendSmsAll = () => {
    if (smsDone || !contacts?.length) return;
    const href = buildSmsHref(contacts[0].phone, message);
    setSmsDone(true);
    if (!testMode && href) {
      window.location.href = href;
    }
  };

  const shareWhatsApp = () => {
    const href = buildWhatsAppHref(contacts?.[0]?.phone, message);
    if (href) window.open(href, '_blank');
  };

  const minutes = Math.floor(elapsed / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (elapsed % 60).toString().padStart(2, '0');

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-red-700 text-white">
      <div className="absolute inset-0 animate-pulse bg-red-500 opacity-30" aria-hidden />
      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center text-center" style={{ gap: 'clamp(0.75rem, 2.5vw, 1rem)', paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
        {testMode ? (
          <div className="rounded-full bg-amber-500 font-black text-amber-50 shadow-lg" style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>
            {React.cloneElement(<TestTube className="mr-1 inline" aria-hidden />, { style: { width: 'clamp(1rem, 4vw, 1.25rem)', height: 'clamp(1rem, 4vw, 1.25rem)' } })} TEST MODE (no real calls/messages)
          </div>
        ) : null}
        <div style={{ fontSize: 'clamp(3rem, 10vw, 4.5rem)' }}>🚨</div>
        <h1 className="font-black tracking-tight" style={{ fontSize: 'clamp(1.5rem, 6vw, 2.25rem)' }}>EMERGENCY ACTIVATED</h1>
        <div className="flex items-center font-bold" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>
          {React.cloneElement(<Clock3 aria-hidden />, { style: { width: 'clamp(1.25rem, 5vw, 1.5rem)', height: 'clamp(1.25rem, 5vw, 1.5rem)' } })} {minutes}:{seconds}
        </div>

        <div className="w-full rounded-2xl bg-white/10 backdrop-blur" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)', gap: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
          <StepRow active={step >= 1} icon={<AlertTriangle />} text="Alert sent" />
          <StepRow active={step >= 2} icon={<PhoneCall />} text={`Calling ${primary?.name || 'primary contact'}...`} />
          <StepRow active={step >= 3} icon={<MessageSquare />} text={`Messages ${smsDone ? 'prepared' : 'pending'} to ${contacts?.length || 0} contacts`} />
          <StepRow active={step >= 4} icon={<MapPin />} text={`Location: ${location?.address || 'Fetching...'}`} />
          <StepRow active={step >= 5} icon={<CheckCircle2 />} text={logEntry ? 'Emergency logged' : 'Logging...'} />
          <StepRow active={step >= 6} icon={<CheckCircle2 />} text="Help is on the way" />
        </div>

        <div className="flex flex-wrap justify-center" style={{ gap: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
          <button
            type="button"
            onClick={shareWhatsApp}
            className="rounded-xl bg-green-500 font-black shadow-lg hover:brightness-110"
            style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1.125rem, 5vw, 1.25rem)', minHeight: '44px' }}
            disabled={!contacts?.length}
          >
            📱 Share via WhatsApp
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/20 font-black text-white ring-2 ring-white/60 hover:bg-white/30"
            style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1.125rem, 5vw, 1.25rem)', minHeight: '44px' }}
          >
            {React.cloneElement(<XCircle className="mr-2 inline" aria-hidden />, { style: { width: 'clamp(1.25rem, 5vw, 1.5rem)', height: 'clamp(1.25rem, 5vw, 1.5rem)' } })} Cancel (False Alarm)
          </button>
        </div>
      </div>
    </div>
  );
}

function StepRow({ active, icon, text }) {
  return (
    <div
      className={
        'flex items-center rounded-xl text-left font-semibold ' +
        (active ? 'bg-white/20' : 'bg-white/5 opacity-70')
      }
      style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}
    >
      <span className="text-emerald-200">{React.cloneElement(icon, { style: { width: 'clamp(1.25rem, 5vw, 1.5rem)', height: 'clamp(1.25rem, 5vw, 1.5rem)' } })}</span>
      <span>{text}</span>
    </div>
  );
}

