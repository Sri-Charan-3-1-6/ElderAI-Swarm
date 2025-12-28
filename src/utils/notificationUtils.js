const TOAST_EVENT = 'elderai:toast';

export function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  try {
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  } catch {
    // ignore
  }
}

export function notifyBrowser(title, options) {
  if (!('Notification' in window)) return;
  try {
    if (Notification.permission === 'granted') {
      // Avoid noisy console in unsupported scenarios.
      new Notification(title, options);
    }
  } catch {
    // ignore
  }
}

export function toast({ title, message, type = 'info', durationMs = 5000 }) {
  const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { id, title, message, type, durationMs } }));
  return id;
}

export function subscribeToToasts(handler) {
  const listener = (e) => handler(e.detail);
  window.addEventListener(TOAST_EVENT, listener);
  return () => window.removeEventListener(TOAST_EVENT, listener);
}
