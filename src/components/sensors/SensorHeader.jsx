import React, { useState } from 'react';
import {
  Cpu,
  Wifi,
  Radio,
  RefreshCw,
  PowerOff,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play
} from 'lucide-react';

export function SensorHeader({
  device,
  sensorData,
  isOffline,
  onToggleOffline,
  onSimulateCondition,
  activeCondition,
  onRefresh,
  isRefreshing
}) {
  const isDemo = device?.isDemo ?? true;
  const deviceName = device?.name || device?.deviceName || (isDemo ? 'ESP32-DEMO-001' : 'ESP32-001');
  const ipAddress = device?.ipAddress || device?.ip || '192.168.1.105';
  const [showSimMenu, setShowSimMenu] = useState(false);

  return (
    <div className="sensors-header-wrapper" style={{ marginBottom: '1.5rem' }}>
      {/* Top Title & Metadata Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            margin: '0 0 0.25rem 0',
            letterSpacing: '-0.02em'
          }}>
            Sensor Monitoring
          </h1>
          <p style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            margin: 0,
            fontWeight: 500
          }}>
            Real-time storage environment monitoring
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {isDemo && (
            <>
              {/* Simulate Offline Button (Section 30) */}
              <button
                type="button"
                onClick={onToggleOffline}
                className={`btn btn-sm ${isOffline ? 'btn-danger' : 'btn-outline'}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  padding: '0.45rem 0.85rem'
                }}
                title={isOffline ? 'Resume live simulation' : 'Simulate loss of ESP32 connection'}
              >
                <PowerOff size={14} />
                <span>{isOffline ? 'Resume Online' : 'Simulate Offline'}</span>
              </button>

              {/* Demo Condition Tester Dropdown (Section 17) */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowSimMenu(!showSimMenu)}
                  className="btn btn-sm btn-outline"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.8rem',
                    padding: '0.45rem 0.85rem'
                  }}
                  title="Test specific sensor thresholds"
                >
                  <Sliders size={14} />
                  <span>{activeCondition ? `Sim: ${activeCondition}` : 'Test Conditions'}</span>
                </button>

                {showSimMenu && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: 0,
                    zIndex: 100,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
                    padding: '0.5rem',
                    minWidth: '190px'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.3rem 0.5rem' }}>
                      TEST THRESHOLDS
                    </div>
                    <button
                      className="dropdown-item-btn"
                      onClick={() => { onSimulateCondition(null); setShowSimMenu(false); }}
                    >
                      Default Controlled Cycle
                    </button>
                    <button
                      className="dropdown-item-btn"
                      onClick={() => { onSimulateCondition('low-light'); setShowSimMenu(false); }}
                    >
                      Low Light (80 lux)
                    </button>
                    <button
                      className="dropdown-item-btn"
                      onClick={() => { onSimulateCondition('high-light'); setShowSimMenu(false); }}
                    >
                      High Light (700 lux)
                    </button>
                    <button
                      className="dropdown-item-btn"
                      onClick={() => { onSimulateCondition('high-temp'); setShowSimMenu(false); }}
                    >
                      High Temp (34.2 °C)
                    </button>
                    <button
                      className="dropdown-item-btn"
                      onClick={() => { onSimulateCondition('elevated-gas'); setShowSimMenu(false); }}
                    >
                      Elevated Gas (540 ppm)
                    </button>
                    <button
                      className="dropdown-item-btn"
                      onClick={() => { onSimulateCondition('high-humidity'); setShowSimMenu(false); }}
                    >
                      High Humidity (86%)
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn btn-sm btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem',
              padding: '0.45rem 0.85rem'
            }}
            title="Poll immediate reading"
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-animation' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Device Metadata Bar (Section 4) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '10px'
      }}>
        {/* Device Name */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Device:</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            background: 'rgba(56, 189, 248, 0.1)',
            padding: '2px 8px',
            borderRadius: '4px'
          }}>
            <Cpu size={14} color="#0284c7" />
            {deviceName}
          </span>
        </div>

        <span style={{ color: 'var(--border-light)' }}>•</span>

        {/* IP Address */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>IP:</span>
          <span style={{
            fontFamily: 'monospace',
            fontWeight: 600,
            color: 'var(--text-main)',
            background: 'var(--bg-card-subtle)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {ipAddress}
          </span>
        </div>

        <span style={{ color: 'var(--border-light)' }}>•</span>

        {/* Connection Status */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Status:</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontWeight: 700,
            color: isOffline ? '#ef4444' : '#10b981'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isOffline ? '#ef4444' : '#10b981',
              boxShadow: isOffline ? '0 0 8px rgba(239, 68, 68, 0.5)' : '0 0 8px rgba(16, 185, 129, 0.5)'
            }} />
            {isOffline ? 'Offline' : 'Connected'}
          </span>
        </div>

        <span style={{ color: 'var(--border-light)' }}>•</span>

        {/* Operating Mode (Section 4: DEMO MODE vs LIVE DEVICE) */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Mode:</span>
          <span style={{
            fontWeight: 800,
            letterSpacing: '0.04em',
            fontSize: '0.75rem',
            padding: '2px 8px',
            borderRadius: '4px',
            color: isDemo ? '#f59e0b' : '#10b981',
            background: isDemo ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            border: `1px solid ${isDemo ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
          }}>
            {isDemo ? 'DEMO MODE' : 'LIVE DEVICE'}
          </span>
        </div>
      </div>
    </div>
  );
}
