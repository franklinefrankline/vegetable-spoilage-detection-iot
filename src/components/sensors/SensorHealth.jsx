import React from 'react';
import {
  Cpu,
  Thermometer,
  Wind,
  Sun,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  ShieldCheck
} from 'lucide-react';

export function SensorHealth({
  isDemo = true,
  isOffline = false,
  isLightUnavailable = false,
  isDhtUnavailable = false,
  isGasUnavailable = false,
  lastUpdated = new Date()
}) {
  const getStatus = (unavailable) => {
    if (isOffline) {
      return { label: 'Offline', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: XCircle };
    }
    if (unavailable) {
      return { label: 'Unavailable', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: AlertTriangle };
    }
    if (isDemo) {
      return { label: 'Demo', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: CheckCircle2 };
    }
    return { label: 'Connected', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: CheckCircle2 };
  };

  const sensors = [
    {
      name: 'DHT22 Climate Sensor',
      type: 'Temperature & Humidity',
      icon: Thermometer,
      status: getStatus(isDhtUnavailable)
    },
    {
      name: 'MQ-135 Gas / VOC Indicator',
      type: 'Broad VOC & Ammonia Detector',
      icon: Wind,
      status: getStatus(isGasUnavailable)
    },
    {
      name: 'BH1750 / LDR Light Sensor',
      type: 'Ambient Lux & Light Classification',
      icon: Sun,
      status: getStatus(isLightUnavailable)
    },
    {
      name: 'ESP32 Microcontroller',
      type: isDemo ? 'Virtual Demo Gateway' : 'Hardware Node (LAN)',
      icon: Cpu,
      status: getStatus(false)
    }
  ];

  return (
    <div
      className="vegsense-sensor-health-card"
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
            Sensor Health & Diagnostics
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            {isDemo ? 'Virtual telemetry diagnostic status' : 'Hardware interconnect link status'}
          </p>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Last Heartbeat: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Just now'}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0.75rem'
      }}>
        {sensors.map((s) => {
          const Icon = s.icon;
          const StatusIcon = s.status.icon;
          return (
            <div
              key={s.name}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  <Icon size={15} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {s.type}
                  </div>
                </div>
              </div>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: s.status.color,
                backgroundColor: s.status.bg,
                padding: '3px 8px',
                borderRadius: '6px'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: s.status.color
                }} />
                <span>{s.status.label}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
