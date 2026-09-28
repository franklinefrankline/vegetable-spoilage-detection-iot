import React, { useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAppearance, THEME_OPTIONS, ACCENT_OPTIONS } from '../context/AppearanceContext';
import { useDevice } from '../context/DeviceContext';
import { useNavigate, useLocation, Link } from '../router/Router';
import { BrandLogo } from './BrandLogo';
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
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  RotateCcw
} from 'lucide-react';

export function AppShell({ children }) {
  const { currentUser, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const {
    settings,
    setTheme,
    setAccent,
    setSidebarMode,
    resetToDefault,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    isQuickAppearanceOpen,
    setIsQuickAppearanceOpen,
    toggleQuickAppearance
  } = useAppearance();

  const { isConnected, device, unreadAlertsCount } = useDevice();
  const dropdownRef = useRef(null);

  // Close quick appearance on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsQuickAppearanceOpen(false);
      }
    };
    if (isQuickAppearanceOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isQuickAppearanceOpen, setIsQuickAppearanceOpen]);

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
    { href: '/connect-device', label: 'Device Connection', icon: Radio },
    { href: '/vegetable-storage', label: 'Vegetable Storage', icon: Boxes },
    { href: '/sensors', label: 'Live Sensors', icon: Gauge },
    { href: '/spoilage', label: 'Spoilage Detection', icon: ShieldAlert },
    { href: '/alerts', label: 'Alerts', icon: Bell, badge: unreadAlertsCount > 0 ? unreadAlertsCount : null },
    { href: '/analytics', label: 'History & Analytics', icon: LineChart },
    { href: '/reports', label: 'Reports', icon: FileText },
    { href: '/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="vegsense-shell">
      {/* Mobile Drawer Overlay */}
      <div
        className={`mobile-sidebar-overlay ${isMobileSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Modern Sidebar */}
      <aside
        className={`vegsense-sidebar ${isMobileSidebarOpen ? 'open' : ''}`}
        aria-label="Application Sidebar"
      >
        <div>
          <div className="sidebar-header">
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <BrandLogo size={36} showText={true} />
            </Link>
            {isMobileSidebarOpen && (
              <button
                type="button"
                className="header-action-btn"
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-label="Close mobile sidebar"
              >
                <X size={18} />
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
            className="sidebar-link"
            style={{ color: 'var(--accent-red)', width: '100%', justifyContent: 'flex-start' }}
            onClick={handleLogout}
            title="Sign out"
          >
            <LogOut size={18} className="sidebar-icon" />
            <span className="sidebar-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="vegsense-main-layout">
        {/* Global Compact Header */}
        <header className="vegsense-header">
          <div className="header-left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open mobile menu"
            >
              <Menu size={20} />
            </button>
            <div style={{ display: 'none' }} className="mobile-brand-title">
              <BrandLogo size={30} showTagline={false} />
            </div>
          </div>

          <div className="header-right" ref={dropdownRef}>
            {/* Device Connection Status */}
            <div
              className={`header-device-status ${isConnected ? 'connected' : ''}`}
              title={`ESP32 Microcontroller: ${device.ip}`}
            >
              <span className="pulse-led-indicator" />
              <span>{isConnected ? `${device.id} Connected` : 'ESP32 Offline'}</span>
            </div>

            {/* Quick Appearance Icon Trigger */}
            <button
              type="button"
              className={`header-action-btn ${isQuickAppearanceOpen ? 'active' : ''}`}
              onClick={toggleQuickAppearance}
              title="Customize Appearance & Theme"
              aria-label="Quick Appearance"
            >
              <Palette size={18} />
            </button>

            {/* Quick Appearance Dropdown Panel */}
            {isQuickAppearanceOpen && (
              <div className="quick-appearance-panel" role="dialog" aria-label="Theme settings">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.95rem' }}>
                    <Palette size={16} color="var(--primary)" />
                    <span>Appearance</span>
                  </div>
                  <button
                    type="button"
                    onClick={resetToDefault}
                    style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}
                    title="Reset to Fresh Green"
                  >
                    <RotateCcw size={12} /> Reset
                  </button>
                </div>

                <div className="appearance-section-title">Select Theme</div>
                <div className="theme-swatches-grid">
                  {THEME_OPTIONS.slice(0, 4).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`theme-swatch-btn ${settings.theme === t.id ? 'active' : ''}`}
                      onClick={() => setTheme(t.id)}
                    >
                      <div className="swatch-circle" style={{ backgroundColor: t.primary }} />
                      <span className="swatch-label">{t.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>

                <div className="appearance-section-title">Accent Color</div>
                <div className="accent-dots-row">
                  {ACCENT_OPTIONS.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className={`accent-dot-btn ${settings.accent === a.id ? 'active' : ''}`}
                      style={{ backgroundColor: a.color, color: a.color }}
                      onClick={() => setAccent(a.id)}
                      title={a.name}
                      aria-label={a.name}
                    />
                  ))}
                </div>

                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setTheme(settings.theme === 'dark' ? 'fresh-green' : 'dark')}
                    className="btn-secondary"
                    style={{ height: '32px', fontSize: '0.775rem', padding: '0 0.75rem' }}
                  >
                    {settings.theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                    <span>{settings.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickAppearanceOpen(false);
                      navigate('/settings');
                    }}
                    style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}
                  >
                    Full Settings &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* Notification Bell */}
            <button
              type="button"
              className="header-action-btn"
              onClick={() => navigate('/alerts')}
              title="Notifications"
              aria-label="Alerts"
            >
              <Bell size={18} />
              {unreadAlertsCount > 0 && <span className="header-notif-dot" />}
            </button>

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
        </header>

        {/* Content Body */}
        <main className="vegsense-content-body">
          {children}
        </main>
      </div>
    </div>
  );
}
