import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { useAppearance } from '../../context/AppearanceContext';
import { Activity, Thermometer, Droplets, Wind, Layers } from 'lucide-react';

export function SensorChart({
  history = [],
  currentData,
  isOffline = false
}) {
  const { settings } = useAppearance();
  const [selectedMetric, setSelectedMetric] = useState('temp'); // 'temp' | 'humidity' | 'gas'

  const isNight = settings.theme === 'night-monitor';

  // Metric-specific config
  const metricConfigs = {
    temp: {
      name: 'Temperature',
      dataKey: 'temperature',
      unit: '°C',
      color: isNight ? '#22d3ee' : '#1b4d2e',
      stroke: isNight ? '#22d3ee' : '#1b4d2e',
      fill: isNight ? '#22d3ee' : '#16a34a',
      icon: Thermometer,
      domain: ['auto', 'auto'],
      currentVal: currentData?.temperature !== undefined ? `${currentData.temperature}°C` : '--'
    },
    humidity: {
      name: 'Humidity',
      dataKey: 'humidity',
      unit: '%',
      color: '#0284c7',
      stroke: '#0284c7',
      fill: '#0284c7',
      icon: Droplets,
      domain: [0, 100],
      currentVal: currentData?.humidity !== undefined ? `${currentData.humidity}%` : '--'
    },
    gas: {
      name: 'Gas / VOC',
      dataKey: 'gas',
      unit: 'ppm',
      color: isNight ? '#10b981' : '#425f33',
      stroke: isNight ? '#10b981' : '#16a34a',
      fill: isNight ? '#10b981' : '#16a34a',
      icon: Wind,
      domain: ['auto', 'auto'],
      currentVal: (currentData?.gasLevel ?? currentData?.gasVOC) !== undefined ? `${currentData.gasLevel ?? currentData.gasVOC} ppm` : '--'
    }
  };

  const activeConfig = metricConfigs[selectedMetric];

  // Custom chart tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0];
      return (
        <div className="custom-chart-tooltip">
          <div className="tooltip-time">{label}</div>
          <div className="tooltip-value" style={{ color: activeConfig.stroke }}>
            <span>{activeConfig.name}:</span>
            <strong>{dataPoint.value} {activeConfig.unit}</strong>
          </div>
          {dataPoint.payload.spoilageRisk !== undefined && (
            <div className="tooltip-risk">
              <span>Risk:</span>
              <strong>{dataPoint.payload.spoilageRisk}%</strong>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="vegsense-card sensor-chart-card">
      <div className="card-header-row chart-header-row">
        <div>
          <span className="section-label-heading">REAL-TIME TELEMETRY</span>
          <h3 className="card-title" style={{ marginTop: '0.2rem' }}>Live Sensor Data</h3>
          <span className="chart-points-counter">
            {history.length > 0 ? `${history.length} of max 30 actual readings recorded` : 'Awaiting sensor stream'}
          </span>
        </div>

        {/* Metric Selector Tabs */}
        <div className="chart-metric-tabs">
          <button
            type="button"
            className={`metric-tab-btn ${selectedMetric === 'temp' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('temp')}
          >
            <Thermometer size={14} />
            <span>Temperature ({metricConfigs.temp.currentVal})</span>
          </button>

          <button
            type="button"
            className={`metric-tab-btn ${selectedMetric === 'humidity' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('humidity')}
          >
            <Droplets size={14} />
            <span>Humidity ({metricConfigs.humidity.currentVal})</span>
          </button>

          <button
            type="button"
            className={`metric-tab-btn ${selectedMetric === 'gas' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('gas')}
          >
            <Wind size={14} />
            <span>Gas / VOC ({metricConfigs.gas.currentVal})</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="chart-canvas-wrapper" style={{ width: '100%', height: 260, marginTop: '1rem' }}>
        {history.length === 0 ? (
          <div className="chart-empty-state">
            <Activity className="spinner" size={24} style={{ color: 'var(--primary)' }} />
            <span>Waiting for sensor readings from ESP32...</span>
            <small style={{ color: 'var(--text-muted)' }}>Each 5-second polling response adds a verifiable data point.</small>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeConfig.fill} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={activeConfig.fill} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isNight ? 'rgba(34, 211, 238, 0.1)' : 'rgba(227, 219, 203, 0.6)'}
                vertical={false}
              />

              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fill: isNight ? '#94a3b8' : '#5e7264' }}
                axisLine={{ stroke: isNight ? 'rgba(34, 211, 238, 0.15)' : '#e3dbcb' }}
                tickLine={false}
              />

              <YAxis
                domain={activeConfig.domain}
                tick={{ fontSize: 11, fill: isNight ? '#94a3b8' : '#5e7264' }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey={activeConfig.dataKey}
                stroke={activeConfig.stroke}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#gradient-${selectedMetric})`}
                dot={{ r: 3, fill: activeConfig.stroke, strokeWidth: 1, stroke: '#ffffff' }}
                activeDot={{ r: 6, stroke: activeConfig.stroke, strokeWidth: 2, fill: '#ffffff' }}
                isAnimationActive={settings.animation !== 'off'}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
export default SensorChart;
