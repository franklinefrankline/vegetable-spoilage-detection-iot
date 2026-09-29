import React, { useState, useEffect } from 'react';
import { X, Shield, Check, Lock, ShieldCheck } from 'lucide-react';
import { ADMIN_PERMISSIONS, PERMISSION_LABELS } from '../../utils/adminPermissions';

export function PermissionEditor({ isOpen, onClose, admin, onSave, isSubmitting }) {
  const [fullAccess, setFullAccess] = useState(false);
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    if (admin) {
      const p = admin.permissions || {};
      const isFull = admin.role === 'MAIN_ADMIN' || p.full_access === 1 || p.full_access === true;
      setFullAccess(isFull);

      const initialPerms = {};
      Object.values(ADMIN_PERMISSIONS).forEach((key) => {
        initialPerms[key] = isFull || Boolean(p[key] === 1 || p[key] === true);
      });
      setPermissions(initialPerms);
    }
  }, [admin]);

  if (!isOpen || !admin) return null;

  const isMainAdmin = admin.role === 'MAIN_ADMIN';

  const handleFullAccessToggle = (e) => {
    const checked = e.target.checked;
    setFullAccess(checked);
    const updated = {};
    Object.values(ADMIN_PERMISSIONS).forEach((key) => {
      updated[key] = checked;
    });
    setPermissions(updated);
  };

  const handleToggleSingle = (key) => {
    setPermissions((prev) => {
      const updated = {
        ...prev,
        [key]: !prev[key]
      };
      const allChecked = Object.values(updated).every(Boolean);
      setFullAccess(allChecked);
      return updated;
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSave({
      full_access: fullAccess,
      ...permissions
    });
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-container admin-modal-wide" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-modal-header">
          <div className="modal-title-with-icon">
            <div className="modal-icon-badge modal-icon-purple">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="modal-title">Administrative Permissions</h3>
              <p className="modal-subtitle">
                Configure operational authorizations for {admin.name || admin.email}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} disabled={isSubmitting}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleFormSubmit} className="admin-modal-body">
          {isMainAdmin ? (
            <div className="protected-account-callout">
              <Lock size={18} />
              <div>
                <strong>Main Administrator – Permanent Full Access</strong>
                <p style={{ margin: '4px 0 0', fontSize: '13px' }}>
                  The Main Administrator holds irrevocable, root-level administrative authority across every subsystem.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Full Access Switch Bar */}
              <div className="full-access-card">
                <div className="full-access-info">
                  <span className="full-access-title">FULL ACCESS</span>
                  <p className="full-access-desc">
                    Grant complete administrative control over all operational features and settings
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={fullAccess}
                    onChange={handleFullAccessToggle}
                    disabled={isSubmitting}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              {/* Granular Permissions List */}
              <div className="permissions-breakdown-list">
                <h4 className="permissions-section-title">Granular Operational Entitlements</h4>
                <div className="permissions-grid">
                  {Object.entries(ADMIN_PERMISSIONS).map(([permConstant, permKey]) => {
                    const isChecked = fullAccess || Boolean(permissions[permKey]);
                    return (
                      <label
                        key={permKey}
                        className={`permission-card ${isChecked ? 'active' : ''}`}
                      >
                        <input
                          type="checkbox"
                          className="admin-checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSingle(permKey)}
                          disabled={isSubmitting || fullAccess}
                        />
                        <div className="permission-card-content">
                          <span className="permission-card-label">{PERMISSION_LABELS[permKey]}</span>
                          <span className="permission-card-key">{permConstant}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
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
            {!isMainAdmin && (
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner spinner-dark" />
                    <span>Saving Permissions...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Apply Permissions</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default PermissionEditor;
