import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';
import { useToast } from '../context/ToastContext';
import { useAppearance, THEME_OPTIONS, ACCENT_OPTIONS } from '../context/AppearanceContext';
import {
  Palette,
  Sliders,
  Bell,
  Cpu,
  User,
  Shield,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Sun,
  Moon,
  Check,
  Activity,
  Layers,
  CheckCircle,
  Thermometer,
  Droplets,
  Wind,
  ShieldAlert
} from 'lucide-react';

export function SettingsPage() {
  const { currentUser } = useAuth();
  const { device, thresholds, updateThresholds } = useDevice();
  const { addToast } = useToast();

  const {
    settings,
    setTheme,
    toggleMode,
    setAccent,
    setLayout,
    setSidebarMode,
    setAnimation,
    setCardStyle,
    setFontSize,
    resetToDefault
  } = useAppearance();

  const [activeTab, setActiveTab] = useState('appearance');

  // Storage Thresholds local state
  const [maxTemp, setMaxTemp] = useState(thresholds.maxTemp);
  const [maxHumidity, setMaxHumidity] = useState(thresholds.maxHumidity);
  const [maxGas, setMaxGas] = useState(thresholds.maxGas);

  // Notification toggles
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [warningAlerts, setWarningAlerts] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);

  const handleSaveThresholds = (e) => {
    e.preventDefault();
    updateThresholds({ maxTemp, maxHumidity, maxGas });
    addToast('Storage threshold limits updated successfully.', 'success');
  };

  const handleResetAppearance = () => {
    resetToDefault();
    addToast('Appearance reset to default (Forest — Organic).', 'info');
  };

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'thresholds', label: 'Storage Thresholds', icon: Sliders },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'device', label: 'Device & Hardware', icon: Cpu },
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  // Helper render for Live Preview Panel (used in desktop right column and mobile bottom)
  const renderLivePreviewCard = () => (
    <div className="settings-live-preview-card">
      <div className="preview-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={16} color="var(--primary)" />
          <span style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-main)' }}>
            LIVE PREVIEW
          </span>
        </div>
        <span className="live-preview-status-pill">
          <span className="pulse-led-indicator pulse-green" style={{ width: '6px', height: '6px' }} />
          <span>Connected</span>
        </span>
      </div>

      <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.4 }}>
        Real-time simulation of your VegSense interface with active theme, accent, and card styles:
      </p>

      {/* Miniature preview board */}
      <div className="mini-preview-board">
        {/* Storage Health */}
        <div className="preview-health-banner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Storage Health</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)' }}>92%</span>
          </div>
          <div className="preview-progress-track">
            <div className="preview-progress-fill" style={{ width: '92%' }} />
          </div>
        </div>

        {/* 2x2 Telemetry Grid */}
        <div className="preview-telemetry-grid">
          <div className="preview-telemetry-item">
            <span className="preview-telemetry-label">Temperature</span>
            <span className="preview-telemetry-val">28.5°C</span>
          </div>

          <div className="preview-telemetry-item">
            <span className="preview-telemetry-label">Humidity</span>
            <span className="preview-telemetry-val">72%</span>
          </div>

          <div className="preview-telemetry-item">
            <span className="preview-telemetry-label">Gas / VOC</span>
            <span className="preview-telemetry-val" style={{ color: 'var(--primary)' }}>Normal</span>
          </div>

          <div className="preview-telemetry-item">
            <span className="preview-telemetry-label">Spoilage Risk</span>
            <span className="preview-telemetry-val">18%</span>
          </div>
        </div>

        {/* Status Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
          <span className="risk-meter-status-badge status-badge-fresh" style={{ margin: 0, padding: '0.2rem 0.65rem' }}>
            <CheckCircle2 size={12} />
            <span>FRESH</span>
          </span>
        </div>

        {/* Sample Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          <button type="button" className="btn-primary" style={{ height: '36px', fontSize: '0.8rem', width: '100%', justifyContent: 'center' }}>
            Primary Action
          </button>
          <button type="button" className="btn-secondary" style={{ height: '36px', fontSize: '0.8rem', width: '100%', justifyContent: 'center' }}>
            Secondary Action
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="settings-page-container">
      {/* Page Header */}
      <div className="settings-title-section">
        <div className="settings-section-badge">
          <span>SYSTEM CONTROL CENTER</span>
        </div>
        <h1 className="settings-main-title">
          Personalize your VegSense workspace.
        </h1>
        <p className="settings-main-desc">
          Switch between organic agriculture aesthetics and pro IoT dark monitoring, customize telemetry accents, and adjust storage tolerances.
        </p>
      </div>

      {/* Main Responsive Grid Layout */}
      <div className={`settings-layout-wrapper ${activeTab === 'appearance' ? 'has-live-preview' : 'standard-layout'}`}>
        
        {/* COLUMN 1 (Desktop) / TOP TABS (Mobile): Slim Navigation Rail */}
        <div className="settings-nav-rail">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`settings-nav-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} className="tab-icon" />
                <span className="tab-label">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* COLUMN 2 (Desktop) / MAIN CONTENT (Mobile): Selected Settings Panel */}
        <div className="settings-content-area">
          
          {/* =========================================================================
              TAB: APPEARANCE STUDIO
              ========================================================================= */}
          {activeTab === 'appearance' && (
            <div className="appearance-studio-wrapper">
              <div className="vegsense-card appearance-studio-card">
                {/* Header Row */}
                <div className="card-header-row appearance-card-header">
                  <div>
                    <h2 className="card-title" style={{ fontSize: '1.25rem' }}>Appearance Studio</h2>
                    <div className="card-subtitle">Choose your primary theme and customize layout density.</div>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary reset-appearance-btn"
                    onClick={handleResetAppearance}
                    title="Reset to Forest"
                  >
                    <RotateCcw size={14} />
                    <span>Reset to Default</span>
                  </button>
                </div>

                {/* 1. Theme Selector: ONLY TWO VISUAL THEMES */}
                <div className="appearance-section-block">
                  <div className="section-label-heading">
                    1. Choose Visual Theme
                  </div>
                  <p className="section-label-subtext">
                    Select between the Organic Agriculture light aesthetic and the Dark Pro IoT monitoring interface.
                  </p>

                  <div className="dual-theme-selector-grid">
                    {/* Theme 1: FOREST — Organic */}
                    <div
                      className={`theme-showcase-card forest-showcase ${settings.theme === 'forest' ? 'selected' : ''}`}
                      onClick={() => setTheme('forest')}
                      role="button"
                      tabIndex={0}
                      aria-label="Select Forest Organic Theme"
                    >
                      {/* Miniature Dashboard Preview */}
                      <div className="mini-theme-preview forest-preview-bg">
                        <div className="mini-dash-header">
                          <span className="mini-dash-brand">VegSense</span>
                          <span className="mini-dash-status-dot green" />
                        </div>
                        <div className="mini-dash-card-box">
                          <div className="mini-dash-metric-title">Storage Status</div>
                          <div className="mini-dash-metric-val">FRESH • 18%</div>
                          <div className="mini-dash-bar">
                            <div className="mini-dash-bar-fill forest" />
                          </div>
                        </div>
                        <div className="mini-dash-botanical-accent">🌿 Organic Light</div>
                      </div>

                      <div className="theme-card-info">
                        <div className="theme-card-title-row">
                          <div>
                            <span className="theme-card-main-name">FOREST</span>
                            <span className="theme-card-sub-name">Organic</span>
                          </div>
                          {settings.theme === 'forest' && (
                            <div className="theme-selected-check">
                              <Check size={14} />
                            </div>
                          )}
                        </div>
                        <p className="theme-card-desc">
                          Warm cream background, deep forest & olive greens, soft mint, and clean botanical lines.
                        </p>
                      </div>
                    </div>

                    {/* Theme 2: NIGHT MONITOR — Dark Pro */}
                    <div
                      className={`theme-showcase-card night-showcase ${settings.theme === 'night-monitor' ? 'selected' : ''}`}
                      onClick={() => setTheme('night-monitor')}
                      role="button"
                      tabIndex={0}
                      aria-label="Select Night Monitor Dark Pro Theme"
                    >
                      {/* Miniature Dashboard Preview */}
                      <div className="mini-theme-preview night-preview-bg">
                        <div className="mini-dash-header dark">
                          <span className="mini-dash-brand cyan">VegSense Pro</span>
                          <span className="mini-dash-status-dot cyan-pulse" />
                        </div>
                        <div className="mini-dash-card-box dark">
                          <div className="mini-dash-metric-title dark">IoT Monitor</div>
                          <div className="mini-dash-metric-val cyan">FRESH • 18%</div>
                          <div className="mini-dash-bar dark">
                            <div className="mini-dash-bar-fill cyan" />
                          </div>
                        </div>
                        <div className="mini-dash-telemetry-accent">⚡ Telemetry Dark</div>
                      </div>

                      <div className="theme-card-info">
                        <div className="theme-card-title-row">
                          <div>
                            <span className="theme-card-main-name">NIGHT MONITOR</span>
                            <span className="theme-card-sub-name">Dark Pro</span>
                          </div>
                          {settings.theme === 'night-monitor' && (
                            <div className="theme-selected-check">
                              <Check size={14} />
                            </div>
                          )}
                        </div>
                        <p className="theme-card-desc">
                          Deep charcoal navy, emerald & cyan telemetry glow, and layered dark monitoring cards.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Quick Mode Toggle */}
                <div className="appearance-section-block">
                  <div className="section-label-heading">
                    2. Quick Appearance Mode
                  </div>
                  <div className="quick-mode-touch-grid">
                    <button
                      type="button"
                      className={`quick-mode-btn ${settings.theme === 'forest' ? 'active' : ''}`}
                      onClick={() => setTheme('forest')}
                    >
                      <Sun size={18} />
                      <span>☀ Forest Light</span>
                    </button>
                    <button
                      type="button"
                      className={`quick-mode-btn ${settings.theme === 'night-monitor' ? 'active' : ''}`}
                      onClick={() => setTheme('night-monitor')}
                    >
                      <Moon size={18} />
                      <span>☾ Night Pro Dark</span>
                    </button>
                  </div>
                </div>

                {/* 3. Accent Colors */}
                <div className="appearance-section-block">
                  <div className="section-label-heading">
                    3. Telemetry Accent Color
                  </div>
                  <p className="section-label-subtext">
                    Applies to active highlights, buttons, charts, and telemetry status rings.
                  </p>
                  <div className="accent-color-touch-row">
                    {ACCENT_OPTIONS.map((accent) => {
                      const isSelected = settings.accent === accent.id;
                      return (
                        <button
                          key={accent.id}
                          type="button"
                          className={`accent-circle-touch-btn ${isSelected ? 'selected' : ''}`}
                          style={{ backgroundColor: accent.color }}
                          onClick={() => setAccent(accent.id)}
                          title={accent.name}
                          aria-label={`Select ${accent.name} accent`}
                        >
                          {isSelected && <Check size={16} color="#ffffff" strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Workspace Style (Touch-friendly stacked controls) */}
                <div className="appearance-section-block workspace-style-section">
                  <div className="section-label-heading">
                    4. Workspace Style & Geometry
                  </div>

                  <div className="workspace-controls-stack">
                    {/* Layout */}
                    <div className="workspace-control-item">
                      <label className="workspace-control-label">Layout Density</label>
                      <div className="segmented-touch-group">
                        {['compact', 'comfortable', 'spacious'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            className={`segmented-btn ${settings.layout === opt ? 'active' : ''}`}
                            onClick={() => setLayout(opt)}
                          >
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="workspace-control-item">
                      <label className="workspace-control-label">Navigation Sidebar</label>
                      <div className="segmented-touch-group">
                        {[
                          { id: 'expanded', label: 'Expanded' },
                          { id: 'compact', label: 'Compact' },
                          { id: 'hidden', label: 'Auto / Hidden' }
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            className={`segmented-btn ${settings.sidebarMode === opt.id ? 'active' : ''}`}
                            onClick={() => setSidebarMode(opt.id)}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Animation */}
                    <div className="workspace-control-item">
                      <label className="workspace-control-label">Animation Level</label>
                      <div className="segmented-touch-group">
                        {['full', 'subtle', 'off'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            className={`segmented-btn ${settings.animation === opt ? 'active' : ''}`}
                            onClick={() => setAnimation(opt)}
                          >
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Card Style */}
                    <div className="workspace-control-item">
                      <label className="workspace-control-label">Card Style</label>
                      <div className="segmented-touch-group">
                        {['rounded', 'soft', 'sharp'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            className={`segmented-btn ${settings.cardStyle === opt ? 'active' : ''}`}
                            onClick={() => setCardStyle(opt)}
                          >
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font Size */}
                    <div className="workspace-control-item">
                      <label className="workspace-control-label">Font Scale</label>
                      <div className="segmented-touch-group">
                        {['small', 'medium', 'large'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            className={`segmented-btn ${settings.fontSize === opt ? 'active' : ''}`}
                            onClick={() => setFontSize(opt)}
                          >
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* MOBILE LIVE PREVIEW (Placed directly below controls on mobile) */}
                <div className="mobile-only-live-preview">
                  {renderLivePreviewCard()}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: STORAGE THRESHOLDS
              ========================================================================= */}
          {activeTab === 'thresholds' && (
            <div className="vegsense-card">
              <div className="card-header-row">
                <div>
                  <h2 className="card-title">Storage Safety Thresholds</h2>
                  <div className="card-subtitle">Set critical limits for DHT22 and MQ-135 sensors to trigger alerts.</div>
                </div>
              </div>

              <form onSubmit={handleSaveThresholds} style={{ marginTop: '1.25rem' }}>
                <div className="thresholds-form-grid">
                  <div className="threshold-input-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Thermometer size={16} color="var(--primary)" />
                      <label className="threshold-card-label">Max Temperature (°C)</label>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      value={maxTemp}
                      onChange={(e) => setMaxTemp(parseFloat(e.target.value))}
                      className="login-form-input no-left-icon"
                      required
                    />
                    <div className="threshold-card-hint">Triggers warning if ambient temperature exceeds limit.</div>
                  </div>

                  <div className="threshold-input-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Droplets size={16} color="var(--primary)" />
                      <label className="threshold-card-label">Max Humidity (% RH)</label>
                    </div>
                    <input
                      type="number"
                      step="1"
                      value={maxHumidity}
                      onChange={(e) => setMaxHumidity(parseInt(e.target.value, 10))}
                      className="login-form-input no-left-icon"
                      required
                    />
                    <div className="threshold-card-hint">High moisture increases fungal mold germination.</div>
                  </div>

                  <div className="threshold-input-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Wind size={16} color="var(--primary)" />
                      <label className="threshold-card-label">Max VOC / Gas (ppm)</label>
                    </div>
                    <input
                      type="number"
                      step="5"
                      value={maxGas}
                      onChange={(e) => setMaxGas(parseInt(e.target.value, 10))}
                      className="login-form-input no-left-icon"
                      required
                    />
                    <div className="threshold-card-hint">Detects ethylene and decomposition gas buildup.</div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.5rem', width: 'auto' }}>
                    Save Threshold Limits
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* =========================================================================
              TAB: NOTIFICATIONS
              ========================================================================= */}
          {activeTab === 'notifications' && (
            <div className="vegsense-card">
              <div className="card-header-row">
                <div>
                  <h2 className="card-title">Notification Channels & Alerts</h2>
                  <div className="card-subtitle">Control real-time browser alerts and storage risk escalation.</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
                <div className="toggle-setting-row">
                  <div>
                    <div className="toggle-setting-title">Enable Real-Time Alerts</div>
                    <div className="toggle-setting-desc">Receive push notifications when sensor values drift from optimal preservation ranges.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={alertsEnabled}
                    onChange={(e) => setAlertsEnabled(e.target.checked)}
                    className="custom-toggle-input"
                  />
                </div>

                <div className="toggle-setting-row">
                  <div>
                    <div className="toggle-setting-title">Warning Alerts (Amber)</div>
                    <div className="toggle-setting-desc">Alert when humidity or temperature crosses secondary preservation buffer.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={warningAlerts}
                    onChange={(e) => setWarningAlerts(e.target.checked)}
                    className="custom-toggle-input"
                  />
                </div>

                <div className="toggle-setting-row">
                  <div>
                    <div className="toggle-setting-title">Critical Spoilage Alerts (Red)</div>
                    <div className="toggle-setting-desc">Urgent notification when ethylene or VOC indicates active bacterial decomposition.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={criticalAlerts}
                    onChange={(e) => setCriticalAlerts(e.target.checked)}
                    className="custom-toggle-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: DEVICE & HARDWARE
              ========================================================================= */}
          {activeTab === 'device' && (
            <div className="vegsense-card">
              <div className="card-header-row">
                <div>
                  <h2 className="card-title">Device & Hardware Telemetry</h2>
                  <div className="card-subtitle">ESP32 physical microcontroller gateway specifications and pins.</div>
                </div>
                <span className="risk-meter-status-badge status-badge-fresh" style={{ margin: 0 }}>
                  Active Gateway
                </span>
              </div>

              <div className="device-spec-grid" style={{ marginTop: '1.25rem' }}>
                <div className="device-spec-item">
                  <span className="spec-label">Device Identifier</span>
                  <span className="spec-value">{device.id}</span>
                </div>
                <div className="device-spec-item">
                  <span className="spec-label">Network IP Address</span>
                  <span className="spec-value">{device.ip}</span>
                </div>
                <div className="device-spec-item">
                  <span className="spec-label">Firmware Version</span>
                  <span className="spec-value">{device.firmware}</span>
                </div>
                <div className="device-spec-item">
                  <span className="spec-label">Wi-Fi Signal (RSSI)</span>
                  <span className="spec-value" style={{ color: 'var(--primary)' }}>-62 dBm (Strong)</span>
                </div>
                <div className="device-spec-item">
                  <span className="spec-label">DHT22 Digital Pin</span>
                  <span className="spec-value">GPIO 4</span>
                </div>
                <div className="device-spec-item">
                  <span className="spec-label">MQ-135 Analog Pin</span>
                  <span className="spec-value">GPIO 34 (ADC1)</span>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: ACCOUNT
              ========================================================================= */}
          {activeTab === 'account' && (
            <div className="vegsense-card">
              <div className="card-header-row">
                <div>
                  <h2 className="card-title">User Account Profile</h2>
                  <div className="card-subtitle">Manage storage manager identity and organization profile.</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
                <div>
                  <label className="threshold-card-label">Full Name</label>
                  <input
                    type="text"
                    value={currentUser?.name || 'Storage Manager'}
                    readOnly
                    className="login-form-input no-left-icon"
                    style={{ background: 'var(--bg-subtle)' }}
                  />
                </div>
                <div>
                  <label className="threshold-card-label">Email Address</label>
                  <input
                    type="email"
                    value={currentUser?.email || 'admin@vegsense.io'}
                    readOnly
                    className="login-form-input no-left-icon"
                    style={{ background: 'var(--bg-subtle)' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: SECURITY
              ========================================================================= */}
          {activeTab === 'security' && (
            <div className="vegsense-card">
              <div className="card-header-row">
                <div>
                  <h2 className="card-title">Security & Session</h2>
                  <div className="card-subtitle">Authentication session tokens and database encryption.</div>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="toggle-setting-row">
                  <div>
                    <div className="toggle-setting-title">HTTP-Only JWT Token</div>
                    <div className="toggle-setting-desc">Active secure cookie session for browser authentication.</div>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'var(--primary-light)' }}>
                    Active
                  </span>
                </div>

                <div className="toggle-setting-row">
                  <div>
                    <div className="toggle-setting-title">Hardware API Key Protection</div>
                    <div className="toggle-setting-desc">ESP32 gateway requests require encrypted bearer header.</div>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'var(--primary-light)' }}>
                    Enforced
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* COLUMN 3: Desktop Fixed / Sticky Live Preview Panel (Shown on desktop) */}
        {activeTab === 'appearance' && (
          <div className="settings-desktop-live-preview-rail">
            {renderLivePreviewCard()}
          </div>
        )}

      </div>
    </div>
  );
}
