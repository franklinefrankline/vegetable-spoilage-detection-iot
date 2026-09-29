import React from 'react';
import { AlertCard } from './AlertCard';
import { AlertEmptyState } from './AlertEmptyState';
import { AlertSkeleton } from './AlertSkeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function AlertList({
  alerts = [],
  loading = false,
  pagination = {},
  onPageChange,
  onMarkRead,
  onResolve,
  onViewDetails
}) {
  if (loading) {
    return <AlertSkeleton />;
  }

  if (!alerts || alerts.length === 0) {
    return <AlertEmptyState type="none" />;
  }

  const { page = 1, totalPages = 1, total = alerts.length } = pagination;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {alerts.map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onMarkRead={onMarkRead}
          onResolve={onResolve}
          onViewDetails={onViewDetails}
        />
      ))}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 0.5rem',
            marginTop: '0.5rem',
            borderTop: '1px solid var(--border-light)'
          }}
        >
          <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total alerts)
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn-secondary"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              style={{ height: '34px', padding: '0 0.75rem', fontSize: '0.8rem' }}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              style={{ height: '34px', padding: '0 0.75rem', fontSize: '0.8rem' }}
              aria-label="Next page"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
