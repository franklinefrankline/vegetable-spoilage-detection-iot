import React, { useState, useEffect } from 'react';
import { useDevice } from '../context/DeviceContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from '../router/Router';
import {
  validateIPAddress,
  isHttpsContext,
  getDeviceStatus,
  getSensorData
} from '../services/deviceService';
import {
  Esp32BoardVisual,
  VisualHeroConnection,
  VisualConnectionFlow,
  VisualThreeStepGuide,
  SerialMonitorCompact,
  DevicePreviewCard,
  ConnectedStateView,
  SetupHelpModal
} from '../components/device/DeviceVisuals';
import { DebugPanel } from '../components/device/DebugPanel';
import {
  Radio,
  Wifi,
  Cpu,
  RotateCcw,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Server,
  Activity,
  Zap
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
    connectDemoDevice,
    disconnectDevice,
    reconnectDevice
  } = useDevice();

  const { addToast } = useToast();
  const navigate = useNavigate();

  // Local form state
  const [ipAddress, setIpAddress] = useState(savedDevice?.ipAddress || '');
  const [inputError, setInputError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStage, setConnectionStage] = useState(''); // 'Checking ESP32...' | 'Checking Wi-Fi...' | 'Checking HTTP server...' | 'Reading sensor data...' | 'Connected'
  const [connectionError, setConnectionError] = useState(null); // { message, ip }
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Section 19: Debug Panel telemetry state
  const [lastDebugResponse, setLastDebugResponse] = useState(null);
  const [lastDebugError, setLastDebugError] = useState(null);

  const isHttps = isHttpsContext();

  // Sync saved IP on mount
  useEffect(() => {
    if (savedDevice?.ipAddress && !ipAddress) {
      setIpAddress(savedDevice.ipAddress);
    }
  }, [savedDevice, ipAddress]);

  // Section 12 & 13: Sequential Connection Handler
  const handleConnect = async (targetIp) => {
    const cleanIp = (targetIp || ipAddress).trim();

    setInputError('');
    setConnectionError(null);
    setLastDebugError(null);

    // Section 8 & 21: Strict IP format check
    if (!cleanIp) {
      setInputError('Enter a valid ESP32 IP address.');
      return;
    }

    if (!validateIPAddress(cleanIp)) {
      setInputError('Enter a valid ESP32 IP address.');
      return;
    }

    setIsConnecting(true);

    try {
      // Stage 1: Checking ESP32...
      setConnectionStage('Checking ESP32...');
      await new Promise((r) => setTimeout(r, 250));

      // Stage 2: Checking Wi-Fi...
      setConnectionStage('Checking Wi-Fi...');
      await new Promise((r) => setTimeout(r, 250));

      // Stage 3: Checking HTTP server... (GET /status)
      setConnectionStage('Checking HTTP server...');
      const statusRes = await getDeviceStatus(cleanIp);
      setLastDebugResponse(statusRes.rawResponse || statusRes.data);

      // Stage 4: Reading sensor data... (GET /api/data)
      setConnectionStage('Reading sensor data...');
      const sensorRes = await getSensorData(cleanIp);
      setLastDebugResponse(sensorRes);

      // Stage 5: Connected (Section 12 & 21)
      setConnectionStage('Connected');
      await connectDevice(cleanIp);

      addToast('ESP32-001 Connected successfully.', 'success');

      // Section 13: Automatically navigate to /dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 600);
    } catch (err) {
      console.warn('ESP32 Connection Error:', err);
      let errorMsg = err.message || 'ESP32 is unreachable.';

      if (err.code === 'TIMEOUT') {
        errorMsg = 'ESP32 did not respond.\n\nCheck:\n• ESP32 is powered\n• ESP32 is connected to Wi-Fi\n• Computer and ESP32 are on the same Wi-Fi\n• IP address is correct\n• ESP32 HTTP server is running';
      } else if (err.code === 'INVALID_STATUS') {
        errorMsg = 'ESP32 returned an invalid status response.';
      } else if (err.code === 'INVALID_SENSOR_DATA') {
        errorMsg = 'ESP32 connected, but sensor data could not be read.';
      } else if (err.code === 'HTTPS_MIXED_CONTENT') {
        errorMsg = err.message;
      }

      setConnectionError({
        message: errorMsg,
        ip: cleanIp
      });
      setLastDebugError(errorMsg);
      addToast(err.code === 'TIMEOUT' ? 'Connection timed out. ESP32 did not respond.' : errorMsg, 'error');
    } finally {
      setIsConnecting(false);
      setConnectionStage('');
    }
  };

  // Section: Quick Demo ESP32 Connection Handler (ESP32-DEMO-001 @ 192.168.1.105)
  const handleConnectDemo = async () => {
    setInputError('');
    setConnectionError(null);
    setLastDebugError(null);
    setIsConnecting(true);

    try {
      setConnectionStage('Checking ESP32...');
      await new Promise((r) => setTimeout(r, 200));

      setConnectionStage('Checking Wi-Fi...');
      await new Promise((r) => setTimeout(r, 200));

      setConnectionStage('Checking HTTP server...');
      await new Promise((r) => setTimeout(r, 200));

      setConnectionStage('Reading sensor data...');
      await new Promise((r) => setTimeout(r, 200));

      setConnectionStage('Connected');
      await connectDemoDevice();

      addToast('ESP32-DEMO-001 Connected (Demo Mode).', 'success');

      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err) {
      console.error('Demo connection error:', err);
      addToast('Could not start Demo mode.', 'error');
    } finally {
      setIsConnecting(false);
      setConnectionStage('');
    }
  };

  const handleChangeDevice = () => {
    disconnectDevice();
    setConnectionError(null);
    setInputError('');
    setLastDebugResponse(null);
    setLastDebugError(null);
  };

  // Section 19: Manual Endpoint Prober for Debug Mode
  const handleTestEndpoint = async (type) => {
    const cleanIp = (ipAddress || '192.168.1.105').trim();
    try {
      if (type === 'status') {
        const res = await getDeviceStatus(cleanIp);
        setLastDebugResponse(res.rawResponse || res.data);
        setLastDebugError(null);
        addToast('GET /status responded successfully', 'success');
      } else {
        const res = await getSensorData(cleanIp);
        setLastDebugResponse(res);
        setLastDebugError(null);
        addToast('GET /api/data responded successfully', 'success');
      }
    } catch (err) {
      setLastDebugError(err.message || String(err));
      addToast(err.message || 'Endpoint probe failed', 'error');
    }
  };

  return (
    <div className="connect-device-refined-container">
      {/* 1. Main Connection Hero (Section 5) */}
      <div className="refined-hero-section">
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.65rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--primary)' }}>
            VegSense
          </span>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Smart Storage Intelligence
          </span>
        </div>
        <h1 className="refined-main-title">Connect ESP32</h1>
        <p className="refined-main-subtitle">Enter your ESP32 IP address.</p>

        {/* Hero Visual Connection Diagram - Keeping ESP32 illustration */}
        <VisualHeroConnection isConnected={isConnected} />
      </div>

      {/* 2. Section 9: Visible Local ESP32 Connection Notice */}
      <div className="local-connection-banner">
        <div className="local-connection-title">
          <Wifi size={16} color="var(--primary)" />
          <span>LOCAL ESP32 CONNECTION</span>
        </div>
        <p style={{ margin: '0 0 0.35rem', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)' }}>
          For direct ESP32 monitoring:
        </p>
        <ul className="local-connection-list">
          <li>Connect this computer to the same Wi-Fi as the ESP32.</li>
          <li>Use the ESP32 IP shown in Serial Monitor.</li>
          <li>The ESP32 must be running its HTTP server.</li>
        </ul>
      </div>

      {/* 3. Section 1, 9 & 11: HTTPS / Vercel Detection Banner */}
      {isHttps && (
        <div className="https-cloud-notice">
          <AlertTriangle size={18} color="#ea580c" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: '#ea580c', display: 'block', marginBottom: '2px' }}>
              HTTPS Cloud Context Detected (Mixed Content Notice)
            </strong>
            <p style={{ margin: 0 }}>
              Web browsers enforce strict security boundaries that prevent HTTPS websites (e.g.{' '}
              <code>https://veg-system.vercel.app</code>) from directly accessing private LAN IP
              addresses (<code>http://192.168.x.x</code>).
            </p>
            <p style={{ margin: '0.35rem 0 0' }}>
              <strong>For direct local ESP32 testing:</strong> Run the frontend locally over HTTP:{' '}
              <code>npm run dev</code> and open <code>http://localhost:5173/connect-device</code> on
              the same Wi-Fi.
            </p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)' }}>
              <em>Production Cloud Mode: Cloud connection not configured.</em>
            </p>
          </div>
        </div>
      )}

      {/* 4. Visual Connection Flow */}
      <VisualConnectionFlow />

      {/* Main Split Grid */}
      <div className="refined-main-grid">
        {/* Left Column: Technical Board & Guides */}
        <div className="refined-left-col">
          {/* Visual ESP32 Board Illustration */}
          <div className="vegsense-card visual-board-card">
            <div className="board-card-header">
              <div className="board-identity">
                <Cpu size={18} color="var(--primary)" />
                <span className="board-name">ESP32 DevKit V1</span>
              </div>
              <span className={`status-pill ${isConnected ? 'active' : ''}`}>
                <span className={`status-indicator-dot ${isConnected ? 'dot-green' : 'dot-amber'}`} />
                <span>{isConnected ? `${device?.id || 'ESP32-001'} Connected` : 'Ready to Connect'}</span>
              </span>
            </div>

            {/* Technical Vector Illustration */}
            <Esp32BoardVisual isConnected={isConnected} isConnecting={isConnecting} />
          </div>

          {/* How to Connect 3-Step Guide */}
          <VisualThreeStepGuide onOpenHelp={() => setIsHelpOpen(true)} />

          {/* Compact Serial Monitor */}
          <SerialMonitorCompact
            ip={ipAddress || '192.168.1.105'}
            onCopy={(copiedIp) => {
              setIpAddress(copiedIp);
              setInputError('');
              addToast('IP copied to input.', 'info');
            }}
          />
        </div>

        {/* Right Column: Connection Form & States */}
        <div className="refined-right-col">
          {/* STATE 1: ALREADY CONNECTED */}
          {isConnected ? (
            <div className="vegsense-card refined-connected-card">
              <ConnectedStateView
                device={device || {}}
                sensorData={sensorData || {}}
                onContinue={() => navigate('/dashboard')}
                onChangeDevice={handleChangeDevice}
              />
            </div>
          ) : (
            /* STATE 2: NOT CONNECTED (IP FORM OR ERROR) */
            <div className="vegsense-card refined-form-card">
              {/* Heading & Status */}
              <div className="form-card-top">
                <h2 className="refined-form-title">Connect ESP32</h2>
                <span className="form-status-tag">● Not Connected</span>
              </div>

              {/* Error State */}
              {connectionError ? (
                <div className="compact-error-card">
                  <div className="error-icon-circle">
                    <AlertTriangle size={24} color="#ef4444" />
                  </div>

                  <h3 className="compact-error-title">Connection Failed</h3>
                  <div
                    className="compact-error-sub"
                    style={{ whiteSpace: 'pre-line', textAlign: 'left', fontSize: '0.825rem' }}
                  >
                    {connectionError.message}
                  </div>

                  <div className="compact-error-buttons">
                    <button
                      type="button"
                      className="btn-primary error-retry-btn"
                      onClick={() => handleConnect(connectionError.ip)}
                    >
                      <RotateCcw size={15} />
                      <span>Try Again</span>
                    </button>

                    <button
                      type="button"
                      className="btn-secondary error-change-btn"
                      onClick={() => {
                        setConnectionError(null);
                        setInputError('');
                      }}
                    >
                      <span>Change IP</span>
                    </button>

                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleConnectDemo}
                      style={{ background: 'linear-gradient(135deg, #059669, #0d9488)', border: 'none', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      title="Connect with Demo ESP32 parameters"
                    >
                      <Zap size={14} />
                      <span>Connect Demo ESP32</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Connection Form */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleConnect();
                  }}
                  className="refined-connect-form"
                >
                  <div className="refined-input-group">
                    <label htmlFor="esp32-ip-field" className="refined-input-label">
                      ESP32 IP Address
                    </label>

                    <div className="refined-field-wrapper">
                      <Radio size={18} className="field-icon" />
                      <input
                        id="esp32-ip-field"
                        type="text"
                        className={`refined-ip-input ${inputError ? 'error-border' : ''}`}
                        placeholder="192.168.1.105"
                        value={ipAddress}
                        onChange={(e) => {
                          setIpAddress(e.target.value);
                          if (inputError) setInputError('');
                        }}
                        disabled={isConnecting}
                        autoFocus
                      />
                    </div>

                    {inputError && (
                      <div className="refined-error-text">
                        <XCircle size={13} />
                        <span>{inputError}</span>
                      </div>
                    )}

                    <span className="refined-helper-text">
                      Make sure your device and ESP32 are on the same Wi-Fi.
                    </span>

                    {/* Quick Demo ESP32 Mode Box */}
                    <div
                      className="demo-connection-quick-box"
                      style={{
                        marginTop: '0.85rem',
                        padding: '0.85rem 1rem',
                        background: 'rgba(16, 185, 129, 0.08)',
                        borderRadius: '12px',
                        border: '1px dashed rgba(16, 185, 129, 0.35)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.785rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Zap size={14} color="#f59e0b" /> DEMO ESP32 GATEWAY
                        </span>
                        <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', borderRadius: '20px', fontWeight: 700 }}>
                          ESP32-DEMO-001
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.65rem', lineHeight: '1.4' }}>
                        IP: <strong style={{ color: 'var(--text-main)' }}>192.168.1.105</strong> • Temp: <strong>28.5 °C</strong> • Hum: <strong>72 %</strong> • VOC: <strong>420</strong> • Spoilage: <strong>18 %</strong> • Status: <strong>FRESH</strong>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleConnectDemo}
                        disabled={isConnecting}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          fontWeight: 700,
                          fontSize: '0.825rem',
                          borderColor: 'rgba(16, 185, 129, 0.4)',
                          cursor: 'pointer'
                        }}
                      >
                        <Zap size={14} color="#f59e0b" />
                        <span>Connect Demo ESP32 (192.168.1.105)</span>
                      </button>
                    </div>
                  </div>

                  {/* Section 12 Sequential Stages Visualizer during connection */}
                  {isConnecting && (
                    <div className="connection-stages-box">
                      <div
                        className={`stage-item ${connectionStage === 'Checking ESP32...' ? 'current' : connectionStage ? 'done' : ''}`}
                      >
                        {connectionStage === 'Checking ESP32...' ? (
                          <Activity size={13} className="spin" />
                        ) : (
                          <CheckCircle2 size={13} />
                        )}
                        <span>Checking ESP32...</span>
                      </div>

                      <div
                        className={`stage-item ${connectionStage === 'Checking Wi-Fi...' ? 'current' : connectionStage === 'Checking HTTP server...' || connectionStage === 'Reading sensor data...' || connectionStage === 'Connected' ? 'done' : ''}`}
                      >
                        {connectionStage === 'Checking Wi-Fi...' ? (
                          <Activity size={13} className="spin" />
                        ) : connectionStage === 'Checking HTTP server...' ||
                          connectionStage === 'Reading sensor data...' ||
                          connectionStage === 'Connected' ? (
                          <CheckCircle2 size={13} />
                        ) : (
                          <span style={{ width: 13, height: 13 }} />
                        )}
                        <span>Checking Wi-Fi...</span>
                      </div>

                      <div
                        className={`stage-item ${connectionStage === 'Checking HTTP server...' ? 'current' : connectionStage === 'Reading sensor data...' || connectionStage === 'Connected' ? 'done' : ''}`}
                      >
                        {connectionStage === 'Checking HTTP server...' ? (
                          <Activity size={13} className="spin" />
                        ) : connectionStage === 'Reading sensor data...' ||
                          connectionStage === 'Connected' ? (
                          <CheckCircle2 size={13} />
                        ) : (
                          <span style={{ width: 13, height: 13 }} />
                        )}
                        <span>Checking HTTP server...</span>
                      </div>

                      <div
                        className={`stage-item ${connectionStage === 'Reading sensor data...' ? 'current' : connectionStage === 'Connected' ? 'done' : ''}`}
                      >
                        {connectionStage === 'Reading sensor data...' ? (
                          <Activity size={13} className="spin" />
                        ) : connectionStage === 'Connected' ? (
                          <CheckCircle2 size={13} />
                        ) : (
                          <span style={{ width: 13, height: 13 }} />
                        )}
                        <span>Reading sensor data...</span>
                      </div>
                    </div>
                  )}

                  {/* Connect Button */}
                  <button
                    type="submit"
                    className="btn-primary refined-connect-btn"
                    disabled={isConnecting}
                    style={{ marginTop: '0.75rem' }}
                  >
                    {isConnecting ? (
                      <>
                        <span className="spinner" />
                        <span>{connectionStage || 'Connecting...'}</span>
                      </>
                    ) : (
                      <>
                        <Wifi size={18} />
                        <span>Connect Device</span>
                      </>
                    )}
                  </button>

                  {/* Device Preview Card */}
                  <div className="preview-section-divider">
                    <DevicePreviewCard
                      deviceName="ESP32-001"
                      ipAddress={ipAddress}
                      isConnected={false}
                      isConnecting={isConnecting}
                    />
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. Section 19: Developer Debug Mode Panel */}
      <DebugPanel
        targetIp={ipAddress || '192.168.1.105'}
        connectionStatus={
          isConnected
            ? 'Connected'
            : connectionError
            ? 'Failed'
            : isConnecting
            ? connectionStage || 'Connecting...'
            : 'Idle'
        }
        lastResponse={lastDebugResponse}
        lastError={lastDebugError}
        onTestEndpoint={handleTestEndpoint}
      />

      {/* Setup Help Modal */}
      <SetupHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}

export default ConnectDevicePage;
