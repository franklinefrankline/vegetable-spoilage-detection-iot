import React from 'react';
import {
  Boxes,
  Package,
  Calendar,
  AlertCircle,
  Cpu,
  Layers,
  CheckCircle2,
  Clock
} from 'lucide-react';

export function StorageAnalytics({ storageData, deviceData }) {
  const summary = storageData?.summary || {
    total_batches: 0,
    active_batches: 0,
    expired_storage_batches: 0,
    vegetables_stored: 0,
    total_quantity_kg: 0
  };

  const vegetableBreakdown = storageData?.vegetable_breakdown || [];
  const devices = deviceData?.devices || [];

  return (
    <div className="vegsense-card" style={{ padding: '1.25rem', marginBottom: '1.75rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '1rem',
          marginBottom: '1.25rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <Boxes size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Storage Inventory & Vegetable Analytics
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Active storage batches, configured lifecycle retention tracking, and produce-level telemetry aggregations.
          </p>
        </div>
      </div>

      {/* Storage Summary KPIs (Section 28) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.25rem'
        }}
      >
        <div style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL BATCHES</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{summary.total_batches}</div>
        </div>
        <div style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-green)' }}>ACTIVE BATCHES</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-green)' }}>{summary.active_batches}</div>
        </div>
        <div style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-amber)' }}>EXPIRED CONFIG PERIODS</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{summary.expired_storage_batches}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Configured shelf limit passed</div>
        </div>
        <div style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>VEGETABLE VARIETIES</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{summary.vegetables_stored}</div>
        </div>
        <div style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL MONITORED MASS</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{summary.total_quantity_kg} kg</div>
        </div>
      </div>

      {/* Two Column Layout: Vegetable Analytics & Device Performance */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {/* Section 29: Vegetable Analytics Table */}
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.65rem' }}>
            Summary by Vegetable Variety
          </div>
          {vegetableBreakdown.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border-light)', borderRadius: '8px' }}>
              No vegetable inventory recorded.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>Vegetable</th>
                    <th style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>Batches</th>
                    <th style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>Avg Risk</th>
                    <th style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>Alerts</th>
                  </tr>
                </thead>
                <tbody>
                  {vegetableBreakdown.map((veg) => (
                    <tr key={veg.type} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>{veg.type}</td>
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)' }}>{veg.batches}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            backgroundColor: veg.avg_risk > 30 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: veg.avg_risk > 30 ? 'var(--accent-amber)' : 'var(--accent-green)'
                          }}
                        >
                          {veg.avg_risk != null ? `${veg.avg_risk}%` : 'N/A'}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)' }}>{veg.alerts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 50: Device Performance Analytics */}
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.65rem' }}>
            Storage Controller Performance (Connected Hardware)
          </div>
          {devices.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border-light)', borderRadius: '8px' }}>
              No hardware devices registered under this account.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {devices.map((dev) => (
                <div
                  key={dev.device_id}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-light)',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.78rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Cpu size={16} color="var(--primary)" />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{dev.device_id}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Status: <strong style={{ color: dev.is_online ? 'var(--accent-green)' : 'var(--accent-amber)' }}>{dev.is_online ? 'ONLINE' : 'STANDBY'}</strong> | Last seen: {dev.last_seen ? new Date(dev.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{dev.total_readings ?? 0} readings</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      {dev.active_alerts ?? 0} active alerts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
