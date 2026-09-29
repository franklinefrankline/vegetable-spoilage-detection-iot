import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, ShieldAlert } from 'lucide-react';

export function DeleteUserModal({ user, onClose, onConfirm, isSubmitting }) {
  const [confirmInput, setConfirmInput] = useState('');
  const [error, setError] = useState('');

  if (!user) return null;

  const isConfirmed = confirmInput.trim() === 'DELETE';

  const handleDelete = (e) => {
    e.preventDefault();
    if (!isConfirmed) {
      setError('Please type DELETE exactly as shown to confirm permanent deletion.');
      return;
    }
    onConfirm(user);
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal-card destructive-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="admin-modal-title destructive-title">
            <ShieldAlert size={19} className="destructive-icon" />
            <span>Delete User Account?</span>
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleDelete} className="admin-modal-form">
          <div className="destructive-banner">
            <AlertTriangle size={18} />
            <p>
              This action <strong>permanently deletes</strong> the user account. The user will immediately lose access and will no longer be able to sign in.
            </p>
          </div>

          <div className="delete-target-preview">
            <div className="target-preview-row">
              <span className="target-k">User Name:</span>
              <strong className="target-v">{user.name}</strong>
            </div>
            <div className="target-preview-row">
              <span className="target-k">Email Address:</span>
              <span className="target-v">{user.email}</span>
            </div>
            <div className="target-preview-row">
              <span className="target-k">Account ID:</span>
              <span className="target-v mono-text">{user.id}</span>
            </div>
          </div>

          <div className="form-group confirm-input-group">
            <label className="form-label" htmlFor="delete-confirm-text">
              To proceed, please type <strong className="type-keyword">DELETE</strong> in the box below:
            </label>
            <input
              id="delete-confirm-text"
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
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 size={15} />
                  <span>Permanently Delete Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeleteUserModal;
