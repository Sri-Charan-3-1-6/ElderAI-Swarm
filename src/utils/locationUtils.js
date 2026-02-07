export function canUseGeolocation() {
  return typeof navigator !== 'undefined' && typeof navigator.geolocation !== 'undefined';
}

export function getCurrentLocation(options) {
  return new Promise((resolve, reject) => {
    if (!canUseGeolocation()) {
      reject(new Error('Geolocation is not supported on this device.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = pos?.coords;
        resolve({
          lat: Number(coords?.latitude) || 0,
          lng: Number(coords?.longitude) || 0,
          accuracyM: Number(coords?.accuracy) || null,
          tsISO: new Date().toISOString()
        });
      },
      (err) => {
        const msg = err?.message || 'Location permission denied or unavailable.';
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10_000,
        timeout: 12_000,
        ...(options || {})
      }
    );
  });
}

export function startLiveLocationTracking({ onUpdate, onError, options } = {}) {
  if (!canUseGeolocation()) throw new Error('Geolocation is not supported on this device.');
  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const coords = pos?.coords;
      onUpdate?.({
        lat: Number(coords?.latitude) || 0,
        lng: Number(coords?.longitude) || 0,
        accuracyM: Number(coords?.accuracy) || null,
        tsISO: new Date().toISOString()
      });
    },
    (err) => {
      const msg = err?.message || 'Location permission denied or unavailable.';
      onError?.(new Error(msg));
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5_000,
      timeout: 15_000,
      ...(options || {})
    }
  );

  return () => {
    try {
      navigator.geolocation.clearWatch(watchId);
    } catch {
      // ignore
    }
  };
}

