import React from 'react';
import { Shield, UserCheck, Eye, Edit2, MoreVertical, Trash2, Ban, CheckCircle } from 'lucide-react';

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
  const isAdmin = user.role === 'ADMIN';
  const isActive = user.is_active === 1 || user.is_active === undefined;
  const isSelf = currentAdmin?.id === user.id;

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const formatShortDate = (iso) => {
    if (!iso) return 'Never';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return iso;
    }
  };

  return (
    <div className={`admin-user-card ${isSelected ? 'selected' : ''}`}>
      <div className="card-top-row">
        <div className="card-user-info">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(user.id)}
            className="admin-checkbox card-checkbox"
            aria-label={`Select ${user.name}`}
          />
          <div className={`user-card-avatar ${isAdmin ? 'avatar-admin' : ''}`}>
            {initials}
          </div>
          <div className="user-card-text">
            <div className="user-card-name">
              <span>{user.name}</span>
              {isSelf && <span className="you-pill">You</span>}
            </div>
            <div className="user-card-email">{user.email}</div>
          </div>
        </div>
      </div>

      <div className="card-badges-row">
        <span className={`badge-role ${isAdmin ? 'role-admin' : 'role-user'}`}>
          {isAdmin ? <Shield size={11} className="badge-icon" /> : <UserCheck size={11} className="badge-icon" />}
          <span>{user.role || 'USER'}</span>
        </span>

        <span className={`badge-status ${isActive ? 'status-active' : 'status-inactive'}`}>
          <span className="status-indicator-dot" />
          <span>{isActive ? 'ACTIVE' : 'INACTIVE'}</span>
        </span>
      </div>

      <div className="card-info-grid">
        <div className="info-grid-item">
          <span className="info-label">Created:</span>
          <span className="info-val">{formatShortDate(user.created_at)}</span>
        </div>
        <div className="info-grid-item">
          <span className="info-label">Last Login:</span>
          <span className="info-val">{formatShortDate(user.last_login_at)}</span>
        </div>
      </div>

      <div className="card-action-bar">
        <button
          type="button"
          className="btn-card-action btn-view"
          onClick={() => onView(user)}
          title="View User Details"
        >
          <Eye size={14} />
          <span>View</span>
        </button>

        <button
          type="button"
          className="btn-card-action btn-edit"
          onClick={() => onEdit(user)}
          title="Edit User"
        >
          <Edit2 size={14} />
          <span>Edit</span>
        </button>

        {isActive ? (
          <button
            type="button"
            className="btn-card-action btn-deactivate"
            disabled={isSelf}
            onClick={() => onDeactivate(user)}
            title={isSelf ? 'Cannot deactivate yourself' : 'Deactivate user'}
          >
            <Ban size={14} />
            <span>Deactivate</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn-card-action btn-activate"
            onClick={() => onActivate(user)}
            title="Activate user"
          >
            <CheckCircle size={14} />
            <span>Activate</span>
          </button>
        )}

        <button
          type="button"
          className="btn-card-action btn-delete"
          disabled={isSelf}
          onClick={() => onDelete(user)}
          title={isSelf ? 'Cannot delete yourself' : 'Delete user'}
        >
          <Trash2 size={14} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}

export default AdminUserCard;
