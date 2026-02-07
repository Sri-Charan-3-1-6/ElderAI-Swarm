import { generateAIReply, getAIConfig } from './aiChatClient.js';

function normalizeLangCode(code) {
  const raw = String(code || '').trim().toLowerCase();
  if (raw === 'te' || raw.startsWith('te')) return 'te';
  if (raw === 'kn' || raw.startsWith('kn')) return 'kn';
  if (raw === 'ml' || raw.startsWith('ml')) return 'ml';
  if (raw === 'mr' || raw.startsWith('mr')) return 'mr';
  if (raw === 'bn' || raw.startsWith('bn')) return 'bn';
  if (raw === 'ta' || raw.startsWith('ta')) return 'ta';
  if (raw === 'hi' || raw.startsWith('hi')) return 'hi';
  return 'en';
}

export function toSpeechLocale(langCode) {
  const l = normalizeLangCode(langCode);
  if (l === 'ta') return 'ta-IN';
  if (l === 'hi') return 'hi-IN';
  if (l === 'te') return 'te-IN';
  if (l === 'kn') return 'kn-IN';
  if (l === 'ml') return 'ml-IN';
  if (l === 'mr') return 'mr-IN';
  if (l === 'bn') return 'bn-IN';
  return 'en-IN';
}

// Small offline phrasebook for common UI/voice snippets.
const PHRASES = {
  en: {
    ta: {
      'hello': 'வணக்கம்',
      'thank you': 'நன்றி',
      'help': 'உதவி',
      'emergency': 'அவசரம்',
      'call': 'அழை',
      'save': 'சேமி',
      'cancel': 'ரத்து',
      'remove': 'நீக்கு',
      'add': 'சேர்',
      'done': 'முடிந்தது',
      'yes': 'ஆம்',
      'no': 'இல்லை',
      'language': 'மொழி',
      'offline': 'ஆஃப்லைன்',
      'online': 'ஆன்லைன்',
      'listening': 'கேட்கிறது',
      'voice': 'குரல்',
      'home': 'முகப்பு'
    },
    hi: {
      'hello': 'नमस्ते',
      'thank you': 'धन्यवाद',
      'help': 'मदद',
      'emergency': 'आपातकाल',
      'call': 'कॉल',
      'save': 'सेव',
      'cancel': 'रद्द',
      'remove': 'हटाएँ',
      'add': 'जोड़ें',
      'done': 'हो गया',
      'yes': 'हाँ',
      'no': 'नहीं',
      'language': 'भाषा',
      'offline': 'ऑफ़लाइन',
      'online': 'ऑनलाइन',
      'listening': 'सुन रहा है',
      'voice': 'वॉइस',
      'home': 'होम'
    },
    te: {
      'hello': 'నమస్తే',
      'thank you': 'ధన్యవాదాలు',
      'help': 'సహాయం',
      'emergency': 'అత్యవసరం',
      'call': 'కాల్',
      'save': 'సేవ్',
      'cancel': 'రద్దు',
      'remove': 'తొలగించు',
      'add': 'జోడించు',
      'done': 'అయింది',
      'yes': 'అవును',
      'no': 'కాదు',
      'language': 'భాష',
      'offline': 'ఆఫ్‌లైన్',
      'online': 'ఆన్‌లైన్',
      'listening': 'వింటోంది',
      'voice': 'వాయిస్',
      'home': 'హోమ్'
    },
    kn: {
      'hello': 'ನಮಸ್ಕಾರ',
      'thank you': 'ಧನ್ಯವಾದಗಳು',
      'help': 'ಸಹಾಯ',
      'emergency': 'ತುರ್ತು',
      'call': 'ಕಾಲ್',
      'save': 'ಉಳಿಸಿ',
      'cancel': 'ರದ್ದು',
      'remove': 'ತೆಗೆದುಹಾಕಿ',
      'add': 'ಸೇರಿಸಿ',
      'done': 'ಮುಗಿಯಿತು',
      'yes': 'ಹೌದು',
      'no': 'ಇಲ್ಲ',
      'language': 'ಭಾಷೆ',
      'offline': 'ಆಫ್‌ಲೈನ್',
      'online': 'ಆನ್‌ಲೈನ್',
      'listening': 'ಕೇಳುತ್ತಿದೆ',
      'voice': 'ಧ್ವನಿ',
      'home': 'ಮುಖಪುಟ'
    },
    ml: {
      'hello': 'നമസ്കാരം',
      'thank you': 'നന്ദി',
      'help': 'സഹായം',
      'emergency': 'അത്യാഹിതം',
      'call': 'കോൾ',
      'save': 'സേവ്',
      'cancel': 'റദ്ദാക്കുക',
      'remove': 'നീക്കം ചെയ്യുക',
      'add': 'ചേർക്കുക',
      'done': 'പൂർത്തിയായി',
      'yes': 'അതെ',
      'no': 'ഇല്ല',
      'language': 'ഭാഷ',
      'offline': 'ഓഫ്‌ലൈൻ',
      'online': 'ഓൺലൈൻ',
      'listening': 'കേൾക്കുന്നു',
      'voice': 'വോയ്സ്',
      'home': 'ഹോം'
    },
    mr: {
      'hello': 'नमस्कार',
      'thank you': 'धन्यवाद',
      'help': 'मदत',
      'emergency': 'आपत्कालीन',
      'call': 'कॉल',
      'save': 'सेव्ह',
      'cancel': 'रद्द',
      'remove': 'काढा',
      'add': 'जोडा',
      'done': 'झाले',
      'yes': 'होय',
      'no': 'नाही',
      'language': 'भाषा',
      'offline': 'ऑफलाइन',
      'online': 'ऑनलाइन',
      'listening': 'ऐकत आहे',
      'voice': 'व्हॉइस',
      'home': 'मुख्यपृष्ठ'
    },
    bn: {
      'hello': 'নমস্কার',
      'thank you': 'ধন্যবাদ',
      'help': 'সাহায্য',
      'emergency': 'জরুরি',
      'call': 'কল',
      'save': 'সেভ',
      'cancel': 'বাতিল',
      'remove': 'সরান',
      'add': 'যোগ করুন',
      'done': 'হয়ে গেছে',
      'yes': 'হ্যাঁ',
      'no': 'না',
      'language': 'ভাষা',
      'offline': 'অফলাইন',
      'online': 'অনলাইন',
      'listening': 'শুনছে',
      'voice': 'ভয়েস',
      'home': 'হোম'
    }
  }
};

