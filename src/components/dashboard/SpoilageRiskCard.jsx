import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Clock } from 'lucide-react';
import { formatSpoilageRisk, getRiskSeverity, formatTimeAgo } from '../../utils/sensorFormatter';

export function SpoilageRiskCard({
  spoilageRisk,
  lastUpdated,
  isOffline = false
}) {
  const severity = getRiskSeverity(spoilageRisk);

  return (
    <div className="vegsense-card sensor-metric-card">
      <div className="sensor-card-top-row">
        <div className="sensor-label-group">
          <span className="sensor-card-tag">ATMOSPHERIC AI</span>
          <h4 className="sensor-card-title">Spoilage Risk</h4>
        </div>
        <div
          className="sensor-card-icon-box"
          style={{
            background: severity.level === 'Low' ? 'rgba(22, 163, 74, 0.12)' : severity.level === 'Medium' ? 'rgba(234, 179, 8, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            color: severity.color
          }}
        >
          {severity.level === 'Low' ? (
            <ShieldCheck size={20} />
          ) : severity.level === 'Medium' ? (
            <AlertTriangle size={20} />
          ) : (
            <ShieldAlert size={20} />
          )}
        </div>
      </div>

      <div className="sensor-card-main-val" style={{ color: severity.color }}>
        {isOffline ? (
          <span className="val-offline-text">Offline</span>
        ) : (
          formatSpoilageRisk(spoilageRisk)
        )}
      </div>

      <div className="sensor-card-bottom-row">
        <div className="sensor-trend-indicator">
          {isOffline ? (
            <span style={{ color: 'var(--text-muted)' }}>Last Known</span>
          ) : (
            <span
              className="trend-pill"
              style={{
                backgroundColor: severity.level === 'Low' ? 'var(--primary-light)' : severity.level === 'Medium' ? 'rgba(234, 179, 8, 0.15)' : 'var(--accent-red-light)',
                color: severity.color,
                fontWeight: 700
              }}
            >
              {severity.label}
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
export default SpoilageRiskCard;
