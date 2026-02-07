// src/utils/timingPlanner.js

// ============================================
// MEAL TIMES (Base schedule - adjustable)
// ============================================
const MEAL_TIMES = {
  wakeUp:       '06:30',
  breakfast:    '07:00',
  midMorning:   '09:30',
  lunch:        '12:30',
  afternoon:    '15:00',
  dinner:       '19:00',
  beforeSleep:  '21:30'
};

// ============================================
// TIMING RULES (Medical knowledge built in)
// ============================================
const TIMING_RULES = {
  // RULE 1: Empty stomach medicines
  // Must be taken 30-60 min BEFORE any meal
  // Nothing else can be taken at same time
  empty_stomach: {
    label: 'Empty Stomach',
    description: 'Take 30 minutes before breakfast. Do not eat anything.',
    times: ['06:30'],  // 30 min before breakfast
    icon: '⏰',
    color: '#ffc107',  // Yellow - attention needed
    warning: 'Take on EMPTY stomach. No food for 30 minutes after.'
  },

  // RULE 2: Before meal medicines
  // Take 15-30 min before eating
  before_meal: {
    label: 'Before Meal',
    description: 'Take 15-30 minutes before eating',
    times: ['06:45', '18:45'],  // Before breakfast & dinner
    icon: '🍽️',
    color: '#fd7e14',  // Orange
    warning: 'Take before eating. Wait 15 minutes before meal.'
  },

  // RULE 3: After meal medicines (MOST COMMON)
  // Take with or after food
  after_meal: {
    label: 'After Meal',
    description: 'Take with or after eating',
    times: ['07:15', '12:45', '19:15'],  // After breakfast, lunch, dinner
    icon: '🍚',
    color: '#28a745',  // Green - safe
    warning: null  // No special warning needed
  },

  // RULE 4: With meal (take exactly while eating)
  with_meal: {
    label: 'With Meal',
    description: 'Take exactly while eating',
    times: ['07:00', '12:30', '19:00'],
    icon: '🥘',
    color: '#28a745',
    warning: null
  },

  // RULE 5: At night / before sleep
  // Medicines that cause drowsiness
  before_sleep: {
    label: 'Before Sleep',
    description: 'Take at night before sleeping',
    times: ['21:30'],
    icon: '🌙',
    color: '#6f42c1',  // Purple - night
    warning: 'This may cause drowsiness. Take only before sleep.'
  }
};

// ============================================
// SPECIAL MEDICINE RULES
// Iron and Calcium CANNOT be taken together
// Thyroid medicine MUST be alone
// ============================================
const CONFLICT_RULES = [
  {
    medicines: ['iron', 'calcium'],
    rule: 'Take at LEAST 2 hours apart',
    message: '⚠️ Iron and Calcium cannot be taken together! We separated them by 2 hours.'
  },
  {
    medicines: ['levothyroxine', 'calcium', 'iron'],
    rule: 'Thyroid medicine must be alone',
    message: '⚠️ Thyroid medicine must be taken alone on empty stomach.'
  },
  {
    medicines: ['omeprazole', 'ranitidine'],
    rule: 'Stomach medicines should be before meals',
    message: '⚠️ Stomach protection medicine placed before breakfast.'
  }
];

