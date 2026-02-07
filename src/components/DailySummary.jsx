import React from 'react';
import { CheckCircle2, AlertTriangle, BarChart3 } from 'lucide-react';
import { useI18n } from '../i18n/i18n.js';

export default function DailySummary({ summary, yesterday, weekly }) {
  const { ta } = useI18n();
  return (
    <div className="grid sm:grid-cols-3" style={{ marginTop: 'clamp(1rem, 3vw, 1.5rem)', gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
      <SummaryCard
        title={ta('Today')}
        subtitle={ta('Taken • Pending • Missed')}
        primary={ta(`${summary.taken}/${summary.total} taken`)}
        detail={ta(`Pending ${summary.pending} • Missed ${summary.missed}`)}
        tone={summary.missed > 0 ? 'warn' : 'ok'}
      />
      <SummaryCard
        title={ta('Yesterday')}
        subtitle={ta('Quick recap')}
        primary={ta(`${yesterday.taken}/${yesterday.total || 0} taken`)}
        detail={ta(`Pending ${yesterday.pending || 0} • Missed ${yesterday.missed || 0}`)}
        tone={yesterday.missed > 0 ? 'warn' : 'muted'}
      />
      <SummaryCard
        title={ta('Weekly')}
        subtitle={ta('Perfect days')}
        primary={ta(`${weekly.perfect}/${weekly.totalDays || 7} days`)}
        detail={ta(`Compliance ${weekly.percent}%`)}
        tone={weekly.percent >= 80 ? 'ok' : 'warn'}
      />
    </div>
  );
}

function SummaryCard({ title, subtitle, primary, detail, tone = 'ok' }) {
  const color = tone === 'ok' ? 'text-emerald-900 bg-emerald-100 border-emerald-300' : tone === 'warn' ? 'text-amber-900 bg-amber-100 border-amber-300' : 'text-slate-900 bg-slate-100 border-slate-300';
  const Icon = tone === 'ok' ? CheckCircle2 : tone === 'warn' ? AlertTriangle : BarChart3;

  return (
    <div className={`border ${color} shadow-card ring-1 ring-black/5`} style={{ 
      borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
      padding: 'clamp(0.875rem, 3vw, 1rem)'
    }}>
      <div className="flex items-center" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(1rem, 4vw, 1.25rem)', fontWeight: '800' }}>
        {React.cloneElement(<Icon aria-hidden="true" />, { 
          style: { width: 'clamp(1.25rem, 5vw, 1.75rem)', height: 'clamp(1.25rem, 5vw, 1.75rem)' } 
        })} {title}
      </div>
      <div className="text-slate-700" style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)', fontWeight: '600', marginTop: 'clamp(0.25rem, 1vw, 0.375rem)' }}>{subtitle}</div>
      <div style={{ marginTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(1.5rem, 6vw, 1.875rem)', fontWeight: '900', lineHeight: 1.2 }}>{primary}</div>
      <div className="text-slate-800" style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)', fontWeight: '600', marginTop: 'clamp(0.25rem, 1vw, 0.375rem)' }}>{detail}</div>
    </div>
  );
}

