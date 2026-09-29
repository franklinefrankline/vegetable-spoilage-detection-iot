import React, { useState, useRef, useEffect } from 'react';
import {
  Eye,
  Edit2,
  CheckCircle,
  Ban,
  Trash2,
  MoreVertical,
  Shield,
  UserCheck,
  Clock,
  Mail,
  Fingerprint
} from 'lucide-react';

function UserActionMenu({ user, currentAdmin, onView, onEdit, onActivate, onDeactivate, onDelete, onChangeRole }) {
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
  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="user-action-menu-container" ref={menuRef}>
      <button
        type="button"
        className="action-menu-trigger-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`Actions for ${user.name}`}
        title="More Actions"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className="user-action-dropdown" role="menu">
          <button
            type="button"
            className="action-dropdown-item"
            onClick={() => {
              setIsOpen(false);
              onView(user);
            }}
          >
            <Eye size={14} />
            <span>View Profile</span>
          </button>

          <button
            type="button"
            className="action-dropdown-item"
            onClick={() => {
              setIsOpen(false);
              onEdit(user);
            }}
          >
            <Edit2 size={14} />
            <span>Edit Account</span>
          </button>

          <button
            type="button"
            className="action-dropdown-item"
            onClick={() => {
              setIsOpen(false);
              onChangeRole(user);
            }}
          >
            <Shield size={14} />
            <span>{isAdmin ? 'Demote to User' : 'Promote to Admin'}</span>
          </button>

          {user.is_active === 0 ? (
            <button
              type="button"
              className="action-dropdown-item item-activate"
              onClick={() => {
                setIsOpen(false);
                onActivate(user);
              }}
            >
              <CheckCircle size={14} />
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
            >
              <Ban size={14} />
              <span>Deactivate Account</span>
            </button>
          )}

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
          >
            <Trash2 size={14} />
            <span>Delete Account</span>
          </button>
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
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return iso;
    }
  };

  return (
    <div className="admin-table-container">
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
            <th className="th-user">User</th>
            <th className="th-email">Email</th>
            <th className="th-role">Role</th>
            <th className="th-status">Status</th>
            <th className="th-created">Created</th>
            <th className="th-last-login">Last Login</th>
            <th className="th-actions text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelected = selectedIds.includes(user.id);
            const initials = user.name
              ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
              : 'U';
            const isAdmin = user.role === 'ADMIN';
            const isActive = user.is_active === 1 || user.is_active === undefined;
            const shortId = user.id ? `USR-${user.id.slice(0, 8).toUpperCase()}` : 'USR-000';

            return (
              <tr key={user.id} className={`admin-table-row ${isSelected ? 'row-selected' : ''}`}>
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
                    <div className={`user-table-avatar ${isAdmin ? 'avatar-admin' : ''}`}>
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
                  <span className={`badge-role ${isAdmin ? 'role-admin' : 'role-user'}`}>
                    {isAdmin ? <Shield size={11} className="badge-icon" /> : <UserCheck size={11} className="badge-icon" />}
                    <span>{user.role || 'USER'}</span>
                  </span>
                </td>

                <td className="td-status">
                  <span className={`badge-status ${isActive ? 'status-active' : 'status-inactive'}`}>
                    <span className="status-indicator-dot" />
                    <span>{isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                  </span>
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
                    <button
                      type="button"
                      className="quick-action-btn view-btn"
                      onClick={() => onView(user)}
                      title="View Details"
                      aria-label="View user profile"
                    >
                      <Eye size={15} />
                    </button>

                    <button
                      type="button"
                      className="quick-action-btn edit-btn"
                      onClick={() => onEdit(user)}
                      title="Edit User"
                      aria-label="Edit user account"
                    >
                      <Edit2 size={15} />
                    </button>

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
