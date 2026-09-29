import React from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';

export function AlertEmptyState({ type = 'none' }) {
  const isNoActive = type === 'no_active';

  return (
    <div
      className="vegsense-card"
      style={{
        textAlign: 'center',
        padding: '3.5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.85rem'
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: isNoActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(37, 99, 235, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isNoActive ? 'var(--primary)' : '#2563eb'
        }}
      >
        {isNoActive ? <CheckCircle2 size={26} /> : <Bell size={26} />}
      </div>

      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
        {isNoActive ? 'No Active Alerts' : 'No alerts'}
      </h3>

      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '440px', margin: 0, lineHeight: 1.5 }}>
        {isNoActive
          ? 'All storage conditions are currently within the configured monitoring ranges.'
          : 'Your storage environment currently has no recorded alerts.'}
      </p>
    </div>
  );
}
