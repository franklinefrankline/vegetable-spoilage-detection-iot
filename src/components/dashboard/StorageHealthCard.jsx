import React from 'react';
import { HeartPulse, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { calculateStorageHealth } from '../../utils/sensorFormatter';

export function StorageHealthCard({
  spoilageRisk = 18,
  status = 'FRESH',
  isOffline = false
}) {
  const healthScore = isOffline ? 0 : calculateStorageHealth(spoilageRisk);
  const healthLabel = healthScore >= 70 ? 'Fresh Condition' : healthScore >= 40 ? 'Moderate Condition' : 'At-Risk Condition';

  return (
    <div className="vegsense-card storage-health-card">
      <div className="card-header-row" style={{ marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="card-badge-icon badge-icon-mint">
            <HeartPulse size={18} />
          </div>
          <div>
            <h4 className="card-title" style={{ fontSize: '0.975rem', margin: 0 }}>Storage Health</h4>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Formula: 100 - Spoilage Risk</span>
          </div>
        </div>

        <span className="storage-health-score-text">
          {isOffline ? '--' : `${healthScore}%`}
        </span>
      </div>

      {/* Progress Track */}
      <div className="storage-health-progress-track">
        <div
          className="storage-health-progress-fill"
          style={{
            width: `${isOffline ? 0 : healthScore}%`,
            backgroundColor: healthScore >= 70 ? 'var(--status-green, #16a34a)' : healthScore >= 40 ? 'var(--status-yellow, #eab308)' : 'var(--status-red, #ef4444)'
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.785rem' }}>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
          {isOffline ? 'Device Offline' : healthLabel}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          Atmosphere: <strong style={{ color: 'var(--text-main)' }}>{isOffline ? 'Unknown' : status}</strong>
        </span>
      </div>
    </div>
  );
}
export default StorageHealthCard;
