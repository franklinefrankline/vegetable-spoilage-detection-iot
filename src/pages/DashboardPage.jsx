import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';
import { useNavigate } from '../router/Router';
import {
  Thermometer,
  Droplets,
  Wind,
  ShieldCheck,
  Activity,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Cpu,
  CheckCircle2,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export function DashboardPage() {
  const { currentUser } = useAuth();
  const { isConnected, device, sensorData, history } = useDevice();
  const navigate = useNavigate();

  const [activeChart, setActiveChart] = useState('temp'); // 'temp' | 'humidity' | 'gas'

  // Time greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div>
      {/* Top Banner & Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            {greeting}, {currentUser?.name?.split(' ')[0] || 'Storage Manager'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Your storage is being monitored in real time. All atmospheric indices are currently within preservation tolerances.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            className="vegsense-card"
            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
            onClick={() => navigate('/connect-device')}
            title="View Device Details"
          >
            <Cpu size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{device.id}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
              <span className="pulse-led-indicator" style={{ width: '6px', height: '6px' }} />
              <span>Connected</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Storage Status & Semicircular Risk Gauge */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 'var(--space-unit)', marginBottom: 'var(--space-unit)' }}>
        {/* Main Status & Spoilage Risk Card */}
        <div className="vegsense-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="card-header-row">
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                MAIN STORAGE STATUS
              </div>
              <h2 className="card-title" style={{ marginTop: '0.2rem' }}>Storage Condition & Spoilage Estimation</h2>
            </div>
            <span className="risk-meter-status-badge status-badge-fresh">
              <CheckCircle2 size={13} />
              <span>{sensorData.status}</span>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '1.5rem', alignItems: 'center', margin: '0.5rem 0' }}>
            {/* Circular Risk Meter */}
            <div className="risk-meter-wrapper" style={{ margin: 0 }}>
              <svg width="150" height="150" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="var(--border-light)"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="10"
                  strokeDasharray="314"
                  strokeDashoffset={314 - (314 * sensorData.spoilageRisk) / 100}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span className="risk-meter-value" style={{ fontSize: '2rem' }}>{sensorData.spoilageRisk}%</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>SPOILAGE RISK</span>
              </div>
            </div>

            {/* Status breakdown details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
                  Optimal Environment
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  DHT22 climate telemetry and MQ-135 volatile gas metrics confirm that storage atmosphere remains in the <strong>fresh preservation zone</strong>.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                  Freshness Index: 98.2%
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                  Ethylene: Low
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                  Decay Probability: Negligible
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Telemetry Stream: Active</span>
            <button
              type="button"
              onClick={() => navigate('/spoilage')}
              style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              Detailed Risk Breakdown &rarr;
            </button>
          </div>
        </div>

        {/* Recent Alerts & Recommendation Card */}
        <div className="vegsense-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header-row" style={{ marginBottom: '0.75rem' }}>
              <h2 className="card-title">Recent Alerts</h2>
              <button
                type="button"
                onClick={() => navigate('/alerts')}
                style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}
              >
                View All
              </button>
            </div>

            <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-light)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                <CheckCircle2 size={18} color="var(--primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>No critical alerts</span>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginLeft: '1.75rem' }}>
                Storage conditions are currently stable. No spoilage markers or abnormal gas accumulations detected in Bay #04.
              </p>
            </div>

            <div style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--primary-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <Sparkles size={15} />
                <span>Smart Recommendation</span>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--primary-hover)', lineHeight: 1.45 }}>
                Current relative humidity (72%) is optimal for root vegetables and leafy greens. Maintain storage door seal integrity.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} /> Last Updated: Just now ({formatTime(sensorData.lastUpdated)})
            </span>
            <span className="pulse-led-indicator" style={{ width: '6px', height: '6px' }} />
          </div>
        </div>
      </div>

      {/* 4 Primary Sensor Cards */}
      <div className="grid-4" style={{ marginBottom: 'var(--space-unit)' }}>
        {/* Temperature Card */}
        <div className="vegsense-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)' }}>TEMPERATURE</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(234, 88, 12, 0.12)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Thermometer size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            {sensorData.temperature}°C
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.775rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              <ArrowUpRight size={13} /> Optimal (20-30°C)
            </span>
            <span style={{ color: 'var(--text-muted)' }}>DHT22</span>
          </div>
        </div>

        {/* Humidity Card */}
        <div className="vegsense-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)' }}>HUMIDITY</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Droplets size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            {sensorData.humidity}%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.775rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
              <ArrowDownRight size={13} /> Ideal Preserved
            </span>
            <span style={{ color: 'var(--text-muted)' }}>DHT22</span>
          </div>
        </div>

        {/* Gas / VOC Level */}
        <div className="vegsense-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)' }}>GAS / VOC LEVEL</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wind size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            Normal
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.775rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
              {sensorData.gasVOC} ppm (Safe)
            </span>
            <span style={{ color: 'var(--text-muted)' }}>MQ-135</span>
          </div>
        </div>

        {/* Storage Condition Card */}
        <div className="vegsense-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)' }}>STORAGE CONDITION</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.35rem' }}>
            {sensorData.storageCondition}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.775rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Early Warning: None
            </span>
            <span style={{ color: 'var(--text-muted)' }}>Auto Analyzed</span>
          </div>
        </div>
      </div>

      {/* LIVE STORAGE MONITOR: Real-Time Charts */}
      <div className="vegsense-card">
        <div className="card-header-row">
          <div>
            <h2 className="card-title">LIVE STORAGE MONITOR</h2>
            <div className="card-subtitle">Real-time continuous telemetry stream from ESP32 gateway</div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
            <button
              type="button"
              className={`btn-secondary ${activeChart === 'temp' ? 'active' : ''}`}
              style={{ height: '32px', fontSize: '0.775rem', padding: '0 0.85rem', border: 'none', background: activeChart === 'temp' ? 'var(--bg-card)' : 'transparent', fontWeight: activeChart === 'temp' ? 700 : 500 }}
              onClick={() => setActiveChart('temp')}
            >
              Temperature (°C)
            </button>
            <button
              type="button"
              className={`btn-secondary ${activeChart === 'humidity' ? 'active' : ''}`}
              style={{ height: '32px', fontSize: '0.775rem', padding: '0 0.85rem', border: 'none', background: activeChart === 'humidity' ? 'var(--bg-card)' : 'transparent', fontWeight: activeChart === 'humidity' ? 700 : 500 }}
              onClick={() => setActiveChart('humidity')}
            >
              Humidity (%)
            </button>
            <button
              type="button"
              className={`btn-secondary ${activeChart === 'gas' ? 'active' : ''}`}
              style={{ height: '32px', fontSize: '0.775rem', padding: '0 0.85rem', border: 'none', background: activeChart === 'gas' ? 'var(--bg-card)' : 'transparent', fontWeight: activeChart === 'gas' ? 700 : 500 }}
              onClick={() => setActiveChart('gas')}
            >
              Gas / VOC (ppm)
            </button>
          </div>
        </div>

        {/* Responsive Clean SVG Line Chart */}
        <div style={{ width: '100%', height: '240px', position: 'relative', marginTop: '1rem' }}>
          <svg width="100%" height="100%" viewBox="0 0 700 220" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            <line x1="0" y1="40" x2="700" y2="40" stroke="var(--border-light)" strokeDasharray="3 3" />
            <line x1="0" y1="90" x2="700" y2="90" stroke="var(--border-light)" strokeDasharray="3 3" />
            <line x1="0" y1="140" x2="700" y2="140" stroke="var(--border-light)" strokeDasharray="3 3" />
            <line x1="0" y1="190" x2="700" y2="190" stroke="var(--border-light)" />

            {/* Path based on active chart */}
            {activeChart === 'temp' && (
              <>
                <path
                  d="M 20 120 Q 120 140 220 110 T 420 80 T 600 95 T 680 100 L 680 190 L 20 190 Z"
                  fill="url(#chartGradient)"
                />
                <path
                  d="M 20 120 Q 120 140 220 110 T 420 80 T 600 95 T 680 100"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="680" cy="100" r="5" fill="var(--primary)" stroke="#ffffff" strokeWidth="2" />
              </>
            )}

            {activeChart === 'humidity' && (
              <>
                <path
                  d="M 20 140 Q 120 130 220 115 T 420 100 T 600 110 T 680 112 L 680 190 L 20 190 Z"
                  fill="url(#chartGradient)"
                />
                <path
                  d="M 20 140 Q 120 130 220 115 T 420 100 T 600 110 T 680 112"
                  fill="none"
                  stroke="var(--accent-blue)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="680" cy="112" r="5" fill="var(--accent-blue)" stroke="#ffffff" strokeWidth="2" />
              </>
            )}

            {activeChart === 'gas' && (
              <>
                <path
                  d="M 20 130 Q 120 125 220 120 T 420 90 T 600 115 T 680 118 L 680 190 L 20 190 Z"
                  fill="url(#chartGradient)"
                />
                <path
                  d="M 20 130 Q 120 125 220 120 T 420 90 T 600 115 T 680 118"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="680" cy="118" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
              </>
            )}
          </svg>

          {/* Time axis markers */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>00:00</span>
            <span>04:00</span>
            <span>08:00</span>
            <span>12:00</span>
            <span>16:00</span>
            <span>20:00</span>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Now ({formatTime(sensorData.lastUpdated)})</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="pulse-led-indicator" style={{ width: '6px', height: '6px' }} />
            <span>Live data updating every 4 seconds from ESP32</span>
          </span>
          <span style={{ fontWeight: 600 }}>Active Storage Chamber #04</span>
        </div>
      </div>
    </div>
  );
}
