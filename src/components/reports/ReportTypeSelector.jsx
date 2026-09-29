import React from 'react';
import {
  Layers,
  Thermometer,
  ShieldAlert,
  Bell,
  Package,
  LineChart,
  Calendar,
  CalendarDays,
  CalendarRange,
  Sliders,
  CheckCircle2
} from 'lucide-react';

export const REPORT_TYPES_CONFIG = [
  {
    id: 'COMPLETE_STORAGE',
    title: 'Complete Storage Report',
    icon: Layers,
    badge: 'Comprehensive',
    description: 'All-inclusive audit of atmospheric telemetry, spoilage risks, inventory status, alert logs, and engineering guidance.'
  },
  {
    id: 'SENSOR_REPORT',
    title: 'Sensor Telemetry Report',
    icon: Thermometer,
    badge: 'Atmosphere',
    description: 'Detailed analysis of temperature, humidity, MQ-135 Gas/VOC indicator, and ambient lux levels with statistical extremes.'
  },
  {
    id: 'SPOILAGE_REPORT',
    title: 'Spoilage Risk Report',
    icon: ShieldAlert,
    badge: 'Risk Engine',
    description: 'Multivariate preservation heuristics, risk distributions, thermal/moisture risk factors, and condition spectrum time.'
  },
  {
    id: 'ALERT_REPORT',
    title: 'Alert Notification Report',
    icon: Bell,
    badge: 'Incidents',
    description: 'Audit log of threshold breaches, severity breakdowns, event timestamps, resolution durations, and mitigation actions.'
  },
  {
    id: 'BATCH_REPORT',
    title: 'Batch Lifecycle Report',
    icon: Package,
    badge: 'Inventory',
    description: 'Focused quality audit of a specific produce chamber batch, configured shelf-life retention, and risk progression.'
  },
  {
    id: 'ANALYTICS_REPORT',
    title: 'Analytics & Variance Report',
    icon: LineChart,
    badge: 'Intelligence',
    description: 'Period-over-period variance metrics, historical distribution benchmarks, and telemetry completeness ratings.'
  },
  {
    id: 'DAILY_REPORT',
    title: 'Daily Storage Report',
    icon: Calendar,
    badge: '24 Hours',
    description: 'Focused daily chamber review summarizing atmospheric conditions, daily incidents, and end-of-day quality indices.'
  },
  {
    id: 'WEEKLY_REPORT',
    title: 'Weekly Storage Summary',
    icon: CalendarDays,
    badge: '7 Days',
    description: 'Weekly aggregate trends, shelf stability projections, weekly incident frequencies, and produce retention cycles.'
  },
  {
    id: 'MONTHLY_REPORT',
    title: 'Monthly Preservation Audit',
    icon: CalendarRange,
    badge: '30 Days',
    description: 'Long-term monthly facility audit, aggregate crop performance, storage chamber utilization, and quality benchmarks.'
  },
  {
    id: 'CUSTOM_REPORT',
    title: 'Custom Query Report',
    icon: Sliders,
    badge: 'Configurable',
    description: 'User-defined date ranges, hardware controller filtering, targeted produce selection, and custom section inclusion.'
  }
];

export function ReportTypeSelector({ selectedType, onSelectType }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
        SELECT REPORT TYPE
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '0.75rem'
        }}
      >
        {REPORT_TYPES_CONFIG.map((cfg) => {
          const Icon = cfg.icon;
          const isSelected = selectedType === cfg.id;

          return (
            <div
              key={cfg.id}
              onClick={() => onSelectType(cfg.id)}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                border: isSelected ? '2px solid var(--primary, #1b4d2e)' : '1px solid var(--border-light, #e2e8f0)',
                backgroundColor: isSelected ? 'var(--primary-light, rgba(27, 77, 46, 0.05))' : 'var(--bg-card, #ffffff)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? 'var(--primary, #1b4d2e)' : 'var(--bg-subtle, rgba(0,0,0,0.04))',
                      color: isSelected ? '#ffffff' : 'var(--primary, #1b4d2e)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Icon size={15} />
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {cfg.title}
                  </span>
                </div>

                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    backgroundColor: isSelected ? 'var(--primary, #1b4d2e)' : 'var(--bg-subtle)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)'
                  }}
                >
                  {cfg.badge}
                </span>
              </div>

              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {cfg.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
