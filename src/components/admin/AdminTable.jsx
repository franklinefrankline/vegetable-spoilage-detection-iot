import React, { useState, useRef, useEffect } from 'react';
import {
  Eye,
  Edit2,
  Shield,
  Ban,
  CheckCircle,
  Trash2,
  Lock,
  KeyRound,
  MoreVertical,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

function AdminActionDropdown({
  admin,
  currentUser,
  onView,
  onEdit,
  onPermissions,
  onToggleStatus,
  onResetPassword,
  onDelete
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const isMainAdmin = admin.role === 'MAIN_ADMIN';
  const isActive = admin.is_active === 1 || admin.is_active === true;
  const isSelf = currentUser?.id === admin.id;

  return (
    <div className="user-action-menu-container" ref={menuRef}>
      <button
        type="button"
        className={`action-menu-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`More actions for administrator ${admin.name || admin.username}`}
        title="More Actions"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className="user-action-dropdown" role="menu" aria-label="Administrator Actions Menu">
          <button
            type="button"
            className="action-dropdown-item"
            onClick={() => {
              setIsOpen(false);
              onView(admin);
            }}
            aria-label="View administrator profile"
          >
            <Eye size={15} />
            <span>View Details</span>
          </button>

          <button
            type="button"
            className="action-dropdown-item"
            onClick={() => {
              setIsOpen(false);
              onEdit(admin);
            }}
            aria-label="Edit administrator profile"
          >
            <Edit2 size={15} />
            <span>Edit Profile</span>
          </button>

          <button
            type="button"
            className="action-dropdown-item"
            onClick={() => {
              setIsOpen(false);
              onPermissions(admin);
            }}
            aria-label="Manage administrator permissions"
          >
            <Shield size={15} />
            <span>Permissions</span>
          </button>

          {!isMainAdmin && (
            <button
              type="button"
              className="action-dropdown-item"
              onClick={() => {
                setIsOpen(false);
                onResetPassword(admin);
              }}
              aria-label="Reset administrator password"
            >
              <KeyRound size={15} />
              <span>Reset Password</span>
            </button>
          )}

          {!isMainAdmin && !isSelf && (
            <button
              type="button"
              className={`action-dropdown-item ${isActive ? 'item-warning' : 'item-activate'}`}
              onClick={() => {
                setIsOpen(false);
                onToggleStatus(admin);
              }}
              aria-label={isActive ? 'Deactivate administrator' : 'Activate administrator'}
            >
              {isActive ? <Ban size={15} /> : <CheckCircle size={15} />}
              <span>{isActive ? 'Deactivate Account' : 'Activate Account'}</span>
            </button>
          )}

          {isMainAdmin ? (
            <div className="action-dropdown-protected">
              <Lock size={13} />
              <span>Protected Account</span>
            </div>
          ) : (
            !isSelf && (
              <>
                <div className="dropdown-separator" />
                <button
                  type="button"
                  className="action-dropdown-item item-danger"
                  onClick={() => {
                    setIsOpen(false);
                    onDelete(admin);
                  }}
                  aria-label="Delete administrator"
                >
                  <Trash2 size={15} />
                  <span>Delete Account</span>
                </button>
              </>
            )
          )}
        </div>
      )}
    </div>
  );
}

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

  const formatRelativeLogin = (iso) => {
    if (!iso) return 'Never';
    try {
      const d = new Date(iso);
      const diffMinutes = Math.floor((Date.now() - d.getTime()) / 60000);
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <>
      {/* Desktop Enterprise Admin Table */}
      <div className="desktop-admin-table-wrap user-table-container admin-table-container">
        <table className="admin-data-table" aria-label="Administrators List">
          <thead>
            <tr>
              <th>ADMIN</th>
              <th>USERNAME</th>
              <th>EMAIL</th>
              <th>ROLE</th>
              <th>STATUS</th>
              <th>ACCESS</th>
              <th className="th-created">CREATED</th>
              <th className="th-last-login">LAST LOGIN</th>
              <th className="actions-header text-right">ACTIONS</th>
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
                        <div className={`user-table-avatar ${isMainAdmin ? 'avatar-main-admin' : 'avatar-admin'}`}>
                          {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div className="table-name-meta">
                          <strong className="user-table-name" onClick={() => onView(admin)}>
                            {admin.name || 'Unnamed'}
                          </strong>
                          {isSelf && <span className="you-pill">You</span>}
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
                      <span className="email-text" title={admin.email}>
                        {admin.email}
                      </span>
                    </td>

                    {/* ROLE */}
                    <td>
                      <span className={`badge-role ${isMainAdmin ? 'role-main-admin' : 'role-admin'}`}>
                        {isMainAdmin ? <ShieldAlert size={12} className="badge-icon" /> : <Shield size={12} className="badge-icon" />}
                        <span>{isMainAdmin ? 'MAIN ADMIN' : 'ADMIN'}</span>
                      </span>
                    </td>

                    {/* STATUS */}
                    <td>
                      {isMainAdmin ? (
                        <span className="badge-status status-protected" title="Protected Account">
                          <Lock size={11} className="badge-icon" />
                          <span>PROTECTED</span>
                        </span>
                      ) : (
                        <span className={`badge-status ${isActive ? 'status-active' : 'status-inactive'}`}>
                          <span className="status-indicator-dot" />
                          <span>{isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                        </span>
                      )}
                    </td>

                    {/* ACCESS */}
                    <td>
                      <span className={`badge-access ${isFullAccess ? 'access-full' : 'access-custom'}`}>
                        {isFullAccess ? <ShieldCheck size={11} /> : <Shield size={11} />}
                        <span>{isFullAccess ? 'FULL ACCESS' : 'CUSTOM ACCESS'}</span>
                      </span>
                    </td>

                    {/* CREATED */}
                    <td className="td-created">
                      <span className="date-text">{formatDate(admin.created_at)}</span>
                    </td>

                    {/* LAST LOGIN */}
                    <td className="td-last-login">
                      <span className="date-text">{formatRelativeLogin(admin.last_login_at)}</span>
                    </td>

                    {/* ACTIONS */}
                    <td className="actions-cell text-right">
                      <div className="row-action-buttons">
                        <button
                          type="button"
                          className="quick-action-btn view-btn"
                          onClick={() => onView(admin)}
                          title="View Administrator Details"
                          aria-label="View administrator details"
                        >
                          <Eye size={16} />
                        </button>

                        {isMainAdmin ? (
                          <span className="protected-tag-badge" title="Protected Main Administrator">
                            Protected
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="quick-action-btn edit-btn"
                            onClick={() => onEdit(admin)}
                            title="Edit Administrator"
                            aria-label="Edit administrator"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}

                        <AdminActionDropdown
                          admin={admin}
                          currentUser={currentUser}
                          onView={onView}
                          onEdit={onEdit}
                          onPermissions={onPermissions}
                          onToggleStatus={onToggleStatus}
                          onResetPassword={onResetPassword}
                          onDelete={onDelete}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Administrator Cards */}
      <div className="mobile-admin-cards-wrap">
        {admins.map((admin) => {
          const isMainAdmin = admin.role === 'MAIN_ADMIN';
          const isActive = admin.is_active === 1 || admin.is_active === true;
          const isFullAccess = isMainAdmin || admin.full_access === 1 || admin.full_access === true;
          const isSelf = currentUser?.id === admin.id;

          return (
            <div
              key={admin.id}
              className={`admin-user-card ${isMainAdmin ? 'card-main-admin' : ''}`}
            >
              <div className="card-top-row">
                <div className="card-user-info">
                  <div
                    className={`user-card-avatar ${isMainAdmin ? 'avatar-main-admin' : 'avatar-admin'}`}
                  >
                    {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="user-card-text">
                    <div className="user-card-name" onClick={() => onView(admin)}>
                      <span>{admin.name || 'Unnamed'}</span>
                      {isSelf && <span className="you-pill">You</span>}
                    </div>
                    <div className="user-card-email" title={admin.email}>{admin.email}</div>
                    <div className="user-card-id">@{admin.username || 'n/a'}</div>
                  </div>
                </div>
              </div>

              <div className="card-badges-row">
                <span className={`badge-role ${isMainAdmin ? 'role-main-admin' : 'role-admin'}`}>
                  {isMainAdmin ? <ShieldAlert size={12} className="badge-icon" /> : <Shield size={12} className="badge-icon" />}
                  <span>{isMainAdmin ? 'MAIN ADMIN' : 'ADMIN'}</span>
                </span>

                <span className={`badge-access ${isFullAccess ? 'access-full' : 'access-custom'}`}>
                  <span>{isFullAccess ? 'FULL ACCESS' : 'CUSTOM ACCESS'}</span>
                </span>

                {isMainAdmin ? (
                  <span className="badge-status status-protected" title="Protected Account">
                    <Lock size={11} className="badge-icon" />
                    <span>PROTECTED</span>
                  </span>
                ) : (
                  <span className={`badge-status ${isActive ? 'status-active' : 'status-inactive'}`}>
                    <span className="status-indicator-dot" />
                    <span>{isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                  </span>
                )}
              </div>

              <div className="card-info-grid">
                <div className="info-grid-item">
                  <span className="info-label">Created</span>
                  <span className="info-val">{formatDate(admin.created_at)}</span>
                </div>
                <div className="info-grid-item">
                  <span className="info-label">Last Login</span>
                  <span className="info-val">{formatRelativeLogin(admin.last_login_at)}</span>
                </div>
              </div>

              <div className="card-action-bar">
                <button
                  type="button"
                  className="btn-card-action btn-view"
                  onClick={() => onView(admin)}
                  title="View Administrator"
                  aria-label="View administrator"
                >
                  <Eye size={16} />
                  <span>View</span>
                </button>

                {isMainAdmin ? (
                  <div className="btn-card-action btn-protected-pill">
                    <Lock size={14} />
                    <span>Protected Account</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-card-action btn-edit"
                    onClick={() => onEdit(admin)}
                    title="Edit Administrator"
                    aria-label="Edit administrator"
                  >
                    <Edit2 size={16} />
                    <span>Edit</span>
                  </button>
                )}

                <AdminActionDropdown
                  admin={admin}
                  currentUser={currentUser}
                  onView={onView}
                  onEdit={onEdit}
                  onPermissions={onPermissions}
                  onToggleStatus={onToggleStatus}
                  onResetPassword={onResetPassword}
                  onDelete={onDelete}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default AdminTable;
