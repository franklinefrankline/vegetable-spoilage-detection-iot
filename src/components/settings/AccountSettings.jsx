import React from 'react';
import { ShieldCheck, Calendar, Clock, Key, LogOut, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function AccountSettings({ user, onLogout, onNavigateToDanger }) {
  const createdDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '28 September 2026';

  return (
    <div className="settings-panel">
      <div className="settings-panel-header">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Account & Persistence
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Account status, persistent storage lifecycle, and active tenant credentials.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
        {/* Status Card */}
        <div
          style={{
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem'
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            ACCOUNT STATUS
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: '#16a34a',
                display: 'inline-block',
                boxShadow: '0 0 0 3px rgba(22, 163, 74, 0.2)'
              }}
            />
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              ACTIVE
            </span>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            Fully operational tenant session
          </span>
        </div>

        {/* Member Since Card */}
        <div
          style={{
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem'
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            MEMBER SINCE
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
            <Calendar size={18} style={{ color: 'var(--primary-color, #1b4d2e)' }} />
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{createdDate}</span>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            Permanent database record
          </span>
        </div>

        {/* Account ID Card */}
        <div
          style={{
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem'
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            ACCOUNT IDENTIFIER
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
            <Key size={18} style={{ color: 'var(--primary-color, #1b4d2e)' }} />
            <span style={{ fontSize: '0.86rem', fontFamily: 'monospace', fontWeight: 600 }}>
              {user?.id ? user.id.slice(0, 14) + '...' : 'usr_standard'}
            </span>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
            Cryptographic tenant token
          </span>
        </div>
      </div>

      {/* Persistence Policy Callout */}
      <div
        style={{
          marginTop: '1.25rem',
          padding: '1rem 1.25rem',
          borderRadius: '10px',
          background: 'rgba(27, 77, 46, 0.05)',
          border: '1px solid rgba(27, 77, 46, 0.15)',
          display: 'flex',
          gap: '0.85rem'
        }}
      >
        <CheckCircle2 size={20} style={{ color: 'var(--primary-color, #1b4d2e)', flexShrink: 0, marginTop: '0.15rem' }} />
        <div>
          <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Non-Expiring Account Guarantee
          </h4>
          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            VegSense accounts do not automatically expire. If you log out or return days, months, or a year later, your saved devices, sensor telemetry history, storage batches, risk records, and reports remain permanently secured.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          type="button"
          onClick={onLogout}
          className="btn btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.25rem',
            fontWeight: 600,
            fontSize: '0.88rem'
          }}
        >
          <LogOut size={16} /> Sign Out of VegSense
        </button>

        <button
          type="button"
          onClick={onNavigateToDanger}
          style={{
            background: 'none',
            border: 'none',
            color: '#dc2626',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.4rem 0.6rem'
          }}
        >
          <AlertTriangle size={15} /> Delete Account Options
        </button>
      </div>
    </div>
  );
}
