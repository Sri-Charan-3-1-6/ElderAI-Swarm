import { medicines as sampleSchedule } from '../data/medicineSchedule.js';

const KEY = {
  meds: 'medicineApp.medicines.v2',
  logs: 'medicineApp.dailyLogs.v1',
  contacts: 'medicineApp.contacts.v1',
  emergencyContacts: 'medicineApp.emergency.contacts.v1',
  emergencyLogs: 'medicineApp.emergency.logs.v1'
};

function safeParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function canUseStorage() {
  try {
    localStorage.setItem('__med_test__', '1');
    localStorage.removeItem('__med_test__');
    return true;
  } catch {
    return false;
  }
}

function normalizeMedicine(med) {
  const times = Array.isArray(med.times)
    ? med.times.filter(Boolean)
    : med.time
    ? [med.time]
    : [];

  return {
    id: med.id ?? Date.now(),
    name: typeof med.name === 'string' ? med.name : 'Medicine',
    instructions: typeof med.instructions === 'string' ? med.instructions : typeof med.purpose === 'string' ? med.purpose : '',
    times: [...new Set(times)].sort(),
    language: med.language || 'en-IN'
  };
}

function defaultMedicines() {
  const mapped = Array.isArray(sampleSchedule)
    ? Object.values(
        sampleSchedule.reduce((acc, item) => {
          const key = item.name || `med-${item.id}`;
          if (!acc[key]) {
            acc[key] = {
              id: item.id ?? Date.now() + Math.random(),
              name: item.name || 'Medicine',
              instructions: item.purpose || '',
              times: [],
              language: 'en-IN'
            };
          }
          if (item.time) acc[key].times.push(item.time);
          return acc;
        }, {})
      )
    : [];

  if (mapped.length) return mapped.map(normalizeMedicine);

  return [
    { id: 1, name: 'Amlodipine 5mg', instructions: 'Blood pressure', times: ['07:00'], language: 'en-IN' },
    { id: 2, name: 'Metformin 500mg', instructions: 'Diabetes control', times: ['07:00', '19:00'], language: 'en-IN' },
    { id: 3, name: 'Vitamin D3', instructions: 'Bone health', times: ['09:00'], language: 'en-IN' },
    { id: 4, name: 'Aspirin 75mg', instructions: 'Heart health', times: ['20:00'], language: 'en-IN' }
  ];
}

export function ensureSampleData(list) {
  const meds = Array.isArray(list) && list.length ? list.map(normalizeMedicine) : defaultMedicines();
  try {
    saveMedicines(meds);
  } catch {
    // ignore
  }
  return meds;
}

export function loadMedicines() {
  if (!canUseStorage()) return [];
  const raw = localStorage.getItem(KEY.meds);
  return raw ? safeParse(raw, []) : [];
}

export function saveMedicines(medicines) {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(KEY.meds, JSON.stringify(medicines));
  } catch {
    // ignore full storage
  }
}

export function loadDailyLogs() {
  if (!canUseStorage()) return {};
  const raw = localStorage.getItem(KEY.logs);
  return raw ? safeParse(raw, {}) : {};
}

export function saveDailyLog(logs) {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(KEY.logs, JSON.stringify(logs));
  } catch {
    // ignore
  }
}

export function loadContacts() {
  if (!canUseStorage()) return [];
  const raw = localStorage.getItem(KEY.contacts);
  const parsed = raw ? safeParse(raw, []) : [];
  if (Array.isArray(parsed) && parsed.length) return parsed;
  return [{ id: Date.now(), name: 'Family', phone: '' }];
}

export function saveContacts(list) {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(KEY.contacts, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function loadEmergencyContacts() {
  if (!canUseStorage()) return [];
  const raw = localStorage.getItem(KEY.emergencyContacts);
  const parsed = raw ? safeParse(raw, []) : [];
  const sorted = Array.isArray(parsed)
    ? parsed.sort((a, b) => (a.priority || '').localeCompare(b.priority || ''))
    : [];
  if (sorted.length) return sorted;
  return [
    { id: Date.now(), name: 'Family Primary', phone: '+91-0000000000', relation: 'Family', priority: 'Primary' }
  ];
}

export function saveEmergencyContacts(list) {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(KEY.emergencyContacts, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function loadEmergencyLogs() {
  if (!canUseStorage()) return [];
  const raw = localStorage.getItem(KEY.emergencyLogs);
  return raw ? safeParse(raw, []) : [];
}

export function saveEmergencyLogs(list) {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(KEY.emergencyLogs, JSON.stringify(list));
  } catch {
    // ignore
  }
}

