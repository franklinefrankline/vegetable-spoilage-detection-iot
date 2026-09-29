import React from 'react';
import { useNavigate } from '../../router/Router';
import {
  X,
  ExternalLink,
  CheckCircle2,
  Clock,
  Shield,
  Sliders,
  Cpu,
  Boxes,
  HelpCircle,
  Activity
} from 'lucide-react';
import {
  ALERT_SEVERITIES,
  getAlertRecommendation,
  getAlertNavigationTarget
} from '../../utils/alertRules';

export function AlertDetails({ alert, onClose, onResolve, onMarkRead }) {
  const navigate = useNavigate();

  if (!alert) return null;

  const type = String(alert.alert_type || alert.type || 'SYSTEM').toUpperCase();
  const sevKey = String(alert.severity || 'INFO').toUpperCase();
  const sev = ALERT_SEVERITIES[sevKey] || ALERT_SEVERITIES.INFO;
  const recommendation = getAlertRecommendation(type);
  const navTarget = getAlertNavigationTarget(alert);

  const isResolved = alert.status === 'RESOLVED';
  const isUnread = !alert.is_read && !alert.read;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="vegsense-card"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '1.75rem',
          position: 'relative',
          boxShadow: 'var(--shadow-lg)'
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-details-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px'
          }}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '1.5rem', paddingRight: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <span
              style={{
                fontSize: '0.725rem',
                fontWeight: 800,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                backgroundColor: sev.bg,
                color: sev.color,
                border: `1px solid ${sev.border}`
              }}
            >
              {sev.label}
            </span>
            <span
              style={{
                fontSize: '0.725rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: '9999px',
                backgroundColor: isResolved ? 'rgba(16, 185, 129, 0.12)' : 'rgba(37, 99, 235, 0.12)',
                color: isResolved ? 'var(--primary)' : '#2563eb'
              }}
            >
              {alert.status || 'ACTIVE'}
            </span>
          </div>

          <h2
            id="alert-details-title"
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              margin: '0 0 0.4rem 0',
              lineHeight: 1.3
            }}
          >
            {alert.title}
          </h2>

          <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            {alert.message}
          </p>
        </div>

        {/* Recommended Action (Section 44) */}
        <div
          style={{
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-subtle)',
            borderLeft: '4px solid var(--primary)',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Activity size={14} />
            <span>Recommended Storage Action</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.45 }}>
            {recommendation}
          </p>
        </div>

        {/* Telemetry Breakdown Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.85rem',
            marginBottom: '1.5rem',
            fontSize: '0.85rem'
          }}
        >
          <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Current Value</span>
            <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{alert.value || 'N/A'}</strong>
          </div>

          <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Configured Threshold</span>
            <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{alert.threshold || 'Configured Range'}</strong>
          </div>

          <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Hardware / Device</span>
            <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{alert.device_id || 'ESP32-DEMO-001'}</strong>
          </div>

          <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Storage Batch</span>
            <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>
              {alert.metadata?.batch_name || alert.storage_batch_id || 'Global Chamber'}
            </strong>
          </div>

          <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Created At</span>
            <strong style={{ color: 'var(--text-main)', fontSize: '0.825rem' }}>
              {alert.created_at ? new Date(alert.created_at).toLocaleString() : 'N/A'}
            </strong>
          </div>

          <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: '6px' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Resolved At</span>
            <strong style={{ color: 'var(--text-main)', fontSize: '0.825rem' }}>
              {alert.resolved_at ? new Date(alert.resolved_at).toLocaleString() : 'Currently Active'}
            </strong>
          </div>
        </div>

        {/* Modal Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            borderTop: '1px solid var(--border-light)',
            paddingTop: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {isUnread && onMarkRead && (
              <button
                type="button"
                className="btn-secondary"
                style={{ height: '36px', fontSize: '0.825rem' }}
                onClick={() => {
                  onMarkRead(alert.id);
                }}
              >
                Mark as Read
              </button>
            )}

            {!isResolved && onResolve && (
              <button
                type="button"
                className="btn-secondary"
                style={{ height: '36px', fontSize: '0.825rem' }}
                onClick={() => {
                  onResolve(alert.id);
                  onClose();
                }}
              >
                <CheckCircle2 size={15} />
                <span>Resolve Alert</span>
              </button>
            )}
          </div>

          <button
            type="button"
            className="btn-primary"
            style={{ height: '36px', fontSize: '0.825rem' }}
            onClick={() => {
              onClose();
              navigate(`${navTarget.path}${navTarget.search}`);
            }}
          >
            <span>Navigate to Module</span>
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
