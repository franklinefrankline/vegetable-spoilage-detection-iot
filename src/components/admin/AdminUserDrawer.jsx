import React, { useEffect } from 'react';
import {
  X,
  Shield,
  UserCheck,
  CheckCircle2,
  Ban,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  Fingerprint,
  Mail,
  User,
  Radio,
  Boxes,
  FileText
} from 'lucide-react';

export function AdminUserDrawer({
  user,
  onClose,
  currentAdmin,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
  onChangeRole
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';
  const isActive = user.is_active === 1 || user.is_active === undefined;
  const isSelf = currentAdmin?.id === user.id;

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const formatFullDate = (iso) => {
    if (!iso) return 'Not recorded';
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return iso;
    }
  };

  return (
    <>
      <div className="admin-drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="admin-user-drawer" role="dialog" aria-label="User Account Details">
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-header-title">User Profile Details</div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          {/* Identity Section */}
          <div className="drawer-identity-box">
            <div className={`drawer-avatar ${isAdmin ? 'avatar-admin' : ''}`}>
              {initials}
            </div>
            <div className="drawer-name-group">
              <h2 className="drawer-user-name">{user.name}</h2>
              <div className="drawer-user-email">{user.email}</div>
            </div>

            <div className="drawer-badges-group">
              <span className={`badge-role ${isAdmin ? 'role-admin' : 'role-user'}`}>
                {isAdmin ? <Shield size={11} className="badge-icon" /> : <UserCheck size={11} className="badge-icon" />}
                <span>{user.role || 'USER'}</span>
              </span>

              <span className={`badge-status ${isActive ? 'status-active' : 'status-inactive'}`}>
                <span className="status-indicator-dot" />
                <span>{isActive ? 'ACTIVE' : 'INACTIVE'}</span>
              </span>
            </div>
          </div>

          {/* Account Information */}
          <div className="drawer-section">
            <div className="drawer-section-heading">Account Information</div>
            <div className="drawer-detail-grid">
              <div className="drawer-detail-row">
                <span className="detail-label">
                  <Fingerprint size={14} />
                  <span>User ID:</span>
                </span>
                <span className="detail-value mono-text" title={user.id}>{user.id}</span>
              </div>

              <div className="drawer-detail-row">
                <span className="detail-label">
                  <Calendar size={14} />
                  <span>Registration:</span>
                </span>
                <span className="detail-value">{formatFullDate(user.created_at)}</span>
              </div>

              <div className="drawer-detail-row">
                <span className="detail-label">
                  <Clock size={14} />
                  <span>Last Login:</span>
                </span>
                <span className="detail-value">{formatFullDate(user.last_login_at)}</span>
              </div>

              <div className="drawer-detail-row">
                <span className="detail-label">
                  <Clock size={14} />
                  <span>Last Updated:</span>
                </span>
                <span className="detail-value">{formatFullDate(user.updated_at)}</span>
              </div>
            </div>
          </div>

          {/* Connected Resources Summary */}
          {(user.deviceCount !== undefined || user.batchCount !== undefined || user.reportCount !== undefined) && (
            <div className="drawer-section">
              <div className="drawer-section-heading">Storage & Hardware Telemetry</div>
              <div className="drawer-telemetry-cards">
                <div className="telemetry-mini-card">
                  <Radio size={16} color="var(--primary)" />
                  <div className="mini-card-val">{user.deviceCount ?? 0}</div>
                  <div className="mini-card-lbl">Devices</div>
                </div>

                <div className="telemetry-mini-card">
                  <Boxes size={16} color="var(--accent-olive)" />
                  <div className="mini-card-val">{user.batchCount ?? 0}</div>
                  <div className="mini-card-lbl">Batches</div>
                </div>

                <div className="telemetry-mini-card">
                  <FileText size={16} color="var(--accent-blue)" />
                  <div className="mini-card-val">{user.reportCount ?? 0}</div>
                  <div className="mini-card-lbl">Reports</div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Management Actions */}
          <div className="drawer-section">
            <div className="drawer-section-heading">Account Operations</div>
            <div className="drawer-actions-stack">
              <button
                type="button"
                className="btn-drawer-action"
                onClick={() => {
                  onClose();
                  onEdit(user);
                }}
              >
                <Edit2 size={16} />
                <span>Edit User Profile & Role</span>
              </button>

              <button
                type="button"
                className="btn-drawer-action"
                onClick={() => {
                  onClose();
                  onChangeRole(user);
                }}
              >
                <Shield size={16} />
                <span>{isAdmin ? 'Demote to Standard User' : 'Promote to Administrator'}</span>
              </button>

              {isActive ? (
                <button
                  type="button"
                  className="btn-drawer-action action-deactivate"
                  disabled={isSelf}
                  onClick={() => {
                    onClose();
                    onDeactivate(user);
                  }}
                  title={isSelf ? 'Cannot deactivate yourself' : 'Deactivate user'}
                >
                  <Ban size={16} />
                  <span>Deactivate Account</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-drawer-action action-activate"
                  onClick={() => {
                    onClose();
                    onActivate(user);
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Reactivate Account</span>
                </button>
              )}

              <button
                type="button"
                className="btn-drawer-action action-delete"
                disabled={isSelf}
                onClick={() => {
                  onClose();
                  onDelete(user);
                }}
                title={isSelf ? 'Cannot delete yourself' : 'Permanently Delete User Account'}
              >
                <Trash2 size={16} />
                <span>Permanently Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminUserDrawer;
