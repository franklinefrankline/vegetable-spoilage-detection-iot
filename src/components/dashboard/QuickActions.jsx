import React from 'react';
import { useNavigate } from '../../router/Router';
import {
  PlusCircle,
  Activity,
  Bell,
  FileText,
  Sliders,
  ChevronRight
} from 'lucide-react';

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'Add Vegetable',
      sublabel: 'Register batch',
      icon: PlusCircle,
      route: '/storage',
      color: 'var(--primary)',
      bg: 'var(--primary-light)'
    },
    {
      label: 'View Sensors',
      sublabel: 'Full telemetry',
      icon: Activity,
      route: '/sensors',
      color: '#0284c7',
      bg: 'rgba(2, 132, 199, 0.12)'
    },
    {
      label: 'View Alerts',
      sublabel: 'Event logs',
      icon: Bell,
      route: '/alerts',
      color: '#d97706',
      bg: 'rgba(217, 119, 6, 0.12)'
    },
    {
      label: 'View Reports',
      sublabel: 'Summary analytics',
      icon: FileText,
      route: '/reports',
      color: '#7c3aed',
      bg: 'rgba(124, 58, 237, 0.12)'
    },
    {
      label: 'Device Settings',
      sublabel: 'Thresholds & IP',
      icon: Sliders,
      route: '/settings',
      color: 'var(--text-secondary)',
      bg: 'var(--bg-subtle)'
    }
  ];

  return (
    <div className="vegsense-card quick-actions-card">
      <div className="card-header-row" style={{ marginBottom: '0.85rem' }}>
        <div>
          <span className="section-label-heading">SHORTCUTS</span>
          <h3 className="card-title" style={{ marginTop: '0.2rem' }}>Quick Actions</h3>
        </div>
      </div>

      <div className="quick-actions-grid">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.label}
              type="button"
              className="quick-action-item-btn"
              onClick={() => navigate(act.route)}
            >
              <div
                className="action-icon-circle"
                style={{ backgroundColor: act.bg, color: act.color }}
              >
                <Icon size={18} />
              </div>
              <div className="action-text-block">
                <span className="action-label">{act.label}</span>
                <span className="action-sublabel">{act.sublabel}</span>
              </div>
              <ChevronRight size={14} className="action-chevron" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
export default QuickActions;
