import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function AlertError({ message = 'Unable to load alerts.', onRetry }) {
  return (
    <div
      className="vegsense-card"
      style={{
        textAlign: 'center',
        padding: '3rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.85rem'
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ef4444'
        }}
      >
        <AlertCircle size={24} />
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
        {message}
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: 0 }}>
        An issue occurred while synchronizing alerts with the storage database. Please verify your connection.
      </p>
      {onRetry && (
        <button
          type="button"
          className="btn-secondary"
          onClick={onRetry}
          style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={15} />
          <span>Retry Synchronization</span>
        </button>
      )}
    </div>
  );
}
