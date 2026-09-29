import React from 'react';
import { CalendarX, RotateCcw } from 'lucide-react';

export function AnalyticsEmptyState({ onResetFilters, onAdjustRange }) {
  return (
    <div
      className="vegsense-card"
      style={{
        padding: '3.5rem 2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        border: '1px dashed var(--border-light)',
        backgroundColor: 'var(--bg-card)'
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-subtle)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CalendarX size={28} />
      </div>
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
          No Historical Data Available
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto' }}>
          No sensor readings or storage events were recorded for the selected device, batch or date range.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {onAdjustRange && (
          <button
            type="button"
            className="btn-primary"
            onClick={onAdjustRange}
          >
            <span>Expand to Last 7 Days</span>
          </button>
        )}
        {onResetFilters && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onResetFilters}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <RotateCcw size={14} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
