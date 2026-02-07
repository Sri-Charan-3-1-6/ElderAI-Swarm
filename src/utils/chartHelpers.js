export function toBPTrend(vitals = []) {
  return vitals
    .filter((v) => v.type === 'bp' && v.bp)
    .slice(-30)
    .map((v) => ({
      date: v.date,
      systolic: v.bp.systolic,
      diastolic: v.bp.diastolic
    }));
}

export function toWeightTrend(vitals = []) {
  return vitals
    .filter((v) => v.type === 'weight')
    .slice(-12)
    .map((v) => ({ date: v.date, weight: v.weight }));
}

export function toFeelingBars(checkIns = []) {
  return checkIns
    .slice(-7)
    .map((c) => ({ date: c.date, score: feelingToScore(c.feeling) }));
}

function feelingToScore(feeling) {
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

export function toSleepBars(checkIns = []) {
  return checkIns.slice(-7).map((c) => ({ date: c.date, hours: c.sleep?.hours ?? 0 }));
}

export function withIndex(list = []) {
  return list.map((item, idx) => ({ ...item, idx }));
}

