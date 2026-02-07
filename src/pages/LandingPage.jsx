import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, Shield, Users, Mic, CalendarDays, Siren } from 'lucide-react';
import { useI18n } from '../i18n/i18n.js';

export default function LandingPage() {
  const { t } = useI18n();
  return (
    <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-primary/10 via-white to-success/10 shadow-card border-2 border-slate-700" style={{ padding: 'clamp(1rem, 4vw, 2.5rem)' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-success/10 blur-3xl" />
      </div>

      <div className="relative">
        <div className="max-w-3xl">
          <h1 className="font-extrabold tracking-tight" style={{ fontSize: 'clamp(2rem, 8vw, 3rem)', lineHeight: '1.2' }}>
            {t('app.title')}
            <span className="block text-slate-700">{t('landing.tagline')}</span>
          </h1>
          <p className="mt-4 text-slate-700" style={{ fontSize: 'clamp(1rem, 4vw, 1.125rem)' }}>
            {t('landing.intro')}
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
            <Link
              to="/family"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 font-extrabold text-white shadow-card transition hover:bg-slate-800 focus:outline-none"
              style={{ height: 'clamp(3rem, 10vw, 3.5rem)', padding: '0 clamp(1rem, 4vw, 1.5rem)', fontSize: 'clamp(0.875rem, 3.5vw, 1rem)', minHeight: '44px' }}
              aria-label={t('landing.openFamily')}
            >
              {t('nav.family')}
            </Link>
            <Link
              to="/elder"
              className="inline-flex items-center justify-center rounded-xl bg-primary font-extrabold text-white shadow-card transition hover:brightness-110 focus:outline-none"
              style={{ height: 'clamp(3rem, 10vw, 3.5rem)', padding: '0 clamp(1rem, 4vw, 1.5rem)', fontSize: 'clamp(0.875rem, 3.5vw, 1rem)', minHeight: '44px' }}
              aria-label={t('landing.openElder')}
            >
              {t('nav.elder')}
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
            <Feature icon={React.cloneElement(<Shield />, { 'aria-hidden': true, style: { width: 'clamp(1rem, 4vw, 1.5rem)', height: 'clamp(1rem, 4vw, 1.5rem)' } })} title={t('landing.featuresTitle1')} desc={t('landing.featuresDesc1')} />
            <Feature icon={React.cloneElement(<Mic />, { 'aria-hidden': true, style: { width: 'clamp(1rem, 4vw, 1.5rem)', height: 'clamp(1rem, 4vw, 1.5rem)' } })} title={t('landing.featuresTitle2')} desc={t('landing.featuresDesc2')} />
            <Feature icon={React.cloneElement(<HeartPulse />, { 'aria-hidden': true, style: { width: 'clamp(1rem, 4vw, 1.5rem)', height: 'clamp(1rem, 4vw, 1.5rem)' } })} title={t('landing.featuresTitle3')} desc={t('landing.featuresDesc3')} />
            <Feature icon={React.cloneElement(<Siren />, { 'aria-hidden': true, style: { width: 'clamp(1rem, 4vw, 1.5rem)', height: 'clamp(1rem, 4vw, 1.5rem)' } })} title={t('landing.featuresTitle4')} desc={t('landing.featuresDesc4')} />
            <Feature icon={React.cloneElement(<CalendarDays />, { 'aria-hidden': true, style: { width: 'clamp(1rem, 4vw, 1.5rem)', height: 'clamp(1rem, 4vw, 1.5rem)' } })} title={t('landing.featuresTitle5')} desc={t('landing.featuresDesc5')} />
            <Feature icon={React.cloneElement(<Users />, { 'aria-hidden': true, style: { width: 'clamp(1rem, 4vw, 1.5rem)', height: 'clamp(1rem, 4vw, 1.5rem)' } })} title={t('landing.featuresTitle6')} desc={t('landing.featuresDesc6')} />
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
          <Stat value="140M" label={t('landing.statElderly')} />
          <Stat value="50K" label={t('landing.statFallsDaily')} />
        </div>

        <div className="mt-10 rounded-2xl bg-white/70 border-2 border-slate-700 backdrop-blur" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
          <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{t('landing.offlinePromiseTitle')}</div>
          <div className="mt-2 text-slate-700" style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>
            {t('landing.offlinePromiseBody')}
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className="rounded-2xl bg-white/70 shadow-sm border-2 border-slate-700 transition hover:translate-y-[-1px]" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
      <div className="flex items-start" style={{ gap: 'clamp(0.625rem, 2vw, 0.75rem)' }}>
        <div className="flex items-center justify-center rounded-xl bg-white text-slate-700 border border-slate-600" style={{ width: 'clamp(2.5rem, 9vw, 2.75rem)', height: 'clamp(2.5rem, 9vw, 2.75rem)' }}>{icon}</div>
        <div>
          <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>{title}</div>
          <div className="mt-1 text-slate-700" style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{desc}</div>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl bg-slate-900 text-white shadow-card" style={{ padding: 'clamp(1rem, 4vw, 1.5rem)' }}>
      <div className="font-extrabold" style={{ fontSize: 'clamp(2rem, 8vw, 2.25rem)' }}>{value}</div>
      <div className="mt-1 text-white/80" style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>{label}</div>
    </div>
  );
}

