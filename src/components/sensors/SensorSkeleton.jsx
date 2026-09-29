import React from 'react';

export function SensorSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '12px',
            padding: '1.25rem',
            minHeight: '160px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ width: '40%', height: '14px', borderRadius: '4px', background: 'var(--bg-card-subtle)' }} className="skeleton-pulse" />
              <div style={{ width: '25%', height: '14px', borderRadius: '4px', background: 'var(--bg-card-subtle)' }} className="skeleton-pulse" />
            </div>
            <div style={{ width: '60%', height: '32px', borderRadius: '6px', background: 'var(--bg-card-subtle)', marginBottom: '0.75rem' }} className="skeleton-pulse" />
            <div style={{ width: '35%', height: '18px', borderRadius: '4px', background: 'var(--bg-card-subtle)' }} className="skeleton-pulse" />
          </div>
          <div style={{ width: '100%', height: '24px', borderRadius: '4px', background: 'var(--bg-card-subtle)', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem' }} className="skeleton-pulse" />
        </div>
      ))}
    </div>
  );
}
