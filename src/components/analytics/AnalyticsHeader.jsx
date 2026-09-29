import React from 'react';
import { RefreshCw, RotateCcw, Clock, Cpu, Radio } from 'lucide-react';

export function AnalyticsHeader({
  device,
  isDemo = true,
  lastUpdated,
  onRefresh,
  onResetDemo,
  isRefreshing = false
}) {
  const formatTime = (ts) => {
    if (!ts) return 'Just now';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return 'Just now';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--text-main)',
              margin: 0
            }}
          >
            History & Analytics
          </h1>

          {/* Mode Pill (Section 7) */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.725rem',
              fontWeight: 800,
              padding: '0.2rem 0.65rem',
              borderRadius: '9999px',
              backgroundColor: isDemo ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              color: isDemo ? '#f59e0b' : '#10b981',
              border: `1px solid ${isDemo ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isDemo ? '#f59e0b' : '#10b981'
              }}
            />
            {isDemo ? 'DEMO MODE' : 'LIVE DEVICE'}
          </span>

          {/* Device Identifier */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.725rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)'
            }}
          >
            <Cpu size={12} />
            <span>{device?.id || (isDemo ? 'ESP32-DEMO-001' : 'ESP32-001')}</span>
          </span>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', margin: 0 }}>
          Analyze environmental conditions, spoilage risk and storage history.
        </p>
      </div>

      {/* Action Controls & Last Updated */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div
          style={{
            fontSize: '0.775rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.3rem 0.6rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-subtle)'
          }}
        >
          <Clock size={13} />
          <span>Updated {formatTime(lastUpdated)}</span>
        </div>

        {isDemo && onResetDemo && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onResetDemo}
            title="Reset Demo sensor history back to baseline (Demo only)"
            style={{
              height: '36px',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: '#f59e0b'
            }}
          >
            <RotateCcw size={14} />
            <span>Reset Demo</span>
          </button>
        )}

        <button
          type="button"
          className="btn-secondary"
          onClick={onRefresh}
          disabled={isRefreshing}
          style={{
            height: '36px',
            fontSize: '0.8rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}
          aria-label="Refresh analytics data"
        >
          <RefreshCw size={14} className={isRefreshing ? 'spinner' : ''} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}
