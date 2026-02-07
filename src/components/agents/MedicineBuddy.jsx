import React, { useEffect, useMemo, useState } from 'react';
import { Camera, CheckCircle2, Clock, Pencil, Pill, Plus, Trash2, Upload, XCircle } from 'lucide-react';
import { getItem, storageKeys, subscribe, updateMedicines, appendActivity } from '../../utils/storageUtils.js';
import { toast, notifyBrowser } from '../../utils/notificationUtils.js';
import { speak } from '../../utils/speechUtils.js';
import { fileToResizedDataUrl } from '../../utils/deviceActions.js';
import { useI18n } from '../../i18n/i18n.js';
import PrescriptionScanner from '../medicine/PrescriptionScanner.jsx';

function parseTimeToTodayISO(timeHHMM) {
  const [hh, mm] = timeHHMM.split(':').map((x) => Number(x));
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

function minutesUntil(timeHHMM) {
  const target = new Date(parseTimeToTodayISO(timeHHMM)).getTime();
  const now = Date.now();
  return Math.round((target - now) / 60000);
}

function statusForMed(m) {
  const mins = minutesUntil(m.time);
  if (m.taken) return 'taken';
  if (mins < -60) return 'missed';
  if (mins <= 30) return 'due';
  return 'pending';
}

const DEFAULT_TIMES = {
  morning: '08:00',
  afternoon: '13:00',
  evening: '20:00',
  bedtime: '22:00',
  beforeBreakfast: '07:00',
  afterBreakfast: '08:30',
  beforeLunch: '12:30',
  afterLunch: '13:30',
  beforeDinner: '19:00',
  afterDinner: '20:30'
};

function normalizeLine(line) {
  return String(line || '').replace(/\s+/g, ' ').trim();
}

function detectMealTiming(line) {
  const src = line.toLowerCase();
  if (/before\s*(food|meal|breakfast|lunch|dinner)|\b(ac|bf)\b/.test(src)) return 'before';
  if (/after\s*(food|meal|breakfast|lunch|dinner)|\b(pc|af)\b/.test(src)) return 'after';
  return '';
}

function detectDosePattern(line) {
  const match = line.match(/\b([01])\s*[-/\s]\s*([01])\s*[-/\s]\s*([01])\b/);
  if (!match) return null;
  const [m, a, e] = match.slice(1).map((n) => Number(n));
  return { morning: m, afternoon: a, evening: e };
}

function detectFrequency(line) {
  const src = line.toLowerCase();
  if (/\bqid\b|four\s*times|4\s*times/.test(src)) return 4;
  if (/\btid\b|thrice|3\s*times/.test(src)) return 3;
  if (/\bbd\b|twice|2\s*times/.test(src)) return 2;
  if (/\bod\b|once\s*daily|1\s*time/.test(src)) return 1;
  return null;
}

function extractMedName(line) {
  const cleaned = normalizeLine(line)
    .replace(/\b(\d+(\.\d+)?\s*(mg|ml|mcg|g|iu|tab|tabs|tablet|tablets|cap|caps|capsule|syrup|drop|drops))\b/gi, ' ')
    .replace(/\b(od|bd|tid|qid|hs|sos|ac|pc|before|after|morning|noon|evening|night|bedtime|daily|once|twice|thrice|times)\b/gi, ' ')
    .replace(/[\d\-\/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  const parts = cleaned.split(' ').filter(Boolean);
  return parts.slice(0, 3).join(' ');
}

function buildTimesFromPattern(pattern, mealTiming) {
  const times = [];
  if (pattern.morning) times.push(mealTiming === 'before' ? DEFAULT_TIMES.beforeBreakfast : mealTiming === 'after' ? DEFAULT_TIMES.afterBreakfast : DEFAULT_TIMES.morning);
  if (pattern.afternoon) times.push(mealTiming === 'before' ? DEFAULT_TIMES.beforeLunch : mealTiming === 'after' ? DEFAULT_TIMES.afterLunch : DEFAULT_TIMES.afternoon);
  if (pattern.evening) times.push(mealTiming === 'before' ? DEFAULT_TIMES.beforeDinner : mealTiming === 'after' ? DEFAULT_TIMES.afterDinner : DEFAULT_TIMES.evening);
  return times;
}

function buildTimesFromFrequency(freq, mealTiming) {
  if (freq === 4) {
    return [DEFAULT_TIMES.morning, DEFAULT_TIMES.afternoon, DEFAULT_TIMES.evening, DEFAULT_TIMES.bedtime];
  }
  if (freq === 3) {
    return buildTimesFromPattern({ morning: 1, afternoon: 1, evening: 1 }, mealTiming);
  }
  if (freq === 2) {
    return buildTimesFromPattern({ morning: 1, afternoon: 0, evening: 1 }, mealTiming);
  }
  if (freq === 1) {
    return [mealTiming === 'before' ? DEFAULT_TIMES.beforeBreakfast : mealTiming === 'after' ? DEFAULT_TIMES.afterBreakfast : DEFAULT_TIMES.morning];
  }
  return [];
}

function parsePrescriptionText(rawText) {
  const text = String(rawText || '').trim();
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean);

  const meds = [];

  lines.forEach((line) => {
    const isCandidate = /(tab|tablet|cap|capsule|syrup|inj|drop|drops|mg|ml|mcg|g|od|bd|tid|qid|sos|before|after|morning|night|bedtime|\b[01]\s*[-/]\s*[01]\s*[-/]\s*[01]\b)/i.test(line);
    if (!isCandidate) return;

    const name = extractMedName(line);
    if (!name) return;

    const mealTiming = detectMealTiming(line);
    const pattern = detectDosePattern(line);
    const freq = detectFrequency(line);
    let times = [];
    if (pattern) times = buildTimesFromPattern(pattern, mealTiming);
    if (!times.length && freq) times = buildTimesFromFrequency(freq, mealTiming);

    if (!times.length) {
      if (/night|bedtime|hs/i.test(line)) times = [DEFAULT_TIMES.bedtime];
      else if (/morning/i.test(line)) times = [DEFAULT_TIMES.morning];
      else if (/noon|afternoon/i.test(line)) times = [DEFAULT_TIMES.afternoon];
      else if (/evening/i.test(line)) times = [DEFAULT_TIMES.evening];
      else times = [mealTiming === 'before' ? DEFAULT_TIMES.beforeBreakfast : mealTiming === 'after' ? DEFAULT_TIMES.afterBreakfast : DEFAULT_TIMES.morning];
    }

    const instructions = mealTiming === 'before' ? 'Before food' : mealTiming === 'after' ? 'After food' : '';
    meds.push({
      name,
      times,
      purpose: '',
      instructions,
      mealTiming
    });
  });

  return meds;
}

export default function MedicineBuddy() {
  const { ta } = useI18n();
  const [meds, setMeds] = useState(() => getItem(storageKeys.medicines, []));
  const [nowTick, setNowTick] = useState(Date.now());

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ time: '07:00', name: '', purpose: '', instructions: '', sideEffects: '', refillCount: '', photoDataUrl: '' });
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [parsedMeds, setParsedMeds] = useState([]);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => subscribe(storageKeys.medicines, setMeds), []);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Real reminders: notify when medicine becomes due.
  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      updateMedicines((list) => {
        const next = (list ?? []).map((m) => {
          if (m?.taken) return m;
          const mins = minutesUntil(m.time);
          const last = m.lastNotifiedAtISO ? new Date(m.lastNotifiedAtISO).getTime() : 0;
          const recentlyNotified = last && now - last < 10 * 60 * 1000;
          if (mins <= 0 && mins >= -30 && !recentlyNotified) {
            const msg = ta(`Hello! It's time to take ${m.name}. Please take it now.`);
            toast({ title: ta('Medicine reminder'), message: msg, type: 'warning' });
            notifyBrowser(ta('Medicine reminder'), { body: msg });
            speak(msg, { rate: 0.8 });
            appendActivity({ id: `act_${Date.now()}`, type: 'medicine', title: ta('Medicine reminder'), ts: new Date().toISOString(), detail: m.name });
            return { ...m, lastNotifiedAtISO: new Date().toISOString() };
          }
          return m;
        });
        return next;
      });
    }, 30 * 1000);
    return () => window.clearInterval(id);
  }, [ta]);

  const nextDue = useMemo(() => {
    const pending = meds.filter((m) => !m.taken);
    const sorted = [...pending].sort((a, b) => minutesUntil(a.time) - minutesUntil(b.time));
    return sorted[0] ?? null;
  }, [meds, nowTick]);

  const compliance = useMemo(() => {
    if (!meds.length) return 0;
    const taken = meds.filter((m) => m.taken).length;
    return Math.round((taken / meds.length) * 100);
  }, [meds]);

  const markTaken = (id) => {
    const updated = updateMedicines((list) => list.map((m) => (m.id === id ? { ...m, taken: true } : m)));
    const med = updated.find((m) => m.id === id);
    appendActivity({
      id: `act_${Date.now()}`,
      type: 'medicine',
      title: ta(`${med?.name ?? ta('Medicine')} taken`),
      ts: new Date().toISOString(),
      detail: ta('Marked as taken.')
    });
    toast({ title: ta('Medicine updated'), message: ta('Marked as taken.'), type: 'success' });
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ time: '07:00', name: '', purpose: '', instructions: '', sideEffects: '', refillCount: '', photoDataUrl: '' });
    setOcrText('');
    setParsedMeds([]);
    setEditorOpen(true);
  };

  const openEdit = (m) => {
    setEditingId(m.id);
    setForm({
      time: m.time || '07:00',
      name: m.name || '',
      purpose: m.purpose || '',
      instructions: m.instructions || '',
      sideEffects: m.sideEffects || '',
      refillCount: m.refillCount ?? '',
      photoDataUrl: m.photoDataUrl || ''
    });
    setOcrText('');
    setParsedMeds([]);
    setEditorOpen(true);
  };

  const saveMedicine = () => {
    const payload = {
      id: editingId || `med_${Date.now()}`,
      time: String(form.time || '').trim(),
      name: String(form.name || '').trim(),
      purpose: String(form.purpose || '').trim(),
      instructions: String(form.instructions || '').trim(),
      sideEffects: String(form.sideEffects || '').trim(),
      refillCount: form.refillCount === '' ? null : Number(form.refillCount),
      photoDataUrl: form.photoDataUrl || '',
      taken: false
    };

    if (!payload.time || !payload.name) {
      toast({ title: ta('Missing info'), message: ta('Please enter at least time and medicine name.'), type: 'warning' });
      return;
    }

    updateMedicines((list) => {
      const cur = list ?? [];
      const idx = cur.findIndex((m) => m.id === payload.id);
      if (idx >= 0) {
        const next = [...cur];
        next[idx] = { ...cur[idx], ...payload };
        return next;
      }
      return [payload, ...cur];
    });

    appendActivity({ id: `act_${Date.now()}`, type: 'medicine', title: editingId ? ta('Medicine updated') : ta('Medicine added'), ts: new Date().toISOString(), detail: payload.name });
    toast({ title: ta('Saved'), message: ta('Medicine saved locally.'), type: 'success' });
    setEditorOpen(false);
  };

  const deleteMedicine = (id) => {
    updateMedicines((list) => (list ?? []).filter((m) => m.id !== id));
    appendActivity({ id: `act_${Date.now()}`, type: 'medicine', title: ta('Medicine removed'), ts: new Date().toISOString(), detail: id });
    toast({ title: ta('Removed'), message: ta('Medicine removed.'), type: 'info' });
  };

  const attachPhotoFromFile = async (file) => {
    try {
      const dataUrl = await fileToResizedDataUrl(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.78, mime: 'image/jpeg' });
      setForm((s) => ({ ...s, photoDataUrl: dataUrl }));
      setOcrText('');
      setParsedMeds([]);
      toast({ title: ta('Photo added'), message: ta('Saved locally with this medicine.'), type: 'success' });
    } catch {
      toast({ title: ta('Camera'), message: ta('Could not read that image.'), type: 'warning' });
    }
  };

  const extractTextFromImage = async () => {
    if (!form.photoDataUrl) {
      toast({ title: ta('OCR'), message: ta('Add a photo first.'), type: 'info' });
      return '';
    }
    setOcrBusy(true);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const res = await worker.recognize(form.photoDataUrl);
      await worker.terminate();
      const text = String(res?.data?.text || '').trim();
      return text;
    } catch {
      toast({ title: ta('OCR'), message: ta('OCR failed in this browser. You can still type manually.'), type: 'warning' });
      return '';
    } finally {
      setOcrBusy(false);
    }
  };

  const runOcrFillForm = async () => {
    const text = await extractTextFromImage();
    if (!text) {
      toast({ title: ta('OCR'), message: ta('No readable text found. You can type manually.'), type: 'warning' });
      return;
    }

    setOcrText(text);
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const first = lines[0] || '';
    setForm((s) => ({
      ...s,
      name: s.name || first.slice(0, 60),
      purpose: s.purpose || (lines.find((l) => /bp|pressure|sugar|diabetes|pain|fever|cold|cough/i.test(l)) || '')
    }));
    toast({ title: ta('OCR complete'), message: ta('Filled what I could. Please verify.'), type: 'success' });
  };

  const scanPrescription = async () => {
    const text = await extractTextFromImage();
    if (!text) {
      toast({ title: ta('Prescription scan'), message: ta('No readable text found. Please try a clearer image.'), type: 'warning' });
      return;
    }
    setOcrText(text);
    const parsed = parsePrescriptionText(text);
    setParsedMeds(parsed);
    if (!parsed.length) {
      toast({ title: ta('Prescription scan'), message: ta('I could not confidently extract medicines. You can edit manually.'), type: 'warning' });
      return;
    }
    toast({ title: ta('Prescription scan'), message: ta('Medicines extracted. Review and add to schedule.'), type: 'success' });
  };

  const addParsedToSchedule = () => {
    if (!parsedMeds.length) {
      toast({ title: ta('Prescription'), message: ta('Nothing to add yet.'), type: 'info' });
      return;
    }
    updateMedicines((list) => {
      const cur = list ?? [];
      const next = [...cur];
      parsedMeds.forEach((med) => {
        (med.times || []).forEach((time) => {
          next.unshift({
            id: `med_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            time,
            name: med.name,
            purpose: med.purpose || '',
            instructions: med.instructions || '',
            sideEffects: '',
            refillCount: null,
            photoDataUrl: form.photoDataUrl || '',
            taken: false,
            mealTiming: med.mealTiming || ''
          });
        });
      });
      return next;
    });
    appendActivity({ id: `act_${Date.now()}`, type: 'medicine', title: ta('Prescription added'), ts: new Date().toISOString(), detail: ta('Auto-added medicines from prescription.') });
    toast({ title: ta('Prescription added'), message: ta('Medicines added to today’s schedule.'), type: 'success' });
    setEditorOpen(false);
  };

  const countdownText = useMemo(() => {
    if (!nextDue) return ta('All medicines done for now.');
    const mins = minutesUntil(nextDue.time);
    if (mins <= 0) return ta(`Next reminder: now (${nextDue.time})`);
    return ta(`Next reminder in ${mins} min (${nextDue.time})`);
  }, [nextDue, nowTick]);

  return (
    <div className="space-y-6">
      {/* Prescription Scanner Button */}
      <button 
        onClick={() => setShowScanner(true)} 
        style={{
          width: '100%',
          padding: 'clamp(1rem, 4vw, 1.25rem)',
          fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
          backgroundColor: '#6f42c1',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          marginBottom: 'clamp(1rem, 3vw, 1.25rem)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(0.625rem, 2vw, 0.75rem)',
          boxShadow: '0 4px 15px rgba(111, 66, 193, 0.3)',
          fontWeight: 'bold',
          transition: 'transform 0.2s',
          minHeight: '44px'
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        📷 {ta('Scan Prescription')}
      </button>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">{ta('Medicine Buddy')}</h2>
          <p className="mt-1 text-slate-600">{ta('Schedule, reminders, compliance and voice prompts (offline-first).')}</p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-extrabold text-white shadow-card transition hover:brightness-110"
          onClick={openAdd}
          aria-label={ta('Add medicine')}
        >
          <Plus aria-hidden="true" /> {ta('Add Medicine')}
        </button>
        <div className="rounded-card bg-white shadow-card p-4 border-2 border-slate-700">
          <div className="text-xs font-semibold text-slate-500">{ta('Compliance score')}</div>
          <div className="mt-1 text-3xl font-extrabold">{compliance}%</div>
          <div className="mt-1 text-sm text-slate-600">{ta("Based on today’s schedule")}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 'clamp(1rem, 3vw, 1.5rem)' }}>
        <div className="rounded-card bg-white shadow-card border-2 border-slate-700 lg:col-span-2" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
          <h3 className="font-bold" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta("Today's Schedule")}</h3>
          <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
            {meds.map((m) => {
              const st = statusForMed(m);
              return (
                <div key={m.id} className="rounded-xl border border-slate-200 bg-white" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
                    <div>
                      <div className="font-extrabold tracking-tight" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>{m.time}</div>
                      <div className="mt-1 font-bold" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{m.name}</div>
                      <div className="text-slate-600" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Purpose')}: {m.purpose}</div>
                    </div>
                    <div className="flex flex-col sm:items-end" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
                      <StatusPill status={st} />
                      {!m.taken ? (
                        <button
                          className="inline-flex items-center justify-center rounded-lg bg-primary font-bold text-white transition hover:brightness-110 focus:outline-none"
                          style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.75rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 3.5vw, 1rem)', minHeight: '44px' }}
                          onClick={() => markTaken(m.id)}
                          aria-label={ta(`Mark ${m.name} as taken`)}
                        >
                          {ta('Mark as Taken')}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 3vw, 1.5rem)' }}>
          <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
            <h3 className="font-bold" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('Reminder System')}</h3>
            <div className="mt-3 rounded-xl bg-white border border-slate-600" style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
              <div className="font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{ta('Next reminder')}</div>
              <div className="mt-1 font-semibold text-slate-800" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{countdownText}</div>
            </div>
            <div className="mt-3 text-slate-600" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Reminders trigger automatically when a medicine is due.')}</div>
          </div>

          <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
            <h3 className="font-bold" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{ta('Medicine Details')}</h3>
            <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
              {meds.map((m) => (
                <div key={`d_${m.id}`} className="rounded-xl bg-white border border-slate-600 shadow" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
                  <div className="flex items-start justify-between" style={{ gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
                    <div className="flex items-start" style={{ gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
                    <div className="flex items-center justify-center rounded-xl bg-white border border-slate-600 text-slate-700 shadow" style={{ width: 'clamp(2.75rem, 9vw, 3rem)', height: 'clamp(2.75rem, 9vw, 3rem)' }}>
                      {React.cloneElement(<Pill />, { 'aria-hidden': true, style: { width: '60%', height: '60%' } })}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>{m.name}</div>
                      <div className="text-slate-600" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Purpose')}: {m.purpose}</div>
                      {m.instructions ? <div className="mt-1 text-slate-600" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Instructions')}: {m.instructions}</div> : null}
                      {m.sideEffects ? <div className="text-slate-600" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Side effects')}: {m.sideEffects}</div> : null}
                      {Number.isFinite(m.refillCount) ? <div className="mt-1 font-semibold text-slate-800" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Refill')}: {m.refillCount} {ta('remaining')}</div> : null}
                      {m.photoDataUrl ? <img className="mt-2 rounded-lg border border-slate-200" style={{ height: 'clamp(4rem, 15vw, 5rem)', width: 'auto' }} src={m.photoDataUrl} alt={ta('Medicine photo')} /> : null}
                    </div>
                    </div>

                    <div className="flex shrink-0 flex-col" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
                      <button className="inline-flex items-center justify-center rounded-lg bg-slate-900 font-extrabold text-white" style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', minHeight: '44px' }} onClick={() => openEdit(m)} aria-label={ta(`Edit ${m.name}`)}>
                        {React.cloneElement(<Pencil />, { 'aria-hidden': true, style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })} {ta('Edit')}
                      </button>
                      <button className="inline-flex items-center justify-center rounded-lg bg-danger font-extrabold text-white" style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', minHeight: '44px' }} onClick={() => deleteMedicine(m.id)} aria-label={ta(`Delete ${m.name}`)}>
                        {React.cloneElement(<Trash2 />, { 'aria-hidden': true, style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })} {ta('Delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {editorOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }} role="dialog" aria-label={ta('Medicine editor dialog')}>
          <div className="w-full max-w-2xl rounded-card bg-white border-2 border-slate-700 shadow-card" style={{ padding: 'clamp(1rem, 3.5vw, 1.5rem)' }}>
            <div className="flex items-center justify-between" style={{ gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
              <div>
                <div className="font-extrabold" style={{ fontSize: 'clamp(1.125rem, 4.5vw, 1.25rem)' }}>{editingId ? ta('Edit Medicine') : ta('Add Medicine')}</div>
                <div className="mt-1 text-slate-600" style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>{ta('Saved locally. Use camera to capture a medicine strip and fill details.')}</div>
              </div>
              <button className="rounded-lg bg-slate-100 font-extrabold text-slate-900" style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }} onClick={() => setEditorOpen(false)} aria-label={ta('Close')}>
                {ta('Close')}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2" style={{ gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
              <label className="block">
                <div className="font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{ta('Time (HH:MM)')}</div>
                <input className="mt-1 w-full rounded-lg border border-slate-200" style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.875rem, 3.5vw, 1rem)', minHeight: '44px' }} value={form.time} onChange={(e) => setForm((s) => ({ ...s, time: e.target.value }))} aria-label={ta('Medicine time')} />
              </label>
              <label className="block">
                <div className="font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{ta('Medicine name')}</div>
                <input className="mt-1 w-full rounded-lg border border-slate-200" style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.875rem, 3.5vw, 1rem)', minHeight: '44px' }} value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} aria-label={ta('Medicine name')} />
              </label>
              <label className="block md:col-span-2">
                <div className="font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{ta('Purpose')}</div>
                <input className="mt-1 w-full rounded-lg border border-slate-200" style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.875rem, 3.5vw, 1rem)', minHeight: '44px' }} value={form.purpose} onChange={(e) => setForm((s) => ({ ...s, purpose: e.target.value }))} aria-label={ta('Purpose')} />
              </label>
              <label className="block md:col-span-2">
                <div className="font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{ta('Instructions')}</div>
                <input className="mt-1 w-full rounded-lg border border-slate-200" style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.875rem, 3.5vw, 1rem)', minHeight: '44px' }} value={form.instructions} onChange={(e) => setForm((s) => ({ ...s, instructions: e.target.value }))} aria-label={ta('Instructions')} />
              </label>
              <label className="block md:col-span-2">
                <div className="font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{ta('Side effects')}</div>
                <input className="mt-1 w-full rounded-lg border border-slate-200" style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.875rem, 3.5vw, 1rem)', minHeight: '44px' }} value={form.sideEffects} onChange={(e) => setForm((s) => ({ ...s, sideEffects: e.target.value }))} aria-label={ta('Side effects')} />
              </label>
              <label className="block">
                <div className="font-semibold text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>{ta('Refill count')}</div>
                <input className="mt-1 w-full rounded-lg border border-slate-200" style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.875rem, 3.5vw, 1rem)', minHeight: '44px' }} inputMode="numeric" value={form.refillCount} onChange={(e) => setForm((s) => ({ ...s, refillCount: e.target.value }))} aria-label={ta('Refill count')} />
              </label>

              <div className="rounded-xl border border-slate-200 md:col-span-2" style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
                <div className="flex flex-wrap items-center justify-between" style={{ gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
                  <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{ta('Prescription / medicine photo')}</div>
                  <div className="flex flex-wrap" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-slate-900 font-extrabold text-white" style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', minHeight: '44px' }}>
                      {React.cloneElement(<Camera />, { 'aria-hidden': true, style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })} {ta('Camera')}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) attachPhotoFromFile(f);
                          e.target.value = '';
                        }}
                        aria-label={ta('Capture prescription photo')}
                      />
                    </label>
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-slate-100 font-extrabold text-slate-900" style={{ padding: 'clamp(0.5rem, 1.5vw, 0.625rem) clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', minHeight: '44px' }}>
                      {React.cloneElement(<Upload />, { 'aria-hidden': true, style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })} {ta('Upload')}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) attachPhotoFromFile(f);
                          e.target.value = '';
                        }}
                        aria-label={ta('Upload prescription photo')}
                      />
                    </label>
                  </div>
                </div>
                {form.photoDataUrl ? (
                  <div className="mt-3">
                    <img className="max-h-64 w-auto rounded-lg border border-slate-200" src={form.photoDataUrl} alt={ta('Captured medicine strip')} />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-extrabold text-slate-900" onClick={() => setForm((s) => ({ ...s, photoDataUrl: '' }))} aria-label={ta('Remove photo')}>
                        {ta('Remove photo')}
                      </button>
                      <button className="rounded-lg bg-primary px-3 py-2 text-sm font-extrabold text-white" onClick={runOcrFillForm} disabled={ocrBusy} aria-label={ta('Extract text from photo')}>
                        {ocrBusy ? ta('Reading…') : ta('Extract text (offline OCR)')}
                      </button>
                      <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-extrabold text-white" onClick={scanPrescription} disabled={ocrBusy} aria-label={ta('Scan prescription and auto add medicines')}>
                        {ocrBusy ? ta('Scanning…') : ta('Scan prescription')}
                      </button>
                    </div>
                    {parsedMeds.length ? (
                      <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                        <div className="text-sm font-extrabold text-slate-900">{ta('Auto-detected medicines')}</div>
                        <ul className="mt-2 space-y-2 text-sm text-slate-700">
                          {parsedMeds.map((m, idx) => (
                            <li key={`pm_${idx}`}>
                              <span className="font-semibold">{m.name}</span> • {m.times.join(', ')} {m.instructions ? `• ${ta(m.instructions)}` : ''}
                            </li>
                          ))}
                        </ul>
                        {ocrText ? (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-sm font-semibold text-slate-700">{ta('View extracted text')}</summary>
                            <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-white border border-slate-600 p-2 text-xs text-slate-700">{ocrText}</pre>
                          </details>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button className="rounded-lg bg-primary px-3 py-2 text-sm font-extrabold text-white" onClick={addParsedToSchedule} aria-label={ta('Add detected medicines to schedule')}>
                            {ta('Add to schedule')}
                          </button>
                          <button className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-extrabold text-slate-900" onClick={() => setParsedMeds([])} aria-label={ta('Clear detected medicines')}>
                            {ta('Clear')}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-slate-600">{ta('Upload or capture a prescription to auto-fill and schedule medicines.')}</div>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-extrabold text-white" onClick={saveMedicine} aria-label={ta('Save medicine')}>
                {ta('Save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Prescription Scanner Component */}
      {showScanner && (
        <PrescriptionScanner 
          onClose={() => setShowScanner(false)}
          onAnalysisComplete={(medicines) => {
            // This will be implemented in next prompt
            setShowScanner(false);
          }}
        />
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const { ta } = useI18n();
  const map = {
    taken: { bg: 'bg-success/10', fg: 'text-success', icon: React.cloneElement(<CheckCircle2 />, { 'aria-hidden': true, style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } }), label: ta('Taken') },
    missed: { bg: 'bg-danger/10', fg: 'text-danger', icon: React.cloneElement(<XCircle />, { 'aria-hidden': true, style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } }), label: ta('Missed') },
    due: { bg: 'bg-warning/10', fg: 'text-warning', icon: React.cloneElement(<Clock />, { 'aria-hidden': true, style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } }), label: ta('Due Now') },
    pending: { bg: 'bg-slate-100', fg: 'text-slate-700', icon: React.cloneElement(<Clock />, { 'aria-hidden': true, style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } }), label: ta('Pending') }
  };

  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center rounded-full font-extrabold ${s.bg} ${s.fg}`} style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', padding: 'clamp(0.25rem, 1vw, 0.375rem) clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }} aria-label={`${ta('Medicine status')}: ${s.label}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

