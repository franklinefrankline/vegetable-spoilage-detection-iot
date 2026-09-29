import React, { useState } from 'react';
import { DeviceCard } from './DeviceCard';
import {
  Plus,
  Radio,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Wifi,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from '../../router/Router';

export function DeviceManagement({
  devices,
  activeDevice,
  onConnectRealDevice,
  onSwitchToDemo,
  onReconnectDevice,
  onRemoveDevice,
  isConnecting
}) {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deviceName, setDeviceName] = useState('ESP32-001');
  const [ipAddress, setIpAddress] = useState('192.168.1.105');
  const [formError, setFormError] = useState('');
  const [reconnectingId, setReconnectingId] = useState(null);

  const isValidIPv4 = (ip) => {
    if (!ip || typeof ip !== 'string') return false;
    const parts = ip.trim().split('.');
    if (parts.length !== 4) return false;
    return parts.every((p) => {
      const n = Number(p);
      return !isNaN(n) && n >= 0 && n <= 255 && String(n) === p;
    });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!deviceName.trim()) {
      setFormError('Please enter a device identifier.');
      return;
    }

    if (!isValidIPv4(ipAddress.trim())) {
      setFormError('Please enter a valid IPv4 address (e.g. 192.168.1.105).');
      return;
    }

    try {
      await onConnectRealDevice({
        deviceName: deviceName.trim(),
        ipAddress: ipAddress.trim()
      });
      setShowAddForm(false);
    } catch (err) {
      setFormError(err.message || 'Failed to connect to ESP32 device.');
    }
  };

  const handleReconnect = async (dev) => {
    setReconnectingId(dev.id || dev.deviceId);
    try {
      await onReconnectDevice(dev);
    } finally {
      setReconnectingId(null);
    }
  };

  const isCurrentDemo = activeDevice?.isDemo || activeDevice?.mode === 'DEMO' || activeDevice?.deviceName?.includes('DEMO');

  return (
    <div className="settings-panel">
      <div className="settings-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Device Management
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Manage physical ESP32 microcontrollers, IP telemetry bindings, and simulation modes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.55rem 1rem',
            fontSize: '0.84rem',
            fontWeight: 600
          }}
        >
          <Plus size={16} /> Add Real ESP32
        </button>
      </div>

      {/* Mode Switcher Banner */}
      <div
        style={{
          marginTop: '1.25rem',
          padding: '1rem',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-page)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              backgroundColor: isCurrentDemo ? 'rgba(2, 132, 199, 0.15)' : 'rgba(22, 163, 74, 0.15)',
              color: isCurrentDemo ? '#0284c7' : '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Radio size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Active Operating Mode: {isCurrentDemo ? 'DEMO MODE' : 'REAL ESP32 HARDWARE'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {isCurrentDemo
                ? 'Consuming controlled simulation pipeline. No physical network socket required.'
                : 'Streaming live microclimate readings directly from verified physical ESP32.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isCurrentDemo ? (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 600 }}
            >
              Switch to Real Device
            </button>
          ) : (
            <button
              type="button"
              onClick={onSwitchToDemo}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 600 }}
            >
              Switch to Demo Mode
            </button>
          )}
        </div>
      </div>

      {/* Add Device Form Modal / Collapsible */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          style={{
            marginTop: '1.25rem',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '2px dashed var(--primary-color, #1b4d2e)',
            background: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wifi size={18} style={{ color: 'var(--primary-color, #1b4d2e)' }} />
              Connect Real ESP32 Microcontroller
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem' }}
            >
              Cancel
            </button>
          </div>

          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Enter your ESP32's assigned Wi-Fi IP address. VegSense will query <code>http://[IP]/status</code> and <code>http://[IP]/api/data</code> to verify live sensor communication before promoting it to active LIVE DEVICE.
          </p>

          {formError && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#dc2626',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertCircle size={16} /> {formError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                Device Identifier
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="e.g. ESP32-001"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                Local IPv4 Address
              </label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="e.g. 192.168.1.105"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                  fontFamily: 'monospace'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn btn-secondary"
              style={{ padding: '0.55rem 1rem', fontSize: '0.84rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isConnecting}
              className="btn btn-primary"
              style={{
                padding: '0.55rem 1.25rem',
                fontSize: '0.84rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {isConnecting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Wifi size={15} />}
              {isConnecting ? 'Verifying Link...' : 'Verify & Connect Device'}
            </button>
          </div>
        </form>
      )}

      {/* Devices List */}
      <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {devices && devices.length > 0 ? (
          devices.map((dev) => (
            <DeviceCard
              key={dev.id || dev.deviceId || dev.ip_address}
              device={dev}
              isActive={
                (activeDevice?.id && dev.id === activeDevice.id) ||
                (activeDevice?.ip_address && dev.ip_address === activeDevice.ip_address) ||
                (activeDevice?.ipAddress && dev.ipAddress === activeDevice.ipAddress)
              }
              onReconnect={handleReconnect}
              onViewSensors={() => navigate('/sensors')}
              onRemove={onRemoveDevice}
              isReconnecting={reconnectingId === (dev.id || dev.deviceId)}
            />
          ))
        ) : (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              borderRadius: '10px',
              border: '1px dashed var(--border-color)',
              color: 'var(--text-secondary)'
            }}
          >
            No registered devices found. Click "Add Real ESP32" or enable Demo Mode.
          </div>
        )}
      </div>
    </div>
  );
}
