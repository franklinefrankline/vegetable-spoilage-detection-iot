import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Info
} from 'lucide-react';

export function SensorHistory({ sensorData, timeRange }) {
  const [activeTab, setActiveTab] = useState('temperature');

  const configs = {
    temperature: {
      id: 'temperature',
      label: 'Temperature',
      unit: '°C',
      key: 'temperature',
      stroke: 'var(--accent-amber, #f59e0b)',
      gradientId: 'tempGrad',
      icon: Thermometer,
      stats: sensorData?.stats?.temperature,
      points: sensorData?.temperature_points || [],
      description: 'Atmospheric thermal levels recorded over storage period.'
    },
    humidity: {
      id: 'humidity',
      label: 'Relative Humidity',
      unit: '%',
      key: 'humidity',
      stroke: 'var(--accent-blue, #3b82f6)',
      gradientId: 'humGrad',
      icon: Droplets,
      stats: sensorData?.stats?.humidity,
      points: sensorData?.humidity_points || [],
      description: 'Storage moisture and humidity levels.'
    },
    gas: {
      id: 'gas',
      label: 'Gas/VOC Indicator',
      unit: '',
      key: 'gas',
      stroke: 'var(--accent-purple, #8b5cf6)',
      gradientId: 'gasGrad',
      icon: Wind,
      stats: sensorData?.stats?.gas,
      points: sensorData?.gas_points || [],
      description: 'MQ-135 relative air quality & VOC indicator level (uncalibrated atmospheric index).'
    },
    light: {
      id: 'light',
      label: 'Light Level',
      unit: 'lx',
      key: 'light',
      stroke: 'var(--accent-green, #10b981)',
      gradientId: 'lightGrad',
      icon: Sun,
      stats: sensorData?.stats?.light,
      points: sensorData?.light_points || [],
      description: 'Storage ambient light exposure with photo-threshold classification.'
    }
  };

  const currentConfig = configs[activeTab];
  const points = currentConfig.points || [];
  const stats = currentConfig.stats || {};

  // Format time labels for XAxis
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

  // Trend icon & styling
  const renderTrendBadge = (trend) => {
    if (trend === 'RISING') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
          <TrendingUp size={14} /> RISING
        </span>
      );
    }
    if (trend === 'LOWERING') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-green)', fontWeight: 700 }}>
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
    return <span style={{ color: 'var(--text-muted)' }}>Unavailable</span>;
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const val = payload[0].value;
      let displayTime = '';
      try {
        displayTime = new Date(data.timestamp).toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch {
        displayTime = data.timestamp;
      }

      return (
        <div
          style={{
            backgroundColor: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-light, #e2e8f0)',
            borderRadius: '8px',
            padding: '0.65rem 0.85rem',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
            fontSize: '0.8rem',
            minWidth: '150px'
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={12} />
            {displayTime}
          </div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: currentConfig.stroke }}>
            {val != null ? `${val} ${currentConfig.unit}` : 'N/A (Gap)'}
          </div>
          {currentConfig.id === 'light' && val != null && (
            <div style={{ fontSize: '0.7rem', marginTop: '0.25rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {val < 100 ? 'LOW LIGHT (<100 lx)' : val > 500 ? 'HIGH LIGHT (>500 lx)' : 'NORMAL LIGHT (100–500 lx)'}
            </div>
          )}
          {sensorData?.aggregation && sensorData.aggregation !== 'raw' && (
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              ({sensorData.aggregation} average)
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="vegsense-card" style={{ padding: '1.25rem', marginBottom: '1.75rem' }}>
      {/* Header & Metric Tabs */}
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
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
            Sensor History
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {currentConfig.description}
          </p>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {Object.values(configs).map((cfg) => {
            const Icon = cfg.icon;
            const isSelected = activeTab === cfg.id;
            return (
              <button
                key={cfg.id}
                type="button"
                onClick={() => setActiveTab(cfg.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSelected ? `1px solid ${cfg.stroke}` : '1px solid var(--border-light)',
                  backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                  color: isSelected ? cfg.stroke : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={15} />
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Stats Row (Section 10 & 18) */}
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
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>CURRENT</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {stats.current != null ? `${stats.current} ${currentConfig.unit}` : 'N/A'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>AVERAGE</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {stats.average != null ? `${stats.average} ${currentConfig.unit}` : 'N/A'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>MINIMUM</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {stats.min != null ? `${stats.min} ${currentConfig.unit}` : 'N/A'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>MAXIMUM</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {stats.max != null ? `${stats.max} ${currentConfig.unit}` : 'N/A'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>HISTORICAL TREND</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.15rem' }}>
            {renderTrendBadge(stats.trend)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>TELEMETRY MODE</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'capitalize', marginTop: '0.15rem' }}>
            {sensorData?.aggregation ? `${sensorData.aggregation} Points` : 'Raw telemetry'}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      {points.length === 0 ? (
        <div
          style={{
            height: '280px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: 'var(--text-muted)'
          }}
        >
          <Info size={28} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>No {currentConfig.label.toLowerCase()} readings available for this period.</span>
          <span style={{ fontSize: '0.78rem' }}>Check filter parameters or verify storage device connectivity.</span>
        </div>
      ) : (
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light, #e2e8f0)" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--border-light)' }}
                tickLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--border-light)' }}
                tickLine={false}
                unit={currentConfig.unit ? ` ${currentConfig.unit}` : ''}
              />
              <Tooltip content={<CustomTooltip />} />
              {currentConfig.id === 'light' && (
                <>
                  <ReferenceLine y={100} stroke="var(--accent-blue)" strokeDasharray="3 3" label={{ value: 'Low Threshold', fill: 'var(--accent-blue)', fontSize: 10 }} />
                  <ReferenceLine y={500} stroke="var(--accent-amber)" strokeDasharray="3 3" label={{ value: 'High Threshold', fill: 'var(--accent-amber)', fontSize: 10 }} />
                </>
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke={currentConfig.stroke}
                strokeWidth={2.5}
                dot={points.length <= 30 ? { r: 3, fill: currentConfig.stroke } : false}
                activeDot={{ r: 6 }}
                connectNulls={false} // Gap for missing data (Section 21)
                name={currentConfig.label}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Light Classification Legend / Notes (Section 14 & 92) */}
      <div
        style={{
          marginTop: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)'
        }}
      >
        {currentConfig.id === 'light' ? (
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            <span><strong>Low Light:</strong> &lt;100 lux</span>
            <span><strong>Normal Light:</strong> 100–500 lux</span>
            <span><strong>High Light:</strong> &gt;500 lux</span>
          </div>
        ) : currentConfig.id === 'gas' ? (
          <div>
            <strong>Gas/VOC Indicator:</strong> Relative MQ-135 analog/digital detection level. Not a calibrated gas concentration spectrometer.
          </div>
        ) : (
          <div>
            Data points: <strong>{stats.data_points ?? points.length}</strong> | Unavailable / Gaps: <strong>{stats.unavailable_readings ?? 0}</strong>
          </div>
        )}

        <div style={{ color: 'var(--text-muted)' }}>
          {points.length > 0 && points[points.length - 1]?.timestamp && (
            <span>Last reading: {new Date(points[points.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          )}
        </div>
      </div>
    </div>
  );
}
