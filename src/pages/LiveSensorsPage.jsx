import React, { useState } from 'react';
import { useDevice } from '../context/DeviceContext';
import {
  Gauge,
  Thermometer,
  Droplets,
  Wind,
  Radio,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  SunMedium,
  Sun,
  Eye,
  Sliders,
  ShieldCheck,
  TrendingUp,
  Cpu
} from 'lucide-react';

export function LiveSensorsPage() {
  const { isConnected, device, sensorData, thresholds } = useDevice();
  const [selectedSensor, setSelectedSensor] = useState('temp');

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const isLightUnavailable = sensorData?.isLightUnavailable;
  const lightClass = sensorData?.lightClassification || 'NORMAL LIGHT';
  const lightRiskVal = sensorData?.lightRisk ?? 10;
  const minLightThreshold = thresholds?.minLight ?? 100;
  const maxLightThreshold = thresholds?.maxLight ?? 500;

  // Visual color for light classification
  const getLightClassColor = () => {
    if (isLightUnavailable) return 'var(--text-muted)';
    if (lightClass === 'LOW LIGHT') return '#eab308'; // Amber/Yellow
    if (lightClass === 'HIGH LIGHT') return '#ef4444'; // Orange/Red
    return '#10b981'; // Green
  };

  const getLightStatusText = () => {
    if (isLightUnavailable) return 'Light Sensor Unavailable';
    if (lightClass === 'LOW LIGHT') return 'Low Light Warning';
    if (lightClass === 'HIGH LIGHT') return 'High Light Warning';
    return 'Suitable';
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Live Sensors & Atmospheric Telemetry
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Direct real-time signal stream from DHT22, MQ-135, BH1750 / LDR, and ESP32 telemetry hardware.
          </p>
        </div>

        {/* Live data updating badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.95rem', borderRadius: 'var(--radius-full)', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: '0.825rem', border: '1px solid var(--primary-border)' }}>
          <span className="pulse-led-indicator" />
          <span>Live data updating…</span>
        </div>
      </div>

      {/* 5 Large Sensor Cards */}
      <div className="grid-5" style={{ marginBottom: '1.5rem' }}>
        {/* Card 1: Temperature */}
        <div
          className={`vegsense-card ${selectedSensor === 'temp' ? 'active-border' : ''}`}
          style={{ cursor: 'pointer', border: selectedSensor === 'temp' ? '2px solid var(--primary)' : '1px solid var(--border-light)' }}
          onClick={() => setSelectedSensor('temp')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>TEMPERATURE</span>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginTop: '0.2rem' }}>
                {sensorData.temperature}°C
              </div>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(234, 88, 12, 0.12)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Thermometer size={20} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
              <ArrowUpRight size={14} /> Normal
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Trend: +0.2°C/hr</span>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>DHT22 (GPIO 4)</span>
            <span>{formatTime(sensorData.lastUpdated)}</span>
          </div>
        </div>

        {/* Card 2: Humidity */}
        <div
          className="vegsense-card"
          style={{ cursor: 'pointer', border: selectedSensor === 'humidity' ? '2px solid var(--primary)' : '1px solid var(--border-light)' }}
          onClick={() => setSelectedSensor('humidity')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>HUMIDITY</span>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginTop: '0.2rem' }}>
                {sensorData.humidity}%
              </div>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Droplets size={20} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
              <ArrowDownRight size={14} /> Stable
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Trend: -1.2%/hr</span>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>DHT22 (RH)</span>
            <span>{formatTime(sensorData.lastUpdated)}</span>
          </div>
        </div>

        {/* Card 3: Gas / VOC */}
        <div
          className="vegsense-card"
          style={{ cursor: 'pointer', border: selectedSensor === 'gas' ? '2px solid var(--primary)' : '1px solid var(--border-light)' }}
          onClick={() => setSelectedSensor('gas')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>GAS / VOC</span>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginTop: '0.2rem' }}>
                {sensorData.gasVOC}
              </div>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wind size={20} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
              ppm (Normal)
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Ethylene: &lt; 0.5 ppm</span>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>MQ-135 Gas</span>
            <span>{formatTime(sensorData.lastUpdated)}</span>
          </div>
        </div>

        {/* Card 4: Light Level (BH1750 / LDR) */}
        <div
          className="vegsense-card"
          style={{ cursor: 'pointer', border: selectedSensor === 'light' ? '2px solid var(--primary)' : '1px solid var(--border-light)' }}
          onClick={() => setSelectedSensor('light')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>LIGHT LEVEL</span>
              <div style={{ fontSize: isLightUnavailable ? '1.5rem' : '2.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginTop: '0.2rem' }}>
                {isLightUnavailable ? 'Unavailable' : `${sensorData.lightLevel ?? 420} lux`}
              </div>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.14)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SunMedium size={20} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            <span style={{ color: getLightClassColor(), fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Eye size={13} /> {lightClass}
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
              Risk: {lightRiskVal}%
            </span>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>BH1750 / LDR</span>
            <span>{formatTime(sensorData.lastUpdated)}</span>
          </div>
        </div>

        {/* Card 5: Connection */}
        <div
          className="vegsense-card"
          style={{ border: '1px solid var(--border-light)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>CONNECTION</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em', marginTop: '0.35rem' }}>
                {isConnected ? 'Connected' : 'Offline'}
              </div>
            </div>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Radio size={20} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
              IP: {device.ip}
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Ping: 22ms</span>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Node: ESP32-001</span>
            <span>Signal: {device.signal}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 18: DEDICATED LIGHT MONITORING SECTION
          ========================================================================= */}
      <div className="vegsense-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
        <div className="card-header-row" style={{ marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="section-label-heading" style={{ color: '#d97706' }}>PHOTOMETRIC INTELLIGENCE</span>
              <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', fontWeight: 700 }}>
                BH1750 / LDR
              </span>
            </div>
            <h2 className="card-title" style={{ fontSize: '1.35rem', marginTop: '0.25rem' }}>
              LIGHT MONITORING
            </h2>
            <div className="card-subtitle">
              Configurable ambient photic exposure analysis for chlorophyll stability, sprouting prevention, and solanine mitigation.
            </div>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.85rem', borderRadius: '9999px', background: `${getLightClassColor()}18`, color: getLightClassColor(), fontWeight: 800, fontSize: '0.825rem', border: `1px solid ${getLightClassColor()}40` }}>
            <Sun size={15} />
            <span>{lightClass}</span>
          </div>
        </div>

        {/* 4-Box Telemetry Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Current Light */}
          <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--bg-subtle, rgba(0,0,0,0.02))', border: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Current Light
            </span>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '0.35rem' }}>
              {isLightUnavailable ? 'Unavailable' : `${sensorData.lightLevel ?? 420} lux`}
            </div>
            <div style={{ fontSize: '0.8rem', color: getLightClassColor(), fontWeight: 700, marginTop: '0.35rem' }}>
              Status: {getLightStatusText()}
            </div>
          </div>

          {/* Classification */}
          <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--bg-subtle, rgba(0,0,0,0.02))', border: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Classification
            </span>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: getLightClassColor(), marginTop: '0.35rem' }}>
              {lightClass}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              {lightClass === 'NORMAL LIGHT' && 'Safe optimal photic zone'}
              {lightClass === 'LOW LIGHT' && 'Minimal photic risk (<100 lux)'}
              {lightClass === 'HIGH LIGHT' && 'Degradation danger (>500 lux)'}
            </div>
          </div>

          {/* Light Risk */}
          <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--bg-subtle, rgba(0,0,0,0.02))', border: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Light Risk
            </span>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: getLightClassColor(), marginTop: '0.35rem' }}>
              {lightRiskVal}%
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Dedicated photic factor
            </div>
          </div>

          {/* Configured Range & Trend */}
          <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--bg-subtle, rgba(0,0,0,0.02))', border: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Range & Trend
            </span>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>
              {minLightThreshold}–{maxLightThreshold} lux
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <TrendingUp size={14} /> Trend: Stable (±5 lux)
            </div>
          </div>
        </div>

        {/* Visual Threshold Gauge Bar */}
        <div style={{ padding: '1rem 1.25rem', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <span style={{ color: '#eab308' }}>LOW LIGHT (&lt;{minLightThreshold} lux)</span>
            <span style={{ color: '#10b981' }}>NORMAL LIGHT ({minLightThreshold}–{maxLightThreshold} lux)</span>
            <span style={{ color: '#ef4444' }}>HIGH LIGHT (&gt;{maxLightThreshold} lux)</span>
          </div>

          {/* Multi-segment track */}
          <div style={{ position: 'relative', width: '100%', height: '10px', borderRadius: '6px', background: 'linear-gradient(to right, #eab308 0%, #eab308 15%, #10b981 15%, #10b981 65%, #ef4444 65%, #ef4444 100%)', opacity: 0.85 }}>
            {/* Position marker for current lux */}
            {!isLightUnavailable && (
              <div
                style={{
                  position: 'absolute',
                  top: '-5px',
                  left: `${Math.min(100, Math.max(0, ((sensorData?.lightLevel ?? 420) / 800) * 100))}%`,
                  transform: 'translateX(-50%)',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: `3px solid ${getLightClassColor()}`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  transition: 'left 0.4s ease'
                }}
                title={`Current: ${sensorData?.lightLevel ?? 420} lux`}
              />
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.65rem' }}>
            <span>0 lux (Total Darkness)</span>
            <span>Threshold: {minLightThreshold} lux</span>
            <span>Threshold: {maxLightThreshold} lux</span>
            <span>800+ lux (Excessive Exposure)</span>
          </div>
        </div>
      </div>

      {/* LIVE SENSOR DATA: Multi-sensor Telemetry Details */}
      <div className="vegsense-card">
        <div className="card-header-row">
          <div>
            <h2 className="card-title">LIVE SENSOR DATA</h2>
            <div className="card-subtitle">Continuous 4-sensor atmospheric stream: Temperature, Humidity, Gas/VOC, and Light Level</div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Activity size={16} /> Stream active
            </span>
          </div>
        </div>

        {/* Detailed chart container */}
        <div style={{ width: '100%', height: '280px', position: 'relative', marginTop: '1rem' }}>
          <svg width="100%" height="100%" viewBox="0 0 800 240" preserveAspectRatio="none">
            {/* Horizontal axis grid */}
            <line x1="0" y1="40" x2="800" y2="40" stroke="var(--border-light)" strokeDasharray="3 3" />
            <line x1="0" y1="100" x2="800" y2="100" stroke="var(--border-light)" strokeDasharray="3 3" />
            <line x1="0" y1="160" x2="800" y2="160" stroke="var(--border-light)" strokeDasharray="3 3" />
            <line x1="0" y1="210" x2="800" y2="210" stroke="var(--border-light)" />

            {/* Line 1: Temperature */}
            <path
              d="M 20 130 Q 150 150 280 120 T 500 90 T 700 110 T 780 105"
              fill="none"
              stroke="#ea580c"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Line 2: Humidity */}
            <path
              d="M 20 150 Q 150 135 280 125 T 500 105 T 700 115 T 780 118"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Line 3: Gas VOC */}
            <path
              d="M 20 170 Q 150 160 280 145 T 500 135 T 700 140 T 780 138"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Line 4: Light Level */}
            <path
              d="M 20 115 Q 150 100 280 110 T 500 85 T 700 95 T 780 90"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>

          {/* Legend row */}
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1.5rem', marginTop: '1rem', fontSize: '0.85rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
              <span style={{ width: '12px', height: '3px', background: '#ea580c', borderRadius: '2px' }} />
              <span>Temperature ({sensorData.temperature}°C)</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
              <span style={{ width: '12px', height: '3px', background: '#0284c7', borderRadius: '2px' }} />
              <span>Humidity ({sensorData.humidity}%)</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
              <span style={{ width: '12px', height: '3px', background: 'var(--primary)', borderRadius: '2px' }} />
              <span>Gas / VOC ({sensorData.gasVOC} ppm)</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
              <span style={{ width: '12px', height: '3px', background: '#f59e0b', borderRadius: '2px' }} />
              <span>Light Level ({isLightUnavailable ? 'Unavailable' : `${sensorData.lightLevel ?? 420} lux`})</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
