import React from 'react';
import {
  Layers,
  Thermometer,
  Droplets,
  Wind,
  SunMedium,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import { evaluateEnvironmentalConditions } from '../../utils/lightClassification';

export function EnvironmentalConditionsCard({
  temperature = 28.5,
  humidity = 72,
  gasLevel = 420,
  lightLevel = 420,
  thresholds = {},
  isOffline = false
}) {
  const env = evaluateEnvironmentalConditions({
    temperature,
    humidity,
    gasLevel,
    lightLevel,
    thresholds
  });

  const getStatusIcon = (status) => {
    if (status === 'Normal' || status === 'Optimal' || status === 'Suitable') {
      return <CheckCircle2 size={13} color="#10b981" />;
    }
    if (status === 'Low Light' || status === 'High Humidity' || status === 'Moderate') {
      return <AlertTriangle size={13} color="#f59e0b" />;
    }
    if (status === 'Unavailable') {
      return <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-muted)' }} />;
    }
    return <AlertOctagon size={13} color="#ef4444" />;
  };

  return (
    <div className="vegsense-card environmental-conditions-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div className="card-header-row" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="card-badge-icon badge-icon-emerald" style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={18} />
            </div>
            <div>
              <h3 className="card-title" style={{ fontSize: '1.05rem', margin: 0 }}>Environmental Conditions</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Multi-Pillar Biosphere Analysis</span>
            </div>
          </div>

          <span
            className="status-pill"
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: isOffline ? 'var(--bg-subtle)' : env.overall === 'FRESH' ? 'rgba(16, 185, 129, 0.14)' : env.overall === 'WARNING' ? 'rgba(245, 158, 11, 0.14)' : 'rgba(239, 68, 68, 0.14)',
              color: isOffline ? 'var(--text-muted)' : env.overallColor,
              border: `1px solid ${isOffline ? 'var(--border-light)' : env.overallColor + '40'}`
            }}
          >
            {isOffline ? 'OFFLINE' : env.overall}
          </span>
        </div>

        {/* 4 Pillars Grid: Temperature, Humidity, Gas/VOC, Light */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem', marginBottom: '1rem' }}>
          {/* Temperature */}
          <div style={{ padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Thermometer size={15} color="#ea580c" />
              <span style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Temperature:</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.8rem', color: isOffline ? 'var(--text-muted)' : env.temperatureColor }}>
              {isOffline ? 'Offline' : (
                <>
                  {getStatusIcon(env.temperature)}
                  <span>{env.temperature}</span>
                </>
              )}
            </div>
          </div>

          {/* Humidity */}
          <div style={{ padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Droplets size={15} color="#0284c7" />
              <span style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Humidity:</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.8rem', color: isOffline ? 'var(--text-muted)' : env.humidityColor }}>
              {isOffline ? 'Offline' : (
                <>
                  {getStatusIcon(env.humidity)}
                  <span>{env.humidity}</span>
                </>
              )}
            </div>
          </div>

          {/* Gas / VOC */}
          <div style={{ padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Wind size={15} color="#10b981" />
              <span style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Gas/VOC:</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.8rem', color: isOffline ? 'var(--text-muted)' : env.gasColor }}>
              {isOffline ? 'Offline' : (
                <>
                  {getStatusIcon(env.gas)}
                  <span>{env.gas}</span>
                </>
              )}
            </div>
          </div>

          {/* Light Level */}
          <div style={{ padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <SunMedium size={15} color="#f59e0b" />
              <span style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Light:</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.8rem', color: isOffline ? 'var(--text-muted)' : env.lightColor }}>
              {isOffline ? 'Offline' : (
                <>
                  {getStatusIcon(env.light)}
                  <span>{env.light}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Overall Summary */}
      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Overall Atmospheric Index:</span>
        <strong style={{ color: isOffline ? 'var(--text-muted)' : env.overallColor, letterSpacing: '0.02em' }}>
          {isOffline ? 'Telemetry Paused' : env.overall}
        </strong>
      </div>
    </div>
  );
}

export default EnvironmentalConditionsCard;
