// src/utils/voiceReminder.js

// ============================================
// VOICE MESSAGES (Polite & Friendly)
// ============================================
const VOICE_TEMPLATES = {
  // Standard reminder
  standard: (medicineName, time) => [
    `Hello! It is ${time}. Time to take your ${medicineName}.`,
    `Hi there! Don't forget your ${medicineName}. It's time now!`,
    `Good ${getTimeOfDay()}! Please take your ${medicineName} now.`
  ],

  // After meal reminder
  afterMeal: (medicineName) => [
    `Have you finished eating? If yes, please take your ${medicineName} now.`,
    `It's time for your ${medicineName}. Please take it after your meal.`,
    `Don't forget! Take your ${medicineName} after eating.`
  ],

  // Before meal reminder
  beforeMeal: (medicineName) => [
    `Before you eat, please take your ${medicineName}.`,
    `It's time! Take your ${medicineName} before your meal.`,
    `Please take your ${medicineName} now, before eating.`
  ],

  // Empty stomach reminder
  emptyStomach: (medicineName) => [
    `Good morning! Please take your ${medicineName} on an empty stomach. Do not eat for 30 minutes after.`,
    `It's time for your ${medicineName}. Please take it on empty stomach with just water.`,
    `Remember, take your ${medicineName} now before breakfast. Wait 30 minutes before eating.`
  ],

  // Night reminder
  night: (medicineName) => [
    `Good night! Before you sleep, please take your ${medicineName}.`,
    `Time for your last medicine! Take your ${medicineName} before sleeping.`,
    `Don't forget your ${medicineName} before bed. Good night!`
  ],

  // Gentle repeat (if not taken after 15 min)
  gentleRepeat: (medicineName) => [
    `Just a gentle reminder. Your ${medicineName} is still waiting. Please take it when you can.`,
    `Hello again! Did you take your ${medicineName}? Please don't forget!`,
    `I'm just checking - have you taken your ${medicineName} yet? No worries, just reminding!`
  ],

  // Final reminder (30 min after)
  finalReminder: (medicineName) => [
    `This is an important reminder. Your ${medicineName} hasn't been taken yet. Please take it now.`,
    `Please take your ${medicineName} as soon as possible. It's been 30 minutes.`
  ]
};

// ============================================
// GET TIME OF DAY TEXT
// ============================================
const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

// ============================================
// GET RANDOM TEMPLATE (Variety!)
// ============================================
const getRandomTemplate = (templates) => {
  return templates[Math.floor(Math.random() * templates.length)];
};

// ============================================
// MAIN VOICE FUNCTION
// ============================================
export const speakMedicineReminder = (medicine, repeatCount = 0) => {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      console.warn('Speech not supported');
      resolve(false);
      return;
    }

    // Cancel any current speech
    window.speechSynthesis.cancel();

    // Small delay (fixes Chrome bug)
    setTimeout(() => {
      let message = '';

      // Choose message based on timing type and repeat count
      if (repeatCount === 0) {
        // First reminder
        switch (medicine.rule?.label || medicine.suggestedTiming) {
          case 'Empty Stomach':
          case 'empty_stomach':
            message = getRandomTemplate(VOICE_TEMPLATES.emptyStomach(medicine.name));
            break;
          case 'Before Meal':
          case 'before_meal':
            message = getRandomTemplate(VOICE_TEMPLATES.beforeMeal(medicine.name));
            break;
          case 'After Meal':
          case 'after_meal':
            message = getRandomTemplate(VOICE_TEMPLATES.afterMeal(medicine.name));
            break;
          case 'Before Sleep':
          case 'before_sleep':
            message = getRandomTemplate(VOICE_TEMPLATES.night(medicine.name));
            break;
          default:
            message = getRandomTemplate(VOICE_TEMPLATES.standard(medicine.name, medicine.time));
        }
      } else if (repeatCount === 1) {
        // Gentle repeat after 15 min
        message = getRandomTemplate(VOICE_TEMPLATES.gentleRepeat(medicine.name));
      } else {
        // Final reminder after 30 min
        message = getRandomTemplate(VOICE_TEMPLATES.finalReminder(medicine.name));
      }

      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'en-IN';     // Indian English accent
      utterance.rate = 0.8;          // Slower (for elderly)
      utterance.pitch = 1.1;         // Slightly higher (clearer)
      utterance.volume = 1.0;        // Maximum volume

      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);

      window.speechSynthesis.speak(utterance);
    }, 500);
  });
};

// ============================================
// REMINDER SCHEDULER
// Checks every minute if any medicine is due
// Sends voice + notification
// Repeats if not taken (15 min, 30 min)
// ============================================
export const startReminderScheduler = (medicines, onMedicineTaken) => {
  const reminded = {};  // Track which medicines were reminded

  const checkReminders = () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    medicines.forEach(medicine => {
      if (medicine.taken) return;  // Skip if already taken

      const medicineTime = medicine.time;
      const timeDiff = getMinutesDifference(medicineTime, currentTime);

      // Exactly on time (0 min)
      if (timeDiff === 0 && !reminded[medicine.id]) {
        reminded[medicine.id] = { count: 0, firstReminded: now };
        speakMedicineReminder(medicine, 0);
        sendNotification(medicine);
      }

      // 15 minutes late (gentle repeat)
      if (timeDiff === -15 && reminded[medicine.id]?.count === 0 && !medicine.taken) {
        reminded[medicine.id].count = 1;
        speakMedicineReminder(medicine, 1);
        sendNotification(medicine, 'gentle');
      }

      // 30 minutes late (final reminder)
      if (timeDiff === -30 && reminded[medicine.id]?.count === 1 && !medicine.taken) {
        reminded[medicine.id].count = 2;
        speakMedicineReminder(medicine, 2);
        sendNotification(medicine, 'final');
      }
    });
  };

  // Run every minute
  const interval = setInterval(checkReminders, 60000);
  checkReminders();  // Run immediately once

  return () => clearInterval(interval);  // Cleanup
};

// ============================================
// HELPER: Calculate minutes difference
// ============================================
const getMinutesDifference = (targetTime, currentTime) => {
  const [tH, tM] = targetTime.split(':').map(Number);
  const [cH, cM] = currentTime.split(':').map(Number);
  return (tH * 60 + tM) - (cH * 60 + cM);
};

// ============================================
// HELPER: Send browser notification
// ============================================
const sendNotification = (medicine, type = 'normal') => {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  const titles = {
    normal: `💊 Medicine Time!`,
    gentle: `💊 Gentle Reminder`,
    final: `💊 Important Reminder`
  };

  new Notification(titles[type], {
    body: `Time to take ${medicine.name} - ${medicine.instructions || ''}`,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200]
  });
};

