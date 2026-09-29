import React, { useState } from 'react';
import {
  X,
  ShieldPlus,
  Search,
  UserCheck,
  Check,
  AlertCircle,
  UserPlus,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

export function AddAdminModal({
  users = [],
  onClose,
  onPromote,
  onCreateAdmin,
  isSubmitting
}) {
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'promote'
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');

  // Create Mode Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_access: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Filter only standard USER accounts for promotion
  const candidateUsers = users.filter((u) => {
    const isStandard = u.role !== 'ADMIN' && u.role !== 'MAIN_ADMIN';
    if (!isStandard) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.id?.toLowerCase().includes(q)
    );
  });

  const handlePromoteSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!selectedUser) {
      setError('Please select a user account to grant administrator privileges.');
      return;
    }
    if (onPromote) {
      onPromote(selectedUser);
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!createForm.name.trim()) {
      setError('Please enter full name.');
      return;
    }
    if (!createForm.email.trim() || !createForm.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    let cleanUsername = String(createForm.username || createForm.email.split('@')[0] || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');

    if (cleanUsername.length < 3) {
      cleanUsername = (cleanUsername + '_adm').slice(0, 20);
    }

    if (!createForm.password || createForm.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(createForm.password)) {
      setError('Password must contain at least one uppercase letter.');
      return;
    }
    if (!/[a-z]/.test(createForm.password)) {
      setError('Password must contain at least one lowercase letter.');
      return;
    }
    if (!/[0-9]/.test(createForm.password)) {
      setError('Password must contain at least one number.');
      return;
    }
    if (!/[^A-Za-z0-9]/.test(createForm.password)) {
      setError('Password must contain at least one special character (!@#$%^&*).');
      return;
    }
    if (createForm.password !== createForm.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (onCreateAdmin) {
      onCreateAdmin({
        name: createForm.name.trim(),
        username: cleanUsername,
        email: createForm.email.trim(),
        password: createForm.password,
        confirm_password: createForm.confirmPassword,
        confirmPassword: createForm.confirmPassword,
        is_active: 1,
        status: 'ACTIVE',
        full_access: createForm.full_access,
        permissions: {
          user_management: true,
          admin_management: false,
          device_management: true,
          storage_management: true,
          sensor_monitoring: true,
          spoilage_monitoring: true,
          alert_management: true,
          analytics: true,
          reports: true,
          system_settings: false,
          audit_logs: true
        }
      });
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="admin-modal-card admin-modal-wide" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-modal-header">
          <div className="admin-modal-title">
            <ShieldPlus size={20} className="modal-title-icon" />
            <span>Administrator Management</span>
          </div>
          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
            aria-label="Close modal"
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="admin-modal-nav-tabs">
          <button
            type="button"
            className={`admin-modal-nav-tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('create');
              setError('');
            }}
          >
            <UserPlus size={15} />
            <span>Create New Administrator</span>
          </button>

          <button
            type="button"
            className={`admin-modal-nav-tab ${activeTab === 'promote' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('promote');
              setError('');
            }}
          >
            <UserCheck size={15} />
            <span>Promote Existing User</span>
          </button>
        </div>

        {/* Tab 1: Create New Administrator Form */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateSubmit} className="admin-modal-form">
            <div className="admin-notice-box">
              <p>
                Create a dedicated administrator account with system authority to manage telemetry, sensors, and account permissions.
              </p>
            </div>

            {error && (
              <div className="admin-form-alert error">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="new-admin-name">
                  Full Name <span className="required">*</span>
                </label>
                <div className="search-input-wrapper">
                  <User size={15} className="search-icon" />
                  <input
                    id="new-admin-name"
                    type="text"
                    className="admin-input-field with-icon"
                    placeholder="e.g. Sarah Connor"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-admin-email">
                  Email Address <span className="required">*</span>
                </label>
                <div className="search-input-wrapper">
                  <Mail size={15} className="search-icon" />
                  <input
                    id="new-admin-email"
                    type="email"
                    className="admin-input-field with-icon"
                    placeholder="e.g. sarah@vegsense.org"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="new-admin-password">
                  Password <span className="required">*</span>
                </label>
                <div className="search-input-wrapper">
                  <Lock size={15} className="search-icon" />
                  <input
                    id="new-admin-password"
                    type={showPassword ? 'text' : 'password'}
                    className="admin-input-field with-icon with-right-btn"
                    placeholder="Min 8 chars (Aa-Zz, 0-9, !@#)"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="input-right-btn"
                    onClick={() => setShowPassword((p) => !p)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-admin-confirm">
                  Confirm Password <span className="required">*</span>
                </label>
                <div className="search-input-wrapper">
                  <Lock size={15} className="search-icon" />
                  <input
                    id="new-admin-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="admin-input-field with-icon with-right-btn"
                    placeholder="Re-enter password"
                    value={createForm.confirmPassword}
                    onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="input-right-btn"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="permission-toggle-label">
                <input
                  type="checkbox"
                  className="admin-checkbox"
                  checked={createForm.full_access}
                  onChange={(e) => setCreateForm({ ...createForm, full_access: e.target.checked })}
                  disabled={isSubmitting}
                />
                <span>Grant Full System Access (All Management & Telemetry Controls)</span>
              </label>
            </div>

            <div className="admin-modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary create-admin-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner spinner-dark" />
                    <span>Creating Administrator...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>+ Create Administrator</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Promote Existing User */}
        {activeTab === 'promote' && (
          <form onSubmit={handlePromoteSubmit} className="admin-modal-form">
            <div className="admin-notice-box">
              <p>
                Promote an existing registered user to an Administrator. Select a user account from the list below.
              </p>
            </div>

            {error && (
              <div className="admin-form-alert error">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

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
        )}
      </div>
    </div>
  );
}

export default AddAdminModal;
