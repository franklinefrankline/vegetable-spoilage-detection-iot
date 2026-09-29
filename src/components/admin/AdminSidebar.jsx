import React from 'react';
import { Link, useNavigate, useLocation } from '../../router/Router';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isMainAdmin, hasPermission } from '../../utils/adminPermissions';
import markLogo from '../../assets/vegsense-mark.png';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Cpu,
  Boxes,
  Activity,
  AlertTriangle,
  Bell,
  BarChart3,
  FileText,
  Server,
  FileCheck2,
  Settings,
  ArrowLeft,
  LogOut,
  X
} from 'lucide-react';

export function AdminSidebar({ isMobileOpen, onCloseMobile }) {
  const { pathname } = useLocation();
  const { currentUser, logout } = useAuth();
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

  const isMain = isMainAdmin(currentUser);

  // Define sidebar menu items matching Section 8
  const allNavItems = [
    {
      id: 'dashboard',
      href: '/admin',
      label: 'Dashboard',
      icon: LayoutDashboard,
      exact: true,
      visible: true
    },
    {
      id: 'user_management',
      href: '/admin/users',
      label: 'User Management',
      icon: Users,
      visible: isMain || hasPermission(currentUser, 'user_management')
    },
    {
      id: 'admin_management',
      href: '/admin/admins',
      label: 'Admin Management',
      icon: ShieldCheck,
      visible: isMain || hasPermission(currentUser, 'admin_management')
    },
    {
      id: 'device_management',
      href: '/admin/devices',
      label: 'Device Management',
      icon: Cpu,
      visible: isMain || hasPermission(currentUser, 'device_management')
    },
    {
      id: 'storage_management',
      href: '/storage',
      label: 'Storage Management',
      icon: Boxes,
      visible: isMain || hasPermission(currentUser, 'storage_management')
    },
    {
      id: 'sensor_monitoring',
      href: '/sensors',
      label: 'Sensor Monitoring',
      icon: Activity,
      visible: isMain || hasPermission(currentUser, 'sensor_monitoring')
    },
    {
      id: 'spoilage_monitoring',
      href: '/spoilage',
      label: 'Spoilage Monitoring',
      icon: AlertTriangle,
      visible: isMain || hasPermission(currentUser, 'spoilage_monitoring')
    },
    {
      id: 'alert_management',
      href: '/alerts',
      label: 'Alerts',
      icon: Bell,
      visible: isMain || hasPermission(currentUser, 'alert_management')
    },
    {
      id: 'analytics',
      href: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
      visible: isMain || hasPermission(currentUser, 'analytics')
    },
    {
      id: 'reports',
      href: '/reports',
      label: 'Reports',
      icon: FileText,
      visible: isMain || hasPermission(currentUser, 'reports')
    },
    {
      id: 'system_overview',
      href: '/admin/system',
      label: 'System Overview',
      icon: Server,
      visible: isMain || hasPermission(currentUser, 'system_settings')
    },
    {
      id: 'audit_logs',
      href: '/admin/audit-logs',
      label: 'Audit Logs',
      icon: FileCheck2,
      visible: isMain || hasPermission(currentUser, 'audit_logs')
    },
    {
      id: 'settings',
      href: '/admin/settings',
      label: 'Settings',
      icon: Settings,
      visible: isMain || hasPermission(currentUser, 'system_settings')
    }
  ];

  const visibleNavItems = allNavItems.filter((item) => item.visible);

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`admin-mobile-overlay ${isMobileOpen ? 'active' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside className={`admin-sidebar ${isMobileOpen ? 'open' : ''}`} aria-label="Admin Navigation">
        <div className="admin-sidebar-inner">
          {/* Brand Header */}
          <div className="admin-sidebar-header">
            <Link href="/admin" className="admin-brand-link" onClick={onCloseMobile} title="VegSense Administration">
              <img src={markLogo} alt="VegSense" className="admin-logo-mark" width="34" height="34" />
              <div className="admin-brand-text">
                <span className="admin-brand-name">VegSense</span>
                <span className="admin-brand-portal-tag">
                  <ShieldCheck size={11} className="admin-badge-icon" />
                  <span>Administration</span>
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
            <div className="admin-nav-section-label">Enterprise Navigation</div>
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact ? pathname === item.href : pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`admin-nav-link ${isActive ? 'active' : ''}`}
                  onClick={onCloseMobile}
                >
                  <Icon size={17} className="admin-nav-icon" />
                  <span className="admin-nav-text">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="admin-sidebar-footer">
            <Link href="/dashboard" className="admin-footer-btn back-btn" onClick={onCloseMobile} title="Back to Application">
              <ArrowLeft size={16} />
              <span>Back to Application</span>
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
