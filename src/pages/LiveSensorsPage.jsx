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
  RefreshCw
} from 'lucide-react';

export function LiveSensorsPage() {
  const { isConnected, device, sensorData } = useDevice();
  const [selectedSensor, setSelectedSensor] = useState('temp');

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
            Direct real-time signal stream from DHT22, MQ-135, and ESP32 telemetry hardware.
          </p>
        </div>

        {/* Live data updating badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.95rem', borderRadius: 'var(--radius-full)', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: '0.825rem', border: '1px solid var(--primary-border)' }}>
          <span className="pulse-led-indicator" />
          <span>Live data updating…</span>
        </div>
      </div>

      {/* 4 Large Sensor Cards */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
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
            <span>Sensor: DHT22 (GPIO 4)</span>
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
            <span>Sensor: DHT22 (RH)</span>
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
            <span>Sensor: MQ-135 Gas</span>
            <span>{formatTime(sensorData.lastUpdated)}</span>
          </div>
        </div>

        {/* Card 4: Connection */}
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

      {/* LIVE SENSOR DATA: Charts and Telemetry details */}
      <div className="vegsense-card">
        <div className="card-header-row">
          <div>
            <h2 className="card-title">LIVE SENSOR DATA</h2>
            <div className="card-subtitle">Continuous multi-sensor real-time stream from Storage Bay #04</div>
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
          </svg>

          {/* Legend row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', fontSize: '0.85rem' }}>
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
          </div>
        </div>
      </div>
    </div>
  );
}
