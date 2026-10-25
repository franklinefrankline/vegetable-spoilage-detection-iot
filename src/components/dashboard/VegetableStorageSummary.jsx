import React from 'react';
import { useNavigate } from '../../router/Router';
import {
  Package,
  PlusCircle,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { formatTemperature, formatHumidity, formatGas, formatSpoilageRisk } from '../../utils/sensorFormatter';
import { VegetableImage } from '../common/VegetableImage';

export function VegetableStorageSummary({
  activeStorage = null,
  currentSensorData = null,
  isOffline = false
}) {
  const navigate = useNavigate();

  const vegName = activeStorage?.vegetable_name || activeStorage?.name || 'Monitored Produce';
  const variety = activeStorage?.variety || '';
  const quantity = activeStorage?.quantity || '';
  const chamber = activeStorage?.storage_chamber || 'Cold Chamber #04';

  return (
    <div className="vegsense-card current-storage-summary-card">
      <div className="card-header-row" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="card-badge-icon badge-icon-mint">
            <Package size={18} />
          </div>
          <div>
            <h3 className="card-title" style={{ fontSize: '1.05rem', margin: 0 }}>Current Storage</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Atmospheric Crop Monitoring</span>
          </div>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate('/storage')}
          style={{ height: '34px', padding: '0 0.85rem', fontSize: '0.8rem' }}
        >
          {activeStorage ? 'Manage Storage' : '+ Add Storage'}
        </button>
      </div>

      {!activeStorage ? (
        /* Empty State with Visual Illustration */
        <div className="storage-empty-state" style={{ padding: '1.5rem 1rem', textAlign: 'center' }}>
          <div style={{ width: '90px', margin: '0 auto 0.75rem', borderRadius: '16px', overflow: 'hidden' }}>
            <VegetableImage item="generic" aspectRatio="1/1" />
          </div>
          <h4 style={{ fontSize: '1.05rem', margin: '0 0 0.25rem', color: 'var(--text-main)', fontWeight: 700 }}>
            No Storage Batches
          </h4>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0 auto 1rem', maxWidth: '300px' }}>
            Add your first vegetable batch to monitor freshness and reduce spoilage risk.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/storage')}
            style={{ height: '38px', padding: '0 1.25rem', fontSize: '0.85rem' }}
          >
            <PlusCircle size={15} />
            <span>Add Storage</span>
          </button>
        </div>
      ) : (
        /* Active Vegetable Details with Dynamic Crop Image */
        <div className="active-vegetable-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {/* Dynamic Crop Image (Requirement 14 & 18) */}
            <div style={{ width: '84px', height: '84px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}>
              <VegetableImage item={activeStorage} aspectRatio="1/1" />
            </div>

            <div style={{ flex: 1, minWidth: '160px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  {vegName}
                </h4>
                <span
                  style={{
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: isOffline ? 'var(--bg-subtle)' : 'rgba(22, 163, 74, 0.12)',
                    color: isOffline ? 'var(--text-muted)' : 'var(--status-green)',
                    border: `1px solid ${isOffline ? 'var(--border-light)' : 'rgba(22, 163, 74, 0.25)'}`
                  }}
                >
                  {isOffline ? 'OFFLINE' : (currentSensorData?.status || 'FRESH')}
                </span>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {variety && <span>{variety}</span>}
                {variety && quantity && <span>•</span>}
                {quantity && <strong style={{ color: 'var(--text-main)' }}>{quantity}</strong>}
                <span>•</span>
                <span>{chamber}</span>
              </div>
            </div>
          </div>

          {/* Compact Telemetry Metrics Grid (Requirement 12: Less text, more visual data) */}
          <div className="active-veg-metrics-grid">
            <div className="veg-metric-cell">
              <span className="cell-label">Temperature</span>
              <span className="cell-val">
                {isOffline ? '--' : formatTemperature(currentSensorData?.temperature)}
              </span>
            </div>

            <div className="veg-metric-cell">
              <span className="cell-label">Humidity</span>
              <span className="cell-val">
                {isOffline ? '--' : formatHumidity(currentSensorData?.humidity)}
              </span>
            </div>

            <div className="veg-metric-cell">
              <span className="cell-label">Gas / VOC</span>
              <span className="cell-val">
                {isOffline ? '--' : formatGas(currentSensorData?.gasLevel ?? currentSensorData?.gasVOC)}
              </span>
            </div>

            <div className="veg-metric-cell">
              <span className="cell-label">Light</span>
              <span className="cell-val">
                {isOffline ? '--' : currentSensorData?.lightLevel != null ? `${currentSensorData.lightLevel} lux` : '420 lux'}
              </span>
            </div>

            <div className="veg-metric-cell" style={{ gridColumn: 'span 2' }}>
              <span className="cell-label">Environmental Risk</span>
              <span className="cell-val" style={{ color: 'var(--primary)', fontWeight: 800 }}>
                {isOffline ? '--' : formatSpoilageRisk(currentSensorData?.spoilageRisk)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VegetableStorageSummary;
