import React from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info
} from 'lucide-react';

export function SpoilageDataQuality({
  dataQuality = 'GOOD',
  sensors = {}
}) {
  const isGood = dataQuality === 'GOOD';
  const isFair = dataQuality === 'FAIR';
  const isLimited = dataQuality === 'LIMITED';
  const isUnavailable = dataQuality === 'UNAVAILABLE';

  const badgeColor = isGood ? '#10b981' : (isFair ? '#0ea5e9' : (isLimited ? '#f59e0b' : '#ef4444'));

  const sensorList = [
    { name: 'DHT22 Temperature', ok: sensors.temp != null },
    { name: 'DHT22 Humidity', ok: sensors.hum != null },
    { name: 'MQ-135 Gas / VOC Indicator', ok: sensors.gas != null },
    { name: 'BH1750 / LDR Light Sensor', ok: sensors.light != null }
  ];

  return (
    <div
      className="vegsense-spoilage-quality-card"
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
        marginBottom: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={18} color={badgeColor} />
          <h2 style={{
            fontSize: '1rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            margin: 0,
            letterSpacing: '-0.01em'
          }}>
            Telemetry Data Quality & Sensor Input Integrity
          </h2>
        </div>

        <span style={{
          fontSize: '0.75rem',
          fontWeight: 800,
          color: badgeColor,
          background: `${badgeColor}15`,
          border: `1px solid ${badgeColor}35`,
          padding: '2px 8px',
          borderRadius: '4px'
        }}>
          {dataQuality}
        </span>
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.85rem 0' }}>
        {isGood
          ? 'All four primary environmental telemetry feeds are verified, active, and contributing to the multi-factor calculation.'
          : (isFair
            ? 'Three sensor feeds are active. The risk engine has automatically redistributed missing factor weights without bias.'
            : (isLimited
              ? 'One or more environmental sensors are offline. Data confidence is limited.'
              : 'Insufficient telemetry available to synthesize an accurate environmental spoilage score.'))}
      </p>

      {/* Sensor checklist */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.5rem'
      }}>
        {sensorList.map((s) => (
          <div
            key={s.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-light)',
              fontSize: '0.75rem'
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.name}</span>
            {s.ok ? (
              <CheckCircle2 size={13} color="#10b981" />
            ) : (
              <XCircle size={13} color="#ef4444" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
