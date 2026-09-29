import React, { useState } from 'react';
import {
  WifiOff,
  RefreshCw,
  Clock,
  AlertTriangle
} from 'lucide-react';

export function SpoilageOffline({
  lastKnownRisk = 18,
  lastUpdated = new Date(),
  onReconnect
}) {
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnect = async () => {
    if (onReconnect) {
      setIsReconnecting(true);
      try {
        await onReconnect();
      } finally {
        setIsReconnecting(false);
      }
    }
  };

  return (
    <div
      className="vegsense-spoilage-offline-card"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 16px rgba(239, 68, 68, 0.08)'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444'
          }}>
            <WifiOff size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ef4444', margin: 0 }}>
                Device Offline
              </h3>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '1px 6px',
                borderRadius: '4px'
              }}>
                DATA STATUS: STALE
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Hardware node disconnected. Displaying cached calculation from last confirmed transmission.
            </p>
          </div>
        </div>

        {/* Reconnect button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Latest Calculated Risk</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {lastKnownRisk}% (Cached)
            </div>
          </div>

          <button
            type="button"
            onClick={handleReconnect}
            disabled={isReconnecting}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              padding: '0.5rem 1rem'
            }}
          >
            <RefreshCw size={14} className={isReconnecting ? 'spin-animation' : ''} />
            <span>{isReconnecting ? 'Connecting...' : 'Reconnect Device'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
