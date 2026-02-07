import React, { useEffect, useState } from 'react';
import { ArrowLeft, Cog, Languages } from 'lucide-react';
import { colors, fonts } from '../../styles/theme.js';
import { getItem, storageKeys, subscribe } from '../../utils/storageUtils.js';
import { useI18n } from '../../i18n/i18n.js';

export default function Header({ currentPage, onBack, showBack = false, onSettings }) {
  const [now, setNow] = useState(new Date());
  const [name, setName] = useState('Lakshmi Amma');
  const { lang, setLang, ta } = useI18n();

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000 * 30);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const profile = getItem(storageKeys.profile, null);
    if (profile?.name) setName(profile.name);

    const unsubscribe = subscribe(storageKeys.profile, (next) => {
      if (next?.name) {
        setName(next.name);
      }
    });

    return () => unsubscribe?.();
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-white/20 bg-white/70 backdrop-blur-xl shadow-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between" style={{ padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 3vw, 1rem)' }}>
        <div className="flex items-center" style={{ gap: 'clamp(0.5rem, 2vw, 0.625rem)' }}>
          {showBack ? (
            <button
              type="button"
              onClick={onBack}
              className="rounded-full bg-white/60 backdrop-blur-md border border-white/30 text-slate-800 hover:bg-white/80 shadow-md transition-all"
              style={{ 
                padding: 'clamp(0.375rem, 1.5vw, 0.5rem)',
                minWidth: 'clamp(36px, 10vw, 44px)',
                minHeight: 'clamp(36px, 10vw, 44px)'
              }}
              aria-label="Go back"
            >
              <ArrowLeft style={{ width: 'clamp(1.25rem, 5vw, 1.5rem)', height: 'clamp(1.25rem, 5vw, 1.5rem)' }} />
            </button>
          ) : null}
          <div>
            <div style={{ fontSize: 'clamp(1.25rem, 5vw, 1.875rem)', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
              ElderAI Swarm
            </div>
            <div style={{ fontSize: 'clamp(0.875rem, 3vw, 1rem)', fontWeight: '700', color: '#334155', lineHeight: 1.3 }}>
              {ta('Hello')}, {name}! 😊
            </div>
            <div style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)', fontWeight: '600', color: '#64748b', textTransform: 'capitalize', lineHeight: 1.2 }}>
              {ta(labelForPage(currentPage))}
            </div>
          </div>
        </div>
        <div className="flex items-center text-right" style={{ gap: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
          <label className="hidden items-center rounded-lg border border-white/30 bg-white/60 backdrop-blur-md shadow-md sm:flex" style={{ 
            gap: 'clamp(0.375rem, 1.5vw, 0.5rem)',
            padding: 'clamp(0.25rem, 1.5vw, 0.375rem) clamp(0.5rem, 2vw, 0.625rem)',
            fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)',
            fontWeight: '600',
            color: '#334155'
          }}>
            <Languages style={{ width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' }} />
            <select
              className="rounded border border-white/30 bg-white/60 backdrop-blur-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{ 
                padding: 'clamp(0.125rem, 1vw, 0.25rem) clamp(0.25rem, 1.5vw, 0.375rem)',
                fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)',
                fontWeight: '700'
              }}
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label={ta('Choose language')}
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
              <option value="kn">Kannada</option>
              <option value="ml">Malayalam</option>
              <option value="mr">Marathi</option>
              <option value="bn">Bengali</option>
            </select>
          </label>
          <div style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)', fontWeight: '600', color: '#475569' }}>
            <div style={{ fontSize: 'clamp(0.65rem, 2vw, 0.6875rem)' }}>{now.toLocaleDateString()}</div>
            <div style={{ fontSize: 'clamp(0.8rem, 3vw, 0.875rem)', color: '#334155', fontWeight: '700' }}>
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <button
            type="button"
            onClick={onSettings}
            className="rounded-full bg-white/60 backdrop-blur-md border border-white/30 text-slate-800 hover:bg-white/80 shadow-md transition-all"
            style={{ 
              padding: 'clamp(0.375rem, 1.5vw, 0.5rem)',
              minWidth: 'clamp(36px, 10vw, 44px)',
              minHeight: 'clamp(36px, 10vw, 44px)'
            }}
            aria-label="Settings"
          >
            <Cog style={{ width: 'clamp(1.25rem, 5vw, 1.75rem)', height: 'clamp(1.25rem, 5vw, 1.75rem)' }} />
          </button>
        </div>
      </div>
    </header>
  );
}

function labelForPage(page) {
  switch (page) {
    case 'medicine':
      return 'Medicine Buddy';
    case 'health':
      return 'Health Guardian';
    case 'emergency':
      return 'Emergency Responder';
    case 'life':
      return 'Life Coordinator';
    case 'companion':
      return 'Daily Companion';
    case 'settings':
      return 'Settings & Help';
    case 'onboarding':
      return 'Welcome';
    default:
      return 'Home';
  }
}

