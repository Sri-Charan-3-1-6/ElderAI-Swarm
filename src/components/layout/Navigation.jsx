import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useI18n } from '../../i18n/i18n.js';

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        'rounded-lg font-semibold transition focus:outline-none ' +
        (isActive ? 'bg-primary text-white' : 'text-slate-700 hover:bg-slate-100')
      }
      style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px', display: 'flex', alignItems: 'center' }}
    >
      {label}
    </NavLink>
  );
}

export default function Navigation() {
  const { t, ta } = useI18n();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Hide nav within Elder Interface (handled in App shell)
  const isElder = location.pathname.startsWith('/elder');
  if (isElder) return null;

  return (
    <div className="relative">
      <div className="hidden items-center md:flex" style={{ gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
        <NavItem to="/" label={t('nav.home')} />
        <NavItem to="/family" label={t('nav.family')} />
        <NavItem to="/elder" label={t('nav.elder')} />
      </div>

      <button
        className="inline-flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
        style={{ padding: 'clamp(0.375rem, 1.5vw, 0.5rem)', minHeight: '44px', minWidth: '44px' }}
        onClick={() => setOpen((s) => !s)}
        aria-label={open ? ta('Close navigation menu') : ta('Open navigation menu')}
      >
        {open ? React.cloneElement(<X aria-hidden="true" />, { style: { width: 'clamp(1.25rem, 5vw, 1.5rem)', height: 'clamp(1.25rem, 5vw, 1.5rem)' } }) : React.cloneElement(<Menu aria-hidden="true" />, { style: { width: 'clamp(1.25rem, 5vw, 1.5rem)', height: 'clamp(1.25rem, 5vw, 1.5rem)' } })}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-56 rounded-card bg-white shadow-card border-2 border-slate-700">
          <div className="flex flex-col" role="menu" aria-label={ta('Navigation menu')} style={{ padding: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
            <Link className="rounded-lg font-semibold text-slate-700 hover:bg-slate-100" style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px', display: 'flex', alignItems: 'center' }} to="/" onClick={() => setOpen(false)}>
              {t('nav.home')}
            </Link>
            <Link
              className="rounded-lg font-semibold text-slate-700 hover:bg-slate-100"
              style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px', display: 'flex', alignItems: 'center' }}
              to="/family"
              onClick={() => setOpen(false)}
            >
              {t('nav.family')}
            </Link>
            <Link
              className="rounded-lg font-semibold text-slate-700 hover:bg-slate-100"
              style={{ paddingLeft: 'clamp(0.625rem, 2vw, 0.75rem)', paddingRight: 'clamp(0.625rem, 2vw, 0.75rem)', paddingTop: 'clamp(0.375rem, 1.5vw, 0.5rem)', paddingBottom: 'clamp(0.375rem, 1.5vw, 0.5rem)', fontSize: 'clamp(0.75rem, 3vw, 0.875rem)', minHeight: '44px', display: 'flex', alignItems: 'center' }}
              to="/elder"
              onClick={() => setOpen(false)}
            >
              {t('nav.elder')}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

