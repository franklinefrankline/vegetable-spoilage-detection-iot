import React, { useState } from 'react';
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  ShieldCheck,
  Bell
} from 'lucide-react';

export function ComparisonPanel({ comparisonData }) {
  const current = comparisonData?.current_period || {};
  const previous = comparisonData?.previous_period || {};
  const diff = comparisonData?.difference || {};

  const metrics = [
    {
      label: 'Avg Temperature',
      icon: Thermometer,
      unit: '°C',
      curr: current.average_temperature,
      prev: previous.average_temperature,
      diff: diff.temperature_diff,
      invertGood: true // Rising temp in storage is usually negative
    },
    {
      label: 'Avg Humidity',
      icon: Droplets,
      unit: '%',
      curr: current.average_humidity,
      prev: previous.average_humidity,
      diff: diff.humidity_diff,
      invertGood: false
    },
    {
      label: 'Avg Gas/VOC Index',
      icon: Wind,
      unit: '',
      curr: current.average_gas,
      prev: previous.average_gas,
      diff: diff.gas_diff,
      invertGood: true // Rising gas is bad
    },
    {
      label: 'Avg Light Level',
      icon: Sun,
      unit: 'lx',
      curr: current.average_light,
      prev: previous.average_light,
      diff: diff.light_diff,
      invertGood: true // High light in storage can cause greening
    },
    {
      label: 'Avg Spoilage Risk',
      icon: ShieldCheck,
      unit: '%',
      curr: current.average_spoilage_risk,
      prev: previous.average_spoilage_risk,
      diff: diff.spoilage_risk_diff,
      invertGood: true // Rising risk is bad
    },
    {
      label: 'Total Incidents',
      icon: Bell,
      unit: '',
      curr: current.total_alerts,
      prev: previous.total_alerts,
      diff: diff.alerts_diff,
      invertGood: true // More alerts is bad
    }
  ];

  const renderDiffBadge = (val, invertGood) => {
    if (val == null) return <span style={{ color: 'var(--text-muted)' }}>N/A</span>;
    if (val === 0) return <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>0.0</span>;

    const isPositive = val > 0;
    const formatted = isPositive ? `+${val}` : `${val}`;
    const isBad = invertGood ? isPositive : !isPositive;
    const color = isBad ? 'var(--accent-red, #ef4444)' : 'var(--accent-green, #10b981)';

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.2rem',
          fontWeight: 700,
          color: color,
          backgroundColor: `${color}15`,
          padding: '0.15rem 0.45rem',
          borderRadius: '4px',
          fontSize: '0.75rem'
        }}
      >
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {formatted}
      </span>
    );
  };

  return (
    <div className="vegsense-card" style={{ padding: '1.25rem', marginBottom: '1.75rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '1rem',
          marginBottom: '1.25rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <GitCompare size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Period-over-Period Variance Analysis
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Compare metrics from the active time window against the immediately preceding identical duration.
          </p>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Current Window vs Previous Window
        </div>
      </div>

      {/* Comparison Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem'
        }}
      >
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              style={{
                padding: '0.9rem',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {m.label.toUpperCase()}
                </span>
                <Icon size={14} color="var(--text-muted)" />
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {m.curr != null ? `${m.curr}${m.unit ? ` ${m.unit}` : ''}` : 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    Prev: {m.prev != null ? `${m.prev}${m.unit ? ` ${m.unit}` : ''}` : 'N/A'}
                  </div>
                </div>
                <div>{renderDiffBadge(m.diff, m.invertGood)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
