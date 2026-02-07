import React, { useEffect, useRef, useState } from 'react';

const HOLD_MS = 2000;

export default function EmergencyButton({ onActivate }) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef(null);
  const progressTimer = useRef(null);

  useEffect(() => {
    return () => {
      clearTimeout(holdTimer.current);
      clearInterval(progressTimer.current);
    };
  }, []);

  const startHold = () => {
    if (holding) return;
    setHolding(true);
    setProgress(0);
    const started = Date.now();

    progressTimer.current = window.setInterval(() => {
      const elapsed = Date.now() - started;
      setProgress(Math.min(100, Math.round((elapsed / HOLD_MS) * 100)));
    }, 80);

    holdTimer.current = window.setTimeout(() => {
      clearInterval(progressTimer.current);
      setProgress(100);
      setHolding(false);
      try {
        navigator.vibrate?.([400, 150, 400]);
      } catch {
        // ignore
      }
      onActivate?.({ testMode: false });
    }, HOLD_MS);
  };

  const endHold = () => {
    clearTimeout(holdTimer.current);
    clearInterval(progressTimer.current);
    setHolding(false);
    setProgress(0);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Emergency - press and hold to activate"
        onMouseDown={startHold}
        onMouseUp={endHold}
        onMouseLeave={endHold}
        onTouchStart={startHold}
        onTouchEnd={endHold}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#dc3545',
          color: '#fff',
          fontSize: '48px',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 10px 24px rgba(220,53,69,0.45)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse-emergency 1.8s infinite'
        }}
      >
        {progress > 0 ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `conic-gradient(rgba(255,255,255,0.8) ${progress}%, transparent 0)`,
              opacity: 0.4
            }}
            aria-hidden
          />
        ) : null}
        <span aria-hidden>🚨</span>
      </button>
      <style>{`
        @keyframes pulse-emergency {
          0% { transform: scale(1); box-shadow: 0 10px 24px rgba(220,53,69,0.4); }
          50% { transform: scale(1.08); box-shadow: 0 14px 32px rgba(220,53,69,0.5); }
          100% { transform: scale(1); box-shadow: 0 10px 24px rgba(220,53,69,0.4); }
        }
      `}</style>
    </>
  );
}

