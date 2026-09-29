import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { getStatusDetails } from '../../utils/sensorFormatter';

export function StorageStatusCard({
  status = 'FRESH',
  spoilageRisk = 18,
  temperature = 28.5,
  humidity = 72,
  gasLevel = 420,
  lightLevel = 420,
  lightClassification = 'NORMAL LIGHT',
  isOffline = false
}) {
  const details = getStatusDetails(status);

  // SVG Gauge Calculations for Spoilage Risk Gauge
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const riskValue = isOffline ? 0 : Math.max(0, Math.min(100, Number(spoilageRisk) || 0));
  const strokeOffset = circumference - (circumference * riskValue) / 100;

  return (
    <div className="vegsense-card storage-status-hero-card">
      <div className="card-header-row" style={{ marginBottom: '1.25rem' }}>
        <div>
          <span className="section-label-heading">STORAGE ATMOSPHERE CLASSIFICATION</span>
          <h3 className="card-title" style={{ marginTop: '0.2rem' }}>Current Preservation Status</h3>
        </div>

        {/* Strong Status Indicator Badge */}
        <span
          className={`status-hero-badge ${details.badgeClass}`}
          style={{
            backgroundColor: isOffline ? 'var(--bg-subtle)' : `${details.color}1f`,
            color: isOffline ? 'var(--text-muted)' : details.color,
            borderColor: isOffline ? 'var(--border-light)' : `${details.color}4d`
          }}
        >
          {details.status === 'FRESH' && <CheckCircle2 size={15} />}
          {details.status === 'WARNING' && <AlertTriangle size={15} />}
          {details.status === 'SPOILAGE RISK' && <AlertOctagon size={15} />}
          <span>{isOffline ? 'DEVICE OFFLINE' : details.status}</span>
        </span>
      </div>

      <div className="status-hero-body">
        {/* Left: Circular Atmospheric Meter */}
        <div className="status-circular-meter-container">
          <svg width="160" height="160" viewBox="0 0 160 160" className="status-svg-ring">
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="status-ring-bg"
              stroke="var(--border-light)"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="status-ring-fill"
              stroke={isOffline ? 'var(--border-light)' : details.color}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              fill="none"
              transform="rotate(-90 80 80)"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>

          <div className="status-ring-center-content">
            <span className="status-center-num" style={{ color: isOffline ? 'var(--text-muted)' : details.color }}>
              {isOffline ? '--' : `${riskValue}%`}
            </span>
            <span className="status-center-sub">SPOILAGE RISK</span>
          </div>
        </div>

        {/* Right: Comprehensive Condition Report */}
        <div className="status-hero-details">
          <div className="status-headline" style={{ color: isOffline ? 'var(--text-muted)' : details.color }}>
            {isOffline ? 'Storage Gateway Disconnected' : details.headline}
          </div>
          <p className="status-subtext">
            {isOffline
              ? 'ESP32 is not actively streaming telemetry frames. Reconnect the hardware gateway to resume live analysis.'
              : details.subtext}
          </p>

          {/* Key Atmospheric Pillars */}
          <div className="status-pillars-row">
            <div className="status-pillar-item">
              <span className="pillar-label">Climate</span>
              <span className="pillar-value">{isOffline ? 'Offline' : `${temperature}°C • ${humidity}% RH`}</span>
            </div>
            <div className="status-pillar-item">
              <span className="pillar-label">MQ-135 Gas</span>
              <span className="pillar-value">{isOffline ? 'Offline' : `${gasLevel} ppm`}</span>
            </div>
            <div className="status-pillar-item">
              <span className="pillar-label">Light</span>
              <span className="pillar-value">{isOffline ? 'Offline' : lightLevel !== null && lightLevel !== undefined ? `${lightLevel} lux` : 'Unavailable'}</span>
            </div>
            <div className="status-pillar-item">
              <span className="pillar-label">Status Link</span>
              <span className="pillar-value" style={{ color: isOffline ? 'var(--accent-red)' : 'var(--status-green)' }}>
                {isOffline ? 'Offline' : 'Real ESP32 Telemetry'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default StorageStatusCard;
