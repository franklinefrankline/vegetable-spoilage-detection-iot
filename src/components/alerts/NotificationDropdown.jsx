import React from 'react';
import { useNavigate } from '../../router/Router';
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Clock,
  Thermometer,
  Droplets,
  Activity,
  Sun,
  ShieldAlert,
  Package,
  WifiOff,
  Radio
} from 'lucide-react';
import { ALERT_SEVERITIES } from '../../utils/alertRules';

export function NotificationDropdown({
  alerts = [],
  unreadCount = 0,
  onClose,
  onMarkAllRead
}) {
  const navigate = useNavigate();

  const getAlertIcon = (type) => {
    const t = String(type || '').toUpperCase();
    if (t.includes('TEMP')) return Thermometer;
    if (t.includes('HUMID')) return Droplets;
    if (t.includes('GAS')) return Activity;
    if (t.includes('LIGHT')) return Sun;
    if (t.includes('SPOILAGE') || t.includes('RISK')) return ShieldAlert;
    if (t.includes('EXPIRY') || t.includes('STORAGE')) return Package;
    if (t.includes('OFFLINE')) return WifiOff;
    return Radio;
  };

  const latestAlerts = (alerts || []).slice(0, 5);

  const formatRelativeTime = (isoString) => {
    if (!isoString) return 'Recent';
    const date = new Date(isoString);
    const diffSec = Math.floor((new Date() - date) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className="notification-dropdown-panel"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: '340px',
        maxWidth: '90vw',
        backgroundColor: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 1000,
        overflow: 'hidden'
      }}
      role="menu"
      aria-label="Recent notifications"
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1rem',
          borderBottom: '1px solid var(--border-light)',
          backgroundColor: 'var(--bg-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Bell size={15} color="var(--primary)" />
          <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-main)' }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0.1rem 0.45rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#dc2626'
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: 0
            }}
          >
            <CheckCheck size={13} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Items list */}
      <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
        {latestAlerts.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <p style={{ fontSize: '0.825rem', margin: 0 }}>No notifications recorded</p>
          </div>
        ) : (
          latestAlerts.map((alert) => {
            const Icon = getAlertIcon(alert.alert_type || alert.type);
            const sev = ALERT_SEVERITIES[alert.severity?.toUpperCase()] || ALERT_SEVERITIES.INFO;
            const isUnread = !alert.is_read && !alert.read;

            return (
              <div
                key={alert.id}
                onClick={() => {
                  if (onClose) onClose();
                  navigate('/alerts');
                }}
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid var(--border-light)',
                  backgroundColor: isUnread ? 'var(--bg-card)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '6px',
                    backgroundColor: sev.bg,
                    color: sev.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                >
                  <Icon size={15} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '2px' }}>
                    <span
                      style={{
                        fontWeight: isUnread ? 800 : 600,
                        fontSize: '0.825rem',
                        color: 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {alert.title}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {formatRelativeTime(alert.created_at)}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '0.775rem',
                      color: 'var(--text-secondary)',
                      margin: 0,
                      lineHeight: 1.35,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {alert.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '0.65rem 1rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-subtle)',
          borderTop: '1px solid var(--border-light)'
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            navigate('/alerts');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '0.8rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: 0
          }}
        >
          <span>View all alerts</span>
          <ExternalLink size={13} />
        </button>
      </div>
    </div>
  );
}
