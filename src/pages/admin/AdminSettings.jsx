import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  User,
  ShieldCheck,
  Mail,
  Lock,
  Save,
  CheckCircle2,
  Calendar,
  Clock,
  KeyRound,
  ShieldAlert
} from 'lucide-react';

export function AdminSettings() {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  // Profile Edit State
  const [name, setName] = useState(currentUser?.name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const adminInitials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      addToast('Full name must be at least 2 characters long.', 'error');
      return;
    }

    setIsSavingProfile(true);
    try {
      const token = localStorage.getItem('veg_storage_auth_token') || sessionStorage.getItem('veg_storage_auth_token');
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: name.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update profile.');
      }
      addToast('Administrator profile updated successfully.', 'success');
    } catch (err) {
      addToast(err.message || 'Unable to update profile.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword || !newPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem('veg_storage_auth_token') || sessionStorage.getItem('veg_storage_auth_token');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Password update failed.');
      }
      addToast('Administrator password changed successfully.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Unable to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="admin-page-content">
      {/* Subtitle & Actions Bar */}
      <div className="admin-section-header">
        <div>
          <p className="section-subtitle">
            Manage your administrator profile, credentials, and authentication security.
          </p>
        </div>
      </div>

      <div className="admin-settings-layout">
        {/* Left Column: Admin Profile Card */}
        <div className="admin-settings-card">
          <div className="card-header-styled">
            <User size={18} className="styled-icon" />
            <div className="styled-title">Administrator Profile</div>
          </div>

          <div className="admin-profile-overview-box">
            <div className="admin-profile-big-avatar">{adminInitials}</div>
            <div className="admin-profile-text">
              <h3 className="admin-name-h3">{currentUser?.name || 'Administrator'}</h3>
              <div className="admin-email-p">{currentUser?.email}</div>
              <div className="admin-verified-tag">
                <ShieldCheck size={13} />
                <span>Verified System Administrator</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="admin-profile-form">
            <div className="form-group">
              <label className="form-label" htmlFor="admin-full-name">
                Full Name
              </label>
              <input
                id="admin-full-name"
                type="text"
                className="admin-input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="admin-email-field">
                Email Address
              </label>
              <input
                id="admin-email-field"
                type="email"
                className="admin-input-field"
                value={currentUser?.email || ''}
                disabled
                title="Email is strictly verified and cannot be changed here."
              />
              <span className="field-hint">Primary administrator email verified at registration.</span>
            </div>

            <div className="admin-form-actions">
              <button type="submit" className="btn-primary" disabled={isSavingProfile}>
                {isSavingProfile ? (
                  <>
                    <span className="spinner spinner-dark" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Security & Password Management */}
        <div className="admin-settings-card">
          <div className="card-header-styled">
            <KeyRound size={18} className="styled-icon" />
            <div className="styled-title">Change Password</div>
          </div>

          <form onSubmit={handleChangePassword} className="admin-password-form">
            {passwordError && (
              <div className="admin-form-alert error">
                <ShieldAlert size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="admin-curr-pass">
                Current Password
              </label>
              <input
                id="admin-curr-pass"
                type="password"
                className="admin-input-field"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Enter current password"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="admin-new-pass">
                New Password
              </label>
              <input
                id="admin-new-pass"
                type="password"
                className="admin-input-field"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Minimum 8 characters"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="admin-conf-pass">
                Confirm New Password
              </label>
              <input
                id="admin-conf-pass"
                type="password"
                className="admin-input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter new password"
              />
            </div>

            <div className="admin-form-actions">
              <button type="submit" className="btn-primary" disabled={isChangingPassword}>
                {isChangingPassword ? (
                  <>
                    <span className="spinner spinner-dark" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Lock size={15} />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
