import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, Shield, Users, Mic, CalendarDays, Siren } from 'lucide-react';
import { useI18n } from '../i18n/i18n.js';

export default function LandingPage() {
  const { t } = useI18n();
  return (
    <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-primary/10 via-white to-success/10 p-6 shadow-card ring-1 ring-slate-100 sm:p-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-success/10 blur-3xl" />
      </div>

      <div className="relative">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            {t('app.title')}
            <span className="block text-slate-700">{t('landing.tagline')}</span>
          </h1>
          <p className="mt-4 text-lg text-slate-700">
            {t('landing.intro')}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              to="/family"
              className="inline-flex h-14 items-center justify-center rounded-xl bg-slate-900 px-6 text-base font-extrabold text-white shadow-card transition hover:bg-slate-800 focus:outline-none"
              aria-label={t('landing.openFamily')}
            >
              {t('nav.family')}
            </Link>
            <Link
              to="/elder"
              className="inline-flex h-14 items-center justify-center rounded-xl bg-primary px-6 text-base font-extrabold text-white shadow-card transition hover:brightness-110 focus:outline-none"
              aria-label={t('landing.openElder')}
            >
              {t('nav.elder')}
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Feature icon={<Shield aria-hidden="true" />} title={t('landing.featuresTitle1')} desc={t('landing.featuresDesc1')} />
            <Feature icon={<Mic aria-hidden="true" />} title={t('landing.featuresTitle2')} desc={t('landing.featuresDesc2')} />
            <Feature icon={<HeartPulse aria-hidden="true" />} title={t('landing.featuresTitle3')} desc={t('landing.featuresDesc3')} />
            <Feature icon={<Siren aria-hidden="true" />} title={t('landing.featuresTitle4')} desc={t('landing.featuresDesc4')} />
            <Feature icon={<CalendarDays aria-hidden="true" />} title={t('landing.featuresTitle5')} desc={t('landing.featuresDesc5')} />
            <Feature icon={<Users aria-hidden="true" />} title={t('landing.featuresTitle6')} desc={t('landing.featuresDesc6')} />
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Stat value="140M" label={t('landing.statElderly')} />
          <Stat value="50K" label={t('landing.statFallsDaily')} />
        </div>

        <div className="mt-10 rounded-2xl bg-white/70 p-5 ring-1 ring-slate-200/60 backdrop-blur">
          <div className="text-sm font-extrabold text-slate-900">{t('landing.offlinePromiseTitle')}</div>
          <div className="mt-2 text-slate-700">
            {t('landing.offlinePromiseBody')}
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-slate-200/60 transition hover:translate-y-[-1px]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-700">{icon}</div>
        <div>
          <div className="text-base font-extrabold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-700">{desc}</div>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-card">
      <div className="text-4xl font-extrabold">{value}</div>
      <div className="mt-1 text-white/80">{label}</div>
    </div>
  );
}
