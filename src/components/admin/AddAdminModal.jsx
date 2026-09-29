import React, { useState } from 'react';
import { X, ShieldPlus, Search, UserCheck, Check, AlertCircle } from 'lucide-react';

export function AddAdminModal({ users = [], onClose, onPromote, isSubmitting }) {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');

  // Filter only standard USER accounts
  const candidateUsers = users.filter((u) => {
    const isStandard = u.role !== 'ADMIN';
    if (!isStandard) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.id?.toLowerCase().includes(q)
    );
  });

  const handlePromote = (e) => {
    e.preventDefault();
    if (!selectedUser) {
      setError('Please select a user account to grant administrator privileges.');
      return;
    }
    onPromote(selectedUser);
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="admin-modal-title">
            <ShieldPlus size={19} className="modal-title-icon" />
            <span>Add Administrator</span>
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handlePromote} className="admin-modal-form">
          <div className="admin-notice-box">
            <p>
              Administrator privileges grant complete authority over user accounts, telemetry systems, access controls, and audit trails. Select an existing verified user below to promote them.
            </p>
          </div>

          <div className="form-group search-group">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="admin-input-field search-input"
                placeholder="Search candidates by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="candidate-users-list">
            {candidateUsers.length === 0 ? (
              <div className="no-candidates-msg">
                {search ? 'No matching candidate accounts found.' : 'All registered users are already administrators.'}
              </div>
            ) : (
              candidateUsers.map((u) => {
                const isSelected = selectedUser?.id === u.id;
                return (
                  <div
                    key={u.id}
                    className={`candidate-user-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedUser(u);
                      setError('');
                    }}
                  >
                    <div className="candidate-avatar">
                      {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="candidate-info">
                      <div className="candidate-name">{u.name}</div>
                      <div className="candidate-email">{u.email}</div>
                    </div>
                    {isSelected && (
                      <div className="candidate-check">
                        <Check size={16} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {error && (
            <div className="admin-form-alert error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className="admin-modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!selectedUser || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner spinner-dark" />
                  <span>Granting Privileges...</span>
                </>
              ) : (
                <>
                  <UserCheck size={16} />
                  <span>Promote to Administrator</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddAdminModal;
