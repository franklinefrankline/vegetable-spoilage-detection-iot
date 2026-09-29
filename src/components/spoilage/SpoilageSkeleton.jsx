import React from 'react';

export function SpoilageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '14px',
        padding: '1.75rem',
        minHeight: '190px'
      }}>
        <div style={{ width: '30%', height: '14px', borderRadius: '4px', background: 'var(--bg-card-subtle)', marginBottom: '1rem' }} className="skeleton-pulse" />
        <div style={{ width: '20%', height: '48px', borderRadius: '8px', background: 'var(--bg-card-subtle)', marginBottom: '1rem' }} className="skeleton-pulse" />
        <div style={{ width: '60%', height: '16px', borderRadius: '4px', background: 'var(--bg-card-subtle)', marginBottom: '1rem' }} className="skeleton-pulse" />
        <div style={{ width: '100%', height: '12px', borderRadius: '6px', background: 'var(--bg-card-subtle)' }} className="skeleton-pulse" />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem'
      }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: '12px',
          padding: '1.25rem',
          minHeight: '220px'
        }} className="skeleton-pulse" />
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: '12px',
          padding: '1.25rem',
          minHeight: '220px'
        }} className="skeleton-pulse" />
      </div>
    </div>
  );
}
