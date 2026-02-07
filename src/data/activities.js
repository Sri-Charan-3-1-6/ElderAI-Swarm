const now = new Date();

function minutesAgo(min) {
  return new Date(now.getTime() - min * 60 * 1000).toISOString();
}

export const demoActivities = [
  { id: 'a1', type: 'chat', title: 'Morning greeting with Daily Companion', ts: minutesAgo(620), detail: 'Chatted about breakfast and sleep.' },
  { id: 'a2', type: 'medicine', title: 'Amlodipine taken', ts: minutesAgo(600), detail: 'Marked as taken.' },
  { id: 'a3', type: 'medicine', title: 'Metformin taken', ts: minutesAgo(598), detail: 'Marked as taken.' },
  { id: 'a4', type: 'walk', title: 'Morning walk', ts: minutesAgo(520), detail: '12 minutes, steady pace.' },
  { id: 'a5', type: 'meal', title: 'Breakfast', ts: minutesAgo(500), detail: 'Idli + sambar, tea.' },
  { id: 'a6', type: 'health', title: 'Vitals normal', ts: minutesAgo(470), detail: 'HR 72, O2 98%.' },
  { id: 'a7', type: 'call', title: 'Family video call', ts: minutesAgo(380), detail: '5 minutes.' },
  { id: 'a8', type: 'chat', title: 'Asked for a joke', ts: minutesAgo(320), detail: 'Mood improved to happy.' },
  { id: 'a9', type: 'meal', title: 'Lunch', ts: minutesAgo(240), detail: 'Curd rice, pickle.' },
  { id: 'a10', type: 'health', title: 'BP slightly elevated', ts: minutesAgo(180), detail: '138/86 at 2:15 PM.' },
  { id: 'a11', type: 'chat', title: 'Talked about weather', ts: minutesAgo(120), detail: 'Warm and humid today.' },
  { id: 'a12', type: 'medicine', title: 'Vitamin D3 taken', ts: minutesAgo(90), detail: 'Marked as taken.' },
  { id: 'a13', type: 'walk', title: 'Light stretching', ts: minutesAgo(60), detail: '10 minutes.' }
];

// Add filler to exceed 50+ activities (last 7 days)
export const demoActivityHistory = (() => {
  const list = [];
  const types = ['medicine', 'chat', 'walk', 'meal', 'health', 'call', 'appointment'];
  let idCounter = 100;
  for (let day = 0; day < 7; day++) {
    for (let i = 0; i < 10; i++) {
      const type = types[(day * 7 + i) % types.length];
      const ts = new Date(now.getTime() - (day * 24 * 60 + i * 37 + 15) * 60 * 1000).toISOString();
      list.push({
        id: `h${idCounter++}`,
        type,
        title:
          type === 'medicine'
            ? 'Medicine check-in'
            : type === 'chat'
            ? 'Daily Companion chat'
            : type === 'walk'
            ? 'Walk / steps recorded'
            : type === 'meal'
            ? 'Meal logged'
            : type === 'health'
            ? 'Vitals update'
            : type === 'call'
            ? 'Family call'
            : 'Appointment reminder',
        ts,
        detail:
          type === 'medicine'
            ? 'Compliance updated.'
            : type === 'chat'
            ? 'Supportive conversation.'
            : type === 'walk'
            ? 'Light activity.'
            : type === 'meal'
            ? 'Meal recorded.'
            : type === 'health'
            ? 'Trends tracked.'
            : type === 'call'
            ? 'Connected with family.'
            : 'Upcoming appointment.'
      });
    }
  }
  return list;
})();

export const demoAppointments = [
  {
    id: 'ap1',
    title: 'Doctor appointment (Dr. Shah)',
    dateISO: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30).toISOString(),
    location: 'Clinic - T Nagar',
    type: 'health',
    notes: 'Routine diabetes + BP follow-up.'
  },
  {
    id: 'ap2',
    title: 'Blood test (Lab)',
    dateISO: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 9, 0).toISOString(),
    location: 'Home collection',
    type: 'health',
    notes: 'Fasting required.'
  },
  {
    id: 'ap3',
    title: 'Family video call',
    dateISO: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0).toISOString(),
    location: 'Home',
    type: 'family',
    notes: 'Catch-up and reminders.'
  }
];

export const demoTasks = [
  { id: 't1', title: 'Pay electricity bill', dueInDays: 3, status: 'pending' },
  { id: 't2', title: 'Order medicines', dueInDays: 5, status: 'pending' },
  { id: 't3', title: 'Confirm blood test schedule', dueInDays: 7, status: 'pending' }
];

export const preloadedChat = [
  { id: 'm1', from: 'ai', text: 'Vanakkam Amma! Good morning. How did you sleep?', ts: minutesAgo(620) },
  { id: 'm2', from: 'elder', text: 'Slept ok da. Little tired.', ts: minutesAgo(618) },
  { id: 'm3', from: 'ai', text: 'Seri seri. Drink a little water, and we will take it slow. Any headache or dizziness?', ts: minutesAgo(617) },
  { id: 'm4', from: 'elder', text: 'No dizzy. Just bored.', ts: minutesAgo(615) },
  { id: 'm5', from: 'ai', text: 'Bored ah? Shall I tell you a small story or a joke?', ts: minutesAgo(614) },
  { id: 'm6', from: 'elder', text: 'Tell story.', ts: minutesAgo(613) },
  { id: 'm7', from: 'ai', text: 'Once upon a time… a tiny sparrow learned that small steps every day become big strength. Like you, Amma.', ts: minutesAgo(612) },
  { id: 'm8', from: 'elder', text: 'Hehe okay.', ts: minutesAgo(611) },
  { id: 'm9', from: 'ai', text: 'Now, medicine time soon. I will remind you gently, ok?', ts: minutesAgo(610) }
];

