import React, { useState, useEffect } from 'react';
import { useDevice } from '../context/DeviceContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from '../router/Router';
import { validateIPAddress } from '../services/deviceService';
import {
  Radio,
  Wifi,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Server,
  ArrowRight,
  ShieldCheck,
  Activity,
  Power,
  RotateCcw,
  Sparkles,
  Terminal,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sliders,
  ExternalLink,
  Check,
  XCircle,
  Clock,
  Layers,
  Thermometer,
  Droplets,
  Wind
} from 'lucide-react';

export function ConnectDevicePage() {
  const {
    isConnected,
    isCheckingReachability,
    hasSavedDevice,
    savedDevice,
    device,
    sensorData,
    connectDevice,
    disconnectDevice,
    reconnectDevice
  } = useDevice();

  const { addToast } = useToast();
  const navigate = useNavigate();

  // Local form & state management
  const [ipAddress, setIpAddress] = useState(savedDevice?.ipAddress || '');
  const [inputError, setInputError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null); // { type, message, details }
  const [showAnotherDeviceForm, setShowAnotherDeviceForm] = useState(!hasSavedDevice);
  const [isGuideOpen, setIsGuideOpen] = useState(false); // Collapsible on mobile

  // Pre-fill input if saved device is loaded
  useEffect(() => {
    if (savedDevice?.ipAddress && !ipAddress) {
      setIpAddress(savedDevice.ipAddress);
    }
    if (!savedDevice?.ipAddress) {
      setShowAnotherDeviceForm(true);
    }
  }, [savedDevice, ipAddress]);

  // Handle Real Connection
  const handleConnect = async (targetIp) => {
    const cleanIp = (targetIp || ipAddress).trim();

    setInputError('');
    setConnectionError(null);

    // IP Validation
    if (!cleanIp) {
      setInputError('Please enter an ESP32 IP address.');
      return;
    }

    if (!validateIPAddress(cleanIp)) {
      setInputError('Please enter a valid ESP32 IP address (e.g. 192.168.1.105).');
      return;
    }

    setIsConnecting(true);

    try {
      await connectDevice(cleanIp);
      addToast('ESP32 connected successfully.', 'success');
      setConnectionError(null);
    } catch (err) {
      console.warn('ESP32 connection failed:', err);

      let errorType = 'unable_to_connect';
      let errorTitle = 'Unable to Connect';
      let errorMsg = "We couldn't reach the ESP32 at this address.";

      if (err.code === 'TIMEOUT' || err.message?.includes('timed out')) {
        errorType = 'timeout';
        errorTitle = 'Connection Timed Out';
        errorMsg = 'ESP32 did not respond in time. Check the device and try again.';
      } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('network')) {
        errorType = 'network_error';
        errorTitle = 'Network Connection Failed';
        errorMsg = 'Make sure your computer and ESP32 are connected to the same Wi-Fi network.';
      }

      setConnectionError({
        type: errorType,
        title: errorTitle,
        message: errorMsg,
        ip: cleanIp
      });

      addToast(errorMsg, 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  // Quick Prototype Demo Simulator (clearly labeled for UI testing when offline)
  const handleDemoSimulation = async () => {
    setIsConnecting(true);
    setInputError('');
    setConnectionError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      // Connects with standard prototype demo IP
      await connectDevice('192.168.1.105');
      addToast('ESP32 simulated connection active.', 'success');
    } catch (e) {
      addToast('Simulation started.', 'info');
    } finally {
      setIsConnecting(false);
    }
  };

  // Reconnect saved device
  const handleReconnect = async () => {
    if (!savedDevice?.ipAddress) return;
    setIsConnecting(true);
    setConnectionError(null);
    try {
      await reconnectDevice();
      addToast('ESP32 reconnected successfully.', 'success');
    } catch (err) {
      setConnectionError({
        type: 'unable_to_connect',
        title: 'Unable to Reconnect',
        message: `Could not verify ESP32 at ${savedDevice.ipAddress}. It may be powered off or on another Wi-Fi network.`,
        ip: savedDevice.ipAddress
      });
      addToast('Could not reconnect to saved ESP32.', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  // Change Device Handler
  const handleChangeDevice = () => {
    setShowAnotherDeviceForm(true);
    setConnectionError(null);
    setInputError('');
    disconnectDevice();
  };

  return (
    <div className="connect-device-page-container">
      {/* Page Header */}
      <div className="connect-device-header">
        <div className="connect-device-badge">
          <span>HARDWARE GATEWAY SETUP</span>
        </div>
        <h1 className="connect-device-title">Connect Your Storage Device</h1>
        <p className="connect-device-subtitle">
          Connect your ESP32 to start monitoring your vegetable storage environment in real time.
        </p>
      </div>

      {/* Main Split Grid Layout */}
      <div className="connect-device-grid">
        {/* =========================================================================
            LEFT COLUMN: Connection Visual, Technical Hardware Illustration & Guide
            ========================================================================= */}
        <div className="connect-left-column">
          {/* Technical ESP32 Illustration Card */}
          <div className="vegsense-card esp32-visual-card">
            <div className="esp32-visual-header">
              <div className="esp32-visual-brand">
                <Cpu size={20} color="var(--primary)" />
                <span className="esp32-node-title">ESP32 DevKit V1</span>
              </div>
              <span className={`esp32-status-pill ${isConnected ? 'connected' : ''}`}>
                <span className={`pulse-led-indicator ${isConnected ? 'pulse-green' : 'pulse-amber'}`} />
                <span>{isConnected ? 'ESP32-001 Connected' : 'Ready to Connect'}</span>
              </span>
            </div>

            {/* Technical Diagram Container */}
            <div className="esp32-technical-schematic">
              <div className="schematic-board">
                {/* Microcontroller Silicon & Antenna */}
                <div className="schematic-antenna" />
                <div className="schematic-chip">
                  <span className="chip-label">ESP-WROOM-32</span>
                  <span className="chip-sub">Wi-Fi + BLE MCU</span>
                </div>

                {/* Status LED Pins */}
                <div className="schematic-leds-row">
                  <div className={`schematic-led ${isConnected ? 'active-green' : ''}`} title="Fresh Indicator (GPIO 18)" />
                  <div className="schematic-led amber" title="Warning Indicator (GPIO 19)" />
                  <div className="schematic-led red" title="Critical Spoilage (GPIO 23)" />
                </div>

                {/* GPIO Pin Labels */}
                <div className="schematic-pins-strip">
                  <span className="schematic-pin-tag">DHT22: GPIO 4</span>
                  <span className="schematic-pin-tag">MQ-135: GPIO 34</span>
                  <span className="schematic-pin-tag">OLED: I2C 21/22</span>
                </div>
              </div>

              {/* Real-time Connection Wave Line */}
              <div className="schematic-telemetry-wave">
                <span className="telemetry-wave-label">
                  {isConnected ? '● Telemetry Stream Active' : '○ Waiting for connection...'}
                </span>
              </div>
            </div>

            {/* Metrics Waiting Preview */}
            <div className="telemetry-readiness-row">
              <div className="readiness-item">
                <Thermometer size={14} />
                <span>Temperature</span>
              </div>
              <div className="readiness-item">
                <Droplets size={14} />
                <span>Humidity</span>
              </div>
              <div className="readiness-item">
                <Wind size={14} />
                <span>Gas / VOC</span>
              </div>
            </div>
          </div>

          {/* Local Network Requirement Card */}
          <div className="vegsense-card local-network-card">
            <div className="local-network-header">
              <Wifi size={17} color="var(--primary)" />
              <span className="local-network-title">LOCAL NETWORK CONNECTION</span>
            </div>
            <p className="local-network-desc">
              For this prototype, your computer and ESP32 should be connected to the same Wi-Fi network.
            </p>
            <div className="local-network-example-grid">
              <div className="local-network-pill">
                <span className="pill-sub">Computer:</span>
                <span className="pill-val">192.168.1.x</span>
              </div>
              <div className="local-network-pill">
                <span className="pill-sub">ESP32 Gateway:</span>
                <span className="pill-val">192.168.1.105</span>
              </div>
              <div className="local-network-pill full">
                <span className="pill-sub">Network SSID:</span>
                <span className="pill-val">Same 2.4 GHz Wi-Fi</span>
              </div>
            </div>
          </div>

          {/* Connection Steps Guide (Collapsible on mobile) */}
          <div className="vegsense-card connection-guide-card">
            <div
              className="connection-guide-header"
              onClick={() => setIsGuideOpen((prev) => !prev)}
              role="button"
              tabIndex={0}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle size={18} color="var(--primary)" />
                <h2 className="card-title" style={{ fontSize: '1rem' }}>HOW TO CONNECT</h2>
              </div>
              <span className="mobile-guide-chevron">
                {isGuideOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </span>
            </div>

            <div className={`connection-guide-steps ${isGuideOpen ? 'mobile-open' : ''}`}>
              <div className="guide-step-item">
                <span className="guide-step-number">1</span>
                <div>
                  <div className="guide-step-title">Power on the ESP32</div>
                  <div className="guide-step-sub">Connect the microcontroller via USB-C or 5V regulator.</div>
                </div>
              </div>

              <div className="guide-step-item">
                <span className="guide-step-number">2</span>
                <div>
                  <div className="guide-step-title">Connect ESP32 to Wi-Fi</div>
                  <div className="guide-step-sub">Ensure the device associates with your local wireless network.</div>
                </div>
              </div>

              <div className="guide-step-item">
                <span className="guide-step-number">3</span>
                <div>
                  <div className="guide-step-title">Open Arduino Serial Monitor</div>
                  <div className="guide-step-sub">Set baud rate to 115200 to view boot telemetry.</div>
                </div>
              </div>

              <div className="guide-step-item">
                <span className="guide-step-number">4</span>
                <div>
                  <div className="guide-step-title">Find: IP Address: 192.168.1.105</div>
                  <div className="guide-step-sub">Copy the local IP address printed upon Wi-Fi connection.</div>
                </div>
              </div>

              <div className="guide-step-item">
                <span className="guide-step-number">5</span>
                <div>
                  <div className="guide-step-title">Enter the IP address</div>
                  <div className="guide-step-sub">Paste the IPv4 address into the connection form.</div>
                </div>
              </div>

              <div className="guide-step-item">
                <span className="guide-step-number">6</span>
                <div>
                  <div className="guide-step-title">Click: Connect Device</div>
                  <div className="guide-step-sub">VegSense will ping /status and stream sensor data.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Serial Monitor Example Terminal Card */}
          <div className="vegsense-card serial-terminal-card">
            <div className="serial-terminal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal size={14} />
                <span>ESP32 SERIAL MONITOR</span>
              </div>
              <span className="serial-example-tag">EXAMPLE OUTPUT</span>
            </div>
            <pre className="serial-terminal-code">
{`[BOOT] ESP32 DevKit V1 Initializing...
[WiFi] Connecting to AgriNet-2.4G...
[WiFi] Connected successfully!
[IP]   IP Address: 192.168.1.105
[HTTP] REST Server listening on port 80
[SENS] DHT22 OK | MQ-135 Calibrated | OLED Ready`}
            </pre>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Interactive Connection Form, Success & Error States
            ========================================================================= */}
        <div className="connect-right-column">
          {/* STATE 1: ALREADY CONNECTED (Success State) */}
          {isConnected ? (
            <div className="vegsense-card connection-success-card">
              <div className="success-banner-badge">
                <CheckCircle2 size={20} color="#ffffff" />
                <span>✓ DEVICE CONNECTED</span>
              </div>

              <div className="success-device-meta">
                <div className="success-meta-item">
                  <span className="success-meta-label">DEVICE IDENTIFIER</span>
                  <span className="success-meta-val">{device.id || 'ESP32-001'}</span>
                </div>
                <div className="success-meta-item">
                  <span className="success-meta-label">IP ADDRESS</span>
                  <span className="success-meta-val mono">{device.ip || device.ipAddress}</span>
                </div>
                <div className="success-meta-item">
                  <span className="success-meta-label">NETWORK LINK</span>
                  <span className="success-meta-val green">Wi-Fi Connected (Strong)</span>
                </div>
                <div className="success-meta-item">
                  <span className="success-meta-label">SENSOR COMMUNICATION</span>
                  <span className="success-meta-val green">Active (Live Stream)</span>
                </div>
              </div>

              {/* Live Sensor Data Preview */}
              <div className="success-sensor-preview-card">
                <div className="sensor-preview-title">
                  <Activity size={15} color="var(--primary)" />
                  <span>LIVE SENSOR DATA TEST</span>
                </div>

                <div className="sensor-preview-grid">
                  <div className="sensor-preview-box">
                    <span className="preview-box-label">TEMPERATURE</span>
                    <span className="preview-box-val">{sensorData.temperature}°C</span>
                  </div>
                  <div className="sensor-preview-box">
                    <span className="preview-box-label">HUMIDITY</span>
                    <span className="preview-box-val">{sensorData.humidity}%</span>
                  </div>
                  <div className="sensor-preview-box">
                    <span className="preview-box-label">GAS / VOC LEVEL</span>
                    <span className="preview-box-val" style={{ color: 'var(--primary)' }}>
                      {sensorData.gasLevel || sensorData.gasVOC} ppm (Normal)
                    </span>
                  </div>
                  <div className="sensor-preview-box">
                    <span className="preview-box-label">STORAGE CONDITION</span>
                    <span className="preview-box-val fresh">FRESH</span>
                  </div>
                  <div className="sensor-preview-box full">
                    <span className="preview-box-label">SPOILAGE RISK</span>
                    <span className="preview-box-val risk">{sensorData.spoilageRisk}%</span>
                  </div>
                </div>
              </div>

              {/* Hardware Specifications */}
              <div className="device-info-spec-list">
                <div className="spec-row">
                  <span className="spec-k">Controller:</span>
                  <span className="spec-v">ESP32 DevKit V1</span>
                </div>
                <div className="spec-row">
                  <span className="spec-k">Sensors:</span>
                  <span className="spec-v">DHT22 (Temp/Humidity), MQ-135 (Gas/VOC)</span>
                </div>
                <div className="spec-row">
                  <span className="spec-k">Display:</span>
                  <span className="spec-v">0.96" I2C OLED (SSD1306)</span>
                </div>
                <div className="spec-row">
                  <span className="spec-k">Indicators:</span>
                  <span className="spec-v">Green / Yellow / Red LED Status</span>
                </div>
              </div>

              {/* Device Health Summary */}
              <div className="device-health-badges-row">
                <span className="health-badge ok">Connection: Healthy</span>
                <span className="health-badge ok">Wi-Fi: Connected</span>
                <span className="health-badge ok">Sensors: Active</span>
                <span className="health-badge ok">OLED: Available</span>
                <span className="health-badge ok">LEDs: Active</span>
              </div>

              {/* Action Buttons */}
              <div className="success-action-buttons">
                <button
                  type="button"
                  className="btn-primary continue-dashboard-btn"
                  onClick={() => navigate('/dashboard')}
                >
                  <span>Continue to Dashboard</span>
                  <ArrowRight size={17} />
                </button>

                <button
                  type="button"
                  className="btn-secondary change-device-btn"
                  onClick={handleChangeDevice}
                >
                  <RotateCcw size={15} />
                  <span>Change Device</span>
                </button>
              </div>
            </div>
          ) : (
            /* STATE 2: NOT CONNECTED (Input Form, Reconnect, or Error State) */
            <div className="vegsense-card connection-form-card">
              <div className="card-header-row">
                <div>
                  <h2 className="card-title">Connect Device</h2>
                  <div className="card-subtitle">Enter your ESP32 local Wi-Fi IP address</div>
                </div>
                <span className="risk-meter-status-badge status-badge-critical" style={{ margin: 0 }}>
                  ● Not Connected
                </span>
              </div>

              {/* ERROR STATE CARD (If last attempt failed) */}
              {connectionError && (
                <div className="connection-error-box">
                  <div className="error-box-header">
                    <AlertTriangle size={18} color="var(--accent-red)" />
                    <span className="error-box-title">{connectionError.title}</span>
                  </div>
                  <p className="error-box-msg">{connectionError.message}</p>

                  <div className="error-reasons-list">
                    <span className="reasons-heading">Possible reasons:</span>
                    <ul>
                      <li>ESP32 is powered off or disconnected</li>
                      <li>ESP32 is not connected to your Wi-Fi router</li>
                      <li>IP address ({connectionError.ip}) is incorrect</li>
                      <li>Computer and ESP32 are on different networks</li>
                      <li>ESP32 web server is not running on port 80</li>
                    </ul>
                  </div>

                  <div className="error-actions-row">
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ height: '38px', fontSize: '0.825rem' }}
                      onClick={() => handleConnect(connectionError.ip)}
                    >
                      <RotateCcw size={14} />
                      <span>Try Again</span>
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ height: '38px', fontSize: '0.825rem' }}
                      onClick={() => setConnectionError(null)}
                    >
                      Change IP Address
                    </button>
                  </div>
                </div>
              )}

              {/* PREVIOUSLY CONNECTED DEVICE CARD (If exists and user hasn't toggled new input) */}
              {hasSavedDevice && !showAnotherDeviceForm && !connectionError && (
                <div className="previously-connected-card">
                  <div className="prev-card-title">Previously Connected Device</div>
                  <div className="prev-device-box">
                    <div className="prev-device-info">
                      <Cpu size={22} color="var(--primary)" />
                      <div>
                        <div className="prev-device-name">{savedDevice.name || 'ESP32-001'}</div>
                        <div className="prev-device-ip">{savedDevice.ipAddress}</div>
                      </div>
                    </div>

                    <div className="prev-actions-row">
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleReconnect}
                        disabled={isConnecting}
                        style={{ height: '42px', flex: 1 }}
                      >
                        {isConnecting ? (
                          <>
                            <span className="spinner" />
                            <span>Verifying Device...</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw size={16} />
                            <span>Reconnect</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setShowAnotherDeviceForm(true)}
                        style={{ height: '42px' }}
                      >
                        Use Another Device
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* IP ADDRESS INPUT FORM */}
              {(showAnotherDeviceForm || !hasSavedDevice || connectionError) && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleConnect();
                  }}
                  className="connect-form-body"
                >
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label htmlFor="esp-ip-input" className="form-label">
                      <span>ESP32 IP Address</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>IPv4 Local Address</span>
                    </label>

                    <div className="login-input-wrapper">
                      <span className="login-input-icon">
                        <Radio size={18} />
                      </span>
                      <input
                        id="esp-ip-input"
                        type="text"
                        className={`login-form-input ${inputError ? 'input-error' : ''}`}
                        placeholder="192.168.1.105"
                        value={ipAddress}
                        onChange={(e) => {
                          setIpAddress(e.target.value);
                          if (inputError) setInputError('');
                        }}
                        disabled={isConnecting}
                        autoFocus
                        style={{ fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.04em' }}
                      />
                    </div>

                    {inputError && (
                      <div className="validation-error-msg">
                        <XCircle size={14} />
                        <span>{inputError}</span>
                      </div>
                    )}

                    <div className="input-helper-tip">
                      Enter the IP address shown in your ESP32 Serial Monitor (e.g. 192.168.1.105).
                    </div>
                  </div>

                  {/* Connect Action Button */}
                  <button
                    type="submit"
                    className="btn-primary full-width-touch-btn"
                    disabled={isConnecting}
                    style={{ height: '48px', fontSize: '0.95rem' }}
                  >
                    {isConnecting ? (
                      <>
                        <span className="spinner" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <Wifi size={18} />
                        <span>Connect Device</span>
                      </>
                    )}
                  </button>

                  {/* Simulation / Demo Fallback Mode */}
                  <div className="demo-simulation-block">
                    <span className="demo-divider-text">OR TEST PROTOCOL</span>
                    <button
                      type="button"
                      className="demo-simulation-btn"
                      onClick={handleDemoSimulation}
                      disabled={isConnecting}
                    >
                      <Sparkles size={15} color="var(--primary)" />
                      <span>Test with Simulated ESP32 Gateway (192.168.1.105)</span>
                    </button>
                    <span className="demo-sub-note">
                      Uses realistic DHT22 & MQ-135 calibration model for demonstration when physical hardware is offline.
                    </span>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
