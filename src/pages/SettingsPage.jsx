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
  Layers,
  Type,
  Square,
  Activity,
  ArrowRight
} from 'lucide-react';

export function SettingsPage() {
  const { currentUser } = useAuth();
  const { device, thresholds, updateThresholds } = useDevice();
  const { addToast } = useToast();

  const {
    settings,
    setTheme,
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
    addToast('Appearance reset to default (Fresh Green).', 'info');
  };

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'thresholds', label: 'Storage Thresholds', icon: Sliders },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'device', label: 'Device & Hardware', icon: Cpu },
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
          System Settings & Customization
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Configure visual themes, storage safety thresholds, alerting preferences, and hardware telemetry.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.75rem', alignItems: 'start' }}>
        {/* Settings Navigation Sidebar */}
        <div className="vegsense-card" style={{ padding: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: isActive ? 'var(--primary-light)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={17} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings Tab Content */}
        <div>
          {/* =========================================================================
              TAB: APPEARANCE (Full Engine with Live Preview)
              ========================================================================= */}
          {activeTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <div className="vegsense-card">
                <div className="card-header-row">
                  <div>
                    <h2 className="card-title">Customize how VegSense looks.</h2>
                    <div className="card-subtitle">Personalize the entire application visual experience in real time.</div>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ height: '34px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={handleResetAppearance}
                  >
                    <RotateCcw size={14} />
                    <span>Reset to Default</span>
                  </button>
                </div>

                {/* 1. Theme Selector: 7 Theme Cards */}
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                    1. Choose Your Style (7 Themes)
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                    {THEME_OPTIONS.map((theme) => {
                      const isSelected = settings.theme === theme.id;
                      return (
                        <div
                          key={theme.id}
                          className="vegsense-card"
                          style={{
                            padding: '1rem',
                            cursor: 'pointer',
                            border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                            background: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                            boxShadow: isSelected ? '0 0 0 3px var(--primary-glow)' : 'var(--shadow-sm)',
                            transition: 'all 0.15s ease'
                          }}
                          onClick={() => setTheme(theme.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: theme.primary, border: '2px solid #ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                              {theme.badge}
                            </span>
                          </div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                            {theme.name}
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                            {theme.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Accent Color: 5 Colors */}
                <div style={{ marginBottom: '2rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                    2. Accent Color
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {ACCENT_OPTIONS.map((accent) => {
                      const isSelected = settings.accent === accent.id;
                      return (
                        <button
                          key={accent.id}
                          type="button"
                          onClick={() => setAccent(accent.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.85rem',
                            borderRadius: 'var(--radius-md)',
                            border: isSelected ? `2px solid ${accent.color}` : '1px solid var(--border-light)',
                            background: isSelected ? 'var(--bg-subtle)' : 'var(--bg-card)',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: accent.color }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{accent.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Layout, Sidebar, Animation, Card Style, Font Size Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                  {/* Layout Style */}
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                      Layout Density
                    </label>
                    <select
                      value={settings.layout}
                      onChange={(e) => setLayout(e.target.value)}
                      className="login-form-input no-left-icon"
                      style={{ height: '40px', fontSize: '0.85rem' }}
                    >
                      <option value="compact">Compact (Dense)</option>
                      <option value="comfortable">Comfortable (Default)</option>
                      <option value="spacious">Spacious (Relaxed)</option>
                    </select>
                  </div>

                  {/* Sidebar Options */}
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                      Sidebar Mode
                    </label>
                    <select
                      value={settings.sidebarMode}
                      onChange={(e) => setSidebarMode(e.target.value)}
                      className="login-form-input no-left-icon"
                      style={{ height: '40px', fontSize: '0.85rem' }}
                    >
                      <option value="expanded">Expanded (Full width)</option>
                      <option value="compact">Compact (Icons only)</option>
                      <option value="hidden">Hidden (Drawer only)</option>
                    </select>
                  </div>

                  {/* Animation Options */}
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                      Animations
                    </label>
                    <select
                      value={settings.animation}
                      onChange={(e) => setAnimation(e.target.value)}
                      className="login-form-input no-left-icon"
                      style={{ height: '40px', fontSize: '0.85rem' }}
                    >
                      <option value="full">Full (Dynamic)</option>
                      <option value="subtle">Subtle (Default)</option>
                      <option value="off">Off (Static)</option>
                    </select>
                  </div>

                  {/* Card Style */}
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                      Card Style
                    </label>
                    <select
                      value={settings.cardStyle}
                      onChange={(e) => setCardStyle(e.target.value)}
                      className="login-form-input no-left-icon"
                      style={{ height: '40px', fontSize: '0.85rem' }}
                    >
                      <option value="rounded">Rounded (16px)</option>
                      <option value="soft">Soft (24px)</option>
                      <option value="sharp">Sharp (6px)</option>
                    </select>
                  </div>

                  {/* Font Size */}
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                      Font Size
                    </label>
                    <select
                      value={settings.fontSize}
                      onChange={(e) => setFontSize(e.target.value)}
                      className="login-form-input no-left-icon"
                      style={{ height: '40px', fontSize: '0.85rem' }}
                    >
                      <option value="small">Small (13.5px)</option>
                      <option value="medium">Medium (15px Default)</option>
                      <option value="large">Large (16.5px)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* LIVE PREVIEW CARD */}
              <div className="vegsense-card" style={{ border: '2px dashed var(--primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                  <Sparkles size={20} />
                  <h3 className="card-title">LIVE PREVIEW</h3>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  See your active theme, accent, and card curvature updates reflected instantly below:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--card-radius)', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                      VegSense Storage Bay #04
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Active Theme: <strong>{settings.theme}</strong> • Accent: <strong>{settings.accent}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
                      <span className="risk-meter-status-badge status-badge-fresh" style={{ marginTop: 0 }}>
                        Fresh (18%)
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                        28.5°C
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button type="button" className="btn-primary" style={{ height: '42px' }}>
                      Primary Action Button
                    </button>
                    <button type="button" className="btn-secondary" style={{ height: '42px' }}>
                      Secondary Neutral Button
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: STORAGE THRESHOLDS
              ========================================================================= */}
          {activeTab === 'thresholds' && (
            <div className="vegsense-card">
              <h2 className="card-title" style={{ marginBottom: '0.5rem' }}>Storage Environmental Thresholds</h2>
              <p className="card-subtitle" style={{ marginBottom: '1.75rem' }}>
                Set safety alarm triggers for temperature, relative humidity, and MQ-135 volatile organic gas levels.
              </p>

              <form onSubmit={handleSaveThresholds}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontWeight: 700, fontSize: '0.9rem' }}>
                      <span>Temperature Warning Threshold (°C)</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{maxTemp}°C</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="38"
                      value={maxTemp}
                      onChange={(e) => setMaxTemp(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--primary)' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Alert will trigger if chamber exceeds this value.</div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontWeight: 700, fontSize: '0.9rem' }}>
                      <span>Relative Humidity Safety Ceiling (%)</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{maxHumidity}%</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="90"
                      value={maxHumidity}
                      onChange={(e) => setMaxHumidity(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--primary)' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Excess humidity promotes fungal spores and bacterial spoilage.</div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontWeight: 700, fontSize: '0.9rem' }}>
                      <span>Gas / VOC Trigger Limit (ppm)</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{maxGas} ppm</span>
                    </div>
                    <input
                      type="range"
                      min="400"
                      max="800"
                      value={maxGas}
                      onChange={(e) => setMaxGas(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--primary)' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>MQ-135 detects ethylene and ammonia emitted during early vegetable breakdown.</div>
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0 1.5rem' }}>
                  Save Thresholds
                </button>
              </form>
            </div>
          )}

          {/* =========================================================================
              TAB: NOTIFICATIONS
              ========================================================================= */}
          {activeTab === 'notifications' && (
            <div className="vegsense-card">
              <h2 className="card-title" style={{ marginBottom: '0.5rem' }}>Notification Preferences</h2>
              <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>
                Manage push notifications, auditory warnings, and event routing.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
                <label className="checkbox-label" style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Enable All Storage Alerts</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Master switch for desktop and telemetry notification banners.</div>
                  </div>
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={alertsEnabled}
                    onChange={(e) => setAlertsEnabled(e.target.checked)}
                  />
                </label>

                <label className="checkbox-label" style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Warning Severity Alerts</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Send notification when temperature or humidity drifts near limits.</div>
                  </div>
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={warningAlerts}
                    onChange={(e) => setWarningAlerts(e.target.checked)}
                  />
                </label>

                <label className="checkbox-label" style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Critical Spoilage Alarms</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>High priority notification if VOC gases spike above 500 ppm.</div>
                  </div>
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={criticalAlerts}
                    onChange={(e) => setCriticalAlerts(e.target.checked)}
                  />
                </label>
              </div>

              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', padding: '0 1.5rem' }}
                onClick={() => addToast('Notification preferences saved.', 'success')}
              >
                Save Notification Settings
              </button>
            </div>
          )}

          {/* =========================================================================
              TAB: DEVICE & HARDWARE
              ========================================================================= */}
          {activeTab === 'device' && (
            <div className="vegsense-card">
              <h2 className="card-title" style={{ marginBottom: '0.5rem' }}>Hardware Gateway Configuration</h2>
              <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>
                Physical prototype node specs and network assignment.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>DEVICE IDENTIFIER</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{device.id}</div>
                </div>
                <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ASSIGNED IP</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'monospace' }}>{device.ip}</div>
                </div>
                <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PIN ASSIGNMENTS</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>DHT22: GPIO 4 • MQ-135: GPIO 34</div>
                </div>
                <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PERIPHERALS</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>OLED: I2C (21/22) • LEDs: 18/19/23</div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: ACCOUNT
              ========================================================================= */}
          {activeTab === 'account' && (
            <div className="vegsense-card">
              <h2 className="card-title" style={{ marginBottom: '0.5rem' }}>Account Information</h2>
              <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>
                Your VegSense operator profile.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '420px', marginBottom: '1.5rem' }}>
                <div>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="login-form-input no-left-icon"
                    defaultValue={currentUser?.name || ''}
                    readOnly
                  />
                </div>
                <div>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="login-form-input no-left-icon"
                    defaultValue={currentUser?.email || ''}
                    readOnly
                  />
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Account authentication token is securely managed and active.
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB: SECURITY
              ========================================================================= */}
          {activeTab === 'security' && (
            <div className="vegsense-card">
              <h2 className="card-title" style={{ marginBottom: '0.5rem' }}>Security & Credentials</h2>
              <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>
                Password updates and session protection.
              </p>

              <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Session Token</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Protected by 256-bit encrypted JWT Bearer authentication. Password hashes are verified via bcrypt.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
