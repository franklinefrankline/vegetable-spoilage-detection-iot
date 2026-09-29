import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isMainAdmin, PERMISSION_LABELS } from '../../utils/adminPermissions';
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
  ShieldAlert,
  AtSign,
  Shield,
  Sliders,
  Bell,
  Cpu,
  Check,
  AlertCircle
} from 'lucide-react';

export function AdminSettings() {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const isMain = isMainAdmin(currentUser);

  // Profile Edit State
  const [name, setName] = useState(currentUser?.name || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // System Settings State (Section 38)
  const [sysConfig, setSysConfig] = useState({
    sessionTimeoutMins: 60,
    mfaEnforcement: 'optional',
    systemAlertNotifications: true,
    maintenanceMode: false,
    auditRetentionDays: 90
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const adminInitials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  const formatDate = (isoStr) => {
    if (!isoStr) return 'Never';
    try {
      return new Date(isoStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

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
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordError('New password must contain uppercase, lowercase, and numbers.');
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

  const handleSaveSysConfig = (e) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setTimeout(() => {
      setIsSavingConfig(false);
      addToast('System configuration preferences saved.', 'success');
    }, 600);
  };

  return (
    <div className="admin-page-content">
      {/* Subtitle & Actions Bar */}
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">System &amp; Security Settings</h2>
          <p className="section-subtitle">
            Manage your administrator profile, credentials, security parameters, and system maintenance.
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
            <div className={`admin-profile-big-avatar ${isMain ? 'avatar-main-admin' : ''}`}>
              {adminInitials}
            </div>
            <div className="admin-profile-text">
              <h3 className="admin-name-h3">{currentUser?.name || 'Administrator'}</h3>
              <div className="admin-email-p monospace-text">{currentUser?.email}</div>
              {currentUser?.username && (
                <div className="admin-username-p monospace-text">@{currentUser.username}</div>
              )}

              <div className="admin-profile-badges-row">
                {isMain ? (
                  <>
                    <span className="badge-role role-main-admin">MAIN ADMIN</span>
                    <span className="badge-status status-protected">PROTECTED ACCOUNT</span>
                  </>
                ) : (
                  <>
                    <span className="badge-role role-admin">ADMIN</span>
                    <span className="badge-status status-active">ACTIVE</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Account Timeline */}
          <div className="profile-meta-grid">
            <div className="profile-meta-item">
              <Calendar size={14} className="meta-icon" />
              <span className="meta-label">Account Created:</span>
              <span className="meta-val">{formatDate(currentUser?.created_at)}</span>
            </div>
            <div className="profile-meta-item">
              <Clock size={14} className="meta-icon" />
              <span className="meta-label">Last Login:</span>
              <span className="meta-val">{formatDate(currentUser?.last_login_at)}</span>
            </div>
          </div>

          {/* Granular Permissions overview for regular admin */}
          {!isMain && currentUser?.permissions && (
            <div className="admin-assigned-perms-block">
              <h5 className="perms-title">Assigned Entitlements</h5>
              <div className="perms-badges-wrap">
                {currentUser.permissions.full_access ? (
                  <span className="badge-access access-full">FULL ACCESS</span>
                ) : (
                  Object.entries(currentUser.permissions)
                    .filter(([k, v]) => v === 1 || v === true)
                    .map(([k]) => (
                      <span key={k} className="perm-badge-pill">
                        {PERMISSION_LABELS[k] || k}
                      </span>
                    ))
                )}
              </div>
            </div>
          )}

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
                className="admin-input-field monospace-input"
                value={currentUser?.email || ''}
                disabled
                title="Email is verified and immutable via this form."
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

        {/* Right Column: Password Management & System Settings */}
        <div className="admin-settings-right-col">
          {/* Change Password Card */}
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
                  placeholder="Minimum 8 characters with upper, lower, number"
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

          {/* Section 38: System Settings Card (Main Admin / System Settings) */}
          <div className="admin-settings-card">
            <div className="card-header-styled">
              <Sliders size={18} className="styled-icon" />
              <div className="styled-title">System Configuration &amp; Security</div>
            </div>

            <form onSubmit={handleSaveSysConfig} className="admin-sys-config-form">
              <div className="form-group">
                <label className="form-label" htmlFor="session-timeout">
                  Administrator Session Timeout
                </label>
                <select
                  id="session-timeout"
                  className="admin-input-field"
                  value={sysConfig.sessionTimeoutMins}
                  onChange={(e) => setSysConfig({ ...sysConfig, sessionTimeoutMins: parseInt(e.target.value, 10) })}
                >
                  <option value={30}>30 Minutes of Inactivity</option>
                  <option value={60}>60 Minutes (Standard Enterprise)</option>
                  <option value={120}>2 Hours</option>
                  <option value={480}>8 Hours (Full Shift)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="audit-retention">
                  Audit Log Retention
                </label>
                <select
                  id="audit-retention"
                  className="admin-input-field"
                  value={sysConfig.auditRetentionDays}
                  onChange={(e) => setSysConfig({ ...sysConfig, auditRetentionDays: parseInt(e.target.value, 10) })}
                >
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days (Recommended)</option>
                  <option value={180}>180 Days</option>
                  <option value={365}>365 Days (Full Year)</option>
                </select>
              </div>

              <div className="settings-checkbox-row">
                <input
                  type="checkbox"
                  id="notif-system-alerts"
                  className="admin-checkbox"
                  checked={sysConfig.systemAlertNotifications}
                  onChange={(e) => setSysConfig({ ...sysConfig, systemAlertNotifications: e.target.checked })}
                />
                <label htmlFor="notif-system-alerts" className="checkbox-text-label">
                  <strong>System Alert Notifications</strong>
                  <span>Broadcast high-priority sensor threshold alarms to active administrators</span>
                </label>
              </div>

              <div className="admin-form-actions">
                <button type="submit" className="btn-secondary" disabled={isSavingConfig}>
                  {isSavingConfig ? (
                    <>
                      <span className="spinner spinner-dark" />
                      <span>Saving Preferences...</span>
                    </>
                  ) : (
                    <>
                      <Check size={15} />
                      <span>Save Configuration</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
