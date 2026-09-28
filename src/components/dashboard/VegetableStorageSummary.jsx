import React from 'react';
import { useNavigate } from '../../router/Router';
import {
  Package,
  PlusCircle,
  Thermometer,
  Droplets,
  Wind,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { formatTemperature, formatHumidity, formatGas, formatSpoilageRisk } from '../../utils/sensorFormatter';

export function VegetableStorageSummary({
  activeStorage = null,
  currentSensorData = null,
  isOffline = false
}) {
  const navigate = useNavigate();

  return (
    <div className="vegsense-card current-storage-summary-card">
      <div className="card-header-row" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="card-badge-icon badge-icon-mint">
            <Package size={18} />
          </div>
          <div>
            <h3 className="card-title" style={{ fontSize: '1.05rem', margin: 0 }}>Current Storage</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Atmospheric Batch Association</span>
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
        /* Empty State: Section 21 Explicit Requirement */
        <div className="storage-empty-state">
          <div className="storage-empty-icon-circle">
            <Package size={26} color="var(--text-muted)" />
          </div>
          <span className="storage-empty-title">No vegetable selected</span>
          <p className="storage-empty-desc">
            Associate this storage bay with a crop variety to enable custom spoilage detection models.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/storage')}
            style={{ marginTop: '0.75rem', height: '38px', padding: '0 1.25rem', fontSize: '0.85rem' }}
          >
            <PlusCircle size={15} />
            <span>Add Storage</span>
          </button>
        </div>
      ) : (
        /* Active Vegetable Details with Live Sensor Overlay */
        <div className="active-vegetable-block">
          <div className="active-veg-header">
            <div>
              <h4 className="active-veg-name">{activeStorage.name || activeStorage.vegetable_name}</h4>
              <span className="active-veg-variety">
                {activeStorage.variety ? `Variety: ${activeStorage.variety}` : 'Monitored Crop Batch'}
              </span>
            </div>
            <span className="active-veg-status-tag">
              {isOffline ? 'OFFLINE' : (currentSensorData?.status || 'FRESH')}
            </span>
          </div>

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
              <span className="cell-label">Spoilage Risk</span>
              <span className="cell-val" style={{ color: 'var(--primary)' }}>
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
