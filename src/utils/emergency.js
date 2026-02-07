const CONTACT_KEY = 'medicineApp.emergency.contacts.v1';
const LOG_KEY = 'medicineApp.emergency.logs.v1';
const PRIORITY_ORDER = ['Primary', 'Secondary', 'Tertiary', 'Other'];

function safeParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function canUseStorage() {
  try {
    localStorage.setItem('__emerg_test__', '1');
    localStorage.removeItem('__emerg_test__');
    return true;
  } catch {
    return false;
  }
}

export function validatePhone(phone) {
  const cleaned = (phone || '').trim();
  return /^\+?[0-9][0-9\-\s]{7,}$/.test(cleaned);
}

function normalizeContact(contact, idx = 0) {
  const name = typeof contact?.name === 'string' && contact.name.trim() ? contact.name.trim() : 'Emergency Contact';
  const phone = typeof contact?.phone === 'string' ? contact.phone.trim() : '';
  const relation = typeof contact?.relation === 'string' ? contact.relation.trim() : '';
  const priority = PRIORITY_ORDER.includes(contact?.priority) ? contact.priority : PRIORITY_ORDER[Math.min(idx, PRIORITY_ORDER.length - 1)] || 'Primary';
  return {
    id: contact?.id ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    name,
    phone,
    relation,
    priority
  };
}

function sortContacts(list) {
  const order = PRIORITY_ORDER;
  return [...list].sort((a, b) => order.indexOf(a.priority || 'Other') - order.indexOf(b.priority || 'Other'));
}

export function loadEmergencyContacts() {
  if (!canUseStorage()) return [];
  const raw = localStorage.getItem(CONTACT_KEY);
  const parsed = raw ? safeParse(raw, []) : [];
  const normalized = Array.isArray(parsed) ? parsed.map(normalizeContact) : [];
  if (normalized.length) return sortContacts(normalized);
  const defaults = [
    { name: 'Family Primary', phone: '+91-0000000000', relation: 'Family', priority: 'Primary' },
    { name: 'Family Secondary', phone: '+91-0000000001', relation: 'Family', priority: 'Secondary' }
  ].map(normalizeContact);
  saveEmergencyContacts(defaults);
  return defaults;
}

export function saveEmergencyContacts(list) {
  if (!canUseStorage()) return;
  const normalized = Array.isArray(list) ? list.map(normalizeContact) : [];
  localStorage.setItem(CONTACT_KEY, JSON.stringify(sortContacts(normalized)));
}

export function getPrimaryContact(contacts) {
  return sortContacts(contacts || [])[0] || null;
}

export function buildEmergencyMessage({ name = 'Grandma', address = 'Location pending', time = new Date(), locationUrl } = {}) {
  const ts = time instanceof Date ? time : new Date(time);
  const timeStr = ts.toLocaleString();
  const locPart = address || 'Location pending';
  const link = locationUrl ? ` Map: ${locationUrl}` : '';
  return `EMERGENCY! ${name} needs help. Location: ${locPart}. Time: ${timeStr}. Please call immediately!${link}`;
}

export function buildSmsHref(phone, message) {
  const target = (phone || '').trim();
  return target ? `sms:${target}?body=${encodeURIComponent(message)}` : null;
}

export function buildWhatsAppHref(phone, message) {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function loadEmergencyLogs() {
  if (!canUseStorage()) return [];
  const raw = localStorage.getItem(LOG_KEY);
  const parsed = raw ? safeParse(raw, []) : [];
  return Array.isArray(parsed) ? parsed : [];
}

export function saveEmergencyLogs(logs) {
  if (!canUseStorage()) return;
  localStorage.setItem(LOG_KEY, JSON.stringify(Array.isArray(logs) ? logs : []));
}

export function logEmergency(entry) {
  const logs = loadEmergencyLogs();
  const log = {
    id: entry?.id ?? Date.now(),
    createdAt: new Date().toISOString(),
    type: entry?.type || 'Manual Emergency Button',
    testMode: Boolean(entry?.testMode),
    contacts: entry?.contacts || [],
    smsSentTo: entry?.smsSentTo || [],
    location: entry?.location || null,
    responseMs: entry?.responseMs ?? null,
    resolved: Boolean(entry?.resolved),
    notes: entry?.notes || ''
  };
  const next = [log, ...logs].slice(0, 50);
  saveEmergencyLogs(next);
  return log;
}

export function markEmergencyResolved(id, resolved = true) {
  const logs = loadEmergencyLogs();
  const next = logs.map((log) => (log.id === id ? { ...log, resolved } : log));
  saveEmergencyLogs(next);
  return next;
}

export function updateEmergencyNotes(id, notes) {
  const logs = loadEmergencyLogs();
  const next = logs.map((log) => (log.id === id ? { ...log, notes } : log));
  saveEmergencyLogs(next);
  return next;
}

