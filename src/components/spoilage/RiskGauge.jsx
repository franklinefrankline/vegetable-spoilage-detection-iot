import React from 'react';

export function RiskGauge({ value = 18 }) {
  const clampedVal = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className="vegsense-risk-gauge" style={{ width: '100%', margin: '1rem 0' }}>
      {/* Track Container */}
      <div style={{ position: 'relative', width: '100%', height: '18px', display: 'flex', alignItems: 'center' }}>
        {/* 4 Colored Risk Segments */}
        <div style={{
          width: '100%',
          height: '10px',
          borderRadius: '5px',
          overflow: 'hidden',
          display: 'flex',
          background: 'var(--bg-card-subtle)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)'
        }}>
          {/* Low Risk (0-30%) */}
          <div style={{ width: '30%', backgroundColor: '#10b981', opacity: 0.85 }} title="Low Risk (0-30%)" />
          {/* Warning (31-60%) */}
          <div style={{ width: '30%', backgroundColor: '#f59e0b', opacity: 0.85 }} title="Warning (31-60%)" />
          {/* Spoilage Risk (61-80%) */}
          <div style={{ width: '20%', backgroundColor: '#f97316', opacity: 0.85 }} title="Spoilage Risk (61-80%)" />
          {/* Critical (81-100%) */}
          <div style={{ width: '20%', backgroundColor: '#ef4444', opacity: 0.85 }} title="Critical (81-100%)" />
        </div>

        {/* Dynamic Needle Pin Indicator */}
        <div style={{
          position: 'absolute',
          left: `${clampedVal}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-card)',
          border: '3px solid var(--text-main)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 5
        }} />
      </div>

      {/* Axis Labels (Section 19: 0 --- 50 --- 100 with LOW, WARNING, HIGH/CRITICAL) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '6px',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: 'var(--text-secondary)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ color: '#10b981' }}>0%</span>
          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>LOW</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ color: '#f59e0b' }}>50%</span>
          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>WARNING</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ color: '#ef4444' }}>100%</span>
          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>CRITICAL</span>
        </div>
      </div>
    </div>
  );
}
