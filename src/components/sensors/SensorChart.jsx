import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Layers,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Clock,
  Info
} from 'lucide-react';

const SENSOR_OPTIONS = [
  { id: 'temperature', label: 'Temperature (°C)', unit: '°C', color: '#f97316', icon: Thermometer },
  { id: 'humidity', label: 'Humidity (%)', unit: '%', color: '#0ea5e9', icon: Droplets },
  { id: 'gas', label: 'Gas / VOC (ppm)', unit: 'ppm', color: '#10b981', icon: Wind },
  { id: 'light', label: 'Light Level (lux)', unit: 'lux', color: '#eab308', icon: Sun },
  { id: 'compare_temp_hum', label: 'Compare: Temp + Humidity', isCompare: true, primaryId: 'temperature', secondaryId: 'humidity', color: '#f97316', secondaryColor: '#0ea5e9', icon: Layers },
  { id: 'compare_temp_light', label: 'Compare: Temp + Light', isCompare: true, primaryId: 'temperature', secondaryId: 'light', color: '#f97316', secondaryColor: '#eab308', icon: Layers }
];

const TIME_RANGES = [
  { id: '1h', label: '1 Hour' },
  { id: '6h', label: '6 Hours' },
  { id: '12h', label: '12 Hours' },
  { id: '24h', label: '24 Hours' },
  { id: '7d', label: '7 Days' }
];