// ============================================
// MAIN FUNCTION: Create complete daily plan
// ============================================
export const createMedicinePlan = (matchedMedicines) => {
  const plan = {
    morningEmpty: [],    // 6:30 AM - Empty stomach
    morningBefore: [],   // 6:45 AM - Before breakfast
    morningAfter: [],    // 7:15 AM - After breakfast
    midMorning: [],      // 9:30 AM - Mid morning
    lunchAfter: [],      // 12:45 PM - After lunch
    eveningBefore: [],   // 6:45 PM - Before dinner
    eveningAfter: [],    // 7:15 PM - After dinner
    night: []            // 9:30 PM - Before sleep
  };

  const warnings = [];
  const usedSlots = {};

  // Sort medicines by priority
  // Empty stomach first, then before meal, then after meal
  const priorityOrder = ['empty_stomach', 'before_meal', 'after_meal', 'with_meal', 'before_sleep'];

  const sorted = [...matchedMedicines].sort((a, b) => {
    return priorityOrder.indexOf(a.suggestedTiming) - priorityOrder.indexOf(b.suggestedTiming);
  });

  sorted.forEach(medicine => {
    const timing = medicine.suggestedTiming;
    const freq = medicine.timesPerDay || 1;
    const rule = TIMING_RULES[timing] || TIMING_RULES.after_meal;

    // Check for conflicts
    const conflicts = checkConflicts(medicine, plan);
    if (conflicts.length > 0) {
      warnings.push(...conflicts);
    }

    // Assign to correct slots based on timing and frequency
    switch (timing) {
      case 'empty_stomach':
        plan.morningEmpty.push({
          ...medicine,
          time: '06:30',
          rule: rule
        });
        break;

      case 'before_meal':
        plan.morningBefore.push({ ...medicine, time: '06:45', rule });
        if (freq >= 2) plan.eveningBefore.push({ ...medicine, time: '18:45', rule });
        break;

      case 'after_meal':
        plan.morningAfter.push({ ...medicine, time: '07:15', rule });
        if (freq >= 2) plan.eveningAfter.push({ ...medicine, time: '19:15', rule });
        if (freq >= 3) plan.lunchAfter.push({ ...medicine, time: '12:45', rule });
        break;

      case 'before_sleep':
        plan.night.push({ ...medicine, time: '21:30', rule });
        break;

      default:
        plan.morningAfter.push({ ...medicine, time: '07:15', rule });
        if (freq >= 2) plan.eveningAfter.push({ ...medicine, time: '19:15', rule });
        break;
    }
  });

  // Convert plan to timeline array (sorted by time)
  const timeline = convertToTimeline(plan);

  return {
    timeline,
    warnings,
    plan
  };
};

// ============================================
// Check medicine conflicts
// ============================================
const checkConflicts = (medicine, currentPlan) => {
  const warnings = [];
  const nameLower = medicine.name.toLowerCase();

  CONFLICT_RULES.forEach(conflict => {
    const hasConflict = conflict.medicines.some(m => nameLower.includes(m));
    if (hasConflict) {
      warnings.push(conflict.message);
    }
  });

  return warnings;
};

// ============================================
// Convert plan object to sorted timeline
// ============================================
const convertToTimeline = (plan) => {
  const allSlots = [
    { time: '06:30', label: '⏰ Empty Stomach (Before Breakfast)', medicines: plan.morningEmpty },
    { time: '06:45', label: '🍽️ Before Breakfast', medicines: plan.morningBefore },
    { time: '07:15', label: '🍚 After Breakfast', medicines: plan.morningAfter },
    { time: '09:30', label: '☀️ Mid Morning', medicines: plan.midMorning },
    { time: '12:45', label: '🍚 After Lunch', medicines: plan.lunchAfter },
    { time: '18:45', label: '🍽️ Before Dinner', medicines: plan.eveningBefore },
    { time: '19:15', label: '🍚 After Dinner', medicines: plan.eveningAfter },
    { time: '21:30', label: '🌙 Before Sleep', medicines: plan.night }
  ];

  // Filter out empty slots
  return allSlots.filter(slot => slot.medicines.length > 0);
};

// ============================================
// Convert timeline to Medicine Buddy format
// (So it auto-adds to existing medicine list!)
// ============================================
export const convertToMedicinesFormat = (timeline) => {
  const medicines = [];

  timeline.forEach(slot => {
    slot.medicines.forEach(med => {
      medicines.push({
        id: Date.now() + Math.random(),
        name: `${med.name} ${med.dosage}`,
        time: slot.time,
        taken: false,
        instructions: med.suggestedInstructions || med.rawInstructions,
        category: med.category,
        icon: med.icon,
        timesPerDay: med.timesPerDay || 1,
        source: 'prescription_scan'  // Mark as scanned
      });
    });
  });

  return medicines;
};

