import React, { useState } from 'react';
import { Car, MapPin, Send } from 'lucide-react';

const presets = ['Doctor clinic', 'Hospital', 'Pharmacy', 'Temple/Church', "Family's home"];

export default function TransportBooking() {
  const [destination, setDestination] = useState(presets[0]);
  const [time, setTime] = useState('10:00');

  const book = () => {
    const message = `Please arrange transport to ${destination} at ${time}.`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ padding: 'clamp(0.875rem, 3vw, 1.25rem)', gap: 'clamp(0.5rem, 2vw, 0.75rem)', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center font-extrabold text-slate-900" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(1.25rem, 5vw, 1.5rem)' }}>
        {React.cloneElement(<Car className="text-primary" />, { style: { width: 'clamp(1.25rem, 5vw, 1.5rem)', height: 'clamp(1.25rem, 5vw, 1.5rem)' } })} Transport Booking
      </div>
      <select className="w-full rounded-xl border border-slate-200 bg-white font-semibold" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }} value={destination} onChange={(e) => setDestination(e.target.value)}>
        {presets.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>
      <label className="flex items-center font-semibold text-slate-700" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>
        {React.cloneElement(<MapPin />, { style: { width: 'clamp(0.75rem, 3vw, 1rem)', height: 'clamp(0.75rem, 3vw, 1rem)' } })} Time
        <input type="time" className="rounded-lg border border-slate-200 bg-white font-semibold" style={{ paddingLeft: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingRight: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px' }} value={time} onChange={(e) => setTime(e.target.value)} />
      </label>
      <button className="flex items-center justify-center rounded-xl bg-primary font-extrabold text-white" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingLeft: 'clamp(0.75rem, 2.5vw, 1rem)', paddingRight: 'clamp(0.75rem, 2.5vw, 1rem)', paddingTop: 'clamp(0.625rem, 2vw, 0.75rem)', paddingBottom: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(1rem, 4vw, 1.125rem)', minHeight: '44px' }} onClick={book} aria-label="Book transport">
        {React.cloneElement(<Send />, { style: { width: 'clamp(1rem, 4vw, 1.25rem)', height: 'clamp(1rem, 4vw, 1.25rem)' } })} Send request
      </button>
      <div className="rounded-xl bg-white border border-slate-600 font-semibold text-slate-700" style={{ padding: 'clamp(0.625rem, 2vw, 0.75rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}>Opens your ride/WhatsApp app to complete booking.</div>
    </div>
  );
}

