import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';
import { useAlerts } from '../context/AlertContext';
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
  SunMedium,
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
    preferences,
    updatePreferences,
    alertThresholds,
    updateAlertThresholds,
    requestBrowserPermission
  } = useAlerts();

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
  const [maxTemp, setMaxTemp] = useState(thresholds.maxTemp ?? 30);
  const [maxHumidity, setMaxHumidity] = useState(thresholds.maxHumidity ?? 80);
  const [maxGas, setMaxGas] = useState(thresholds.maxGas ?? 500);

  // Light Sensor Settings (BH1750 / LDR)
  const [lightMonitoringEnabled, setLightMonitoringEnabled] = useState(thresholds.lightMonitoringEnabled ?? true);
  const [minLight, setMinLight] = useState(thresholds.minLight ?? 100);
  const [maxLight, setMaxLight] = useState(thresholds.maxLight ?? 500);
  const [alertLowLight, setAlertLowLight] = useState(thresholds.alertLowLight ?? true);
  const [alertHighLight, setAlertHighLight] = useState(thresholds.alertHighLight ?? true);

  // Notification toggles
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [warningAlerts, setWarningAlerts] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);

  const handleSaveThresholds = (e) => {
    e.preventDefault();
    updateThresholds({
      maxTemp,
      maxHumidity,
      maxGas,
      lightMonitoringEnabled,
      minLight,
      maxLight,
      alertLowLight,
      alertHighLight
    });
    addToast('Storage threshold limits and Light Sensor settings saved.', 'success');
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

          <div className="preview-telemetry-item" style={{ gridColumn: 'span 2' }}>
            <span className="preview-telemetry-label">Light Level</span>
            <span className="preview-telemetry-val" style={{ color: '#d97706' }}>420 lux (Normal)</span>
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

                {/* Light Sensor Settings Section */}
                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <SunMedium size={18} color="#d97706" />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                          Light Sensor Settings (BH1750 / LDR)
                        </h3>
                      </div>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Configure ambient photic limits. Thresholds are customizable because appropriate exposure varies across crops.
                      </p>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      <span>Enable Light Monitoring:</span>
                      <input
                        type="checkbox"
                        checked={lightMonitoringEnabled}
                        onChange={(e) => setLightMonitoringEnabled(e.target.checked)}
                        className="custom-toggle-input"
                      />
                    </label>
                  </div>

                  <div className="thresholds-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    {/* Minimum Light Threshold */}
                    <div className="threshold-input-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Sun size={16} color="#eab308" />
                        <label className="threshold-card-label">Minimum Light (lux)</label>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="2000"
                        step="10"
                        value={minLight}
                        onChange={(e) => setMinLight(parseInt(e.target.value, 10) || 0)}
                        className="login-form-input no-left-icon"
                        disabled={!lightMonitoringEnabled}
                        required
                      />
                      <div className="threshold-card-hint">
                        Default: 100 lux. Readings below this level trigger <strong>LOW LIGHT</strong> classification.
                      </div>
                    </div>

                    {/* Maximum Light Threshold */}
                    <div className="threshold-input-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <SunMedium size={16} color="#ef4444" />
                        <label className="threshold-card-label">Maximum Light (lux)</label>
                      </div>
                      <input
                        type="number"
                        min="10"
                        max="10000"
                        step="10"
                        value={maxLight}
                        onChange={(e) => setMaxLight(parseInt(e.target.value, 10) || 100)}
                        className="login-form-input no-left-icon"
                        disabled={!lightMonitoringEnabled}
                        required
                      />
                      <div className="threshold-card-hint">
                        Default: 500 lux. Readings above this level trigger <strong>HIGH LIGHT</strong> classification.
                      </div>
                    </div>
                  </div>

                  {/* Light Alert Toggles */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem', padding: '1rem', borderRadius: '10px', background: 'var(--bg-subtle, rgba(0,0,0,0.02))', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Alert on Low Light (&lt; {minLight} lux)</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Notify when storage compartment drops below minimum photic threshold.</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={alertLowLight}
                        onChange={(e) => setAlertLowLight(e.target.checked)}
                        disabled={!lightMonitoringEnabled}
                        className="custom-toggle-input"
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Alert on High Light (&gt; {maxLight} lux)</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Notify when excessive illumination exposes produce to chlorophyll degradation or solanine risk.</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={alertHighLight}
                        onChange={(e) => setAlertHighLight(e.target.checked)}
                        disabled={!lightMonitoringEnabled}
                        className="custom-toggle-input"
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '0.75rem 1.75rem', width: 'auto' }}>
                    Save All Thresholds & Light Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* =========================================================================
              TAB: NOTIFICATIONS (Part 7: Alerts & Notifications Configuration)
              ========================================================================= */}
          {activeTab === 'notifications' && (
            <div className="vegsense-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card-header-row">
                <div>
                  <h2 className="card-title">Alerts & Notification Preferences</h2>
                  <div className="card-subtitle">Configure environmental alarms, desktop browser notifications, and threshold limits.</div>
                </div>
              </div>

              {/* 1. Global & Browser Notification Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="toggle-setting-row">
                  <div>
                    <div className="toggle-setting-title">Enable In-App Notifications</div>
                    <div className="toggle-setting-desc">Display real-time banners and notification bell badges for threshold events.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={alertsEnabled}
                    onChange={(e) => setAlertsEnabled(e.target.checked)}
                    className="custom-toggle-input"
                  />
                </div>

                <div className="toggle-setting-row" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem' }}>
                  <div>
                    <div className="toggle-setting-title">Desktop Browser Notifications</div>
                    <div className="toggle-setting-desc">
                      Display native OS/browser popups when HIGH or CRITICAL environmental risks occur.
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ height: '32px', fontSize: '0.785rem', padding: '0 0.65rem' }}
                      onClick={async () => {
                        const perm = await requestBrowserPermission();
                        if (perm === 'granted') {
                          addToast('Browser notifications enabled successfully.', 'success');
                        } else {
                          addToast('Browser notification permission was not granted.', 'warning');
                        }
                      }}
                    >
                      Enable Browser Notifications
                    </button>
                    <input
                      type="checkbox"
                      checked={preferences.browserNotifications}
                      onChange={(e) => updatePreferences({ browserNotifications: e.target.checked })}
                      className="custom-toggle-input"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Notification Category Preferences (Section 41) */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Alert Category Filters
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Toggle notifications for specific microclimate and equipment event types.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                  {[
                    { key: 'temperatureAlerts', label: 'Temperature Alerts', desc: 'Threshold crossings (> 30°C / > 35°C)' },
                    { key: 'humidityAlerts', label: 'Humidity Alerts', desc: 'Moisture limits (< 50% / > 80%)' },
                    { key: 'gasAlerts', label: 'Gas / VOC Indicator Alerts', desc: 'MQ-135 readings (> 500 / > 700)' },
                    { key: 'lightAlerts', label: 'Light Level Alerts', desc: 'Photic exposure (< 100 / > 500 lux)' },
                    { key: 'spoilageAlerts', label: 'Spoilage Risk Alerts', desc: 'Multi-factor risk score escalations' },
                    { key: 'storageExpiryAlerts', label: 'Storage Expiry Reminders', desc: '7d, 3d, 1d and expiry reminders' },
                    { key: 'deviceAlerts', label: 'Device Connectivity Alerts', desc: 'ESP32 offline and reconnected events' },
                    { key: 'sensorAlerts', label: 'Sensor Availability Alerts', desc: 'Telemetry dropout and recovery events' }
                  ].map((cat) => (
                    <div
                      key={cat.key}
                      style={{
                        padding: '0.75rem 0.85rem',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>{cat.label}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{cat.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences[cat.key] !== false}
                        onChange={(e) => updatePreferences({ [cat.key]: e.target.checked })}
                        className="custom-toggle-input"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Spoilage & Expiry Threshold Settings (Section 39) */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Risk & Reminder Thresholds
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Customize the score thresholds for risk classification transitions and batch expiry scheduling.
                </p>

                <div className="thresholds-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <div className="threshold-input-card">
                    <label className="threshold-card-label">Spoilage Warning (%)</label>
                    <input
                      type="number"
                      min="10"
                      max="50"
                      value={alertThresholds.spoilageWarning ?? 30}
                      onChange={(e) => updateAlertThresholds({ spoilageWarning: parseInt(e.target.value, 10) || 30 })}
                      className="login-form-input no-left-icon"
                    />
                    <div className="threshold-card-hint">Default: 31%. Triggers WARNING risk alert.</div>
                  </div>

                  <div className="threshold-input-card">
                    <label className="threshold-card-label">Spoilage Risk (%)</label>
                    <input
                      type="number"
                      min="40"
                      max="75"
                      value={alertThresholds.spoilageRisk ?? 60}
                      onChange={(e) => updateAlertThresholds({ spoilageRisk: parseInt(e.target.value, 10) || 60 })}
                      className="login-form-input no-left-icon"
                    />
                    <div className="threshold-card-hint">Default: 61%. Triggers HIGH risk alert.</div>
                  </div>

                  <div className="threshold-input-card">
                    <label className="threshold-card-label">Critical Risk (%)</label>
                    <input
                      type="number"
                      min="70"
                      max="95"
                      value={alertThresholds.spoilageCritical ?? 80}
                      onChange={(e) => updateAlertThresholds({ spoilageCritical: parseInt(e.target.value, 10) || 80 })}
                      className="login-form-input no-left-icon"
                    />
                    <div className="threshold-card-hint">Default: 81%. Triggers CRITICAL risk alert.</div>
                  </div>
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
