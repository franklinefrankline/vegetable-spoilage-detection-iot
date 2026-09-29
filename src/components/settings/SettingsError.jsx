import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function SettingsError({ message, onRetry }) {
  return (
    <div
      style={{
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        background: 'var(--bg-surface)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        maxWidth: '480px',
        margin: '2rem auto'
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#dc2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <AlertCircle size={24} />
      </div>

      <div>
        <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Unable to Load Settings
        </h3>
        <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {message || 'The settings service encountered a communication issue. Please check your connectivity and retry.'}
        </p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.55rem 1.25rem',
            fontSize: '0.84rem',
            fontWeight: 600
          }}
        >
          <RefreshCw size={15} /> Retry Loading
        </button>
      )}
    </div>
  );
}
