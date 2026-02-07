import React, { useState } from 'react';
import { Mic, Share2 } from 'lucide-react';
import VoiceInput from '../shared/VoiceInput.jsx';
import { useI18n } from '../../i18n/i18n.js';

const categories = ['Fruits & Vegetables', 'Milk & Dairy', 'Rice & Grains', 'Medicines', 'Household items'];

export default function GroceryList({ groceries, onChange }) {
  const { ta } = useI18n();
  const [item, setItem] = useState('');
  const [category, setCategory] = useState(categories[0]);

  const add = () => {
    if (!item.trim()) return;
    const next = { ...groceries, items: [{ id: `g_${Date.now()}`, name: item.trim(), category, done: false }, ...groceries.items] };
    onChange(next);
    setItem('');
  };

  const toggle = (id) => {
    const next = {
      ...groceries,
      items: groceries.items.map((g) => (g.id === id ? { ...g, done: !g.done } : g))
    };
    onChange(next);
  };

  const shareList = () => {
    const text = groceries.items.map((g) => `${g.done ? '✅' : '⬜'} ${g.name}`).join('\n');
    const url = `https://wa.me/?text=${encodeURIComponent('Grocery list:\n' + text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="border border-slate-200 bg-white shadow-sm" style={{ 
      borderRadius: 'clamp(0.75rem, 3vw, 1rem)',
      padding: 'clamp(0.875rem, 3vw, 1rem)'
    }}>
      <div className="flex items-center justify-between" style={{ 
        marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)',
        gap: 'clamp(0.5rem, 2vw, 1rem)',
        flexWrap: 'wrap'
      }}>
        <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(1.5rem, 6vw, 1.875rem)' }}>{ta('Grocery List')}</div>
        <button className="bg-slate-100 text-slate-900 font-extrabold" style={{ 
          borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
          padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(0.75rem, 2.5vw, 1rem)',
          fontSize: 'clamp(0.875rem, 3vw, 1rem)',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(0.25rem, 1vw, 0.375rem)'
        }} onClick={shareList} aria-label="Share grocery list">
          {React.cloneElement(<Share2 />, { style: { width: 'clamp(0.875rem, 3vw, 1rem)', height: 'clamp(0.875rem, 3vw, 1rem)' } })} Share
        </button>
      </div>
      <div className="grid sm:grid-cols-3" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)', marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
        <input className="border border-slate-200 bg-white font-semibold" style={{ 
          borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
          padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.75rem, 2.5vw, 1rem)',
          fontSize: 'clamp(1rem, 4vw, 1.25rem)',
          height: 'clamp(3rem, 10vw, 3.5rem)'
        }} placeholder={ta('Add item')} value={item} onChange={(e) => setItem(e.target.value)} />
        <select className="border border-slate-200 bg-white font-semibold" style={{ 
          borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
          padding: 'clamp(0.625rem, 2vw, 0.75rem) clamp(0.75rem, 2.5vw, 1rem)',
          fontSize: 'clamp(1rem, 4vw, 1.25rem)',
          height: 'clamp(3rem, 10vw, 3.5rem)'
        }} value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button className="bg-primary text-white font-extrabold" style={{ 
          borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
          padding: 'clamp(0.75rem, 2.5vw, 1rem) clamp(0.875rem, 3vw, 1rem)',
          fontSize: 'clamp(1rem, 4vw, 1.25rem)',
          height: 'clamp(3rem, 10vw, 3.5rem)'
        }} onClick={add} aria-label={ta('Add grocery')}>{ta('Add')}</button>
      </div>

      <div style={{ marginBottom: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
        <VoiceInput placeholder="Speak item name" onSave={(memo) => setItem(memo.text)} />
      </div>

      <div className="grid sm:grid-cols-2" style={{ gap: 'clamp(0.5rem, 2vw, 0.75rem)' }}>
        {categories.map((cat) => (
          <div key={cat} className="border border-slate-200 bg-white" style={{ 
            borderRadius: 'clamp(0.625rem, 2vw, 0.75rem)',
            padding: 'clamp(0.625rem, 2vw, 0.75rem)'
          }}>
            <div className="font-extrabold text-slate-900" style={{ fontSize: 'clamp(1.125rem, 4.5vw, 1.25rem)' }}>{cat}</div>
            <div style={{ marginTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', display: 'flex', flexDirection: 'column', gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
              {groceries.items.filter((g) => g.category === cat).map((g) => (
                <label key={g.id} className="flex items-center font-semibold text-slate-800" style={{ 
                  gap: 'clamp(0.375rem, 1.5vw, 0.5rem)',
                  fontSize: 'clamp(1rem, 4vw, 1.25rem)',
                  minHeight: '44px'
                }}>
                  <input type="checkbox" checked={g.done} onChange={() => toggle(g.id)} style={{ width: 'clamp(1rem, 4vw, 1.25rem)', height: 'clamp(1rem, 4vw, 1.25rem)' }} /> {g.name}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

