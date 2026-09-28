import React from 'react';
import { Thermometer, ArrowUpRight, ArrowDownRight, Minus, Clock, Activity } from 'lucide-react';
import { formatTemperature, calculateTrend, formatTimeAgo } from '../../utils/sensorFormatter';

export function TemperatureCard({
  temperature,
  previousTemperature,
  lastUpdated,
  isOffline = false
}) {
  const trend = calculateTrend(temperature, previousTemperature);

  return (
    <div className="vegsense-card sensor-metric-card">
      <div className="sensor-card-top-row">
        <div className="sensor-label-group">
          <span className="sensor-card-tag">DHT22 SENSOR</span>
          <h4 className="sensor-card-title">Temperature</h4>
        </div>
        <div className="sensor-card-icon-box temp-icon-box">
          <Thermometer size={20} />
        </div>
      </div>

      <div className="sensor-card-main-val">
        {isOffline ? (
          <span className="val-offline-text">Offline</span>
        ) : (
          formatTemperature(temperature)
        )}
      </div>

      <div className="sensor-card-bottom-row">
        {/* Trend Indicator: calculated only from real previous data, else 'Live' */}
        <div className="sensor-trend-indicator">
          {isOffline ? (
            <span style={{ color: 'var(--text-muted)' }}>Last Known</span>
          ) : trend ? (
            <span
              className={`trend-pill ${trend.direction === 'up' ? 'trend-up' : trend.direction === 'down' ? 'trend-down' : 'trend-stable'}`}
            >
              {trend.direction === 'up' && <ArrowUpRight size={13} />}
              {trend.direction === 'down' && <ArrowDownRight size={13} />}
              {trend.direction === 'stable' && <Minus size={13} />}
              <span>{trend.label}</span>
            </span>
          ) : (
            <span className="trend-pill trend-live">
              <Activity size={12} />
              <span>Live</span>
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
export default TemperatureCard;
