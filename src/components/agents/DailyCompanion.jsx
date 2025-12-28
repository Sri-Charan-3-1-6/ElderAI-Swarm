import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import VoiceButton from '../shared/VoiceButton.jsx';
import { langToSpeechLocale } from '../../i18n/i18n.js';
import EmergencyButton from '../shared/EmergencyButton.jsx';
import { appendChatMessage, getItem, storageKeys, subscribe, appendActivity, addEmergency } from '../../utils/storageUtils.js';
import { createRuleBasedAI } from '../../utils/aiResponses.js';
import { generateAIReply, getAIConfig } from '../../utils/aiChatClient.js';
import { speak } from '../../utils/speechUtils.js';
import { createEmergencyIncident, runEmergencySequence } from '../../utils/emergencySimulator.js';
import { startPhoneCall } from '../../utils/deviceActions.js';
import { toast } from '../../utils/notificationUtils.js';
import { useI18n } from '../../i18n/i18n.js';

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function formatTime(tsISO) {
  const d = new Date(tsISO);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const QUICK = ['Tell me a joke', 'Play a song', 'Tell me a story', "How's the weather?"];

const JOKES = [
  'Why did the tomato blush? Because it saw the salad dressing!',
  'What do you call a fake noodle? An impasta!',
  'Why did the phone go to school? To improve its “ring” tone!'
];

const STORIES = [
  'Short story: Once a tiny sparrow learned that small steps every day become big strength. Like you, Amma.',
  'Short story: A lamp stayed bright because it was cared for daily—routine is powerful, Amma.'
];

const SONGS = ['Lag Jaa Gale', 'Munbe Vaa', 'Ilaiyaraaja classics'];

const EMERGENCY_KEYWORDS = [
  'emergency',
  'ambulance',
  'fell down',
  'i fell',
  'fallen',
  'fainted',
  'unconscious',
  "can't breathe",
  'cannot breathe',
  'breathless',
  'chest pain',
  'stroke',
  'heart attack',
  'bleeding'
];

function analyzeUserText(text) {
  const t = String(text || '').toLowerCase().trim();
  const triggersEmergency = EMERGENCY_KEYWORDS.some((k) => t.includes(k));

  let mood = 'Neutral';
  if (/(lonely|alone|sad|bored|scared|cry|tension|anxious)/.test(t)) mood = 'Lonely/Sad';
  else if (/(happy|good|fine|great|super|nice)/.test(t)) mood = 'Happy';
  else if (/(pain|dizzy|tired|weak|fever|headache|cough)/.test(t)) mood = 'Unwell';

  return { triggersEmergency, mood };
}

function pickPrimaryContact(profile) {
  const list = Array.isArray(profile?.contacts) ? profile.contacts : [];
  return list.find((c) => c?.role === 'family') ?? list.find((c) => c?.isEmergency) ?? list[0] ?? null;
}

function personalizeText(text, profile, contact) {
  let t = String(text ?? '');
  const name = (profile?.name || '').trim();

  if (contact?.name) {
    t = t.replace(/\bRajesh\b/g, contact.name);
  }

  if (name && name !== 'Elder User') {
    // Replace the first "Amma" with the saved name for a more natural feel.
    t = t.replace(/\bAmma\b/, name);
  }

  return t;
}

export default function DailyCompanion() {
  const { ta } = useI18n();
  const [chat, setChat] = useState(() => getItem(storageKeys.chat, []));
  const [input, setInput] = useState('');
  const [mood, setMood] = useState('Neutral');
  const [score, setScore] = useState('Engaging');
  const [profile, setProfile] = useState(() => getItem(storageKeys.profile, { name: 'Elder User', contacts: [] }));
  const [thinking, setThinking] = useState(false);

  const listRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => subscribe(storageKeys.chat, setChat), []);
  useEffect(() => subscribe(storageKeys.profile, setProfile), []);

  const ai = useMemo(() => createRuleBasedAI({ memorySize: 5 }), []);

  const aiConfig = useMemo(() => getAIConfig(), []);

  const primaryContact = useMemo(() => pickPrimaryContact(profile), [profile]);

  useEffect(() => {
    // Seed AI memory from last 5 messages
    const last = (chat ?? []).slice(-5);
    last.forEach((m) => ai.remember(m.from === 'elder' ? 'user' : 'ai', m.text));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo?.({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat]);

  const evaluateConversation = (aiMeta) => {
    setMood(aiMeta?.mood ?? 'Neutral');
    if (aiMeta?.triggersEmergency) {
      setScore('Concerning');
      return;
    }
    if ((chat ?? []).length > 15) setScore('Engaging');
    else setScore('Normal');
  };

  const badgeLabel = useMemo(() => {
    if (!aiConfig.enabled) return ta('Offline AI');
    return aiConfig.mode === 'ollama' ? ta('Local AI') : ta('Online AI');
  }, [aiConfig.enabled, aiConfig.mode, ta]);

  const buildSystemPrompt = () => {
    const elderName = (profile?.name || 'Elder User').trim();
    const language = (profile?.language || 'English').trim();
    const emergencyName = primaryContact?.name || 'family contact';

    return [
      'You are Daily Companion, a warm, patient, safety-first AI friend for elderly care.',
      'You run inside an offline-first app. Do not claim you can access the internet, GPS maps, or external services unless the user explicitly provided them.',
      'Be practical: provide steps, checklists, gentle coaching, and simple explanations.',
      'If the user mentions an emergency (fall, fainting, chest pain, breathing issues, stroke signs, severe bleeding), tell them to seek immediate help and to press Emergency Help / call their emergency contact.',
      'Keep answers concise and reassuring. Avoid medical diagnosis; suggest seeking professional help when appropriate.',
      `User profile: name=${elderName}, language=${language}, emergencyContact=${emergencyName}.`
    ].join('\n');
  };

  const toLLMMessages = (history, userText) => {
    const mapped = (history ?? []).slice(-20).map((m) => ({
      role: m?.from === 'elder' ? 'user' : 'assistant',
      content: String(m?.text || '')
    }));
    return [{ role: 'system', content: buildSystemPrompt() }, ...mapped, { role: 'user', content: String(userText || '') }];
  };

  const triggerEmergency = (reason) => {
    const incident = createEmergencyIncident({ type: 'Fall', source: 'AI Keyword', notes: reason });
    addEmergency(incident);
    runEmergencySequence(incident, (updated) => addEmergency(updated));
    appendActivity({ id: uid('act'), type: 'emergency', title: ta('Emergency triggered by AI keyword'), ts: new Date().toISOString(), detail: reason });
  };

  const send = async (text) => {
    const trimmed = (text ?? '').trim();
    if (!trimmed) return;
    if (thinking) return;

    const elderMsg = { id: uid('m'), from: 'elder', text: trimmed, ts: new Date().toISOString() };
    appendChatMessage(elderMsg);
    appendActivity({ id: uid('act'), type: 'chat', title: ta('Elder sent a message'), ts: elderMsg.ts, detail: trimmed.slice(0, 60) });

    const analysis = analyzeUserText(trimmed);
    setMood(analysis.mood);
    if (analysis.triggersEmergency) {
      setScore('Concerning');
      const urgent = ta(`I’m here. This sounds serious. Press Emergency Help now. I will alert your emergency flow and you should call ${primaryContact?.name || 'your emergency contact'} immediately.`);
      const aiMsg = { id: uid('m'), from: 'ai', text: urgent, ts: new Date().toISOString(), meta: { triggersEmergency: true, mood: analysis.mood } };
      appendChatMessage(aiMsg);
      speak(urgent, { rate: 0.85 });
      triggerEmergency(`Detected emergency keyword in: "${trimmed}"`);
      return;
    }

    // Abort any in-flight request so rapid messages feel responsive.
    try {
      abortRef.current?.abort?.();
    } catch {
      // ignore
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const lower = trimmed.toLowerCase();
    const shouldUseOfflineExtras = !aiConfig.enabled;

    try {
      setThinking(true);

      let aiText = '';
      let aiMeta = { mood: analysis.mood, triggersEmergency: false };

      if (aiConfig.enabled) {
        const history = [...(chat ?? []), elderMsg];
        const messages = toLLMMessages(history, trimmed);
        const res = await generateAIReply({ messages, signal: controller.signal });
        aiText = res?.text || '';
        aiMeta = { ...aiMeta, provider: res?.provider || aiConfig.mode };
      } else {
        const aiRes = ai.respond(trimmed);
        aiText = aiRes.text;
        aiMeta = aiRes;
      }

      aiText = personalizeText(aiText, profile, primaryContact);
      const aiMsg = { id: uid('m'), from: 'ai', text: aiText, ts: new Date().toISOString(), meta: aiMeta };
      appendChatMessage(aiMsg);
      appendActivity({ id: uid('act'), type: 'chat', title: ta('AI replied'), ts: aiMsg.ts, detail: aiText.slice(0, 60) });

      // Score/mood
      if ((chat ?? []).length > 15) setScore('Engaging');
      else setScore('Normal');

      // Voice output (best-effort)
      speak(aiText, { rate: 0.8 });

      // Offline entertainment helpers (only in offline mode to avoid double-replies)
      if (shouldUseOfflineExtras) {
        if (lower.includes('joke')) {
          const joke = JOKES[Math.floor(Math.random() * JOKES.length)];
          appendChatMessage({ id: uid('m'), from: 'ai', text: joke, ts: new Date().toISOString() });
        }
        if (lower.includes('story')) {
          const story = STORIES[Math.floor(Math.random() * STORIES.length)];
          appendChatMessage({ id: uid('m'), from: 'ai', text: story, ts: new Date().toISOString() });
        }
        if (lower.includes('song') || lower.includes('music')) {
          const song = SONGS[Math.floor(Math.random() * SONGS.length)];
          appendChatMessage({ id: uid('m'), from: 'ai', text: ta(`Song suggestion: “${song}”. Want to hum a few lines together?`), ts: new Date().toISOString() });
        }
      }
    } catch (err) {
      // If AI endpoint is down/unconfigured, fall back to offline rule-based so chat still works.
      const msg = err?.name === 'AbortError' ? 'Cancelled.' : err?.message || 'AI error.';

      if (err?.name !== 'AbortError') {
        toast({ title: ta('AI'), message: ta(`Using offline chat: ${msg}`), type: 'warning' });
        const aiRes = ai.respond(trimmed);
        const aiText = personalizeText(aiRes.text, profile, primaryContact);
        appendChatMessage({ id: uid('m'), from: 'ai', text: aiText, ts: new Date().toISOString(), meta: { ...aiRes, fallback: true } });
        evaluateConversation(aiRes);
        speak(aiText, { rate: 0.8 });
      }
    } finally {
      setThinking(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const toSend = input;
    setInput('');
    send(toSend);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">{ta('Daily Companion')}</h2>
          <p className="mt-1 text-slate-600">{ta('Warm, caring chat companion with full AI (optional) + offline fallback + voice.')}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-card bg-white shadow-card p-4 ring-1 ring-slate-100">
            <div className="text-xs font-semibold text-slate-500">{ta('Detected mood')}</div>
            <div className="mt-1 text-lg font-extrabold text-slate-900">{ta(mood)}</div>
          </div>
          <div className="rounded-card bg-white shadow-card p-4 ring-1 ring-slate-100">
            <div className="text-xs font-semibold text-slate-500">{ta('Conversation score')}</div>
            <div className={"mt-1 text-lg font-extrabold " + (score === 'Concerning' ? 'text-danger' : score === 'Engaging' ? 'text-success' : 'text-slate-900')}>
              {ta(score)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100 p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">{ta('Chat')}</h3>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700">
              <Sparkles aria-hidden="true" className="h-4 w-4" /> {badgeLabel}
            </div>
          </div>

          <div ref={listRef} className="mt-4 h-[440px] overflow-auto rounded-xl bg-slate-50 p-4" aria-label={ta('Chat messages')}>
            <div className="space-y-3">
              {(chat ?? []).map((m) => (
                <Bubble key={m.id} side={m.from === 'elder' ? 'right' : 'left'} text={m.text} time={formatTime(m.ts)} />
              ))}
              {thinking ? <Bubble side="left" text={ta('Thinking…')} time={formatTime(new Date().toISOString())} /> : null}
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-4 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-lg font-semibold focus:outline-none"
              placeholder={ta('Type a message…')}
              aria-label={ta('Message input')}
            />
            <VoiceButton
              onText={(t) => {
                if (t) {
                  setInput('');
                  send(t);
                }
              }}
              lang={langToSpeechLocale(profile?.language)}
              ariaLabel={ta('Voice input for chat')}
            />
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-4 text-white font-extrabold shadow transition hover:brightness-110 focus:outline-none"
              aria-label={ta('Send message')}
            >
              <Send aria-hidden="true" />
            </button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2" aria-label={ta('Quick actions')}>
            {QUICK.map((q) => (
              <button
                key={q}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm font-extrabold text-slate-800 hover:bg-slate-200 focus:outline-none"
                onClick={() => send(q)}
                type="button"
                aria-label={ta(`Quick action: ${q}`)}
              >
                {ta(q)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100 p-5">
            <h3 className="text-lg font-bold">{ta('Entertainment (Offline)')}</h3>
            <div className="mt-3 space-y-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="font-extrabold">{ta('Playlist')}</div>
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  {SONGS.map((s) => (
                    <div key={s} className="flex items-center justify-between">
                      <span>{s}</span>
                      <button className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-extrabold text-white" onClick={() => send(`Play song ${s}`)} type="button" aria-label={ta(`Play ${s}`)}>
                        {ta('Play')}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-slate-500">{ta('These are suggestions. Use your phone/player if you want to listen.')}</div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="font-extrabold">{ta('Stories')}</div>
                <div className="mt-2 space-y-2">
                  {STORIES.map((s, i) => (
                    <button key={i} className="w-full rounded-lg bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 shadow" onClick={() => send('Tell me a story')} type="button" aria-label={ta('Tell a story')}>
                      {ta(s).slice(0, 55)}…
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <div className="font-extrabold">{ta('Jokes')}</div>
                <div className="mt-2 text-sm text-slate-700">{ta('Tap to hear a joke.')}</div>
                <button className="mt-2 w-full rounded-lg bg-primary px-4 py-2 text-sm font-extrabold text-white" onClick={() => send('Tell me a joke')} type="button" aria-label={ta('Tell me a joke')}>
                  {ta('Tell me a joke')}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-card bg-white shadow-card ring-1 ring-slate-100 p-5">
            <h3 className="text-lg font-bold">{ta('Recommendation')}</h3>
            <div className="mt-2 text-slate-700">
              {mood === 'Lonely/Sad'
                ? ta(`Would you like to call ${primaryContact?.name || 'your family contact'} now?`)
                : ta('Keep a gentle routine: water, steps, and rest.')}
            </div>
            {mood === 'Lonely/Sad' ? (
              <div className="mt-3">
                <button
                  className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-extrabold text-white"
                  onClick={() => {
                    const ok = startPhoneCall(primaryContact?.phone, { label: primaryContact?.name || 'Family contact', toast });
                    if (!ok) toast({ title: ta('Call'), message: ta('No phone number set in Profile → Contacts.'), type: 'warning' });
                  }}
                  type="button"
                  aria-label={ta('Call family contact')}
                >
                  {ta('Call now')}
                </button>
              </div>
            ) : null}
            <div className="mt-4">
              <EmergencyButton onPress={() => triggerEmergency(ta('Manual emergency from Daily Companion'))} size="lg" label={ta('Emergency Help')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({ side, text, time }) {
  const isRight = side === 'right';
  return (
    <div className={"flex " + (isRight ? 'justify-end' : 'justify-start')}>
      <div className={"max-w-[82%] rounded-2xl px-4 py-3 shadow-sm " + (isRight ? 'bg-primary text-white' : 'bg-white text-slate-900')}>
        <div className="text-lg leading-relaxed">{text}</div>
        <div className={"mt-1 text-xs " + (isRight ? 'text-white/80' : 'text-slate-500')}>{time}</div>
      </div>
    </div>
  );
}
