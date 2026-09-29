import React from 'react';
import {
  Database,
  Cpu,
  ShieldCheck,
  FileText,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  Activity
} from 'lucide-react';

export function AdminSystemHealth({ services = {} }) {
  const getStatusPill = (status) => {
    const isOp = status === 'Operational';
    return (
      <span className={`service-status-pill ${isOp ? 'status-op' : 'status-warn'}`}>
        <span className="status-dot" />
        <span>{status || 'Operational'}</span>
      </span>
    );
  };

  const db = services.database || {};
  const api = services.api || {};
  const auth = services.auth || {};
  const reports = services.reports || {};
  const devices = services.devices || {};

  return (
    <div className="system-health-grid">
      {/* 1. Database Health */}
      <div className="system-health-card">
        <div className="card-top">
          <div className="service-title-group">
            <div className="service-icon-box box-green">
              <Database size={20} />
            </div>
            <div>
              <div className="service-name">{db.name || 'Database Engine'}</div>
              <div className="service-engine-type">{db.engine || 'SQLite (node:sqlite)'}</div>
            </div>
          </div>
          {getStatusPill(db.status)}
        </div>

        <div className="service-metrics-list">
          <div className="metric-row">
            <span className="metric-lbl">Total Registered Users:</span>
            <span className="metric-val">{db.records?.users ?? '—'}</span>
          </div>
          <div className="metric-row">
            <span className="metric-lbl">Sensor Readings Telemetry:</span>
            <span className="metric-val">{db.records?.sensorReadings ?? '—'}</span>
          </div>
          <div className="metric-row">
            <span className="metric-lbl">Connected Devices:</span>
            <span className="metric-val">{db.records?.devices ?? '—'}</span>
          </div>
          <div className="metric-row">
            <span className="metric-lbl">Logged Security Audits:</span>
            <span className="metric-val">{db.records?.auditLogs ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* 2. API Microservices */}
      <div className="system-health-card">
        <div className="card-top">
          <div className="service-title-group">
            <div className="service-icon-box box-blue">
              <Server size={20} />
            </div>
            <div>
              <div className="service-name">{api.name || 'REST API Microservices'}</div>
              <div className="service-engine-type">Node.js {api.nodeVersion || process.version}</div>
            </div>
          </div>
          {getStatusPill(api.status)}
        </div>

        <div className="service-metrics-list">
          <div className="metric-row">
            <span className="metric-lbl">Server Uptime:</span>
            <span className="metric-val">
              {api.uptimeSeconds ? `${Math.floor(api.uptimeSeconds / 60)} mins` : 'Active'}
            </span>
          </div>
          <div className="metric-row">
            <span className="metric-lbl">Process Memory (RSS):</span>
            <span className="metric-val">{api.memoryRssMb ? `${api.memoryRssMb} MB` : 'Normal'}</span>
          </div>
          <div className="metric-row">
            <span className="metric-lbl">Host Operating System:</span>
            <span className="metric-val">{api.platform || 'Windows'}</span>
          </div>
        </div>
      </div>

      {/* 3. Authentication & RBAC Security */}
      <div className="system-health-card">
        <div className="card-top">
          <div className="service-title-group">
            <div className="service-icon-box box-purple">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="service-name">{auth.name || 'Authentication & Security'}</div>
              <div className="service-engine-type">JWT Bearer + bcryptjs (Rounds 10)</div>
            </div>
          </div>
          {getStatusPill(auth.status)}
        </div>

        <div className="service-metrics-list">
          <div className="metric-row">
            <span className="metric-lbl">Token Expiry Window:</span>
            <span className="metric-val">7 Days</span>
          </div>
          <div className="metric-row">
            <span className="metric-lbl">Last-Admin Protection:</span>
            <span className="metric-val badge-active-pill">Enforced</span>
          </div>
          <div className="metric-row">
            <span className="metric-lbl">Self-Deletion Guard:</span>
            <span className="metric-val badge-active-pill">Enforced</span>
          </div>
        </div>
      </div>

      {/* 4. Report Engine */}
      <div className="system-health-card">
        <div className="card-top">
          <div className="service-title-group">
            <div className="service-icon-box box-amber">
              <FileText size={20} />
            </div>
            <div>
              <div className="service-name">{reports.name || 'Storage Intelligence Reports'}</div>
              <div className="service-engine-type">{reports.engine || 'Vector PDF Generation Engine'}</div>
            </div>
          </div>
          {getStatusPill(reports.status)}
        </div>

        <div className="service-metrics-list">
          <div className="metric-row">
            <span className="metric-lbl">PDF Vector Output:</span>
            <span className="metric-val">Standard A4 Layout</span>
          </div>
          <div className="metric-row">
            <span className="metric-lbl">Base64 Storage Cache:</span>
            <span className="metric-val">Ready</span>
          </div>
        </div>
      </div>

      {/* 5. Device Telemetry Gateway */}
      <div className="system-health-card">
        <div className="card-top">
          <div className="service-title-group">
            <div className="service-icon-box box-emerald">
              <Radio size={20} />
            </div>
            <div>
              <div className="service-name">{devices.name || 'ESP32 Device Gateway'}</div>
              <div className="service-engine-type">Dual-Mode Hardware & Simulation</div>
            </div>
          </div>
          {getStatusPill(devices.status)}
        </div>

        <div className="service-metrics-list">
          <div className="metric-row">
            <span className="metric-lbl">Real Hardware LAN Gateway:</span>
            <span className="metric-val">5s Timeout HTTP Poller</span>
          </div>
          <div className="metric-row">
            <span className="metric-lbl">Demo Mode Telemetry:</span>
            <span className="metric-val">Autonomous Simulation Loop</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSystemHealth;
