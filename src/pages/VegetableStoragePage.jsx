import React, { useState } from 'react';
import { useDevice } from '../context/DeviceContext';
import { useToast } from '../context/ToastContext';
import {
  Boxes,
  Plus,
  Thermometer,
  Droplets,
  AlertCircle,
  CheckCircle2,
  Filter,
  Search,
  X,
  Sparkles
} from 'lucide-react';

export function VegetableStoragePage() {
  const { vegetables, addVegetableBatch } = useDevice();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New batch form state
  const [newVegName, setNewVegName] = useState('Broccoli');
  const [newVariety, setNewVariety] = useState('Calabrese');
  const [newQuantity, setNewQuantity] = useState('16 kg');
  const [newOptimalTemp, setNewOptimalTemp] = useState('4-8°C');
  const [newShelfLife, setNewShelfLife] = useState('10 days');

  const filteredVegetables = vegetables.filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.variety.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || v.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleCreateBatch = (e) => {
    e.preventDefault();
    if (!newVegName.trim() || !newQuantity.trim()) {
      addToast('Please provide vegetable name and quantity.', 'error');
      return;
    }

    addVegetableBatch({
      name: newVegName.trim(),
      variety: newVariety.trim() || 'Standard',
      quantity: newQuantity.trim(),
      optimalTemp: newOptimalTemp || '18-22°C',
      shelfLife: newShelfLife || '14 days'
    });

    addToast(`Storage batch for ${newVegName} registered successfully.`, 'success');
    setIsAddModalOpen(false);
  };

  return (
    <div>
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Vegetable Storage Batches
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Active produce inventories under continuous ESP32 environmental preservation in Chamber #04.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          style={{ width: 'auto', padding: '0 1.25rem' }}
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={18} />
          <span>Add Storage Batch</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="vegsense-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1', minWidth: '240px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search produce (e.g. Tomato, Potato, Onion)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '0.925rem', color: 'var(--text-main)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['ALL', 'FRESH', 'WARNING'].map((status) => (
            <button
              key={status}
              type="button"
              className={`btn-secondary ${filterStatus === status ? 'active' : ''}`}
              style={{
                height: '32px',
                fontSize: '0.75rem',
                padding: '0 0.75rem',
                backgroundColor: filterStatus === status ? 'var(--primary-light)' : 'transparent',
                borderColor: filterStatus === status ? 'var(--primary-border)' : 'var(--border-light)',
                color: filterStatus === status ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 700
              }}
              onClick={() => setFilterStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Vegetable Cards Grid */}
      <div className="veg-batch-grid">
        {filteredVegetables.map((veg) => {
          const isFresh = veg.status === 'FRESH';
          return (
            <div key={veg.id} className="veg-card">
              <div>
                <div className="veg-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="veg-icon-box">
                      <Boxes size={22} />
                    </div>
                    <div>
                      <div className="veg-name">{veg.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{veg.variety}</div>
                    </div>
                  </div>
                  <span className="veg-quantity-pill">{veg.quantity}</span>
                </div>

                {/* Metrics Row */}
                <div className="veg-metrics-row">
                  <div className="veg-metric-item">
                    <span className="veg-metric-label">TEMPERATURE</span>
                    <span className="veg-metric-val">{veg.temp}</span>
                  </div>
                  <div className="veg-metric-item">
                    <span className="veg-metric-label">HUMIDITY</span>
                    <span className="veg-metric-val">{veg.humidity}</span>
                  </div>
                  <div className="veg-metric-item">
                    <span className="veg-metric-label">OPTIMAL TARGET</span>
                    <span className="veg-metric-val" style={{ fontSize: '0.825rem' }}>{veg.optimalTemp}</span>
                  </div>
                  <div className="veg-metric-item">
                    <span className="veg-metric-label">EXPIRY WINDOW</span>
                    <span className="veg-metric-val" style={{ fontSize: '0.825rem' }}>{veg.shelfLife}</span>
                  </div>
                </div>
              </div>

              {/* Status and Risk Footer */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>SPOILAGE RISK: </span>
                  <strong style={{ color: isFresh ? 'var(--primary)' : 'var(--accent-amber)' }}>{veg.risk}%</strong>
                </div>

                <span className={`risk-meter-status-badge ${isFresh ? 'status-badge-fresh' : 'status-badge-warning'}`} style={{ marginTop: 0, padding: '0.2rem 0.65rem' }}>
                  {isFresh ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  <span>{veg.status}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Storage Batch Modal */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="vegsense-card" style={{ maxWidth: '460px', width: '100%', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.15rem' }}>
                <Boxes size={20} color="var(--primary)" />
                <span>Add Storage Batch</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="header-action-btn"
                style={{ width: '32px', height: '32px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateBatch}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Vegetable Name</label>
                <input
                  type="text"
                  className="login-form-input no-left-icon"
                  placeholder="e.g. Broccoli, Bell Pepper"
                  value={newVegName}
                  onChange={(e) => setNewVegName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Variety / Type</label>
                <input
                  type="text"
                  className="login-form-input no-left-icon"
                  placeholder="e.g. Organic Calabrese"
                  value={newVariety}
                  onChange={(e) => setNewVariety(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Quantity / Weight</label>
                <input
                  type="text"
                  className="login-form-input no-left-icon"
                  placeholder="e.g. 18 kg"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Optimal Temp</label>
                  <input
                    type="text"
                    className="login-form-input no-left-icon"
                    placeholder="e.g. 18-22°C"
                    value={newOptimalTemp}
                    onChange={(e) => setNewOptimalTemp(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Est. Shelf Life</label>
                  <input
                    type="text"
                    className="login-form-input no-left-icon"
                    placeholder="e.g. 14 days"
                    value={newShelfLife}
                    onChange={(e) => setNewShelfLife(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1.5 }}
                >
                  Add Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
