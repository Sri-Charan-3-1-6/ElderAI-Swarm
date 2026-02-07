import React, { useMemo } from 'react';
import { Download, Printer } from 'lucide-react';
import { prepareDoctorReport } from '../../utils/healthCalculations.js';
import { useI18n } from '../../i18n/i18n.js';

export default function HealthReport({ checkIns, vitals, medicineCompliance, medicineMissCorrelation }) {
  const { ta } = useI18n();
  const reportText = useMemo(
    () => prepareDoctorReport({ checkIns, vitals, medicineCompliance, medicineMissCorrelation }),
    [checkIns, vitals, medicineCompliance, medicineMissCorrelation]
  );

  const downloadReport = () => {
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'doctor-report.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<pre>${reportText}</pre>`);
    win.document.close();
    win.focus();
    win.print();
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Health report', text: reportText });
      } catch {
        // ignore cancel
      }
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>{ta('Doctor Visit Preparation')}</h3>
          <p className="text-slate-600" style={{ fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>Summary of last 30 days. Share or print.</p>
        </div>
        <div className="flex items-center" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
          <button onClick={downloadReport} className="rounded-xl bg-slate-900 font-extrabold text-white" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }} aria-label="Download report">
            {React.cloneElement(<Download className="mr-1 inline" />, { style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })} Download
          </button>
          <button onClick={printReport} className="rounded-xl bg-slate-100 font-extrabold text-slate-900" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }} aria-label="Print report">
            {React.cloneElement(<Printer className="mr-1 inline" />, { style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })} Print
          </button>
        </div>
      </div>

      <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-white border border-slate-600 font-semibold text-slate-800" style={{ padding: 'clamp(0.75rem, 2.5vw, 1rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>{reportText}</pre>

      <button
        type="button"
        onClick={share}
        className="mt-3 w-full rounded-xl bg-primary font-extrabold text-white"
        style={{ paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }}
        aria-label="Share report"
      >
        Share with family / doctor
      </button>
    </div>
  );
}

