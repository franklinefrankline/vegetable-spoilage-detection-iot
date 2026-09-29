import React from 'react';
import {
  Eye,
  Edit,
  Shield,
  Ban,
  CheckCircle,
  Trash2,
  Lock,
  KeyRound
} from 'lucide-react';

export function AdminTable({
  admins = [],
  currentUser,
  onView,
  onEdit,
  onPermissions,
  onToggleStatus,
  onResetPassword,
  onDelete
}) {
  const formatDate = (isoStr) => {
    if (!isoStr) return 'Never';
    try {
      const d = new Date(isoStr);
      const now = new Date();
      const diffMs = now - d;
      if (diffMs < 86400000 && d.getDate() === now.getDate()) {
        return 'Today';
      }
      return d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="admin-table-container">
      <table className="admin-data-table" aria-label="Administrators List">
        <thead>
          <tr>
            <th>ADMIN</th>
            <th>USERNAME</th>
            <th>EMAIL</th>
            <th>ROLE</th>
            <th>STATUS</th>
            <th>ACCESS</th>
            <th>CREATED</th>
            <th>LAST LOGIN</th>
            <th className="actions-header">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {admins.length === 0 ? (
            <tr>
              <td colSpan={9} className="table-empty-td">
                No administrators found matching the filter criteria.
              </td>
            </tr>
          ) : (
            admins.map((admin) => {
              const isMainAdmin = admin.role === 'MAIN_ADMIN';
              const isActive = admin.is_active === 1 || admin.is_active === true;
              const isFullAccess = isMainAdmin || admin.full_access === 1 || admin.full_access === true;
              const isSelf = currentUser?.id === admin.id;

              return (
                <tr key={admin.id} className={isMainAdmin ? 'row-main-admin' : ''}>
                  {/* ADMIN */}
                  <td>
                    <div className="admin-name-cell">
                      <div className={`table-avatar ${isMainAdmin ? 'avatar-main-admin' : 'avatar-admin'}`}>
                        {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div className="table-name-meta">
                        <strong className="user-name-text">{admin.name || 'Unnamed'}</strong>
                        {isSelf && <span className="current-user-tag">(You)</span>}
                      </div>
                    </div>
                  </td>

                  {/* USERNAME */}
                  <td>
                    <span className="monospace-text username-text">
                      @{admin.username || 'n/a'}
                    </span>
                  </td>

                  {/* EMAIL */}
                  <td>
                    <span className="monospace-text email-text">
                      {admin.email}
                    </span>
                  </td>

                  {/* ROLE */}
                  <td>
                    <span className={`badge-role ${isMainAdmin ? 'role-main-admin' : 'role-admin'}`}>
                      {isMainAdmin ? 'MAIN ADMIN' : 'ADMIN'}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td>
                    {isMainAdmin ? (
                      <span className="badge-status status-protected">
                        PROTECTED
                      </span>
                    ) : (
                      <span className={`badge-status ${isActive ? 'status-active' : 'status-inactive'}`}>
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    )}
                  </td>

                  {/* ACCESS */}
                  <td>
                    <span className={`badge-access ${isFullAccess ? 'access-full' : 'access-custom'}`}>
                      {isFullAccess ? 'FULL ACCESS' : 'CUSTOM ACCESS'}
                    </span>
                  </td>

                  {/* CREATED */}
                  <td>
                    <span className="date-text">{formatDate(admin.created_at)}</span>
                  </td>

                  {/* LAST LOGIN */}
                  <td>
                    <span className="date-text">{formatDate(admin.last_login_at)}</span>
                  </td>

                  {/* ACTIONS */}
                  <td className="actions-cell">
                    <div className="action-buttons-group">
                      {/* View */}
                      <button
                        type="button"
                        className="action-icon-btn"
                        onClick={() => onView(admin)}
                        title="View Administrator Details"
                      >
                        <Eye size={15} />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        className="action-icon-btn"
                        onClick={() => onEdit(admin)}
                        title="Edit Administrator"
                      >
                        <Edit size={15} />
                      </button>

                      {/* Permissions */}
                      <button
                        type="button"
                        className="action-icon-btn"
                        onClick={() => onPermissions(admin)}
                        title="Configure Permissions"
                      >
                        <Shield size={15} />
                      </button>

                      {/* Reset Password */}
                      {!isMainAdmin && (
                        <button
                          type="button"
                          className="action-icon-btn"
                          onClick={() => onResetPassword(admin)}
                          title="Reset Password"
                        >
                          <KeyRound size={15} />
                        </button>
                      )}

                      {/* Deactivate / Activate */}
                      {!isMainAdmin && !isSelf && (
                        <button
                          type="button"
                          className={`action-icon-btn ${isActive ? 'btn-icon-warn' : 'btn-icon-success'}`}
                          onClick={() => onToggleStatus(admin)}
                          title={isActive ? 'Deactivate Administrator' : 'Activate Administrator'}
                        >
                          {isActive ? <Ban size={15} /> : <CheckCircle size={15} />}
                        </button>
                      )}

                      {/* Delete */}
                      {!isMainAdmin && !isSelf && (
                        <button
                          type="button"
                          className="action-icon-btn btn-icon-danger"
                          onClick={() => onDelete(admin)}
                          title="Delete Administrator"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}

                      {/* Main Admin Protected Indicator */}
                      {isMainAdmin && (
                        <span className="protected-lock-indicator" title="Permanent Protected Account">
                          <Lock size={14} />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AdminTable;
