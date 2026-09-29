import React, { useState, useMemo } from 'react';
import {
  Table,
  ArrowUpDown,
  Download,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter
} from 'lucide-react';

export function AnalyticsTable({ points = [], onExportCsv }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('timestamp');
  const [sortAsc, setSortAsc] = useState(false);

  // Sorting
  const sortedPoints = useMemo(() => {
    const list = [...points];
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'timestamp') {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      }

      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    return list;
  }, [points, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedPoints.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPoints.slice(start, start + pageSize);
  }, [sortedPoints, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // Default to desc
    }
  };

  const handleDownloadCsv = () => {
    if (points.length === 0) return;
    const headers = [
      'Timestamp',
      'Temperature (°C)',
      'Humidity (%)',
      'Gas/VOC Indicator',
      'Light Level (lux)',
      'Light Classification',
      'Spoilage Risk (%)',
      'Risk Classification',
      'Device',
      'Batch ID'
    ];

    const rows = points.map((p) => [
      `"${p.timestamp || ''}"`,
      p.temperature != null ? p.temperature : 'N/A',
      p.humidity != null ? p.humidity : 'N/A',
      p.gas_level != null ? p.gas_level : 'N/A',
      p.light_level != null ? p.light_level : 'N/A',
      `"${p.light_classification || 'NORMAL LIGHT'}"`,
      p.spoilage_risk != null ? p.spoilage_risk : 'N/A',
      `"${p.classification || 'FRESH'}"`,
      `"${p.device_id || ''}"`,
      `"${p.storage_batch_id || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `vegsense_telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderRiskBadge = (risk, classification) => {
    if (risk == null) return <span style={{ color: 'var(--text-muted)' }}>N/A</span>;
    let color = 'var(--accent-green)';
    if (risk > 80) color = 'var(--accent-red)';
    else if (risk > 60) color = '#ea580c';
    else if (risk > 30) color = 'var(--accent-amber)';

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: color,
          backgroundColor: `${color}15`,
          padding: '0.15rem 0.45rem',
          borderRadius: '4px'
        }}
      >
        <span>{risk}%</span>
        <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>({classification || 'FRESH'})</span>
      </span>
    );
  };

  return (
    <div className="vegsense-card" style={{ padding: '1.25rem' }}>
      {/* Header & CSV Export */}
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
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Historical Telemetry Logs
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Audit individual environmental telemetry points recorded in the database ({points.length} records).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={points.length === 0}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              height: '34px',
              padding: '0 0.85rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: points.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      {points.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No telemetry logs found for the selected filter parameters.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid var(--border-light)', borderRadius: '8px', marginBottom: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                <th
                  onClick={() => handleSort('timestamp')}
                  style={{ padding: '0.65rem 0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>Timestamp</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('temperature')}
                  style={{ padding: '0.65rem 0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>Temp (°C)</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('humidity')}
                  style={{ padding: '0.65rem 0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>Humidity (%)</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('gas_level')}
                  style={{ padding: '0.65rem 0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>Gas/VOC</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('light_level')}
                  style={{ padding: '0.65rem 0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>Light (lux)</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('spoilage_risk')}
                  style={{ padding: '0.65rem 0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>Estimated Risk</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>Device</th>
                <th style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>Batch</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid var(--border-light)',
                    backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--bg-subtle, rgba(0,0,0,0.01))'
                  }}
                >
                  <td style={{ padding: '0.55rem 0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {row.timestamp ? new Date(row.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A'}
                  </td>
                  <td style={{ padding: '0.55rem 0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {row.temperature != null ? `${row.temperature}°C` : <span style={{ color: 'var(--text-muted)' }}>N/A</span>}
                  </td>
                  <td style={{ padding: '0.55rem 0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {row.humidity != null ? `${row.humidity}%` : <span style={{ color: 'var(--text-muted)' }}>N/A</span>}
                  </td>
                  <td style={{ padding: '0.55rem 0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {row.gas_level != null ? row.gas_level : <span style={{ color: 'var(--text-muted)' }}>N/A</span>}
                  </td>
                  <td style={{ padding: '0.55rem 0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {row.light_level != null ? (
                      <span title={row.light_classification || 'NORMAL LIGHT'}>
                        {row.light_level} lx
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                    )}
                  </td>
                  <td style={{ padding: '0.55rem 0.75rem' }}>
                    {renderRiskBadge(row.spoilage_risk ?? row.risk, row.classification)}
                  </td>
                  <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                    {row.device_id || 'ESP32-DEMO-001'}
                  </td>
                  <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                    {row.storage_batch_id ? `#${row.storage_batch_id}` : 'General Storage'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {points.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{
                height: '28px',
                padding: '0 0.4rem',
                borderRadius: '4px',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)'
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>
              Showing {Math.min(points.length, (currentPage - 1) * pageSize + 1)} - {Math.min(points.length, currentPage * pageSize)} of {points.length}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: '4px',
                border: '1px solid var(--border-light)',
                backgroundColor: 'transparent',
                color: currentPage <= 1 ? 'var(--text-muted)' : 'var(--text-main)',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontWeight: 700 }}>
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: '4px',
                border: '1px solid var(--border-light)',
                backgroundColor: 'transparent',
                color: currentPage >= totalPages ? 'var(--text-muted)' : 'var(--text-main)',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
