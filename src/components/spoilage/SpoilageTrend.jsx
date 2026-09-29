import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Calendar,
  Layers,
  HelpCircle
} from 'lucide-react';
import { calculateRiskTrend } from '../../utils/spoilageRisk';

export function SpoilageTrend({
  history = [],
  isDemo = true,
  currentRange = '24h',
  onRangeChange
}) {
  const trend = useMemo(() => calculateRiskTrend(history), [history]);

  const trendIcon = () => {
    if (trend === 'RISING') return <TrendingUp size={16} color="#ef4444" />;
    if (trend === 'LOWER') return <TrendingDown size={16} color="#10b981" />;
    if (trend === 'STABLE') return <Minus size={16} color="#0ea5e9" />;
    return <HelpCircle size={16} color="var(--text-muted)" />;
  };

  const trendColor = trend === 'RISING' ? '#ef4444' : (trend === 'LOWER' ? '#10b981' : '#0ea5e9');

  // Chart coordinates
  const chart = useMemo(() => {
    if (!history || history.length === 0) return null;

    const width = 800;
    const height = 180;
    const padding = { top: 15, right: 25, bottom: 30, left: 35 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const risks = history.map((p) => Number(p.spoilageRisk ?? p.spoilage_risk ?? 18));
    const minVal = Math.max(0, Math.min(...risks) - 5);
    const maxVal = Math.min(100, Math.max(...risks) + 5);
    const valRange = maxVal - minVal || 10;

    const points = history.map((p, i) => {
      const x = padding.left + (i / (history.length - 1 || 1)) * chartW;
      const y = padding.top + chartH - ((risks[i] - minVal) / valRange) * chartH;
      return { x, y, risk: risks[i], time: p.time || p.recorded_at };
    });

    const pathD = points.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    const areaD = points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`
      : '';

    return { width, height, padding, chartW, chartH, points, pathD, areaD, minVal, maxVal };
  }, [history]);

  return (
    <div
      className="vegsense-spoilage-trend-card"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              margin: 0,
              letterSpacing: '-0.01em'
            }}>
              Spoilage Risk Trend
            </h2>
            {isDemo && (
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                padding: '1px 6px',
                borderRadius: '4px',
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                DEMO HISTORY
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            Longitudinal progression of calculated environmental spoilage risk
          </p>
        </div>

        {/* Dynamic Risk Trend Pill & Time Range Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '3px 8px',
            borderRadius: '6px',
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-light)',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            {trendIcon()}
            <span style={{ color: trendColor }}>Trend: {trend}</span>
          </div>

          <div style={{
            display: 'inline-flex',
            background: 'var(--bg-card-subtle)',
            padding: '2px',
            borderRadius: '6px',
            border: '1px solid var(--border-light)'
          }}>
            {['24h', '7d', '30d'].map((rng) => (
              <button
                key={rng}
                type="button"
                onClick={() => onRangeChange && onRangeChange(rng)}
                style={{
                  background: currentRange === rng ? 'var(--bg-card)' : 'transparent',
                  color: currentRange === rng ? 'var(--text-main)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  fontSize: '0.75rem',
                  fontWeight: currentRange === rng ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {rng.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Trend Chart */}
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        {chart ? (
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          >
            <defs>
              <linearGradient id="spoilageTrendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.5, 1].map((pct, i) => {
              const y = chart.padding.top + chart.chartH * pct;
              const val = Math.round(chart.maxVal - pct * (chart.maxVal - chart.minVal));
              return (
                <g key={i}>
                  <line
                    x1={chart.padding.left}
                    y1={y}
                    x2={chart.width - chart.padding.right}
                    y2={y}
                    stroke="var(--border-light)"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={chart.padding.left - 6}
                    y={y + 4}
                    fontSize="10"
                    fill="var(--text-muted)"
                    textAnchor="end"
                    fontWeight="600"
                  >
                    {val}%
                  </text>
                </g>
              );
            })}

            {/* Area */}
            {chart.areaD && <path d={chart.areaD} fill="url(#spoilageTrendGrad)" />}

            {/* Line */}
            {chart.pathD && (
              <path
                d={chart.pathD}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Points */}
            {chart.points.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r="3"
                fill="var(--bg-card)"
                stroke="#10b981"
                strokeWidth="2"
              />
            ))}

            {/* Time labels */}
            {chart.points.filter((_, i) => i % Math.ceil(chart.points.length / 6) === 0).map((pt, i) => (
              <text
                key={i}
                x={pt.x}
                y={chart.height - 8}
                fontSize="10"
                fill="var(--text-muted)"
                textAnchor="middle"
                fontWeight="500"
              >
                {pt.time}
              </text>
            ))}
          </svg>
        ) : (
          <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            No spoilage history points available yet.
          </div>
        )}
      </div>
    </div>
  );
}
