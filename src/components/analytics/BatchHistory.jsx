import React, { useState, useEffect } from 'react';
import {
  Package,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Activity,
  History,
  Info
} from 'lucide-react';
import { getBatchAnalytics } from '../../services/analyticsService';

export function BatchHistory({ batches, selectedBatchId, onSelectBatch }) {
  const [currentBatchId, setCurrentBatchId] = useState(selectedBatchId || (batches[0]?.id ?? ''));
  const [batchDetail, setBatchDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedBatchId) {
      setCurrentBatchId(selectedBatchId);
    } else if (batches.length > 0 && !currentBatchId) {
      setCurrentBatchId(batches[0].id);
    }
  }, [selectedBatchId, batches]);

  useEffect(() => {
    let isMounted = true;
    if (!currentBatchId) return;

    setLoading(true);
    getBatchAnalytics(currentBatchId)
      .then((data) => {
        if (isMounted) {
          setBatchDetail(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load batch analytics:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentBatchId]);

  const handleBatchChange = (e) => {
    const id = e.target.value;
    setCurrentBatchId(id);
    if (onSelectBatch) onSelectBatch(id);
  };

  const batch = batchDetail?.batch;
  const timeline = batchDetail?.timeline || [];

  return (
    <div className="vegsense-card" style={{ padding: '1.25rem', marginBottom: '1.75rem' }}>
      {/* Header & Batch Selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '1rem',
          marginBottom: '1.25rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <History size={18} color="var(--primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Batch Lifecycle & Risk Timeline
            </h2>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Inspect discrete batch chamber histories, threshold breaches, and risk progression.
          </p>
        </div>

        {/* Batch Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>SELECT BATCH:</span>
          <select
            value={currentBatchId}
            onChange={handleBatchChange}
            className="login-form-input no-left-icon"
            style={{ height: '34px', padding: '0 0.75rem', fontSize: '0.8rem', minWidth: '180px' }}
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name || `${b.vegetable_name || b.vegetable_type} Batch #${b.id}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <span className="spinner spinner-dark" style={{ marginRight: '0.5rem' }} /> Loading batch intelligence...
        </div>
      ) : !batch ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No batch selected or batch records unavailable.
        </div>
      ) : (
        <div>
          {/* Batch Information Grid (Section 30) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.85rem',
              backgroundColor: 'var(--bg-subtle)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-light)',
              marginBottom: '1.5rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>BATCH NAME</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>{batch.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{batch.vegetable_type}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>QUANTITY & LOCATION</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>{batch.quantity_kg} kg</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{batch.storage_location || 'Cold Room A'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>STORAGE / EXPIRY</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {batch.storage_date ? new Date(batch.storage_date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Exp: {batch.configured_expiry ? new Date(batch.configured_expiry).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'None'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>CURRENT RISK</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                {batch.current_risk != null ? `${batch.current_risk}%` : 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>RISK SPECTRUM (MIN/MAX)</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {batch.min_risk ?? 0}% - {batch.max_risk ?? 0}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Avg: {batch.avg_risk ?? 0}%</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>INCIDENTS</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: batch.total_alerts > 0 ? 'var(--accent-amber)' : 'var(--text-main)' }}>
                {batch.total_alerts} alerts
              </div>
            </div>
          </div>

          {/* Section 31: Batch Risk Timeline */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.85rem' }}>
              Batch Risk Timeline & Environmental Incidents
            </div>
            {timeline.length === 0 ? (
              <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                No significant telemetry events recorded for this batch yet.
              </div>
            ) : (
              <div style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {timeline.map((item, index) => {
                  let dotColor = 'var(--primary)';
                  if (item.type === 'alert') dotColor = 'var(--accent-amber)';
                  if (item.type === 'status_change') dotColor = 'var(--accent-blue, #3b82f6)';
                  if (item.type === 'creation') dotColor = 'var(--accent-green)';

                  return (
                    <div key={index} style={{ position: 'relative' }}>
                      {/* Timeline dot */}
                      <span
                        style={{
                          position: 'absolute',
                          left: '-1.85rem',
                          top: '0.15rem',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: dotColor,
                          border: '2px solid var(--bg-card)'
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {item.timestamp ? new Date(item.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {item.event}
                        </span>
                      </div>
                      {item.description && (
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
