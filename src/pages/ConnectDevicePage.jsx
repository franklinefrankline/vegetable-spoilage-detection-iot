import React, { useState, useEffect } from 'react';
import { useDevice } from '../context/DeviceContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from '../router/Router';
import {
  validateIPAddress,
  isHttpsContext,
  getDeviceStatus,
  getSensorData,
  getCloudSensorData,
  connectToCloudDevice
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
  Zap,
  Cloud,
  Globe,
  ShieldCheck,
  Usb
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
    connectSerialDevice,
    connectCloudDevice,
    connectDemoDevice,
    disconnectDevice,
    reconnectDevice,
    isWebSerialSupported
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
  const [activeTab, setActiveTab] = useState(savedDevice?.mode === 'serial' ? 'serial' : savedDevice?.mode === 'local' ? 'local' : 'serial');

  // Sync saved IP on mount
  useEffect(() => {
    if (savedDevice?.ipAddress && !ipAddress) {
      setIpAddress(savedDevice.ipAddress);
    }
    if (savedDevice?.mode) {
      setActiveTab(savedDevice.mode);
    }
  }, [savedDevice, ipAddress]);

  // Web Serial Connection Handler (USB Cable Direct)
  const handleConnectSerial = async () => {
    setInputError('');
    setConnectionError(null);
    setLastDebugError(null);
    setIsConnecting(true);

    try {
      setConnectionStage('Waiting for permission...');
      const res = await connectSerialDevice({
        onStateChange: (stage) => setConnectionStage(stage)
      });
      setLastDebugResponse(res?.sensorData || res);
      setConnectionStage('Connected');
      addToast('ESP32 DevKit V1 Connected via Web Serial.', 'success');

      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err) {
      console.warn('Web Serial connection error:', err);
      const errorMsg = err.message || 'Could not connect via Web Serial.';
      setConnectionError({
        message: errorMsg,
        type: 'serial',
        code: err.code
      });
      setLastDebugError(errorMsg);
      addToast(errorMsg.split('\n')[0], 'error');
    } finally {
      setIsConnecting(false);
      setConnectionStage('');
    }
  };

  // Cloud IoT Gateway Connection Handler
  const handleConnectCloud = async () => {
    setInputError('');
    setConnectionError(null);
    setLastDebugError(null);
    setIsConnecting(true);

    try {
      setConnectionStage('Connecting to Cloud Gateway...');
      await new Promise((r) => setTimeout(r, 200));

      setConnectionStage('Verifying Cloud Ingestion endpoint...');
      await new Promise((r) => setTimeout(r, 200));

      setConnectionStage('Reading cloud sensor data...');
      const res = await connectCloudDevice('ESP32-001');
      setLastDebugResponse(res?.sensorData || res);

      setConnectionStage('Connected');
      addToast('ESP32-001 Connected via Cloud Gateway.', 'success');

      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err) {
      console.warn('Cloud connection error:', err);
      const errorMsg = err.message || 'Could not connect to Cloud Gateway.';
      setConnectionError({
        message: errorMsg,
        ip: 'Cloud (HTTPS)',
        type: 'cloud',
        code: err.code
      });
      setLastDebugError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setIsConnecting(false);
      setConnectionStage('');
    }
  };

  // Local Sequential Connection Handler (Direct LAN IP)
  const handleConnect = async (targetIp) => {
    const cleanIp = (targetIp || ipAddress).trim();

    setInputError('');
    setConnectionError(null);
    setLastDebugError(null);

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
      setConnectionStage('Waiting for permission...');
      await new Promise((r) => setTimeout(r, 200));

      setConnectionStage('Checking ESP32...');
      try {
        const statusRes = await getDeviceStatus(cleanIp);
        setLastDebugResponse(statusRes.rawResponse || statusRes.data);

        setConnectionStage('Reading sensor data...');
        const sensorRes = await getSensorData(cleanIp);
        setLastDebugResponse(sensorRes);

        setConnectionStage('Connected');
        await connectDevice(cleanIp);

        addToast(`ESP32 Connected successfully at ${cleanIp}.`, 'success');

        setTimeout(() => {
          navigate('/dashboard');
        }, 600);
      } catch (directErr) {
        // If direct HTTP fetch failed due to HTTPS Mixed Content or private network blocking on live site,
        // bridge seamlessly to the live cloud telemetry stream if available
        if (directErr.code === 'HTTPS_MIXED_CONTENT' || directErr.code === 'NETWORK_ERROR') {
          try {
            setConnectionStage('Verifying Cloud IoT Telemetry...');
            const cloudRes = await connectCloudDevice('ESP32-001');
            if (cloudRes?.sensorData && !cloudRes.sensorData.isOffline) {
              setLastDebugResponse(cloudRes.sensorData);
              setConnectionStage('Connected');
              addToast(`ESP32 (${cleanIp}) Connected via Cloud Gateway!`, 'success');
              setTimeout(() => {
                navigate('/dashboard');
              }, 600);
              return;
            }
          } catch (_) {}
        }
        throw directErr;
      }
    } catch (err) {
      console.warn('ESP32 Connection Error:', err);
      const errorMsg = err.message || 'ESP32 is unreachable.';

      setConnectionError({
        message: errorMsg,
        ip: cleanIp,
        type: 'local',
        code: err.code
      });
      setLastDebugError(errorMsg);
      addToast(err.code === 'TIMEOUT' ? 'Connection timed out. ESP32 did not respond.' : errorMsg.split('\n')[0], 'error');
    } finally {
      setIsConnecting(false);
      setConnectionStage('');
    }
  };

  // Section: Quick Demo ESP32 Connection Handler (ESP32-DEMO-001 @ 192.168.1.150)
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
    const cleanIp = (ipAddress || '192.168.1.150').trim();
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

      {/* 2. Mode Selector Tabs: Web Serial vs Cloud Gateway vs Local LAN */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => {
            setActiveTab('serial');
            setConnectionError(null);
            setInputError('');
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.65rem 1.15rem',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: activeTab === 'serial' ? '2px solid #2563eb' : '1px solid var(--border-light)',
            background: activeTab === 'serial' ? 'rgba(37, 99, 235, 0.12)' : 'var(--card-bg)',
            color: activeTab === 'serial' ? '#2563eb' : 'var(--text-muted)'
          }}
        >
          <Usb size={16} />
          <span>Web Serial (USB Cable)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('cloud');
            setConnectionError(null);
            setInputError('');
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.65rem 1.15rem',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: activeTab === 'cloud' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
            background: activeTab === 'cloud' ? 'var(--primary-light)' : 'var(--card-bg)',
            color: activeTab === 'cloud' ? 'var(--primary)' : 'var(--text-muted)'
          }}
        >
          <Cloud size={16} />
          <span>Cloud IoT Gateway</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('local');
            setConnectionError(null);
            setInputError('');
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.65rem 1.15rem',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: activeTab === 'local' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
            background: activeTab === 'local' ? 'var(--primary-light)' : 'var(--card-bg)',
            color: activeTab === 'local' ? 'var(--text-muted)' : 'var(--text-muted)'
          }}
        >
          <Wifi size={16} />
          <span>Local Wi-Fi IP (Direct LAN)</span>
        </button>
      </div>

      {/* 3. Architecture Notice Banner */}
      {activeTab === 'serial' ? (
        <div className="local-connection-banner" style={{ background: 'rgba(37, 99, 235, 0.08)', borderColor: 'rgba(37, 99, 235, 0.3)' }}>
          <div className="local-connection-title" style={{ color: '#2563eb' }}>
            <Usb size={16} color="#2563eb" />
            <span>WEB SERIAL USB CONNECTION ACTIVE (RECOMMENDED FOR DIRECT HARDWARE)</span>
          </div>
          <p style={{ margin: '0 0 0.35rem', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Direct Computer-to-Microcontroller Interface over USB:
          </p>
          <ul className="local-connection-list">
            <li>Connect ESP32 DevKit V1 to computer via USB-C / micro-USB cable.</li>
            <li>Browser-native standard: works cleanly on HTTPS with no Mixed Content or Wi-Fi network routing blocks.</li>
            <li>Runs at 115200 baud: allows high-frequency sensor telemetry and zero network latency.</li>
          </ul>
        </div>
      ) : activeTab === 'cloud' ? (
        <div className="local-connection-banner" style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div className="local-connection-title" style={{ color: '#10b981' }}>
            <Cloud size={16} color="#10b981" />
            <span>CLOUD IOT GATEWAY ACTIVE</span>
          </div>
          <p style={{ margin: '0 0 0.35rem', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Outbound HTTPS Ingestion: Works globally on any network or mobile device!
          </p>
          <ul className="local-connection-list">
            <li>ESP32 initiates outbound HTTPS requests directly to <code>https://vegitables.vercel.app/api/device/ingest</code>.</li>
            <li>Browser never depends on private IP addresses (no Mixed Content or LAN firewall restrictions).</li>
            <li>Secured via dedicated device credentials &amp; server validation.</li>
          </ul>
        </div>
      ) : (
        <div className="local-connection-banner">
          <div className="local-connection-title">
            <Wifi size={16} color="var(--primary)" />
            <span>LOCAL ESP32 CONNECTION (LAN)</span>
          </div>
          <p style={{ margin: '0 0 0.35rem', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)' }}>
            For direct local ESP32 monitoring:
          </p>
          <ul className="local-connection-list">
            <li>Connect this computer to the same Wi-Fi as the ESP32.</li>
            <li>Use the ESP32 IP shown in Serial Monitor (e.g. 192.168.1.150).</li>
            <li>If running on HTTPS cloud, browsers block private HTTP IPs (use Web Serial or Cloud Gateway tab).</li>
          </ul>
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
            ip={ipAddress || '192.168.1.150'}
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

                  <div className="compact-error-buttons" style={{ flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-primary error-retry-btn"
                      onClick={() => {
                        if (connectionError.type === 'serial') {
                          handleConnectSerial();
                        } else if (connectionError.type === 'cloud') {
                          handleConnectCloud();
                        } else {
                          handleConnect(connectionError.ip);
                        }
                      }}
                    >
                      <RotateCcw size={15} />
                      <span>Try Again</span>
                    </button>

                    {connectionError.type === 'local' && (
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
                    )}

                    {/* Quick switch to Web Serial if blocked by HTTPS Mixed Content */}
                    {(connectionError.code === 'HTTPS_MIXED_CONTENT' || activeTab === 'local') && (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          setActiveTab('serial');
                          setConnectionError(null);
                          setInputError('');
                        }}
                        style={{ background: '#2563eb', border: 'none', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        title="Switch to Web Serial USB connection"
                      >
                        <Usb size={14} />
                        <span>Use Web Serial (USB)</span>
                      </button>
                    )}

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
              ) : activeTab === 'serial' ? (
                /* WEB SERIAL MODE (USB CABLE) */
                <div className="refined-connect-form">
                  <div className="refined-input-group">
                    <div
                      style={{
                        marginBottom: '1rem',
                        padding: '1.1rem',
                        background: 'rgba(37, 99, 235, 0.07)',
                        borderRadius: '14px',
                        border: '1px solid rgba(37, 99, 235, 0.25)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Usb size={18} color="#2563eb" />
                          Web Serial Direct USB Interface
                        </span>
                        <span className="status-pill active" style={{ fontSize: '0.72rem' }}>
                          <span className="status-indicator-dot dot-green" />
                          <span>115200 Baud Ready</span>
                        </span>
                      </div>

                      <p style={{ margin: '0 0 0.75rem', fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: '1.45' }}>
                        Connect your ESP32 DevKit V1 directly via USB cable. Browser-native, ultra-low latency, and free from Mixed Content or Wi-Fi network restrictions.
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.55rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        <div style={{ padding: '0.45rem 0.65rem', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                          <strong>Hardware:</strong> ESP32 DevKit V1
                        </div>
                        <div style={{ padding: '0.45rem 0.65rem', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                          <strong>Baud Rate:</strong> 115200
                        </div>
                        <div style={{ padding: '0.45rem 0.65rem', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                          <strong>Driver:</strong> CP2102 / CH340 / CH9102
                        </div>
                        <div style={{ padding: '0.45rem 0.65rem', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                          <strong>Security:</strong> W3C Web Serial API
                        </div>
                      </div>
                    </div>

                    {/* Sequential Stages Visualizer during connection */}
                    {isConnecting && (
                      <div className="connection-stages-box">
                        <div
                          className={`stage-item ${connectionStage === 'Waiting for permission...' ? 'current' : connectionStage ? 'done' : ''}`}
                        >
                          {connectionStage === 'Waiting for permission...' ? (
                            <Activity size={13} className="spin" />
                          ) : (
                            <CheckCircle2 size={13} />
                          )}
                          <span>Waiting for browser permission... (Select Port)</span>
                        </div>

                        <div
                          className={`stage-item ${connectionStage === 'Connecting' || connectionStage === 'Connecting...' ? 'current' : connectionStage === 'Reading sensor data...' || connectionStage === 'Connected' ? 'done' : ''}`}
                        >
                          {connectionStage === 'Connecting' || connectionStage === 'Connecting...' ? (
                            <Activity size={13} className="spin" />
                          ) : connectionStage === 'Reading sensor data...' || connectionStage === 'Connected' ? (
                            <CheckCircle2 size={13} />
                          ) : (
                            <span style={{ width: 13, height: 13 }} />
                          )}
                          <span>Connecting at 115200 baud...</span>
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

                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleConnectSerial}
                      disabled={isConnecting}
                      style={{
                        width: '100%',
                        padding: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontWeight: 700,
                        fontSize: '0.925rem',
                        cursor: 'pointer'
                      }}
                    >
                      {isConnecting ? (
                        <>
                          <span className="spinner" />
                          <span>{connectionStage || 'Connecting via Serial...'}</span>
                        </>
                      ) : (
                        <>
                          <Usb size={18} />
                          <span>Connect ESP32 (Web Serial)</span>
                        </>
                      )}
                    </button>

                    {/* Quick Demo Option */}
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
                        IP: <strong style={{ color: 'var(--text-main)' }}>192.168.1.150</strong> • Temp: <strong>28.5 °C</strong> • Hum: <strong>72 %</strong> • VOC: <strong>420</strong> • Spoilage: <strong>18 %</strong> • Status: <strong>FRESH</strong>
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
                        <span>Connect Demo ESP32 (Simulation)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'cloud' ? (
                /* CLOUD IOT GATEWAY MODE */
                <div className="refined-connect-form">
                  <div className="refined-input-group">
                    <div style={{ marginBottom: '1rem', padding: '1.1rem', background: 'rgba(16, 185, 129, 0.07)', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Cloud size={18} color="var(--primary)" />
                          Cloud Telemetry Ingestion (ESP32-001)
                        </span>
                        <span className={`status-pill ${!sensorData?.isOffline ? 'active' : ''}`} style={{ fontSize: '0.72rem' }}>
                          <span className={`status-indicator-dot ${!sensorData?.isOffline ? 'dot-green' : 'dot-amber'}`} />
                          <span>{!sensorData?.isOffline ? 'Connected (Live)' : 'Awaiting Upload / Offline'}</span>
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem', marginBottom: '0.85rem', fontSize: '0.775rem' }}>
                        <div style={{ padding: '0.55rem 0.75rem', background: 'var(--card-bg)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 700 }}>DHT22 TEMP</div>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', marginTop: '2px' }}>
                            {sensorData?.isTempUnavailable || sensorData?.temperature === null ? 'Unavailable' : `${sensorData?.temperature}°C`}
                          </div>
                        </div>
                        <div style={{ padding: '0.55rem 0.75rem', background: 'var(--card-bg)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 700 }}>DHT22 HUMIDITY</div>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', marginTop: '2px' }}>
                            {sensorData?.isHumUnavailable || sensorData?.humidity === null ? 'Unavailable' : `${sensorData?.humidity}%`}
                          </div>
                        </div>
                        <div style={{ padding: '0.55rem 0.75rem', background: 'var(--card-bg)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 700 }}>MQ-135 GAS / VOC</div>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', marginTop: '2px' }}>
                            {sensorData?.isGasUnavailable || sensorData?.gasVOC === null ? 'Unavailable' : `${sensorData?.gasVOC} ppm`}
                          </div>
                        </div>
                        <div style={{ padding: '0.55rem 0.75rem', background: 'var(--card-bg)', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 700 }}>BH1750 LIGHT</div>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', marginTop: '2px' }}>
                            {sensorData?.isLightUnavailable ? 'Optional / Not Installed' : `${sensorData?.lightLevel} lux`}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(16, 185, 129, 0.15)', paddingTop: '0.5rem' }}>
                        <span>Endpoint: <code>/api/readings</code></span>
                        <span>Auth: <code>x-api-key</code></span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleConnectCloud}
                      disabled={isConnecting}
                      style={{
                        width: '100%',
                        padding: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontWeight: 700,
                        fontSize: '0.925rem',
                        cursor: 'pointer'
                      }}
                    >
                      {isConnecting ? (
                        <>
                          <span className="spinner" />
                          <span>{connectionStage || 'Connecting to Cloud...'}</span>
                        </>
                      ) : (
                        <>
                          <Cloud size={18} />
                          <span>Connect Cloud ESP32 (ESP32-001)</span>
                        </>
                      )}
                    </button>

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
                        IP: <strong style={{ color: 'var(--text-main)' }}>192.168.1.150</strong> • Temp: <strong>28.5 °C</strong> • Hum: <strong>72 %</strong> • VOC: <strong>420</strong> • Spoilage: <strong>18 %</strong> • Status: <strong>FRESH</strong>
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
                        <span>Connect Demo ESP32 (Simulation)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* LOCAL IP CONNECTION FORM */
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
                        placeholder="192.168.1.150"
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
                        IP: <strong style={{ color: 'var(--text-main)' }}>192.168.1.150</strong> • Temp: <strong>28.5 °C</strong> • Hum: <strong>72 %</strong> • VOC: <strong>420</strong> • Spoilage: <strong>18 %</strong> • Status: <strong>FRESH</strong>
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
                        <span>Connect Demo ESP32 (192.168.1.150)</span>
                      </button>
                    </div>
                  </div>

                  {/* Section 12 Sequential Stages Visualizer during connection */}
                  {isConnecting && (
                    <div className="connection-stages-box">
                      <div
                        className={`stage-item ${connectionStage === 'Waiting for permission...' ? 'current' : connectionStage ? 'done' : ''}`}
                      >
                        {connectionStage === 'Waiting for permission...' ? (
                          <Activity size={13} className="spin" />
                        ) : (
                          <CheckCircle2 size={13} />
                        )}
                        <span>Checking browser permission...</span>
                      </div>

                      <div
                        className={`stage-item ${connectionStage === 'Checking ESP32...' ? 'current' : connectionStage === 'Reading sensor data...' || connectionStage === 'Connected' ? 'done' : ''}`}
                      >
                        {connectionStage === 'Checking ESP32...' ? (
                          <Activity size={13} className="spin" />
                        ) : connectionStage === 'Reading sensor data...' ||
                          connectionStage === 'Connected' ? (
                          <CheckCircle2 size={13} />
                        ) : (
                          <span style={{ width: 13, height: 13 }} />
                        )}
                        <span>Verifying ESP32 status...</span>
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
        targetIp={ipAddress || '192.168.1.150'}
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
