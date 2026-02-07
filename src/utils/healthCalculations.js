const HEALTH_KEYS = {
  CHECK_INS: 'health.checkins.v1',
  VITALS: 'health.vitals.v1',
  SYMPTOMS: 'health.symptoms.v1',
  HYDRATION: 'health.hydration.v1',
  FALLS: 'health.falls.v1'
};

function scoreFeeling(feeling) {
  switch (feeling) {
    case 'great':
      return 100;
    case 'good':
      return 85;
    case 'okay':
      return 70;
    case 'not-well':
      return 55;
    case 'bad':
      return 40;
    default:
      return 70;
  }
}

function isHighBP(sys, dia) {
  return sys > 140 || dia > 90;
}

function isLowBP(sys, dia) {
  return sys < 90 || dia < 60;
}

export function computeHealthScore({ latestCheckIn, latestVitals, compliancePercent = 100 }) {
  const feelingScore = scoreFeeling(latestCheckIn?.feeling);
  const sleepScore = Math.min(100, Math.max(40, (latestCheckIn?.sleep?.hours ?? 7) * 12));

  const vitalsScore = (() => {
    if (!latestVitals) return 75;
    let score = 100;
    if (isHighBP(latestVitals?.bp?.systolic, latestVitals?.bp?.diastolic)) score -= 12;
    if (isLowBP(latestVitals?.bp?.systolic, latestVitals?.bp?.diastolic)) score -= 10;
    if (latestVitals?.heartRate > 100 || latestVitals?.heartRate < 55) score -= 10;
    if (latestVitals?.bloodSugar?.fasting > 140 || latestVitals?.bloodSugar?.postMeal > 180) score -= 10;
    if (latestVitals?.temperature && latestVitals.temperature > 100.4) score -= 12;
    return Math.max(40, score);
  })();

  const complianceScore = Math.min(100, Math.max(0, compliancePercent));

  const total = Math.round(
    feelingScore * 0.4 +
      vitalsScore * 0.3 +
      complianceScore * 0.2 +
      sleepScore * 0.1
  );
  return Math.max(0, Math.min(100, total));
}

export function detectAlerts({ checkIns = [], vitals = [], weightTrend = [], hydration, missedDays = 0 }) {
  const alerts = [];

  const lastThreeBP = vitals
    .filter((v) => v.type === 'bp')
    .slice(-3);
  if (lastThreeBP.length === 3 && lastThreeBP.every((b) => isHighBP(b.bp?.systolic, b.bp?.diastolic))) {
    alerts.push('Blood pressure high in the last 3 readings. Please rest and consider calling the doctor.');
  }
  if (lastThreeBP.length === 3 && lastThreeBP.every((b) => isLowBP(b.bp?.systolic, b.bp?.diastolic))) {
    alerts.push('Blood pressure low in the last 3 readings. Hydrate and recheck.');
  }

  const latestTemp = vitals.filter((v) => v.temperature).slice(-1)[0];
  if (latestTemp?.temperature && latestTemp.temperature > 100.4) {
    alerts.push('Fever detected. Monitor temperature and call doctor if it persists.');
  }

  const sugar = vitals.filter((v) => v.bloodSugar?.fasting || v.bloodSugar?.postMeal).slice(-1)[0];
  if (sugar?.bloodSugar?.fasting > 140 || sugar?.bloodSugar?.postMeal > 200) {
    alerts.push('Blood sugar high. Take medicines as prescribed and monitor closely.');
  }

  if (missedDays >= 3) {
    alerts.push('No health check-in for 2+ days. Please complete a quick check-in.');
  }

  const last7 = checkIns.slice(-7);
  const notWellDays = last7.filter((c) => c.feeling === 'not-well' || c.feeling === 'bad').length;
  if (notWellDays >= 3) {
    alerts.push('Feeling not well for 3+ days. Consider calling the doctor.');
  }

  const weights = weightTrend.slice(-2);
  if (weights.length === 2) {
    const diff = weights[1].weight - weights[0].weight;
    if (Math.abs(diff) >= 2.3) {
      alerts.push('Sudden weight change of 5 lbs this week. Monitor diet and consult doctor.');
    }
  }

  if (hydration?.goal && hydration?.intake && hydration.goal - hydration.intake >= 2) {
    alerts.push('Hydration behind schedule. Drink a glass of water now.');
  }

  return alerts;
}

export function correlateMissedMedicines({ checkIns = [], medicineLogs = {} }) {
  const byDate = checkIns.reduce((acc, c) => {
    acc[c.date] = c;
    return acc;
  }, {});
  const days = Object.keys(byDate);
  let missedAndUnwell = 0;
  days.forEach((d) => {
    const log = medicineLogs[d] || {};
    const entries = Object.values(log);
    const missedMeds = entries.filter((e) => e.status === 'missed').length;
    const feeling = byDate[d]?.feeling;
    if (missedMeds > 0 && (feeling === 'not-well' || feeling === 'bad')) {
      missedAndUnwell += 1;
    }
  });
  return missedAndUnwell;
}

export function summarizeCompliance(dailyLogs = {}) {
  const days = Object.keys(dailyLogs);
  if (!days.length) return { compliancePercent: 100, missedDays: 0 };
  let goodDays = 0;
  let missedDays = 0;
  days.forEach((d) => {
    const entries = Object.values(dailyLogs[d] || {});
    if (!entries.length) return;
    const allTaken = entries.every((e) => e.status === 'taken');
    const anyTaken = entries.some((e) => e.status === 'taken');
    if (allTaken) goodDays += 1;
    if (!anyTaken) missedDays += 1;
  });
  return {
    compliancePercent: Math.round((goodDays / Math.max(1, days.length)) * 100),
    missedDays
  };
}

export function prepareDoctorReport({ checkIns = [], vitals = [], medicineCompliance = {}, medicineMissCorrelation = 0 }) {
  const last30CheckIns = checkIns.slice(-30);
  const avgFeeling = Math.round(
    last30CheckIns.reduce((s, c) => s + scoreFeeling(c.feeling), 0) / Math.max(1, last30CheckIns.length)
  );
  const bpReadings = vitals.filter((v) => v.type === 'bp').slice(-10);
  const avgSys = Math.round(bpReadings.reduce((s, b) => s + (b.bp?.systolic ?? 0), 0) / Math.max(1, bpReadings.length));
  const avgDia = Math.round(bpReadings.reduce((s, b) => s + (b.bp?.diastolic ?? 0), 0) / Math.max(1, bpReadings.length));
  const weightSeries = vitals.filter((v) => v.type === 'weight').slice(-4);
  const lastWeight = weightSeries.slice(-1)[0]?.weight ?? 'n/a';

  return [
    'Doctor Visit Summary (Last 30 days)',
    `Average feeling score: ${avgFeeling}/100`,
    `Average blood pressure (last 10): ${avgSys || 'n/a'}/${avgDia || 'n/a'}`,
    `Latest weight: ${lastWeight || 'n/a'} kg`,
    `Medicine compliance: ${medicineCompliance.compliancePercent ?? 0}%`,
    `Days fully missed medicines: ${medicineCompliance.missedDays ?? 0}`,
    medicineMissCorrelation
      ? `${medicineMissCorrelation} days had missed medicines and feeling not well.`
      : 'No direct correlation found between missed medicines and feeling not well.',
    'Recommendations: Keep hydration steady, carry medicine list to appointment, and mention any recurring symptoms.'
  ].join('\n');
}

export function groupByDate(arr) {
  return arr.reduce((acc, item) => {
    if (!item?.date) return acc;
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});
}

export { HEALTH_KEYS };

