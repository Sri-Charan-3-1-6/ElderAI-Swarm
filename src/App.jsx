import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import { initDemoDataIfNeeded } from './utils/storageUtils.js';
import { requestNotificationPermission, subscribeToToasts } from './utils/notificationUtils.js';
import { useI18n } from './i18n/i18n.js';

const LandingPage = React.lazy(() => import('./pages/LandingPage.jsx'));
const FamilyDashboard = React.lazy(() => import('./pages/FamilyDashboard.jsx'));
const ElderInterface = React.lazy(() => import('./pages/ElderInterface.jsx'));

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    // Intentionally silent: user requested zero console errors.
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-card bg-white shadow-card p-6">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="mt-2 text-slate-600">Please refresh. Your data is saved locally.</p>
            <button
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 font-semibold text-white"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ToastStack() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    return subscribeToToasts((toast) => {
      setToasts((prev) => {
        const next = [...prev, toast].slice(-5);
        return next;
      });
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.durationMs ?? 5000);
    });
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex w-[320px] max-w-[90vw] flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          className={
            "w-full rounded-card bg-white shadow-card p-3 text-left transition hover:translate-y-[-1px] focus:outline-none " +
            (t.type === 'danger'
              ? 'border-l-4 border-danger'
              : t.type === 'warning'
              ? 'border-l-4 border-warning'
              : t.type === 'success'
              ? 'border-l-4 border-success'
              : 'border-l-4 border-primary')
          }
          aria-label="Dismiss notification"
        >
          <div className="text-sm font-semibold">{t.title}</div>
          {t.message ? <div className="mt-1 text-sm text-slate-600">{t.message}</div> : null}
        </button>
      ))}
    </div>
  );
}

function Shell({ children }) {
  const location = useLocation();
  const hideChrome = location.pathname.startsWith('/elder');
  const [highContrast, setHighContrast] = useState(() => {
    try {
      return localStorage.getItem('elderai.highContrast.v1') === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('elderai.highContrast.v1', highContrast ? '1' : '0');
    } catch {
      // ignore
    }
  }, [highContrast]);

  return (
    <div className={"min-h-screen font-sans " + (highContrast ? 'contrast-125 saturate-125' : '')}>
      {!hideChrome ? <Header highContrast={highContrast} onToggleContrast={() => setHighContrast((v) => !v)} /> : null}
      <main id="main" className={hideChrome ? 'min-h-screen' : 'mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'}>
        {children}
      </main>
      {!hideChrome ? <Footer /> : null}
      <ToastStack />
    </div>
  );
}

export default function App() {
  const { t } = useI18n();
  const location = useLocation();
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    initDemoDataIfNeeded();
    requestNotificationPermission();
    setBooted(true);
  }, []);

  const routeKey = useMemo(() => location.pathname, [location.pathname]);

  if (!booted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="rounded-card bg-white shadow-card px-6 py-4 text-slate-700">{t('app.loading')}</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Shell>
        <Suspense fallback={<div className="rounded-card bg-white shadow-card p-6">{t('app.loadingShort')}</div>}>
          <div key={routeKey} className="animate-floatIn">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/family" element={<FamilyDashboard />} />
              <Route path="/elder" element={<ElderInterface />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Suspense>
      </Shell>
    </ErrorBoundary>
  );
}
