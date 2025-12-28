function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function jitter(base, amplitude) {
  return base + rand(-amplitude, amplitude);
}

function round(n, dp = 0) {
  const m = 10 ** dp;
  return Math.round(n * m) / m;
}

export function buildInitialHealthState() {
  // 30 days: 24 readings/day => 720 heart rate points
  const now = new Date();
  const hr24PerDay = 24;
  const heartRate = [];
  const oxygen = [];
  const temperature = [];

  const bp = [];
  const steps = [];
  const sleep = [];
  const weight = [];

  let baseHR = 74;
  let baseO2 = 97.5;
  let baseTemp = 98.2;

  for (let day = 29; day >= 0; day--) {
    const dayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);

    // Steps per day
    const dailySteps = Math.round(clamp(jitter(2600 + (29 - day) * 8, 700), 800, 5200));
    steps.push({ dateISO: dayDate.toISOString(), steps: dailySteps });

    // Sleep hours
    const sleepHours = round(clamp(jitter(6.8, 0.8), 5.2, 8.5), 1);
    sleep.push({ dateISO: dayDate.toISOString(), hours: sleepHours });

    // Weight weekly
    if ((29 - day) % 7 === 0) {
      const w = round(clamp(jitter(62.5, 0.5), 60.8, 64.0), 1);
      weight.push({ dateISO: dayDate.toISOString(), kg: w });
    }

    // BP morning/evening
    const morningS = Math.round(clamp(jitter(128, 6), 118, 148));
    const morningD = Math.round(clamp(jitter(82, 4), 74, 92));
    const eveS = Math.round(clamp(jitter(132, 8), 120, 155));
    const eveD = Math.round(clamp(jitter(84, 5), 76, 96));
    bp.push(
      { dateISO: new Date(dayDate.getTime() + 8 * 60 * 60 * 1000).toISOString(), sys: morningS, dia: morningD },
      { dateISO: new Date(dayDate.getTime() + 19 * 60 * 60 * 1000).toISOString(), sys: eveS, dia: eveD }
    );

    // 24 HR readings/day
    for (let h = 0; h < hr24PerDay; h++) {
      const ts = new Date(dayDate.getTime() + h * 60 * 60 * 1000);
      const circadian = Math.sin((h / 24) * Math.PI * 2) * 4;
      let hr = clamp(jitter(baseHR + circadian, 3), 65, 88);
      let o2 = clamp(jitter(baseO2, 0.6), 95, 99);
      let temp = clamp(jitter(baseTemp, 0.2), 97.6, 99.4);

      // occasional spike/alert
      if (Math.random() < 0.02) {
        hr = clamp(hr + rand(8, 18), 65, 110);
      }
      if (Math.random() < 0.015) {
        o2 = clamp(o2 - rand(2.0, 3.5), 92, 99);
      }
      if (Math.random() < 0.01) {
        temp = clamp(temp + rand(0.6, 1.2), 97.6, 101.2);
      }

      heartRate.push({ tsISO: ts.toISOString(), bpm: Math.round(hr) });
      oxygen.push({ tsISO: ts.toISOString(), spo2: Math.round(o2) });
      temperature.push({ tsISO: ts.toISOString(), f: round(temp, 1) });
    }

    // slow drift
    baseHR = clamp(baseHR + rand(-0.1, 0.1), 70, 78);
    baseO2 = clamp(baseO2 + rand(-0.02, 0.02), 96.6, 98.4);
    baseTemp = clamp(baseTemp + rand(-0.02, 0.02), 98.0, 98.6);
  }

  return {
    heartRate,
    oxygen,
    temperature,
    bp,
    steps,
    sleep,
    weight,
    alerts: [],
    lastUpdatedISO: new Date().toISOString()
  };
}

