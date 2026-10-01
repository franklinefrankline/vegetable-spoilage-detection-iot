import React from 'react';
import { useNavigate } from '../../router/Router';
import { ThemeToggle } from '../ThemeToggle';
import {
  Bell,
  Cpu,
  Wifi,
  User,
  ShieldCheck,
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
  const displayIp = device?.ipAddress || device?.ip || '192.168.1.105';
  const deviceName = device?.name || device?.id || 'ESP32-001';

  return (
    <header className="dashboard-header-container">
      {/* Left: Section 13 Replaced Logo Area (No duplicate logo in dashboard content) */}
      <div className="dashboard-hero-title-area">
        <h2 className="dashboard-hero-main-title" style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
          Smart Storage Intelligence
        </h2>
        <p className="dashboard-hero-sub-title" style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', margin: '2px 0 0 0', fontWeight: 500 }}>
          Real-time monitoring for fresh and healthy vegetables
        </p>
      </div>

      {/* Center: Live Storage Device Status Pill */}
      <div className="dashboard-header-status">
        <div
          className={`live-device-status-pill ${isConnected && !isOffline ? 'pill-connected' : 'pill-offline'}`}
          onClick={() => navigate('/connect-device')}
          title="Click to view device telemetry or change IP"
        >
          <span className="live-stream-pulse">
            <span className={`pulse-dot-indicator ${device?.isDemo || (isConnected && !isOffline) ? 'dot-active' : 'dot-offline'}`} />
            <span className="live-stream-label">{device?.isDemo ? 'Demo Live' : 'Storage Live'}</span>
          </span>

          <span className="pill-separator">•</span>

          <span className="device-id-tag">
            <Cpu size={14} />
            <span>{device?.isDemo ? 'ESP32-DEMO-001' : deviceName}</span>
          </span>

          <span className="pill-separator">•</span>

          <span className="device-conn-state">
            {device?.isDemo || device?.status === 'Demo Connected' ? (
              <span style={{ color: 'var(--status-green, #10b981)', fontWeight: 700 }}>Demo Connected</span>
            ) : isConnected && !isOffline ? (
              <span style={{ color: 'var(--status-green, #16a34a)', fontWeight: 700 }}>Connected</span>
            ) : (
              <span style={{ color: 'var(--accent-red, #dc2626)', fontWeight: 700 }}>Device Offline</span>
            )}
          </span>

          <span className="pill-separator">•</span>

          <span className="device-ip-tag" title="Dynamic ESP32 IP">
            IP: {displayIp}
          </span>
        </div>
      </div>

      {/* Right Controls: Notifications, Appearance, Profile */}
      <div className="dashboard-header-actions">
        {/* Theme Toggle Button */}
        <ThemeToggle id="dashboard-theme-toggle-btn" />

        {/* Notifications */}
        <button
          type="button"
          className="header-action-btn notif-btn"
          onClick={() => navigate('/alerts')}
          title="Recent Storage Alerts"
          aria-label="Alerts"
        >
          <Bell size={18} />
          {unreadAlertsCount > 0 && (
            <span className="notif-badge">{unreadAlertsCount}</span>
          )}
        </button>

        {/* Profile Link */}
        <button
          type="button"
          className="header-profile-pill"
          onClick={() => navigate('/settings')}
          title="Account Settings"
        >
          <div className="profile-avatar-circle">
            <User size={15} />
          </div>
          <span className="profile-pill-label">Profile</span>
        </button>
      </div>
    </header>
  );
}
export default DashboardHeader;
