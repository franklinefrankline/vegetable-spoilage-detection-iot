import React, { useState } from 'react';
import { X, Save, AlertCircle, Shield, User, Mail, Activity } from 'lucide-react';

export function AdminUserEditModal({ user, onClose, onSave, isSubmitting }) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [role, setRole] = useState(user?.role || 'USER');
  const [isActive, setIsActive] = useState(user?.is_active === 1 || user?.is_active === undefined);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || name.trim().length < 2) {
      setError('Full name must be at least 2 characters long.');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    onSave({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      is_active: isActive ? 1 : 0
    });
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="admin-modal-title">Edit User Account</div>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-modal-form">
          {error && (
            <div className="admin-form-alert error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="edit-name">
              <User size={14} />
              <span>Full Name</span>
            </label>
            <input
              id="edit-name"
              type="text"
              className="admin-input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Aris Thorne"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-email">
              <Mail size={14} />
              <span>Email Address</span>
            </label>
            <input
              id="edit-email"
              type="email"
              className="admin-input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@vegsense.io"
              required
            />
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label" htmlFor="edit-role">
                <Shield size={14} />
                <span>Account Role</span>
              </label>
              <select
                id="edit-role"
                className="admin-select-field"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="USER">USER (Standard Access)</option>
                <option value="ADMIN">ADMIN (Full Authority)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-status">
                <Activity size={14} />
                <span>Access Status</span>
              </label>
              <select
                id="edit-status"
                className="admin-select-field"
                value={isActive ? 'ACTIVE' : 'INACTIVE'}
                onChange={(e) => setIsActive(e.target.value === 'ACTIVE')}
              >
                <option value="ACTIVE">ACTIVE (Authorized)</option>
                <option value="INACTIVE">INACTIVE (Deactivated)</option>
              </select>
            </div>
          </div>

          <div className="admin-modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner spinner-dark" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminUserEditModal;
