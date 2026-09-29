import React from 'react';
import {
  Filter,
  Calendar,
  Cpu,
  Layers,
  CheckSquare,
  Square,
  FileCheck,
  Eye,
  RotateCcw
} from 'lucide-react';

export function ReportFilters({
  filters,
  onFilterChange,
  availableDevices = [],
  availableVegetables = [],
  availableBatches = [],
  onPreview,
  onGenerate,
  onReset,
  isGenerating,
  isPreviewing
}) {
  const handleRangeClick = (r) => {
    onFilterChange('range', r);
  };

  const handleSectionToggle = (secKey) => {
    const currentSections = filters.sections || {};
    onFilterChange('sections', {
      ...currentSections,
      [secKey]: !currentSections[secKey]
    });
  };

  const sectionsList = [
    { key: 'storage', label: 'Storage Inventory' },
    { key: 'sensors', label: 'Atmospheric Sensors' },
    { key: 'spoilage', label: 'Spoilage Risk' },
    { key: 'alerts', label: 'Incident Alerts' },
    { key: 'analytics', label: 'Historical Analytics' },
    { key: 'batch', label: 'Batch Lifecycle' },
    { key: 'recommendations', label: 'Recommendations' }
  ];

  return (
    <div className="vegsense-card" style={{ padding: '1.25rem', marginBottom: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Filter size={16} color="var(--primary)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Report Scope & Filter Configuration
          </h2>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="btn-secondary"
          style={{ height: '30px', padding: '0 0.65rem', fontSize: '0.75rem', fontWeight: 700 }}
        >
          <RotateCcw size={12} style={{ marginRight: '0.35rem' }} />
          Reset Filters
        </button>
      </div>

      {/* Main Filter Dropdowns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}
      >
        {/* Device */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            CONTROLLER DEVICE:
          </label>
          <select
            value={filters.device_id || ''}
            onChange={(e) => onFilterChange('device_id', e.target.value)}
            className="login-form-input no-left-icon"
            style={{ height: '36px', padding: '0 0.75rem', fontSize: '0.8rem' }}
          >
            <option value="">All Storage Controllers</option>
            <option value="ESP32-DEMO-001">ESP32-DEMO-001 (Gateway)</option>
            {availableDevices.filter(d => d !== 'ESP32-DEMO-001').map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Vegetable */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            PRODUCE TYPE:
          </label>
          <select
            value={filters.vegetable_type || ''}
            onChange={(e) => onFilterChange('vegetable_type', e.target.value)}
            className="login-form-input no-left-icon"
            style={{ height: '36px', padding: '0 0.75rem', fontSize: '0.8rem' }}
          >
            <option value="">All Vegetable Varieties</option>
            {availableVegetables.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        {/* Batch */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            STORAGE BATCH:
          </label>
          <select
            value={filters.batch_id || ''}
            onChange={(e) => onFilterChange('batch_id', e.target.value)}
            className="login-form-input no-left-icon"
            style={{ height: '36px', padding: '0 0.75rem', fontSize: '0.8rem' }}
          >
            <option value="">All Monitored Batches</option>
            {availableBatches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name || `${b.vegetable_name || b.vegetable_type} Batch #${b.id}`}
              </option>
            ))}
          </select>
        </div>

        {/* Data Source */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            DATA SOURCE:
          </label>
          <select
            value={filters.source_mode || 'ALL'}
            onChange={(e) => onFilterChange('source_mode', e.target.value)}
            className="login-form-input no-left-icon"
            style={{ height: '36px', padding: '0 0.75rem', fontSize: '0.8rem' }}
          >
            <option value="ALL">All Sources (Demo & Real)</option>
            <option value="DEMO">Demo Mode Only</option>
            <option value="REAL">Real ESP32 Device Only</option>
          </select>
        </div>
      </div>

      {/* Date Range Buttons */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
          TIME WINDOW:
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'today', label: 'Today' },
            { id: '24h', label: 'Last 24 Hours' },
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: 'Last 30 Days' },
            { id: 'custom', label: 'Custom Range' }
          ].map((r) => {
            const isSelected = filters.range === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRangeClick(r.id)}
                style={{
                  height: '32px',
                  padding: '0 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                  backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                  color: isSelected ? 'var(--primary)' : 'var(--text-secondary)'
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Custom Date Pickers */}
        {filters.range === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FROM:</span>
              <input
                type="date"
                value={filters.from ? filters.from.slice(0, 10) : ''}
                onChange={(e) => onFilterChange('from', e.target.value ? new Date(e.target.value).toISOString() : '')}
                className="login-form-input no-left-icon"
                style={{ height: '32px', padding: '0 0.5rem', fontSize: '0.75rem', width: 'auto' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TO:</span>
              <input
                type="date"
                value={filters.to ? filters.to.slice(0, 10) : ''}
                onChange={(e) => onFilterChange('to', e.target.value ? new Date(e.target.value).toISOString() : '')}
                className="login-form-input no-left-icon"
                style={{ height: '32px', padding: '0 0.5rem', fontSize: '0.75rem', width: 'auto' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Report Section Checkboxes (Section 14) */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
          INCLUDE SECTIONS IN REPORT:
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {sectionsList.map((sec) => {
            const isChecked = filters.sections?.[sec.key] !== false;
            return (
              <label
                key={sec.key}
                onClick={() => handleSectionToggle(sec.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.78rem',
                  color: isChecked ? 'var(--text-main)' : 'var(--text-muted)',
                  fontWeight: isChecked ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {isChecked ? (
                  <CheckSquare size={16} color="var(--primary)" />
                ) : (
                  <Square size={16} color="var(--border-light)" />
                )}
                <span>{sec.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onPreview}
          disabled={isPreviewing || isGenerating}
          className="btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            height: '38px',
            padding: '0 1rem',
            fontSize: '0.82rem',
            fontWeight: 700
          }}
        >
          <Eye size={15} className={isPreviewing ? 'spinner' : ''} />
          <span>{isPreviewing ? 'Loading Preview...' : 'Preview Report'}</span>
        </button>

        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || isPreviewing}
          className="btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            height: '38px',
            padding: '0 1.25rem',
            fontSize: '0.85rem',
            fontWeight: 800,
            boxShadow: '0 4px 12px rgba(27, 77, 46, 0.2)'
          }}
        >
          <FileCheck size={16} className={isGenerating ? 'spinner' : ''} />
          <span>{isGenerating ? 'Generating PDF...' : 'Generate & Save PDF'}</span>
        </button>
      </div>
    </div>
  );
}
