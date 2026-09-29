import React, { useState } from 'react';
import {
  PowerOff,
  RefreshCw,
  Clock,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  AlertTriangle,
  WifiOff
} from 'lucide-react';

export function SensorOffline({
  lastKnownData,
  onReconnect,
  isDemo = true,
  deviceName = 'ESP32-DEMO-001',
  ipAddress = '192.168.1.105'
}) {
  const [reconnectingStep, setReconnectingStep] = useState(null);

  const handleReconnectClick = async () => {
    if (onReconnect) {
      setReconnectingStep('Connecting...');
      await onReconnect((msg) => setReconnectingStep(msg));
      setReconnectingStep(null);
    }
  };

  return (
    <div
      className="vegsense-sensor-offline-banner"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 16px rgba(239, 68, 68, 0.08)'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444'
          }}>
            <WifiOff size={22} />
          </div>
          <div>
            <h3 style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: '#ef4444',
              margin: '0 0 2px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <span>Device Offline</span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-card-subtle)',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {deviceName} ({ipAddress})
              </span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Live telemetry interrupted. Displaying cached readings from the last successful transmission.
            </p>
          </div>
        </div>

        {/* Reconnect Action Button */}
        <div>
          <button
            type="button"
            onClick={handleReconnectClick}
            disabled={Boolean(reconnectingStep)}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              padding: '0.55rem 1.25rem'
            }}
          >
            <RefreshCw size={15} className={reconnectingStep ? 'spin-animation' : ''} />
            <span>{reconnectingStep || 'Reconnect Device'}</span>
          </button>
        </div>
      </div>

      {/* Last Known Reading Snapshot */}
      <div style={{
        background: 'var(--bg-card-subtle)',
        border: '1px solid var(--border-light)',
        borderRadius: '10px',
        padding: '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase'
        }}>
          <span>Last Known Sensor Reading</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', textTransform: 'none' }}>
            <Clock size={12} />
            {lastKnownData?.lastUpdated
              ? new Date(lastKnownData.lastUpdated).toLocaleTimeString()
              : 'Cached state'}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem'
        }}>
          {/* Temp */}
          <div style={{ padding: '0.5rem', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Temperature</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {lastKnownData?.temperature != null ? `${Number(lastKnownData.temperature).toFixed(1)} °C` : '—'}
            </div>
          </div>

          {/* Humidity */}
          <div style={{ padding: '0.5rem', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Humidity</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {lastKnownData?.humidity != null ? `${Math.round(lastKnownData.humidity)} %` : '—'}
            </div>
          </div>

          {/* Gas */}
          <div style={{ padding: '0.5rem', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Gas / VOC</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {lastKnownData?.gasLevel ?? lastKnownData?.gasVOC ?? 420} ppm
            </div>
          </div>

          {/* Light */}
          <div style={{ padding: '0.5rem', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Light Level</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {lastKnownData?.lightLevel != null ? `${Math.round(lastKnownData.lightLevel)} lux` : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
