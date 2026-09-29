import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from '../../router/Router';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminDashboard } from './AdminDashboard';
import { AdminUsers } from './AdminUsers';
import { AdminAdmins } from './AdminAdmins';
import { AdminDevices } from './AdminDevices';
import { AdminAuditLogs } from './AdminAuditLogs';
import { AdminSystem } from './AdminSystem';
import { AdminSettings } from './AdminSettings';
import { isMainAdmin, isAdmin, hasPermission } from '../../utils/adminPermissions';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import '../../components/admin/admin.css';

export function AdminPortal() {
  const { currentUser, isAuthenticated, loading } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Loading state
  if (loading) {
    return (
      <div className="admin-loading-screen">
        <span className="spinner spinner-dark" />
        <span className="loading-text">Verifying administrative credentials...</span>
      </div>
    );
  }

  // Authentication check
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  // Role verification: MAIN_ADMIN or ADMIN
  const hasAdminRole = isAdmin(currentUser);

  if (!hasAdminRole) {
    return (
      <div className="admin-forbidden-screen">
        <div className="forbidden-card">
          <div className="forbidden-icon-box">
            <ShieldAlert size={48} />
          </div>
          <h2 className="forbidden-title">Administrator Access Required</h2>
          <p className="forbidden-message">
            This area is restricted to verified system administrators. Your account ({currentUser?.email}) does not possess administrative privileges.
          </p>
          <button
            type="button"
            className="btn-primary forbidden-btn"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={16} />
            <span>Return to Application</span>
          </button>
        </div>
      </div>
    );
  }

  // Match subroute and enforce subroute permissions
  let content = <AdminDashboard />;
  let pageTitle = 'VegSense Administration';
  let pageSubtitle = 'System Management & User Administration';

  const isMain = isMainAdmin(currentUser);

  if (pathname.startsWith('/admin/admins')) {
    if (!isMain && !hasPermission(currentUser, 'admin_management')) {
      content = (
        <div className="admin-forbidden-card">
          <Lock size={36} />
          <h3>Access Denied</h3>
          <p>You do not have permission to manage administrator accounts.</p>
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin')}>
            Back to Dashboard
          </button>
        </div>
      );
    } else {
      content = <AdminAdmins />;
      pageTitle = 'Administrator Management';
      pageSubtitle = 'Create, configure, and monitor system administrator accounts and operational permissions.';
    }
  } else if (pathname.startsWith('/admin/users')) {
    if (!isMain && !hasPermission(currentUser, 'user_management')) {
      content = (
        <div className="admin-forbidden-card">
          <Lock size={36} />
          <h3>Access Denied</h3>
          <p>You do not have permission to manage user accounts.</p>
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin')}>
            Back to Dashboard
          </button>
        </div>
      );
    } else {
      content = <AdminUsers />;
      pageTitle = 'User Management';
      pageSubtitle = 'Manage registered user accounts, active status, and access rights.';
    }
  } else if (pathname.startsWith('/admin/devices')) {
    if (!isMain && !hasPermission(currentUser, 'device_management')) {
      content = (
        <div className="admin-forbidden-card">
          <Lock size={36} />
          <h3>Access Denied</h3>
          <p>You do not have permission to manage hardware devices.</p>
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin')}>
            Back to Dashboard
          </button>
        </div>
      );
    } else {
      content = <AdminDevices />;
      pageTitle = 'System Device Management';
      pageSubtitle = 'Hardware gateway registry, network addresses, and connection status.';
    }
  } else if (pathname.startsWith('/admin/audit-logs')) {
    if (!isMain && !hasPermission(currentUser, 'audit_logs')) {
      content = (
        <div className="admin-forbidden-card">
          <Lock size={36} />
          <h3>Access Denied</h3>
          <p>You do not have permission to inspect security audit logs.</p>
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin')}>
            Back to Dashboard
          </button>
        </div>
      );
    } else {
      content = <AdminAuditLogs />;
      pageTitle = 'Security Audit Logs';
      pageSubtitle = 'Immutable activity log of administrative events and access changes.';
    }
  } else if (pathname.startsWith('/admin/system')) {
    if (!isMain && !hasPermission(currentUser, 'system_settings')) {
      content = (
        <div className="admin-forbidden-card">
          <Lock size={36} />
          <h3>Access Denied</h3>
          <p>You do not have permission to view system infrastructure metrics.</p>
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin')}>
            Back to Dashboard
          </button>
        </div>
      );
    } else {
      content = <AdminSystem />;
      pageTitle = 'System Overview';
      pageSubtitle = 'Real-time telemetry and operational status of all microservices and infrastructure.';
    }
  } else if (pathname.startsWith('/admin/settings')) {
    if (!isMain && !hasPermission(currentUser, 'system_settings')) {
      content = (
        <div className="admin-forbidden-card">
          <Lock size={36} />
          <h3>Access Denied</h3>
          <p>You do not have permission to modify system settings.</p>
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin')}>
            Back to Dashboard
          </button>
        </div>
      );
    } else {
      content = <AdminSettings />;
      pageTitle = 'System & Security Settings';
      pageSubtitle = 'Manage application configuration, security parameters, and maintenance.';
    }
  }

  return (
    <div className="admin-portal-shell">
      {/* Fixed Left Sidebar Navigation */}
      <AdminSidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Administrative Layout Panel */}
      <div className="admin-portal-main">
        {/* Global Admin Header */}
        <AdminHeader
          title={pageTitle}
          subtitle={pageSubtitle}
          onToggleMobile={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* Main Routed Content Area */}
        <main className="admin-portal-content">
          {content}
        </main>
      </div>
    </div>
  );
}

export default AdminPortal;
