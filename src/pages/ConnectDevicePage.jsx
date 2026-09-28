import React, { useState } from 'react';
import { useDevice } from '../context/DeviceContext';
import { useToast } from '../context/ToastContext';
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
  Search,
  ExternalLink
} from 'lucide-react';

export function ConnectDevicePage() {
  const { isConnected, device, connectDevice, disconnectDevice } = useDevice();
  const { addToast } = useToast();

  const [inputIp, setInputIp] = useState(device.ip || '192.168.1.105');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!inputIp.trim()) {
      addToast('Please enter an ESP32 IP address.', 'error');
      return;
    }

    setIsConnecting(true);
    try {
      await connectDevice(inputIp.trim());
      addToast(`Connected to ESP32 at ${inputIp.trim()} successfully.`, 'success');
    } catch (err) {
      addToast('Failed to establish connection to ESP32 device.', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectDevice();
    addToast('ESP32 device disconnected.', 'info');
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
          Connect Your Storage Device
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Establish real-time Wi-Fi & telemetry communication with your physical ESP32 vegetable storage monitor.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Main Connection Card */}
        <div className="vegsense-card">
          <div className="card-header-row">
            <div className="card-title-group">
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={20} />
              </div>
              <div>
                <h2 className="card-title">ESP32 DEVICE</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Microcontroller Telemetry Gateway</div>
              </div>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.8rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700, backgroundColor: isConnected ? 'var(--primary-light)' : '#fee2e2', color: isConnected ? 'var(--primary)' : '#b91c1c' }}>
              <span className={`pulse-led-indicator ${isConnected ? '' : 'led-red'}`} style={{ backgroundColor: isConnected ? 'var(--status-green)' : '#ef4444' }} />
              <span>{isConnected ? 'Device Connected' : 'Not Connected'}</span>
            </div>
          </div>

          {isConnected ? (
            <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem', border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>DEVICE ID</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>{device.id}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>IP ADDRESS</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'monospace', marginTop: '2px' }}>{device.ip}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>SIGNAL STRENGTH</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Wifi size={15} />
                    <span>{device.signal} (-54 dBm)</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>FIRMWARE / UPTIME</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>{device.firmware} • {device.uptime}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="btn-secondary"
                  style={{ color: 'var(--accent-red)' }}
                >
                  Disconnect Device
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConnect} style={{ marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="esp-ip" className="form-label">
                  <span>ESP32 IP Address</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Displayed on prototype 0.96" OLED screen</span>
                </label>
                <div className="login-input-wrapper">
                  <span className="login-input-icon">
                    <Radio size={18} />
                  </span>
                  <input
                    id="esp-ip"
                    type="text"
                    className="login-form-input"
                    placeholder="192.168.1.105"
                    value={inputIp}
                    onChange={(e) => setInputIp(e.target.value)}
                    disabled={isConnecting}
                    style={{ fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.04em' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={isConnecting}
                style={{ height: '46px' }}
              >
                {isConnecting ? (
                  <>
                    <span className="spinner" />
                    <span>Connecting to ESP32...</span>
                  </>
                ) : (
                  <>
                    <Wifi size={17} />
                    <span>Connect Device</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
            <Activity size={15} color="var(--primary)" />
            <span>Telemetry protocols active: DHT22 (GPIO 4), MQ-135 (GPIO 34 ADC), OLED I2C (21/22), Status LEDs (18/19/23).</span>
          </div>
        </div>

        {/* 5 Connection Steps Card */}
        <div className="vegsense-card" style={{ background: 'var(--bg-card)' }}>
          <h2 className="card-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Connection Steps</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                1
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>Power on ESP32</div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Connect the prototype via 5V USB-C or power supply.</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                2
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>Connect ESP32 to Wi-Fi</div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Ensure the device connects to your local 2.4 GHz network.</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                3
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>Find the ESP32 IP address</div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Read the IP shown on the onboard OLED or router table.</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                4
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>Enter the IP address</div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Type the exact IP address in the connection card.</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                5
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>Connect</div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Click connect to activate real-time telemetry streaming.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
