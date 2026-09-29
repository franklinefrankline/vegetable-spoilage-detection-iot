import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { AdminAuditTable } from '../../components/admin/AdminAuditTable';
import { AdminTableSkeleton } from '../../components/admin/AdminSkeleton';
import { AdminEmptyState } from '../../components/admin/AdminEmptyState';
import {
  FileCheck2,
  Search,
  Filter,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const { addToast } = useToast();

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getAuditLogs({
        search,
        action: actionFilter,
        page,
        limit
      });
      if (res.success) {
        setLogs(res.logs || []);
        setTotalLogs(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      addToast('Unable to load administrative audit logs.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, page, limit, addToast]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  return (
    <div className="admin-page-content">
      {/* Page Header */}
      <div className="admin-section-header">
        <div>
          <h2 className="section-title">Administrative Audit Logs</h2>
          <p className="section-subtitle">
            Cryptographically tracked security audit trail for user account lifecycle events, roles, and administrative interventions.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary refresh-btn"
          onClick={loadAuditLogs}
          disabled={loading}
          title="Refresh Audit Logs"
        >
          <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="admin-toolbar-card">
        <div className="toolbar-search-col">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="admin-input-field toolbar-search-input"
              placeholder="Search by admin email, target user or details..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="toolbar-filters-col">
          <div className="filter-select-wrapper">
            <Filter size={14} className="select-icon" />
            <select
              className="admin-select-field toolbar-select"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Actions</option>
              <option value="USER_ACTIVATED">Account Activated</option>
              <option value="USER_DEACTIVATED">Account Deactivated</option>
              <option value="USER_DELETED">Account Deleted</option>
              <option value="BULK_USERS_DELETED">Bulk Deleted</option>
              <option value="ROLE_CHANGED">Role Changed</option>
              <option value="USER_UPDATED">Profile Updated</option>
              <option value="USER_VIEWED">Account Viewed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table Area */}
      {loading ? (
        <AdminTableSkeleton rows={8} />
      ) : logs.length === 0 ? (
        <AdminEmptyState
          type="audit"
          title={search || actionFilter !== 'ALL' ? 'No Matching Logs' : 'No Audit Activity Found'}
          message={search || actionFilter !== 'ALL' ? 'No audit records match your search criteria.' : 'No administrative actions have been recorded yet.'}
          actionLabel="Reset Filters"
          onAction={() => {
            setSearch('');
            setActionFilter('ALL');
            setPage(1);
          }}
        />
      ) : (
        <>
          <AdminAuditTable logs={logs} />

          {/* Pagination */}
          <div className="admin-table-footer">
            <div className="footer-count-text">
              Showing {Math.min(totalLogs, (page - 1) * limit + 1)}–{Math.min(totalLogs, page * limit)} of {totalLogs} audit events
            </div>

            {totalPages > 1 && (
              <div className="admin-pagination-controls">
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                <div className="page-numbers-group">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .map((p, idx, arr) => (
                      <React.Fragment key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && <span className="pagination-ellipsis">…</span>}
                        <button
                          type="button"
                          className={`page-num-btn ${page === p ? 'active' : ''}`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    ))}
                </div>

                <button
                  type="button"
                  className="pagination-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  title="Next Page"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AdminAuditLogs;
