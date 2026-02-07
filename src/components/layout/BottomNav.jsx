import React from 'react';
import { Bot, HeartPulse, Home, Pill, ShieldCheck, Sparkles } from 'lucide-react';

const tabs = [
  { key: 'home', label: 'Home', icon: <Home className="h-5 w-5" /> },
  { key: 'medicine', label: 'Medicine', icon: <Pill className="h-5 w-5" /> },
  { key: 'health', label: 'Health', icon: <HeartPulse className="h-5 w-5" /> },
  { key: 'life', label: 'Life', icon: <Sparkles className="h-5 w-5" /> },
  { key: 'companion', label: 'Companion', icon: <Bot className="h-5 w-5" /> },
  { key: 'emergency', label: 'Emergency', icon: <ShieldCheck className="h-5 w-5" /> }
];

export default function BottomNav({ current, onChange }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/20 bg-white/70 backdrop-blur-xl shadow-[0_-4px_16px_rgba(0,0,0,0.1)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between" style={{ 
        gap: 'clamp(0.25rem, 1vw, 0.375rem)',
        padding: 'clamp(0.375rem, 1.5vw, 0.5rem) clamp(0.75rem, 3vw, 1rem)'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`flex flex-1 flex-col items-center justify-center rounded-lg border transition-all ${
              current === tab.key ? 'bg-slate-900/90 backdrop-blur-md text-white border-slate-900/50 shadow-lg' : 'bg-white/60 backdrop-blur-md text-slate-800 hover:bg-white/80 border-white/40 shadow-md'
            }`}
            style={{
              height: 'clamp(3rem, 12vw, 3.5rem)',
              minWidth: 'clamp(50px, 14vw, 60px)',
              fontSize: 'clamp(0.65rem, 2.5vw, 0.75rem)',
              fontWeight: '600',
              padding: 'clamp(0.25rem, 1vw, 0.375rem)'
            }}
            aria-label={tab.label}
          >
            <div style={{ 
              width: 'clamp(1rem, 4vw, 1.25rem)', 
              height: 'clamp(1rem, 4vw, 1.25rem)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {React.cloneElement(tab.icon, { 
                style: { 
                  width: 'clamp(1rem, 4vw, 1.25rem)', 
                  height: 'clamp(1rem, 4vw, 1.25rem)' 
                } 
              })}
            </div>
            <span style={{ marginTop: 'clamp(0.125rem, 0.5vw, 0.25rem)', lineHeight: 1 }}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}

