import React from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  FileSpreadsheet
} from 'lucide-react';

export function DataQuality({ summary }) {
  const quality = summary?.data_quality || {
    status: 'GOOD',
    score: 100,
    description: 'Most expected readings are available.',
    total_expected: 0,
    total_received: 0,
    total_missing: 0
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'GOOD':
        return {
          icon: CheckCircle2,
          color: 'var(--accent-green, #10b981)',
          label: 'GOOD QUALITY'
        };
      case 'FAIR':
        return {
          icon: AlertTriangle,
          color: 'var(--accent-amber, #f59e0b)',
          label: 'FAIR QUALITY'
        };
      case 'LIMITED':
        return {
          icon: AlertTriangle,
          color: '#ea580c',
          label: 'LIMITED QUALITY'
        };
      case 'UNAVAILABLE':
      default:
        return {
          icon: XCircle,
          color: 'var(--accent-red, #ef4444)',
          label: 'INSUFFICIENT TELEMETRY'
        };
    }
  };

  const badge = getStatusBadge(quality.status);
  const Icon = badge.icon;

  return (
    <div className="vegsense-card" style={{ padding: '1.25rem', marginBottom: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <Database size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Telemetry Completeness & Data Quality
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Audit of transmission gaps, hardware dropouts, and sampling fidelity across the selected query window.
          </p>
        </div>

        {/* Quality status badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.4rem 0.85rem',
            borderRadius: '6px',
            backgroundColor: `${badge.color}15`,
            color: badge.color,
            fontWeight: 800,
            fontSize: '0.82rem'
          }}
        >
          <Icon size={16} />
          <span>{badge.label}</span>
          <span style={{ marginLeft: '0.35rem', opacity: 0.85 }}>({quality.score}%)</span>
        </div>
      </div>

      {/* Progress meter */}
      <div style={{ width: '100%', height: '8px', borderRadius: '4px', backgroundColor: 'var(--border-light)', overflow: 'hidden', marginBottom: '1rem' }}>
        <div
          style={{
            width: `${Math.min(100, Math.max(0, quality.score))}%`,
            height: '100%',
            backgroundColor: badge.color,
            transition: 'width 0.3s ease'
          }}
        />
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
          fontSize: '0.78rem'
        }}
      >
        <div style={{ padding: '0.65rem', borderRadius: '6px', backgroundColor: 'var(--bg-subtle)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>VALID READINGS</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {summary?.data_points ?? quality.total_received ?? 0}
          </div>
        </div>
        <div style={{ padding: '0.65rem', borderRadius: '6px', backgroundColor: 'var(--bg-subtle)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>MISSING / GAPS</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: quality.total_missing > 0 ? 'var(--accent-amber)' : 'var(--text-main)' }}>
            {quality.total_missing ?? 0}
          </div>
        </div>
        <div style={{ padding: '0.65rem', borderRadius: '6px', backgroundColor: 'var(--bg-subtle)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>SENSOR INTEGRITY</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            DHT22 + MQ135 + BH1750
          </div>
        </div>
        <div style={{ padding: '0.65rem', borderRadius: '6px', backgroundColor: 'var(--bg-subtle)', gridColumn: 'span 2' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>ASSESSMENT</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            {quality.description}
          </div>
        </div>
      </div>
    </div>
  );
}
