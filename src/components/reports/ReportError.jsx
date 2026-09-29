import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function ReportError({ message, onRetry }) {
  return (
    <div
      className="vegsense-card"
      style={{
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        borderColor: 'rgba(239, 68, 68, 0.3)',
        backgroundColor: 'rgba(239, 68, 68, 0.04)',
        marginBottom: '1.75rem'
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--accent-red, #ef4444)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem auto'
        }}
      >
        <AlertCircle size={22} />
      </div>

      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
        Unable to Process Report Request
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '500px', margin: '0 auto 1.25rem auto' }}>
        {message || 'An unexpected error occurred while communicating with the reporting engine.'}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-primary"
          style={{ height: '36px', padding: '0 1.25rem', fontSize: '0.85rem', fontWeight: 700 }}
        >
          <RefreshCw size={14} style={{ marginRight: '0.4rem' }} />
          Retry Request
        </button>
      )}
    </div>
  );
}
