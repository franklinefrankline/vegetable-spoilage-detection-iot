import React from 'react';
import { Droplets, Activity, Clock } from 'lucide-react';
import { formatHumidity, formatTimeAgo } from '../../utils/sensorFormatter';

export function HumidityCard({
  humidity,
  lastUpdated,
  isOffline = false
}) {
  const isOptimal = humidity >= 40 && humidity <= 80;

  return (
    <div className="vegsense-card sensor-metric-card">
      <div className="sensor-card-top-row">
        <div className="sensor-label-group">
          <span className="sensor-card-tag">DHT22 SENSOR</span>
          <h4 className="sensor-card-title">Humidity</h4>
        </div>
        <div className="sensor-card-icon-box hum-icon-box">
          <Droplets size={20} />
        </div>
      </div>

      <div className="sensor-card-main-val">
        {isOffline ? (
          <span className="val-offline-text">Offline</span>
        ) : humidity === null || humidity === undefined || isNaN(Number(humidity)) ? (
          <span className="val-unavailable-text" style={{ fontSize: '1rem', color: '#ea580c', fontWeight: 600 }}>
            Sensor unavailable
          </span>
        ) : (
          formatHumidity(humidity)
        )}
      </div>

      <div className="sensor-card-bottom-row">
        <div className="sensor-trend-indicator">
          {isOffline ? (
            <span style={{ color: 'var(--text-muted)' }}>Last Known</span>
          ) : (
            <span className={`trend-pill ${isOptimal ? 'trend-optimal' : 'trend-warn'}`}>
              <Activity size={12} />
              <span>{isOptimal ? 'Optimal Range' : 'Attention'}</span>
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
export default HumidityCard;
