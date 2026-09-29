import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, ShieldAlert } from 'lucide-react';

export function BulkDeleteModal({ selectedUsers = [], onClose, onConfirm, isSubmitting }) {
  const [confirmInput, setConfirmInput] = useState('');
  const [error, setError] = useState('');

  const count = selectedUsers.length;
  const isConfirmed = confirmInput.trim() === 'DELETE';

  const handleBulkDelete = (e) => {
    e.preventDefault();
    if (!isConfirmed) {
      setError('Please type DELETE exactly as shown to confirm permanent bulk deletion.');
      return;
    }
    onConfirm(selectedUsers.map((u) => u.id));
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal-card destructive-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="admin-modal-title destructive-title">
            <ShieldAlert size={19} className="destructive-icon" />
            <span>Delete {count} User Accounts?</span>
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleBulkDelete} className="admin-modal-form">
          <div className="destructive-banner">
            <AlertTriangle size={18} />
            <p>
              This will permanently delete <strong>{count} selected user accounts</strong> from the persistent database. Their active sessions and configurations will be removed immediately.
            </p>
          </div>

          <div className="bulk-selected-preview-list">
            <div className="preview-list-header">Selected Accounts ({count}):</div>
            <div className="preview-list-scroll">
              {selectedUsers.map((u) => (
                <div key={u.id} className="preview-list-item">
                  <span className="item-name">{u.name}</span>
                  <span className="item-email">({u.email})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group confirm-input-group">
            <label className="form-label" htmlFor="bulk-confirm-text">
              To proceed, please type <strong className="type-keyword">DELETE</strong> in the box below:
            </label>
            <input
              id="bulk-confirm-text"
              type="text"
              className="admin-input-field destructive-input"
              value={confirmInput}
              onChange={(e) => {
                setConfirmInput(e.target.value);
                if (error) setError('');
              }}
              placeholder="DELETE"
              autoFocus
              autoComplete="off"
            />
          </div>

          {error && <div className="admin-form-alert error">{error}</div>}

          <div className="admin-modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-destructive"
              disabled={!isConfirmed || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner spinner-light" />
                  <span>Deleting Accounts...</span>
                </>
              ) : (
                <>
                  <Trash2 size={15} />
                  <span>Permanently Delete {count} Accounts</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BulkDeleteModal;
