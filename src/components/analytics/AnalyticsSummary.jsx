import React from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  ShieldAlert,
  Bell,
  AlertTriangle,
  Database
} from 'lucide-react';

export function AnalyticsSummary({ summary }) {
  if (!summary) return null;

  const temp = summary.temperature || {};
  const hum = summary.humidity || {};
  const gas = summary.gas || {};
  const light = summary.light || {};
  const spoilage = summary.spoilage || {};
  const alerts = summary.alerts || {};

  const cards = [
    {
      id: 'avg_temp',
      title: 'Average Temperature',
      value: temp.average != null ? `${temp.average}°C` : 'N/A',
      sub: temp.min != null && temp.max != null ? `Min ${temp.min}°C • Max ${temp.max}°C` : 'Telemetry baseline',
      icon: Thermometer,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.25)'
    },
    {
      id: 'avg_hum',
      title: 'Average Humidity',
      value: hum.average != null ? `${hum.average}%` : 'N/A',
      sub: hum.min != null && hum.max != null ? `Min ${hum.min}% • Max ${hum.max}%` : 'Relative humidity',
      icon: Droplets,
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.1)',
      border: 'rgba(56, 189, 248, 0.25)'
    },
    {
      id: 'avg_gas',
      title: 'Average Gas/VOC',
      value: gas.average != null ? `${gas.average} ppm` : 'N/A',
      sub: gas.min != null && gas.max != null ? `Min ${gas.min} • Max ${gas.max} ppm` : 'MQ-135 Indicator',
      icon: Wind,
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.1)',
      border: 'rgba(168, 85, 247, 0.25)'
    },
    {
      id: 'avg_light',
      title: 'Average Light',
      value: light.average != null ? `${light.average} lux` : 'N/A',
      sub: light.min != null && light.max != null ? `Min ${light.min} • Max ${light.max} lux` : 'BH1750 / LDR',
      icon: Sun,
      color: '#eab308',
      bg: 'rgba(234, 179, 8, 0.1)',
      border: 'rgba(234, 179, 8, 0.25)'
    },
    {
      id: 'avg_risk',
      title: 'Average Spoilage Risk',
      value: spoilage.average != null ? `${spoilage.average}%` : 'N/A',
      sub: spoilage.min != null && spoilage.max != null ? `Min ${spoilage.min}% • Max ${spoilage.max}%` : 'Estimated environmental risk',
      icon: ShieldAlert,
      color: spoilage.average > 60 ? '#ef4444' : (spoilage.average > 30 ? '#f59e0b' : '#10b981'),
      bg: spoilage.average > 60 ? 'rgba(239, 68, 68, 0.1)' : (spoilage.average > 30 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)'),
      border: spoilage.average > 60 ? 'rgba(239, 68, 68, 0.25)' : (spoilage.average > 30 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)')
    },
    {
      id: 'total_alerts',
      title: 'Total Alerts',
      value: alerts.total ?? 0,
      sub: `${alerts.active ?? 0} Active • ${alerts.resolved ?? 0} Resolved`,
      icon: Bell,
      color: '#f97316',
      bg: 'rgba(249, 115, 22, 0.1)',
      border: 'rgba(249, 115, 22, 0.25)'
    },
    {
      id: 'crit_alerts',
      title: 'Critical Alerts',
      value: alerts.critical ?? 0,
      sub: `${alerts.high ?? 0} High • ${alerts.warning ?? 0} Warning`,
      icon: AlertTriangle,
      color: (alerts.critical || 0) > 0 ? '#ef4444' : 'var(--text-muted)',
      bg: (alerts.critical || 0) > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-subtle)',
      border: (alerts.critical || 0) > 0 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-light)'
    },
    {
      id: 'data_points',
      title: 'Data Points',
      value: summary.data_points ?? 0,
      sub: summary.data_quality?.status ? `Quality: ${summary.data_quality.status}` : 'Recorded readings',
      icon: Database,
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.1)',
      border: 'rgba(99, 102, 241, 0.25)'
    }
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}
    >
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.id}
            className="vegsense-card"
            style={{
              padding: '1.15rem 1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: c.bg,
                color: c.color,
                border: `1px solid ${c.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Icon size={20} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '0.2rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {c.title}
              </div>
              <div
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-main)',
                  lineHeight: 1.2,
                  marginBottom: '0.25rem'
                }}
              >
                {c.value}
              </div>
              <div
                style={{
                  fontSize: '0.725rem',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {c.sub}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
