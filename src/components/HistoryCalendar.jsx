import React, { useMemo } from 'react';
import { useI18n } from '../i18n/i18n.js';

export default function HistoryCalendar({ logs, medicines }) {
  const { ta } = useI18n();

  const calendarMonths = useMemo(() => {
    const today = new Date();
    const months = [];
    
    // Generate current month and previous month
    for (let i = 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      // Get first day of month (0 = Sunday, 1 = Monday, etc.)
      const firstDay = date.getDay();
      
      // Get number of days in month
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // Create array of all dates for this month
      const dates = [];
      
      // Add empty slots for days before month starts
      for (let j = 0; j < firstDay; j++) {
        dates.push(null);
      }
      
      // Add all days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dates.push(dateStr);
      }
      
      months.push({ monthName, dates });
    }
    
    return months;
  }, []);

  const getTone = (date) => {
    if (!date) return 'empty';
    const day = logs[date];
    if (!day || Object.keys(day).length === 0) return 'none';
    const entries = Object.values(day);
    const total = entries.length;
    if (!total) return 'none';
    const taken = entries.filter((e) => e.status === 'taken').length;
    const missed = entries.filter((e) => e.status === 'missed').length;
    if (missed === 0 && taken === total) return 'good';
    if (missed === 0 && taken < total) return 'partial';
    if (missed > 0 && missed < total) return 'warn';
    if (missed === total) return 'bad';
    return 'none';
  };

  const tones = {
    good: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    partial: 'bg-amber-100 text-amber-900 border-amber-300',
    warn: 'bg-orange-100 text-orange-900 border-orange-300',
    bad: 'bg-red-100 text-red-900 border-red-300',
    none: 'bg-slate-100 text-slate-900 border-slate-300',
    empty: 'bg-transparent border-transparent'
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white shadow-card border-2 border-slate-700" style={{ 
      marginTop: 'clamp(1rem, 3vw, 1.5rem)',
      borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
      padding: 'clamp(0.875rem, 3vw, 1rem)'
    }}>
      <div className="flex items-start justify-between" style={{ gap: 'clamp(0.75rem, 2vw, 1rem)', marginBottom: 'clamp(0.75rem, 2vw, 1rem)' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 6vw, 1.875rem)', fontWeight: '900' }}>{ta('Medicine History Calendar')}</h2>
        
        <div className="bg-white border border-slate-600 shadow-sm" style={{ 
          borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
          padding: 'clamp(0.625rem, 2vw, 0.75rem)'
        }}>
          <div className="text-slate-700" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)', fontWeight: '700', marginBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>{ta('Legend')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.25rem, 1vw, 0.375rem)' }}>
            <div className="flex items-center" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
              <div className="rounded bg-emerald-100 border border-emerald-300" style={{ height: 'clamp(0.875rem, 3vw, 1rem)', width: 'clamp(0.875rem, 3vw, 1rem)' }}></div>
              <span className="text-slate-700" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)', fontWeight: '600' }}>{ta('All taken')}</span>
            </div>
            <div className="flex items-center" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
              <div className="rounded bg-amber-100 border border-amber-300" style={{ height: 'clamp(0.875rem, 3vw, 1rem)', width: 'clamp(0.875rem, 3vw, 1rem)' }}></div>
              <span className="text-slate-700" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)', fontWeight: '600' }}>{ta('Partial')}</span>
            </div>
            <div className="flex items-center" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
              <div className="rounded bg-orange-100 border border-orange-300" style={{ height: 'clamp(0.875rem, 3vw, 1rem)', width: 'clamp(0.875rem, 3vw, 1rem)' }}></div>
              <span className="text-slate-700" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)', fontWeight: '600' }}>{ta('Some missed')}</span>
            </div>
            <div className="flex items-center" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
              <div className="rounded bg-red-100 border border-red-300" style={{ height: 'clamp(0.875rem, 3vw, 1rem)', width: 'clamp(0.875rem, 3vw, 1rem)' }}></div>
              <span className="text-slate-700" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)', fontWeight: '600' }}>{ta('All missed')}</span>
            </div>
            <div className="flex items-center" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
              <div className="rounded bg-slate-100 border border-slate-300" style={{ height: 'clamp(0.875rem, 3vw, 1rem)', width: 'clamp(0.875rem, 3vw, 1rem)' }}></div>
              <span className="text-slate-700" style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.75rem)', fontWeight: '600' }}>{ta('No data')}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1.5rem, 4vw, 2rem)' }}>
        {calendarMonths.map((month, idx) => (
          <div key={idx}>
            <h3 className="text-slate-900" style={{ fontSize: 'clamp(1rem, 4vw, 1.25rem)', fontWeight: '700', marginBottom: 'clamp(0.625rem, 2vw, 0.75rem)' }}>{month.monthName}</h3>
            
            {/* Day names header */}
            <div className="grid grid-cols-7" style={{ gap: 'clamp(0.375rem, 1vw, 0.5rem)', marginBottom: 'clamp(0.375rem, 1vw, 0.5rem)' }}>
              {dayNames.map((day) => (
                <div key={day} className="text-center text-slate-600" style={{ fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)', fontWeight: '700', padding: 'clamp(0.375rem, 1vw, 0.5rem) 0' }}>
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7" style={{ gap: 'clamp(0.375rem, 1vw, 0.5rem)' }}>
              {month.dates.map((date, dateIdx) => {
                const tone = tones[getTone(date)];
                const dayNumber = date ? new Date(date).getDate() : '';
                
                return (
                  <div 
                    key={dateIdx} 
                    className={`aspect-square border text-center ${tone} ${!date ? 'invisible' : ''}`}
                    style={{ 
                      borderRadius: 'clamp(0.375rem, 1.5vw, 0.5rem)',
                      padding: 'clamp(0.375rem, 1vw, 0.5rem)'
                    }}
                  >
                    <div style={{ fontSize: 'clamp(0.9rem, 3.5vw, 1.125rem)', fontWeight: '800' }}>{dayNumber}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

