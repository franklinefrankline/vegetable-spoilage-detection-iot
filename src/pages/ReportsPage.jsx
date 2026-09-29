import React, { useState } from 'react';
import { useDevice } from '../context/DeviceContext';
import { useToast } from '../context/ToastContext';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  CheckCircle2,
  Table,
  Sparkles,
  Thermometer,
  Droplets,
  Wind,
  SunMedium,
  ShieldAlert,
  Activity
} from 'lucide-react';

export function ReportsPage() {
  const { device, sensorData, vegetables } = useDevice();
  const { addToast } = useToast();
  const [selectedReportType, setSelectedReportType] = useState('daily');

  const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const isLightUnavailable = sensorData?.isLightUnavailable;
  const lightLux = isLightUnavailable ? 'Unavailable' : `${sensorData.lightLevel ?? 420} lux`;
  const lightClass = sensorData?.lightClassification || 'NORMAL LIGHT';
  const lightRiskVal = sensorData?.lightRisk ?? 10;
  const overallRisk = sensorData?.spoilageRisk ?? 18;
  const gasLevelStr = (sensorData?.gasLevel ?? sensorData?.gasVOC ?? 420).toString();

  // Generate real CSV download with full environmental & light telemetry
  const handleDownloadCSV = () => {
    const headers = ['Project Name,Device,Vegetable,Temperature,Humidity,Gas / VOC,Light Level,Light Classification,Light Risk,Overall Spoilage Risk,Storage Status,Generated Date\n'];
    const rows = vegetables.map((v) =>
      `"Intelligent Vegetable Storage and Spoilage Detection System","${device.id}","${v.name}","${v.temp}","${v.humidity}","${gasLevelStr} ppm","${lightLux}","${lightClass}","${lightRiskVal}%","${v.risk}%","${v.status}","${reportDate}"`
    );

    const csvContent = headers.concat(rows).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `VegSense_${selectedReportType}_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Report CSV generated and downloaded.', 'success');
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Storage Telemetry Reports
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Audit summaries, environmental compliance logs, and produce inventory preservation records.
          </p>
        </div>

        <div className="reports-action-group" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ height: '42px' }}
            onClick={handlePrintPDF}
          >
            <Printer size={16} />
            <span>Generate PDF</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            style={{ height: '42px' }}
            onClick={handleDownloadCSV}
          >
            <Download size={16} />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* 3 Report Cards: Daily, Weekly, Monthly */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        {/* Daily Report */}
        <div
          className="vegsense-card"
          style={{ cursor: 'pointer', border: selectedReportType === 'daily' ? '2px solid var(--primary)' : '1px solid var(--border-light)' }}
          onClick={() => setSelectedReportType('daily')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>CADENCE</div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'var(--primary-light)', color: 'var(--primary)' }}>Ready</span>
          </div>
          <h2 className="card-title" style={{ marginBottom: '0.35rem' }}>Daily Report</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            24-hour snapshot of temperature fluctuations, humidity levels, photic lux, and VOC gas thresholds.
          </p>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Coverage: Today ({reportDate})</div>
        </div>

        {/* Weekly Report */}
        <div
          className="vegsense-card"
          style={{ cursor: 'pointer', border: selectedReportType === 'weekly' ? '2px solid var(--primary)' : '1px solid var(--border-light)' }}
          onClick={() => setSelectedReportType('weekly')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>CADENCE</div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'var(--primary-light)', color: 'var(--primary)' }}>Ready</span>
          </div>
          <h2 className="card-title" style={{ marginBottom: '0.35rem' }}>Weekly Report</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            7-day aggregated analysis with photic decay curves, spoilage velocity markers, and shelf-life estimations.
          </p>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Coverage: Current Week Cycle</div>
        </div>

        {/* Monthly Report */}
        <div
          className="vegsense-card"
          style={{ cursor: 'pointer', border: selectedReportType === 'monthly' ? '2px solid var(--primary)' : '1px solid var(--border-light)' }}
          onClick={() => setSelectedReportType('monthly')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>CADENCE</div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', background: 'var(--primary-light)', color: 'var(--primary)' }}>Ready</span>
          </div>
          <h2 className="card-title" style={{ marginBottom: '0.35rem' }}>Monthly Report</h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            30-day comprehensive audit of storage inventory loss mitigation, ambient photic exposure, and hardware health.
          </p>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Coverage: Past 30 Days</div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 21: ENVIRONMENTAL CONDITIONS AUDIT BLOCK
          ========================================================================= */}
      <div className="vegsense-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
        <div className="card-header-row" style={{ marginBottom: '1rem' }}>
          <div>
            <span className="section-label-heading">SECTION 21 COMPLIANCE AUDIT</span>
            <h2 className="card-title" style={{ fontSize: '1.25rem', marginTop: '0.2rem' }}>
              Environmental Conditions
            </h2>
            <div className="card-subtitle">
              Instantaneous telemetry baseline verified for active reporting cycle ({selectedReportType.toUpperCase()})
            </div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.8rem', borderRadius: '9999px', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem' }}>
            <Activity size={14} /> Live Telemetry
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
          {/* Temperature */}
          <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'var(--bg-subtle, rgba(0,0,0,0.02))', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Temperature:</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ea580c', marginTop: '0.2rem' }}>
              {sensorData.temperature}°C
            </div>
          </div>

          {/* Humidity */}
          <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'var(--bg-subtle, rgba(0,0,0,0.02))', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Humidity:</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0284c7', marginTop: '0.2rem' }}>
              {sensorData.humidity}%
            </div>
          </div>

          {/* Gas/VOC */}
          <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'var(--bg-subtle, rgba(0,0,0,0.02))', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Gas/VOC:</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.2rem' }}>
              {gasLevelStr}
            </div>
          </div>

          {/* Light */}
          <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'var(--bg-subtle, rgba(0,0,0,0.02))', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Light:</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#d97706', marginTop: '0.2rem' }}>
              {lightLux}
            </div>
          </div>

          {/* Light Classification */}
          <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'var(--bg-subtle, rgba(0,0,0,0.02))', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Light Classification:</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: lightClass === 'NORMAL LIGHT' ? '#10b981' : lightClass === 'LOW LIGHT' ? '#eab308' : '#ef4444', marginTop: '0.2rem' }}>
              {lightClass}
            </div>
          </div>

          {/* Light Risk */}
          <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'var(--bg-subtle, rgba(0,0,0,0.02))', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Light Risk:</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: lightRiskVal <= 15 ? '#10b981' : '#f59e0b', marginTop: '0.2rem' }}>
              {lightRiskVal}%
            </div>
          </div>

          {/* Overall Spoilage Risk */}
          <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'var(--bg-subtle, rgba(0,0,0,0.02))', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Overall Spoilage Risk:</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: overallRisk <= 30 ? 'var(--primary)' : '#ef4444', marginTop: '0.2rem' }}>
              {overallRisk}%
            </div>
          </div>
        </div>
      </div>

      {/* Report Preview Table */}
      <div className="vegsense-card" style={{ overflowX: 'auto' }}>
        <div className="card-header-row">
          <div>
            <h2 className="card-title">REPORT PREVIEW ({selectedReportType.toUpperCase()})</h2>
            <div className="card-subtitle">Intelligent Vegetable Storage and Spoilage Detection System</div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Generated Date: {reportDate}</div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left', minWidth: '850px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem 0.5rem' }}>Device</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Vegetable</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Temperature</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Humidity</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Gas / VOC</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Light Level</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Light Class</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Spoilage Risk</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Storage Status</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {vegetables.map((v) => (
              <tr key={v.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '0.85rem 0.5rem', fontWeight: 600 }}>{device.id}</td>
                <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{v.name}</td>
                <td style={{ padding: '0.85rem 0.5rem' }}>{v.temp}</td>
                <td style={{ padding: '0.85rem 0.5rem' }}>{v.humidity}</td>
                <td style={{ padding: '0.85rem 0.5rem' }}>{gasLevelStr} ppm</td>
                <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700, color: '#d97706' }}>
                  {lightLux}
                </td>
                <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.775rem', fontWeight: 700, color: lightClass === 'NORMAL LIGHT' ? '#10b981' : lightClass === 'LOW LIGHT' ? '#eab308' : '#ef4444' }}>
                  {lightClass}
                </td>
                <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700, color: 'var(--primary)' }}>{v.risk}%</td>
                <td style={{ padding: '0.85rem 0.5rem' }}>
                  <span className={`risk-meter-status-badge ${v.status === 'FRESH' ? 'status-badge-fresh' : 'status-badge-warning'}`} style={{ marginTop: 0, padding: '0.2rem 0.55rem', fontSize: '0.725rem' }}>
                    {v.status}
                  </span>
                </td>
                <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)' }}>{reportDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
