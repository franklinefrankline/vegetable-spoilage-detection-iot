import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

export function DeleteAdminModal({ isOpen, onClose, admin, onConfirm, isSubmitting }) {
  const [confirmInput, setConfirmInput] = useState('');

  if (!isOpen || !admin) return null;

  const isConfirmed = confirmInput.trim() === 'DELETE';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isConfirmed) return;
    onConfirm(admin);
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-container modal-danger" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-modal-header danger-header">
          <div className="modal-title-with-icon">
            <div className="modal-icon-badge modal-icon-red">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="modal-title">DELETE ADMINISTRATOR?</h3>
              <p className="modal-subtitle">Irreversible administrative account termination</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} disabled={isSubmitting}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="admin-modal-body">
          <div className="danger-warning-box">
            <p>
              You are about to permanently delete this administrator account. This administrator will
              immediately lose all access to the VegSense Admin Portal and related APIs.
            </p>
          </div>

          {/* Target Admin Metadata */}
          <div className="target-account-summary">
            <div className="summary-row">
              <span className="summary-label">Admin Name:</span>
              <strong className="summary-value">{admin.name || 'Unnamed Administrator'}</strong>
            </div>
            <div className="summary-row">
              <span className="summary-label">Username:</span>
              <span className="summary-value monospace-text">@{admin.username || 'n/a'}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Email:</span>
              <span className="summary-value monospace-text">{admin.email}</span>
            </div>
          </div>

          <div className="confirmation-input-block">
            <label className="form-label" htmlFor="delete-admin-confirm-input">
              To confirm deletion, type <strong>DELETE</strong> below:
            </label>
            <input
              id="delete-admin-confirm-input"
              type="text"
              className="admin-form-input monospace-input danger-input"
              placeholder="Type DELETE"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              disabled={isSubmitting}
              autoComplete="off"
            />
          </div>

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
              className="btn-danger"
              disabled={!isConfirmed || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner spinner-dark" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  <span>Permanently Delete Administrator</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeleteAdminModal;
