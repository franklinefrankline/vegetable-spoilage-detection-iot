import React from 'react';
import { Filter, Calendar, RotateCcw, Cpu, Layers, Package, Database } from 'lucide-react';

export function AnalyticsFilters({
  filters,
  onFilterChange,
  onApply,
  onReset,
  devices = [],
  vegetables = [],
  batches = []
}) {
  const rangeOptions = [
    { id: '1h', label: '1 Hour' },
    { id: '6h', label: '6 Hours' },
    { id: '12h', label: '12 Hours' },
    { id: '24h', label: '24 Hours' },
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: 'custom', label: 'Custom' }
  ];

  return (
    <div
      className="vegsense-card"
      style={{
        padding: '1.25rem 1.5rem',
        marginBottom: '1.75rem',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-light)'
      }}
    >
      {/* Top Filter Bar: Dropdowns & Range */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
        }}
      >
        {/* Device Filter */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            <Cpu size={13} />
            <span>DEVICE</span>
          </label>
          <select
            className="input-field"
            value={filters.deviceId || 'all'}
            onChange={(e) => onFilterChange('deviceId', e.target.value)}
            style={{ width: '100%', height: '36px', fontSize: '0.825rem', padding: '0 0.65rem' }}
          >
            <option value="all">All Devices</option>
            <option value="ESP32-DEMO-001">ESP32-DEMO-001 (Demo)</option>
            <option value="ESP32-001">ESP32-001 (Hardware)</option>
            {devices.filter((d) => d.id !== 'ESP32-DEMO-001' && d.id !== 'ESP32-001').map((d) => (
              <option key={d.id} value={d.id}>
                {d.name || d.id}
              </option>
            ))}
          </select>
        </div>

        {/* Vegetable Filter */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            <Layers size={13} />
            <span>VEGETABLE</span>
          </label>
          <select
            className="input-field"
            value={filters.vegetableType || 'all'}
            onChange={(e) => onFilterChange('vegetableType', e.target.value)}
            style={{ width: '100%', height: '36px', fontSize: '0.825rem', padding: '0 0.65rem' }}
          >
            <option value="all">All Vegetables</option>
            <option value="Tomato">Tomato</option>
            <option value="Potato">Potato</option>
            <option value="Onion">Onion</option>
            <option value="Carrot">Carrot</option>
            <option value="Cabbage">Cabbage</option>
            <option value="Bell Pepper">Bell Pepper</option>
            {vegetables
              .filter((v) => !['Tomato', 'Potato', 'Onion', 'Carrot', 'Cabbage', 'Bell Pepper'].includes(v.name))
              .map((v) => (
                <option key={v.id || v.name} value={v.name}>
                  {v.name}
                </option>
              ))}
          </select>
        </div>

        {/* Batch Filter */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            <Package size={13} />
            <span>STORAGE BATCH</span>
          </label>
          <select
            className="input-field"
            value={filters.batchId || 'all'}
            onChange={(e) => onFilterChange('batchId', e.target.value)}
            style={{ width: '100%', height: '36px', fontSize: '0.825rem', padding: '0 0.65rem' }}
          >
            <option value="all">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name || b.batch_number || b.vegetable_name}
              </option>
            ))}
          </select>
        </div>

        {/* Data Source Mode Filter (Section 79) */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            <Database size={13} />
            <span>DATA SOURCE</span>
          </label>
          <select
            className="input-field"
            value={filters.sourceMode || 'all'}
            onChange={(e) => onFilterChange('sourceMode', e.target.value)}
            style={{ width: '100%', height: '36px', fontSize: '0.825rem', padding: '0 0.65rem' }}
          >
            <option value="all">All Data Sources</option>
            <option value="DEMO">Demo Mode Only</option>
            <option value="REAL">Real ESP32 Hardware Only</option>
          </select>
        </div>
      </div>

      {/* Range Selection Pills & Action Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          borderTop: '1px solid var(--border-light)',
          paddingTop: '1rem'
        }}
      >
        {/* Time Range Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.3rem' }}>
            RANGE:
          </span>
          {rangeOptions.map((opt) => {
            const isSelected = filters.range === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`btn-secondary ${isSelected ? 'active' : ''}`}
                style={{
                  height: '32px',
                  fontSize: '0.775rem',
                  fontWeight: 700,
                  padding: '0 0.75rem',
                  backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                  borderColor: isSelected ? 'var(--primary-border)' : 'var(--border-light)',
                  color: isSelected ? 'var(--primary)' : 'var(--text-secondary)'
                }}
                onClick={() => onFilterChange('range', opt.id)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Custom Date Pickers (only visible if range === 'custom') */}
        {filters.range === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From:</span>
              <input
                type="date"
                className="input-field"
                value={filters.fromDate || ''}
                onChange={(e) => onFilterChange('fromDate', e.target.value)}
                style={{ height: '32px', fontSize: '0.8rem', padding: '0 0.5rem' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To:</span>
              <input
                type="date"
                className="input-field"
                value={filters.toDate || ''}
                onChange={(e) => onFilterChange('toDate', e.target.value)}
                style={{ height: '32px', fontSize: '0.8rem', padding: '0 0.5rem' }}
              />
            </div>
          </div>
        )}

        {/* Apply & Reset Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onReset}
            style={{
              height: '32px',
              fontSize: '0.775rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onApply}
            style={{
              height: '32px',
              fontSize: '0.775rem',
              padding: '0 0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Filter size={13} />
            <span>Apply Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
}
