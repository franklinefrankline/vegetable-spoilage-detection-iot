import React from 'react';
import { useNavigate } from '../../router/Router';
import { useAlerts } from '../../context/AlertContext';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Thermometer,
  Droplets,
  Activity,
  Sun,
  ShieldAlert,
  Package,
  WifiOff,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { ALERT_SEVERITIES } from '../../utils/alertRules';

export function RecentAlerts({
  isOffline = false,
  displayIp = '192.168.1.105'
}) {
  const navigate = useNavigate();
  const { activeAlerts, summary, alerts } = useAlerts();

  // Find most critical active alert for prominent display (Section 35)
  const topActiveAlert = (activeAlerts || []).find((a) => a.severity === 'CRITICAL') ||
    (activeAlerts || []).find((a) => a.severity === 'HIGH') ||
    (activeAlerts || [])[0];

  const getAlertIcon = (type, severity) => {
    const t = String(type || '').toUpperCase();
    if (t.includes('OFFLINE')) return <WifiOff size={16} />;
    if (t.includes('TEMP')) return <Thermometer size={16} />;
    if (t.includes('HUMID')) return <Droplets size={16} />;
    if (t.includes('GAS')) return <Activity size={16} />;
    if (t.includes('LIGHT')) return <Sun size={16} />;
    if (t.includes('SPOILAGE') || t.includes('RISK')) return <ShieldAlert size={16} />;
    if (t.includes('STORAGE') || t.includes('EXPIRY')) return <Package size={16} />;
    return severity === 'CRITICAL' ? <AlertCircle size={16} /> : <AlertTriangle size={16} />;
  };

  const displayList = (activeAlerts && activeAlerts.length > 0)
    ? activeAlerts.slice(0, 4)
    : (alerts || []).slice(0, 4);

  return (
    <div className="vegsense-card recent-alerts-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div className="card-header-row" style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="card-badge-icon badge-icon-amber" style={{ width: '34px', height: '34px' }}>
            <Bell size={18} />
          </div>
          <div>
            <h3 className="card-title" style={{ fontSize: '1.05rem', margin: 0 }}>Active Alerts</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-Time System Events</span>
          </div>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate('/alerts')}
          style={{ height: '32px', fontSize: '0.785rem', padding: '0 0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <span>View Alerts</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Summary Stat Pills (Section 35) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.5rem',
          padding: '0.65rem 0.75rem',
          borderRadius: '8px',
          backgroundColor: 'var(--bg-subtle)'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Active</span>
          <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{summary?.active ?? 0}</strong>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#dc2626', display: 'block' }}>Critical</span>
          <strong style={{ fontSize: '1.1rem', color: '#dc2626' }}>{summary?.critical ?? 0}</strong>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#ea580c', display: 'block' }}>High</span>
          <strong style={{ fontSize: '1.1rem', color: '#ea580c' }}>{summary?.high ?? 0}</strong>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#d97706', display: 'block' }}>Warning</span>
          <strong style={{ fontSize: '1.1rem', color: '#d97706' }}>{summary?.warning ?? 0}</strong>
        </div>
      </div>

      {/* Top Active Alert Callout Banner (Section 35) */}
      {topActiveAlert && (
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '8px',
            borderLeft: `4px solid ${topActiveAlert.severity === 'CRITICAL' ? '#dc2626' : '#ea580c'}`,
            backgroundColor: topActiveAlert.severity === 'CRITICAL' ? 'rgba(220, 38, 38, 0.08)' : 'rgba(234, 88, 12, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '2px' }}>
              <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                {topActiveAlert.title}
              </span>
              <span
                style={{
                  fontSize: '0.675rem',
                  fontWeight: 800,
                  padding: '0.1rem 0.4rem',
                  borderRadius: '9999px',
                  backgroundColor: topActiveAlert.severity === 'CRITICAL' ? 'rgba(220, 38, 38, 0.15)' : 'rgba(234, 88, 12, 0.15)',
                  color: topActiveAlert.severity === 'CRITICAL' ? '#dc2626' : '#ea580c'
                }}
              >
                {topActiveAlert.severity}
              </span>
            </div>
            <div style={{ fontSize: '0.785rem', color: 'var(--text-secondary)' }}>
              {topActiveAlert.metadata?.batch_name || topActiveAlert.storage_batch_id || 'Chamber Storage'}{' '}
              {topActiveAlert.value ? `• ${topActiveAlert.value}` : ''}
            </div>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/alerts')}
            style={{ height: '30px', fontSize: '0.75rem', padding: '0 0.65rem', flexShrink: 0 }}
          >
            <span>Review</span>
            <ExternalLink size={12} />
          </button>
        </div>
      )}

      {/* Alert List */}
      {displayList.length === 0 ? (
        <div className="alerts-empty-state" style={{ padding: '1.5rem 1rem' }}>
          <div className="empty-state-check-icon">
            <CheckCircle2 size={24} color="var(--primary)" />
          </div>
          <span className="empty-state-headline">All conditions normal</span>
          <span className="empty-state-subtext">All storage conditions are currently within the configured monitoring ranges.</span>
        </div>
      ) : (
        <div className="alerts-list-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {displayList.map((alt) => {
            const isCritical = alt.severity === 'CRITICAL';
            const sev = ALERT_SEVERITIES[alt.severity?.toUpperCase()] || ALERT_SEVERITIES.WARNING;
            return (
              <div
                key={alt.id}
                onClick={() => navigate('/alerts')}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                <div
                  style={{
                    color: sev.color,
                    background: sev.bg,
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {getAlertIcon(alt.alert_type || alt.type, alt.severity)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.825rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {alt.title}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {alt.created_at ? new Date(alt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {alt.message}
                  </p>
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
