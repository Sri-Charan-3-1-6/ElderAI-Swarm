import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { isSpeechSupported, speak, startRecognition } from '../../utils/speechUtils.js';
import { useI18n } from '../../i18n/i18n.js';
import { toSpeechLocale, translateText } from '../../utils/translateUtils.js';

export default function VoiceButton({
  onText,
  lang = 'en-IN',
  continuous = false,
  variant = 'compact',
  ariaLabel = 'Voice input',
  translateFrom,
  translateTo,
  speakTranslation = false,
  onTranslation
}) {
  const { t } = useI18n();
  const support = useMemo(() => isSpeechSupported(), []);
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    return () => {
      try {
        recRef.current?.stop?.();
      } catch {
        // ignore
      }

      try {
        abortRef.current?.abort?.();
      } catch {
        // ignore
      }
    };
  }, []);

  const toggle = () => {
    if (!support.recognition) {
      onText?.('');
      return;
    }

    if (listening) {
      try {
        recRef.current?.stop?.();
      } catch {
        // ignore
      }
      try {
        abortRef.current?.abort?.();
      } catch {
        // ignore
      }
      recRef.current = null;
      setListening(false);
      return;
    }

    const rec = startRecognition({
      lang,
      continuous,
      onResult: async (text) => {
        if (!continuous) {
          setListening(false);
          recRef.current = null;
        }

        const raw = String(text || '');
        onText?.(raw);

        const from = translateFrom;
        const to = translateTo;
        if (to && from && String(from).toLowerCase() !== String(to).toLowerCase()) {
          try {
            abortRef.current?.abort?.();
          } catch {
            // ignore
          }

          const controller = new AbortController();
          abortRef.current = controller;
          const translated = await translateText({ text: raw, from, to, signal: controller.signal });
          if (abortRef.current !== controller) return;
          onTranslation?.(translated);
          if (speakTranslation) {
            speak(translated, { lang: toSpeechLocale(to) });
          }
        }
      },
      onEnd: () => {
        if (!continuous) setListening(false);
      },
      onError: () => setListening(false)
    });

    if (rec) {
      recRef.current = rec;
      setListening(true);
    }
  };

  const base =
    variant === 'elder'
      ? 'h-[120px] rounded-2xl text-2xl'
      : variant === 'fab'
      ? 'h-14 w-14 rounded-full'
      : 'h-10 w-10 rounded-full';

  const label = !support.recognition ? t('common.micNA') : listening ? t('common.listening') : '';

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-bold shadow-card transition hover:bg-slate-800 focus:outline-none ${base}`}
      aria-label={ariaLabel}
    >
      {listening ? <Mic aria-hidden="true" /> : <MicOff aria-hidden="true" />}
      {variant === 'elder' ? <span>{listening ? t('common.listening') : t('common.voice')}</span> : null}
      {variant !== 'elder' && label ? <span className="sr-only">{label}</span> : null}
    </button>
  );
}

