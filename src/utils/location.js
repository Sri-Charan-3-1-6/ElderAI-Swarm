export async function getCurrentLocation() {
  if (!('geolocation' in navigator)) {
    return { address: 'Location not supported' };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const base = {
          lat,
          lng,
          address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          mapUrl: `https://www.google.com/maps?q=${lat},${lng}`
        };

        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            {
              headers: {
                Accept: 'application/json',
                'User-Agent': 'elderai-medicine-reminder'
              }
            }
          );
          const data = await resp.json();
          resolve({ ...base, address: data?.display_name || base.address });
        } catch {
          resolve(base);
        }
      },
      (err) => {
        resolve({ address: 'Location unavailable', error: err?.message });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

export function requestLocationPermission() {
  if (!('geolocation' in navigator)) return;
  navigator.geolocation.getCurrentPosition(
    () => {},
    () => {},
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
  );
}

