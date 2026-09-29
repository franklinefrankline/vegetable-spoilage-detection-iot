import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  UserCheck,
  Eye,
  Edit2,
  MoreVertical,
  Trash2,
  Ban,
  CheckCircle,
  Lock
} from 'lucide-react';

function MobileCardActionMenu({
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
    <div className="mobile-action-menu-anchor" ref={menuRef}>
      <button
        type="button"
        className={`btn-card-action card-menu-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`More actions for ${user.name}`}
        title="More Actions"
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && (
        <div className="mobile-card-dropdown" role="menu" aria-label="Mobile User Actions">
          <button
            type="button"
            className="action-dropdown-item"
            onClick={() => {
              setIsOpen(false);
              onView(user);
            }}
            aria-label="View user profile"
          >
            <Eye size={16} />
            <span>View User</span>
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
              <Edit2 size={16} />
              <span>Edit User</span>
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
              aria-label="Manage permissions"
            >
              <Shield size={16} />
              <span>Manage Permissions</span>
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
                <CheckCircle size={16} />
                <span>Activate User</span>
              </button>
            ) : (
              <button
                type="button"
                className="action-dropdown-item item-warning"
                disabled={isSelf}
                title={isSelf ? 'Cannot deactivate yourself' : 'Deactivate user'}
                onClick={() => {
                  setIsOpen(false);
                  onDeactivate(user);
                }}
                aria-label="Deactivate user account"
              >
                <Ban size={16} />
                <span>Deactivate User</span>
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
                title={isSelf ? 'Cannot delete yourself' : 'Delete user'}
                onClick={() => {
                  setIsOpen(false);
                  onDelete(user);
                }}
                aria-label="Delete user account"
              >
                <Trash2 size={16} />
                <span>Delete Account</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminUserCard({
  user,
  isSelected,
  onToggleSelect,
  currentAdmin,
  onView,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
  onChangeRole
}) {
  const isMainAdmin = user.role === 'MAIN_ADMIN';
  const isAdmin = user.role === 'ADMIN';
  const isActive = user.is_active === 1 || user.is_active === undefined;
  const isSelf = currentAdmin?.id === user.id;
  const shortId = user.id ? `USR-${user.id.slice(0, 8).toUpperCase()}` : 'USR-000';

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const formatShortDate = (iso) => {
    if (!iso) return 'Never';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
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
    <div className={`admin-user-card ${isSelected ? 'selected' : ''} ${isMainAdmin ? 'card-main-admin' : ''}`}>
      {/* Header Row: Checkbox, Avatar, Name & ID */}
      <div className="card-top-row">
        <div className="card-user-info">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(user.id)}
            className="admin-checkbox card-checkbox"
            aria-label={`Select ${user.name}`}
          />
          <div
            className={`user-card-avatar ${
              isMainAdmin ? 'avatar-main-admin' : isAdmin ? 'avatar-admin' : ''
            }`}
          >
            {initials}
          </div>
          <div className="user-card-text">
            <div className="user-card-name" onClick={() => onView(user)}>
              <span>{user.name}</span>
              {isSelf && <span className="you-pill">You</span>}
            </div>
            <div className="user-card-email" title={user.email}>{user.email}</div>
            <div className="user-card-id">{shortId}</div>
          </div>
        </div>
      </div>

      {/* Badges Row: Role and Status */}
      <div className="card-badges-row">
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

        {isMainAdmin ? (
          <span className="badge-status status-protected" title="Root Administrator Account">
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

      {/* Info Grid: Created & Last Login */}
      <div className="card-info-grid">
        <div className="info-grid-item">
          <span className="info-label">Created</span>
          <span className="info-val">{formatShortDate(user.created_at)}</span>
        </div>
        <div className="info-grid-item">
          <span className="info-label">Last Login</span>
          <span className="info-val">{formatRelativeLogin(user.last_login_at)}</span>
        </div>
      </div>

      {/* Action Bar: [ View ] [ Edit ] [ ⋮ ] (44x44px Touch Targets) */}
      <div className="card-action-bar">
        <button
          type="button"
          className="btn-card-action btn-view"
          onClick={() => onView(user)}
          title="View User"
          aria-label="View user"
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
            onClick={() => onEdit(user)}
            title="Edit User"
            aria-label="Edit user"
          >
            <Edit2 size={16} />
            <span>Edit</span>
          </button>
        )}

        <MobileCardActionMenu
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
    </div>
  );
}

export default AdminUserCard;
