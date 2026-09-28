import React from 'react';
import { useDevice } from '../context/DeviceContext';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  Thermometer,
  Droplets,
  Wind,
  Layers,
  ArrowRight
} from 'lucide-react';

export function SpoilageDetectionPage() {
  const { sensorData, device } = useDevice();

  const riskPercent = sensorData.spoilageRisk;
  const isFresh = riskPercent <= 22;
  const isWarning = riskPercent > 22 && riskPercent <= 40;
  const isCritical = riskPercent > 40;

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
          Smart Spoilage Detection
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Multivariate algorithmic risk estimation calculated from DHT22 atmospheric telemetry and MQ-135 volatile organic compounds.
        </p>
      </div>

      {/* Main Status & Spoilage Meter Hero Card */}
      <div className="vegsense-card" style={{ padding: '2.25rem', marginBottom: '1.75rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              REAL-TIME ESTIMATED CONDITION
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '2.75rem', fontWeight: 900, color: isFresh ? 'var(--primary)' : isWarning ? 'var(--accent-amber)' : 'var(--accent-red)', letterSpacing: '-0.03em' }}>
                {sensorData.status}
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                • Spoilage Risk: <strong style={{ color: 'var(--text-main)' }}>{riskPercent}%</strong>
              </span>
            </div>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.95rem', borderRadius: 'var(--radius-full)', background: isFresh ? 'var(--primary-light)' : '#fef3c7', color: isFresh ? 'var(--primary)' : '#b45309', fontWeight: 700, fontSize: '0.85rem' }}>
            {isFresh ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>Condition: {sensorData.storageCondition}</span>
          </div>
        </div>

        {/* Linear Spoilage Risk Meter Bar: 0% ---------------- 100% */}
        <div style={{ margin: '2rem 0 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.625rem' }}>
            <span style={{ color: 'var(--primary)' }}>0% FRESH</span>
            <span style={{ color: 'var(--accent-amber)' }}>WARNING (30%)</span>
            <span style={{ color: 'var(--accent-red)' }}>100% HIGH RISK</span>
          </div>

          {/* Bar track */}
          <div style={{ height: '14px', width: '100%', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', position: 'relative', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
            <div
              style={{
                height: '100%',
                width: `${riskPercent}%`,
                background: isFresh
                  ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
                  : isWarning
                  ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
          </div>
        </div>

        {/* Zone Markers */}
        <div className="spoilage-zones-grid" style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: isFresh ? 'var(--primary-light)' : 'var(--bg-subtle)', border: isFresh ? '1px solid var(--primary-border)' : '1px solid transparent' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>ZONE 1: FRESH</div>
            <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>0% - 25% Risk</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Low ethylene, optimal respiration.</div>
          </div>

          <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: isWarning ? '#fef3c7' : 'var(--bg-subtle)', border: isWarning ? '1px solid #fde68a' : '1px solid transparent' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309' }}>ZONE 2: MONITOR</div>
            <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>26% - 50% Risk</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Atmosphere shifting; monitor ventilation.</div>
          </div>

          <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', background: isCritical ? '#fee2e2' : 'var(--bg-subtle)', border: isCritical ? '1px solid #fecaca' : '1px solid transparent' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c' }}>ZONE 3: HIGH RISK</div>
            <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>51% - 100% Risk</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Elevated VOC gases; inspect produce batches.</div>
          </div>
        </div>
      </div>

      {/* Detection Factors & Smart Recommendation Grid */}
      <div className="spoilage-split-grid" style={{ marginBottom: '1.75rem' }}>
        {/* Detection Factors */}
        <div className="vegsense-card">
          <h2 className="card-title" style={{ marginBottom: '1.25rem' }}>Detection Factors</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Thermometer size={18} color="var(--primary)" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Temperature</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Currently {sensorData.temperature}°C (Optimal range: 20-30°C)</div>
                </div>
              </div>
              <span className="risk-meter-status-badge status-badge-fresh" style={{ marginTop: 0 }}>
                Normal
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Droplets size={18} color="var(--primary)" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Humidity</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Currently {sensorData.humidity}% RH (Optimal range: 65-78%)</div>
                </div>
              </div>
              <span className="risk-meter-status-badge status-badge-fresh" style={{ marginTop: 0 }}>
                Normal
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Wind size={18} color="var(--primary)" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Gas / VOC</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Currently {sensorData.gasVOC} ppm (Safe baseline &lt; 500 ppm)</div>
                </div>
              </div>
              <span className="risk-meter-status-badge status-badge-fresh" style={{ marginTop: 0 }}>
                Normal
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ShieldCheck size={18} color="var(--primary)" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Overall Condition</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Composite preservation score</div>
                </div>
              </div>
              <span className="risk-meter-status-badge status-badge-fresh" style={{ marginTop: 0 }}>
                Stable
              </span>
            </div>
          </div>
        </div>

        {/* Smart Recommendation Card */}
        <div className="vegsense-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
              <Sparkles size={20} />
              <h2 className="card-title">SMART RECOMMENDATION</h2>
            </div>

            <div style={{ background: 'var(--primary-light)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-border)', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary-active)', lineHeight: 1.5 }}>
                “Storage conditions are currently suitable. Continue monitoring.”
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                No ventilation action or temperature adjustment required at this time. All batches remain within freshness limits.
              </p>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Vegetable storage shelf lives are projected to meet or exceed expected thresholds based on current stable readings.
            </div>
          </div>

          {/* Prototype Disclaimer */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--primary)' }} />
            <div>
              <strong>Prototype Estimation Notice:</strong> Spoilage risk represents an algorithmic estimation derived from prototype DHT22 and MQ-135 sensors. It does not replace certified laboratory or scientific food safety testing.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
