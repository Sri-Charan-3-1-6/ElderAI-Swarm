import { getItem, setItem, storageKeys } from './storageUtils.js';
import { toast, notifyBrowser } from './notificationUtils.js';

const STEPS = [
  { t: 1000, text: 'Detecting fall…' },
  { t: 2000, text: 'Calling emergency contact…' },
  { t: 3000, text: 'Booking ambulance…' },
  { t: 4000, text: 'Alerting nearest hospital…' },
  { t: 5000, text: 'Sending location…' },
  { t: 6000, text: 'Help is on the way!' }
];

export function createEmergencyIncident({ type = 'Fall', source = 'Manual', notes = '' } = {}) {
  const startedAt = new Date();
  return {
    id: `e_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    type,
    source,
    status: 'active',
    startedAtISO: startedAt.toISOString(),
    resolvedAtISO: null,
    etaMinutes: 8,
    hospital: 'Nearest hospital',
    distanceKm: 2.3,
    location: {
      address: '123 MG Road, Chennai, Tamil Nadu',
      coordinates: { lat: 13.0827, lng: 80.2707 }
    },
    timeline: [{ atMs: 0, label: '🚨 EMERGENCY DETECTED' }],
    notes
  };
}

export function logEmergency(incident) {
  const list = getItem(storageKeys.emergencies, []);
  const idx = (list ?? []).findIndex((e) => e?.id === incident?.id);
  let next;
  if (idx >= 0) {
    next = [...list];
    next[idx] = incident;
  } else {
    next = [incident, ...list];
  }
  next = next.slice(0, 20);
  setItem(storageKeys.emergencies, next);
}

export function setEmergencyResolved(id) {
  const list = getItem(storageKeys.emergencies, []);
  const next = list.map((e) => (e.id === id ? { ...e, status: 'resolved', resolvedAtISO: new Date().toISOString() } : e));
  setItem(storageKeys.emergencies, next);
}

export function runEmergencySequence(incident, onUpdate) {
  // Emits updates without external APIs.
  toast({ title: 'Emergency activated', message: 'Emergency Responder is running actions now.', type: 'danger' });
  notifyBrowser('Emergency activated', { body: 'Emergency Responder is running actions now.' });

  let cancelled = false;

  const timers = STEPS.map((step) =>
    window.setTimeout(() => {
      if (cancelled) return;
      incident.timeline = [...incident.timeline, { atMs: step.t, label: step.text }];
      onUpdate?.({ ...incident });

      // persist periodically
      logEmergency({ ...incident });

      if (step.text === 'Help is on the way!') {
        const resolved = { ...incident, status: 'resolved', resolvedAtISO: new Date().toISOString() };
        logEmergency(resolved);
        onUpdate?.(resolved);
        toast({ title: 'Help is on the way', message: 'Emergency sequence completed.', type: 'success' });
        notifyBrowser('Help is on the way', { body: 'Emergency sequence completed.' });
      }
    }, step.t)
  );

  return {
    cancel() {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    }
  };
}

export function buildStaticMapDataUri({ label = 'Home', nearest = 'Nearest hospital' } = {}) {
  // Self-contained inline SVG (no network)
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="900" height="300" viewBox="0 0 900 300">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#e2e8f0" />
        <stop offset="1" stop-color="#f8fafc" />
      </linearGradient>
    </defs>
    <rect width="900" height="300" fill="url(#g)" />
    <g opacity="0.85">
      <path d="M40 70 H860" stroke="#cbd5e1" stroke-width="4" />
      <path d="M90 200 H820" stroke="#cbd5e1" stroke-width="6" />
      <path d="M190 40 V260" stroke="#cbd5e1" stroke-width="4" />
      <path d="M650 30 V270" stroke="#cbd5e1" stroke-width="4" />
    </g>
    <g>
      <circle cx="520" cy="150" r="16" fill="#ef4444" />
      <circle cx="520" cy="150" r="30" fill="none" stroke="#ef4444" stroke-width="4" opacity="0.25" />
      <text x="545" y="155" font-family="Inter, system-ui" font-size="16" fill="#0f172a">${label}</text>
      <rect x="60" y="220" width="260" height="44" rx="10" fill="#ffffff" opacity="0.9" />
      <text x="80" y="248" font-family="Inter, system-ui" font-size="16" fill="#0f172a">${nearest}</text>
    </g>
  </svg>`;

  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');

  return `data:image/svg+xml,${encoded}`;
}
