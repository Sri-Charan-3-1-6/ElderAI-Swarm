import React, { useEffect, useMemo, useState } from 'react';
import { Camera, CheckCircle2, Clock, Pencil, Pill, Plus, Trash2, XCircle } from 'lucide-react';
import { getItem, storageKeys, subscribe, updateMedicines, appendActivity } from '../../utils/storageUtils.js';
import { toast, notifyBrowser } from '../../utils/notificationUtils.js';
import { speak } from '../../utils/speechUtils.js';
import { fileToResizedDataUrl } from '../../utils/deviceActions.js';
import { useI18n } from '../../i18n/i18n.js';

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

export default function MedicineBuddy() {
  const { ta } = useI18n();
  const [meds, setMeds] = useState(() => getItem(storageKeys.medicines, []));
  const [nowTick, setNowTick] = useState(Date.now());

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ time: '07:00', name: '', purpose: '', instructions: '', sideEffects: '', refillCount: '', photoDataUrl: '' });
  const [ocrBusy, setOcrBusy] = useState(false);

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
            const msg = ta(`It's time for ${m.name}.`);
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
      toast({ title: ta('Photo added'), message: ta('Saved locally with this medicine.'), type: 'success' });
    } catch {
      toast({ title: ta('Camera'), message: ta('Could not read that image.'), type: 'warning' });
    }
  };

  const runOcr = async () => {
    if (!form.photoDataUrl) {
      toast({ title: ta('OCR'), message: ta('Add a photo first.'), type: 'info' });
      return;
    }
    setOcrBusy(true);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const res = await worker.recognize(form.photoDataUrl);
      await worker.terminate();
      const text = String(res?.data?.text || '').trim();
      if (!text) {
        toast({ title: ta('OCR'), message: ta('No readable text found. You can type manually.'), type: 'warning' });
        return;
      }

      // Best-effort: pick a reasonable first line as name.
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
    } catch {
      toast({ title: ta('OCR'), message: ta('OCR failed in this browser. You can still type manually.'), type: 'warning' });
    } finally {
      setOcrBusy(false);
    }
  };

  const countdownText = useMemo(() => {
    if (!nextDue) return ta('All medicines done for now.');
    const mins = minutesUntil(nextDue.time);
    if (mins <= 0) return ta(`Next reminder: now (${nextDue.time})`);
    return ta(`Next reminder in ${mins} min (${nextDue.time})`);
  }, [nextDue, nowTick]);

  return (
    <div className="space-y-6">
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
        <div className="rounded-card bg-white shadow-card p-4 ring-1 ring-slate-100">
          <div className="text-xs font-semibold text-slate-500">{ta('Compliance score')}</div>
          <div className="mt-1 text-3xl font-extrabold">{compliance}%</div>
          <div className="mt-1 text-sm text-slate-600">{ta("Based on today’s schedule")}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100 p-5 lg:col-span-2">
          <h3 className="text-lg font-bold">{ta("Today’s Schedule")}</h3>
          <div className="mt-4 space-y-3">
            {meds.map((m) => {
              const st = statusForMed(m);
              return (
                <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-2xl font-extrabold tracking-tight">{m.time}</div>
                      <div className="mt-1 text-lg font-bold">{m.name}</div>
                      <div className="text-sm text-slate-600">{ta('Purpose')}: {m.purpose}</div>
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      <StatusPill status={st} />
                      {!m.taken ? (
                        <button
                          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 font-bold text-white transition hover:brightness-110 focus:outline-none"
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

        <div className="space-y-6">
          <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100 p-5">
            <h3 className="text-lg font-bold">{ta('Reminder System')}</h3>
            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-500">{ta('Next reminder')}</div>
              <div className="mt-1 text-sm font-semibold text-slate-800">{countdownText}</div>
            </div>
            <div className="mt-3 text-sm text-slate-600">{ta('Reminders trigger automatically when a medicine is due.')}</div>
          </div>

          <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100 p-5">
            <h3 className="text-lg font-bold">{ta('Medicine Details')}</h3>
            <div className="mt-4 space-y-3">
              {meds.map((m) => (
                <div key={`d_${m.id}`} className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-700 shadow">
                      <Pill aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-900">{m.name}</div>
                      <div className="text-sm text-slate-600">{ta('Purpose')}: {m.purpose}</div>
                      {m.instructions ? <div className="mt-1 text-sm text-slate-600">{ta('Instructions')}: {m.instructions}</div> : null}
                      {m.sideEffects ? <div className="text-sm text-slate-600">{ta('Side effects')}: {m.sideEffects}</div> : null}
                      {Number.isFinite(m.refillCount) ? <div className="mt-1 text-sm font-semibold text-slate-800">{ta('Refill')}: {m.refillCount} {ta('remaining')}</div> : null}
                      {m.photoDataUrl ? <img className="mt-2 h-20 w-auto rounded-lg border border-slate-200" src={m.photoDataUrl} alt={ta('Medicine photo')} /> : null}
                    </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2">
                      <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-extrabold text-white" onClick={() => openEdit(m)} aria-label={ta(`Edit ${m.name}`)}>
                        <Pencil aria-hidden="true" className="h-4 w-4" /> {ta('Edit')}
                      </button>
                      <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-danger px-3 py-2 text-sm font-extrabold text-white" onClick={() => deleteMedicine(m.id)} aria-label={ta(`Delete ${m.name}`)}>
                        <Trash2 aria-hidden="true" className="h-4 w-4" /> {ta('Delete')}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" role="dialog" aria-label={ta('Medicine editor dialog')}>
          <div className="w-full max-w-2xl rounded-card bg-white shadow-card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xl font-extrabold">{editingId ? ta('Edit Medicine') : ta('Add Medicine')}</div>
                <div className="mt-1 text-slate-600">{ta('Saved locally. Use camera to capture a medicine strip and fill details.')}</div>
              </div>
              <button className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-extrabold text-slate-900" onClick={() => setEditorOpen(false)} aria-label={ta('Close')}>
                {ta('Close')}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="block">
                <div className="text-xs font-semibold text-slate-500">{ta('Time (HH:MM)')}</div>
                <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" value={form.time} onChange={(e) => setForm((s) => ({ ...s, time: e.target.value }))} aria-label={ta('Medicine time')} />
              </label>
              <label className="block">
                <div className="text-xs font-semibold text-slate-500">{ta('Medicine name')}</div>
                <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} aria-label={ta('Medicine name')} />
              </label>
              <label className="block md:col-span-2">
                <div className="text-xs font-semibold text-slate-500">{ta('Purpose')}</div>
                <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" value={form.purpose} onChange={(e) => setForm((s) => ({ ...s, purpose: e.target.value }))} aria-label={ta('Purpose')} />
              </label>
              <label className="block md:col-span-2">
                <div className="text-xs font-semibold text-slate-500">{ta('Instructions')}</div>
                <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" value={form.instructions} onChange={(e) => setForm((s) => ({ ...s, instructions: e.target.value }))} aria-label={ta('Instructions')} />
              </label>
              <label className="block md:col-span-2">
                <div className="text-xs font-semibold text-slate-500">{ta('Side effects')}</div>
                <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" value={form.sideEffects} onChange={(e) => setForm((s) => ({ ...s, sideEffects: e.target.value }))} aria-label={ta('Side effects')} />
              </label>
              <label className="block">
                <div className="text-xs font-semibold text-slate-500">{ta('Refill count')}</div>
                <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" inputMode="numeric" value={form.refillCount} onChange={(e) => setForm((s) => ({ ...s, refillCount: e.target.value }))} aria-label={ta('Refill count')} />
              </label>

              <div className="rounded-xl border border-slate-200 p-3 md:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-extrabold text-slate-900">{ta('Medicine strip photo')}</div>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-extrabold text-white">
                    <Camera aria-hidden="true" className="h-4 w-4" /> {ta('Capture')}
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
                      aria-label={ta('Capture medicine photo')}
                    />
                  </label>
                </div>
                {form.photoDataUrl ? (
                  <div className="mt-3">
                    <img className="max-h-64 w-auto rounded-lg border border-slate-200" src={form.photoDataUrl} alt={ta('Captured medicine strip')} />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-extrabold text-slate-900" onClick={() => setForm((s) => ({ ...s, photoDataUrl: '' }))} aria-label={ta('Remove photo')}>
                        {ta('Remove photo')}
                      </button>
                      <button className="rounded-lg bg-primary px-3 py-2 text-sm font-extrabold text-white" onClick={runOcr} disabled={ocrBusy} aria-label={ta('Extract text from photo')}>
                        {ocrBusy ? ta('Reading…') : ta('Extract text (offline OCR)')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-slate-600">{ta('Use camera to capture the tablet strip, then optionally extract text.')}</div>
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
    </div>
  );
}

function StatusPill({ status }) {
  const { ta } = useI18n();
  const map = {
    taken: { bg: 'bg-success/10', fg: 'text-success', icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />, label: ta('Taken') },
    missed: { bg: 'bg-danger/10', fg: 'text-danger', icon: <XCircle className="h-4 w-4" aria-hidden="true" />, label: ta('Missed') },
    due: { bg: 'bg-warning/10', fg: 'text-warning', icon: <Clock className="h-4 w-4" aria-hidden="true" />, label: ta('Due Now') },
    pending: { bg: 'bg-slate-100', fg: 'text-slate-700', icon: <Clock className="h-4 w-4" aria-hidden="true" />, label: ta('Pending') }
  };

  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-extrabold ${s.bg} ${s.fg}`} aria-label={`${ta('Medicine status')}: ${s.label}`}>
      {s.icon}
      {s.label}
    </span>
  );
}
