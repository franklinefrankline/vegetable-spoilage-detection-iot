import React from 'react';
import { Wind, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { formatGas, formatTimeAgo } from '../../utils/sensorFormatter';

export function GasLevelCard({
  gasLevel,
  lastUpdated,
  isOffline = false
}) {
  const isElevated = gasLevel > 650;
  const isModerate = gasLevel > 450 && gasLevel <= 650;

  return (
    <div className="vegsense-card sensor-metric-card">
      <div className="sensor-card-top-row">
        <div className="sensor-label-group">
          <span className="sensor-card-tag">MQ-135 SENSOR</span>
          <h4 className="sensor-card-title">Gas / VOC Indicator</h4>
        </div>
        <div className="sensor-card-icon-box gas-icon-box">
          <Wind size={20} />
        </div>
      </div>

      <div className="sensor-card-main-val">
        {isOffline ? (
          <span className="val-offline-text">Offline</span>
        ) : (
          formatGas(gasLevel)
        )}
      </div>

      <div className="sensor-card-bottom-row">
        <div className="sensor-trend-indicator">
          {isOffline ? (
            <span style={{ color: 'var(--text-muted)' }}>Last Known</span>
          ) : isElevated ? (
            <span className="trend-pill trend-crit">
              <AlertCircle size={12} />
              <span>Elevated VOC</span>
            </span>
          ) : isModerate ? (
            <span className="trend-pill trend-warn">
              <Wind size={12} />
              <span>Monitoring</span>
            </span>
          ) : (
            <span className="trend-pill trend-optimal">
              <ShieldCheck size={12} />
              <span>Baseline Normal</span>
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
export default GasLevelCard;
