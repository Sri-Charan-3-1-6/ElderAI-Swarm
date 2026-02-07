import React from 'react';
import MedicineCard from './MedicineCard.jsx';

export default function MedicineList({ items, onMarkTaken, onHear, onDelete }) {
  if (!items.length) {
    return (
      <div className="bg-white text-slate-700 shadow-card text-center border-2 border-slate-700" style={{ 
        marginTop: 'clamp(1rem, 3vw, 1.5rem)',
        borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
        padding: 'clamp(1rem, 4vw, 1.5rem)',
        fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
        fontWeight: '800'
      }}>
        No medicines yet. Add one to get started.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 'clamp(1rem, 3vw, 1.5rem)', display: 'flex', flexDirection: 'column', gap: 'clamp(0.875rem, 3vw, 1.25rem)' }}>
      {items
        .sort((a, b) => a.time.localeCompare(b.time))
        .map((item) => (
          <MedicineCard
            key={item.key}
            item={item}
            onMarkTaken={onMarkTaken}
            onHear={onHear}
            onDelete={onDelete}
          />
        ))}
    </div>
  );
}

