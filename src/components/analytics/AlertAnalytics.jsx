import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Activity,
  ShieldAlert,
  Info
} from 'lucide-react';

export function AlertAnalytics({ alertData, timeRange }) {
  const summary = alertData?.summary || {
    total_alerts: 0,
    active_alerts: 0,
    resolved_alerts: 0,
    unread_alerts: 0,
    critical_alerts: 0,
    high_alerts: 0,
    warning_alerts: 0,
    info_alerts: 0
  };

  const trendPoints = alertData?.trend_points || [];
  const byType = alertData?.by_type || [];
  const resolution = alertData?.resolution || {};
  const correlations = alertData?.correlations || [];

  // Severity slice colors
  const severityColors = {
    critical: 'var(--accent-red, #ef4444)',
    high: '#ea580c',
    warning: 'var(--accent-amber, #f59e0b)',
    info: 'var(--accent-blue, #3b82f6)'
  };

  const severityPieData = [
    { name: 'Critical', value: summary.critical_alerts, color: severityColors.critical },
    { name: 'High', value: summary.high_alerts, color: severityColors.high },
    { name: 'Warning', value: summary.warning_alerts, color: severityColors.warning },
    { name: 'Info', value: summary.info_alerts, color: severityColors.info }
  ].filter(d => d.value > 0);

  const formatXAxis = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (timeRange === '1h' || timeRange === '6h' || timeRange === '12h' || timeRange === '24h') {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      }
      return `${d.getMonth() + 1}/${d.getDate()}`;
    } catch {
      return '';
    }
  };

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
            <Bell size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Alert Analytics & Incident History
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Incident frequencies, severity categorizations, and resolution durations from Part 7 notification engine.
          </p>
        </div>

        {/* Resolution Time Highlight (Section 27) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.4rem 0.85rem',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-subtle, rgba(0,0,0,0.03))',
            border: '1px solid var(--border-light)'
          }}
        >
          <Clock size={16} color="var(--primary)" />
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>AVG RESOLUTION TIME</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {resolution.avg_resolution_display || 'No resolution history'}
            </div>
          </div>
        </div>
      </div>

      {/* Alert KPI Summary Grid (Section 22) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.25rem'
        }}
      >
        <div style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL ALERTS</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{summary.total_alerts}</div>
        </div>
        <div style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-amber)' }}>ACTIVE</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{summary.active_alerts}</div>
        </div>
        <div style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-green)' }}>RESOLVED</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-green)' }}>{summary.resolved_alerts}</div>
        </div>
        <div style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-red)' }}>CRITICAL</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-red)' }}>{summary.critical_alerts}</div>
        </div>
        <div style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ea580c' }}>HIGH</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ea580c' }}>{summary.high_alerts}</div>
        </div>
        <div style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-amber)' }}>WARNING</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{summary.warning_alerts}</div>
        </div>
        <div style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-blue, #3b82f6)' }}>INFO</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-blue, #3b82f6)' }}>{summary.info_alerts}</div>
        </div>
      </div>

      {/* Two Column Visualizations: Alerts Over Time & Category Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.25rem'
        }}
      >
        {/* Alerts Over Time Chart (Section 23) */}
        <div className="vegsense-card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
            Alerts Over Time
          </div>
          {trendPoints.length === 0 ? (
            <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No alert activity recorded for this period.
            </div>
          ) : (
            <div style={{ width: '100%', height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendPoints} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                  <XAxis dataKey="timestamp" tickFormatter={formatXAxis} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-light)',
                      borderRadius: '6px',
                      fontSize: '0.75rem'
                    }}
                  />
                  <Bar dataKey="count" name="Alert Events" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Most Frequent Alert Types Breakdown (Section 24 & 26) */}
        <div className="vegsense-card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
            Alerts by Category
          </div>
          {byType.length === 0 ? (
            <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No categorized alerts available.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
              {byType.map((item, index) => (
                <div key={`${item.type || 'type'}-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                    <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{item.type}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '80px', height: '6px', backgroundColor: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${summary.total_alerts > 0 ? (item.count / summary.total_alerts) * 100 : 0}%`,
                          height: '100%',
                          backgroundColor: 'var(--primary)'
                        }}
                      />
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)', minWidth: '20px', textAlign: 'right' }}>
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Environmental Events & Alerts Correlation (Section 60) */}
      {correlations.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            ENVIRONMENTAL EVENTS & ALERTS (OBSERVED CORRELATION)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {correlations.map((ev, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.4rem 0.65rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-subtle)',
                  fontSize: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap size={13} color="var(--accent-amber)" />
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{ev.event}</span>
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    backgroundColor: ev.severity === 'critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: ev.severity === 'critical' ? 'var(--accent-red)' : 'var(--accent-amber)'
                  }}
                >
                  {ev.severity.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Note: Events observed around the same period. Does not claim direct statistical causation.
          </div>
        </div>
      )}
    </div>
  );
}
