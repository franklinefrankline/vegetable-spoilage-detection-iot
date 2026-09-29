import React from 'react';

export function AlertSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="vegsense-card"
          style={{
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            opacity: 0.7
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '70%' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'var(--border-light)',
                flexShrink: 0
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
              <div style={{ width: '40%', height: '14px', background: 'var(--border-light)', borderRadius: '4px' }} />
              <div style={{ width: '75%', height: '12px', background: 'var(--border-light)', borderRadius: '4px' }} />
            </div>
          </div>
          <div style={{ width: '80px', height: '12px', background: 'var(--border-light)', borderRadius: '4px' }} />
        </div>
      ))}
    </div>
  );
}
