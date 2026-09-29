import React from 'react';
import { Link, useNavigate, useLocation } from '../../router/Router';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import markLogo from '../../assets/vegsense-mark.png';
import {
  LayoutDashboard,
  Users,
  Server,
  FileCheck2,
  Settings,
  ArrowLeft,
  LogOut,
  X,
  ShieldCheck
} from 'lucide-react';

export function AdminSidebar({ isMobileOpen, onCloseMobile }) {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      addToast('Logged out successfully.', 'info');
      navigate('/login');
    } catch (err) {
      navigate('/login');
    }
  };

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/system', label: 'System Overview', icon: Server },
    { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileCheck2 },
    { href: '/admin/settings', label: 'Admin Settings', icon: Settings }
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      <div
        className={`admin-mobile-overlay ${isMobileOpen ? 'active' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside className={`admin-sidebar ${isMobileOpen ? 'open' : ''}`} aria-label="Admin Navigation">
        <div className="admin-sidebar-inner">
          {/* Brand Header */}
          <div className="admin-sidebar-header">
            <Link href="/admin" className="admin-brand-link" onClick={onCloseMobile} title="VegSense Admin Portal">
              <img src={markLogo} alt="VegSense" className="admin-logo-mark" width="36" height="36" />
              <div className="admin-brand-text">
                <span className="admin-brand-name">VegSense</span>
                <span className="admin-brand-portal-tag">
                  <ShieldCheck size={11} className="admin-badge-icon" />
                  <span>Admin Portal</span>
                </span>
              </div>
            </Link>

            {isMobileOpen && (
              <button
                type="button"
                className="admin-mobile-close-btn"
                onClick={onCloseMobile}
                aria-label="Close admin menu"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="admin-nav-menu">
            <div className="admin-nav-section-label">Management</div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-nav-link ${isActive ? 'active' : ''}`}
                  onClick={onCloseMobile}
                >
                  <Icon size={18} className="admin-nav-icon" />
                  <span className="admin-nav-text">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="admin-sidebar-footer">
            <Link href="/dashboard" className="admin-footer-btn back-btn" onClick={onCloseMobile} title="Return to Storage Dashboard">
              <ArrowLeft size={16} />
              <span>Back to App</span>
            </Link>

            <button type="button" className="admin-footer-btn logout-btn" onClick={handleLogout} title="Sign Out">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;
