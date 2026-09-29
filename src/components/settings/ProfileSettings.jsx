import React, { useState } from 'react';
import { User, Mail, Check, Shield } from 'lucide-react';

export function ProfileSettings({ user, onUpdateProfile, isSaving }) {
  const [name, setName] = useState(user?.name || '');
  const [isTouched, setIsTouched] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onUpdateProfile({ name: name.trim() });
    setIsTouched(false);
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setIsTouched(false);
  };

  return (
    <div className="settings-panel">
      <div className="settings-panel-header">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Profile Settings
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Manage your personal profile name and authenticated identity details.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
        {/* Full Name */}
        <div>
          <label
            htmlFor="profile-name-input"
            style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}
          >
            Full Name
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <User
              size={18}
              style={{ position: 'absolute', left: '0.85rem', color: 'var(--text-secondary)' }}
            />
            <input
              id="profile-name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setIsTouched(true);
              }}
              placeholder="e.g. Dr. Aris Thorne"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label
              htmlFor="profile-email-input"
              style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}
            >
              Email Address
            </label>
            <span
              style={{
                fontSize: '0.74rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '999px',
                background: 'rgba(27, 77, 46, 0.1)',
                color: 'var(--primary-color, #1b4d2e)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Shield size={12} /> Verified Primary
            </span>
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Mail
              size={18}
              style={{ position: 'absolute', left: '0.85rem', color: 'var(--text-secondary)' }}
            />
            <input
              id="profile-email-input"
              type="email"
              value={user?.email || ''}
              disabled
              readOnly
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-page)',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                cursor: 'not-allowed'
              }}
            />
          </div>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Email address is tied to your cryptographic authentication identity.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="submit"
            disabled={!isTouched || isSaving || !name.trim()}
            className="btn btn-primary"
            style={{
              padding: '0.6rem 1.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              fontSize: '0.88rem',
              opacity: !isTouched || isSaving ? 0.65 : 1,
              cursor: !isTouched || isSaving ? 'not-allowed' : 'pointer'
            }}
          >
            {isSaving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={16} />}
            Save Changes
          </button>

          {isTouched && (
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary"
              style={{
                padding: '0.6rem 1.1rem',
                fontSize: '0.88rem'
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
