import React from 'react';
import {
  FileText,
  PlusCircle,
  RefreshCw,
  Cpu,
  Radio,
  Sparkles
} from 'lucide-react';

export function ReportsHeader({
  isDemoMode,
  activeDevice,
  onOpenCreate,
  onRefresh,
  isRefreshing
}) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '0.75rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary-light, rgba(27, 77, 46, 0.1))',
                color: 'var(--primary, #1b4d2e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileText size={18} />
            </div>
            <h1
              style={{
                fontSize: '1.85rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: 'var(--text-main)',
                margin: 0
              }}
            >
              Reports & Archival Intelligence
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
            Generate, preview, and export comprehensive storage, atmospheric, spoilage-risk, and incident reports.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              height: '38px',
              padding: '0 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 700
            }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spinner' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreate}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              height: '38px',
              padding: '0 1.1rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(27, 77, 46, 0.2)'
            }}
          >
            <PlusCircle size={16} />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>SOURCE MODE:</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.15rem 0.55rem',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              backgroundColor: isDemoMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: isDemoMode ? 'var(--accent-amber, #f59e0b)' : 'var(--accent-green, #10b981)',
              border: isDemoMode ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isDemoMode ? 'var(--accent-amber, #f59e0b)' : 'var(--accent-green, #10b981)'
              }}
            />
            {isDemoMode ? 'DEMO MODE' : 'LIVE DEVICE'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CONTROLLER:</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.15rem 0.55rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-main)'
            }}
          >
            <Cpu size={12} color="var(--primary)" />
            {activeDevice || 'ESP32-DEMO-001'}
          </span>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Authoritative PDF Generation: <strong>Active</strong>
        </div>
      </div>
    </div>
  );
}
