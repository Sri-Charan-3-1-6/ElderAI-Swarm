import React from 'react';
import { Siren } from 'lucide-react';
import { useI18n } from '../../i18n/i18n.js';

export default function EmergencyButton({ onPress, size = 'md', label = 'Emergency Help' }) {
  const { ta } = useI18n();
  const cls =
    size === 'xl'
      ? 'h-[120px] text-2xl rounded-2xl'
      : size === 'lg'
      ? 'h-16 text-lg rounded-xl'
      : 'h-12 text-base rounded-lg';

  return (
    <button
      onClick={onPress}
      className={`w-full ${cls} bg-danger text-white font-extrabold shadow-card transition hover:brightness-110 focus:outline-none flex items-center justify-center gap-3`}
      aria-label={ta('Trigger emergency')}
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 animate-pulseSoft">
        <Siren aria-hidden="true" className="h-6 w-6" />
      </span>
      {label}
    </button>
  );
}