export function computeHealthScore(latest) {
  // latest: { bpm, sys, dia, spo2, tempF }
  let score = 100;

  if (latest.bpm < 60 || latest.bpm > 95) score -= 12;
  if (latest.sys > 145 || latest.sys < 110) score -= 18;
  if (latest.dia > 95 || latest.dia < 70) score -= 12;
  if (latest.spo2 < 95) score -= 20;
  if (latest.tempF > 99.6) score -= 10;

  return clamp(Math.round(score), 0, 100);
}

export function tickHealth(healthState) {
  const now = new Date();
  const lastHR = healthState.heartRate?.[healthState.heartRate.length - 1]?.bpm ?? 74;
  const lastO2 = healthState.oxygen?.[healthState.oxygen.length - 1]?.spo2 ?? 98;
  const lastTemp = healthState.temperature?.[healthState.temperature.length - 1]?.f ?? 98.2;

  let bpm = clamp(Math.round(jitter(lastHR, 2.2)), 62, 95);
  let spo2 = clamp(Math.round(jitter(lastO2, 0.6)), 94, 99);
  let tempF = clamp(round(jitter(lastTemp, 0.15), 1), 97.6, 100.4);

  // occasional abnormal event
  let alert = null;
  if (Math.random() < 0.03) {
    bpm = clamp(bpm + Math.round(rand(8, 16)), 62, 110);
    alert = { type: 'warning', text: `Heart rate slightly elevated at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` };
  }
  if (!alert && Math.random() < 0.02) {
    const sys = clamp(Math.round(rand(140, 156)), 120, 170);
    const dia = clamp(Math.round(rand(88, 98)), 70, 110);
    alert = { type: 'warning', text: `Blood pressure slightly elevated at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` };
    healthState.bp = [...healthState.bp, { dateISO: now.toISOString(), sys, dia }].slice(-120);
  }

  const next = {
    ...healthState,
    heartRate: [...healthState.heartRate, { tsISO: now.toISOString(), bpm }].slice(-720),
    oxygen: [...healthState.oxygen, { tsISO: now.toISOString(), spo2 }].slice(-720),
    temperature: [...healthState.temperature, { tsISO: now.toISOString(), f: tempF }].slice(-720),
    lastUpdatedISO: now.toISOString()
  };

  if (alert) {
    next.alerts = [{ id: `${Date.now()}`, tsISO: now.toISOString(), ...alert }, ...(healthState.alerts ?? [])].slice(0, 20);
  }

  return next;
}

export function latestVitals(healthState) {
  const hr = healthState.heartRate?.[healthState.heartRate.length - 1]?.bpm ?? 74;
  const o2 = healthState.oxygen?.[healthState.oxygen.length - 1]?.spo2 ?? 98;
  const tempF = healthState.temperature?.[healthState.temperature.length - 1]?.f ?? 98.2;

  const lastBP = healthState.bp?.[healthState.bp.length - 1] ?? { sys: 128, dia: 82 };
  return { bpm: hr, spo2: o2, tempF, sys: lastBP.sys, dia: lastBP.dia };
}

export function chartLast24Hours(series, valueKey) {
  // series entries are newest at end
  const last = series.slice(-24);
  return last.map((p) => ({
    time: new Date(p.tsISO).toLocaleTimeString([], { hour: '2-digit' }),
    value: p[valueKey]
  }));
}

export function chartStepsWeek(stepsSeries) {
  const last7 = stepsSeries.slice(-7);
  return last7.map((d) => ({
    day: new Date(d.dateISO).toLocaleDateString([], { weekday: 'short' }),
    steps: d.steps
  }));
}

export function sleepBreakdown(sleepSeries) {
  const last7 = sleepSeries.slice(-7);
  const avg = last7.reduce((s, x) => s + (x.hours ?? 0), 0) / Math.max(1, last7.length);
  const deep = clamp(avg * 0.35, 2.0, 3.5);
  const light = clamp(avg * 0.5, 2.5, 4.5);
  const rem = clamp(avg - deep - light, 0.8, 2.2);
  return [
    { name: 'Deep', value: round(deep, 1) },
    { name: 'Light', value: round(light, 1) },
    { name: 'REM', value: round(rem, 1) }
  ];
}
