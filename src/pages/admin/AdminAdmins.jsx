import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdminTable } from '../../components/admin/AdminTable';
import { AdminDrawer } from '../../components/admin/AdminDrawer';
import { CreateAdminModal } from '../../components/admin/CreateAdminModal';
import { EditAdminModal } from '../../components/admin/EditAdminModal';
import { PermissionEditor } from '../../components/admin/PermissionEditor';
import { DeleteAdminModal } from '../../components/admin/DeleteAdminModal';
import { ResetPasswordModal } from '../../components/admin/ResetPasswordModal';
import { AdminTableSkeleton } from '../../components/admin/AdminSkeleton';
import {
  isMainAdmin,
  hasPermission,
  canDeleteAdmin,
  canDeactivateAdmin
} from '../../utils/adminPermissions';
import {
  Search,
  UserPlus,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Users,
  Lock,
  Filter,
  X
} from 'lucide-react';

export function AdminAdmins() {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal / Drawer states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingAdmin, setViewingAdmin] = useState(null);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [permissionAdmin, setPermissionAdmin] = useState(null);
  const [resetAdmin, setResetAdmin] = useState(null);
  const [deletingAdmin, setDeletingAdmin] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canCreate = isMainAdmin(currentUser) || hasPermission(currentUser, 'admin_management');

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getAdmins({
        search,
        status: statusFilter
      });
      if (res.success) {
        setAdmins(res.admins || []);
      }
    } catch (err) {
      console.error('Failed to load administrators:', err);
      addToast(err.message || 'Failed to retrieve administrator directory.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, addToast]);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  // Create Administrator
  const handleCreateSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const res = await adminService.createAdmin(formData);
      if (res.success) {
        addToast(`Administrator ${formData.name} created successfully.`, 'success');
        setIsCreateOpen(false);
        loadAdmins();
      }
    } catch (err) {
      addToast(err.message || 'Failed to create administrator.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Administrator Profile
  const handleEditSubmit = async (formData) => {
    if (!editingAdmin) return;
    setIsSubmitting(true);
    try {
      const res = await adminService.updateAdmin(editingAdmin.id, formData);
      if (res.success) {
        addToast('Administrator profile updated successfully.', 'success');
        setEditingAdmin(null);
        if (viewingAdmin?.id === editingAdmin.id) {
          setViewingAdmin((prev) => ({ ...prev, ...formData }));
        }
        loadAdmins();
      }
    } catch (err) {
      addToast(err.message || 'Failed to update administrator profile.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change Permissions
  const handlePermissionSave = async (permissions) => {
    if (!permissionAdmin) return;
    setIsSubmitting(true);
    try {
      const res = await adminService.updateAdminPermissions(permissionAdmin.id, permissions);
      if (res.success) {
        addToast('Administrator permissions updated successfully.', 'success');
        setPermissionAdmin(null);
        if (viewingAdmin?.id === permissionAdmin.id) {
          setViewingAdmin((prev) => ({
            ...prev,
            full_access: permissions.full_access ? 1 : 0,
            permissions
          }));
        }
        loadAdmins();
      }
    } catch (err) {
      addToast(err.message || 'Failed to update permissions.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Status (Activate / Deactivate)
  const handleToggleStatus = async (admin) => {
    const isActive = admin.is_active === 1 || admin.is_active === true;
    if (isActive) {
      const check = canDeactivateAdmin(currentUser, admin);
      if (!check.allowed) {
        addToast(check.reason, 'error');
        return;
      }
      try {
        await adminService.deactivateAdmin(admin.id);
        addToast(`Administrator ${admin.email} deactivated.`, 'info');
        if (viewingAdmin?.id === admin.id) {
          setViewingAdmin((prev) => ({ ...prev, is_active: 0 }));
        }
        loadAdmins();
      } catch (err) {
        addToast(err.message || 'Failed to deactivate administrator.', 'error');
      }
    } else {
      try {
        await adminService.activateAdmin(admin.id);
        addToast(`Administrator ${admin.email} activated.`, 'success');
        if (viewingAdmin?.id === admin.id) {
          setViewingAdmin((prev) => ({ ...prev, is_active: 1 }));
        }
        loadAdmins();
      } catch (err) {
        addToast(err.message || 'Failed to activate administrator.', 'error');
      }
    }
  };

  // Reset Password
  const handleResetPassword = async (adminId, newPassword) => {
    setIsSubmitting(true);
    try {
      const res = await adminService.resetAdminPassword(adminId, newPassword);
      if (res.success) {
        addToast('Administrator password reset successfully.', 'success');
        setResetAdmin(null);
      }
    } catch (err) {
      addToast(err.message || 'Failed to reset administrator password.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Admin
  const handleDeleteConfirm = async (admin) => {
    const check = canDeleteAdmin(currentUser, admin);
    if (!check.allowed) {
      addToast(check.reason, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminService.deleteAdmin(admin.id, 'DELETE');
      if (res.success) {
        addToast('Administrator account deleted successfully.', 'success');
        setDeletingAdmin(null);
        if (viewingAdmin?.id === admin.id) {
          setViewingAdmin(null);
        }
        loadAdmins();
      }
    } catch (err) {
      addToast(err.message || 'Failed to delete administrator.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-page-content">
      {/* Top Banner / Controls */}
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">Administrator Management</h2>
          <p className="section-subtitle">
            Configure system administrator accounts, manage operational entitlements, and control access permissions.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="btn-secondary refresh-btn"
            onClick={loadAdmins}
            disabled={loading}
            title="Refresh Directory"
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
            <span>Refresh</span>
          </button>

          {canCreate && (
            <button
              type="button"
              className="btn-primary create-admin-btn"
              onClick={() => setIsCreateOpen(true)}
            >
              <UserPlus size={16} />
              <span>+ Create Administrator</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-toolbar-card">
        <div className="toolbar-search-col">
          <div className="admin-search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="admin-search-input-styled"
              placeholder="Search by name, username, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Accounts</option>
              <option value="INACTIVE">Inactive Accounts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      {loading && admins.length === 0 ? (
        <AdminTableSkeleton />
      ) : (
        <AdminTable
          admins={admins}
          currentUser={currentUser}
          onView={(admin) => setViewingAdmin(admin)}
          onEdit={(admin) => setEditingAdmin(admin)}
          onPermissions={(admin) => setPermissionAdmin(admin)}
          onToggleStatus={handleToggleStatus}
          onResetPassword={(admin) => setResetAdmin(admin)}
          onDelete={(admin) => setDeletingAdmin(admin)}
        />
      )}

      {/* Modals & Slide-over Drawer */}
      <CreateAdminModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        isSubmitting={isSubmitting}
      />

      <EditAdminModal
        isOpen={Boolean(editingAdmin)}
        onClose={() => setEditingAdmin(null)}
        admin={editingAdmin}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
      />

      <PermissionEditor
        isOpen={Boolean(permissionAdmin)}
        onClose={() => setPermissionAdmin(null)}
        admin={permissionAdmin}
        onSave={handlePermissionSave}
        isSubmitting={isSubmitting}
      />

      <ResetPasswordModal
        isOpen={Boolean(resetAdmin)}
        onClose={() => setResetAdmin(null)}
        admin={resetAdmin}
        onSubmit={handleResetPassword}
        isSubmitting={isSubmitting}
      />

      <DeleteAdminModal
        isOpen={Boolean(deletingAdmin)}
        onClose={() => setDeletingAdmin(null)}
        admin={deletingAdmin}
        onConfirm={handleDeleteConfirm}
        isSubmitting={isSubmitting}
      />

      <AdminDrawer
        isOpen={Boolean(viewingAdmin)}
        onClose={() => setViewingAdmin(null)}
        admin={viewingAdmin}
        currentUser={currentUser}
        onEdit={(admin) => setEditingAdmin(admin)}
        onChangePermissions={(admin) => setPermissionAdmin(admin)}
        onResetPassword={(admin) => setResetAdmin(admin)}
        onToggleStatus={handleToggleStatus}
        onDelete={(admin) => setDeletingAdmin(admin)}
      />
    </div>
  );
}

export default AdminAdmins;
