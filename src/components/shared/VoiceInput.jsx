import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { startRecording, stopRecording } from '../../utils/voiceRecording.js';

export default function VoiceInput({ placeholder = 'Hold to record or type note', onSave }) {
  const [value, setValue] = useState('');
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recorderRef.current) stopRecording(recorderRef.current);
    };
  }, []);

  const handleRecordToggle = async () => {
    if (recording) {
      stopRecording(recorderRef.current);
      setRecording(false);
      recorderRef.current = null;
      return;
    }
    const rec = await startRecording();
    if (rec) {
      recorderRef.current = rec;
      setRecording(true);
    }
  };

  const handleSave = () => {
    if (!value.trim()) return;
    onSave?.({ text: value.trim(), createdAt: new Date().toISOString() });
    setValue('');
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
      <div className="flex items-center" style={{ gap: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
        <button
          type="button"
          onClick={handleRecordToggle}
          className={
            'inline-flex items-center justify-center rounded-xl text-white transition ' +
            (recording ? 'bg-danger animate-pulseSoft' : 'bg-slate-900 hover:bg-slate-800')
          }
          style={{ height: 'clamp(2.5rem, 10vw, 3rem)', width: 'clamp(2.5rem, 10vw, 3rem)', minHeight: '44px', minWidth: '44px' }}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
        >
          {recording ? React.cloneElement(<Square />, { style: { width: 'clamp(1.25rem, 5vw, 1.5rem)', height: 'clamp(1.25rem, 5vw, 1.5rem)' } }) : React.cloneElement(<Mic />, { style: { width: 'clamp(1.25rem, 5vw, 1.5rem)', height: 'clamp(1.25rem, 5vw, 1.5rem)' } })}
        </button>
        <input
          className="flex-1 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:border-primary focus:outline-none"
          style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-primary font-extrabold text-white"
          style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }}
          aria-label="Save note"
        >
          Save
        </button>
      </div>
      <div className="mt-2 text-slate-500" style={{ fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)' }}>Hold mic to record audio. Text saves instantly; audio saves when you release.</div>
    </div>
  );
}

