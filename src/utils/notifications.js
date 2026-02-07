export function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return false;
  try {
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    return Notification.permission === 'granted';
  } catch {
    return false;
  }
}

export function sendNotification(medicineName, time) {
  if (typeof Notification === 'undefined') return false;
  try {
    if (Notification.permission !== 'granted') return false;
    const title = 'Medicine Reminder';
    const body = time ? `Time to take ${medicineName} at ${time}` : `Time to take ${medicineName}`;
    new Notification(title, {
      body,
      badge: '/icons/icon-192.png',
      icon: '/icons/icon-192.png',
      silent: false
    });
    return true;
  } catch {
    return false;
  }
}

