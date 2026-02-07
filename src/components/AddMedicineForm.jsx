import React, { useState } from 'react';
import { Camera, Upload } from 'lucide-react';
import { useI18n } from '../i18n/i18n.js';
import { toast } from '../utils/notificationUtils.js';
import { fileToResizedDataUrl } from '../utils/deviceActions.js';

const PRESETS = [1, 2, 3];
const LANG_OPTIONS = [
  { value: 'en-IN', label: 'English' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'ta-IN', label: 'Tamil' },
  { value: 'te-IN', label: 'Telugu' }
];

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
    meds.push({ name, times, instructions });
  });

  return meds;
}

export default function AddMedicineForm({ onAdd, onCancel }) {
  const { ta } = useI18n();
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [times, setTimes] = useState(['07:00']);
  const [language, setLanguage] = useState('en-IN');
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [parsedMeds, setParsedMeds] = useState([]);

  const setPreset = (count) => {
    if (count === 1) setTimes(['07:00']);
    if (count === 2) setTimes(['07:00', '19:00']);
    if (count === 3) setTimes(['07:00', '13:00', '19:00']);
  };

  const addTime = () => {
    setTimes((prev) => [...prev, '12:00']);
  };

  const updateTime = (idx, value) => {
    setTimes((prev) => prev.map((t, i) => (i === idx ? value : t)));
  };

  const removeTime = (idx) => {
    setTimes((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !times.length) return;
    onAdd({ name, instructions, times, language });
  };

  const attachPhotoFromFile = async (file) => {
    try {
      const dataUrl = await fileToResizedDataUrl(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.8, mime: 'image/jpeg' });
      setPhotoDataUrl(dataUrl);
      setOcrText('');
      setParsedMeds([]);
      toast({ title: ta('Photo added'), message: ta('Prescription image ready for scan.'), type: 'success' });
    } catch {
      toast({ title: ta('Photo error'), message: ta('Could not read that image.'), type: 'warning' });
    }
  };

  const extractTextFromImage = async () => {
    if (!photoDataUrl) {
      toast({ title: ta('OCR'), message: ta('Add a photo first.'), type: 'info' });
      return '';
    }
    setOcrBusy(true);
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const res = await worker.recognize(photoDataUrl);
      await worker.terminate();
      return String(res?.data?.text || '').trim();
    } catch {
      toast({ title: ta('OCR'), message: ta('OCR failed in this browser.'), type: 'warning' });
      return '';
    } finally {
      setOcrBusy(false);
    }
  };

  const scanPrescription = async () => {
    const text = await extractTextFromImage();
    if (!text) {
      toast({ title: ta('Prescription scan'), message: ta('No readable text found. Try a clearer image.'), type: 'warning' });
      return;
    }
    setOcrText(text);
    const parsed = parsePrescriptionText(text);
    setParsedMeds(parsed);
    if (!parsed.length) {
      toast({ title: ta('Prescription scan'), message: ta('No medicines detected. You can add manually.'), type: 'warning' });
      return;
    }
    toast({ title: ta('Prescription scan'), message: ta('Medicines detected. Review and add to schedule.'), type: 'success' });
  };

  const addParsedToSchedule = () => {
    if (!parsedMeds.length) {
      toast({ title: ta('Prescription'), message: ta('Nothing to add yet.'), type: 'info' });
      return;
    }
    parsedMeds.forEach((m) => {
      onAdd({ name: m.name, instructions: m.instructions || '', times: m.times, language });
    });
    toast({ title: ta('Added'), message: ta('Medicines added from prescription.'), type: 'success' });
    setParsedMeds([]);
  };

  return (
    <form onSubmit={submit} className="bg-white shadow-card border-2 border-slate-700" style={{ 
      marginTop: 'clamp(1rem, 3vw, 1.5rem)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'clamp(0.75rem, 2vw, 1rem)',
      borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
      padding: 'clamp(1rem, 3vw, 1.25rem)'
    }}>
      <h2 style={{ fontSize: 'clamp(1.5rem, 6vw, 1.875rem)', fontWeight: '900' }}>{ta('Add Medicine')}</h2>

      <div className="border border-slate-200 bg-white" style={{ 
        borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
        padding: 'clamp(0.875rem, 3vw, 1rem)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(0.625rem, 2vw, 0.75rem)'
      }}>
        <div style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)', fontWeight: '800' }}>{ta('Prescription upload')}</div>
        <div className="flex flex-wrap" style={{ gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
          <label className="inline-flex cursor-pointer items-center justify-center bg-slate-900 text-white" style={{ 
            gap: 'clamp(0.375rem, 1.5vw, 0.5rem)',
            borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
            padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.875rem, 3vw, 1rem)',
            fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)',
            fontWeight: '800',
            minHeight: '44px'
          }}>
            {React.cloneElement(<Camera />, { style: { width: 'clamp(1rem, 4vw, 1.25rem)', height: 'clamp(1rem, 4vw, 1.25rem)' } })} {ta('Camera')}
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
            />
          </label>
          <label className="inline-flex cursor-pointer items-center justify-center bg-white text-slate-900 shadow border border-slate-600" style={{ 
            gap: 'clamp(0.375rem, 1.5vw, 0.5rem)',
            borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
            padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.875rem, 3vw, 1rem)',
            fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)',
            fontWeight: '800',
            minHeight: '44px'
          }}>
            {React.cloneElement(<Upload />, { style: { width: 'clamp(1rem, 4vw, 1.25rem)', height: 'clamp(1rem, 4vw, 1.25rem)' } })} {ta('Upload')}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) attachPhotoFromFile(f);
                e.target.value = '';
              }}
            />
          </label>
          <button type="button" className="bg-primary text-white" style={{ 
            borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
            padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.875rem, 3vw, 1rem)',
            fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)',
            fontWeight: '800',
            minHeight: '44px'
          }} onClick={scanPrescription} disabled={ocrBusy}>
            {ocrBusy ? ta('Scanning...') : ta('Scan prescription')}
          </button>
        </div>
        {photoDataUrl ? (
          <img className="w-auto border border-slate-200" style={{ maxHeight: 'clamp(150px, 35vw, 192px)', borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)' }} src={photoDataUrl} alt={ta('Prescription preview')} />
        ) : (
          <div className="text-slate-600" style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)' }}>{ta('Add a prescription photo to auto-detect medicines.')}</div>
        )}
        {parsedMeds.length ? (
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-sm font-extrabold text-slate-900">{ta('Detected medicines')}</div>
            <ul className="mt-2 space-y-2 text-sm text-slate-700">
              {parsedMeds.map((m, idx) => (
                <li key={`pm_${idx}`}>
                  <span className="font-semibold">{m.name}</span> • {m.times.join(', ')} {m.instructions ? `• ${ta(m.instructions)}` : ''}
                </li>
              ))}
            </ul>
            {ocrText ? (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-semibold text-slate-700">{ta('View extracted text')}</summary>
                <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-white border border-slate-600 p-2 text-xs text-slate-700">{ocrText}</pre>
              </details>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="rounded-xl bg-emerald-600 px-4 py-2 text-lg font-extrabold text-white" onClick={addParsedToSchedule}>
                {ta('Add all to schedule')}
              </button>
              <button type="button" className="rounded-xl bg-slate-200 px-4 py-2 text-lg font-extrabold text-slate-800" onClick={() => setParsedMeds([])}>
                {ta('Clear')}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <label className="block" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
        <div style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)', fontWeight: '800' }}>{ta('Medicine Name')}</div>
        <input
          className="w-full border border-slate-300"
          style={{ 
            height: 'clamp(3rem, 10vw, 3.5rem)',
            borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
            padding: '0 clamp(0.875rem, 3vw, 1rem)',
            fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
            fontWeight: '600'
          }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
        <div style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)', fontWeight: '800' }}>{ta('How many times per day?')}</div>
        <div className="flex flex-wrap" style={{ gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
          {PRESETS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setPreset(c)}
              className="flex-1 bg-slate-100 text-slate-900 shadow"
              style={{ 
                height: 'clamp(3rem, 10vw, 3.5rem)',
                borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
                fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
                fontWeight: '900',
                minWidth: 'clamp(60px, 20vw, 80px)'
              }}
            >
              {c}x
            </button>
          ))}
          <button type="button" onClick={addTime} className="flex-1 bg-primary text-white shadow" style={{ 
            height: 'clamp(3rem, 10vw, 3.5rem)',
            borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
            fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
            fontWeight: '900',
            minWidth: 'clamp(120px, 35vw, 150px)'
          }}>
            + Custom Time
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
        <div style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)', fontWeight: '800' }}>Times</div>
        {times.map((t, idx) => (
          <div key={idx} className="flex items-center" style={{ gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
            <input
              type="time"
              className="flex-1 border border-slate-300"
              style={{ 
                height: 'clamp(3rem, 10vw, 3.5rem)',
                borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
                padding: '0 clamp(0.875rem, 3vw, 1rem)',
                fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
                fontWeight: '600'
              }}
              value={t}
              onChange={(e) => updateTime(idx, e.target.value)}
              required
            />
            {times.length > 1 ? (
              <button
                type="button"
                onClick={() => removeTime(idx)}
                className="bg-red-100 text-red-900 shadow"
                style={{ 
                  height: 'clamp(3rem, 10vw, 3.5rem)',
                  borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
                  padding: '0 clamp(0.875rem, 3vw, 1rem)',
                  fontSize: 'clamp(1rem, 4vw, 1.25rem)',
                  fontWeight: '800'
                }}
              >
                Remove
              </button>
            ) : null}
          </div>
        ))}
      </div>

      <label className="block" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
        <div style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)', fontWeight: '800' }}>{ta('Instructions (optional)')}</div>
        <textarea
          className="w-full border border-slate-300"
          style={{ 
            minHeight: 'clamp(80px, 20vw, 100px)',
            borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
            padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.875rem, 3vw, 1rem)',
            fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
            fontWeight: '600'
          }}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={ta('e.g., With food')}
        />
      </label>

      <label className="block" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
        <div style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)', fontWeight: '800' }}>{ta('Voice language')}</div>
        <select
          className="w-full border border-slate-300"
          style={{ 
            height: 'clamp(3rem, 10vw, 3.5rem)',
            borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
            padding: '0 clamp(0.875rem, 3vw, 1rem)',
            fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
            fontWeight: '600'
          }}
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          {LANG_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap" style={{ gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
        <button type="submit" className="flex-1 bg-emerald-600 text-white shadow-lg" style={{ 
          height: 'clamp(3.5rem, 10vw, 4rem)',
          borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
          fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
          fontWeight: '900',
          minWidth: 'clamp(120px, 35vw, 150px)'
        }}>
          Save Medicine
        </button>
        <button type="button" onClick={onCancel} className="flex-1 bg-slate-200 text-slate-800" style={{ 
          height: 'clamp(3.5rem, 10vw, 4rem)',
          borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
          fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
          fontWeight: '900',
          minWidth: 'clamp(100px, 30vw, 120px)'
        }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

