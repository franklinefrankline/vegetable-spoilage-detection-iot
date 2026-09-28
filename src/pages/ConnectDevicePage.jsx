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
  Sparkles,
  XCircle
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
  const [ipAddress, setIpAddress] = useState(savedDevice?.ipAddress || '192.168.1.105');
  const [inputError, setInputError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null); // { message, ip }
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isManualOverride, setIsManualOverride] = useState(false);

  // Sync saved IP on mount
  useEffect(() => {
    if (savedDevice?.ipAddress && !isManualOverride) {
      setIpAddress(savedDevice.ipAddress);
    }
  }, [savedDevice, isManualOverride]);

  // Real Connection Handler
  const handleConnect = async (targetIp) => {
    const cleanIp = (targetIp || ipAddress).trim();

    setInputError('');
    setConnectionError(null);

    // Strict IP validation
    if (!cleanIp) {
      setInputError('Please enter an ESP32 IP address.');
      return;
    }

    if (!validateIPAddress(cleanIp)) {
      setInputError('Please enter a valid ESP32 IP address.');
      return;
    }

    setIsConnecting(true);

    try {
      await connectDevice(cleanIp);
      addToast('ESP32 connected successfully.', 'success');
      setConnectionError(null);
    } catch (err) {
      console.warn('ESP32 connection error:', err);
      setConnectionError({
        message: 'Check your ESP32 and IP.',
        ip: cleanIp
      });
      addToast('Connection failed. Check device.', 'error');
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
      addToast('ESP32 connected successfully.', 'success');
    } catch (err) {
      setConnectionError({
        message: 'Check your ESP32 and IP.',
        ip: savedDevice.ipAddress
      });
      addToast('ESP32 unreachable.', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  // Prototype Demo Simulator (for testing when hardware is offline)
  const handleDemoSimulation = async () => {
    setIsConnecting(true);
    setInputError('');
    setConnectionError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await connectDevice('192.168.1.105');
      addToast('ESP32 connected successfully.', 'success');
    } catch (e) {
      addToast('Simulation connected.', 'info');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleChangeDevice = () => {
    disconnectDevice();
    setConnectionError(null);
    setInputError('');
    setIsManualOverride(true);
  };

  return (
    <div className="connect-device-refined-container">
      {/* =====================================================================
          1. MAIN CONNECTION HERO (Visual-First, Limited Text)
          Heading: "Connect Your Device"
          Subtitle: "Start smart storage monitoring."
          Visual: [ ESP32 DEVICE ILLUSTRATION ] -> Wi-Fi -> [ VegSense ]
          ===================================================================== */}
      <div className="refined-hero-section">
        <h1 className="refined-main-title">Connect Your Device</h1>
        <p className="refined-main-subtitle">Start smart storage monitoring.</p>

        {/* Hero Visual Connection: ESP32 -> Wi-Fi -> VegSense */}
        <VisualHeroConnection isConnected={isConnected} />
      </div>

      {/* =====================================================================
          3. VISUAL CONNECTION FLOW (ESP32 | Wi-Fi | Connect | Monitor)
          ===================================================================== */}
      <VisualConnectionFlow />

      {/* =====================================================================
          MAIN SPLIT INTERFACE: Visual Board & Guides (Left) / Action Form (Right)
          ===================================================================== */}
      <div className="refined-main-grid">
        {/* LEFT COLUMN: Visual Product Graphic & Compact Steps */}
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
                <span>{isConnected ? 'ESP32-001 Connected' : 'Ready to Connect'}</span>
              </span>
            </div>

            {/* Technical Vector Illustration */}
            <Esp32BoardVisual isConnected={isConnected} isConnecting={isConnecting} />
          </div>

          {/* 4. HOW TO CONNECT (3-Step Visual Guide with minimal text + Need help?) */}
          <VisualThreeStepGuide onOpenHelp={() => setIsHelpOpen(true)} />

          {/* 5. SERIAL MONITOR (Compact Card with 1-click Copy) */}
          <SerialMonitorCompact
            ip="192.168.1.105"
            onCopy={(copiedIp) => {
              setIpAddress(copiedIp);
              setInputError('');
              addToast('IP copied to input.', 'info');
            }}
          />
        </div>

        {/* RIGHT COLUMN: Connection Form / Device Preview / Connected State / Error State */}
        <div className="refined-right-col">
          {/* STATE 1: CONNECTED STATE */}
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
            /* STATE 2: NOT CONNECTED / INPUT FORM / ERROR STATE */
            <div className="vegsense-card refined-form-card">
              {/* Heading & Status */}
              <div className="form-card-top">
                <h2 className="refined-form-title">Connect ESP32</h2>
                <span className="form-status-tag">● Not Connected</span>
              </div>

              {/* 8. ERROR STATE (Short, Visual) */}
              {connectionError ? (
                <ConnectionFailedView
                  ip={connectionError.ip}
                  onRetry={handleConnect}
                  onChangeIp={() => {
                    setConnectionError(null);
                    setInputError('');
                  }}
                />
              ) : (
                /* 2. CONNECTION FORM (Limited Text, Visual First) */
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
                      Use the IP shown on your ESP32.
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
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <Wifi size={18} />
                        <span>Connect Device</span>
                      </>
                    )}
                  </button>

                  {/* 6. DEVICE PREVIEW (Clean Card with IP & Ready status) */}
                  <div className="preview-section-divider">
                    <DevicePreviewCard
                      deviceName="ESP32-001"
                      ipAddress={ipAddress}
                      isConnected={false}
                      isConnecting={isConnecting}
                    />
                  </div>

                  {/* Quick Prototype Simulator Trigger */}
                  <div className="refined-demo-trigger">
                    <button
                      type="button"
                      className="demo-pill-btn"
                      onClick={handleDemoSimulation}
                      disabled={isConnecting}
                    >
                      <Sparkles size={14} color="var(--primary)" />
                      <span>Simulate ESP32 (Offline Mode)</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Optional "Need help?" Detailed Setup Modal */}
      <SetupHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
export default ConnectDevicePage;
