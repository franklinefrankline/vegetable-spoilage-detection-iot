import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { AdminStatCard } from '../../components/admin/AdminStatCard';
import { AdminActivity } from '../../components/admin/AdminActivity';
import { AdminCardsSkeleton } from '../../components/admin/AdminSkeleton';
import { useNavigate } from '../../router/Router';
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Radio,
  Wifi,
  WifiOff,
  UserPlus,
  ArrowRight,
  TrendingUp,
  PieChart as PieIcon,
  RefreshCw,
  Eye
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trendRange, setTrendRange] = useState('30d'); // '7d' | '30d' | '90d' | '1y'
  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getDashboardStats();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Unable to load dashboard statistics.');
      addToast('Failed to load admin dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = data?.stats || {};
  const trendData = data?.registrationTrend?.[trendRange] || [];
  const accountStatus = data?.accountStatus || { active: 0, inactive: 0 };
  const recentUsers = data?.recentUsers || [];
  const recentActivity = data?.recentActivity || [];

  const totalStatusAccounts = accountStatus.active + accountStatus.inactive;
  const activePercent = totalStatusAccounts > 0 ? Math.round((accountStatus.active / totalStatusAccounts) * 100) : 100;
  const inactivePercent = totalStatusAccounts > 0 ? 100 - activePercent : 0;

  return (
    <div className="admin-page-content">
      {/* Page Header */}
      <div className="admin-section-header">
        <div>
          <h2 className="section-title">Admin Dashboard</h2>
          <p className="section-subtitle">
            Enterprise overview of registered accounts, hardware devices, and system activity.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary refresh-btn"
          onClick={fetchDashboardData}
          disabled={loading}
          title="Refresh Statistics"
        >
          <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="admin-page-error-banner">
          <p>{error}</p>
          <button type="button" className="btn-secondary" onClick={fetchDashboardData}>
            Retry
          </button>
        </div>
      )}

      {loading && !data ? (
        <AdminCardsSkeleton count={4} />
      ) : (
        <>
          {/* Primary Metric Summary Cards */}
          <div className="admin-stats-grid">
            <AdminStatCard
              title="Total Registered Users"
              value={stats.totalUsers}
              subtitle="All persistent accounts"
              icon={Users}
              color="primary"
            />

            <AdminStatCard
              title="Active Accounts"
              value={stats.activeUsers}
              subtitle={`${activePercent}% of total directory`}
              icon={UserCheck}
              color="emerald"
            />

            <AdminStatCard
              title="Inactive Accounts"
              value={stats.inactiveUsers}
              subtitle="Deactivated by administration"
              icon={UserX}
              color="amber"
            />

            <AdminStatCard
              title="Administrators"
              value={stats.administrators}
              subtitle="Full system authority"
              icon={Shield}
              color="purple"
            />
          </div>

          {/* Secondary Metric Summary Cards */}
          <div className="admin-stats-grid secondary-grid">
            <AdminStatCard
              title="Connected ESP32 Devices"
              value={stats.totalDevices}
              subtitle="Hardware gateways configured"
              icon={Radio}
              color="neutral"
            />

            <AdminStatCard
              title="Online Gateways"
              value={stats.onlineDevices}
              subtitle="Active telemetry streaming"
              icon={Wifi}
              color="emerald"
            />

            <AdminStatCard
              title="Offline Gateways"
              value={stats.offlineDevices}
              subtitle="Pending reconnection"
              icon={WifiOff}
              color="amber"
            />

            <AdminStatCard
              title="New Users Today"
              value={stats.newUsersToday}
              subtitle={`${stats.newUsersThisWeek || 0} this week`}
              icon={UserPlus}
              color="blue"
            />
          </div>

          {/* Charts Row: Registration Trend & Account Status Breakdown */}
          <div className="dashboard-charts-grid">
            {/* Chart 1: Real Database Registration Trend */}
            <div className="dashboard-chart-card">
              <div className="chart-card-header">
                <div className="chart-title-group">
                  <TrendingUp size={18} className="chart-icon" />
                  <div>
                    <h3 className="chart-title">User Registration Trend</h3>
                    <p className="chart-desc">Historical user onboarding activity over time</p>
                  </div>
                </div>

                <div className="chart-time-tabs">
                  {['7d', '30d', '90d', '1y'].map((range) => (
                    <button
                      key={range}
                      type="button"
                      className={`time-tab-btn ${trendRange === range ? 'active' : ''}`}
                      onClick={() => setTrendRange(range)}
                    >
                      {range.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="chart-canvas-container">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="userTrendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--border-light)' }}
                        tickFormatter={(v) => {
                          const parts = v.split('-');
                          return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : v;
                        }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-light)',
                          borderRadius: '8px',
                          color: 'var(--text-main)',
                          fontSize: '12px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Registrations"
                        stroke="var(--primary)"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#userTrendGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-chart-notice">No registration records in this range.</div>
                )}
              </div>
            </div>

            {/* Chart 2: Account Status Ratio */}
            <div className="dashboard-chart-card status-ratio-card">
              <div className="chart-card-header">
                <div className="chart-title-group">
                  <PieIcon size={18} className="chart-icon" />
                  <div>
                    <h3 className="chart-title">Account Access Status</h3>
                    <p className="chart-desc">Active vs Deactivated directory breakdown</p>
                  </div>
                </div>
              </div>

              <div className="status-ratio-body">
                <div className="ratio-visual-bar">
                  <div
                    className="bar-segment active-bar"
                    style={{ width: `${activePercent}%` }}
                    title={`Active: ${accountStatus.active} (${activePercent}%)`}
                  />
                  <div
                    className="bar-segment inactive-bar"
                    style={{ width: `${inactivePercent}%` }}
                    title={`Inactive: ${accountStatus.inactive} (${inactivePercent}%)`}
                  />
                </div>

                <div className="status-ratio-legend">
                  <div className="legend-item">
                    <span className="legend-color-dot dot-active" />
                    <div className="legend-info">
                      <div className="legend-label">Active Users</div>
                      <div className="legend-count">{accountStatus.active} accounts ({activePercent}%)</div>
                    </div>
                  </div>

                  <div className="legend-item">
                    <span className="legend-color-dot dot-inactive" />
                    <div className="legend-info">
                      <div className="legend-label">Inactive Users</div>
                      <div className="legend-count">{accountStatus.inactive} accounts ({inactivePercent}%)</div>
                    </div>
                  </div>
                </div>

                <div className="status-security-note">
                  Deactivated accounts are denied login access while preserving historical sensor data and audit logs.
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Dual Grid: Recent Users & Recent Admin Activity */}
          <div className="dashboard-bottom-grid">
            {/* Recent Registered Users */}
            <div className="dashboard-sub-card">
              <div className="sub-card-header">
                <h3 className="sub-card-title">Recently Registered Users</h3>
                <button
                  type="button"
                  className="sub-card-link-btn"
                  onClick={() => navigate('/admin/users')}
                >
                  <span>Manage All</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="recent-users-list">
                {recentUsers.length === 0 ? (
                  <div className="empty-sub-card-msg">No recent users.</div>
                ) : (
                  recentUsers.map((u) => {
                    const isAdmin = u.role === 'ADMIN';
                    const isActive = u.is_active === 1 || u.is_active === undefined;
                    return (
                      <div key={u.id} className="recent-user-row" onClick={() => navigate('/admin/users')}>
                        <div className={`recent-user-avatar ${isAdmin ? 'avatar-admin' : ''}`}>
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="recent-user-meta">
                          <div className="recent-user-name">{u.name}</div>
                          <div className="recent-user-email">{u.email}</div>
                        </div>
                        <div className="recent-user-badges">
                          <span className={`badge-role ${isAdmin ? 'role-admin' : 'role-user'}`}>
                            {u.role || 'USER'}
                          </span>
                          <span className={`badge-status ${isActive ? 'status-active' : 'status-inactive'}`}>
                            {isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Recent Administrative Activity */}
            <div className="dashboard-sub-card">
              <div className="sub-card-header">
                <h3 className="sub-card-title">Recent Administrative Activity</h3>
                <button
                  type="button"
                  className="sub-card-link-btn"
                  onClick={() => navigate('/admin/audit-logs')}
                >
                  <span>View All Logs</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="recent-activity-container">
                <AdminActivity activities={recentActivity} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
