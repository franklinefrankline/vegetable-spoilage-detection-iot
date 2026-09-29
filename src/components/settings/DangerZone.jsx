import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Lock } from 'lucide-react';

export function DangerZone({ onDeleteAccount, isDeleting, userEmail }) {
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const isDemoUser = userEmail === 'demo@vegsense.io';

  const handleConfirmDelete = async () => {
    setError('');
    if (confirmText.trim().toUpperCase() !== 'DELETE' && !password) {
      setError('Please type "DELETE" or provide your account password to confirm.');
      return;
    }

    try {
      await onDeleteAccount({
        confirmationText: confirmText.trim(),
        password: password || undefined
      });
      setShowModal(false);
    } catch (err) {
      setError(err.message || 'Failed to delete account.');
    }
  };

  return (
    <div
      className="settings-panel"
      style={{
        border: '1px solid rgba(220, 38, 38, 0.3)',
        background: 'rgba(220, 38, 38, 0.02)'
      }}
    >
      <div className="settings-panel-header">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} /> Danger Zone
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Irreversible tenant actions and permanent account erasure.
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: '1.25rem',
          padding: '1.25rem',
          borderRadius: '10px',
          border: '1px solid rgba(220, 38, 38, 0.2)',
          background: 'var(--bg-surface)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Delete Account Permanently
          </h4>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '520px', lineHeight: 1.4 }}>
            Permanently delete your profile, device associations, alert configurations, storage batch metadata, and personal data records from the system.
            {isDemoUser && (
              <span style={{ display: 'block', color: '#dc2626', fontWeight: 600, marginTop: '0.25rem' }}>
                Note: The global shared Demo Account cannot be erased. You can reset demo telemetry instead.
              </span>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => { setShowModal(true); setError(''); }}
          disabled={isDemoUser}
          className="btn btn-primary"
          style={{
            background: '#dc2626',
            borderColor: '#dc2626',
            padding: '0.6rem 1.25rem',
            fontSize: '0.86rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            opacity: isDemoUser ? 0.5 : 1,
            cursor: isDemoUser ? 'not-allowed' : 'pointer'
          }}
        >
          <Trash2 size={16} /> Delete Account
        </button>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: '12px',
              padding: '1.5rem',
              maxWidth: '460px',
              width: '100%',
              border: '1px solid var(--border-color)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626' }}>
                <AlertTriangle size={22} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                  Confirm Permanent Deletion
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              This action is permanent and cannot be undone. All your custom thresholds, connected ESP32 mappings, alerts, and user settings will be permanently erased.
            </p>

            {error && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#dc2626',
                  fontSize: '0.82rem'
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Type <span style={{ color: '#dc2626', fontWeight: 700 }}>DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-page)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                Or enter your account password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-page)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn btn-secondary"
                style={{ padding: '0.55rem 1rem', fontSize: '0.84rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="btn btn-primary"
                style={{
                  padding: '0.55rem 1.25rem',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  background: '#dc2626',
                  borderColor: '#dc2626'
                }}
              >
                {isDeleting ? 'Deleting Account...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
