import React from 'react';
import {
  Cpu,
  Wifi,
  Radio,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Monitor,
  Zap,
  Power,
  Layers,
  Thermometer,
  Droplets,
  Wind,
  HelpCircle,
  X
} from 'lucide-react';

/* =============================================================================
   1. ESP32 MODERN PRODUCT ILLUSTRATION (Vector SVG)
   Clean, modern IoT product illustration showing:
   - ESP32 board
   - Wi-Fi signal
   - Sensor connection indicators: DHT22, MQ-135, OLED
   - 3 Status LEDs (Green, Yellow, Red)
============================================================================= */
export function Esp32BoardVisual({ isConnected = false, isConnecting = false }) {
  return (
    <div className="esp32-product-graphic-wrap">
      <svg
        className="esp32-product-svg"
        viewBox="0 0 380 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="ESP32 DevKit V1 Hardware Illustration"
      >
        <defs>
          {/* Subtle PCB gradients */}
          <linearGradient id="pcbGrad" x1="0" y1="0" x2="380" y2="240" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0f172a" />
            <stop offset="1" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="chipMetalGrad" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#334155" />
            <stop offset="0.5" stopColor="#475569" />
            <stop offset="1" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="goldTrace" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#d97706" />
            <stop offset="1" stopColor="#fbbf24" />
          </linearGradient>
          <radialGradient id="signalPulse" cx="50%" cy="50%" r="50%">
            <stop stopColor="var(--primary, #10b981)" stopOpacity="0.8" />
            <stop offset="1" stopColor="var(--primary, #10b981)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Glow behind board */}
        <circle cx="190" cy="120" r="110" fill="url(#signalPulse)" opacity={isConnected ? 0.35 : 0.12} />

        {/* Board Shadow */}
        <rect x="54" y="34" width="272" height="172" rx="16" fill="rgba(0,0,0,0.3)" />

        {/* Main PCB Board */}
        <rect
          x="50"
          y="30"
          width="272"
          height="172"
          rx="14"
          fill="url(#pcbGrad)"
          stroke={isConnected ? 'var(--primary, #10b981)' : '#334155'}
          strokeWidth="2"
        />

        {/* Board Mounting Holes */}
        <circle cx="66" cy="46" r="4.5" fill="#0b0f17" stroke="#475569" strokeWidth="1.5" />
        <circle cx="306" cy="46" r="4.5" fill="#0b0f17" stroke="#475569" strokeWidth="1.5" />
        <circle cx="66" cy="186" r="4.5" fill="#0b0f17" stroke="#475569" strokeWidth="1.5" />
        <circle cx="306" cy="186" r="4.5" fill="#0b0f17" stroke="#475569" strokeWidth="1.5" />

        {/* Metallic Pin Headers (Left & Right) */}
        {Array.from({ length: 11 }).map((_, i) => (
          <g key={`pin-l-${i}`}>
            <rect x="56" y={58 + i * 11} width="8" height="6" rx="1" fill="#f59e0b" opacity="0.9" />
            <rect x="308" y={58 + i * 11} width="8" height="6" rx="1" fill="#f59e0b" opacity="0.9" />
          </g>
        ))}

        {/* Copper Circuit Traces (Visual Tech Vibe) */}
        <path
          d="M70 70 H 100 V 90 H 120 M70 150 H 95 V 135 H 120 M250 85 H 280 V 70 H 300 M250 145 H 275 V 160 H 300"
          stroke="url(#goldTrace)"
          strokeWidth="1.2"
          strokeOpacity="0.45"
          fill="none"
        />

        {/* ESP-WROOM-32 Metal RF Canister Shield */}
        <rect
          x="122"
          y="56"
          width="128"
          height="104"
          rx="8"
          fill="url(#chipMetalGrad)"
          stroke="#64748b"
          strokeWidth="1.5"
        />

        {/* Wi-Fi Serpentine Antenna (Gold Traces on PCB top) */}
        <path
          d="M136 64 H 146 V 72 H 156 V 64 H 166 V 72 H 176 V 64 H 186 V 72 H 196 V 64 H 206 V 72 H 216 V 64 H 226"
          stroke="url(#goldTrace)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Wi-Fi Broadcast Waves (Animated when connected or connecting) */}
        <g className={isConnected ? 'wifi-wave-pulse' : ''} transform="translate(186, 44)">
          <path
            d="M -16 -6 A 22 22 0 0 1 16 -6"
            stroke={isConnected ? '#22c55e' : isConnecting ? '#38bdf8' : '#64748b'}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity={isConnected || isConnecting ? 0.95 : 0.4}
          />
          <path
            d="M -26 -14 A 36 36 0 0 1 26 -14"
            stroke={isConnected ? '#22c55e' : isConnecting ? '#38bdf8' : '#64748b'}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity={isConnected || isConnecting ? 0.75 : 0.25}
          />
          <circle
            cx="0"
            cy="0"
            r="3"
            fill={isConnected ? '#22c55e' : isConnecting ? '#38bdf8' : '#94a3b8'}
          />
        </g>

        {/* Chip Laser Marking */}
        <text x="186" y="105" textAnchor="middle" fill="#f8fafc" fontSize="10" fontFamily="monospace" fontWeight="bold" letterSpacing="0.08em">
          ESP-WROOM-32
        </text>
        <text x="186" y="120" textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontFamily="sans-serif" letterSpacing="0.04em">
          Wi-Fi + BLE IoT Node
        </text>

        {/* 3 Status LEDs (Green, Yellow, Red) */}
        <g transform="translate(150, 138)">
          {/* Green LED (GPIO 18) */}
          <circle cx="12" cy="0" r="4" fill={isConnected ? '#22c55e' : '#14532d'} stroke="#22c55e" strokeWidth="1" />
          {isConnected && <circle cx="12" cy="0" r="7" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.6" className="led-pulse" />}

          {/* Yellow LED (GPIO 19) */}
          <circle cx="36" cy="0" r="4" fill={isConnecting ? '#f59e0b' : '#78350f'} stroke="#f59e0b" strokeWidth="1" />

          {/* Red LED (GPIO 23) */}
          <circle cx="60" cy="0" r="4" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1" opacity="0.7" />
        </g>

        {/* USB-C Port */}
        <rect x="168" y="196" width="36" height="8" rx="3" fill="#64748b" stroke="#94a3b8" strokeWidth="1" />

        {/* Integrated Sensor Indicators (DHT22, MQ-135, OLED) */}
        {/* DHT22 Sensor Pill (Left Top) */}
        <g transform="translate(18, 55)">
          <rect x="0" y="0" width="70" height="26" rx="6" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.2" />
          <circle cx="13" cy="13" r="5" fill="#3b82f6" opacity="0.25" />
          <path d="M13 10 V 16 M10 13 H 16" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
          <text x="26" y="16" fill="#e2e8f0" fontSize="8" fontWeight="bold">DHT22</text>
        </g>

        {/* MQ-135 Sensor Pill (Left Bottom) */}
        <g transform="translate(18, 145)">
          <rect x="0" y="0" width="70" height="26" rx="6" fill="#1e293b" stroke="#10b981" strokeWidth="1.2" />
          <circle cx="13" cy="13" r="5" fill="#10b981" opacity="0.25" />
          <circle cx="13" cy="13" r="2.5" fill="#34d399" />
          <text x="26" y="16" fill="#e2e8f0" fontSize="8" fontWeight="bold">MQ-135</text>
        </g>

        {/* 0.96" OLED Display Pill (Right Top) */}
        <g transform="translate(288, 55)">
          <rect x="0" y="0" width="74" height="26" rx="6" fill="#090d16" stroke="#06b6d4" strokeWidth="1.2" />
          <rect x="8" y="7" width="14" height="12" rx="2" fill="#0891b2" opacity="0.4" />
          <text x="28" y="16" fill="#22d3ee" fontSize="8" fontWeight="bold">OLED 0.96"</text>
        </g>

        {/* Status Badge (Right Bottom) */}
        <g transform="translate(288, 145)">
          <rect
            x="0"
            y="0"
            width="74"
            height="26"
            rx="6"
            fill={isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.2)'}
            stroke={isConnected ? '#10b981' : '#64748b'}
            strokeWidth="1.2"
          />
          <circle cx="12" cy="13" r="3.5" fill={isConnected ? '#10b981' : '#f59e0b'} />
          <text x="22" y="16" fill={isConnected ? '#34d399' : '#e2e8f0'} fontSize="7.5" fontWeight="bold">
            {isConnected ? 'ONLINE' : 'READY'}
          </text>
        </g>
      </svg>
    </div>
  );
}

/* =============================================================================
   2. MAIN CONNECTION HERO DIAGRAM
   [ ESP32 ] ---> Wi-Fi ---> [ VegSense ]
============================================================================= */
export function VisualHeroConnection({ isConnected = false }) {
  return (
    <div className="visual-hero-diagram-card">
      <div className="hero-flow-nodes-row">
        {/* Node 1: ESP32 Device */}
        <div className={`hero-flow-node ${isConnected ? 'active' : ''}`}>
          <div className="hero-node-icon-box">
            <Cpu size={24} />
          </div>
          <span className="hero-node-label">ESP32</span>
          <span className="hero-node-sub">Storage Node</span>
        </div>

        {/* Connector 1: Animated Wi-Fi Wave */}
        <div className="hero-flow-arrow">
          <div className={`hero-flow-line ${isConnected ? 'active' : ''}`}>
            <span className="hero-flow-particle" />
          </div>
          <div className="hero-flow-badge">
            <Wifi size={13} />
            <span>Wi-Fi</span>
          </div>
        </div>

        {/* Node 2: VegSense Cloud Gateway */}
        <div className={`hero-flow-node ${isConnected ? 'active' : ''}`}>
          <div className="hero-node-icon-box green">
            <ShieldCheck size={24} />
          </div>
          <span className="hero-node-label">VegSense</span>
          <span className="hero-node-sub">Smart Intelligence</span>
        </div>
      </div>
    </div>
  );
}

/* =============================================================================
   3. VISUAL CONNECTION FLOW (4 Steps with one short word)
   ESP32 | Wi-Fi | Connect | Monitor
============================================================================= */
export function VisualConnectionFlow() {
  const steps = [
    { label: 'ESP32', icon: <Cpu size={18} /> },
    { label: 'Wi-Fi', icon: <Wifi size={18} /> },
    { label: 'Connect', icon: <Radio size={18} /> },
    { label: 'Monitor', icon: <Monitor size={18} /> }
  ];

  return (
    <div className="visual-flow-strip">
      {steps.map((st, i) => (
        <React.Fragment key={st.label}>
          <div className="visual-flow-item">
            <div className="visual-flow-circle">{st.icon}</div>
            <span className="visual-flow-word">{st.label}</span>
          </div>
          {i < steps.length - 1 && <span className="visual-flow-divider">→</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

/* =============================================================================
   4. HOW TO CONNECT (3-Step Visual Guide with minimal text + Need help?)
============================================================================= */
export function VisualThreeStepGuide({ onOpenHelp }) {
  return (
    <div className="visual-three-steps-card">
      <div className="visual-steps-header">
        <h3 className="visual-steps-title">How to Connect</h3>
        <button type="button" className="need-help-link-btn" onClick={onOpenHelp}>
          <HelpCircle size={14} />
          <span>Need help?</span>
        </button>
      </div>

      <div className="visual-steps-grid">
        {/* Step 1 */}
        <div className="visual-step-card">
          <span className="step-badge">1</span>
          <div className="step-graphic-box">
            <Power size={22} color="var(--primary)" />
          </div>
          <span className="step-short-title">Power ON</span>
        </div>

        {/* Step 2 */}
        <div className="visual-step-card">
          <span className="step-badge">2</span>
          <div className="step-graphic-box">
            <Wifi size={22} color="#06b6d4" />
          </div>
          <span className="step-short-title">Connect Wi-Fi</span>
        </div>

        {/* Step 3 */}
        <div className="visual-step-card">
          <span className="step-badge">3</span>
          <div className="step-graphic-box">
            <Radio size={22} color="#8b5cf6" />
          </div>
          <span className="step-short-title">Enter IP</span>
        </div>
      </div>
    </div>
  );
}

/* =============================================================================
   5. COMPACT SERIAL MONITOR CARD (With 1-click Copy)
============================================================================= */
export function SerialMonitorCompact({ ip = '192.168.1.105', onCopy }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(ip);
    setCopied(true);
    if (onCopy) onCopy(ip);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="serial-monitor-compact-card">
      <div className="serial-compact-top">
        <span className="serial-compact-title">ESP32 SERIAL MONITOR</span>
        <span className="serial-status-dot">● WiFi connected</span>
      </div>

      <div className="serial-compact-body">
        <div className="serial-ip-line">
          <span className="serial-ip-label">IP Address:</span>
          <span className="serial-ip-value">{ip}</span>
        </div>

        <button
          type="button"
          className="serial-copy-btn"
          onClick={handleCopy}
          title="Copy IP to input"
        >
          {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
          <span>{copied ? 'Copied!' : 'Copy this IP'}</span>
        </button>
      </div>
    </div>
  );
}

/* =============================================================================
   6. DEVICE PREVIEW CARD
   ┌─────────────────────────────┐
   │        ESP32-001             │
   │       [ ESP32 IMAGE ]        │
   │       ● Ready to Connect     │
   │       192.168.1.105          │
   └─────────────────────────────┘
============================================================================= */
export function DevicePreviewCard({
  deviceName = 'ESP32-001',
  ipAddress = '192.168.1.105',
  isConnected = false,
  isConnecting = false
}) {
  return (
    <div className="device-preview-card-box">
      <div className="preview-top-name">{deviceName}</div>

      <div className="preview-mini-illustration">
        <Cpu size={36} color={isConnected ? 'var(--primary)' : '#64748b'} />
      </div>

      <div className={`preview-status-pill ${isConnected ? 'online' : 'ready'}`}>
        <span className={`status-dot ${isConnected ? 'green' : 'amber'}`} />
        <span>{isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Ready to Connect'}</span>
      </div>

      <div className="preview-ip-mono">{ipAddress || '192.168.1.105'}</div>
    </div>
  );
}

/* =============================================================================
   7. CONNECTED STATE VIEW (Compact 3 sensor cards + Fresh/Risk + Continue)
============================================================================= */
export function ConnectedStateView({
  device = {},
  sensorData = {},
  onContinue,
  onChangeDevice
}) {
  const temp = sensorData.temperature !== undefined ? `${sensorData.temperature}°C` : '28.5°C';
  const humidity = sensorData.humidity !== undefined ? `${sensorData.humidity}%` : '72%';
  const gasLevel = sensorData.gasLevel || sensorData.gasVOC;
  const gasStatus = sensorData.gasStatus || (gasLevel > 500 ? 'Elevated' : 'Normal');
  const risk = sensorData.spoilageRisk !== undefined ? sensorData.spoilageRisk : 18;
  const condition = sensorData.status || sensorData.storageCondition || 'FRESH';

  return (
    <div className="connected-visual-state-wrap">
      {/* Top Banner */}
      <div className="connected-top-banner">
        <CheckCircle2 size={24} color="#ffffff" />
        <div>
          <h2 className="connected-banner-title">✓ Connected</h2>
          <div className="connected-device-subtitle">
            {device.name || 'ESP32-001'} · <span className="mono-ip">{device.ip || device.ipAddress || '192.168.1.105'}</span>
          </div>
        </div>
      </div>

      {/* 3 Compact Sensor Cards */}
      <div className="connected-three-sensors-grid">
        {/* Card 1: Temperature */}
        <div className="compact-sensor-card">
          <span className="compact-sensor-icon">🌡</span>
          <span className="compact-sensor-val">{temp}</span>
          <span className="compact-sensor-label">Temperature</span>
        </div>

        {/* Card 2: Humidity */}
        <div className="compact-sensor-card">
          <span className="compact-sensor-icon">💧</span>
          <span className="compact-sensor-val">{humidity}</span>
          <span className="compact-sensor-label">Humidity</span>
        </div>

        {/* Card 3: Gas / VOC */}
        <div className="compact-sensor-card">
          <span className="compact-sensor-icon">◉</span>
          <span className="compact-sensor-val">{gasStatus}</span>
          <span className="compact-sensor-label">Gas / VOC</span>
        </div>
      </div>

      {/* Storage Status & Spoilage Risk Pill */}
      <div className="connected-status-pill-row">
        <span className="status-condition-badge">{condition}</span>
        <span className="status-risk-badge">Risk {risk}%</span>
      </div>

      {/* Action Buttons */}
      <div className="connected-actions-row">
        <button
          type="button"
          className="btn-primary continue-action-btn"
          onClick={onContinue}
        >
          <span>Continue to Dashboard</span>
          <ArrowRight size={17} />
        </button>

        <button
          type="button"
          className="btn-secondary change-action-btn"
          onClick={onChangeDevice}
        >
          <RotateCcw size={15} />
          <span>Change Device</span>
        </button>
      </div>
    </div>
  );
}

/* =============================================================================
   8. COMPACT ERROR STATE VIEW
============================================================================= */
export function ConnectionFailedView({ onRetry, onChangeIp, ip = '192.168.1.105' }) {
  return (
    <div className="compact-error-card">
      <div className="error-icon-circle">
        <AlertTriangle size={24} color="#ef4444" />
      </div>

      <h3 className="compact-error-title">Connection Failed</h3>
      <p className="compact-error-sub">Check your ESP32 and IP.</p>

      <div className="compact-error-buttons">
        <button type="button" className="btn-primary error-retry-btn" onClick={() => onRetry(ip)}>
          <RotateCcw size={15} />
          <span>Try Again</span>
        </button>

        <button type="button" className="btn-secondary error-change-btn" onClick={onChangeIp}>
          <span>Change IP</span>
        </button>
      </div>
    </div>
  );
}

/* =============================================================================
   9. DETAILED HELP MODAL (Only when user explicitly clicks "Need help?")
============================================================================= */
export function SetupHelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="help-modal-header">
          <h3 className="help-modal-title">ESP32 Setup Guide</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="help-modal-body">
          <div className="help-step-item">
            <span className="step-num">1</span>
            <div>
              <strong>Power Microcontroller</strong>
              <p>Connect ESP32 DevKit V1 to computer via USB-C cable.</p>
            </div>
          </div>

          <div className="help-step-item">
            <span className="step-num">2</span>
            <div>
              <strong>Serial Monitor</strong>
              <p>Open Arduino IDE &gt; Tools &gt; Serial Monitor (115200 baud).</p>
            </div>
          </div>

          <div className="help-step-item">
            <span className="step-num">3</span>
            <div>
              <strong>Local IP</strong>
              <p>Look for: <code>IP Address: 192.168.1.105</code></p>
            </div>
          </div>

          <div className="help-step-item">
            <span className="step-num">4</span>
            <div>
              <strong>Same Wi-Fi</strong>
              <p>Ensure computer and ESP32 are on the same local 2.4 GHz network.</p>
            </div>
          </div>
        </div>

        <div className="help-modal-footer">
          <button type="button" className="btn-primary" onClick={onClose} style={{ width: '100%', height: '40px' }}>
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
