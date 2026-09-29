import React from 'react';
import { PackageOpen, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from '../../router/Router';

export function SpoilageEmptyState() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px dashed var(--border-light)',
        borderRadius: '14px',
        padding: '3rem 2rem',
        textAlign: 'center',
        margin: '2rem 0'
      }}
    >
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '14px',
        background: 'var(--bg-card-subtle)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        marginBottom: '1rem'
      }}>
        <PackageOpen size={28} />
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>
        No Storage Batches Available
      </h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
        Add a storage batch to begin atmospheric environmental spoilage monitoring and risk estimation.
      </p>

      <button
        type="button"
        onClick={() => navigate('/storage')}
        className="btn btn-primary"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.65rem 1.4rem',
          fontWeight: 700,
          fontSize: '0.9rem'
        }}
      >
        <Plus size={16} />
        <span>Add Vegetable</span>
      </button>
    </div>
  );
}
