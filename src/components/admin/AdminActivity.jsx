import React from 'react';
import {
  UserCheck,
  Ban,
  Trash2,
  Shield,
  Edit2,
  FileCheck2,
  Clock
} from 'lucide-react';

export function AdminActivity({ activities = [] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="admin-empty-activity">
        <FileCheck2 size={24} className="empty-icon" />
        <p>No recent administrative activity recorded.</p>
      </div>
    );
  }

  const getActivityIcon = (action) => {
    switch (action) {
      case 'USER_ACTIVATED':
        return <UserCheck size={14} color="var(--primary)" />;
      case 'USER_DEACTIVATED':
        return <Ban size={14} color="var(--accent-amber)" />;
      case 'USER_DELETED':
      case 'BULK_USERS_DELETED':
        return <Trash2 size={14} color="var(--accent-red)" />;
      case 'ROLE_CHANGED':
        return <Shield size={14} color="var(--accent-blue)" />;
      case 'USER_UPDATED':
        return <Edit2 size={14} color="var(--accent-cyan)" />;
      default:
        return <FileCheck2 size={14} color="var(--text-muted)" />;
    }
  };

  const formatRelativeTime = (iso) => {
    if (!iso) return 'Just now';
    try {
      const d = new Date(iso);
      const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return iso;
    }
  };

  return (
    <div className="admin-activity-timeline">
      {activities.map((act) => (
        <div key={act.id} className="timeline-item">
          <div className="timeline-icon-box">
            {getActivityIcon(act.action)}
          </div>
          <div className="timeline-content">
            <div className="timeline-title-row">
              <span className="timeline-action-name">{act.action?.replace(/_/g, ' ')}</span>
              <span className="timeline-time">
                <Clock size={11} />
                <span>{formatRelativeTime(act.created_at)}</span>
              </span>
            </div>
            <div className="timeline-desc">
              By <strong className="admin-name">{act.admin_email}</strong> on{' '}
              <span className="target-name">{act.target_user_email || 'System'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminActivity;
