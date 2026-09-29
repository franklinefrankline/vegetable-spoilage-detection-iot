import React from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Activity
} from 'lucide-react';
import { getStatusBadgeConfig } from '../../utils/sensorStatus';

export function EnvironmentStatus({
  tempStatus = 'NORMAL',
  humStatus = 'OPTIMAL',
  gasStatus = 'BASELINE NORMAL',
  lightClassification = 'NORMAL LIGHT',
  overallStatus = 'FRESH',
  spoilageRisk = 18
}) {
  const overallConfig = getStatusBadgeConfig(overallStatus);

  const conditions = [
    { label: 'Temperature', status: tempStatus, icon: Thermometer, color: '#f97316' },
    { label: 'Humidity', status: humStatus, icon: Droplets, color: '#0ea5e9' },
    { label: 'Gas/VOC Indicator', status: gasStatus, icon: Wind, color: '#10b981' },
    { label: 'Light Exposure', status: lightClassification, icon: Sun, color: '#eab308' }
  ];

  return (
    <div
      className="vegsense-environment-summary"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <div>
          <h2 style={{
            fontSize: '1.1rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            margin: '0 0 2px 0',
            letterSpacing: '-0.01em'
          }}>
            Current Environment
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Unified atmospheric snapshot across storage sensors
          </p>
        </div>

        {/* Overall Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Overall Environment:
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '4px 12px',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.85rem',
              letterSpacing: '0.03em',
              backgroundColor: overallConfig.bg,
              color: overallConfig.color,
              border: `1px solid ${overallConfig.border}`
            }}
          >
            <Sparkles size={14} />
            <span>{overallStatus}</span>
          </span>

          <span style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '8px',
            background: 'var(--bg-card-subtle)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-light)'
          }}>
            Spoilage Risk: {spoilageRisk}%
          </span>
        </div>
      </div>

      {/* Grid of 4 environmental condition pills */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.75rem'
      }}>
        {conditions.map((item) => {
          const cfg = getStatusBadgeConfig(item.status);
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-light)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  backgroundColor: `${item.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: item.color
                }}>
                  <Icon size={14} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {item.label}
                </span>
              </div>

              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: cfg.color,
                backgroundColor: cfg.bg,
                border: `1px solid ${cfg.border}`,
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {item.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
