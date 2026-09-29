import React from 'react';
import {
  Package,
  Calendar,
  Clock,
  MapPin,
  Scale,
  Layers,
  ChevronDown
} from 'lucide-react';

export function StorageContext({
  batches = [],
  selectedBatchId,
  onSelectBatch,
  batchDetails
}) {
  const b = batchDetails || {
    vegetable: 'Tomato',
    batchName: 'Tomato Batch A',
    quantity: '50 kg',
    location: 'Cold Room A',
    storedDate: '29 Sep 2026',
    expiryDate: '06 Oct 2026',
    daysRemaining: '7 days'
  };

  return (
    <div
      className="vegsense-storage-context-card"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'rgba(56, 189, 248, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0284c7'
          }}>
            <Package size={18} />
          </div>
          <div>
            <h2 style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              margin: '0 0 2px 0',
              letterSpacing: '-0.01em'
            }}>
              Storage Batch Context
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Produce inventory specifications and shelf-life timeline
            </p>
          </div>
        </div>

        {/* Batch Selector Dropdown (Section 23) */}
        {batches.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Select Batch:
            </span>
            <select
              value={selectedBatchId || ''}
              onChange={(e) => onSelectBatch && onSelectBatch(e.target.value)}
              style={{
                background: 'var(--bg-card-subtle)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '0.4rem 0.8rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name || batch.vegetable_name} ({batch.variety || 'Batch'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grid of Storage Information Fields (Section 22) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '0.75rem'
      }}>
        {/* Vegetable */}
        <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-card-subtle)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Vegetable
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
            {b.vegetable}
          </div>
        </div>

        {/* Batch */}
        <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-card-subtle)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Batch
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
            {b.batchName}
          </div>
        </div>

        {/* Quantity */}
        <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-card-subtle)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Quantity
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
            {b.quantity}
          </div>
        </div>

        {/* Location */}
        <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-card-subtle)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Location
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
            {b.location}
          </div>
        </div>

        {/* Stored Date */}
        <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-card-subtle)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Stored
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
            {b.storedDate}
          </div>
        </div>

        {/* Expected Expiry */}
        <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-card-subtle)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Expected Expiry
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
            {b.expiryDate}
          </div>
        </div>

        {/* Days Remaining */}
        <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-card-subtle)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Days Remaining
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
            {b.daysRemaining}
          </div>
        </div>
      </div>
    </div>
  );
}
