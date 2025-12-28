import { elderProfile } from '../data/elderProfile.js';
import { medicines } from '../data/medicineSchedule.js';
import { demoActivities, demoActivityHistory, demoAppointments, demoTasks, preloadedChat } from '../data/activities.js';
import { buildInitialHealthState } from './healthSimulator.js';

const KEY = {
  profile: 'elderai.profile.v1',
  medicines: 'elderai.medicines.v1',
  activities: 'elderai.activities.v1',
  activityHistory: 'elderai.activityHistory.v1',
  chat: 'elderai.chat.v1',
  health: 'elderai.health.v1',
  emergencies: 'elderai.emergencies.v1',
  appointments: 'elderai.appointments.v1',
  tasks: 'elderai.tasks.v1',
  appStatus: 'elderai.appStatus.v1'
};

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function canUseLocalStorage() {
  try {
    const testKey = '__elderai_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function emitLocal(eventName, detail) {
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

export function subscribe(key, handler) {
  const eventName = `elderai:${key}`;
  const listener = (e) => handler(e.detail);
  window.addEventListener(eventName, listener);

  const onStorage = (e) => {
    if (e?.key !== key) return;
    if (e.newValue == null) {
      handler(getItem(key, undefined));
      return;
    }
    handler(safeParse(e.newValue, undefined));
  };
  window.addEventListener('storage', onStorage);

  let bc;
  const onMessage = (ev) => {
    const data = ev?.data;
    if (!data || data.key !== key) return;
    handler(getItem(key, undefined));
  };
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('elderai:storage');
      bc.addEventListener('message', onMessage);
    }
  } catch {
    // ignore
  }

  return () => {
    window.removeEventListener(eventName, listener);
    window.removeEventListener('storage', onStorage);
    try {
      bc?.removeEventListener?.('message', onMessage);
      bc?.close?.();
    } catch {
      // ignore
    }
  };
}

export function getItem(key, fallback) {
  if (!canUseLocalStorage()) return fallback;
  const raw = localStorage.getItem(key);
  if (raw == null) return fallback;
  return safeParse(raw, fallback);
}

export function setItem(key, value) {
  if (!canUseLocalStorage()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    emitLocal(`elderai:${key}`, value);
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('elderai:storage');
        bc.postMessage({ key });
        bc.close();
      }
    } catch {
      // ignore
    }
  } catch {
    // Storage full or blocked: trim large lists and retry once.
    try {
      if (key === KEY.chat) {
        const trimmed = Array.isArray(value) ? value.slice(-100) : value;
        localStorage.setItem(key, JSON.stringify(trimmed));
        emitLocal(`elderai:${key}`, trimmed);
        return;
      }
      if (key === KEY.activityHistory) {
        const trimmed = Array.isArray(value) ? value.slice(-200) : value;
        localStorage.setItem(key, JSON.stringify(trimmed));
        emitLocal(`elderai:${key}`, trimmed);
        return;
      }
    } catch {
      // Give up silently to avoid console noise.
    }
  }
}