export function SensorChart({
  history = [],
  isDemo = true,
  currentRange = '24h',
  onRangeChange
}) {
  const [selectedSensorId, setSelectedSensorId] = useState('temperature');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const activeOption = useMemo(() => {
    return SENSOR_OPTIONS.find((opt) => opt.id === selectedSensorId) || SENSOR_OPTIONS[0];
  }, [selectedSensorId]);

  // Extract series values
  const getVal = (pt, sensorKey) => {
    if (!pt) return 0;
    if (sensorKey === 'temperature') return Number(pt.temperature ?? 28.5);
    if (sensorKey === 'humidity') return Number(pt.humidity ?? 72);
    if (sensorKey === 'gas') return Number(pt.gasLevel ?? pt.gas_level ?? pt.gasVOC ?? 420);
    if (sensorKey === 'light') return Number(pt.lightLevel ?? pt.light_level ?? 420);
    return 0;
  };

  // Generate SVG path coordinates
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return null;

    const width = 800;
    const height = 240;
    const padding = { top: 20, right: 30, bottom: 35, left: 45 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const primaryKey = activeOption.isCompare ? activeOption.primaryId : activeOption.id;
    const primaryVals = history.map((pt) => getVal(pt, primaryKey));

    let minVal = Math.min(...primaryVals);
    let maxVal = Math.max(...primaryVals);
    if (minVal === maxVal) {
      minVal -= 2;
      maxVal += 2;
    }
    const valRange = maxVal - minVal;

    const primaryPoints = history.map((pt, i) => {
      const x = padding.left + (i / (history.length - 1 || 1)) * chartW;
      const y = padding.top + chartH - ((primaryVals[i] - minVal) / (valRange || 1)) * chartH;
      return { x, y, val: primaryVals[i], time: pt.time || pt.recorded_at, raw: pt };
    });

    const primaryPath = primaryPoints.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');

    // Area fill
    const areaPath = primaryPoints.length > 0
      ? `${primaryPath} L ${primaryPoints[primaryPoints.length - 1].x} ${padding.top + chartH} L ${primaryPoints[0].x} ${padding.top + chartH} Z`
      : '';

    // Secondary line for comparison
    let secondaryPath = null;
    let secondaryPoints = null;
    let secondaryMin = 0;
    let secondaryMax = 100;

    if (activeOption.isCompare) {
      const secVals = history.map((pt) => getVal(pt, activeOption.secondaryId));
      secondaryMin = Math.min(...secVals);
      secondaryMax = Math.max(...secVals);
      if (secondaryMin === secondaryMax) {
        secondaryMin -= 2;
        secondaryMax += 2;
      }
      const secRange = secondaryMax - secondaryMin;

      secondaryPoints = history.map((pt, i) => {
        const x = padding.left + (i / (history.length - 1 || 1)) * chartW;
        const y = padding.top + chartH - ((secVals[i] - secondaryMin) / (secRange || 1)) * chartH;
        return { x, y, val: secVals[i], time: pt.time || pt.recorded_at };
      });

      secondaryPath = secondaryPoints.reduce((acc, pt, i) => {
        return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
      }, '');
    }

    return {
      width,
      height,
      padding,
      chartW,
      chartH,
      minVal,
      maxVal,
      primaryPoints,
      primaryPath,
      areaPath,
      secondaryPath,
      secondaryPoints,
      secondaryMin,
      secondaryMax
    };
  }, [history, activeOption]);

  return (
    <div
      className="vegsense-sensor-chart-card"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
    >
      {/* Chart Header Bar: Title, Sensor Selector, Time Ranges */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              margin: '0 0 2px 0',
              letterSpacing: '-0.01em'
            }}>
              Sensor Trends
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Historical atmospheric progression
              </span>
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
          </div>

          {/* Sensor Dropdown Selector */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedSensorId}
              onChange={(e) => setSelectedSensorId(e.target.value)}
              style={{
                background: 'var(--bg-card-subtle)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '0.45rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {SENSOR_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Time Range Selector Tabs (Section 27) */}
        <div style={{
          display: 'inline-flex',
          background: 'var(--bg-card-subtle)',
          padding: '3px',
          borderRadius: '8px',
          border: '1px solid var(--border-light)',
          flexWrap: 'wrap'
        }}>
          {TIME_RANGES.map((rng) => {
            const isActive = currentRange === rng.id;
            return (
              <button
                key={rng.id}
                type="button"
                onClick={() => onRangeChange && onRangeChange(rng.id)}
                style={{
                  background: isActive ? 'var(--bg-card)' : 'transparent',
                  color: isActive ? 'var(--text-main)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {rng.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Responsive Line Chart */}
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        {chartData ? (
          <svg
            viewBox={`0 0 ${chartData.width} ${chartData.height}`}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          >
            <defs>
              <linearGradient id={`grad_${activeOption.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={activeOption.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={activeOption.color} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const y = chartData.padding.top + chartData.chartH * pct;
              const val = chartData.maxVal - pct * (chartData.maxVal - chartData.minVal);
              return (
                <g key={idx}>
                  <line
                    x1={chartData.padding.left}
                    y1={y}
                    x2={chartData.width - chartData.padding.right}
                    y2={y}
                    stroke="var(--border-light)"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={chartData.padding.left - 8}
                    y={y + 4}
                    fontSize="10"
                    fill="var(--text-muted)"
                    textAnchor="end"
                    fontWeight="600"
                  >
                    {Number.isInteger(val) ? val : val.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            {chartData.areaPath && (
              <path d={chartData.areaPath} fill={`url(#grad_${activeOption.id})`} />
            )}

            {/* Primary Series Line */}
            {chartData.primaryPath && (
              <path
                d={chartData.primaryPath}
                fill="none"
                stroke={activeOption.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Secondary Series Line (if comparing) */}
            {chartData.secondaryPath && (
              <path
                d={chartData.secondaryPath}
                fill="none"
                stroke={activeOption.secondaryColor || '#0ea5e9'}
                strokeWidth="2.5"
                strokeDasharray="6 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Data Points */}
            {chartData.primaryPoints.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r="3.5"
                fill="var(--bg-card)"
                stroke={activeOption.color}
                strokeWidth="2"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            ))}

            {/* X-axis time labels */}
            {chartData.primaryPoints.filter((_, i) => i % Math.ceil(chartData.primaryPoints.length / 6) === 0).map((pt, i) => (
              <text
                key={i}
                x={pt.x}
                y={chartData.height - 10}
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
          <div style={{
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.9rem'
          }}>
            Waiting for sensor readings...
          </div>
        )}

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '15px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '0.8rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            pointerEvents: 'none'
          }}>
            <span style={{ fontWeight: 700, color: activeOption.color }}>
              {hoveredPoint.val} {activeOption.unit || ''}
            </span>
            <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
              ({hoveredPoint.time})
            </span>
          </div>
        )}
      </div>

      {/* Legend & Details */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginTop: '0.75rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border-light)',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: activeOption.color }} />
            <span style={{ fontWeight: 600 }}>{activeOption.isCompare ? activeOption.primaryId : activeOption.label}</span>
          </div>
          {activeOption.isCompare && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: activeOption.secondaryColor }} />
              <span style={{ fontWeight: 600 }}>{activeOption.secondaryId}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
          <Info size={12} />
          <span>Real-time polling every 5 seconds</span>
        </div>
      </div>
    </div>
  );
}
