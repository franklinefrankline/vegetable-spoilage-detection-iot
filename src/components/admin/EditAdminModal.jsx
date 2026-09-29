import React, { useState, useEffect } from 'react';
import { X, Shield, User, Mail, AtSign, Check, AlertCircle } from 'lucide-react';

export function EditAdminModal({ isOpen, onClose, admin, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    is_active: 1
  });
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (admin) {
      setFormData({
        name: admin.name || '',
        username: admin.username || '',
        email: admin.email || '',
        is_active: admin.is_active === 0 ? 0 : 1
      });
      setValidationError('');
    }
  }, [admin]);

  if (!isOpen || !admin) return null;

  const isMainAdminAccount = admin.role === 'MAIN_ADMIN';

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!formData.name.trim()) {
      setValidationError('Please enter full name.');
      return;
    }
    if (!formData.username.trim() || formData.username.length < 3) {
      setValidationError('Username must be at least 3 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(formData.username)) {
      setValidationError('Username may only contain letters, numbers, underscores, dashes, and periods.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      username: formData.username.trim(),
      email: formData.email.trim(),
      is_active: isMainAdminAccount ? 1 : formData.is_active
    });
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-modal-header">
          <div className="modal-title-with-icon">
            <div className="modal-icon-badge modal-icon-purple">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="modal-title">Edit Administrator Profile</h3>
              <p className="modal-subtitle">
                {isMainAdminAccount
                  ? 'Main Administrator account (Protected system credentials)'
                  : `Update profile for ${admin.name || admin.email}`}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} disabled={isSubmitting}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="admin-modal-body">
          {validationError && (
            <div className="form-error-alert">
              <AlertCircle size={16} />
              <span>{validationError}</span>
            </div>
          )}

          <div className="form-field-group">
            <label className="form-label" htmlFor="edit-admin-name">
              Full Name <span className="required">*</span>
            </label>
            <div className="form-input-icon-wrap">
              <User size={16} className="input-icon" />
              <input
                id="edit-admin-name"
                type="text"
                className="admin-form-input with-icon"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-field-group">
            <label className="form-label" htmlFor="edit-admin-username">
              Username <span className="required">*</span>
            </label>
            <div className="form-input-icon-wrap">
              <AtSign size={16} className="input-icon" />
              <input
                id="edit-admin-username"
                type="text"
                className="admin-form-input with-icon"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-field-group">
            <label className="form-label" htmlFor="edit-admin-email">
              Email Address <span className="required">*</span>
            </label>
            <div className="form-input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input
                id="edit-admin-email"
                type="email"
                className="admin-form-input with-icon"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {!isMainAdminAccount && (
            <div className="form-field-group">
              <label className="form-label" htmlFor="edit-admin-status">
                Account Status
              </label>
              <select
                id="edit-admin-status"
                className="admin-form-input"
                value={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: parseInt(e.target.value, 10) })}
                disabled={isSubmitting}
              >
                <option value={1}>ACTIVE - Normal Administrative Access</option>
                <option value={0}>INACTIVE - Deactivated / Login Blocked</option>
              </select>
            </div>
          )}

          {isMainAdminAccount && (
            <div className="protected-account-callout">
              <Shield size={16} />
              <span>Main Administrator is permanent and cannot be deactivated or demoted.</span>
            </div>
          )}

          {/* Footer */}
          <div className="admin-modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner spinner-dark" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditAdminModal;
