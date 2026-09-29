import React, { useState } from 'react';
import { X, Shield, Lock, User, Mail, AtSign, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { ADMIN_PERMISSIONS, PERMISSION_LABELS } from '../../utils/adminPermissions';

export function CreateAdminModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    is_active: 1,
    full_access: false,
    permissions: {
      user_management: true,
      admin_management: false,
      device_management: true,
      storage_management: true,
      sensor_monitoring: true,
      spoilage_monitoring: true,
      alert_management: true,
      analytics: true,
      reports: true,
      system_settings: false,
      audit_logs: true
    }
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  // Calculate password strength
  const calculateStrength = (pwd) => {
    let score = 0;
    if (!pwd) return { score: 0, text: 'Empty', color: 'var(--text-muted)' };
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    switch (score) {
      case 5:
        return { score, text: 'Strong', color: 'var(--accent-emerald)' };
      case 4:
        return { score, text: 'Good', color: 'var(--accent-blue)' };
      case 3:
        return { score, text: 'Fair', color: 'var(--accent-amber)' };
      default:
        return { score, text: 'Weak', color: 'var(--accent-red)' };
    }
  };

  const strength = calculateStrength(formData.password);

  const handleFullAccessToggle = (e) => {
    const checked = e.target.checked;
    setFormData((prev) => {
      const updatedPerms = { ...prev.permissions };
      Object.keys(updatedPerms).forEach((key) => {
        updatedPerms[key] = checked;
      });
      return {
        ...prev,
        full_access: checked,
        permissions: updatedPerms
      };
    });
  };

  const handlePermissionToggle = (key) => {
    setFormData((prev) => {
      const updated = {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      };
      // If all are true, full_access is true; if any is false, full_access is false
      const allTrue = Object.values(updated).every(Boolean);
      return {
        ...prev,
        permissions: updated,
        full_access: allTrue
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!formData.name.trim()) {
      setValidationError('Please enter full name.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    // Auto-generate or sanitize username to lowercase alphanumeric + underscore
    let cleanUsername = String(formData.username || formData.email.split('@')[0] || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');

    if (cleanUsername.length < 3) {
      cleanUsername = (cleanUsername + '_adm').slice(0, 20);
    }

    if (!formData.password || formData.password.length < 8) {
      setValidationError('Password must be at least 8 characters.');
      return;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setValidationError('Password must contain at least one uppercase letter.');
      return;
    }
    if (!/[a-z]/.test(formData.password)) {
      setValidationError('Password must contain at least one lowercase letter.');
      return;
    }
    if (!/[0-9]/.test(formData.password)) {
      setValidationError('Password must contain at least one number.');
      return;
    }
    if (!/[^A-Za-z0-9]/.test(formData.password)) {
      setValidationError('Password must contain at least one special character (!@#$%^&*).');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      username: cleanUsername,
      email: formData.email.trim(),
      password: formData.password,
      confirm_password: formData.confirmPassword,
      confirmPassword: formData.confirmPassword,
      is_active: formData.is_active,
      status: formData.is_active ? 'ACTIVE' : 'INACTIVE',
      full_access: formData.full_access,
      permissions: formData.permissions
    });
  };

  const handleEmailChange = (val) => {
    setFormData((prev) => {
      const emailPrefix = val.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '_') || '';
      const shouldAuto = !prev.username || prev.username === prev._autoUser;
      return {
        ...prev,
        email: val,
        username: shouldAuto && emailPrefix ? emailPrefix : prev.username,
        _autoUser: emailPrefix
      };
    });
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-container admin-modal-wide" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="admin-modal-header">
          <div className="modal-title-with-icon">
            <div className="modal-icon-badge modal-icon-purple">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="modal-title">Create Administrator</h3>
              <p className="modal-subtitle">Provision an authorized administrative account with granular permissions</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} disabled={isSubmitting}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} noValidate className="admin-modal-body">
          {validationError && (
            <div className="admin-form-alert error">
              <AlertCircle size={16} />
              <span>{validationError}</span>
            </div>
          )}

          {/* Account Profile Fields */}
          <div className="form-grid-2">
            <div className="form-field-group">
              <label className="form-label" htmlFor="admin-create-name">
                Full Name <span className="required">*</span>
              </label>
              <div className="form-input-icon-wrap">
                <User size={16} className="input-icon" />
                <input
                  id="admin-create-name"
                  type="text"
                  className="admin-form-input with-icon"
                  placeholder="e.g. Eleanor Vance"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-field-group">
              <label className="form-label" htmlFor="admin-create-username">
                Username <span className="optional-tag">(optional)</span>
              </label>
              <div className="form-input-icon-wrap">
                <AtSign size={16} className="input-icon" />
                <input
                  id="admin-create-username"
                  type="text"
                  className="admin-form-input with-icon"
                  placeholder="e.g. eleanor_admin"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-field-group">
              <label className="form-label" htmlFor="admin-create-email">
                Email Address <span className="required">*</span>
              </label>
              <div className="form-input-icon-wrap">
                <Mail size={16} className="input-icon" />
                <input
                  id="admin-create-email"
                  type="email"
                  className="admin-form-input with-icon"
                  placeholder="e.g. eleanor@vegsense.org"
                  value={formData.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-field-group">
              <label className="form-label" htmlFor="admin-create-status">
                Initial Account Status
              </label>
              <select
                id="admin-create-status"
                className="admin-form-input"
                value={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: parseInt(e.target.value, 10) })}
                disabled={isSubmitting}
              >
                <option value={1}>ACTIVE - Immediate Login Permitted</option>
                <option value={0}>INACTIVE - Suspended / Pending Approval</option>
              </select>
            </div>
          </div>

          {/* Password Fields */}
          <div className="form-grid-2">
            <div className="form-field-group">
              <label className="form-label" htmlFor="admin-create-password">
                Password <span className="required">*</span>
              </label>
              <div className="form-input-icon-wrap">
                <Lock size={16} className="input-icon" />
                <input
                  id="admin-create-password"
                  type={showPassword ? 'text' : 'password'}
                  className="admin-form-input with-icon with-right-btn"
                  placeholder="At least 8 chars (Aa-Zz, 0-9, !@#)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="input-right-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="password-strength-meter">
                  <div className="strength-bar-track">
                    <div
                      className="strength-bar-fill"
                      style={{
                        width: `${(strength.score / 5) * 100}%`,
                        backgroundColor: strength.color
                      }}
                    />
                  </div>
                  <div className="strength-label" style={{ color: strength.color }}>
                    Strength: {strength.text}
                  </div>
                </div>
              )}
            </div>

            <div className="form-field-group">
              <label className="form-label" htmlFor="admin-create-confirm-password">
                Confirm Password <span className="required">*</span>
              </label>
              <div className="form-input-icon-wrap">
                <Lock size={16} className="input-icon" />
                <input
                  id="admin-create-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="admin-form-input with-icon with-right-btn"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="input-right-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Permissions Section */}
          <div className="permissions-setup-block">
            <div className="permissions-header-row">
              <div>
                <h4 className="permissions-section-title">Administrative Permissions</h4>
                <p className="permissions-section-desc">
                  Configure operational module access granted to this administrator
                </p>
              </div>

              <label className="full-access-toggle-label">
                <input
                  type="checkbox"
                  className="admin-checkbox"
                  checked={formData.full_access}
                  onChange={handleFullAccessToggle}
                  disabled={isSubmitting}
                />
                <span className="full-access-text">FULL ACCESS</span>
              </label>
            </div>

            <div className="permissions-grid">
              {Object.entries(ADMIN_PERMISSIONS).map(([permConstant, permKey]) => {
                const isChecked = formData.full_access || Boolean(formData.permissions[permKey]);
                return (
                  <label key={permKey} className={`permission-card ${isChecked ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      className="admin-checkbox"
                      checked={isChecked}
                      onChange={() => handlePermissionToggle(permKey)}
                      disabled={isSubmitting || formData.full_access}
                    />
                    <span className="permission-card-label">{PERMISSION_LABELS[permKey]}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Modal Footer Buttons */}
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
              className="btn-primary create-admin-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner spinner-dark" />
                  <span>Creating Administrator...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Create Administrator</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateAdminModal;
