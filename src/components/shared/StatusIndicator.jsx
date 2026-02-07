import React from 'react';

const map = {
  active: 'bg-success',
  inactive: 'bg-slate-300',
  alert: 'bg-danger'
};

export default function StatusIndicator({ status = 'active' }) {
  const color = map[status] ?? map.active;
  return (
    <span className="relative inline-flex h-3 w-3" aria-label={`Status: ${status}`}>
      <span className={`absolute inline-flex h-full w-full rounded-full ${color} opacity-50 animate-pulseSoft`} />
      <span className={`relative inline-flex h-3 w-3 rounded-full ${color}`} />
    </span>
  );
}

