import { toast } from './notificationUtils.js';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export function isSpeechSupported() {
  return {
    recognition: Boolean(SpeechRecognition),
    synthesis: 'speechSynthesis' in window
  };
}

export function detectLanguageFromText(text) {
  const t = (text || '').toLowerCase();
  // Very lightweight heuristics (offline)
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN';
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';
  if (t.includes('vanakkam') || t.includes('amma') || t.includes('saptiya') || t.includes('epdi')) return 'ta-IN';
  if (t.includes('namaste') || t.includes('kaise') || t.includes('aap') || t.includes('kya')) return 'hi-IN';
  return 'en-IN';
}

export function speak(text, { lang, rate = 0.8 } = {}) {
  if (!('speechSynthesis' in window)) {
    toast({ title: 'Voice not supported', message: 'Text-to-speech is not available in this browser.', type: 'warning' });
    return false;
  }

  try {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = rate;
    utter.lang = lang || detectLanguageFromText(text);

    // Pick a natural voice if available
    const voices = window.speechSynthesis.getVoices?.() ?? [];
    const preferred = voices.find((v) => v.lang === utter.lang) || voices.find((v) => v.lang?.startsWith(utter.lang?.slice(0, 2)));
    if (preferred) utter.voice = preferred;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    toast({ title: 'Voice error', message: 'Could not play voice output.', type: 'warning' });
    return false;
  }
}

export function stopSpeaking() {
  try {
    window.speechSynthesis?.cancel?.();
  } catch {
    // ignore
  }
}

export function startRecognition({ lang = 'en-IN', continuous = false, onResult, onError, onEnd } = {}) {
  if (!SpeechRecognition) {
    toast({ title: 'Mic not supported', message: 'Speech recognition is not available in this browser.', type: 'warning' });
    return null;
  }

  const rec = new SpeechRecognition();
  rec.lang = lang;
  rec.continuous = continuous;
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  rec.onresult = (event) => {
    const text = event.results?.[0]?.[0]?.transcript ?? '';
    onResult?.(text);
  };

  rec.onerror = () => {
    onError?.();
    toast({ title: 'Mic error', message: 'Could not use microphone. Please check permissions.', type: 'warning' });
  };

  rec.onend = () => {
    onEnd?.();
  };

  try {
    rec.start();
    return rec;
  } catch {
    toast({ title: 'Mic error', message: 'Could not start listening.', type: 'warning' });
    return null;
  }
}

