import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

export function AlertFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  severity,
  onSeverityChange,
  type,
  onTypeChange,
  sort,
  onSortChange
}) {
  const statusTabs = [
    { id: 'all', label: 'All Alerts' },
    { id: 'active', label: 'Active' },
    { id: 'unread', label: 'Unread' },
    { id: 'resolved', label: 'Resolved' }
  ];

  const severityOptions = [
    { value: 'all', label: 'All Severities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'warning', label: 'Warning' },
    { value: 'info', label: 'Info' }
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'temperature', label: 'Temperature' },
    { value: 'humidity', label: 'Humidity' },
    { value: 'gas_voc', label: 'Gas / VOC' },
    { value: 'light', label: 'Light Level' },
    { value: 'spoilage_risk', label: 'Spoilage Risk' },
    { value: 'storage_expiry', label: 'Storage Expiry' },
    { value: 'device_offline', label: 'Device State' },
    { value: 'sensor_data_unavailable', label: 'Sensor State' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'severity', label: 'Severity Rank' }
  ];

  return (
    <div
      className="vegsense-card"
      style={{
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}
    >
      {/* Top Row: Search & Status Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Search alerts, messages, devices..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ paddingLeft: '36px', height: '38px', fontSize: '0.875rem', width: '100%' }}
          />
        </div>

        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {statusTabs.map((tab) => {
            const isSelected = (status || 'all').toLowerCase() === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`btn-secondary ${isSelected ? 'active' : ''}`}
                style={{
                  height: '36px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '0 0.85rem',
                  backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent',
                  borderColor: isSelected ? 'var(--primary-border)' : 'var(--border-light)',
                  color: isSelected ? 'var(--primary)' : 'var(--text-secondary)'
                }}
                onClick={() => onStatusChange(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Select Dropdowns */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          borderTop: '1px solid var(--border-light)',
          paddingTop: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: '1 1 140px' }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <select
            className="input-field"
            value={severity || 'all'}
            onChange={(e) => onSeverityChange(e.target.value)}
            style={{ height: '34px', fontSize: '0.8rem', padding: '0 0.5rem', width: '100%' }}
          >
            {severityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: '1 1 160px' }}>
          <select
            className="input-field"
            value={type || 'all'}
            onChange={(e) => onTypeChange(e.target.value)}
            style={{ height: '34px', fontSize: '0.8rem', padding: '0 0.5rem', width: '100%' }}
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: '1 1 140px' }}>
          <ArrowUpDown size={14} style={{ color: 'var(--text-muted)' }} />
          <select
            className="input-field"
            value={sort || 'newest'}
            onChange={(e) => onSortChange(e.target.value)}
            style={{ height: '34px', fontSize: '0.8rem', padding: '0 0.5rem', width: '100%' }}
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
