import React from 'react';
import { Users, SearchX, FileCheck2, RefreshCw } from 'lucide-react';

export function AdminEmptyState({
  type = 'users',
  title,
  message,
  actionLabel,
  onAction
}) {
  const getDefaultContent = () => {
    switch (type) {
      case 'search':
        return {
          icon: SearchX,
          defaultTitle: 'No Matching Accounts',
          defaultMessage: 'No user accounts match your current search query or filter criteria.'
        };
      case 'audit':
        return {
          icon: FileCheck2,
          defaultTitle: 'No Audit Logs Recorded',
          defaultMessage: 'No administrative security events or audit trails found.'
        };
      case 'users':
      default:
        return {
          icon: Users,
          defaultTitle: 'No User Accounts Found',
          defaultMessage: 'There are currently no registered user accounts stored in the database.'
        };
    }
  };

  const { icon: Icon, defaultTitle, defaultMessage } = getDefaultContent();

  return (
    <div className="admin-empty-state-card">
      <div className="empty-state-icon-box">
        <Icon size={32} />
      </div>
      <h3 className="empty-state-title">{title || defaultTitle}</h3>
      <p className="empty-state-message">{message || defaultMessage}</p>

      {onAction && (
        <button type="button" className="btn-secondary empty-action-btn" onClick={onAction}>
          <RefreshCw size={14} />
          <span>{actionLabel || 'Reset Filters'}</span>
        </button>
      )}
    </div>
  );
}

export default AdminEmptyState;
