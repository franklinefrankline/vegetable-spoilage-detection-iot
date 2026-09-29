import React, { useState } from 'react';
import { useNavigate } from '../../router/Router';
import { formatTimeAgo } from '../../utils/sensorFormatter';
import {
  Cpu,
  Wifi,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers
} from 'lucide-react';

export function DeviceStatusCard({
  device,
  isConnected,
  isOffline,
  lastUpdated,
  onReconnect
}) {
  const navigate = useNavigate();
  const [isReconnecting, setIsReconnecting] = useState(false);

  const displayIp = device?.ipAddress || device?.ip || '192.168.1.105';
  const deviceName = device?.name || device?.id || 'ESP32-001';

  const handleReconnectClick = async () => {
    setIsReconnecting(true);
    try {
      if (onReconnect) {
        await onReconnect();
      }
    } finally {
      setIsReconnecting(false);
    }
  };

  return (
    <div className="vegsense-card device-connection-card">
      <div className="card-header-row" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="card-badge-icon badge-icon-emerald">
            <Cpu size={18} />
          </div>
          <div>
            <h3 className="card-title" style={{ fontSize: '1.05rem', margin: 0 }}>
              {deviceName}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Hardware Gateway • ESP32 DevKit V1
            </span>
          </div>
        </div>

        {/* Status Pill */}
        <span
          className={`status-pill ${device?.isDemo || (isConnected && !isOffline) ? 'status-pill-green' : 'status-pill-red'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700 }}
        >
          <span
            className={`pulse-dot-indicator ${device?.isDemo || (isConnected && !isOffline) ? 'dot-active' : 'dot-offline'}`}
            style={{ width: '6px', height: '6px' }}
          />
          <span>{device?.isDemo || device?.status === 'Demo Connected' ? 'Demo Connected' : isConnected && !isOffline ? 'Connected' : 'Device Offline'}</span>
        </span>
      </div>

      {/* Grid of properties */}
      <div className="device-props-grid">
        <div className="device-prop-item">
          <span className="prop-label">IP Address</span>
          <code className="prop-value-code">{displayIp}</code>
        </div>

        <div className="device-prop-item">
          <span className="prop-label">Network Link</span>
          <span className="prop-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Wifi size={13} color={device?.isDemo || (isConnected && !isOffline) ? 'var(--status-green)' : 'var(--text-muted)'} />
            <span>{device?.isDemo || device?.status === 'Demo Connected' ? 'Demo Connected' : isConnected && !isOffline ? 'Connected' : 'Disconnected'}</span>
          </span>
        </div>

        <div className="device-prop-item">
          <span className="prop-label">Communication</span>
          <span className="prop-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} />
            <span>{device?.isDemo ? 'Demo Live (5s Polling)' : isConnected && !isOffline ? formatTimeAgo(lastUpdated) : 'Unavailable'}</span>
          </span>
        </div>

        <div className="device-prop-item">
          <span className="prop-label">Polling Interval</span>
          <span className="prop-value">5 seconds (Continuous)</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="device-card-actions-row">
        <button
          type="button"
          className="btn-primary"
          onClick={handleReconnectClick}
          disabled={isReconnecting}
          style={{ height: '38px', padding: '0 1rem', fontSize: '0.85rem' }}
        >
          {isReconnecting ? (
            <>
              <span className="spinner" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <RotateCcw size={15} />
              <span>Reconnect</span>
            </>
          )}
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate('/connect-device')}
          style={{ height: '38px', padding: '0 1rem', fontSize: '0.85rem' }}
        >
          <ExternalLink size={14} />
          <span>Change Device</span>
        </button>
      </div>
    </div>
  );
}
export default DeviceStatusCard;
