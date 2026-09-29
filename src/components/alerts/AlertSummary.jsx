import React from 'react';
import { Bell, Flame, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function AlertSummary({ summary = {} }) {
  const cards = [
    {
      title: 'Total Alerts',
      value: summary.total ?? 0,
      icon: Bell,
      color: 'var(--primary)',
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'var(--border-light)'
    },
    {
      title: 'Active',
      value: summary.active ?? 0,
      icon: AlertTriangle,
      color: '#d97706',
      bg: 'rgba(217, 119, 6, 0.1)',
      border: 'rgba(217, 119, 6, 0.25)'
    },
    {
      title: 'Unread',
      value: summary.unread ?? 0,
      icon: Flame,
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.1)',
      border: 'rgba(37, 99, 235, 0.25)'
    },
    {
      title: 'Critical',
      value: summary.critical ?? 0,
      icon: ShieldAlert,
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.1)',
      border: 'rgba(220, 38, 38, 0.25)'
    }
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}
    >
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <div
            key={idx}
            className="vegsense-card"
            style={{
              padding: '1.15rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderColor: c.border
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.35rem'
                }}
              >
                {c.title}
              </div>
              <div
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 900,
                  color: 'var(--text-main)',
                  lineHeight: 1
                }}
              >
                {c.value}
              </div>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: c.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: c.color,
                flexShrink: 0
              }}
            >
              <Icon size={22} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
