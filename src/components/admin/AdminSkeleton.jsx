import React from 'react';

export function AdminTableSkeleton({ rows = 6 }) {
  return (
    <div className="admin-skeleton-table-wrapper">
      <div className="skeleton-table-header">
        <div className="skeleton-bar w-10" />
        <div className="skeleton-bar w-25" />
        <div className="skeleton-bar w-20" />
        <div className="skeleton-bar w-15" />
        <div className="skeleton-bar w-15" />
        <div className="skeleton-bar w-15" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-table-row">
          <div className="skeleton-box s-check" />
          <div className="skeleton-user-group">
            <div className="skeleton-avatar" />
            <div className="skeleton-user-text">
              <div className="skeleton-bar w-70" />
              <div className="skeleton-bar w-40" />
            </div>
          </div>
          <div className="skeleton-bar w-30" />
          <div className="skeleton-pill" />
          <div className="skeleton-pill" />
          <div className="skeleton-bar w-20" />
        </div>
      ))}
    </div>
  );
}

export function AdminCardsSkeleton({ count = 4 }) {
  return (
    <div className="admin-stats-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-stat-card">
          <div className="skeleton-bar w-40 mb-2" />
          <div className="skeleton-bar w-60 h-8 mb-2" />
          <div className="skeleton-bar w-30" />
        </div>
      ))}
    </div>
  );
}

export default AdminTableSkeleton;