function normalizeProfile(profile) {
  const p = profile && typeof profile === 'object' ? profile : {};

  const next = {
    name: typeof p.name === 'string' && p.name.trim() ? p.name.trim() : 'Elder User',
    age: Number.isFinite(Number(p.age)) ? Number(p.age) : 70,
    language: typeof p.language === 'string' && p.language.trim() ? p.language.trim() : 'English',
    location: {
      address: typeof p.location?.address === 'string' ? p.location.address : 'Address not set',
      coordinates: {
        lat: Number.isFinite(Number(p.location?.coordinates?.lat)) ? Number(p.location.coordinates.lat) : 0,
        lng: Number.isFinite(Number(p.location?.coordinates?.lng)) ? Number(p.location.coordinates.lng) : 0
      },
      lastUpdatedISO: typeof p.location?.lastUpdatedISO === 'string' ? p.location.lastUpdatedISO : null,
      accuracyM: Number.isFinite(Number(p.location?.accuracyM)) ? Number(p.location.accuracyM) : null,
      trackingEnabled: Boolean(p.location?.trackingEnabled)
    },
    medicalHistory: Array.isArray(p.medicalHistory) ? p.medicalHistory : [],
    allergies: Array.isArray(p.allergies) ? p.allergies : [],
    contacts: Array.isArray(p.contacts) ? p.contacts : []
  };

  // Back-compat: migrate single emergencyContact field into contacts.
  if (!next.contacts.length && p.emergencyContact && typeof p.emergencyContact === 'object') {
    next.contacts = [
      {
        id: `c_${Date.now()}`,
        name: typeof p.emergencyContact.name === 'string' ? p.emergencyContact.name : 'Emergency Contact',
        relation: typeof p.emergencyContact.relation === 'string' ? p.emergencyContact.relation : 'Family',
        phone: typeof p.emergencyContact.phone === 'string' ? p.emergencyContact.phone : '',
        role: 'family',
        isEmergency: true
      }
    ];
  }

  // Ensure at least one contact record exists.
  if (!next.contacts.length) {
    next.contacts = [
      {
        id: `c_${Date.now()}`,
        name: 'Family Contact',
        relation: 'Family',
        phone: '',
        role: 'family',
        isEmergency: true
      }
    ];
  }

  // Normalize contact shapes.
  next.contacts = next.contacts
    .filter((c) => c && typeof c === 'object')
    .map((c) => ({
      id: typeof c.id === 'string' && c.id ? c.id : `c_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      name: typeof c.name === 'string' ? c.name : 'Contact',
      relation: typeof c.relation === 'string' ? c.relation : '',
      phone: typeof c.phone === 'string' ? c.phone : '',
      role: typeof c.role === 'string' ? c.role : 'family',
      isEmergency: Boolean(c.isEmergency)
    }));

  return next;
}

export function initDemoDataIfNeeded() {
  if (!canUseLocalStorage()) return;

  const existing = getItem(KEY.profile, null);
  if (existing) {
    // Keep user data, but migrate to the latest shape.
    const migrated = normalizeProfile(existing);
    setItem(KEY.profile, migrated);
    return;
  }

  setItem(KEY.profile, normalizeProfile(elderProfile));
  setItem(KEY.medicines, medicines);
  setItem(KEY.activities, demoActivities);
  setItem(KEY.activityHistory, demoActivityHistory);
  setItem(KEY.chat, preloadedChat);
  setItem(KEY.health, buildInitialHealthState());
  setItem(KEY.emergencies, []);
  setItem(KEY.appointments, demoAppointments);
  setItem(KEY.tasks, demoTasks);
  setItem(KEY.appStatus, { online: true, lastActiveISO: new Date().toISOString() });
}

export const storageKeys = KEY;

export function updateProfile(updater) {
  const cur = getItem(KEY.profile, null);
  const nextRaw = typeof updater === 'function' ? updater(cur) : updater;
  const next = normalizeProfile(nextRaw);
  setItem(KEY.profile, next);
  return next;
}

export function touchLastActive() {
  const s = getItem(KEY.appStatus, { online: true, lastActiveISO: new Date().toISOString() });
  const next = { ...s, online: true, lastActiveISO: new Date().toISOString() };
  setItem(KEY.appStatus, next);
}

export function setOnline(online) {
  const s = getItem(KEY.appStatus, { online: true, lastActiveISO: new Date().toISOString() });
  setItem(KEY.appStatus, { ...s, online });
}

export function appendActivity(activity) {
  const list = getItem(KEY.activities, []);
  const next = [{ ...activity }, ...list].slice(0, 50);
  setItem(KEY.activities, next);

  const history = getItem(KEY.activityHistory, []);
  const nextHistory = [{ ...activity }, ...history].slice(0, 300);
  setItem(KEY.activityHistory, nextHistory);
}

export function appendChatMessage(message) {
  const list = getItem(KEY.chat, []);
  const next = [...list, { ...message }].slice(-150);
  setItem(KEY.chat, next);
}

export function updateMedicines(updater) {
  const list = getItem(KEY.medicines, []);
  const next = typeof updater === 'function' ? updater(list) : updater;
  setItem(KEY.medicines, next);
  return next;
}

export function updateHealth(updater) {
  const cur = getItem(KEY.health, null);
  const next = typeof updater === 'function' ? updater(cur) : updater;
  setItem(KEY.health, next);
  return next;
}

export function addEmergency(incident) {
  const list = getItem(KEY.emergencies, []);
  const idx = (list ?? []).findIndex((e) => e?.id === incident?.id);
  let next;
  if (idx >= 0) {
    next = [...list];
    next[idx] = incident;
  } else {
    next = [incident, ...list];
  }
  next = next.slice(0, 20);
  setItem(KEY.emergencies, next);
  return next;
}
