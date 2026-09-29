import React, { useState, useEffect } from 'react';
import {
  Bell,
  Globe,
  ShieldAlert,
  AlertTriangle,
  Info,
  Check,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export function NotificationSettings({ settings, onSave, isSaving }) {
  const [inAppEnabled, setInAppEnabled] = useState(Boolean(settings?.notifications_enabled ?? 1));
  const [browserEnabled, setBrowserEnabled] = useState(Boolean(settings?.browser_notifications_enabled ?? 0));
  const [critEnabled, setCritEnabled] = useState(Boolean(settings?.critical_alerts_enabled ?? 1));
  const [highEnabled, setHighEnabled] = useState(Boolean(settings?.high_alerts_enabled ?? 1));
  const [warnEnabled, setWarnEnabled] = useState(Boolean(settings?.warning_alerts_enabled ?? 1));
  const [infoEnabled, setInfoEnabled] = useState(Boolean(settings?.info_alerts_enabled ?? 1));

  const [browserPermission, setBrowserPermission] = useState('default');
  const [isTouched, setIsTouched] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Browser notifications are not supported in this browser environment.');
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setBrowserPermission(perm);
      if (perm === 'granted') {
        setBrowserEnabled(true);
        setIsTouched(true);
      } else {
        setBrowserEnabled(false);
      }
    } catch (e) {
      console.warn('Could not request notification permission:', e);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      notifications_enabled: inAppEnabled ? 1 : 0,
      browser_notifications_enabled: browserEnabled ? 1 : 0,
      critical_alerts_enabled: critEnabled ? 1 : 0,
      high_alerts_enabled: highEnabled ? 1 : 0,
      warning_alerts_enabled: warnEnabled ? 1 : 0,
      info_alerts_enabled: infoEnabled ? 1 : 0
    });
    setIsTouched(false);
  };

  return (
    <div className="settings-panel">
      <div className="settings-panel-header">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Notification Channels & Severity Filters
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Configure notification delivery mechanisms, browser desktop alerts, and severity thresholds.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
        {/* Delivery Channels */}
        <div
          style={{
            padding: '1.15rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Delivery Channels
          </h4>

          {/* In-App Notifications */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Bell size={18} style={{ color: 'var(--primary-color, #1b4d2e)' }} />
              <div>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>
                  In-App Notification Banners & Modals
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Displays live warning toasts and updates the header bell badge across the app.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setInAppEnabled(!inAppEnabled); setIsTouched(true); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: inAppEnabled ? 'var(--primary-color, #1b4d2e)' : 'var(--text-secondary)' }}
            >
              {inAppEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
          </div>

          <div style={{ height: 1, background: 'var(--border-color)' }} />

          {/* Desktop Browser Notifications */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
              <Globe size={18} style={{ color: '#0284c7', marginTop: '0.2rem' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    Desktop Browser Push Notifications
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      background: browserPermission === 'granted' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                      color: browserPermission === 'granted' ? '#15803d' : '#b45309'
                    }}
                  >
                    {browserPermission.toUpperCase()}
                  </span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.2rem' }}>
                  Dispatches background OS system tray notifications when high-severity microclimate incidents trigger.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {browserPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontWeight: 600 }}
                >
                  Request Permission
                </button>
              )}
              <button
                type="button"
                onClick={() => { setBrowserEnabled(!browserEnabled); setIsTouched(true); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: browserEnabled ? 'var(--primary-color, #1b4d2e)' : 'var(--text-secondary)' }}
              >
                {browserEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Severity Filter Toggles */}
        <div
          style={{
            padding: '1.15rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}
        >
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Severity Level Filters
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {/* Critical */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', borderRadius: '8px', background: 'var(--bg-page)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={16} style={{ color: '#dc2626' }} />
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>Critical Alerts</span>
              </div>
              <button
                type="button"
                onClick={() => { setCritEnabled(!critEnabled); setIsTouched(true); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: critEnabled ? '#dc2626' : 'var(--text-secondary)', padding: 0 }}
              >
                {critEnabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
            </div>

            {/* High */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', borderRadius: '8px', background: 'var(--bg-page)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} style={{ color: '#ea580c' }} />
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>High Severity</span>
              </div>
              <button
                type="button"
                onClick={() => { setHighEnabled(!highEnabled); setIsTouched(true); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: highEnabled ? '#ea580c' : 'var(--text-secondary)', padding: 0 }}
              >
                {highEnabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
            </div>

            {/* Warning */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', borderRadius: '8px', background: 'var(--bg-page)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} style={{ color: '#ca8a04' }} />
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>Warnings</span>
              </div>
              <button
                type="button"
                onClick={() => { setWarnEnabled(!warnEnabled); setIsTouched(true); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: warnEnabled ? '#ca8a04' : 'var(--text-secondary)', padding: 0 }}
              >
                {warnEnabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
            </div>

            {/* Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', borderRadius: '8px', background: 'var(--bg-page)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={16} style={{ color: '#0284c7' }} />
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>Informational</span>
              </div>
              <button
                type="button"
                onClick={() => { setInfoEnabled(!infoEnabled); setIsTouched(true); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: infoEnabled ? '#0284c7' : 'var(--text-secondary)', padding: 0 }}
              >
                {infoEnabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="submit"
            disabled={!isTouched || isSaving}
            className="btn btn-primary"
            style={{
              padding: '0.6rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.86rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              opacity: !isTouched || isSaving ? 0.65 : 1
            }}
          >
            {isSaving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={16} />}
            Save Notification Settings
          </button>
        </div>
      </form>
    </div>
  );
}
