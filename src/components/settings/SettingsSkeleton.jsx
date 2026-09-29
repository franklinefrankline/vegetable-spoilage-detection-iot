import React from 'react';

export function SettingsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Header skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ width: '220px', height: '28px', borderRadius: '6px', background: 'var(--border-color)', animation: 'pulse 1.5s infinite' }} />
        <div style={{ width: '380px', height: '16px', borderRadius: '4px', background: 'var(--border-color)', animation: 'pulse 1.5s infinite' }} />
      </div>

      {/* Panels skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ width: '40%', height: '20px', borderRadius: '4px', background: 'var(--border-color)', animation: 'pulse 1.5s infinite' }} />
            <div style={{ width: '85%', height: '14px', borderRadius: '4px', background: 'var(--border-color)', animation: 'pulse 1.5s infinite' }} />
            <div style={{ width: '100%', height: '42px', borderRadius: '8px', background: 'var(--border-color)', animation: 'pulse 1.5s infinite' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
