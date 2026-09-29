import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { getStatusBadgeConfig } from '../../utils/sensorStatus';

export function SensorCard({
  title,
  value,
  unit,
  status,
  source,
  icon: Icon,
  accentColor = '#10b981',
  stats,
  extraInfo,
  isUnavailable = false,
  unavailableMessage = 'Sensor Unavailable',
  subtitle
}) {
  const badgeConfig = getStatusBadgeConfig(status);

  // Status icon based on severity
  const renderStatusIcon = () => {
    if (isUnavailable) return <HelpCircle size={13} />;
    if (['HIGH', 'HIGH LIGHT', 'CRITICAL', 'SPOILAGE RISK'].includes(status)) {
      return <AlertCircle size={13} />;
    }
    if (['WARNING', 'ELEVATED', 'LOW', 'LOW LIGHT'].includes(status)) {
      return <AlertTriangle size={13} />;
    }
    return <CheckCircle2 size={13} />;
  };

  return (
    <div
      className="vegsense-sensor-card"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '12px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
    >
      {/* Top Bar: Title & Source Badge */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: `${accentColor}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor
            }}>
              {Icon && <Icon size={18} />}
            </div>
            <div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                {title}
              </span>
              {subtitle && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '-1px' }}>
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          {/* Hardware Source Badge */}
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'var(--bg-card-subtle)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-light)',
            letterSpacing: '0.02em'
          }}>
            {source}
          </span>
        </div>

        {/* Primary Sensor Reading Display */}
        <div style={{ margin: '0.5rem 0' }}>
          {isUnavailable ? (
            <div style={{ padding: '0.5rem 0' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {unavailableMessage}
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
              <span style={{
                fontSize: '2.1rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                lineHeight: 1.1,
                letterSpacing: '-0.03em'
              }}>
                {typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}
              </span>
              {unit && (
                <span style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)'
                }}>
                  {unit}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Status Pill (Accessible: icon + text) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: badgeConfig.bg,
              color: badgeConfig.color,
              border: `1px solid ${badgeConfig.border}`,
              letterSpacing: '0.02em'
            }}
          >
            {renderStatusIcon()}
            <span>Status: {status}</span>
          </span>

          {extraInfo && (
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              fontWeight: 600
            }}>
              {extraInfo}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Historical Stats Bar (Min / Max / Avg) */}
      {stats && (
        <div style={{
          marginTop: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-light)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Min
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
              {stats.min != null ? (Number.isInteger(stats.min) ? stats.min : stats.min.toFixed(1)) : '—'} {unit}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Max
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
              {stats.max != null ? (Number.isInteger(stats.max) ? stats.max : stats.max.toFixed(1)) : '—'} {unit}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Avg
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
              {stats.avg != null ? (Number.isInteger(stats.avg) ? stats.avg : stats.avg.toFixed(1)) : '—'} {unit}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
