import React from 'react';
import { LineTrend, BarTrend } from '../shared/Chart.jsx';
import { toBPTrend, toFeelingBars, toSleepBars, toWeightTrend } from '../../utils/chartHelpers.js';

export default function HealthCharts({ checkIns = [], vitals = [] }) {
  const bpTrend = toBPTrend(vitals);
  const weightTrend = toWeightTrend(vitals);
  const feelingBars = toFeelingBars(checkIns);
  const sleepBars = toSleepBars(checkIns);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card title="Blood Pressure Trend (30 days)">
        <LineTrend data={bpTrend} lines={[{ dataKey: 'systolic', color: '#DC2626' }, { dataKey: 'diastolic', color: '#2563EB' }]} />
      </Card>

      <Card title="Weight Trend (90 days)">
        <LineTrend data={weightTrend} lines={[{ dataKey: 'weight', color: '#0EA5E9' }]} />
      </Card>

      <Card title="How you felt (7 days)">
        <BarTrend data={feelingBars} barKey="score" color="#22C55E" />
      </Card>

      <Card title="Sleep hours (7 days)">
        <BarTrend data={sleepBars} barKey="hours" color="#F59E0B" />
      </Card>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-lg font-extrabold text-slate-900">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

