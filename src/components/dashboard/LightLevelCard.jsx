import React from 'react';
import { Sun, SunMedium, Clock, ShieldCheck, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { formatTimeAgo } from '../../utils/sensorFormatter';
import { classifyLight } from '../../utils/lightClassification';

export function LightLevelCard({
  lightLevel,
  lightClassification,
  lightRisk,
  lastUpdated,
  isOffline = false
}) {
  const isUnavailable = lightLevel === null || lightLevel === undefined;
  const evalData = !isUnavailable ? classifyLight(lightLevel) : {
    classification: 'UNAVAILABLE',
    statusLabel: 'Sensor Unavailable',
    lightRisk: null,
    color: '#94a3b8'
  };

  const currentClassification = lightClassification || evalData.classification;
  const currentRisk = lightRisk !== undefined && lightRisk !== null ? lightRisk : evalData.lightRisk;

  return (
    <div className="vegsense-card sensor-metric-card light-metric-card">
      <div className="sensor-card-top-row">
        <div className="sensor-label-group">
          <span className="sensor-card-tag">LIGHT SENSOR (BH1750 / LDR)</span>
          <h4 className="sensor-card-title">Light Level</h4>
        </div>
        <div
          className="sensor-card-icon-box light-icon-box"
          style={{
            background: isUnavailable ? 'rgba(148, 163, 184, 0.12)' : currentClassification === 'NORMAL LIGHT' ? 'rgba(16, 185, 129, 0.12)' : currentClassification === 'LOW LIGHT' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: isUnavailable ? 'var(--text-muted)' : evalData.color
          }}
        >
          <SunMedium size={20} />
        </div>
      </div>

      <div className="sensor-card-main-val">
        {isOffline ? (
          <span className="val-offline-text">Offline</span>
        ) : isUnavailable ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)', fontWeight: 700 }}>Unavailable</span>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 500 }}>Older ESP32 Node</span>
          </div>
        ) : (
          <span>{lightLevel} <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>lux</span></span>
        )}
      </div>

      {/* Classification & Light-Specific Risk Sub-badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Class:</span>
          <strong style={{ color: isUnavailable ? 'var(--text-muted)' : evalData.color, textTransform: 'uppercase' }}>
            {isUnavailable ? 'Unavailable' : currentClassification}
          </strong>
        </div>

        {!isUnavailable && currentRisk !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} title="Light-specific risk contribution (0–100%)">
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Light Risk:</span>
            <strong style={{ color: currentRisk > 30 ? 'var(--accent-amber)' : 'var(--primary)', fontWeight: 700 }}>
              {currentRisk}%
            </strong>
          </div>
        )}
      </div>

      <div className="sensor-card-bottom-row">
        <div className="sensor-trend-indicator">
          {isOffline ? (
            <span style={{ color: 'var(--text-muted)' }}>Last Known</span>
          ) : isUnavailable ? (
            <span className="trend-pill trend-unavailable" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>
              <Info size={12} />
              <span>Sensor Offline</span>
            </span>
          ) : currentClassification === 'NORMAL LIGHT' ? (
            <span className="trend-pill trend-optimal" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <ShieldCheck size={12} />
              <span>Status: Suitable</span>
            </span>
          ) : currentClassification === 'LOW LIGHT' ? (
            <span className="trend-pill trend-warn" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
              <AlertTriangle size={12} />
              <span>Low Light Warning</span>
            </span>
          ) : (
            <span className="trend-pill trend-crit" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
              <AlertCircle size={12} />
              <span>High Light Warning</span>
            </span>
          )}
        </div>

        <div className="sensor-last-updated" title={lastUpdated ? new Date(lastUpdated).toLocaleString() : ''}>
          <Clock size={12} />
          <span>{formatTimeAgo(lastUpdated)}</span>
        </div>
      </div>
    </div>
  );
}

export default LightLevelCard;
