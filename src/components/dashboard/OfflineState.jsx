import React, { useState } from 'react';
import { useNavigate } from '../../router/Router';
import { formatTimeAgo } from '../../utils/sensorFormatter';
import {
  AlertCircle,
  RotateCcw,
  ExternalLink,
  Wifi,
  Power,
  Server,
  HelpCircle,
  Thermometer,
  Droplets,
  Wind
} from 'lucide-react';

export function OfflineState({
  device,
  lastKnownData,
  lastUpdated,
  onReconnect
}) {
  const navigate = useNavigate();
  const [isReconnecting, setIsReconnecting] = useState(false);

  const displayIp = device?.ipAddress || device?.ip || '192.168.1.105';
  const deviceName = device?.name || device?.id || 'ESP32-001';

  const handleReconnect = async () => {
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
    <div className="vegsense-card offline-state-banner">
      <div className="offline-banner-top">
        <div className="offline-indicator-group">
          <span className="offline-beacon-ring">
            <span className="offline-beacon-dot" />
          </span>
          <div>
            <h3 className="offline-headline">Device Offline</h3>
            <p className="offline-subheadline">
              <strong>{deviceName}</strong> at <code>{displayIp}</code> is not responding.
            </p>
          </div>
        </div>

        <div className="offline-actions-group">
          <button
            type="button"
            className="btn-primary btn-offline-reconnect"
            onClick={handleReconnect}
            disabled={isReconnecting}
          >
            {isReconnecting ? (
              <>
                <span className="spinner" />
                <span>Checking Link...</span>
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
          >
            <ExternalLink size={14} />
            <span>Change Device</span>
          </button>
        </div>
      </div>

      {/* Last Known Readings (Clearly Separated) */}
      {lastKnownData && (
        <div className="last-known-reading-block">
          <div className="last-known-header">
            <span className="last-known-title">Last Known Reading</span>
            <span className="last-known-time">
              Received {formatTimeAgo(lastUpdated)}
            </span>
          </div>

          <div className="last-known-metrics-row">
            <div className="last-metric-chip">
              <Thermometer size={14} color="#ea580c" />
              <span>{lastKnownData.temperature !== undefined ? `${lastKnownData.temperature}°C` : '--'}</span>
            </div>
            <div className="last-metric-chip">
              <Droplets size={14} color="#0284c7" />
              <span>{lastKnownData.humidity !== undefined ? `${lastKnownData.humidity}%` : '--'}</span>
            </div>
            <div className="last-metric-chip">
              <Wind size={14} color="var(--primary)" />
              <span>{lastKnownData.gasLevel ?? lastKnownData.gasVOC ?? '--'} Gas/VOC</span>
            </div>
          </div>
        </div>
      )}

      {/* Compact Troubleshooting Checklist */}
      <div className="offline-checklist-box">
        <div className="checklist-title">
          <HelpCircle size={14} />
          <span>Quick Connection Checklist</span>
        </div>
        <ul className="checklist-items">
          <li>
            <Power size={13} /> ESP32 board is powered and micro-USB/power LED is on.
          </li>
          <li>
            <Wifi size={13} /> ESP32 and this computer are connected to the same Wi-Fi network.
          </li>
          <li>
            <Server size={13} /> ESP32 HTTP WebServer is running and listening on port 80 at <code>http://{displayIp}/</code>.
          </li>
        </ul>
      </div>
    </div>
  );
}
export default OfflineState;
