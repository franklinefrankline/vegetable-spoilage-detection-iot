import React from 'react';
import { useNavigate } from '../../router/Router';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Thermometer,
  Droplets,
  Wind,
  ShieldAlert,
  WifiOff
} from 'lucide-react';

export function RecentAlerts({
  alerts = [],
  isOffline = false,
  displayIp = '192.168.1.105'
}) {
  const navigate = useNavigate();

  // Combine real sensor alerts with offline alert if device is disconnected
  const combinedAlerts = [...alerts];

  if (isOffline) {
    combinedAlerts.unshift({
      id: 'alt_offline',
      type: 'Device Offline',
      severity: 'Critical',
      message: `ESP32 node at ${displayIp} is currently unreachable.`,
      value: 'Offline',
      time: 'Current'
    });
  }

  const getAlertIcon = (type, severity) => {
    if (type.includes('Offline')) return <WifiOff size={16} />;
    if (type.includes('Temperature')) return <Thermometer size={16} />;
    if (type.includes('Humidity')) return <Droplets size={16} />;
    if (type.includes('Gas')) return <Wind size={16} />;
    if (type.includes('Spoilage')) return <ShieldAlert size={16} />;
    return severity === 'Critical' ? <AlertCircle size={16} /> : <AlertTriangle size={16} />;
  };

  return (
    <div className="vegsense-card recent-alerts-card">
      <div className="card-header-row" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="card-badge-icon badge-icon-amber">
            <Bell size={18} />
          </div>
          <div>
            <h3 className="card-title" style={{ fontSize: '1.05rem', margin: 0 }}>Recent Alerts</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Threshold-Triggered Events</span>
          </div>
        </div>

        <button
          type="button"
          className="card-header-link"
          onClick={() => navigate('/alerts')}
        >
          View All &rarr;
        </button>
      </div>

      {combinedAlerts.length === 0 ? (
        <div className="alerts-empty-state">
          <div className="empty-state-check-icon">
            <CheckCircle2 size={24} color="var(--status-green, #16a34a)" />
          </div>
          <span className="empty-state-headline">All conditions normal</span>
          <span className="empty-state-subtext">No active warnings or spoilage alerts.</span>
        </div>
      ) : (
        <div className="alerts-list-group">
          {combinedAlerts.slice(0, 4).map((alt) => {
            const isCritical = alt.severity === 'Critical';
            return (
              <div
                key={alt.id}
                className={`alert-item-card ${isCritical ? 'alert-item-critical' : 'alert-item-warning'}`}
              >
                <div
                  className="alert-item-icon-box"
                  style={{
                    color: isCritical ? 'var(--accent-red, #dc2626)' : 'var(--status-yellow, #d97706)',
                    background: isCritical ? 'rgba(220, 38, 38, 0.12)' : 'rgba(217, 119, 6, 0.12)'
                  }}
                >
                  {getAlertIcon(alt.type, alt.severity)}
                </div>

                <div className="alert-item-content">
                  <div className="alert-item-header">
                    <strong className="alert-item-title">{alt.type}</strong>
                    <span className="alert-item-time">{alt.time}</span>
                  </div>
                  <p className="alert-item-desc">{alt.message}</p>
                  {alt.value && (
                    <span className="alert-item-value-pill">Value: {alt.value}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
export default RecentAlerts;
