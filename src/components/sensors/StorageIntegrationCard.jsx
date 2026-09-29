import React, { useState, useEffect } from 'react';
import {
  Package,
  Layers,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  ShieldCheck,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { fetchStorageItems, getActiveStorage, VEGETABLE_PRESETS } from '../../services/storageService';
import { useNavigate } from '../../router/Router';

export function StorageIntegrationCard({
  sensorData,
  activeBatch,
  onSelectBatch
}) {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  useEffect(() => {
    async function loadBatches() {
      try {
        const active = getActiveStorage();
        const items = await fetchStorageItems();
        if (items && items.length > 0) {
          setBatches(items);
          setSelectedBatchId(active?.id || items[0].id);
        } else if (active) {
          setBatches([active]);
          setSelectedBatchId(active.id);
        } else {
          // Fallback default batch per Section 34
          const defaultBatch = {
            id: 'v_tomato_a',
            name: 'Tomato',
            variety: 'Batch A',
            quantity: '25 kg',
            status: 'FRESH'
          };
          setBatches([defaultBatch]);
          setSelectedBatchId(defaultBatch.id);
        }
      } catch (e) {
        console.warn('Could not load storage items:', e);
      }
    }
    loadBatches();
  }, []);

  const currentBatch = batches.find((b) => b.id === selectedBatchId) || batches[0] || {
    id: 'v1',
    name: 'Tomato',
    variety: 'Batch A',
    quantity: '20 kg',
    status: 'FRESH'
  };

  const temp = sensorData?.temperature != null ? Number(sensorData.temperature).toFixed(1) : '28.5';
  const hum = sensorData?.humidity != null ? Math.round(sensorData.humidity) : '72';
  const gas = sensorData?.gasLevel ?? sensorData?.gasVOC ?? 420;
  const light = sensorData?.lightLevel != null ? Math.round(sensorData.lightLevel) : 420;
  const risk = sensorData?.spoilageRisk ?? 18;
  const status = sensorData?.status || 'FRESH';

  return (
    <div
      className="vegsense-storage-integration-card"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981'
          }}>
            <Package size={18} />
          </div>
          <div>
            <h2 style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              margin: '0 0 2px 0',
              letterSpacing: '-0.01em'
            }}>
              Current Storage Linkage
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              Live microclimate telemetry mapped to monitored produce
            </p>
          </div>
        </div>

        {/* Batch Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {batches.length > 1 && (
            <select
              value={selectedBatchId || ''}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                if (onSelectBatch) onSelectBatch(e.target.value);
              }}
              style={{
                background: 'var(--bg-card-subtle)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '0.4rem 0.75rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name || b.vegetable_name} {b.variety ? `(${b.variety})` : ''}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => navigate('/storage')}
            className="btn btn-sm btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8rem',
              padding: '0.4rem 0.8rem'
            }}
          >
            <span>Manage Storage</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Produce Batch Header & Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        background: 'var(--bg-card-subtle)',
        borderRadius: '8px',
        border: '1px solid var(--border-light)',
        marginBottom: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {currentBatch.name || currentBatch.vegetable_name || 'Tomato'} {currentBatch.variety || 'Batch A'}
          </span>
          {currentBatch.quantity && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
              {currentBatch.quantity}
            </span>
          )}
        </div>

        <span style={{
          fontSize: '0.8rem',
          fontWeight: 800,
          padding: '3px 10px',
          borderRadius: '6px',
          backgroundColor: status === 'FRESH' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
          color: status === 'FRESH' ? '#10b981' : '#f59e0b',
          border: `1px solid ${status === 'FRESH' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
        }}>
          {status}
        </span>
      </div>

      {/* 5 Linked Parameters (Section 34) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '0.6rem',
        textAlign: 'center'
      }}>
        <div style={{ padding: '0.6rem', background: 'var(--bg-card-subtle)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Temperature</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>{temp} °C</div>
        </div>
        <div style={{ padding: '0.6rem', background: 'var(--bg-card-subtle)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Humidity</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>{hum} %</div>
        </div>
        <div style={{ padding: '0.6rem', background: 'var(--bg-card-subtle)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Gas/VOC</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>{gas}</div>
        </div>
        <div style={{ padding: '0.6rem', background: 'var(--bg-card-subtle)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Light</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>{light} lux</div>
        </div>
        <div style={{ padding: '0.6rem', background: 'var(--bg-card-subtle)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Spoilage Risk</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>{risk} %</div>
        </div>
      </div>
    </div>
  );
}
