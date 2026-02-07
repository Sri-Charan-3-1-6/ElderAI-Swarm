import React, { useEffect, useState } from 'react';
import { BellRing, WifiOff } from 'lucide-react';
import { requestNotificationPermission } from '../utils/notifications.js';

export default function NotificationHandler() {
  const [permission, setPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handle = () => setOnline(navigator.onLine);
    window.addEventListener('online', handle);
    window.addEventListener('offline', handle);
    return () => {
      window.removeEventListener('online', handle);
      window.removeEventListener('offline', handle);
    };
  }, []);

  const request = async () => {
    const ok = await requestNotificationPermission();
    setPermission(ok ? 'granted' : Notification.permission);
  };

  if (permission === 'granted' && online) return null;

  return (
    <div className="sticky top-0 z-40 mx-auto mb-2 flex max-w-3xl items-center gap-2 rounded-b-2xl bg-amber-100 px-4 py-3 text-lg font-semibold text-amber-900 shadow">
      <BellRing className="h-6 w-6" aria-hidden="true" />
      <div className="flex-1">
        {permission !== 'granted' ? 'Please enable notifications for loud reminders.' : null}
        {!online ? (
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <WifiOff className="h-4 w-4" aria-hidden="true" /> Offline mode: app still works.
          </div>
        ) : null}
      </div>
      {permission !== 'granted' ? (
        <button
          type="button"
          onClick={request}
          className="rounded-lg bg-amber-200 px-3 py-2 text-sm font-extrabold text-amber-900"
        >
          Enable
        </button>
      ) : null}
    </div>
  );
}

