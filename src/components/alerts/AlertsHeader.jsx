import React from 'react';
import { CheckCheck, BellRing, RefreshCw } from 'lucide-react';

export function AlertsHeader({ onMarkAllRead, onRefresh, unreadCount = 0 }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.75rem'
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--text-main)',
              margin: 0
            }}
          >
            Alerts & Notifications
          </h1>
          {unreadCount > 0 && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.15rem 0.55rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#dc2626',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              {unreadCount} Unread
            </span>
          )}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
          Monitor important storage, sensor and device events.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {onRefresh && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onRefresh}
            title="Refresh alerts"
            aria-label="Refresh alerts"
            style={{ height: '38px', padding: '0 0.85rem' }}
          >
            <RefreshCw size={15} />
          </button>
        )}
        <button
          type="button"
          className="btn-secondary"
          style={{ height: '38px', fontSize: '0.85rem' }}
          onClick={onMarkAllRead}
          aria-label="Mark all alerts as read"
        >
          <CheckCheck size={16} />
          <span>Mark all as read</span>
        </button>
      </div>
    </div>
  );
}
