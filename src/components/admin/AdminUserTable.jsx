import React, { useState, useRef, useEffect } from 'react';
import {
  Eye,
  Edit2,
  CheckCircle,
  Ban,
  Trash2,
  MoreVertical,
  Shield,
  ShieldAlert,
  UserCheck,
  Lock
} from 'lucide-react';

function UserActionMenu({
  user,
  currentAdmin,
  onView,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
  onChangeRole
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

  const isSelf = currentAdmin?.id === user.id;
  const isMain = user.role === 'MAIN_ADMIN';
  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="user-action-menu-container" ref={menuRef}>
      <button
        type="button"
        className={`action-menu-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`More actions for ${user.name}`}
        title="More Actions"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className="user-action-dropdown" role="menu" aria-label="User Options Menu">
          <button
            type="button"
            className="action-dropdown-item"
            onClick={() => {
              setIsOpen(false);
              onView(user);
            }}
            aria-label="View user profile"
          >
            <Eye size={15} />
            <span>View Profile</span>
          </button>

          {!isMain && (
            <button
              type="button"
              className="action-dropdown-item"
              onClick={() => {
                setIsOpen(false);
                onEdit(user);
              }}
              aria-label="Edit user account"
            >
              <Edit2 size={15} />
              <span>Edit Account</span>
            </button>
          )}

          {!isMain && (
            <button
              type="button"
              className="action-dropdown-item"
              onClick={() => {
                setIsOpen(false);
                onChangeRole(user);
              }}
              aria-label="Manage user role and permissions"
            >
              <Shield size={15} />
              <span>{isAdmin ? 'Demote to User' : 'Promote to Admin'}</span>
            </button>
          )}

          {!isMain && (
            user.is_active === 0 ? (
              <button
                type="button"
                className="action-dropdown-item item-activate"
                onClick={() => {
                  setIsOpen(false);
                  onActivate(user);
                }}
                aria-label="Activate user account"
              >
                <CheckCircle size={15} />
                <span>Activate Account</span>
              </button>
            ) : (
              <button
                type="button"
                className="action-dropdown-item item-warning"
                disabled={isSelf}
                title={isSelf ? 'Cannot deactivate your own account' : 'Deactivate user'}
                onClick={() => {
                  setIsOpen(false);
                  onDeactivate(user);
                }}
                aria-label="Deactivate user account"
              >
                <Ban size={15} />
                <span>Deactivate Account</span>
              </button>
            )
          )}

          {isMain ? (
            <div className="action-dropdown-protected">
              <Lock size={13} />
              <span>Protected Account</span>
            </div>
          ) : (
            <>
              <div className="dropdown-separator" />
              <button
                type="button"
                className="action-dropdown-item item-danger"
                disabled={isSelf}
                title={isSelf ? 'Cannot delete your own account' : 'Permanently Delete'}
                onClick={() => {
                  setIsOpen(false);
                  onDelete(user);
                }}
                aria-label="Delete user account"
              >
                <Trash2 size={15} />
                <span>Delete Account</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminUserTable({
  users = [],
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  currentAdmin,
  onView,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
  onChangeRole
}) {
  const allSelected = users.length > 0 && users.every((u) => selectedIds.includes(u.id));

  const formatDateTime = (iso) => {
    if (!iso) return 'Never';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return iso;
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
    } catch (e) {
      return iso;
    }
  };

  return (
    <div className="user-table-container admin-table-container">
      <table className="admin-data-table" aria-label="User Accounts Table">
        <thead>
          <tr>
            <th className="th-checkbox">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                aria-label="Select all users"
                className="admin-checkbox"
              />
            </th>
            <th className="th-user">USER</th>
            <th className="th-email">EMAIL</th>
            <th className="th-role">ROLE</th>
            <th className="th-status">STATUS</th>
            <th className="th-created">CREATED</th>
            <th className="th-last-login">LAST LOGIN</th>
            <th className="th-actions text-right">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelected = selectedIds.includes(user.id);
            const initials = user.name
              ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
              : 'U';
            const isMainAdmin = user.role === 'MAIN_ADMIN';
            const isAdmin = user.role === 'ADMIN';
            const isActive = user.is_active === 1 || user.is_active === undefined;
            const shortId = user.id ? `USR-${user.id.slice(0, 8).toUpperCase()}` : 'USR-000';

            return (
              <tr
                key={user.id}
                className={`admin-table-row ${isSelected ? 'row-selected' : ''} ${isMainAdmin ? 'row-main-admin' : ''}`}
              >
                <td className="td-checkbox">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(user.id)}
                    aria-label={`Select ${user.name}`}
                    className="admin-checkbox"
                  />
                </td>

                <td className="td-user">
                  <div className="user-cell-flex">
                    <div
                      className={`user-table-avatar ${isMainAdmin ? 'avatar-main-admin' : isAdmin ? 'avatar-admin' : ''}`}
                    >
                      {initials}
                    </div>
                    <div className="user-table-meta">
                      <div className="user-table-name" onClick={() => onView(user)}>
                        <span>{user.name}</span>
                        {currentAdmin?.id === user.id && <span className="you-pill">You</span>}
                      </div>
                      <div className="user-table-id" title={user.id}>
                        {shortId}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="td-email">
                  <span className="email-text" title={user.email}>
                    {user.email}
                  </span>
                </td>

                <td className="td-role">
                  <span
                    className={`badge-role ${
                      isMainAdmin ? 'role-main-admin' : isAdmin ? 'role-admin' : 'role-user'
                    }`}
                  >
                    {isMainAdmin ? (
                      <ShieldAlert size={12} className="badge-icon" />
                    ) : isAdmin ? (
                      <Shield size={12} className="badge-icon" />
                    ) : (
                      <UserCheck size={12} className="badge-icon" />
                    )}
                    <span>{isMainAdmin ? 'MAIN ADMIN' : user.role || 'USER'}</span>
                  </span>
                </td>

                <td className="td-status">
                  {isMainAdmin ? (
                    <span className="badge-status status-protected" title="Protected Account - System Root Admin">
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

                <td className="td-created">
                  <span className="date-text">{formatDateTime(user.created_at)}</span>
                </td>

                <td className="td-last-login">
                  <span className="login-text" title={user.last_login_at || 'Never'}>
                    {formatRelativeLogin(user.last_login_at)}
                  </span>
                </td>

                <td className="td-actions text-right">
                  <div className="row-action-buttons">
                    {/* View Button */}
                    <button
                      type="button"
                      className="quick-action-btn view-btn"
                      onClick={() => onView(user)}
                      title="View User"
                      aria-label="View user"
                    >
                      <Eye size={16} />
                    </button>

                    {/* Edit Button (disabled or hidden for protected main admin) */}
                    {isMainAdmin ? (
                      <span className="protected-tag-badge" title="Protected Main Administrator Account">
                        Protected
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="quick-action-btn edit-btn"
                        onClick={() => onEdit(user)}
                        title="Edit User"
                        aria-label="Edit user"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}

                    {/* More Action Menu */}
                    <UserActionMenu
                      user={user}
                      currentAdmin={currentAdmin}
                      onView={onView}
                      onEdit={onEdit}
                      onActivate={onActivate}
                      onDeactivate={onDeactivate}
                      onDelete={onDelete}
                      onChangeRole={onChangeRole}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AdminUserTable;
