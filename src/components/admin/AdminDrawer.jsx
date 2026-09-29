import React from 'react';
import {
  X,
  Shield,
  ShieldAlert,
  User,
  Mail,
  AtSign,
  Calendar,
  Clock,
  Edit,
  KeyRound,
  Ban,
  CheckCircle,
  Trash2,
  Lock,
  Check
} from 'lucide-react';
import { ADMIN_PERMISSIONS, PERMISSION_LABELS } from '../../utils/adminPermissions';

export function AdminDrawer({
  isOpen,
  onClose,
  admin,
  onEdit,
  onChangePermissions,
  onResetPassword,
  onToggleStatus,
  onDelete,
  currentUser
}) {
  if (!isOpen || !admin) return null;

  const isMainAdmin = admin.role === 'MAIN_ADMIN';
  const isActive = admin.is_active === 1 || admin.is_active === true;
  const isFullAccess = isMainAdmin || admin.full_access === 1 || admin.full_access === true;
  const isSelf = currentUser?.id === admin.id;

  const formatDate = (isoStr) => {
    if (!isoStr) return 'Never';
    try {
      return new Date(isoStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="admin-drawer-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Slide-over Drawer Panel */}
      <aside className="admin-profile-drawer" aria-label="Administrator Profile Details">
        <div className="drawer-header">
          <div className="drawer-title-group">
            <h3 className="drawer-title">ADMIN PROFILE</h3>
            <span className="drawer-subtitle">Comprehensive administrative privileges and status</span>
          </div>
          <button type="button" className="drawer-close-btn" onClick={onClose} aria-label="Close profile">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Identity Header Card */}
          <div className="drawer-identity-card">
            <div className={`drawer-avatar ${isMainAdmin ? 'drawer-avatar-main' : 'drawer-avatar-admin'}`}>
              {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
            </div>

            <div className="drawer-identity-meta">
              <h4 className="drawer-identity-name">{admin.name || 'Unnamed Administrator'}</h4>
              <div className="drawer-identity-username">@{admin.username || 'n/a'}</div>
              <div className="drawer-identity-email">{admin.email}</div>
            </div>

            <div className="drawer-badges-row">
              <span className={`badge-role ${isMainAdmin ? 'role-main-admin' : 'role-admin'}`}>
                {isMainAdmin ? 'MAIN ADMIN' : 'ADMIN'}
              </span>

              {isMainAdmin ? (
                <span className="badge-status status-protected">PROTECTED</span>
              ) : (
                <span className={`badge-status ${isActive ? 'status-active' : 'status-inactive'}`}>
                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              )}

              <span className={`badge-access ${isFullAccess ? 'access-full' : 'access-custom'}`}>
                {isFullAccess ? 'FULL ACCESS' : 'CUSTOM ACCESS'}
              </span>
            </div>
          </div>

          {/* Account Metadata */}
          <div className="drawer-section">
            <h5 className="drawer-section-title">ACCOUNT TIMELINE</h5>
            <div className="drawer-info-grid">
              <div className="drawer-info-item">
                <Calendar size={14} className="info-icon" />
                <span className="info-label">Created Date</span>
                <span className="info-value">{formatDate(admin.created_at)}</span>
              </div>
              <div className="drawer-info-item">
                <Clock size={14} className="info-icon" />
                <span className="info-label">Last Login</span>
                <span className="info-value">{formatDate(admin.last_login_at)}</span>
              </div>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="drawer-section">
            <div className="drawer-section-header-flex">
              <h5 className="drawer-section-title">PERMISSIONS MATRIX</h5>
              <span className="drawer-access-tag">
                {isFullAccess ? 'Irrevocable Root Access' : 'Configured Granular Grants'}
              </span>
            </div>

            <div className="drawer-permissions-list">
              {Object.entries(ADMIN_PERMISSIONS).map(([permConstant, permKey]) => {
                const hasGrant = isFullAccess || Boolean(admin[permKey] === 1 || admin.permissions?.[permKey] === 1 || admin.permissions?.[permKey] === true);
                return (
                  <div key={permKey} className={`drawer-perm-row ${hasGrant ? 'granted' : 'denied'}`}>
                    <div className="drawer-perm-icon">
                      {hasGrant ? <Check size={14} /> : <X size={14} />}
                    </div>
                    <div className="drawer-perm-text">
                      <span className="drawer-perm-label">{PERMISSION_LABELS[permKey]}</span>
                      <span className="drawer-perm-key">{permConstant}</span>
                    </div>
                    <span className={`drawer-perm-badge ${hasGrant ? 'badge-granted' : 'badge-denied'}`}>
                      {hasGrant ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drawer Action Bar */}
        <div className="drawer-footer">
          <button
            type="button"
            className="btn-secondary drawer-action-btn"
            onClick={() => onEdit(admin)}
          >
            <Edit size={14} />
            <span>Edit Profile</span>
          </button>

          {!isMainAdmin && (
            <>
              <button
                type="button"
                className="btn-secondary drawer-action-btn"
                onClick={() => onChangePermissions(admin)}
              >
                <Shield size={14} />
                <span>Change Permissions</span>
              </button>

              <button
                type="button"
                className="btn-secondary drawer-action-btn"
                onClick={() => onResetPassword(admin)}
              >
                <KeyRound size={14} />
                <span>Reset Password</span>
              </button>

              {!isSelf && (
                <>
                  <button
                    type="button"
                    className={`btn-secondary drawer-action-btn ${isActive ? 'btn-warn' : 'btn-success'}`}
                    onClick={() => onToggleStatus(admin)}
                  >
                    {isActive ? <Ban size={14} /> : <CheckCircle size={14} />}
                    <span>{isActive ? 'Deactivate Admin' : 'Activate Admin'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn-danger drawer-action-btn"
                    onClick={() => onDelete(admin)}
                  >
                    <Trash2 size={14} />
                    <span>Delete Administrator</span>
                  </button>
                </>
              )}
            </>
          )}

          {isMainAdmin && (
            <div className="drawer-protected-badge-note">
              <Lock size={14} />
              <span>Permanent Main Administrator account is protected from deactivation and deletion.</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default AdminDrawer;
