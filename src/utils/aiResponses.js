import { aiConversationBank, patternRules } from '../data/aiConversations.js';

function normalize(text) {
  return (text || '').toLowerCase().trim();
}

function containsAny(text, words) {
  const t = normalize(text);
  return words.some((w) => t.includes(w));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function detectMood(text) {
  const t = normalize(text);
  if (containsAny(t, ['lonely', 'alone', 'sad', 'bored', 'scared', 'cry', 'tension', 'anxious'])) return 'Lonely/Sad';
  if (containsAny(t, ['happy', 'good', 'fine', 'great', 'super', 'nice'])) return 'Happy';
  if (containsAny(t, ['pain', 'dizzy', 'tired', 'weak', 'fever', 'headache', 'cough'])) return 'Unwell';
  return 'Neutral';
}

function detectLanguageHint(text) {
  const t = normalize(text);
  if (/[\u0B80-\u0BFF]/.test(text) || t.includes('vanakkam') || t.includes('amma') || t.includes('saptiya') || t.includes('epdi')) return 'Tamil';
  if (/[\u0900-\u097F]/.test(text) || t.includes('namaste') || t.includes('kaise') || t.includes('aap') || t.includes('kya')) return 'Hindi';
  return 'English';
}

export function createRuleBasedAI({ memorySize = 5 } = {}) {
  const memory = [];

  function remember(role, text) {
    memory.push({ role, text, ts: Date.now() });
    while (memory.length > memorySize) memory.shift();
  }

  function getContextSummary() {
    const lastUser = [...memory].reverse().find((m) => m.role === 'user')?.text ?? '';
    return {
      mood: detectMood(lastUser),
      language: detectLanguageHint(lastUser),
      lastUser
    };
  }

  function matchCategory(userText) {
    const t = normalize(userText);
    for (const rule of patternRules) {
      const bankWords = aiConversationBank.patterns[rule.containsAny] ?? [];
      if (containsAny(t, bankWords)) {
        return rule;
      }
    }
    return { category: 'general', triggersEmergency: false };
  }

  function respond(userText) {
    remember('user', userText);
    const ctx = getContextSummary();
    const rule = matchCategory(userText);

    const category = rule.category;
    const pool = aiConversationBank.responses[category] ?? aiConversationBank.responses.general;

    let response = pick(pool);

    // Contextual seasoning
    if (ctx.mood === 'Lonely/Sad' && category !== 'emergency') {
      response = pick(aiConversationBank.responses.emotionalSupport);
    }

    // Lightweight continuity: if user repeats, respond gently.
    const repeated = memory.filter((m) => m.role === 'user').slice(-2);
    if (repeated.length === 2 && normalize(repeated[0].text) === normalize(repeated[1].text)) {
      response = 'Amma, I heard you. Let’s take it step by step. Tell me a little more, ok?';
    }

    // Add small bilingual warmth
    if (ctx.language === 'Tamil' && Math.random() < 0.35 && !response.toLowerCase().includes('vanakkam')) {
      response = `${response} Vanakkam Amma.`;
    }
    if (ctx.language === 'Hindi' && Math.random() < 0.30 && !response.toLowerCase().includes('namaste')) {
      response = `${response} Namaste Amma.`;
    }

    remember('ai', response);

    return {
      text: response,
      category,
      triggersEmergency: Boolean(rule.triggersEmergency),
      mood: ctx.mood,
      languageHint: ctx.language,
      memory: [...memory]
    };
  }

  return { respond, remember, getMemory: () => [...memory] };
}

