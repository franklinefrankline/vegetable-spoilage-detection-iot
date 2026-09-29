import React from 'react';
import { X, Shield, ShieldAlert, ArrowRight } from 'lucide-react';

export function RoleChangeModal({ user, onClose, onConfirm, isSubmitting }) {
  if (!user) return null;

  const currentRole = user.role === 'ADMIN' ? 'ADMIN' : 'USER';
  const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
  const isPromoting = newRole === 'ADMIN';

  return (
    <div className="admin-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="admin-modal-title">
            <Shield size={18} className="modal-title-icon" />
            <span>{isPromoting ? 'Promote User to Administrator' : 'Demote Administrator to Standard User'}</span>
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="admin-modal-form">
          <div className="role-change-diagram">
            <div className="role-pill current-pill">
              <span>{currentRole}</span>
            </div>
            <ArrowRight size={20} className="role-arrow" />
            <div className={`role-pill new-pill ${isPromoting ? 'pill-admin' : 'pill-user'}`}>
              <span>{newRole}</span>
            </div>
          </div>

          <div className="target-preview-box">
            <div className="target-name">{user.name}</div>
            <div className="target-email">{user.email}</div>
          </div>

          <p className="modal-description-text">
            {isPromoting
              ? 'Administrator privileges provide full management over user accounts, activation states, security roles, system configuration, and audit logs.'
              : 'Demoting this administrator will revoke their access to the Admin Portal, user management, and system-level operations.'}
          </p>

          <div className="admin-modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="button"
              className={isPromoting ? 'btn-primary' : 'btn-destructive'}
              onClick={() => onConfirm(user, newRole)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner spinner-dark" />
                  <span>Updating Role...</span>
                </>
              ) : (
                <span>Confirm {isPromoting ? 'Promotion to Admin' : 'Demotion to User'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoleChangeModal;
