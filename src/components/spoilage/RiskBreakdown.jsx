import React from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Calendar,
  Layers,
  Info
} from 'lucide-react';

export function RiskBreakdown({ breakdown = {} }) {
  const items = [
    {
      label: 'Temperature Risk',
      risk: breakdown.temperatureRisk ?? 20,
      weight: '30%',
      icon: Thermometer,
      color: '#f97316'
    },
    {
      label: 'Humidity Risk',
      risk: breakdown.humidityRisk ?? 15,
      weight: '25%',
      icon: Droplets,
      color: '#0ea5e9'
    },
    {
      label: 'Gas/VOC Risk',
      risk: breakdown.gasRisk ?? 10,
      weight: '25%',
      icon: Wind,
      color: '#10b981',
      note: 'MQ-135 Indicator'
    },
    {
      label: 'Light Risk',
      risk: breakdown.lightRisk ?? 10,
      weight: '10%',
      icon: Sun,
      color: '#eab308'
    },
    {
      label: 'Storage Age Risk',
      risk: breakdown.storageAgeRisk ?? 5,
      weight: '10%',
      icon: Calendar,
      color: '#8b5cf6'
    }
  ];

  return (
    <div
      className="vegsense-risk-breakdown-card"
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
        gap: '0.5rem',
        marginBottom: '1.25rem'
      }}>
        <div>
          <h2 style={{
            fontSize: '1.1rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            margin: '0 0 2px 0',
            letterSpacing: '-0.01em'
          }}>
            Multi-Factor Risk Breakdown
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Individual risk scores before weighted composite synthesis
          </p>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Weighted Model: 100%
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {items.map((item) => {
          const Icon = item.icon;
          const score = Math.max(0, Math.min(100, item.risk));
          const scoreColor = score <= 30 ? '#10b981' : (score <= 60 ? '#f59e0b' : '#ef4444');

          return (
            <div key={item.label}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                marginBottom: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Icon size={15} color={item.color} />
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.label}</span>
                  {item.note && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({item.note})</span>
                  )}
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-card-subtle)',
                    padding: '1px 5px',
                    borderRadius: '4px'
                  }}>
                    Weight: {item.weight}
                  </span>
                </div>

                <span style={{ fontWeight: 800, color: scoreColor }}>
                  {score}%
                </span>
              </div>

              {/* Progress track */}
              <div style={{
                width: '100%',
                height: '7px',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-card-subtle)',
                overflow: 'hidden'
              }}>
                <div
                  style={{
                    width: `${score}%`,
                    height: '100%',
                    backgroundColor: scoreColor,
                    borderRadius: '4px',
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
