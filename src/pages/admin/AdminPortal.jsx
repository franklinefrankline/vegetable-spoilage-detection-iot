import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from '../../router/Router';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminDashboard } from './AdminDashboard';
import { AdminUsers } from './AdminUsers';
import { AdminAuditLogs } from './AdminAuditLogs';
import { AdminSystem } from './AdminSystem';
import { AdminSettings } from './AdminSettings';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
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

  // Section 57: Admin Route Protection Guard
  const isAdminUser = currentUser?.role === 'ADMIN';

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (!isAdminUser) {
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

  // Match subroute title & active page
  let content = <AdminDashboard />;
  let pageTitle = 'Admin Dashboard';
  let pageSubtitle = 'Monitor users, accounts, devices and system activity.';

  if (pathname.startsWith('/admin/users')) {
    content = <AdminUsers />;
    pageTitle = 'User Management';
    pageSubtitle = 'Manage registered accounts, access status and user permissions.';
  } else if (pathname.startsWith('/admin/audit-logs')) {
    content = <AdminAuditLogs />;
    pageTitle = 'Security Audit Logs';
    pageSubtitle = 'Immutable activity log of administrative events and access changes.';
  } else if (pathname.startsWith('/admin/system')) {
    content = <AdminSystem />;
    pageTitle = 'System Infrastructure';
    pageSubtitle = 'Real-time telemetry and operational status of all microservices.';
  } else if (pathname.startsWith('/admin/settings')) {
    content = <AdminSettings />;
    pageTitle = 'Administrator Settings';
    pageSubtitle = 'Manage profile credentials, system access, and security.';
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
