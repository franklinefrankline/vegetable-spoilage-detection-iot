import React from 'react';
import {
  Thermometer,
  Droplets,
  Activity,
  Sun,
  ShieldAlert,
  Package,
  Cpu,
  WifiOff,
  Wifi,
  Radio,
  Clock,
  CheckCircle2,
  Check,
  Eye,
  Info
} from 'lucide-react';
import { ALERT_SEVERITIES } from '../../utils/alertRules';

export function AlertCard({ alert, onMarkRead, onResolve, onViewDetails }) {
  if (!alert) return null;

  const type = String(alert.alert_type || alert.type || '').toUpperCase();
  const sevKey = String(alert.severity || 'INFO').toUpperCase();
  const sev = ALERT_SEVERITIES[sevKey] || ALERT_SEVERITIES.INFO;

  const getAlertIcon = () => {
    if (type.includes('TEMP')) return Thermometer;
    if (type.includes('HUMID')) return Droplets;
    if (type.includes('GAS')) return Activity;
    if (type.includes('LIGHT')) return Sun;
    if (type.includes('SPOILAGE') || type.includes('RISK')) return ShieldAlert;
    if (type.includes('EXPIRY') || type.includes('STORAGE')) return Package;
    if (type.includes('OFFLINE')) return WifiOff;
    if (type.includes('RECONNECT')) return Wifi;
    if (type.includes('DEVICE')) return Cpu;
    return Radio;
  };

  const Icon = getAlertIcon();
  const isUnread = !alert.is_read && !alert.read;
  const isResolved = alert.status === 'RESOLVED';

  // Format relative time
  const formatTime = (isoString) => {
    if (!isoString) return 'Recently';
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className="vegsense-card"
      style={{
        padding: '1.25rem 1.45rem',
        borderLeft: isUnread
          ? `4px solid ${sev.color}`
          : isResolved
          ? '4px solid var(--border-light)'
          : `4px solid ${sev.color}`,
        backgroundColor: isUnread ? 'var(--bg-card)' : 'var(--bg-subtle)',
        transition: 'all 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        {/* Left: Icon & Content */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.9rem', flex: 1, minWidth: '260px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: isResolved ? 'var(--bg-subtle)' : sev.bg,
              color: isResolved ? 'var(--text-muted)' : sev.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '2px',
              border: `1px solid ${isResolved ? 'var(--border-light)' : sev.border}`
            }}
          >
            <Icon size={19} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '0.975rem',
                  color: 'var(--text-main)'
                }}
              >
                {alert.title}
              </span>

              {/* Severity Badge */}
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: sev.bg,
                  color: sev.color,
                  border: `1px solid ${sev.border}`
                }}
              >
                {sev.label}
              </span>

              {/* Status Badge */}
              {isResolved ? (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--primary)',
                    border: '1px solid rgba(16, 185, 129, 0.25)'
                  }}
                >
                  Resolved
                </span>
              ) : isUnread ? (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    color: '#2563eb',
                    border: '1px solid rgba(37, 99, 235, 0.25)'
                  }}
                >
                  Unread
                </span>
              ) : null}
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0 0 0.5rem 0' }}>
              {alert.message}
            </p>

            {/* Metadata Tags */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                flexWrap: 'wrap',
                fontSize: '0.775rem',
                color: 'var(--text-muted)'
              }}
            >
              {alert.value && (
                <span>
                  Value: <strong style={{ color: 'var(--text-main)' }}>{alert.value}</strong>
                </span>
              )}
              {alert.threshold && (
                <span>
                  Threshold: <strong style={{ color: 'var(--text-main)' }}>{alert.threshold}</strong>
                </span>
              )}
              {alert.device_id && <span>Device: {alert.device_id}</span>}
              {alert.storage_batch_id && (
                <span>Batch: {alert.metadata?.batch_name || alert.storage_batch_id}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Timestamp & Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.65rem'
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Clock size={12} />
            <span>{formatTime(alert.created_at)}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            {isUnread && onMarkRead && (
              <button
                type="button"
                className="btn-secondary"
                style={{ height: '30px', fontSize: '0.75rem', padding: '0 0.65rem' }}
                onClick={() => onMarkRead(alert.id)}
                title="Mark as read"
                aria-label="Mark alert as read"
              >
                <Check size={13} />
                <span>Mark Read</span>
              </button>
            )}

            {!isResolved && onResolve && (
              <button
                type="button"
                className="btn-secondary"
                style={{ height: '30px', fontSize: '0.75rem', padding: '0 0.65rem' }}
                onClick={() => onResolve(alert.id)}
                title="Resolve alert"
                aria-label="Resolve alert"
              >
                <CheckCircle2 size={13} />
                <span>Resolve</span>
              </button>
            )}

            {onViewDetails && (
              <button
                type="button"
                className="btn-secondary"
                style={{ height: '30px', fontSize: '0.75rem', padding: '0 0.65rem' }}
                onClick={() => onViewDetails(alert)}
                title="View details"
                aria-label="View alert details"
              >
                <Eye size={13} />
                <span>Details</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
