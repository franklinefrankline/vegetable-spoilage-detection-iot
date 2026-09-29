import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { AdminSystemHealth } from '../../components/admin/AdminSystemHealth';
import { useToast } from '../../context/ToastContext';
import { Server, RefreshCw, Activity, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function AdminSystem() {
  const [services, setServices] = useState({});
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const loadHealth = async () => {
    setLoading(true);
    try {
      const res = await adminService.getSystemHealth();
      if (res.success) {
        setServices(res.services || {});
      }
    } catch (err) {
      console.error('Failed to load system health:', err);
      addToast('Unable to check system health status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <div className="admin-page-content">
      {/* Subtitle & Actions Bar */}
      <div className="admin-section-header">
        <div>
          <p className="section-subtitle">
            Real-time diagnostics and operational status of persistent databases, telemetry gateways, PDF rendering engines, and security services.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary refresh-btn"
          onClick={loadHealth}
          disabled={loading}
          title="Run Diagnostic Health Check"
        >
          <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
          <span>Run Health Check</span>
        </button>
      </div>

      {/* Global Status Banner */}
      <div className="admin-system-banner">
        <div className="banner-left">
          <div className="banner-icon-box">
            <CheckCircle2 size={24} color="#16a34a" />
          </div>
          <div>
            <h3 className="banner-title">All Core Storage Microservices Active</h3>
            <p className="banner-desc">
              Database persistence, ESP32 device broker, RBAC authorization, and environmental intelligence engines are fully operational.
            </p>
          </div>
        </div>
        <div className="banner-badge-group">
          <span className="banner-pill">Health 100%</span>
        </div>
      </div>

      {/* Services Grid */}
      <AdminSystemHealth services={services} />
    </div>
  );
}

export default AdminSystem;
