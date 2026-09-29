import React, { useState } from 'react';
import { X, KeyRound, Copy, Check, Eye, EyeOff, AlertCircle } from 'lucide-react';

export function ResetPasswordModal({ isOpen, onClose, admin, onSubmit, isSubmitting }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [generatedTemp, setGeneratedTemp] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !admin) return null;

  const handleGenerateRandom = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let temp = '';
    for (let i = 0; i < 14; i++) {
      temp += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // ensure uppercase, lowercase, digit, special
    temp += 'A1!';
    setNewPassword(temp);
    setConfirmPassword(temp);
    setGeneratedTemp(temp);
    setValidationError('');
  };

  const handleCopy = () => {
    if (newPassword) {
      navigator.clipboard.writeText(newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (newPassword.length < 8) {
      setValidationError('Password must be at least 8 characters.');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setValidationError('Password must include uppercase, lowercase, and numbers.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    onSubmit(admin.id, newPassword);
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-modal-header">
          <div className="modal-title-with-icon">
            <div className="modal-icon-badge modal-icon-amber">
              <KeyRound size={20} />
            </div>
            <div>
              <h3 className="modal-title">Reset Administrator Password</h3>
              <p className="modal-subtitle">
                Assign a new secure credential for {admin.name || admin.email}
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

          <div className="reset-notice-card">
            <p>
              Stored passwords are cryptographically hashed using Argon2/bcrypt and cannot be retrieved.
              You may set a new temporary password or generate a random one.
            </p>
            <button
              type="button"
              className="btn-secondary generate-temp-btn"
              onClick={handleGenerateRandom}
            >
              Generate Random Password
            </button>
          </div>

          <div className="form-field-group">
            <label className="form-label" htmlFor="reset-new-password">
              New Password
            </label>
            <div className="form-input-icon-wrap">
              <input
                id="reset-new-password"
                type={showPassword ? 'text' : 'password'}
                className="admin-form-input with-right-btn"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
          </div>

          <div className="form-field-group">
            <label className="form-label" htmlFor="reset-confirm-password">
              Confirm New Password
            </label>
            <input
              id="reset-confirm-password"
              type={showPassword ? 'text' : 'password'}
              className="admin-form-input"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {newPassword && (
            <div className="copy-password-box">
              <button
                type="button"
                className="btn-secondary copy-btn"
                onClick={handleCopy}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied to clipboard' : 'Copy password for administrator'}</span>
              </button>
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
              disabled={isSubmitting || !newPassword}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner spinner-dark" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordModal;
