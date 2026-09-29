import React, { useState } from 'react';
import {
  PlayCircle,
  Cpu,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Sliders,
  Sparkles
} from 'lucide-react';

export function DemoModeSettings({
  isDemo,
  onToggleMode,
  onResetDemo,
  isResetting
}) {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleConfirmReset = async () => {
    await onResetDemo();
    setShowConfirmReset(false);
  };

  return (
    <div className="settings-panel">
      <div className="settings-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Demo Mode & Simulation Gateway
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Operate the entire VegSense intelligence stack in self-contained hardware simulation.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.25rem 0.65rem',
              borderRadius: '999px',
              background: isDemo ? 'rgba(2, 132, 199, 0.15)' : 'rgba(22, 163, 74, 0.15)',
              color: isDemo ? '#0284c7' : '#16a34a',
              letterSpacing: '0.04em'
            }}
          >
            {isDemo ? '● DEMO MODE ACTIVE' : '● REAL ESP32 ACTIVE'}
          </span>
        </div>
      </div>

      {/* Mode Overview Card */}
      <div
        style={{
          marginTop: '1.25rem',
          padding: '1.25rem',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Simulated Virtual Node: ESP32-DEMO-001
            </h4>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.2rem' }}>
              Simulated Local Gateway IP: <code>192.168.1.105</code>
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleMode}
            className="btn btn-secondary"
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Radio size={15} />
            {isDemo ? 'Switch to Physical ESP32' : 'Switch to Demo Mode'}
          </button>
        </div>

        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          When Demo Mode is active, VegSense bypasses network socket calls to physical microcontrollers and streams reproducible environmental curves through <code>demoSensorService</code>. Every calculation (Parts 5, 6, 7, 8, 9) continues to run authoritatively.
        </p>

        {/* Demo Telemetry Specs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem',
            padding: '0.85rem',
            borderRadius: '8px',
            background: 'var(--bg-page)',
            fontSize: '0.82rem'
          }}
        >
          <div>
            <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
              SIMULATED TEMPERATURE
            </span>
            <span style={{ fontWeight: 700, color: '#ea580c' }}>28.5°C</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
              SIMULATED HUMIDITY
            </span>
            <span style={{ fontWeight: 700, color: '#0284c7' }}>72%</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
              GAS / VOC INDICATOR
            </span>
            <span style={{ fontWeight: 700, color: '#16a34a' }}>420</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
              ILLUMINATION
            </span>
            <span style={{ fontWeight: 700, color: '#ca8a04' }}>420 lux (NORMAL LIGHT)</span>
          </div>
        </div>
      </div>

      {/* Reset Demo Data Card */}
      <div
        style={{
          marginTop: '1.25rem',
          padding: '1.25rem',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-surface)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Reset Simulation History
          </h4>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '520px', lineHeight: 1.4 }}>
            Clears accumulated simulated sensor readings and test alerts.
            <strong style={{ color: '#16a34a', display: 'block', marginTop: '0.2rem' }}>
              Safety Guarantee: Real ESP32 historical records are never touched.
            </strong>
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowConfirmReset(true)}
          disabled={isResetting}
          className="btn btn-secondary"
          style={{
            padding: '0.55rem 1rem',
            fontSize: '0.84rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#dc2626',
            borderColor: 'rgba(239, 68, 68, 0.3)'
          }}
        >
          <RefreshCw size={14} className={isResetting ? 'spinner' : ''} />
          {isResetting ? 'Purging Demo...' : 'Reset Demo Data'}
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmReset && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: '12px',
              padding: '1.5rem',
              maxWidth: '440px',
              width: '100%',
              border: '1px solid var(--border-color)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(234, 179, 8, 0.15)',
                  color: '#ca8a04',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Reset Demo Mode Data?
              </h3>
            </div>

            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Only simulated test records for <code>ESP32-DEMO-001</code> will be cleared. Any records from physical hardware, reports, or storage batches remain completely untouched.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.84rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.15rem', fontSize: '0.84rem', background: '#dc2626', borderColor: '#dc2626', fontWeight: 600 }}
              >
                Yes, Reset Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
