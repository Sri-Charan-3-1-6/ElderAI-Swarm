import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useI18n } from '../../i18n/i18n.js';

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        'rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none ' +
        (isActive ? 'bg-primary text-white' : 'text-slate-700 hover:bg-slate-100')
      }
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
      <div className="hidden items-center gap-2 md:flex">
        <NavItem to="/" label={t('nav.home')} />
        <NavItem to="/family" label={t('nav.family')} />
        <NavItem to="/elder" label={t('nav.elder')} />
      </div>

      <button
        className="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
        onClick={() => setOpen((s) => !s)}
        aria-label={open ? ta('Close navigation menu') : ta('Open navigation menu')}
      >
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-56 rounded-card bg-white shadow-card ring-1 ring-slate-200">
          <div className="flex flex-col p-2" role="menu" aria-label={ta('Navigation menu')}>
            <Link className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100" to="/" onClick={() => setOpen(false)}>
              {t('nav.home')}
            </Link>
            <Link
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              to="/family"
              onClick={() => setOpen(false)}
            >
              {t('nav.family')}
            </Link>
            <Link
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
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
