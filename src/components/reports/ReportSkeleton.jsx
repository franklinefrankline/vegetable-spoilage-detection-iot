import React from 'react';

export function ReportSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="vegsense-card" style={{ padding: '1.5rem', height: '140px' }}>
        <div style={{ height: '24px', width: '220px', backgroundColor: 'var(--border-light)', borderRadius: '4px', marginBottom: '1rem' }} />
        <div style={{ height: '40px', width: '100%', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px' }} />
      </div>

      <div className="vegsense-card" style={{ padding: '1.5rem', height: '280px' }}>
        <div style={{ height: '20px', width: '180px', backgroundColor: 'var(--border-light)', borderRadius: '4px', marginBottom: '1.5rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: '60px', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