function offlineTranslate(text, from, to) {
  const src = normalizeLangCode(from);
  const dst = normalizeLangCode(to);
  const t = String(text || '').trim();
  if (!t) return '';
  if (src === dst) return t;

  // Only phrasebook translations. Everything else returns original.
  const key = t.toLowerCase();
  const table = PHRASES?.[src]?.[dst];
  const mapped = table?.[key];
  return mapped || t;
}

async function translateViaLibre(text, from, to, signal) {
  // Public fallback translator (no API key). Best-effort; if it fails we fall back to offline phrasebook.
  try {
    const res = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ q: text, source: from, target: to, format: 'text' }),
      signal
    });

    if (!res.ok) return '';
    const json = await res.json();
    return String(json?.translatedText || '').trim();
  } catch {
    return '';
  }
}

export async function translateText({ text, from = 'en', to = 'en', signal } = {}) {
  const src = normalizeLangCode(from);
  const dst = normalizeLangCode(to);
  const t = String(text || '').trim();
  if (!t) return '';
  if (src === dst) return t;

  const cfg = getAIConfig();
  if (!cfg.enabled) {
    const cloud = await translateViaLibre(t, src, dst, signal);
    if (cloud) return cloud;
    return offlineTranslate(t, src, dst);
  }

  const target =
    dst === 'ta'
      ? 'Tamil'
      : dst === 'hi'
        ? 'Hindi'
        : dst === 'te'
          ? 'Telugu'
          : dst === 'kn'
            ? 'Kannada'
            : dst === 'ml'
              ? 'Malayalam'
              : dst === 'mr'
                ? 'Marathi'
                : dst === 'bn'
                  ? 'Bengali'
                  : 'English';
  const system = [
    'You are a translation engine.',
    `Translate the user text into ${target}.`,
    'Keep meaning, names, and numbers.',
    'Return only the translated text. No quotes, no extra commentary.'
  ].join('\n');

  const res = await generateAIReply({
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: t }
    ],
    signal
  });

  return String(res?.text || '').trim() || offlineTranslate(t, src, dst);
}

