import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Activity,
  CheckCircle2,
  Info
} from 'lucide-react';
import { RiskGauge } from './RiskGauge';

export function SpoilageRiskCard({
  spoilageRisk = 18,
  classification = 'FRESH',
  severity = 'low',
  dataQuality = 'GOOD',
  lastUpdated = new Date(),
  description
}) {
  const isFresh = classification === 'FRESH';
  const isWarning = classification === 'WARNING';
  const isRisk = classification === 'SPOILAGE RISK';
  const isCritical = classification === 'CRITICAL';

  const badgeColor = isFresh ? '#10b981' : (isWarning ? '#f59e0b' : (isRisk ? '#f97316' : '#ef4444'));
  const badgeBg = isFresh
    ? 'rgba(16, 185, 129, 0.12)'
    : (isWarning ? 'rgba(245, 158, 11, 0.12)' : (isRisk ? 'rgba(249, 115, 22, 0.12)' : 'rgba(239, 68, 68, 0.12)'));
  const badgeBorder = isFresh
    ? 'rgba(16, 185, 129, 0.3)'
    : (isWarning ? 'rgba(245, 158, 11, 0.3)' : (isRisk ? 'rgba(249, 115, 22, 0.3)' : 'rgba(239, 68, 68, 0.3)'));

  const statusDesc = description || (
    isFresh
      ? 'Environmental conditions are currently within the configured monitoring range.'
      : (isWarning
        ? 'One or more atmospheric parameters deviate from optimal preservation thresholds.'
        : (isRisk
          ? 'Elevated spoilage risk detected. Produce requires immediate environmental correction.'
          : 'Critical atmospheric condition. High probability of accelerated spoilage.'))
  );

  return (
    <div
      className="vegsense-spoilage-risk-card"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '14px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        position: 'relative'
      }}
    >
      {/* Top Card Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: badgeBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: badgeColor
          }}>
            {isFresh ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
          </div>
          <div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase'
            }}>
              ESTIMATED STORAGE CONDITION
            </div>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              margin: '2px 0 0 0',
              letterSpacing: '-0.02em'
            }}>
              Environmental Spoilage Risk
            </h2>
          </div>
        </div>

        {/* Quality & Heartbeat tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Data Quality Pill (Section 16: No fake confidence %) */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 700,
            background: 'var(--bg-card-subtle)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-light)'
          }}>
            <Activity size={13} color="#10b981" />
            <span>Data Quality: <strong>{dataQuality}</strong></span>
          </span>

          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <Clock size={12} />
            {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Just now'}
          </span>
        </div>
      </div>

      {/* Primary Score & Classification Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '1rem',
        flexWrap: 'wrap',
        margin: '1rem 0 0.5rem 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
          <span style={{
            fontSize: '3.5rem',
            fontWeight: 900,
            lineHeight: 1,
            color: badgeColor,
            letterSpacing: '-0.04em'
          }}>
            {spoilageRisk}
          </span>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
            %
          </span>
        </div>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            backgroundColor: badgeBg,
            color: badgeColor,
            border: `1px solid ${badgeBorder}`
          }}
        >
          {isFresh ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{classification}</span>
        </span>
      </div>

      {/* Explanatory Statement */}
      <p style={{
        fontSize: '0.92rem',
        color: 'var(--text-secondary)',
        margin: '0.5rem 0 1rem 0',
        fontWeight: 500,
        lineHeight: 1.45
      }}>
        {statusDesc}
      </p>

      {/* Linear Risk Gauge */}
      <RiskGauge value={spoilageRisk} />
    </div>
  );
}
