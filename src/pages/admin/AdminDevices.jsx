import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AdminTableSkeleton } from '../../components/admin/AdminSkeleton';
import {
  Cpu,
  Search,
  RefreshCw,
  Wifi,
  WifiOff,
  User,
  Calendar,
  Clock,
  Radio,
  CheckCircle,
  AlertCircle,
  Filter,
  X
} from 'lucide-react';

export function AdminDevices() {
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getDevices({
        search,
        status: statusFilter
      });
      if (res.success) {
        setDevices(res.devices || []);
      }
    } catch (err) {
      console.error('Failed to load system devices:', err);
      addToast(err.message || 'Failed to load system hardware devices.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, addToast]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

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

  return (
    <div className="admin-page-content">
      {/* Header */}
      <div className="admin-section-header">
        <div>
          <h2 className="admin-section-title">System Device Management</h2>
          <p className="section-subtitle">
            System-level registry of configured ESP32 hardware gateways and simulated telemetry devices.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary refresh-btn"
          onClick={loadDevices}
          disabled={loading}
          title="Refresh Devices"
        >
          <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-toolbar-card">
        <div className="toolbar-search-col">
          <div className="admin-search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="admin-search-input-styled"
              placeholder="Search by device name, ID, or owner email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="toolbar-filters-col">
          <div className="filter-select-wrapper">
            <Filter size={14} className="select-icon" />
            <select
              className="admin-select-field toolbar-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Devices</option>
              <option value="CONNECTED">Online / Connected</option>
              <option value="DISCONNECTED">Offline / Disconnected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Devices Table */}
      {loading && devices.length === 0 ? (
        <AdminTableSkeleton />
      ) : (
        <div className="admin-table-container">
          <table className="admin-data-table" aria-label="System Hardware Devices">
            <thead>
              <tr>
                <th>DEVICE NAME</th>
                <th>DEVICE ID</th>
                <th>MODE</th>
                <th>STATUS</th>
                <th>IP ADDRESS</th>
                <th>OWNER</th>
                <th>PROVISIONED</th>
                <th>LAST SEEN</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-empty-td">
                    No hardware devices found matching query.
                  </td>
                </tr>
              ) : (
                devices.map((device) => {
                  const isOnline = device.status === 'connected';
                  const isSimulated = String(device.id || '').toLowerCase().includes('demo') ||
                                      String(device.device_name || '').toLowerCase().includes('demo');

                  return (
                    <tr key={device.id}>
                      {/* DEVICE NAME */}
                      <td>
                        <div className="device-name-cell">
                          <Cpu size={16} className="device-icon" />
                          <strong className="user-name-text">{device.device_name || 'ESP32 Gateway'}</strong>
                        </div>
                      </td>

                      {/* DEVICE ID */}
                      <td>
                        <span className="monospace-text device-id-tag">{device.id}</span>
                      </td>

                      {/* MODE */}
                      <td>
                        <span className={`badge-mode ${isSimulated ? 'mode-demo' : 'mode-hardware'}`}>
                          {isSimulated ? 'SIMULATED' : 'HARDWARE LAN'}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td>
                        <span className={`badge-device-status ${isOnline ? 'status-online' : 'status-offline'}`}>
                          {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
                          <span>{isOnline ? 'CONNECTED' : 'OFFLINE'}</span>
                        </span>
                      </td>

                      {/* IP */}
                      <td>
                        <span className="monospace-text ip-text">
                          {device.ip_address || '192.168.1.100'}
                        </span>
                      </td>

                      {/* OWNER */}
                      <td>
                        <div className="device-owner-cell">
                          <span className="owner-name">{device.owner_name || 'System Admin'}</span>
                          <span className="owner-email monospace-text">{device.owner_email || 'n/a'}</span>
                        </div>
                      </td>

                      {/* CREATED */}
                      <td>
                        <span className="date-text">{formatDate(device.created_at)}</span>
                      </td>

                      {/* LAST SEEN */}
                      <td>
                        <span className="date-text">{formatDate(device.last_connected)}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminDevices;
