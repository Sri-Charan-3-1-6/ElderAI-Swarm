import { toast as toastFn } from './notificationUtils.js';

function safeString(v) {
  return typeof v === 'string' ? v : '';
}

export function normalizePhone(phone) {
  const raw = safeString(phone).trim();
  if (!raw) return '';
  // Keep leading +, digits only otherwise.
  const plus = raw.startsWith('+') ? '+' : '';
  const digits = raw.replace(/[^0-9]/g, '');
  return plus + digits;
}

export async function copyToClipboard(text) {
  const value = safeString(text);
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function startPhoneCall(phone, { label = 'Phone number', toast = toastFn } = {}) {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    toast?.({ title: 'Call', message: 'No phone number configured.', type: 'warning' });
    return false;
  }

  // Best-effort: on mobile this opens the dialer; on desktop it may be handled by a softphone.
  try {
    window.location.href = `tel:${normalized}`;
    toast?.({ title: 'Calling', message: `${label}: ${normalized}`, type: 'success' });
    return true;
  } catch {
    // fall through
  }

  // Fallback: copy number for manual dialing.
  copyToClipboard(normalized).then((ok) => {
    toast?.({ title: 'Call', message: ok ? `Copied ${label} to clipboard: ${normalized}` : `${label}: ${normalized}`, type: 'info' });
  });

  return false;
}

export function downloadTextFile(filename, text, mime = 'text/plain;charset=utf-8') {
  const name = safeString(filename) || 'download.txt';
  const blob = new Blob([safeString(text)], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    } catch (e) {
      reject(e);
    }
  });
}

export async function resizeImageDataUrl(dataUrl, { maxWidth = 1024, maxHeight = 1024, quality = 0.78, mime = 'image/jpeg' } = {}) {
  const img = new Image();
  const loaded = new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });
  img.src = dataUrl;
  await loaded;

  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return dataUrl;

  const scale = Math.min(1, maxWidth / w, maxHeight / h);
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, tw, th);
  return canvas.toDataURL(mime, quality);
}

export async function fileToResizedDataUrl(file, opts) {
  const dataUrl = await fileToDataUrl(file);
  return resizeImageDataUrl(dataUrl, opts);
}

function icsEscape(value) {
  return safeString(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function toIcsDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

export function downloadIcsFile(filename, { title, startISO, endISO, description = '', location = '' }) {
  const uid = `elderai-${Date.now()}@local`;
  const dtstamp = toIcsDate(new Date().toISOString());
  const dtstart = toIcsDate(startISO);
  const dtend = toIcsDate(endISO);

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ElderAI Swarm//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${icsEscape(title)}`,
    description ? `DESCRIPTION:${icsEscape(description)}` : null,
    location ? `LOCATION:${icsEscape(location)}` : null,
    'END:VEVENT',
    'END:VCALENDAR'
  ]
    .filter(Boolean)
    .join('\r\n');

  downloadTextFile(filename || 'event.ics', ics, 'text/calendar;charset=utf-8');
}
