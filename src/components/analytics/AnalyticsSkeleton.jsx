import React from 'react';

export function AnalyticsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="skeleton" style={{ width: '260px', height: '28px', borderRadius: '6px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '380px', height: '16px', borderRadius: '4px' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="skeleton" style={{ width: '120px', height: '36px', borderRadius: '6px' }} />
          <div className="skeleton" style={{ width: '100px', height: '36px', borderRadius: '6px' }} />
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="vegsense-card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="skeleton" style={{ width: '150px', height: '36px', borderRadius: '6px' }} />
          <div className="skeleton" style={{ width: '150px', height: '36px', borderRadius: '6px' }} />
          <div className="skeleton" style={{ width: '150px', height: '36px', borderRadius: '6px' }} />
          <div className="skeleton" style={{ width: '220px', height: '36px', borderRadius: '6px' }} />
        </div>
      </div>

      {/* Summary Cards Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="vegsense-card" style={{ padding: '1.125rem', height: '95px' }}>
            <div className="skeleton" style={{ width: '60%', height: '14px', borderRadius: '4px', marginBottom: '12px' }} />
            <div className="skeleton" style={{ width: '80%', height: '24px', borderRadius: '6px' }} />
          </div>
        ))}
      </div>

      {/* Main Chart Skeleton */}
      <div className="vegsense-card" style={{ padding: '1.5rem', height: '380px' }}>
        <div className="skeleton" style={{ width: '200px', height: '20px', borderRadius: '4px', marginBottom: '1.5rem' }} />
        <div className="skeleton" style={{ width: '100%', height: '280px', borderRadius: '8px' }} />
      </div>
    </div>
  );
}
