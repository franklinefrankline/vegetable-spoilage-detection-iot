import React, { useState } from 'react';
import { useDevice } from '../context/DeviceContext';
import { useToast } from '../context/ToastContext';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Filter,
  Trash2,
  Clock
} from 'lucide-react';

export function AlertsPage() {
  const { alerts, markAlertsAsRead } = useDevice();
  const { addToast } = useToast();
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // 'ALL' | 'critical' | 'warning' | 'info'

  const filteredAlerts = alerts.filter((a) => {
    if (selectedFilter === 'ALL') return true;
    return a.category === selectedFilter;
  });

  const handleMarkAllRead = () => {
    markAlertsAsRead();
    addToast('All alerts marked as read.', 'success');
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'critical':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.725rem', fontWeight: 700 }}>
            <AlertTriangle size={12} /> Critical
          </span>
        );
      case 'warning':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.725rem', fontWeight: 700 }}>
            <AlertTriangle size={12} /> Warning
          </span>
        );
      case 'info':
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary-border)', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.725rem', fontWeight: 700 }}>
            <Info size={12} /> Information
          </span>
        );
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Alerts & Notification Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Atmospheric threshold alarms, sensor state notifications, and hardware connectivity events.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          style={{ height: '38px', fontSize: '0.85rem' }}
          onClick={handleMarkAllRead}
        >
          <CheckCheck size={16} />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="vegsense-card" style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'ALL', label: 'All Alerts' },
          { id: 'warning', label: 'Warnings' },
          { id: 'critical', label: 'Critical' },
          { id: 'info', label: 'Information' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`btn-secondary ${selectedFilter === tab.id ? 'active' : ''}`}
            style={{
              height: '34px',
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '0 0.85rem',
              backgroundColor: selectedFilter === tab.id ? 'var(--primary-light)' : 'transparent',
              borderColor: selectedFilter === tab.id ? 'var(--primary-border)' : 'var(--border-light)',
              color: selectedFilter === tab.id ? 'var(--primary)' : 'var(--text-secondary)'
            }}
            onClick={() => setSelectedFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filteredAlerts.length === 0 ? (
          <div className="vegsense-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <CheckCircle2 size={36} color="var(--primary)" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>No Alerts In This Category</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Storage conditions remain within all configured parameters.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="vegsense-card"
              style={{
                padding: '1.25rem 1.5rem',
                borderLeft: !alert.read ? '4px solid var(--primary)' : '1px solid var(--border-light)',
                backgroundColor: !alert.read ? 'var(--bg-card)' : 'var(--bg-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                  <div style={{ marginTop: '2px' }}>
                    {alert.category === 'warning' && <AlertTriangle size={20} color="#d97706" />}
                    {alert.category === 'critical' && <AlertTriangle size={20} color="#dc2626" />}
                    {alert.category === 'info' && <CheckCircle2 size={20} color="var(--primary)" />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.975rem', color: 'var(--text-main)' }}>{alert.title}</span>
                      {getCategoryBadge(alert.category)}
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{alert.message}</p>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />
                  <span>{alert.time}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
