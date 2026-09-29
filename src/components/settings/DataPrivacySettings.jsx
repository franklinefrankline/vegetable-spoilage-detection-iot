import React, { useState } from 'react';
import {
  Database,
  Download,
  Trash,
  CheckCircle2,
  FileText,
  Activity,
  Bell,
  Layers,
  Thermometer,
  ShieldCheck
} from 'lucide-react';

export function DataPrivacySettings({
  dataCounts,
  onExportData,
  onClearLocalPreferences,
  isExporting
}) {
  const [clearedNotice, setClearedNotice] = useState(false);

  const handleClearLocal = () => {
    onClearLocalPreferences();
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 4000);
  };

  const metrics = [
    { label: 'Sensor Readings', count: dataCounts?.readings ?? 'Live Stream', icon: Thermometer, color: '#ea580c' },
    { label: 'Spoilage Risk History', count: dataCounts?.spoilage ?? 'Centralized', icon: Activity, color: '#16a34a' },
    { label: 'Incident Alerts', count: dataCounts?.alerts ?? 'Persistent', icon: Bell, color: '#0284c7' },
    { label: 'Generated PDF Reports', count: dataCounts?.reports ?? 'Archive', icon: FileText, color: '#7c3aed' },
    { label: 'Vegetable Batches', count: dataCounts?.batches ?? '6 Batches', icon: Layers, color: '#ca8a04' }
  ];

  return (
    <div className="settings-panel">
      <div className="settings-panel-header">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Data Management & Privacy
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Inspect stored telemetry entities, export complete account archives, or purge local device caches.
          </p>
        </div>
      </div>

      {/* Metrics Stored Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              style={{
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon size={16} style={{ color: m.color }} />
                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {m.label.toUpperCase()}
                </span>
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {m.count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Export Section */}
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
          <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={18} style={{ color: 'var(--primary-color, #1b4d2e)' }} />
            Export Complete User Archive
          </h4>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '540px', lineHeight: 1.4 }}>
            Download an authenticated JSON archive containing your configured devices, telemetry history, spoilage logs, alerts, storage batches, and report records.
            <span style={{ display: 'block', color: 'var(--primary-color, #1b4d2e)', fontWeight: 600, marginTop: '0.2rem' }}>
              ✓ Sensitive password hashes and authentication tokens are strictly excluded.
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={onExportData}
          disabled={isExporting}
          className="btn btn-primary"
          style={{
            padding: '0.6rem 1.25rem',
            fontSize: '0.86rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {isExporting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Download size={16} />}
          {isExporting ? 'Packaging Archive...' : 'Download JSON Archive'}
        </button>
      </div>

      {/* Clear Local Cache Section */}
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
            Reset Browser Local Preferences
          </h4>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '540px', lineHeight: 1.4 }}>
            Clears temporary UI layout state, cached theme cookies, and filter preferences stored in your browser's localStorage.
            <span style={{ display: 'block', color: 'var(--text-main)', fontWeight: 600, marginTop: '0.2rem' }}>
              This does NOT delete your account or any server-side database records.
            </span>
          </p>
          {clearedNotice && (
            <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 600, display: 'inline-block', marginTop: '0.35rem' }}>
              ✓ Local browser preferences have been cleared.
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleClearLocal}
          className="btn btn-secondary"
          style={{
            padding: '0.55rem 1rem',
            fontSize: '0.84rem',
            fontWeight: 600
          }}
        >
          Clear Local Cache
        </button>
      </div>
    </div>
  );
}
