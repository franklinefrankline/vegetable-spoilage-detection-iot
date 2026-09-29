import React, { useState } from 'react';
import {
  Cpu,
  Wifi,
  RefreshCw,
  ExternalLink,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Radio
} from 'lucide-react';

export function DeviceCard({
  device,
  isActive,
  onReconnect,
  onViewSensors,
  onRemove,
  isReconnecting
}) {
  const isDemo = device.mode === 'DEMO' || device.isDemo || device.deviceName?.includes('DEMO');
  const isConnected = device.status === 'connected' || device.status === 'Demo Connected';

  return (
    <div
      style={{
        padding: '1.25rem',
        borderRadius: '12px',
        border: isActive
          ? '2px solid var(--primary-color, #1b4d2e)'
          : '1px solid var(--border-color)',
        background: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: isActive ? '0 4px 16px rgba(27, 77, 46, 0.08)' : 'none',
        position: 'relative'
      }}
    >
      {/* Card Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              backgroundColor: isDemo ? 'rgba(2, 132, 199, 0.1)' : 'rgba(27, 77, 46, 0.1)',
              color: isDemo ? '#0284c7' : 'var(--primary-color, #1b4d2e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Cpu size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {device.device_name || device.deviceName || device.name || 'ESP32 Gateway'}
              </h3>
              {isActive && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    background: 'var(--primary-color, #1b4d2e)',
                    color: '#ffffff',
                    letterSpacing: '0.04em'
                  }}
                >
                  ACTIVE
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              ID: {device.id || device.deviceId || 'ESP32-001'}
            </span>
          </div>
        </div>

        {/* Mode & Status Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              background: isDemo ? 'rgba(2, 132, 199, 0.12)' : 'rgba(22, 163, 74, 0.12)',
              color: isDemo ? '#0284c7' : '#16a34a',
              letterSpacing: '0.03em'
            }}
          >
            {isDemo ? 'DEMO MODE' : 'LIVE DEVICE'}
          </span>

          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              background: isConnected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: isConnected ? '#15803d' : '#dc2626',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: isConnected ? '#16a34a' : '#dc2626'
              }}
            />
            {isConnected ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Device Telemetry Specs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
          padding: '0.85rem',
          borderRadius: '8px',
          background: 'var(--bg-page)',
          fontSize: '0.82rem'
        }}
      >
        <div>
          <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
            IP ADDRESS
          </span>
          <span style={{ fontWeight: 600, color: 'var(--text-main)', fontFamily: 'monospace' }}>
            {device.ip_address || device.ipAddress || device.ip || '192.168.1.105'}
          </span>
        </div>

        <div>
          <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
            COMMUNICATION
          </span>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
            Wi-Fi (HTTP REST)
          </span>
        </div>

        <div>
          <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
            INTEGRATED SENSORS
          </span>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
            DHT22, MQ-135, BH1750
          </span>
        </div>

        <div>
          <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
            LAST VERIFIED
          </span>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
            {device.last_connected ? new Date(device.last_connected).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => onReconnect(device)}
            disabled={isReconnecting}
            className="btn btn-secondary"
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600
            }}
          >
            <RefreshCw size={14} className={isReconnecting ? 'spinner' : ''} />
            {isReconnecting ? 'Testing Link...' : 'Reconnect'}
          </button>

          <button
            type="button"
            onClick={onViewSensors}
            className="btn btn-secondary"
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600
            }}
          >
            <ExternalLink size={14} /> View Sensors
          </button>
        </div>

        {!isDemo && (
          <button
            type="button"
            onClick={() => onRemove(device)}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc2626',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.6rem'
            }}
          >
            <Trash2 size={14} /> Disconnect
          </button>
        )}
      </div>
    </div>
  );
}
