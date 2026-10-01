import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAppearance, THEME_OPTIONS, ACCENT_OPTIONS } from '../context/AppearanceContext';
import { useDevice } from '../context/DeviceContext';
import { useAlerts } from '../context/AlertContext';
import { useNavigate, useLocation, Link } from '../router/Router';
import { VegSenseLogo } from './branding/VegSenseLogo';
import markLogo from '../assets/vegsense-mark.png';
import { NotificationBell } from './alerts/NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import {
  LayoutDashboard,
  Radio,
  Boxes,
  Gauge,
  ShieldAlert,
  Bell,
  LineChart,
  FileText,
  Settings,
  LogOut,
  Palette,
  Menu,
  X,
  Sun,
  Moon,
  Check,
  RotateCcw,
  Sparkles,
  Cpu,
  Activity,
  ShieldCheck
} from 'lucide-react';

export function AppShell({ children }) {
  const { currentUser, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const {
    settings,
    setTheme,
    toggleMode,
    setAccent,
    resetToDefault,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isQuickAppearanceOpen,
    setIsQuickAppearanceOpen,
    toggleQuickAppearance
  } = useAppearance();

  const { isConnected, device, unreadAlertsCount, reconnectDevice } = useDevice();
  const { unreadCount } = useAlerts();
  const effectiveUnread = unreadCount ?? unreadAlertsCount ?? 0;
  const dropdownRef = useRef(null);
  const devicePopoverRef = useRef(null);
  const [isDeviceStatusOpen, setIsDeviceStatusOpen] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsQuickAppearanceOpen(false);
      }
      if (devicePopoverRef.current && !devicePopoverRef.current.contains(e.target)) {
        setIsDeviceStatusOpen(false);
      }
    };
    if (isQuickAppearanceOpen || isDeviceStatusOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isQuickAppearanceOpen, setIsQuickAppearanceOpen, isDeviceStatusOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      addToast('Logged out successfully.', 'info');
      navigate('/login');
    } catch (err) {
      navigate('/login');
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/connect-device', label: 'Device', icon: Radio },
    { href: '/storage', label: 'Storage', icon: Boxes },
    { href: '/sensors', label: 'Sensors', icon: Gauge },
    { href: '/spoilage', label: 'Spoilage', icon: ShieldAlert },
    { href: '/alerts', label: 'Alerts', icon: Bell, badge: effectiveUnread > 0 ? effectiveUnread : null },
    { href: '/analytics', label: 'Analytics', icon: LineChart },
    { href: '/reports', label: 'Reports', icon: FileText },
    { href: '/settings', label: 'Settings', icon: Settings },
    ...(['ADMIN', 'MAIN_ADMIN'].includes(currentUser?.role) ? [{ href: '/admin', label: 'Admin Portal', icon: ShieldCheck }] : [])
  ];

  return (
    <div className="vegsense-shell">
      {/* Mobile Drawer Overlay */}
      <div
        className={`mobile-sidebar-overlay ${isMobileSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Modern Sidebar (Navigation Rail) */}
      <aside
        className={`vegsense-sidebar ${isMobileSidebarOpen ? 'open' : ''}`}
        aria-label="Application Sidebar"
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <div>
            <div className="sidebar-header">
              <Link
                href="/dashboard"
                className="sidebar-logo-link"
                onClick={() => setIsMobileSidebarOpen(false)}
                title="VegSense - Smart Storage Intelligence"
              >
                <img
                  src={markLogo}
                  alt="VegSense"
                  className="vegsense-sidebar-mark"
                  width="42"
                  height="42"
                />
                <span className="vegsense-sidebar-name">VegSense</span>
                <span className="vegsense-sidebar-tagline">Smart Storage Intelligence</span>
              </Link>
              {isMobileSidebarOpen && (
                <button
                  type="button"
                  className="mobile-close-btn"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  aria-label="Close mobile sidebar"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <nav className="sidebar-nav">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    title={item.label}
                  >
                    <Icon size={19} className="sidebar-icon" />
                    <span className="sidebar-label">{item.label}</span>
                    {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="sidebar-footer">
            <button
              type="button"
              className="sidebar-link sidebar-logout-btn"
              onClick={handleLogout}
              title="Sign out"
            >
              <LogOut size={18} className="sidebar-icon" />
              <span className="sidebar-label">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="vegsense-main-layout">
        {/* Global Header */}
        <header className="vegsense-header">
          {/* Desktop Left / Mobile Top Bar */}
          <div className="header-primary-row">
            <div className="header-left">
              <button
                type="button"
                className="mobile-menu-btn"
                onClick={() => setIsMobileSidebarOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu size={22} />
              </button>

              <Link
                href="/dashboard"
                className="header-brand-link"
                title="VegSense - Smart Storage Intelligence"
              >
                <img
                  src={markLogo}
                  alt="VegSense"
                  className="vegsense-header-mark"
                  width="28"
                  height="28"
                />
                <div className="vegsense-header-text-group">
                  <span className="vegsense-header-name">VegSense</span>
                  <span className="vegsense-header-tagline">Smart Storage Intelligence</span>
                </div>
              </Link>

              {/* Desktop Status Indicators */}
              <div className="header-desktop-status-group">
                <span className="header-live-badge">
                  <Activity size={13} className="telemetry-live-icon" />
                  <span>Storage Live</span>
                </span>
                <div style={{ position: 'relative' }} ref={devicePopoverRef}>
                  <button
                    type="button"
                    className="header-device-pill"
                    onClick={() => setIsDeviceStatusOpen((prev) => !prev)}
                    title="View Device Connection Status"
                  >
                    <span className={`pulse-led-indicator ${isConnected ? 'pulse-green' : 'pulse-amber'}`} />
                    <span>{isConnected ? `${device.id || 'ESP32-001'} Connected` : 'ESP32 Offline'}</span>
                  </button>

                  {isDeviceStatusOpen && (
                    <div className="device-status-header-popover" role="dialog" aria-label="Device Status">
                      <div className="status-popover-title">Device Status</div>
                      <div className="status-popover-row">
                        <span className="popover-k">Device:</span>
                        <span className="popover-v">{device.id || 'ESP32-001'}</span>
                      </div>
                      <div className="status-popover-row">
                        <span className="popover-k">IP:</span>
                        <span className="popover-v" style={{ fontFamily: 'monospace' }}>
                          {device.ip || device.ipAddress || '192.168.1.105'}
                        </span>
                      </div>
                      <div className="status-popover-row">
                        <span className="popover-k">Connection:</span>
                        <span className="popover-v" style={{ color: isConnected ? 'var(--primary)' : 'var(--accent-red)', fontWeight: 800 }}>
                          {isConnected ? 'Connected' : 'Offline'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        {!isConnected && (
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ flex: 1, height: '36px', fontSize: '0.8rem' }}
                            onClick={() => {
                              setIsDeviceStatusOpen(false);
                              reconnectDevice();
                            }}
                          >
                            Reconnect
                          </button>
                        )}
                        <button
                          type="button"
                          className={isConnected ? "btn-primary" : "btn-secondary"}
                          style={{ flex: 1, height: '36px', fontSize: '0.8rem' }}
                          onClick={() => {
                            setIsDeviceStatusOpen(false);
                            navigate('/connect-device');
                          }}
                        >
                          Change Device
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="header-right" ref={dropdownRef}>
              {/* Quick Status Dot for Mobile */}
              <div
                className="header-mobile-status-dot"
                title={`${device.id || 'ESP32-001'} - ${isConnected ? 'Online' : 'Offline'}`}
                onClick={() => navigate('/connect-device')}
              >
                <span className={`pulse-led-indicator ${isConnected ? 'pulse-green' : 'pulse-amber'}`} />
              </div>

              {/* Global Theme Toggle Button */}
              <ThemeToggle />

              {/* Notification Bell with live unread badge and dropdown */}
              <NotificationBell />

              {/* User Profile Badge */}
              <div
                className="header-user-badge"
                onClick={() => navigate('/settings')}
                title={`Logged in as ${currentUser?.name || 'User'}`}
              >
                <div className="user-avatar-circle">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="user-name-text">{currentUser?.name?.split(' ')[0] || 'User'}</span>
              </div>
            </div>
          </div>

          {/* Dedicated Mobile Sub-header */}
          <div className="mobile-header-subbar">
            <span className="mobile-subbar-item">
              <span className="mobile-subbar-dot" />
              <span>Storage Live</span>
            </span>
            <span className="mobile-subbar-sep">•</span>
            <span className="mobile-subbar-item device" onClick={() => navigate('/connect-device')}>
              <Cpu size={12} />
              <span>{device.id || 'ESP32-001'}</span>
            </span>
          </div>
        </header>

        {/* Content Body */}
        <main className="vegsense-content-body">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (Section 34) */}
        <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
          <Link
            href="/dashboard"
            className={`mobile-bottom-nav-item ${pathname === '/dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            <span>Home</span>
          </Link>

          <Link
            href="/connect-device"
            className={`mobile-bottom-nav-item ${pathname === '/connect-device' ? 'active' : ''}`}
          >
            <Radio size={20} />
            <span>Device</span>
          </Link>

          <Link
            href="/storage"
            className={`mobile-bottom-nav-item ${pathname === '/storage' || pathname === '/vegetable-storage' ? 'active' : ''}`}
          >
            <Boxes size={20} />
            <span>Storage</span>
          </Link>

          <Link
            href="/alerts"
            className={`mobile-bottom-nav-item ${pathname === '/alerts' ? 'active' : ''}`}
          >
            <Bell size={20} />
            {effectiveUnread > 0 && <span className="mobile-nav-dot" />}
            <span>Alerts</span>
          </Link>

          <Link
            href="/settings"
            className={`mobile-bottom-nav-item ${pathname === '/settings' ? 'active' : ''}`}
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
