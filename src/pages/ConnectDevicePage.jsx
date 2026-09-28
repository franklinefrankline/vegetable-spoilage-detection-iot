import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, useLocation, Link } from '../router/Router';
import { BrandLogo } from '../components/BrandLogo';
import {
  Cpu,
  Wifi,
  Gauge,
  Wind,
  Tv,
  LogOut,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Info,
  Server
} from 'lucide-react';

export function ConnectDevicePage() {
  const { currentUser, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [espIp, setEspIp] = useState('192.168.1.105');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectMessage, setConnectMessage] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
      addToast('Logged out successfully.', 'info');
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/login');
    }
  };

  const handleConnectAttempt = (e) => {
    e.preventDefault();
    if (!espIp.trim()) {
      addToast('Please enter an ESP32 IP address.', 'error');
      return;
    }

    setIsConnecting(true);
    setConnectMessage('');

    setTimeout(() => {
      setIsConnecting(false);
      setConnectMessage(
        `Hardware Target Staged: [${espIp.trim()}]. Part 1 authentication & routing complete. In Part 2, the system initiates live socket/HTTP ping verification and loads real-time DHT22 and MQ-135 telemetry!`
      );
      addToast('ESP32 Target Registered for Part 2 verification.', 'success');
    }, 1000);
  };

  const isOtherProtectedRoute = pathname !== '/connect-device';

  return (
    <div className="app-shell">
      {/* Navigation Header */}
      <header className="app-navbar">
        <div className="nav-brand">
          <BrandLogo size={36} showText={true} />
        </div>

        {/* Protected Navigation Links */}
        <nav className="nav-links" aria-label="Main Navigation">
          <Link
            href="/connect-device"
            className={`nav-link-btn ${pathname === '/connect-device' ? 'active' : ''}`}
          >
            Connect Device
          </Link>
          <Link
            href="/dashboard"
            className={`nav-link-btn ${pathname === '/dashboard' ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link
            href="/sensors"
            className={`nav-link-btn ${pathname === '/sensors' ? 'active' : ''}`}
          >
            Sensors
          </Link>
          <Link
            href="/alerts"
            className={`nav-link-btn ${pathname === '/alerts' ? 'active' : ''}`}
          >
            Alerts
          </Link>
          <Link
            href="/reports"
            className={`nav-link-btn ${pathname === '/reports' ? 'active' : ''}`}
          >
            Reports
          </Link>
          <Link
            href="/settings"
            className={`nav-link-btn ${pathname === '/settings' ? 'active' : ''}`}
          >
            Settings
          </Link>
        </nav>

        {/* User Info & Logout Button */}
        <div className="nav-user-actions">
          <div className="user-badge" title={currentUser?.email || ''}>
            <div className="user-avatar-circle">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="user-name-text">{currentUser?.name || 'User'}</span>
          </div>

          <button
            id="btn-logout"
            type="button"
            className="btn-logout"
            onClick={handleLogout}
            title="Sign out of system"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content-container">
        {isOtherProtectedRoute ? (
          /* Placeholder view for /dashboard, /sensors, /alerts, /reports, /settings */
          <div className="connect-card">
            <div className="step-pill">
              <Info size={13} />
              Protected Module: {pathname.replace('/', '').toUpperCase()}
            </div>
            <h2 className="connect-title">Hardware Connection Required</h2>
            <p className="connect-subtitle">
              You are authenticated as <strong>{currentUser?.name}</strong> ({currentUser?.email}).
              Access to live telemetry and dashboards requires establishing a connection with the ESP32 storage unit.
            </p>

            <div className="alert-banner alert-info" style={{ marginTop: '1.5rem' }}>
              <Server size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Part 1 Complete:</strong> Route protection is fully active! To unlock this live telemetry view in Part 2, connect your ESP32 microcontroller first.
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', padding: '0 1.5rem' }}
                onClick={() => navigate('/connect-device')}
              >
                Go to Connect Device Screen &rarr;
              </button>
            </div>
          </div>
        ) : (
          /* Primary /connect-device Page */
          <div className="connect-card">
            <div className="step-pill">
              <Radio size={13} />
              Step 1 of 2: Hardware Provisioning
            </div>

            <h1 className="connect-title">Connect Your ESP32 Storage Monitor</h1>
            <p className="connect-subtitle">
              Welcome, <strong>{currentUser?.name}</strong>! To begin monitoring produce storage conditions and spoilage markers, enter the local IP address assigned to your physical ESP32 prototype.
            </p>

            {/* Hardware Telemetry Preview Grid */}
            <div className="hardware-specs-grid">
              <div className="hardware-spec-box">
                <div className="spec-icon-box">
                  <Cpu size={20} />
                </div>
                <div>
                  <div className="spec-info-title">ESP32 Core</div>
                  <div className="spec-info-desc">Wi-Fi & HTTP Telemetry Gateway</div>
                </div>
              </div>

              <div className="hardware-spec-box">
                <div className="spec-icon-box">
                  <Gauge size={20} />
                </div>
                <div>
                  <div className="spec-info-title">DHT22 Sensor</div>
                  <div className="spec-info-desc">Temperature & Relative Humidity</div>
                </div>
              </div>

              <div className="hardware-spec-box">
                <div className="spec-icon-box">
                  <Wind size={20} />
                </div>
                <div>
                  <div className="spec-info-title">MQ-135 Sensor</div>
                  <div className="spec-info-desc">Air Quality & Spoilage Gas Detection</div>
                </div>
              </div>

              <div className="hardware-spec-box">
                <div className="spec-icon-box">
                  <Tv size={20} />
                </div>
                <div>
                  <div className="spec-info-title">OLED & LEDs</div>
                  <div className="spec-info-desc">Tri-Color Fresh/Warning/Spoilage Alert</div>
                </div>
              </div>
            </div>

            {/* IP Connection Box */}
            <div className="ip-connect-form">
              <label htmlFor="esp-ip-input" className="form-label" style={{ marginBottom: '0.25rem' }}>
                <span>ESP32 Local Network IP Address</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Found on prototype OLED screen</span>
              </label>

              <form onSubmit={handleConnectAttempt} className="ip-input-row">
                <input
                  id="esp-ip-input"
                  type="text"
                  className="ip-input"
                  value={espIp}
                  onChange={(e) => setEspIp(e.target.value)}
                  placeholder="e.g. 192.168.1.105"
                  disabled={isConnecting}
                />
                <button
                  id="btn-connect-device"
                  type="submit"
                  className="btn-connect-device"
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <span className="spinner" aria-hidden="true"></span>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Wifi size={18} />
                      <span>CONNECT DEVICE</span>
                    </>
                  )}
                </button>
              </form>

              {connectMessage && (
                <div className="alert-banner alert-success" style={{ marginTop: '1.25rem' }}>
                  <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>{connectMessage}</div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={16} />
              <span>
                Physical prototype uses pin assignments: DHT22 (GPIO 4), MQ-135 (GPIO 34 ADC), OLED (I2C 21/22), and Status LEDs (Green: GPIO 18, Yellow: GPIO 19, Red: GPIO 23).
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
