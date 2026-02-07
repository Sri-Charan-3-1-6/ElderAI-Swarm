export function speakReminder(name, lang = 'en-IN') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  try {
    const utter = new SpeechSynthesisUtterance(`Time to take ${name}`);
    utter.lang = lang;
    utter.rate = 0.9;
    const voices = window.speechSynthesis.getVoices?.() ?? [];
    const preferred = voices.find((v) => v.lang === utter.lang) || voices.find((v) => v.lang?.startsWith(utter.lang.slice(0, 2)));
    if (preferred) utter.voice = preferred;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    return false;
  }
}

