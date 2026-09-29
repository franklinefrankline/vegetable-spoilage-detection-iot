import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from '../router/Router';
import {
  fetchStorageItems,
  createStorageItem,
  updateStorageItem,
  deleteStorageItem,
  activateStorageBatch,
  calculateVegetableCondition,
  VEGETABLE_PRESETS
} from '../services/storageService';
import {
  Boxes,
  Plus,
  Thermometer,
  Droplets,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Search,
  X,
  Sparkles,
  Radio,
  Cpu,
  Zap,
  RotateCcw,
  Edit2,
  Trash2,
  Eye,
  Activity,
  Calendar,
  Layers,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Clock,
  Check
} from 'lucide-react';

export function VegetableStoragePage() {
  const { currentUser, token } = useAuth();
  const {
    device,
    sensorData,
    isConnected,
    connectDemoDevice
  } = useDevice();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const userId = currentUser?.id || currentUser?.email || 'default_user';

  // Database Storage Items State
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('added_at');

  // Modal Dialogs State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State (for both Add and Edit)
  const [formData, setFormData] = useState({
    vegetable_name: 'Tomato',
    variety: 'Roma / Cherry',
    quantity: '15 kg',
    batch_number: '',
    storage_chamber: 'Chamber #04 (Bay A)',
    device_id: device?.id || 'ESP32-DEMO-001',
    optimal_temp_min: 18.0,
    optimal_temp_max: 24.0,
    optimal_humidity_min: 65.0,
    optimal_humidity_max: 75.0,
    shelf_life_days: 14,
    notes: 'Monitored under automated ventilation control.',
    is_active: 0
  });

  // Load storage batches from database
  const loadBatches = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const records = await fetchStorageItems(userId, token);
      setItems(records);
    } catch (err) {
      console.error('Failed to load storage items:', err);
      addToast('Could not load storage batches from database.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId, token, addToast]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  // Determine active monitored batch
  const activeBatch = useMemo(() => {
    return items.find((item) => Number(item.is_active) === 1) || items[0] || null;
  }, [items]);

  // Live evaluation of active batch condition against current ESP32 telemetry
  const activeCondition = useMemo(() => {
    return calculateVegetableCondition(
      activeBatch,
      sensorData?.temperature,
      sensorData?.humidity,
      sensorData?.gasLevel ?? sensorData?.gasVOC,
      sensorData?.spoilageRisk
    );
  }, [activeBatch, sensorData]);

  // Preset Selection Handler
  const handleSelectPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      vegetable_name: preset.name,
      variety: preset.variety,
      optimal_temp_min: preset.optimalTempMin,
      optimal_temp_max: preset.optimalTempMax,
      optimal_humidity_min: preset.optimalHumidityMin,
      optimal_humidity_max: preset.optimalHumidityMax,
      shelf_life_days: preset.shelfLifeDays,
      storage_chamber: preset.recommendedChamber,
      notes: preset.description
    }));
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    const randomSuffix = Date.now().toString(36).slice(-4).toUpperCase();
    setFormData({
      vegetable_name: 'Tomato',
      variety: 'Roma / Cherry',
      quantity: '16 kg',
      batch_number: `BATCH-2026-TOM-${randomSuffix}`,
      storage_chamber: 'Chamber #04 (Bay A)',
      device_id: device?.id || 'ESP32-DEMO-001',
      optimal_temp_min: 18.0,
      optimal_temp_max: 24.0,
      optimal_humidity_min: 65.0,
      optimal_humidity_max: 75.0,
      shelf_life_days: 14,
      notes: 'Premium greenhouse crop. Optimal for continuous monitoring.',
      is_active: items.length === 0 ? 1 : 0
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (batch, e) => {
    if (e) e.stopPropagation();
    setSelectedBatch(batch);
    setFormData({
      vegetable_name: batch.vegetable_name,
      variety: batch.variety || '',
      quantity: batch.quantity || '',
      batch_number: batch.batch_number || '',
      storage_chamber: batch.storage_chamber || 'Chamber #04',
      device_id: batch.device_id || device?.id || 'ESP32-DEMO-001',
      optimal_temp_min: batch.optimal_temp_min ?? 18,
      optimal_temp_max: batch.optimal_temp_max ?? 24,
      optimal_humidity_min: batch.optimal_humidity_min ?? 65,
      optimal_humidity_max: batch.optimal_humidity_max ?? 75,
      shelf_life_days: batch.shelf_life_days ?? 14,
      notes: batch.notes || '',
      is_active: batch.is_active || 0
    });
    setIsEditModalOpen(true);
  };

  // Open Details Modal
  const handleOpenDetail = (batch, e) => {
    if (e) e.stopPropagation();
    setSelectedBatch(batch);
    setIsDetailModalOpen(true);
  };

  // Open Delete Confirmation Modal
  const handleOpenDelete = (batch, e) => {
    if (e) e.stopPropagation();
    setSelectedBatch(batch);
    setIsDeleteModalOpen(true);
  };

  // Submit Add Batch Form
  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (!formData.vegetable_name?.trim()) {
      addToast('Vegetable name is required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createStorageItem(
        {
          ...formData,
          userId,
          device_id: device?.id || 'ESP32-DEMO-001'
        },
        token
      );

      addToast(`Batch for "${created.vegetable_name}" created and saved to database.`, 'success');
      setIsAddModalOpen(false);
      await loadBatches(true);
    } catch (err) {
      console.error('Error creating batch:', err);
      addToast(err.message || 'Failed to create storage record in database.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit Batch Form
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!selectedBatch?.id) return;

    setIsSubmitting(true);
    try {
      const updated = await updateStorageItem(
        selectedBatch.id,
        {
          ...formData,
          userId
        },
        token
      );

      addToast(`Batch "${updated.vegetable_name}" updated successfully.`, 'success');
      setIsEditModalOpen(false);
      await loadBatches(true);
    } catch (err) {
      console.error('Error updating batch:', err);
      addToast(err.message || 'Failed to update record in database.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete Batch
  const handleConfirmDelete = async () => {
    if (!selectedBatch?.id) return;

    setIsSubmitting(true);
    try {
      await deleteStorageItem(selectedBatch.id, userId, token);
      addToast(`Batch "${selectedBatch.vegetable_name}" removed from database.`, 'info');
      setIsDeleteModalOpen(false);
      await loadBatches(true);
    } catch (err) {
      console.error('Error deleting batch:', err);
      addToast(err.message || 'Failed to delete record from database.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Activate Batch (Connect to Device monitoring)
  const handleActivateBatch = async (batch, e) => {
    if (e) e.stopPropagation();
    try {
      await activateStorageBatch(batch.id, userId, token);
      addToast(`Batch "${batch.vegetable_name}" is now the active monitored storage.`, 'success');
      await loadBatches(true);
    } catch (err) {
      console.error('Error activating batch:', err);
      addToast('Could not set active batch.', 'error');
    }
  };

  // Filtered and Sorted Batches
  const filteredBatches = useMemo(() => {
    return items
      .filter((batch) => {
        const query = searchTerm.toLowerCase().trim();
        const matchesQuery =
          !query ||
          batch.vegetable_name?.toLowerCase().includes(query) ||
          batch.variety?.toLowerCase().includes(query) ||
          batch.batch_number?.toLowerCase().includes(query) ||
          batch.storage_chamber?.toLowerCase().includes(query);

        const matchesStatus = filterStatus === 'ALL' || batch.status === filterStatus;
        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'vegetable_name') {
          return a.vegetable_name.localeCompare(b.vegetable_name);
        }
        if (sortBy === 'spoilage_risk') {
          return (b.spoilage_risk || 0) - (a.spoilage_risk || 0);
        }
        // Default: most recently added first
        return new Date(b.added_at || 0) - new Date(a.added_at || 0);
      });
  }, [items, searchTerm, filterStatus, sortBy]);

  return (
    <div className="storage-page-container">
      {/* 1. Header Section */}
      <div className="storage-header-row">
        <div className="storage-header-title-block">
          <h1>Vegetable Management & Storage</h1>
          <p>
            Database-backed produce batch registry, chamber telemetry linkage, and preservation analytics.
          </p>
        </div>

        <div className="storage-header-actions">
          {/* Device Link Status Badge */}
          <div className={`device-link-status-badge ${isConnected ? 'connected' : ''}`}>
            {device?.isDemo ? (
              <>
                <Zap size={15} color="#f59e0b" />
                <span>Demo Connected: <strong>{device.id}</strong> (192.168.1.105)</span>
              </>
            ) : isConnected ? (
              <>
                <Radio size={15} color="var(--primary)" />
                <span>Gateway: <strong>{device.name}</strong> ({device.ipAddress})</span>
              </>
            ) : (
              <>
                <Cpu size={15} color="var(--text-muted)" />
                <span>No Device Linked</span>
                <button
                  type="button"
                  onClick={connectDemoDevice}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    textDecoration: 'underline'
                  }}
                >
                  ⚡ Connect Demo ESP32
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={handleOpenAdd}
            style={{ width: 'auto', padding: '0 1.25rem', height: '40px', gap: '0.45rem' }}
          >
            <Plus size={18} />
            <span>Add Storage Batch</span>
          </button>
        </div>
      </div>

      {/* 2. Active Monitored Batch Hero Banner */}
      {activeBatch && (
        <div className="active-batch-hero-card">
          <div className="active-batch-hero-top">
            <div className="active-crop-identity">
              <div className="active-crop-icon-box">
                <Boxes size={26} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 className="active-crop-title">{activeBatch.vegetable_name}</h2>
                  <span className={`storage-status-tag ${activeCondition.badgeClass.replace('status-', '')}`}>
                    {activeCondition.status === 'FRESH' && <CheckCircle2 size={13} />}
                    {activeCondition.status === 'WARNING' && <AlertTriangle size={13} />}
                    {activeCondition.status === 'SPOILAGE RISK' && <ShieldAlert size={13} />}
                    <span>{activeCondition.status}</span>
                  </span>
                </div>
                <div className="active-crop-sub">
                  <span>{activeBatch.variety}</span>
                  <span>•</span>
                  <span>{activeBatch.quantity}</span>
                  <span>•</span>
                  <span>{activeBatch.storage_chamber}</span>
                  <span>•</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{activeBatch.batch_number}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleOpenDetail(activeBatch)}
                style={{ height: '36px', fontSize: '0.8rem', padding: '0 0.85rem' }}
              >
                <Eye size={15} />
                <span>Diagnostics</span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleOpenEdit(activeBatch)}
                style={{ height: '36px', fontSize: '0.8rem', padding: '0 0.85rem' }}
              >
                <Edit2 size={14} />
                <span>Edit Batch</span>
              </button>
            </div>
          </div>

          {/* Telemetry vs Target Grid */}
          <div className="active-batch-telemetry-grid">
            <div className="active-metric-cell">
              <span className="active-metric-label">Current Temperature</span>
              <span className="active-metric-val">
                {sensorData?.temperature ? `${sensorData.temperature}°C` : '28.5°C'}
              </span>
              <span className="active-metric-sub">
                Target: {activeBatch.optimal_temp_min}°C – {activeBatch.optimal_temp_max}°C
                {activeCondition.tempDeviation > 0 && ` (${activeCondition.tempStatus})`}
              </span>
            </div>

            <div className="active-metric-cell">
              <span className="active-metric-label">Current Humidity</span>
              <span className="active-metric-val">
                {sensorData?.humidity ? `${sensorData.humidity}%` : '72%'}
              </span>
              <span className="active-metric-sub">
                Target: {activeBatch.optimal_humidity_min}% – {activeBatch.optimal_humidity_max}% RH
              </span>
            </div>

            <div className="active-metric-cell">
              <span className="active-metric-label">VOC / Gas Index</span>
              <span className="active-metric-val">
                {sensorData?.gasLevel ?? sensorData?.gasVOC ?? 420} ppm
              </span>
              <span className="active-metric-sub">
                MQ-135 Early Spoilage Baseline
              </span>
            </div>

            <div className="active-metric-cell">
              <span className="active-metric-label">Spoilage Risk</span>
              <span className="active-metric-val" style={{ color: activeCondition.color }}>
                {sensorData?.spoilageRisk ?? activeBatch.spoilage_risk ?? 18}%
              </span>
              <span className="active-metric-sub">
                Expected Shelf Life: ~{activeBatch.shelf_life_days} days
              </span>
            </div>
          </div>

          {/* Preservation Advisory */}
          <div className="active-advisory-box">
            <ShieldCheck size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
            <span>
              <strong>Preservation Advisory:</strong> {activeCondition.advisory}
            </span>
          </div>
        </div>
      )}

      {/* 3. Toolbar & Filters */}
      <div className="storage-filter-toolbar">
        <div className="storage-search-box">
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            className="storage-search-input"
            placeholder="Search produce name, variety, batch ID, or storage chamber..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Status Filter Pills */}
          <div className="storage-status-pills">
            {['ALL', 'FRESH', 'WARNING', 'SPOILAGE RISK'].map((status) => (
              <button
                key={status}
                type="button"
                className={`storage-pill-btn ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              height: '32px',
              padding: '0 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="added_at">Sort: Recent First</option>
            <option value="vegetable_name">Sort: Name (A-Z)</option>
            <option value="spoilage_risk">Sort: Highest Risk</option>
          </select>
        </div>
      </div>

      {/* 4. Batch Cards Grid */}
      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <span>Loading storage records from database...</span>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div
          className="vegsense-card"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <Boxes size={48} color="var(--text-muted)" />
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0 }}>No Storage Batches Found</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: 0, fontSize: '0.9rem' }}>
            {searchTerm || filterStatus !== 'ALL'
              ? 'No batches match your filter or search criteria.'
              : 'You have not added any vegetable storage records yet. Create your first batch to start monitoring.'}
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={handleOpenAdd}
            style={{ width: 'auto', padding: '0 1.5rem', marginTop: '0.5rem' }}
          >
            <Plus size={16} />
            <span>Create First Batch</span>
          </button>
        </div>
      ) : (
        <div className="storage-batches-grid">
          {filteredBatches.map((batch) => {
            const isActive = Number(batch.is_active) === 1;
            const evalCondition = calculateVegetableCondition(
              batch,
              sensorData?.temperature,
              sensorData?.humidity,
              sensorData?.gasLevel ?? sensorData?.gasVOC,
              sensorData?.spoilageRisk
            );

            return (
              <div
                key={batch.id}
                className={`storage-card ${isActive ? 'active-monitored' : ''}`}
                onClick={() => handleOpenDetail(batch)}
                style={{ cursor: 'pointer' }}
              >
                <div>
                  {/* Card Header */}
                  <div className="storage-card-header">
                    <div className="crop-header-left">
                      <div className="crop-card-avatar">
                        <Boxes size={22} />
                      </div>
                      <div>
                        <div className="crop-card-name">{batch.vegetable_name}</div>
                        <div className="crop-card-variety">{batch.variety} • <strong>{batch.quantity}</strong></div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                      <span className="crop-batch-code">{batch.batch_number || batch.id.slice(0, 8)}</span>
                      {isActive && (
                        <span style={{ fontSize: '0.675rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
                          ACTIVE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chamber & Device Info */}
                  <div className="storage-card-chamber-row">
                    <span>📍 {batch.storage_chamber || 'Chamber #04'}</span>
                    <span>📟 {batch.device_id || 'ESP32-DEMO-001'}</span>
                  </div>

                  {/* Metrics Grid */}
                  <div className="storage-card-metrics-grid">
                    <div className="storage-metric-box">
                      <span className="storage-metric-box-title">Optimal Temp</span>
                      <span className="storage-metric-box-val">
                        {batch.optimal_temp_min}°C – {batch.optimal_temp_max}°C
                      </span>
                      <span className="storage-metric-box-sub">
                        Target: {batch.target_temp || 21}°C
                      </span>
                    </div>

                    <div className="storage-metric-box">
                      <span className="storage-metric-box-title">Optimal RH</span>
                      <span className="storage-metric-box-val">
                        {batch.optimal_humidity_min}% – {batch.optimal_humidity_max}%
                      </span>
                      <span className="storage-metric-box-sub">
                        Target: {batch.target_humidity || 70}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer with Status & Actions */}
                <div className="storage-card-footer" onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`storage-status-tag ${evalCondition.badgeClass.replace('status-', '')}`}>
                      {evalCondition.status === 'FRESH' && <CheckCircle2 size={12} />}
                      {evalCondition.status === 'WARNING' && <AlertTriangle size={12} />}
                      {evalCondition.status === 'SPOILAGE RISK' && <ShieldAlert size={12} />}
                      <span>{evalCondition.status}</span>
                    </span>

                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Risk: <strong>{evalCondition.preservationScore > 75 ? (sensorData?.spoilageRisk ?? 18) : 45}%</strong>
                    </span>
                  </div>

                  <div className="storage-card-actions">
                    {!isActive && (
                      <button
                        type="button"
                        className="btn-icon-action"
                        onClick={(e) => handleActivateBatch(batch, e)}
                        title="Set as active monitored batch for ESP32"
                      >
                        <Check size={14} color="var(--primary)" />
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-icon-action"
                      onClick={(e) => handleOpenDetail(batch, e)}
                      title="View batch details & diagnostics"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon-action"
                      onClick={(e) => handleOpenEdit(batch, e)}
                      title="Edit batch record"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon-action delete"
                      onClick={(e) => handleOpenDelete(batch, e)}
                      title="Delete batch record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          MODAL 1: ADD STORAGE BATCH
          ========================================================================= */}
      {isAddModalOpen && (
        <div className="storage-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="storage-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="storage-modal-header">
              <h3 className="storage-modal-title">
                <Boxes size={20} color="var(--primary)" />
                <span>Create New Storage Batch</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Agricultural Preset Pills */}
            <div className="preset-selector-row">
              <span className="preset-selector-label">Quick Agricultural Presets</span>
              <div className="preset-pills-wrap">
                {VEGETABLE_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className={`preset-pill ${formData.vegetable_name === preset.name ? 'active' : ''}`}
                    onClick={() => handleSelectPreset(preset)}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmitAdd}>
              <div className="storage-form-grid">
                <div className="storage-form-group">
                  <label className="storage-form-label">Vegetable Name *</label>
                  <input
                    type="text"
                    className="storage-form-input"
                    value={formData.vegetable_name}
                    onChange={(e) => setFormData({ ...formData, vegetable_name: e.target.value })}
                    required
                  />
                </div>

                <div className="storage-form-group">
                  <label className="storage-form-label">Variety / Cultivar</label>
                  <input
                    type="text"
                    className="storage-form-input"
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    placeholder="e.g. Roma, Cherry, Russet"
                  />
                </div>

                <div className="storage-form-group">
                  <label className="storage-form-label">Quantity / Weight *</label>
                  <input
                    type="text"
                    className="storage-form-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="e.g. 15 kg, 20 crates"
                    required
                  />
                </div>

                <div className="storage-form-group">
                  <label className="storage-form-label">Batch Code / Identifier</label>
                  <input
                    type="text"
                    className="storage-form-input"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                    placeholder="e.g. BATCH-2026-TOM-01"
                  />
                </div>

                <div className="storage-form-group">
                  <label className="storage-form-label">Storage Chamber / Bay</label>
                  <input
                    type="text"
                    className="storage-form-input"
                    value={formData.storage_chamber}
                    onChange={(e) => setFormData({ ...formData, storage_chamber: e.target.value })}
                    placeholder="e.g. Chamber #04 (Bay A)"
                  />
                </div>

                <div className="storage-form-group">
                  <label className="storage-form-label">Linked Hardware Gateway</label>
                  <input
                    type="text"
                    className="storage-form-input"
                    value={formData.device_id}
                    onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                    placeholder="e.g. ESP32-DEMO-001"
                  />
                </div>

                <div className="storage-form-group">
                  <label className="storage-form-label">Min Temp (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="storage-form-input"
                    value={formData.optimal_temp_min}
                    onChange={(e) => setFormData({ ...formData, optimal_temp_min: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="storage-form-group">
                  <label className="storage-form-label">Max Temp (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="storage-form-input"
                    value={formData.optimal_temp_max}
                    onChange={(e) => setFormData({ ...formData, optimal_temp_max: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="storage-form-group">
                  <label className="storage-form-label">Min Humidity (% RH)</label>
                  <input
                    type="number"
                    className="storage-form-input"
                    value={formData.optimal_humidity_min}
                    onChange={(e) => setFormData({ ...formData, optimal_humidity_min: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="storage-form-group">
                  <label className="storage-form-label">Max Humidity (% RH)</label>
                  <input
                    type="number"
                    className="storage-form-input"
                    value={formData.optimal_humidity_max}
                    onChange={(e) => setFormData({ ...formData, optimal_humidity_max: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="storage-form-group">
                  <label className="storage-form-label">Expected Shelf Life (Days)</label>
                  <input
                    type="number"
                    className="storage-form-input"
                    value={formData.shelf_life_days}
                    onChange={(e) => setFormData({ ...formData, shelf_life_days: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="storage-form-group" style={{ justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.is_active)}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                    />
                    <span>Set as active monitored batch</span>
                  </label>
                </div>

                <div className="storage-form-group full-width">
                  <label className="storage-form-label">Agronomic Notes & Preservation Instructions</label>
                  <textarea
                    className="storage-form-textarea"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Enter special handling notes (e.g. ethylene sensitivity, pre-cooling requirements)..."
                  />
                </div>
              </div>

              <div className="storage-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                  style={{ width: 'auto', padding: '0 1.5rem' }}
                >
                  {isSubmitting ? 'Saving to Database...' : 'Save Storage Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EDIT STORAGE BATCH
          ========================================================================= */}
      {isEditModalOpen && selectedBatch && (
        <div className="storage-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="storage-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="storage-modal-header">
              <h3 className="storage-modal-title">
                <Edit2 size={18} color="var(--primary)" />
                <span>Edit Batch: {selectedBatch.vegetable_name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit}>
              <div className="storage-form-grid">
                <div className="storage-form-group">
                  <label className="storage-form-label">Vegetable Name *</label>
                  <input
                    type="text"
                    className="storage-form-input"
                    value={formData.vegetable_name}
                    onChange={(e) => setFormData({ ...formData, vegetable_name: e.target.value })}
                    required
                  />
                </div>

                <div className="storage-form-group">
                  <label className="storage-form-label">Variety / Cultivar</label>
                  <input
                    type="text"
                    className="storage-form-input"
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                  />
                </div>

                <div className="storage-form-group">
                  <label className="storage-form-label">Quantity / Weight *</label>
                  <input
                    type="text"
                    className="storage-form-input"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="storage-form-group">
                  <label className="storage-form-label">Batch Code</label>
                  <input
                    type="text"
                    className="storage-form-input"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  />
                </div>

                <div className="storage-form-group">
                  <label className="storage-form-label">Storage Chamber</label>
                  <input
                    type="text"
                    className="storage-form-input"
                    value={formData.storage_chamber}
                    onChange={(e) => setFormData({ ...formData, storage_chamber: e.target.value })}
                  />
                </div>

                <div className="storage-form-group">
                  <label className="storage-form-label">Linked Device</label>
                  <input
                    type="text"
                    className="storage-form-input"
                    value={formData.device_id}
                    onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                  />
                </div>

                <div className="storage-form-group">
                  <label className="storage-form-label">Min Temp (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="storage-form-input"
                    value={formData.optimal_temp_min}
                    onChange={(e) => setFormData({ ...formData, optimal_temp_min: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="storage-form-group">
                  <label className="storage-form-label">Max Temp (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="storage-form-input"
                    value={formData.optimal_temp_max}
                    onChange={(e) => setFormData({ ...formData, optimal_temp_max: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="storage-form-group">
                  <label className="storage-form-label">Min Humidity (% RH)</label>
                  <input
                    type="number"
                    className="storage-form-input"
                    value={formData.optimal_humidity_min}
                    onChange={(e) => setFormData({ ...formData, optimal_humidity_min: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="storage-form-group">
                  <label className="storage-form-label">Max Humidity (% RH)</label>
                  <input
                    type="number"
                    className="storage-form-input"
                    value={formData.optimal_humidity_max}
                    onChange={(e) => setFormData({ ...formData, optimal_humidity_max: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="storage-form-group full-width">
                  <label className="storage-form-label">Notes & Observations</label>
                  <textarea
                    className="storage-form-textarea"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="storage-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                  style={{ width: 'auto', padding: '0 1.5rem' }}
                >
                  {isSubmitting ? 'Updating Database...' : 'Update Storage Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: BATCH DETAILS & DIAGNOSTICS
          ========================================================================= */}
      {isDetailModalOpen && selectedBatch && (
        <div className="storage-modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
          <div className="storage-modal-card" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="storage-modal-header">
              <div>
                <h3 className="storage-modal-title">
                  <Boxes size={22} color="var(--primary)" />
                  <span>{selectedBatch.vegetable_name} Details</span>
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Batch #{selectedBatch.batch_number || selectedBatch.id} • {selectedBatch.storage_chamber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Diagnostics Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Presets and status */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                <div className="storage-metric-box">
                  <span className="storage-metric-box-title">Quantity</span>
                  <span className="storage-metric-box-val">{selectedBatch.quantity}</span>
                </div>
                <div className="storage-metric-box">
                  <span className="storage-metric-box-title">Variety</span>
                  <span className="storage-metric-box-val">{selectedBatch.variety || 'Standard'}</span>
                </div>
                <div className="storage-metric-box">
                  <span className="storage-metric-box-title">Gateway</span>
                  <span className="storage-metric-box-val">{selectedBatch.device_id || 'ESP32-DEMO-001'}</span>
                </div>
                <div className="storage-metric-box">
                  <span className="storage-metric-box-title">Preservation Window</span>
                  <span className="storage-metric-box-val">~{selectedBatch.shelf_life_days || 14} days</span>
                </div>
              </div>

              {/* Target Boundaries */}
              <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Configured Storage Boundaries
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  <span>Optimal Temperature: <strong>{selectedBatch.optimal_temp_min}°C – {selectedBatch.optimal_temp_max}°C</strong></span>
                  <span>Optimal Humidity: <strong>{selectedBatch.optimal_humidity_min}% – {selectedBatch.optimal_humidity_max}% RH</strong></span>
                </div>
              </div>

              {/* Notes */}
              {selectedBatch.notes && (
                <div>
                  <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Agronomic Notes
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', background: 'var(--bg-page)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', lineHeight: 1.45 }}>
                    {selectedBatch.notes}
                  </p>
                </div>
              )}

              {/* Registered Time */}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={13} />
                <span>Recorded on: {new Date(selectedBatch.added_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="storage-modal-footer">
              {Number(selectedBatch.is_active) !== 1 && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    handleActivateBatch(selectedBatch);
                    setIsDetailModalOpen(false);
                  }}
                  style={{ width: 'auto', padding: '0 1.25rem', marginRight: 'auto' }}
                >
                  <Check size={15} />
                  <span>Activate on ESP32</span>
                </button>
              )}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: DELETE CONFIRMATION
          ========================================================================= */}
      {isDeleteModalOpen && selectedBatch && (
        <div className="storage-modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="storage-modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>Delete Storage Batch?</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>This action cannot be undone.</span>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.45', margin: '0 0 1.25rem 0' }}>
              Are you sure you want to permanently delete the batch <strong>{selectedBatch.vegetable_name}</strong> (<code>{selectedBatch.batch_number || selectedBatch.id}</code>) from the database?
            </p>

            <div className="storage-modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                style={{ background: '#ef4444', borderColor: '#ef4444', width: 'auto', padding: '0 1.25rem' }}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VegetableStoragePage;
