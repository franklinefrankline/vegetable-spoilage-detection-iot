import React from 'react';
import {
  FileText,
  Download,
  X,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  Layers,
  Thermometer,
  ShieldCheck,
  Bell,
  Package,
  Info
} from 'lucide-react';

export function ReportPreview({
  previewData,
  onGeneratePdf,
  onClose,
  isGenerating
}) {
  if (!previewData) return null;

  const { metadata, user, sensors, spoilage, alerts, storage, recommendations, data_quality, disclaimer } = previewData;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
    >
      <div
        className="vegsense-card"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Preview Top Action Bar */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={18} color="var(--primary)" />
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Report Document Preview
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: metadata.data_source.includes('DEMO') ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: metadata.data_source.includes('DEMO') ? 'var(--accent-amber)' : 'var(--accent-green)'
              }}
            >
              {metadata.data_source}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onGeneratePdf}
              disabled={isGenerating}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                height: '34px',
                padding: '0 1rem',
                fontSize: '0.8rem',
                fontWeight: 800
              }}
            >
              <Download size={14} className={isGenerating ? 'spinner' : ''} />
              <span>{isGenerating ? 'Generating PDF...' : 'Generate & Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                padding: 0
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Document Canvas (Simulated Printable A4 Sheet) */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2rem',
            backgroundColor: 'var(--bg-subtle, #f8fafc)'
          }}
        >
          <div
            style={{
              maxWidth: '800px',
              margin: '0 auto',
              backgroundColor: '#ffffff',
              border: '1px solid var(--border-light, #e2e8f0)',
              borderRadius: '8px',
              padding: '2.5rem',
              color: '#111a26',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
            }}
          >
            {/* Document Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                borderBottom: '2px solid #1b4d2e',
                paddingBottom: '1rem',
                marginBottom: '1.5rem'
              }}
            >
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1b4d2e', letterSpacing: '-0.02em' }}>
                  VegSense
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                  Smart Storage Intelligence & Atmospheric Preservation
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    backgroundColor: metadata.data_source.includes('DEMO') ? '#fef3c7' : '#dcfce7',
                    color: metadata.data_source.includes('DEMO') ? '#d97706' : '#16a34a',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  {metadata.data_source}
                </span>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Generated: {new Date(metadata.generated_at).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Document Title & Period */}
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111a26', margin: '0 0 0.25rem 0' }}>
              {metadata.title}
            </h1>
            <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '1.25rem' }}>
              Monitoring Scope: <strong>{metadata.timeframe.label}</strong>
            </div>

            {/* Metadata Box */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '0.75rem',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '0.85rem',
                marginBottom: '1.5rem',
                fontSize: '0.75rem'
              }}
            >
              <div>
                <div style={{ color: '#64748b', fontWeight: 700, fontSize: '0.68rem' }}>OPERATOR</div>
                <div style={{ fontWeight: 800, color: '#111a26' }}>{user.name}</div>
                <div style={{ color: '#64748b' }}>{user.email}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontWeight: 700, fontSize: '0.68rem' }}>CONTROLLER</div>
                <div style={{ fontWeight: 800, color: '#111a26' }}>{metadata.device.id}</div>
                <div style={{ color: '#64748b' }}>{metadata.device.mode}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontWeight: 700, fontSize: '0.68rem' }}>PRODUCE BATCH</div>
                <div style={{ fontWeight: 800, color: '#111a26' }}>
                  {metadata.batch ? (metadata.batch.name || metadata.batch.vegetable_name) : 'All Storage Chambers'}
                </div>
                <div style={{ color: '#64748b' }}>{metadata.batch?.quantity || 'General Stock'}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontWeight: 700, fontSize: '0.68rem' }}>TELEMETRY FIDELITY</div>
                <div style={{ fontWeight: 800, color: '#1b4d2e' }}>{data_quality.score}% Quality</div>
                <div style={{ color: '#64748b' }}>{sensors.points_count} points recorded</div>
              </div>
            </div>

            {/* Executive KPIs */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1b4d2e', marginBottom: '0.6rem' }}>
                EXECUTIVE ENVIRONMENTAL SUMMARY
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                  gap: '0.6rem'
                }}
              >
                <div style={{ padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>AVG TEMP</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#111a26' }}>{sensors.summary.temperature?.average ?? 'N/A'}°C</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{sensors.summary.temperature?.status || 'NORMAL'}</div>
                </div>
                <div style={{ padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>AVG HUMIDITY</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#111a26' }}>{sensors.summary.humidity?.average ?? 'N/A'}%</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{sensors.summary.humidity?.status || 'OPTIMAL'}</div>
                </div>
                <div style={{ padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>GAS/VOC INDEX</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#111a26' }}>{sensors.summary.gas?.average ?? 'N/A'}</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Relative index</div>
                </div>
                <div style={{ padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>LIGHT LEVEL</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#111a26' }}>{sensors.summary.light?.average ?? 'N/A'} lx</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{sensors.summary.light?.status || 'NORMAL'}</div>
                </div>
                <div style={{ padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>ESTIMATED RISK</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1b4d2e' }}>{spoilage.summary?.average ?? 'N/A'}%</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{spoilage.summary?.status || 'FRESH'}</div>
                </div>
                <div style={{ padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>TOTAL ALERTS</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#111a26' }}>{alerts.summary.total}</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{alerts.summary.active} active</div>
                </div>
              </div>
            </div>

            {/* Sensor Table */}
            {metadata.sections.sensors && (
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1b4d2e', marginBottom: '0.6rem' }}>
                  ATMOSPHERIC SENSOR TELEMETRY ANALYSIS
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', border: '1px solid #cbd5e1' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1b4d2e', color: '#ffffff', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem 0.65rem' }}>SENSOR METRIC</th>
                      <th style={{ padding: '0.5rem 0.65rem' }}>CURRENT</th>
                      <th style={{ padding: '0.5rem 0.65rem' }}>AVERAGE</th>
                      <th style={{ padding: '0.5rem 0.65rem' }}>MINIMUM</th>
                      <th style={{ padding: '0.5rem 0.65rem' }}>MAXIMUM</th>
                      <th style={{ padding: '0.5rem 0.65rem' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.45rem 0.65rem', fontWeight: 700 }}>Temperature (°C)</td>
                      <td style={{ padding: '0.45rem 0.65rem' }}>{sensors.summary.temperature?.current ?? 'N/A'}°C</td>
                      <td style={{ padding: '0.45rem 0.65rem' }}>{sensors.summary.temperature?.average ?? 'N/A'}°C</td>
                      <td style={{ padding: '0.45rem 0.65rem' }}>{sensors.summary.temperature?.min ?? 'N/A'}°C</td>
                      <td style={{ padding: '0.45rem 0.65rem' }}>{sensors.summary.temperature?.max ?? 'N/A'}°C</td>
                      <td style={{ padding: '0.45rem 0.65rem', fontWeight: 700, color: '#1b4d2e' }}>{sensors.summary.temperature?.status || 'NORMAL'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                      <td style={{ padding: '0.45rem 0.65rem', fontWeight: 700 }}>Relative Humidity (%)</td>
                      <td style={{ padding: '0.45rem 0.65rem' }}>{sensors.summary.humidity?.current ?? 'N/A'}%</td>
                      <td style={{ padding: '0.45rem 0.65rem' }}>{sensors.summary.humidity?.average ?? 'N/A'}%</td>
                      <td style={{ padding: '0.45rem 0.65rem' }}>{sensors.summary.humidity?.min ?? 'N/A'}%</td>
                      <td style={{ padding: '0.45rem 0.65rem' }}>{sensors.summary.humidity?.max ?? 'N/A'}%</td>
                      <td style={{ padding: '0.45rem 0.65rem', fontWeight: 700, color: '#1b4d2e' }}>{sensors.summary.humidity?.status || 'OPTIMAL'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.45rem 0.65rem', fontWeight: 700 }}>Gas/VOC Indicator</td>
                      <td style={{ padding: '0.45rem 0.65rem' }}>{sensors.summary.gas?.current ?? 'N/A'}</td>
                      <td style={{ padding: '0.45rem 0.65rem' }}>{sensors.summary.gas?.average ?? 'N/A'}</td>
                      <td style={{ padding: '0.45rem 0.65rem' }}>{sensors.summary.gas?.min ?? 'N/A'}</td>
                      <td style={{ padding: '0.45rem 0.65rem' }}>{sensors.summary.gas?.max ?? 'N/A'}</td>
                      <td style={{ padding: '0.45rem 0.65rem', fontWeight: 700, color: '#1b4d2e' }}>{sensors.summary.gas?.status || 'NORMAL'}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.45rem 0.65rem', fontWeight: 700 }}>Light Level (lux)</td>
                      <td style={{ padding: '0.45rem 0.65rem' }}>{sensors.summary.light?.current ?? 'N/A'} lx</td>
                      <td style={{ padding: '0.45rem 0.65rem' }}>{sensors.summary.light?.average ?? 'N/A'} lx</td>
                      <td style={{ padding: '0.45rem 0.65rem' }}>{sensors.summary.light?.min ?? 'N/A'} lx</td>
                      <td style={{ padding: '0.45rem 0.65rem' }}>{sensors.summary.light?.max ?? 'N/A'} lx</td>
                      <td style={{ padding: '0.45rem 0.65rem', fontWeight: 700, color: '#1b4d2e' }}>{sensors.summary.light?.status || 'NORMAL LIGHT'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Spoilage Risk Breakdown */}
            {metadata.sections.spoilage && (
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1b4d2e', marginBottom: '0.6rem' }}>
                  ESTIMATED SPOILAGE RISK & SPECTRUM ANALYSIS
                </div>
                <div style={{ padding: '0.85rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#f8fafc', fontSize: '0.75rem', lineHeight: 1.5 }}>
                  <div>
                    <strong>Risk Classification:</strong> {spoilage.summary?.status || 'FRESH'} ({spoilage.summary?.average ?? 18}%) | <strong>Historical Trajectory:</strong> {spoilage.trend || 'STABLE'}
                  </div>
                  <div style={{ color: '#475569', marginTop: '0.35rem' }}>
                    Thermal factor: {spoilage.factors.temperature_risk}% | Moisture factor: {spoilage.factors.humidity_risk}% | VOC factor: {spoilage.factors.gas_risk}% | Light factor: {spoilage.factors.light_risk}%
                  </div>
                  <div style={{ color: '#475569', marginTop: '0.2rem' }}>
                    Spectrum duration: Fresh: {spoilage.distribution.fresh}% | Warning: {spoilage.distribution.warning}% | Spoilage Risk: {spoilage.distribution.spoilage_risk}% | Critical: {spoilage.distribution.critical}%
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {metadata.sections.recommendations && (
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1b4d2e', marginBottom: '0.6rem' }}>
                  ACTIONABLE ENGINEERING & STORAGE RECOMMENDATIONS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {recommendations.map((r, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.65rem 0.85rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        fontSize: '0.75rem'
                      }}
                    >
                      <div style={{ fontWeight: 800, color: '#1b4d2e', marginBottom: '0.15rem' }}>
                        {r.metric.toUpperCase()}
                      </div>
                      <div style={{ color: '#111a26', fontWeight: 600 }}>{r.action}</div>
                      <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.15rem' }}>{r.finding}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer Box */}
            <div
              style={{
                padding: '0.75rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                backgroundColor: '#f1f5f9',
                fontSize: '0.68rem',
                color: '#475569',
                lineHeight: 1.4
              }}
            >
              <strong>TECHNICAL DISCLAIMER & SYSTEM SCOPE:</strong> {disclaimer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
