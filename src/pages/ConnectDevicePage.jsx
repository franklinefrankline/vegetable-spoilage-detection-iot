import React, { useState, useEffect } from 'react';
import { useDevice } from '../context/DeviceContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from '../router/Router';
import { validateIPAddress } from '../services/deviceService';
import {
  Esp32BoardVisual,
  VisualHeroConnection,
  VisualConnectionFlow,
  VisualThreeStepGuide,
  SerialMonitorCompact,
  DevicePreviewCard,
  ConnectedStateView,
  ConnectionFailedView,
  SetupHelpModal
} from '../components/device/DeviceVisuals';
import {
  Radio,
  Wifi,
  Cpu,
  RotateCcw,
  XCircle,
  CheckCircle2,
  AlertTriangle
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

  // Local form state
  const [ipAddress, setIpAddress] = useState(savedDevice?.ipAddress || '');
  const [inputError, setInputError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStage, setConnectionStage] = useState(''); // 'Connecting...' | 'Checking ESP32...' | 'Reading sensors...' | 'Connected'
  const [connectionError, setConnectionError] = useState(null); // { message, ip }
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Sync saved IP on mount
  useEffect(() => {
    if (savedDevice?.ipAddress && !ipAddress) {
      setIpAddress(savedDevice.ipAddress);
    }
  }, [savedDevice, ipAddress]);

  // Real Connection Handler
  const handleConnect = async (targetIp) => {
    const cleanIp = (targetIp || ipAddress).trim();

    setInputError('');
    setConnectionError(null);

    // Strict IP validation
    if (!cleanIp) {
      setInputError('Enter a valid ESP32 IP address.');
      return;
    }

    if (!validateIPAddress(cleanIp)) {
      setInputError('Enter a valid ESP32 IP address.');
      return;
    }

    setIsConnecting(true);
    setConnectionStage('Connecting...');

    try {
      // Stage 1: Checking ESP32 /status
      setConnectionStage('Checking ESP32...');
      await new Promise((r) => setTimeout(r, 200));

      // Stage 2: Reading sensors /api/data & saving device
      setConnectionStage('Reading sensors...');
      await connectDevice(cleanIp);

      // Stage 3: Connected
      setConnectionStage('Connected');
      addToast('ESP32 connected successfully.', 'success');

      // Automatically navigate to /dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err) {
      console.warn('Real ESP32 connection error:', err);
      let errorMsg = err.message || 'ESP32 is unreachable.';
      if (err.code === 'TIMEOUT') {
        errorMsg = 'Connection timed out. ESP32 did not respond.';
      } else if (err.code === 'INVALID_STATUS') {
        errorMsg = 'ESP32 returned an invalid response.';
      } else if (err.code === 'INVALID_SENSOR_DATA') {
        errorMsg = 'ESP32 connected, but sensor data could not be read.';
      } else if (err.code === 'NETWORK_ERROR') {
        errorMsg = 'ESP32 is unreachable. Check that your device and ESP32 are on the same Wi-Fi.';
      }

      setConnectionError({
        message: errorMsg,
        ip: cleanIp
      });
      addToast(errorMsg, 'error');
    } finally {
      setIsConnecting(false);
      setConnectionStage('');
    }
  };

  const handleChangeDevice = () => {
    disconnectDevice();
    setConnectionError(null);
    setInputError('');
  };

  return (
    <div className="connect-device-refined-container">
      {/* 1. Main Connection Hero */}
      <div className="refined-hero-section">
        <h1 className="refined-main-title">Connect Your Device</h1>
        <p className="refined-main-subtitle">Enter your ESP32 IP address.</p>

        {/* Hero Visual Connection Diagram */}
        <VisualHeroConnection isConnected={isConnected} />
      </div>

      {/* 3. Visual Connection Flow */}
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
                <span>{isConnected ? `${device.id || 'ESP32-001'} Connected` : 'Ready to Connect'}</span>
              </span>
            </div>

            {/* Technical Vector Illustration */}
            <Esp32BoardVisual isConnected={isConnected} isConnecting={isConnecting} />
          </div>

          {/* 4. How to Connect */}
          <VisualThreeStepGuide onOpenHelp={() => setIsHelpOpen(true)} />

          {/* 5. Compact Serial Monitor */}
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
                device={device}
                sensorData={sensorData}
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
                  <p className="compact-error-sub">{connectionError.message}</p>

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
                  </div>

                  {/* Connect Button */}
                  <button
                    type="submit"
                    className="btn-primary refined-connect-btn"
                    disabled={isConnecting}
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

                  {/* 6. Device Preview Card */}
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

      {/* Setup Help Modal */}
      <SetupHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
export default ConnectDevicePage;
