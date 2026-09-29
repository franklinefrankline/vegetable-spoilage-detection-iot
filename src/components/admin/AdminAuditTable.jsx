import React from 'react';
import {
  FileCheck2,
  UserCheck,
  Ban,
  Trash2,
  Shield,
  Eye,
  Edit2,
  Clock,
  Layers
} from 'lucide-react';

export function AdminAuditTable({ logs = [] }) {
  const getActionBadge = (action) => {
    switch (action) {
      case 'USER_ACTIVATED':
        return (
          <span className="audit-badge badge-success">
            <UserCheck size={12} />
            <span>ACTIVATED</span>
          </span>
        );
      case 'USER_DEACTIVATED':
        return (
          <span className="audit-badge badge-warning">
            <Ban size={12} />
            <span>DEACTIVATED</span>
          </span>
        );
      case 'USER_DELETED':
        return (
          <span className="audit-badge badge-danger">
            <Trash2 size={12} />
            <span>USER DELETED</span>
          </span>
        );
      case 'BULK_USERS_DELETED':
        return (
          <span className="audit-badge badge-danger">
            <Trash2 size={12} />
            <span>BULK DELETED</span>
          </span>
        );
      case 'ROLE_CHANGED':
        return (
          <span className="audit-badge badge-purple">
            <Shield size={12} />
            <span>ROLE CHANGED</span>
          </span>
        );
      case 'USER_UPDATED':
        return (
          <span className="audit-badge badge-blue">
            <Edit2 size={12} />
            <span>USER UPDATED</span>
          </span>
        );
      case 'USER_VIEWED':
        return (
          <span className="audit-badge badge-neutral">
            <Eye size={12} />
            <span>VIEWED</span>
          </span>
        );
      default:
        return (
          <span className="audit-badge badge-neutral">
            <FileCheck2 size={12} />
            <span>{action || 'ACTION'}</span>
          </span>
        );
    }
  };

  const formatLogDate = (iso) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return iso;
    }
  };

  const renderDetails = (details) => {
    if (!details) return '—';
    if (typeof details === 'object') {
      try {
        return JSON.stringify(details);
      } catch (e) {
        return String(details);
      }
    }
    return String(details);
  };

  return (
    <div className="admin-table-container">
      <table className="admin-data-table audit-table" aria-label="Administrative Audit Logs">
        <thead>
          <tr>
            <th className="th-date">Date & Time</th>
            <th className="th-admin">Admin</th>
            <th className="th-action">Action</th>
            <th className="th-target">Target Account</th>
            <th className="th-details">Audit Details</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="admin-table-row">
              <td className="td-date">
                <div className="date-time-cell">
                  <Clock size={13} className="cell-clock-icon" />
                  <span>{formatLogDate(log.created_at)}</span>
                </div>
              </td>

              <td className="td-admin">
                <span className="admin-email-text" title={log.admin_email}>
                  {log.admin_email}
                </span>
              </td>

              <td className="td-action">
                {getActionBadge(log.action)}
              </td>

              <td className="td-target">
                <span className="target-account-text" title={log.target_user_email || log.target_user_id || 'System'}>
                  {log.target_user_email || log.target_user_id || 'System'}
                </span>
              </td>

              <td className="td-details">
                <span className="details-text" title={renderDetails(log.details)}>
                  {renderDetails(log.details)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminAuditTable;
