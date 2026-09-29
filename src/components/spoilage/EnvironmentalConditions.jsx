import React from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { getStatusBadgeConfig } from '../../utils/sensorStatus';

export function EnvironmentalConditions({
  sensorData,
  breakdown = {}
}) {
  const temp = sensorData?.temperature != null ? `${Number(sensorData.temperature).toFixed(1)} °C` : '28.5 °C';
  const hum = sensorData?.humidity != null ? `${Math.round(sensorData.humidity)} %` : '72 %';
  const gas = `${sensorData?.gasLevel ?? sensorData?.gasVOC ?? 420} ppm`;
  const light = `${sensorData?.lightLevel != null ? Math.round(sensorData.lightLevel) : 420} lux`;

  const conditions = [
    {
      label: 'Temperature',
      value: temp,
      status: sensorData?.tempStatus || 'NORMAL',
      riskContribution: `${breakdown.temperatureRisk ?? 20}%`,
      icon: Thermometer,
      color: '#f97316'
    },
    {
      label: 'Humidity',
      value: hum,
      status: sensorData?.humStatus || 'OPTIMAL',
      riskContribution: `${breakdown.humidityRisk ?? 15}%`,
      icon: Droplets,
      color: '#0ea5e9'
    },
    {
      label: 'Gas / VOC',
      value: gas,
      status: sensorData?.gasStatus || 'BASELINE NORMAL',
      riskContribution: `${breakdown.gasRisk ?? 10}%`,
      icon: Wind,
      color: '#10b981',
      note: 'Gas/VOC Indicator'
    },
    {
      label: 'Light Level',
      value: light,
      status: sensorData?.lightClassification || 'NORMAL LIGHT',
      riskContribution: `${breakdown.lightRisk ?? 10}%`,
      icon: Sun,
      color: '#eab308'
    }
  ];

  return (
    <div
      className="vegsense-environmental-conditions-card"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{
          fontSize: '1.1rem',
          fontWeight: 800,
          color: 'var(--text-main)',
          margin: '0 0 2px 0',
          letterSpacing: '-0.01em'
        }}>
          Environmental Conditions
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
          Real-time input telemetry evaluated with corresponding risk contributions
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '0.75rem'
      }}>
        {conditions.map((item) => {
          const Icon = item.icon;
          const badgeCfg = getStatusBadgeConfig(item.status);

          return (
            <div
              key={item.label}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.4rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icon size={15} color={item.color} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      {item.label}
                    </span>
                  </div>
                  {item.note && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.note}</span>
                  )}
                </div>

                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: '2px 0' }}>
                  {item.value}
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '0.6rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border-light)'
              }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: badgeCfg.color,
                  backgroundColor: badgeCfg.bg,
                  border: `1px solid ${badgeCfg.border}`,
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  {item.status}
                </span>

                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Risk: {item.riskContribution}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
