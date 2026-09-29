import React from 'react';
import { useNavigate } from '../../router/Router';
import {
  Thermometer,
  Droplets,
  Activity,
  Sun,
  ShieldAlert,
  Package,
  Cpu,
  WifiOff,
  Radio,
  ExternalLink,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { ALERT_SEVERITIES, getAlertNavigationTarget } from '../../utils/alertRules';

export function ActiveAlerts({ activeAlerts = [], onResolve }) {
  const navigate = useNavigate();

  if (!activeAlerts || activeAlerts.length === 0) {
    return null;
  }

  const getAlertIcon = (type) => {
    const t = String(type || '').toUpperCase();
    if (t.includes('TEMP')) return Thermometer;
    if (t.includes('HUMID')) return Droplets;
    if (t.includes('GAS')) return Activity;
    if (t.includes('LIGHT')) return Sun;
    if (t.includes('SPOILAGE') || t.includes('RISK')) return ShieldAlert;
    if (t.includes('EXPIRY') || t.includes('STORAGE')) return Package;
    if (t.includes('OFFLINE')) return WifiOff;
    if (t.includes('DEVICE')) return Cpu;
    return Radio;
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.85rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#dc2626',
              boxShadow: '0 0 8px rgba(220, 38, 38, 0.6)'
            }}
          />
          <h2
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              color: 'var(--text-main)',
              margin: 0
            }}
          >
            Active Alerts ({activeAlerts.length})
          </h2>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Conditions requiring current monitoring or attention
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {activeAlerts.map((alert) => {
          const sev = ALERT_SEVERITIES[alert.severity?.toUpperCase()] || ALERT_SEVERITIES.WARNING;
          const Icon = getAlertIcon(alert.alert_type || alert.type);
          const navTarget = getAlertNavigationTarget(alert);

          let actionLabel = 'View Telemetry';
          const type = String(alert.alert_type || alert.type || '').toUpperCase();
          if (type.includes('TEMP') || type.includes('HUMID') || type.includes('GAS') || type.includes('LIGHT')) {
            actionLabel = 'View Sensors';
          } else if (type.includes('SPOILAGE') || type.includes('RISK')) {
            actionLabel = 'View Spoilage';
          } else if (type.includes('EXPIRY') || type.includes('STORAGE')) {
            actionLabel = 'View Storage';
          } else if (type.includes('DEVICE')) {
            actionLabel = 'View Device';
          }

          return (
            <div
              key={alert.id}
              className="vegsense-card"
              style={{
                padding: '1.15rem 1.35rem',
                borderLeft: `5px solid ${sev.color}`,
                backgroundColor: 'var(--bg-card)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.9rem', flex: 1, minWidth: '280px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: sev.bg,
                      color: sev.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                  >
                    <Icon size={20} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
                        {alert.title}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.55rem',
                          borderRadius: '9999px',
                          backgroundColor: sev.bg,
                          color: sev.color,
                          border: `1px solid ${sev.border}`
                        }}
                      >
                        {alert.severity}
                      </span>
                      {alert.value && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-subtle)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          Value: {alert.value}
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0 0 0.4rem 0' }}>
                      {alert.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      {alert.device_id && <span>Device: <strong>{alert.device_id}</strong></span>}
                      {alert.storage_batch_id && <span>Batch: <strong>{alert.metadata?.batch_name || alert.storage_batch_id}</strong></span>}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={12} />
                        <span>{new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', alignSelf: 'center' }}>
                  {onResolve && (
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ height: '34px', fontSize: '0.785rem', padding: '0 0.75rem' }}
                      onClick={() => onResolve(alert.id)}
                      aria-label="Resolve active alert"
                    >
                      <CheckCircle2 size={14} />
                      <span>Resolve</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ height: '34px', fontSize: '0.785rem', padding: '0 0.85rem' }}
                    onClick={() => navigate(`${navTarget.path}${navTarget.search}`)}
                    aria-label={actionLabel}
                  >
                    <span>{actionLabel}</span>
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
