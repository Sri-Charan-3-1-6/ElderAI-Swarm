function env(name, fallback = '') {
  try {
    return (import.meta?.env?.[name] ?? fallback);
  } catch {
    return fallback;
  }
}

export function getAIConfig() {
  const modeRaw = String(env('VITE_AI_MODE', 'offline') || 'offline').trim().toLowerCase();
  const mode = modeRaw === 'ollama' || modeRaw === 'openai' ? modeRaw : 'offline';

  const baseUrl = String(env('VITE_AI_BASE_URL', mode === 'ollama' ? 'http://localhost:11434' : '')).trim();
  const apiKey = String(env('VITE_AI_API_KEY', '')).trim();
  const model = String(env('VITE_AI_MODEL', mode === 'ollama' ? 'llama3.1' : 'gpt-4o-mini')).trim();

  const temperature = (() => {
    const t = Number(env('VITE_AI_TEMPERATURE', '0.6'));
    return Number.isFinite(t) ? Math.max(0, Math.min(2, t)) : 0.6;
  })();

  const enabled = mode !== 'offline' && Boolean(baseUrl) && Boolean(model) && (mode !== 'openai' || Boolean(apiKey));

  return {
    mode,
    enabled,
    baseUrl,
    apiKey,
    model,
    temperature
  };
}

function joinUrl(base, path) {
  const b = String(base || '').replace(/\/+$/, '');
  const p = String(path || '');
  return `${b}${p.startsWith('/') ? '' : '/'}${p}`;
}

function toOpenAIMessages(messages) {
  return (messages || [])
    .filter((m) => m && typeof m === 'object' && typeof m.role === 'string' && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content }));
}

function safeText(x) {
  return String(x ?? '').trim();
}

export async function generateAIReply({ messages, signal } = {}) {
  const cfg = getAIConfig();
  if (!cfg.enabled) {
    throw new Error('AI is not configured. Set VITE_AI_MODE and related env variables.');
  }

  if (cfg.mode === 'ollama') {
    // Ollama API: POST /api/chat { model, messages:[{role,content}], stream:false }
    const url = joinUrl(cfg.baseUrl, '/api/chat');
    const body = {
      model: cfg.model,
      stream: false,
      messages: toOpenAIMessages(messages),
      options: { temperature: cfg.temperature }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Ollama error (${res.status}): ${text || res.statusText}`);
    }

    const json = await res.json();
    const content = safeText(json?.message?.content);
    if (!content) throw new Error('Ollama returned an empty response.');
    return { text: content, provider: 'ollama' };
  }

  // OpenAI-compatible API: POST /v1/chat/completions
  const url = joinUrl(cfg.baseUrl, '/v1/chat/completions');
  const body = {
    model: cfg.model,
    temperature: cfg.temperature,
    messages: toOpenAIMessages(messages)
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${cfg.apiKey}`
    },
    body: JSON.stringify(body),
    signal
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`AI error (${res.status}): ${text || res.statusText}`);
  }

  const json = await res.json();
  const content = safeText(json?.choices?.[0]?.message?.content);
  if (!content) throw new Error('AI returned an empty response.');
  return { text: content, provider: 'openai' };
}

