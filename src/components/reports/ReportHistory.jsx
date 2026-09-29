import React, { useState } from 'react';
import {
  FileText,
  Download,
  Eye,
  Trash2,
  Calendar,
  Cpu,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

export function ReportHistory({
  reports = [],
  onPreviewReport,
  onDownloadReport,
  onDeleteReport,
  isDownloading
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.report_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.device_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || r.report_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusBadge = (status) => {
    if (status === 'COMPLETED') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.15rem 0.45rem',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 800,
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--accent-green, #10b981)'
          }}
        >
          <CheckCircle2 size={11} /> READY
        </span>
      );
    }
    if (status === 'GENERATING') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.15rem 0.45rem',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 800,
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            color: 'var(--accent-amber, #f59e0b)'
          }}
        >
          <RefreshCw size={11} className="spinner" /> GENERATING
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.15rem 0.45rem',
          borderRadius: '4px',
          fontSize: '0.7rem',
          fontWeight: 800,
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          color: 'var(--accent-red, #ef4444)'
        }}
      >
        <AlertTriangle size={11} /> FAILED
      </span>
    );
  };

  return (
    <div className="vegsense-card" style={{ padding: '1.25rem' }}>
      {/* Header & Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '1rem',
          marginBottom: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <FileText size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Generated Report Archives
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Audit and retrieve previously compiled storage audits, telemetry PDFs, and preservation logs ({reports.length} records).
          </p>
        </div>

        {/* Search & Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '200px' }}>
            <Search
              size={14}
              style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="login-form-input"
              style={{ height: '32px', paddingLeft: '2rem', fontSize: '0.78rem' }}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="login-form-input no-left-icon"
            style={{ height: '32px', padding: '0 0.5rem', fontSize: '0.78rem', width: 'auto' }}
          >
            <option value="ALL">All Report Types</option>
            <option value="COMPLETE_STORAGE">Complete Storage</option>
            <option value="SENSOR_REPORT">Sensor Report</option>
            <option value="SPOILAGE_REPORT">Spoilage Report</option>
            <option value="ALERT_REPORT">Alert Report</option>
            <option value="BATCH_REPORT">Batch Report</option>
            <option value="ANALYTICS_REPORT">Analytics Report</option>
            <option value="DAILY_REPORT">Daily Report</option>
            <option value="WEEKLY_REPORT">Weekly Report</option>
            <option value="MONTHLY_REPORT">Monthly Report</option>
            <option value="CUSTOM_REPORT">Custom Report</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileText size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            No Generated Reports Found
          </div>
          <div style={{ fontSize: '0.78rem' }}>
            {searchTerm || typeFilter !== 'ALL'
              ? 'No reports match your search criteria. Try resetting your query.'
              : 'Configure filters above and click "Generate & Save PDF" to compile your first report.'}
          </div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                <th style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)' }}>Report Title</th>
                <th style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)' }}>Type</th>
                <th style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)' }}>Scope / Date</th>
                <th style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)' }}>Device</th>
                <th style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)' }}>Source</th>
                <th style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)' }}>File Size</th>
                <th style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((r, idx) => (
                <tr
                  key={r.id}
                  style={{
                    borderBottom: '1px solid var(--border-light)',
                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--bg-subtle, rgba(0,0,0,0.01))'
                  }}
                >
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <div style={{ fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FileText size={14} color="var(--primary)" />
                      <span>{r.title}</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {r.file_name}
                    </div>
                  </td>

                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-subtle)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {r.report_type?.replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                    <div>{r.created_at ? new Date(r.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</div>
                    <div style={{ color: 'var(--text-muted)' }}>
                      {r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </td>

                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                    {r.device_id || 'ESP32-DEMO-001'}
                  </td>

                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.35rem',
                        borderRadius: '3px',
                        backgroundColor: r.source_mode?.includes('DEMO') ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: r.source_mode?.includes('DEMO') ? 'var(--accent-amber)' : 'var(--accent-green)'
                      }}
                    >
                      {r.source_mode || 'ALL'}
                    </span>
                  </td>

                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    {getStatusBadge(r.status)}
                  </td>

                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.72rem', fontFamily: 'monospace' }}>
                    {formatFileSize(r.file_size)}
                  </td>

                  <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => onPreviewReport(r)}
                        className="btn-secondary"
                        title="Preview Report"
                        style={{ height: '28px', padding: '0 0.5rem', fontSize: '0.72rem' }}
                      >
                        <Eye size={12} style={{ marginRight: '0.2rem' }} />
                        Preview
                      </button>

                      <button
                        type="button"
                        onClick={() => onDownloadReport(r)}
                        disabled={isDownloading === r.id}
                        className="btn-primary"
                        title="Download PDF"
                        style={{ height: '28px', padding: '0 0.55rem', fontSize: '0.72rem' }}
                      >
                        <Download size={12} className={isDownloading === r.id ? 'spinner' : ''} style={{ marginRight: '0.2rem' }} />
                        PDF
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteReport(r)}
                        className="btn-secondary"
                        title="Delete Report"
                        style={{
                          height: '28px',
                          padding: '0 0.45rem',
                          color: 'var(--accent-red, #ef4444)',
                          borderColor: 'rgba(239, 68, 68, 0.3)'
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
