import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAppearance } from '../../context/AppearanceContext';
import { useNavigate, Link } from '../../router/Router';
import {
  Menu,
  Sun,
  Moon,
  ShieldCheck,
  User,
  Settings,
  LogOut,
  Bell,
  Activity,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

export function AdminHeader({ title, subtitle, onToggleMobile }) {
  const { currentUser, logout } = useAuth();
  const { settings, toggleMode } = useAppearance();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      addToast('Logged out successfully.', 'info');
      navigate('/login');
    } catch (err) {
      navigate('/login');
    }
  };

  const adminInitials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <header className="admin-header">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="admin-header-left">
        <button
          type="button"
          className="admin-hamburger-btn"
          onClick={onToggleMobile}
          aria-label="Open admin navigation"
        >
          <Menu size={20} />
        </button>

        <div className="admin-title-group">
          <div className="admin-header-breadcrumb">
            <span className="breadcrumb-brand">VegSense Admin Portal</span>
            <span className="breadcrumb-sep">/</span>
          </div>
          <h1 className="admin-page-title">{title || 'Admin Portal'}</h1>
        </div>
      </div>

      {/* Right: Status Pill, Theme Toggle, Notification Bell, Profile Menu */}
      <div className="admin-header-right">
        {/* System Status Indicator */}
        <div className="admin-system-status-pill" title="All Core Microservices Operational">
          <span className="admin-pulse-dot" />
          <span className="admin-status-text">System Operational</span>
        </div>

        {/* Theme Mode Switcher */}
        <button
          type="button"
          className="admin-icon-btn"
          onClick={toggleMode}
          title={settings.theme === 'night-monitor' ? 'Switch to Forest Light' : 'Switch to Night Monitor Pro'}
          aria-label="Toggle Theme"
        >
          {settings.theme === 'night-monitor' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Admin Notifications */}
        <div className="admin-popover-anchor" ref={notifRef}>
          <button
            type="button"
            className={`admin-icon-btn ${isNotifOpen ? 'active' : ''}`}
            onClick={() => setIsNotifOpen((prev) => !prev)}
            title="System & Security Alerts"
            aria-label="Admin Alerts"
          >
            <Bell size={17} />
            <span className="admin-notif-dot" />
          </button>

          {isNotifOpen && (
            <div className="admin-popover-dropdown notif-dropdown" role="dialog">
              <div className="admin-dropdown-header">
                <span className="dropdown-title">System Activity</span>
                <span className="dropdown-badge">Live</span>
              </div>
              <div className="admin-notif-list">
                <div className="admin-notif-item">
                  <CheckCircle2 size={15} color="var(--primary)" />
                  <div>
                    <div className="notif-item-title">Database Engine Synchronized</div>
                    <div className="notif-item-time">Active persistent storage</div>
                  </div>
                </div>
                <div className="admin-notif-item">
                  <ShieldCheck size={15} color="var(--accent-blue)" />
                  <div>
                    <div className="notif-item-title">RBAC Security Guard Active</div>
                    <div className="notif-item-time">Dual-admin protection enforced</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Menu */}
        <div className="admin-popover-anchor" ref={profileRef}>
          <button
            type="button"
            className="admin-user-profile-btn"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            aria-expanded={isProfileOpen}
            title={currentUser?.email || 'Administrator'}
          >
            <div className="admin-avatar">{adminInitials}</div>
            <div className="admin-user-info-text">
              <span className="admin-user-name">{currentUser?.name?.split(' ')[0] || 'Admin'}</span>
              <span className={`admin-role-badge ${currentUser?.role === 'MAIN_ADMIN' ? 'badge-main-admin' : ''}`}>
                {currentUser?.role === 'MAIN_ADMIN' ? 'MAIN ADMIN' : 'ADMIN'}
              </span>
            </div>
            <ChevronDown size={14} className="admin-chevron" />
          </button>

          {isProfileOpen && (
            <div className="admin-popover-dropdown profile-dropdown" role="menu">
              <div className="admin-profile-head">
                <div className="profile-head-name">{currentUser?.name || 'Administrator'}</div>
                <div className="profile-head-email">{currentUser?.email}</div>
                <div className="profile-head-role">
                  <ShieldCheck size={12} />
                  <span>{currentUser?.role === 'MAIN_ADMIN' ? 'Main Administrator (Protected)' : 'Verified Administrator'}</span>
                </div>
              </div>

              <div className="admin-dropdown-divider" />

              <button
                type="button"
                className="admin-dropdown-link"
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/admin/settings');
                }}
              >
                <User size={15} />
                <span>Admin Profile</span>
              </button>

              <button
                type="button"
                className="admin-dropdown-link"
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/admin/settings');
                }}
              >
                <Settings size={15} />
                <span>Security Settings</span>
              </button>

              <div className="admin-dropdown-divider" />

              <button
                type="button"
                className="admin-dropdown-link logout-item"
                onClick={() => {
                  setIsProfileOpen(false);
                  handleLogout();
                }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
