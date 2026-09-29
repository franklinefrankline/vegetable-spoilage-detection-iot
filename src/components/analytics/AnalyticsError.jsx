import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export function AnalyticsError({ message = 'Unable to load analytics.', onRetry, onResetFilters }) {
  return (
    <div
      className="vegsense-card"
      style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        backgroundColor: 'var(--bg-card)'
      }}
    >
      <div
        style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <AlertTriangle size={28} />
      </div>
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
          Unable to Load Analytics
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto' }}>
          {message}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        {onRetry && (
          <button
            type="button"
            className="btn-primary"
            onClick={onRetry}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <RefreshCw size={14} />
            <span>Retry</span>
          </button>
        )}
        {onResetFilters && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onResetFilters}
          >
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
