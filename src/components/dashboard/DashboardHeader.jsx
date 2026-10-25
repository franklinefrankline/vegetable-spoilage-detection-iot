import React from 'react';
import { useNavigate } from '../../router/Router';
import {
  Cpu,
  Radio,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export function DashboardHeader({
  device,
  isConnected,
  isOffline,
  unreadAlertsCount = 0
}) {
  const navigate = useNavigate();
  const isDemo = Boolean(device?.isDemo || device?.status === 'Demo Connected');
  const displayIp = isDemo ? '192.168.1.150' : (device?.ipAddress || device?.ip || '192.168.1.150');
  const deviceName = isDemo ? 'ESP32-DEMO-001' : (device?.name || device?.id || 'ESP32-001');

  return (
    <header className="dashboard-header-container">
      {/* Left: Storage Intelligence Hero Title */}
      <div className="dashboard-hero-title-area">
        <h2 className="dashboard-hero-main-title" style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
          Smart Storage Intelligence
        </h2>
        <p className="dashboard-hero-sub-title" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0', fontWeight: 500 }}>
          Real-time monitoring for fresh and healthy vegetables
        </p>
      </div>

      {/* Center / Right: Compact Device Information Pill (Section 11) */}
      <div className="dashboard-header-status">
        <div
          className={`live-device-status-pill ${isDemo || (isConnected && !isOffline) ? 'pill-connected' : 'pill-offline'}`}
          onClick={() => navigate('/connect-device')}
          title="Click to view device telemetry or configuration"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/connect-device')}
        >
          <span className="live-stream-pulse">
            <span className={`pulse-dot-indicator ${isDemo || (isConnected && !isOffline) ? 'dot-active' : 'dot-offline'}`} />
            <span className="live-stream-label">{isDemo ? 'Demo Live' : 'Storage Live'}</span>
          </span>

          <span className="pill-separator">•</span>

          <span className="device-id-tag">
            <Cpu size={14} />
            <span>{deviceName}</span>
          </span>

          <span className="pill-separator">•</span>

          <span className="device-conn-state">
            {isDemo ? (
              <span style={{ color: 'var(--status-green, #10b981)', fontWeight: 700 }}>Demo Connected</span>
            ) : isConnected && !isOffline ? (
              <span style={{ color: 'var(--status-green, #16a34a)', fontWeight: 700 }}>Connected</span>
            ) : (
              <span style={{ color: 'var(--accent-red, #dc2626)', fontWeight: 700 }}>Device Offline</span>
            )}
          </span>

          <span className="pill-separator">•</span>

          <span className="device-ip-tag" title="Gateway IP">
            IP: {displayIp}
          </span>
        </div>
      </div>
    </header>
  );
}
export default DashboardHeader;
