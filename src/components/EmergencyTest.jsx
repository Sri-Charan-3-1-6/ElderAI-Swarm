import React from 'react';
import { TestTube, Play } from 'lucide-react';
import { useI18n } from '../i18n/i18n.js';

export default function EmergencyTest({ onStart }) {
  const { ta } = useI18n();
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card border-2 border-slate-700">
      <div className="flex items-center gap-2 text-3xl font-black">
        <TestTube className="h-7 w-7" aria-hidden /> {ta('Test Emergency System')}
      </div>
      <p className="mt-1 text-lg font-semibold text-slate-600">
        {ta('Runs the full flow without real calls or SMS. Use this to train and stay calm.')}
      </p>
      <button
        type="button"
        onClick={() => onStart?.()}
        className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-xl font-black text-white shadow-lg hover:brightness-110"
      >
        <Play className="h-6 w-6" aria-hidden /> {ta('Start Test Mode')}
      </button>
    </div>
  );
}

