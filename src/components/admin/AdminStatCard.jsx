import React from 'react';

export function AdminStatCard({ title, value, subtitle, icon: Icon, trend, color = 'primary' }) {
  return (
    <div className={`admin-stat-card card-color-${color}`}>
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        {Icon && (
          <div className="stat-card-icon-wrapper">
            <Icon size={18} />
          </div>
        )}
      </div>

      <div className="stat-card-body">
        <div className="stat-card-value">{value !== undefined ? value : '—'}</div>
        {(subtitle || trend) && (
          <div className="stat-card-footer">
            {trend && (
              <span className={`stat-card-trend ${trend.type === 'positive' ? 'trend-up' : trend.type === 'negative' ? 'trend-down' : 'trend-neutral'}`}>
                {trend.text}
              </span>
            )}
            {subtitle && <span className="stat-card-subtitle">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminStatCard;
