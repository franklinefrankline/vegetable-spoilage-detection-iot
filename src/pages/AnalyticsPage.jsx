import React, { useState } from 'react';
import { useDevice } from '../context/DeviceContext';
import {
  LineChart,
  Thermometer,
  Droplets,
  Wind,
  ShieldCheck,
  Calendar,
  Filter,
  TrendingUp,
  Download
} from 'lucide-react';

export function AnalyticsPage() {
  const { vegetables, history } = useDevice();

  const [selectedVeg, setSelectedVeg] = useState('All');
  const [selectedRange, setSelectedRange] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState('all');

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            History & Preservation Analytics
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Historical atmospheric trends, variance tracking, and risk correlations across storage cycles.
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="vegsense-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Vegetable Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)' }}>VEGETABLE:</span>
            <select
              value={selectedVeg}
              onChange={(e) => setSelectedVeg(e.target.value)}
              className="login-form-input no-left-icon"
              style={{ height: '34px', padding: '0 0.75rem', fontSize: '0.8rem', width: 'auto' }}
            >
              <option value="All">All Vegetables</option>
              {vegetables.map((v) => (
                <option key={v.id} value={v.name}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)' }}>RANGE:</span>
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="login-form-input no-left-icon"
              style={{ height: '34px', padding: '0 0.75rem', fontSize: '0.8rem', width: 'auto' }}
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {['all', 'temp', 'humidity', 'gas', 'risk'].map((m) => (
            <button
              key={m}
              type="button"
              className={`btn-secondary ${selectedMetric === m ? 'active' : ''}`}
              style={{
                height: '32px',
                fontSize: '0.75rem',
                textTransform: 'capitalize',
                padding: '0 0.65rem',
                backgroundColor: selectedMetric === m ? 'var(--primary-light)' : 'transparent',
                borderColor: selectedMetric === m ? 'var(--primary-border)' : 'var(--border-light)',
                color: selectedMetric === m ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 700
              }}
              onClick={() => setSelectedMetric(m)}
            >
              {m === 'all' ? 'All Metrics' : m}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        <div className="vegsense-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>AVERAGE TEMPERATURE</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 850, color: 'var(--text-main)', margin: '0.25rem 0' }}>28.3°C</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Variance: ±0.6°C (Controlled)</div>
        </div>

        <div className="vegsense-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>AVERAGE HUMIDITY</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 850, color: 'var(--text-main)', margin: '0.25rem 0' }}>72.4%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Preservation Target: Met</div>
        </div>

        <div className="vegsense-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>PEAK GAS LEVEL</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 850, color: 'var(--text-main)', margin: '0.25rem 0' }}>435 ppm</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Below 500 ppm Threshold</div>
        </div>

        <div className="vegsense-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>HIGHEST RISK</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 850, color: 'var(--text-main)', margin: '0.25rem 0' }}>22%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Zone: Fresh (Safe)</div>
        </div>
      </div>

      {/* 4 Clean SVG Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-unit)' }}>
        {/* Chart 1: Temperature History */}
        <div className="vegsense-card">
          <div className="card-header-row">
            <h2 className="card-title" style={{ fontSize: '1.05rem' }}>Temperature History (°C)</h2>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ea580c' }}>Avg 28.3°C</span>
          </div>
          <div style={{ width: '100%', height: '160px' }}>
            <svg width="100%" height="100%" viewBox="0 0 400 140" preserveAspectRatio="none">
              <line x1="0" y1="35" x2="400" y2="35" stroke="var(--border-light)" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="400" y2="80" stroke="var(--border-light)" strokeDasharray="3 3" />
              <line x1="0" y1="125" x2="400" y2="125" stroke="var(--border-light)" />
              <path
                d="M 10 90 Q 80 110 160 85 T 280 60 T 390 70"
                fill="none"
                stroke="#ea580c"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Chart 2: Humidity History */}
        <div className="vegsense-card">
          <div className="card-header-row">
            <h2 className="card-title" style={{ fontSize: '1.05rem' }}>Humidity History (%)</h2>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>Avg 72.4%</span>
          </div>
          <div style={{ width: '100%', height: '160px' }}>
            <svg width="100%" height="100%" viewBox="0 0 400 140" preserveAspectRatio="none">
              <line x1="0" y1="35" x2="400" y2="35" stroke="var(--border-light)" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="400" y2="80" stroke="var(--border-light)" strokeDasharray="3 3" />
              <line x1="0" y1="125" x2="400" y2="125" stroke="var(--border-light)" />
              <path
                d="M 10 100 Q 80 85 160 70 T 280 65 T 390 75"
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Chart 3: Gas / VOC History */}
        <div className="vegsense-card">
          <div className="card-header-row">
            <h2 className="card-title" style={{ fontSize: '1.05rem' }}>Gas / VOC History (ppm)</h2>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>Peak 435 ppm</span>
          </div>
          <div style={{ width: '100%', height: '160px' }}>
            <svg width="100%" height="100%" viewBox="0 0 400 140" preserveAspectRatio="none">
              <line x1="0" y1="35" x2="400" y2="35" stroke="var(--border-light)" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="400" y2="80" stroke="var(--border-light)" strokeDasharray="3 3" />
              <line x1="0" y1="125" x2="400" y2="125" stroke="var(--border-light)" />
              <path
                d="M 10 110 Q 80 105 160 90 T 280 50 T 390 85"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Chart 4: Spoilage Risk Trend */}
        <div className="vegsense-card">
          <div className="card-header-row">
            <h2 className="card-title" style={{ fontSize: '1.05rem' }}>Spoilage Risk Trend (%)</h2>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>Max 22%</span>
          </div>
          <div style={{ width: '100%', height: '160px' }}>
            <svg width="100%" height="100%" viewBox="0 0 400 140" preserveAspectRatio="none">
              <line x1="0" y1="35" x2="400" y2="35" stroke="var(--border-light)" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="400" y2="80" stroke="var(--border-light)" strokeDasharray="3 3" />
              <line x1="0" y1="125" x2="400" y2="125" stroke="var(--border-light)" />
              <path
                d="M 10 115 Q 80 110 160 100 T 280 80 T 390 95"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
