import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Package,
  Layers,
  Sliders,
  RefreshCw
} from 'lucide-react';

export function SpoilageHeader({
  device,
  selectedBatch,
  isDemo = true,
  onSimulateCondition,
  activeCondition,
  onRefresh,
  isRefreshing
}) {
  const [showSimMenu, setShowSimMenu] = useState(false);
  const deviceName = device?.name || device?.deviceName || (isDemo ? 'ESP32-DEMO-001' : 'ESP32-001');
  const ipAddress = device?.ipAddress || device?.ip || '192.168.1.105';
  const vegName = selectedBatch?.name || selectedBatch?.vegetable_name || 'Tomato';
  const batchName = selectedBatch?.variety ? `${vegName} (${selectedBatch.variety})` : (selectedBatch?.batchName || 'Tomato Batch A');

  return (
    <div className="spoilage-header-wrapper" style={{ marginBottom: '1.5rem' }}>
      {/* Top Title & Actions */}
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
            Spoilage Detection
          </h1>
          <p style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            margin: 0,
            fontWeight: 500
          }}>
            Environmental spoilage-risk analysis for stored vegetables
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {isDemo && (
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
                title="Test spoilage risk severity levels"
              >
                <Sliders size={14} />
                <span>{activeCondition ? `Sim: ${activeCondition.toUpperCase()}` : 'Test Risk Levels'}</span>
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
                  minWidth: '200px'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.3rem 0.5rem' }}>
                    SIMULATE RISK SEVERITY
                  </div>
                  <button
                    className="dropdown-item-btn"
                    onClick={() => { onSimulateCondition(null); setShowSimMenu(false); }}
                  >
                    Default (18% FRESH)
                  </button>
                  <button
                    className="dropdown-item-btn"
                    onClick={() => { onSimulateCondition('warning'); setShowSimMenu(false); }}
                  >
                    Warning (38% WARNING)
                  </button>
                  <button
                    className="dropdown-item-btn"
                    onClick={() => { onSimulateCondition('spoilage-risk'); setShowSimMenu(false); }}
                  >
                    High Risk (68% SPOILAGE RISK)
                  </button>
                  <button
                    className="dropdown-item-btn"
                    onClick={() => { onSimulateCondition('critical'); setShowSimMenu(false); }}
                  >
                    Critical (88% CRITICAL)
                  </button>
                </div>
              )}
            </div>
          )}

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
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-animation' : ''} />
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      {/* Metadata Context Bar (Section 17) */}
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
        {/* Monitored Vegetable & Batch */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Batch:</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '2px 8px',
            borderRadius: '4px'
          }}>
            <Package size={14} color="#10b981" />
            {batchName}
          </span>
        </div>

        <span style={{ color: 'var(--border-light)' }}>•</span>

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

        {/* Operating Mode */}
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
