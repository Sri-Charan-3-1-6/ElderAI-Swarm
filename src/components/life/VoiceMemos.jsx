import React, { useEffect, useState } from 'react';
import { Play, Trash2 } from 'lucide-react';
import VoiceInput from '../shared/VoiceInput.jsx';
import { deleteMemo, loadMemos, saveMemos } from '../../utils/voiceRecording.js';
import { useI18n } from '../../i18n/i18n.js';

export default function VoiceMemos() {
  const { ta } = useI18n();
  const [memos, setMemos] = useState(() => loadMemos());

  useEffect(() => {
    saveMemos(memos);
  }, [memos]);

  const addText = (memo) => {
    setMemos((prev) => [{ id: Date.now(), ...memo }, ...prev].slice(0, 100));
  };

  const remove = (id) => {
    deleteMemo(id);
    setMemos((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)', gap: 'clamp(0.5rem, 2vw, 0.75rem)', display: 'flex', flexDirection: 'column' }}>
      <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>{ta('Voice Memos / Notes')}</div>
      <VoiceInput onSave={addText} />
      <div className="font-semibold text-slate-700" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>Audio saves when you release the mic. Text saves instantly.</div>
      <div style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', display: 'flex', flexDirection: 'column' }}>
        {memos.map((m) => (
          <div key={m.id} className="rounded-xl border border-slate-200 bg-white flex items-center justify-between" style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
            <div>
              <div className="font-bold text-slate-600" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{new Date(m.createdAt).toLocaleString()}</div>
              {m.text ? <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>{m.text}</div> : null}
            </div>
            <div className="flex items-center" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
              {m.audio ? (
                <button className="rounded-full bg-slate-900 text-white" style={{ padding: 'clamp(0.375rem, 1.5vw, 0.5rem)', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => new Audio(m.audio).play()} aria-label="Play memo">
                  {React.cloneElement(<Play />, { style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })}
                </button>
              ) : null}
              <button className="rounded-full bg-danger/10 text-danger" style={{ padding: 'clamp(0.375rem, 1.5vw, 0.5rem)', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => remove(m.id)} aria-label="Delete memo">
                {React.cloneElement(<Trash2 />, { style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

