import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Activity,
  Layers,
  Info
} from 'lucide-react';

export function SpoilageRiskChart({ spoilageData, timeRange }) {
  const [viewMode, setViewMode] = useState('risk'); // 'risk' or 'correlation'

  const points = spoilageData?.points || [];
  const stats = spoilageData?.stats || {};
  const distribution = spoilageData?.distribution || { fresh: 0, warning: 0, spoilage_risk: 0, critical: 0 };
  const timeInCondition = spoilageData?.time_in_condition || { fresh: '0m', warning: '0m', spoilage_risk: '0m', critical: '0m' };

  const formatXAxis = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (timeRange === '1h' || timeRange === '6h' || timeRange === '12h' || timeRange === '24h') {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      }
      return `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    } catch {
      return '';
    }
  };

  const renderTrendBadge = (trend) => {
    if (trend === 'RISING') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-red, #ef4444)', fontWeight: 700 }}>
          <TrendingUp size={14} /> RISING
        </span>
      );
    }
    if (trend === 'LOWERING') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-green, #10b981)', fontWeight: 700 }}>
          <TrendingDown size={14} /> LOWERING
        </span>
      );
    }
    if (trend === 'STABLE') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
          <Minus size={14} /> STABLE
        </span>
      );
    }
    return <span style={{ color: 'var(--text-muted)' }}>Trend unavailable</span>;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const riskVal = data.risk ?? data.spoilage_risk;
      let displayTime = '';
      try {
        displayTime = new Date(data.timestamp).toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        displayTime = data.timestamp;
      }

      let badgeColor = 'var(--accent-green)';
      let badgeLabel = 'FRESH';
      if (riskVal > 80) {
        badgeColor = 'var(--accent-red)';
        badgeLabel = 'CRITICAL';
      } else if (riskVal > 60) {
        badgeColor = '#ea580c';
        badgeLabel = 'SPOILAGE RISK';
      } else if (riskVal > 30) {
        badgeColor = 'var(--accent-amber)';
        badgeLabel = 'WARNING';
      }

      return (
        <div
          style={{
            backgroundColor: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-light, #e2e8f0)',
            borderRadius: '8px',
            padding: '0.75rem 0.95rem',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
            fontSize: '0.8rem',
            minWidth: '180px'
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={12} />
            {displayTime}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: badgeColor }}>
              {riskVal != null ? `${riskVal}%` : 'N/A'}
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '0.15rem 0.4rem',
                borderRadius: '4px',
                backgroundColor: `${badgeColor}20`,
                color: badgeColor
              }}
            >
              {badgeLabel}
            </span>
          </div>

          {/* Sub-factor contributions if available */}
          {(data.temperature_risk != null || data.humidity_risk != null || data.gas_risk != null || data.light_risk != null) && (
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.35rem', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              <div>Thermal impact: {data.temperature_risk ?? 0}%</div>
              <div>Moisture impact: {data.humidity_risk ?? 0}%</div>
              <div>VOC impact: {data.gas_risk ?? 0}%</div>
              <div>Light impact: {data.light_risk ?? 0}%</div>
            </div>
          )}
        </div>
      );
    }
    return null;
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
            <ShieldAlert size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Estimated Spoilage Risk Trend
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Multivariate risk calculation persisted from the active storage spoilage engine.
          </p>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            type="button"
            onClick={() => setViewMode('risk')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: viewMode === 'risk' ? '1px solid var(--primary)' : '1px solid var(--border-light)',
              backgroundColor: viewMode === 'risk' ? 'var(--primary-light)' : 'transparent',
              color: viewMode === 'risk' ? 'var(--primary)' : 'var(--text-secondary)'
            }}
          >
            Risk Trajectory
          </button>
          <button
            type="button"
            onClick={() => setViewMode('correlation')}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: viewMode === 'correlation' ? '1px solid var(--primary)' : '1px solid var(--border-light)',
              backgroundColor: viewMode === 'correlation' ? 'var(--primary-light)' : 'transparent',
              color: viewMode === 'correlation' ? 'var(--primary)' : 'var(--text-secondary)'
            }}
          >
            Observed Correlation
          </button>
        </div>
      </div>

      {/* KPI Row (Section 16) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
          backgroundColor: 'var(--bg-subtle, rgba(0,0,0,0.02))',
          padding: '0.85rem',
          borderRadius: '8px',
          border: '1px solid var(--border-light)',
          marginBottom: '1.25rem'
        }}
      >
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>CURRENT RISK</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {stats.current != null ? `${stats.current}%` : 'N/A'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>AVERAGE RISK</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {stats.average != null ? `${stats.average}%` : 'N/A'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>MINIMUM RISK</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {stats.min != null ? `${stats.min}%` : 'N/A'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>MAXIMUM RISK</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {stats.max != null ? `${stats.max}%` : 'N/A'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>RISK TRAJECTORY</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.15rem' }}>
            {renderTrendBadge(stats.trend)}
          </div>
        </div>
      </div>

      {/* Main Chart or Correlation View */}
      {points.length === 0 ? (
        <div
          style={{
            height: '260px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: 'var(--text-muted)'
          }}
        >
          <Info size={28} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>No spoilage history available for this period.</span>
          <span style={{ fontSize: '0.78rem' }}>Check filter parameters or verify storage batch monitoring activity.</span>
        </div>
      ) : viewMode === 'risk' ? (
        <div style={{ width: '100%', height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="riskAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-red, #ef4444)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--accent-green, #10b981)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light, #e2e8f0)" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--border-light)' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--border-light)' }}
                tickLine={false}
                unit="%"
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Threshold guidelines */}
              <ReferenceLine y={30} stroke="var(--accent-amber)" strokeDasharray="3 3" label={{ value: 'Warning (30%)', fill: 'var(--accent-amber)', fontSize: 10 }} />
              <ReferenceLine y={60} stroke="#ea580c" strokeDasharray="3 3" label={{ value: 'Spoilage Risk (60%)', fill: '#ea580c', fontSize: 10 }} />
              <ReferenceLine y={80} stroke="var(--accent-red)" strokeDasharray="3 3" label={{ value: 'Critical (80%)', fill: 'var(--accent-red)', fontSize: 10 }} />
              <Area
                type="monotone"
                dataKey="risk"
                stroke="var(--accent-amber)"
                strokeWidth={2.5}
                fill="url(#riskAreaGrad)"
                dot={points.length <= 30 ? { r: 3, fill: 'var(--accent-amber)' } : false}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        /* Section 32: Environment vs Risk observed relationship */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', padding: '0.5rem 0' }}>
          <div className="vegsense-card" style={{ padding: '0.85rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Temperature vs Risk
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Observed relationship: Readings above 24°C consistently accelerate microbial activity scoring in the Part 6 engine.
            </p>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Comparison type: Atmospheric Thermal Index</div>
          </div>
          <div className="vegsense-card" style={{ padding: '0.85rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Humidity vs Risk
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Observed relationship: Moisture exceeding 85% RH triggers fungal spore escalation logic in storage chambers.
            </p>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Comparison type: Relative Humidity %</div>
          </div>
          <div className="vegsense-card" style={{ padding: '0.85rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Gas/VOC vs Risk
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Observed relationship: Elevated MQ-135 indices coincide with ethylene accumulation and tissue decay events.
            </p>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Comparison type: Uncalibrated VOC Indicator</div>
          </div>
          <div className="vegsense-card" style={{ padding: '0.85rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Light vs Risk
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Observed relationship: Ambient light &gt;500 lx induces solanine greening risks in susceptible produce batches.
            </p>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Comparison type: Photometric Lux</div>
          </div>
        </div>
      )}

      {/* Risk Distribution Bar (Section 58) & Estimated Time in Condition (Section 59) */}
      <div
        style={{
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-light)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            HISTORICAL RISK DISTRIBUTION
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Estimated time based on recorded readings
          </span>
        </div>

        {/* Multi-segment distribution progress bar */}
        <div
          style={{
            height: '10px',
            borderRadius: '5px',
            display: 'flex',
            overflow: 'hidden',
            backgroundColor: 'var(--border-light)',
            marginBottom: '0.75rem'
          }}
        >
          <div style={{ width: `${distribution.fresh}%`, backgroundColor: 'var(--accent-green, #10b981)' }} title={`Fresh: ${distribution.fresh}%`} />
          <div style={{ width: `${distribution.warning}%`, backgroundColor: 'var(--accent-amber, #f59e0b)' }} title={`Warning: ${distribution.warning}%`} />
          <div style={{ width: `${distribution.spoilage_risk}%`, backgroundColor: '#ea580c' }} title={`Spoilage Risk: ${distribution.spoilage_risk}%`} />
          <div style={{ width: `${distribution.critical}%`, backgroundColor: 'var(--accent-red, #ef4444)' }} title={`Critical: ${distribution.critical}%`} />
        </div>

        {/* Legend with percentages and time */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.75rem',
            fontSize: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-green)' }} />
            <div>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Fresh (0–30%):</span> {distribution.fresh}%
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>~{timeInCondition.fresh}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-amber)' }} />
            <div>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Warning (31–60%):</span> {distribution.warning}%
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>~{timeInCondition.warning}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ea580c' }} />
            <div>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Risk (61–80%):</span> {distribution.spoilage_risk}%
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>~{timeInCondition.spoilage_risk}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-red)' }} />
            <div>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Critical (81–100%):</span> {distribution.critical}%
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>~{timeInCondition.critical}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
