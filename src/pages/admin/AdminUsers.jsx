import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdminUserTable } from '../../components/admin/AdminUserTable';
import { AdminUserCard } from '../../components/admin/AdminUserCard';
import { AdminUserDrawer } from '../../components/admin/AdminUserDrawer';
import { AdminUserEditModal } from '../../components/admin/AdminUserEditModal';
import { DeleteUserModal } from '../../components/admin/DeleteUserModal';
import { BulkDeleteModal } from '../../components/admin/BulkDeleteModal';
import { RoleChangeModal } from '../../components/admin/RoleChangeModal';
import { AddAdminModal } from '../../components/admin/AddAdminModal';
import { AdminTableSkeleton } from '../../components/admin/AdminSkeleton';
import { AdminEmptyState } from '../../components/admin/AdminEmptyState';
import {
  canDeleteUser,
  canDeactivateUser,
  canChangeRole
} from '../../utils/adminPermissions';
import {
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  UserPlus,
  CheckCircle,
  Ban,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';

export function AdminUsers() {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  // Query & Filter states
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState('newest');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Data states
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selection states
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal & Drawer active item states
  const [viewingUser, setViewingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [roleChangingUser, setRoleChangingUser] = useState(null);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);

  // Active admin count cache for validation
  const [activeAdminCount, setActiveAdminCount] = useState(2);

  // Fetch users with query params
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({
        search,
        role: roleFilter,
        status: statusFilter,
        sort: sortOption,
        page,
        limit
      });

      if (res.success) {
        setUsers(res.users || []);
        setTotalUsers(res.total || 0);
        setTotalPages(res.totalPages || 1);

        // Count active admins in current set / update cache
        const adminCount = (res.users || []).filter((u) => u.role === 'ADMIN' && (u.is_active === 1 || u.is_active === undefined)).length;
        if (adminCount > 0) setActiveAdminCount(Math.max(activeAdminCount, adminCount));
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      addToast('Unable to load user accounts from database.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, sortOption, page, limit, addToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Selection handlers
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(users.map((u) => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const clearSelection = () => setSelectedIds([]);

  // --- Handlers for User Actions ---

  // 1. View User in Drawer
  const handleViewUser = async (user) => {
    try {
      const details = await adminService.getUser(user.id);
      setViewingUser(details.user || user);
    } catch (e) {
      setViewingUser(user);
    }
  };

  // 2. Edit User Account
  const handleSaveEdit = async (payload) => {
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      await adminService.updateUser(editingUser.id, payload);
      addToast('User account updated successfully.', 'success');
      setEditingUser(null);
      if (viewingUser?.id === editingUser.id) {
        setViewingUser((prev) => ({ ...prev, ...payload }));
      }
      loadUsers();
    } catch (err) {
      addToast(err.message || 'Failed to update user account.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Activate Account
  const handleActivate = async (user) => {
    try {
      await adminService.activateUser(user.id);
      addToast(`Account for ${user.email} activated successfully.`, 'success');
      if (viewingUser?.id === user.id) {
        setViewingUser((prev) => ({ ...prev, is_active: 1 }));
      }
      loadUsers();
    } catch (err) {
      addToast(err.message || 'Failed to activate user account.', 'error');
    }
  };

  // 4. Deactivate Account
  const handleDeactivate = async (user) => {
    const check = canDeactivateUser(currentUser, user, activeAdminCount);
    if (!check.allowed) {
      addToast(check.reason, 'error');
      return;
    }

    try {
      await adminService.deactivateUser(user.id);
      addToast(`Account for ${user.email} deactivated successfully.`, 'info');
      if (viewingUser?.id === user.id) {
        setViewingUser((prev) => ({ ...prev, is_active: 0 }));
      }
      loadUsers();
    } catch (err) {
      addToast(err.message || 'Failed to deactivate user account.', 'error');
    }
  };

  // 5. Change Role (USER <-> ADMIN)
  const handleRoleChangeConfirm = async (user, newRole) => {
    const check = canChangeRole(currentUser, user, activeAdminCount);
    if (!check.allowed && newRole === 'USER') {
      addToast(check.reason, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminService.changeUserRole(user.id, newRole);
      addToast(`Role changed to ${newRole} successfully.`, 'success');
      setRoleChangingUser(null);
      if (viewingUser?.id === user.id) {
        setViewingUser((prev) => ({ ...prev, role: newRole }));
      }
      loadUsers();
    } catch (err) {
      addToast(err.message || 'Failed to change user role.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Delete User Account Permanently
  const handleDeleteConfirm = async (user) => {
    const check = canDeleteUser(currentUser, user, activeAdminCount);
    if (!check.allowed) {
      addToast(check.reason, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminService.deleteUser(user.id, 'DELETE');
      addToast('User account deleted successfully.', 'success');
      setDeletingUser(null);
      if (viewingUser?.id === user.id) {
        setViewingUser(null);
      }
      // Remove from selected list
      setSelectedIds((prev) => prev.filter((id) => id !== user.id));
      loadUsers();
    } catch (err) {
      addToast(err.message || 'Failed to delete user account.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Bulk Activate
  const handleBulkActivate = async () => {
    if (selectedIds.length === 0) return;
    try {
      for (const id of selectedIds) {
        await adminService.activateUser(id);
      }
      addToast(`${selectedIds.length} accounts activated successfully.`, 'success');
      clearSelection();
      loadUsers();
    } catch (err) {
      addToast('Failed to activate selected accounts.', 'error');
    }
  };

  // 8. Bulk Deactivate
  const handleBulkDeactivate = async () => {
    if (selectedIds.length === 0) return;
    const targetIds = selectedIds.filter((id) => id !== currentUser?.id);
    try {
      for (const id of targetIds) {
        await adminService.deactivateUser(id);
      }
      addToast(`${targetIds.length} accounts deactivated successfully.`, 'info');
      clearSelection();
      loadUsers();
    } catch (err) {
      addToast('Failed to deactivate selected accounts.', 'error');
    }
  };

  // 9. Bulk Delete Confirm
  const handleBulkDeleteConfirm = async (ids) => {
    setIsSubmitting(true);
    try {
      const res = await adminService.bulkDeleteUsers(ids, 'DELETE');
      addToast(res.message || `${res.deleted} user accounts deleted successfully.`, 'success');
      setIsBulkDeleting(false);
      clearSelection();
      loadUsers();
    } catch (err) {
      addToast(err.message || 'Failed to execute bulk deletion.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 10. Add / Promote Admin from list
  const handlePromoteAdmin = async (candidate) => {
    setIsSubmitting(true);
    try {
      await adminService.changeUserRole(candidate.id, 'ADMIN');
      addToast(`Granted Administrator privileges to ${candidate.email}.`, 'success');
      setIsAddAdminOpen(false);
      loadUsers();
    } catch (err) {
      addToast(err.message || 'Failed to grant administrator privileges.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedUsers = users.filter((u) => selectedIds.includes(u.id));

  return (
    <div className="admin-page-content">
      {/* Subtitle & Actions Bar */}
      <div className="admin-section-header">
        <div>
          <p className="section-subtitle">
            Manage registered accounts, access status and user permissions.
          </p>
        </div>

        <div className="header-action-group">
          <button
            type="button"
            className="btn-primary add-admin-btn"
            onClick={() => setIsAddAdminOpen(true)}
            title="Promote verified user to Administrator"
          >
            <UserPlus size={16} />
            <span>Add Admin</span>
          </button>
        </div>
      </div>

      {/* Top Filter & Search Toolbar */}
      <div className="admin-toolbar-card">
        <div className="toolbar-search-col">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="admin-input-field toolbar-search-input"
              placeholder="Search by name, email or user ID..."
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
          {/* Role Filter */}
          <div className="filter-select-wrapper">
            <Shield size={14} className="select-icon" />
            <select
              className="admin-select-field toolbar-select"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Roles</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="filter-select-wrapper">
            <Filter size={14} className="select-icon" />
            <select
              className="admin-select-field toolbar-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="filter-select-wrapper">
            <ArrowUpDown size={14} className="select-icon" />
            <select
              className="admin-select-field toolbar-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A–Z)</option>
              <option value="name_desc">Name (Z–A)</option>
              <option value="last_login">Recently Active</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            className="btn-secondary toolbar-icon-btn"
            onClick={loadUsers}
            disabled={loading}
            title="Refresh Users"
          >
            <RefreshCw size={15} className={loading ? 'spin-anim' : ''} />
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (Visible when users selected) */}
      {selectedIds.length > 0 && (
        <div className="admin-bulk-action-bar">
          <div className="bulk-count-label">
            <span className="count-pill">{selectedIds.length}</span>
            <span>users selected</span>
          </div>

          <div className="bulk-buttons-group">
            <button
              type="button"
              className="btn-bulk-action bulk-activate"
              onClick={handleBulkActivate}
              title="Activate selected accounts"
            >
              <CheckCircle size={14} />
              <span>Activate</span>
            </button>

            <button
              type="button"
              className="btn-bulk-action bulk-deactivate"
              onClick={handleBulkDeactivate}
              title="Deactivate selected accounts"
            >
              <Ban size={14} />
              <span>Deactivate</span>
            </button>

            <button
              type="button"
              className="btn-bulk-action bulk-delete"
              onClick={() => setIsBulkDeleting(true)}
              title="Permanently delete selected accounts"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>

            <button
              type="button"
              className="btn-bulk-clear"
              onClick={clearSelection}
              title="Clear selection"
            >
              <X size={14} />
              <span>Deselect All</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <AdminTableSkeleton rows={8} />
      ) : users.length === 0 ? (
        <AdminEmptyState
          type={search || roleFilter !== 'ALL' || statusFilter !== 'ALL' ? 'search' : 'users'}
          actionLabel="Reset Search & Filters"
          onAction={() => {
            setSearch('');
            setRoleFilter('ALL');
            setStatusFilter('ALL');
            setPage(1);
          }}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="desktop-user-table-wrap">
            <AdminUserTable
              users={users}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              currentAdmin={currentUser}
              onView={handleViewUser}
              onEdit={(u) => setEditingUser(u)}
              onActivate={handleActivate}
              onDeactivate={handleDeactivate}
              onDelete={(u) => setDeletingUser(u)}
              onChangeRole={(u) => setRoleChangingUser(u)}
            />
          </div>

          {/* Mobile User Cards View */}
          <div className="mobile-user-cards-wrap">
            {users.map((u) => (
              <AdminUserCard
                key={u.id}
                user={u}
                isSelected={selectedIds.includes(u.id)}
                onToggleSelect={handleToggleSelect}
                currentAdmin={currentUser}
                onView={handleViewUser}
                onEdit={(usr) => setEditingUser(usr)}
                onActivate={handleActivate}
                onDeactivate={handleDeactivate}
                onDelete={(usr) => setDeletingUser(usr)}
                onChangeRole={(usr) => setRoleChangingUser(usr)}
              />
            ))}
          </div>

          {/* Table Footer with Server-Side Pagination */}
          <div className="admin-table-footer">
            <div className="footer-count-text">
              Showing {Math.min(totalUsers, (page - 1) * limit + 1)}–{Math.min(totalUsers, page * limit)} of {totalUsers} users
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

      {/* --- Drawers & Modals --- */}

      {/* 1. User Profile Drawer */}
      {viewingUser && (
        <AdminUserDrawer
          user={viewingUser}
          onClose={() => setViewingUser(null)}
          currentAdmin={currentUser}
          onEdit={(u) => setEditingUser(u)}
          onActivate={handleActivate}
          onDeactivate={handleDeactivate}
          onDelete={(u) => setDeletingUser(u)}
          onChangeRole={(u) => setRoleChangingUser(u)}
        />
      )}

      {/* 2. Edit User Modal */}
      {editingUser && (
        <AdminUserEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveEdit}
          isSubmitting={isSubmitting}
        />
      )}

      {/* 3. Delete Confirmation Modal (Requires typing DELETE) */}
      {deletingUser && (
        <DeleteUserModal
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={handleDeleteConfirm}
          isSubmitting={isSubmitting}
        />
      )}

      {/* 4. Bulk Delete Confirmation Modal (Requires typing DELETE) */}
      {isBulkDeleting && (
        <BulkDeleteModal
          selectedUsers={selectedUsers}
          onClose={() => setIsBulkDeleting(false)}
          onConfirm={handleBulkDeleteConfirm}
          isSubmitting={isSubmitting}
        />
      )}

      {/* 5. Role Change Modal */}
      {roleChangingUser && (
        <RoleChangeModal
          user={roleChangingUser}
          onClose={() => setRoleChangingUser(null)}
          onConfirm={handleRoleChangeConfirm}
          isSubmitting={isSubmitting}
        />
      )}

      {/* 6. Add Admin Modal */}
      {isAddAdminOpen && (
        <AddAdminModal
          users={users}
          onClose={() => setIsAddAdminOpen(false)}
          onPromote={handlePromoteAdmin}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

export default AdminUsers;
