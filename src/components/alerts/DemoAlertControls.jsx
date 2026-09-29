import React, { useState } from 'react';
import {
  FlaskConical,
  RotateCcw,
  Thermometer,
  Droplets,
  Activity,
  Sun,
  ShieldAlert,
  WifiOff,
  Wifi,
  Radio,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export function DemoAlertControls({
  onTriggerTest,
  onResetDemo,
  isDemo = true,
  currentStatus = {}
}) {
  const [activeTest, setActiveTest] = useState('normal');

  if (!isDemo) return null;

  const handleTest = (testKey, label) => {
    setActiveTest(testKey);
    if (onTriggerTest) {
      onTriggerTest(testKey);
    }
  };

  const testGroups = [
    {
      group: 'Atmospheric Conditions',
      items: [
        { id: 'normal', label: 'Normal Conditions', icon: CheckCircle2, type: 'success' },
        { id: 'temp_warning', label: 'Temperature Warning (32°C)', icon: Thermometer, type: 'warning' },
        { id: 'temp_high', label: 'High Temperature (36°C)', icon: Thermometer, type: 'danger' },
        { id: 'humidity_high', label: 'High Humidity (88%)', icon: Droplets, type: 'danger' },
        { id: 'humidity_low', label: 'Low Humidity (42%)', icon: Droplets, type: 'warning' },
        { id: 'gas_elevated', label: 'Elevated Gas/VOC (600)', icon: Activity, type: 'warning' },
        { id: 'gas_high', label: 'High Gas/VOC (750)', icon: Activity, type: 'danger' },
        { id: 'light_low', label: 'Low Light (50 lux)', icon: Sun, type: 'warning' },
        { id: 'light_high', label: 'High Light (700 lux)', icon: Sun, type: 'warning' }
      ]
    },
    {
      group: 'Calculated Spoilage Risk Transitions',
      items: [
        { id: 'spoilage_warning', label: 'Spoilage Warning (31–60%)', icon: AlertTriangle, type: 'warning' },
        { id: 'spoilage_risk', label: 'Spoilage Risk (61–80%)', icon: ShieldAlert, type: 'danger' },
        { id: 'spoilage_critical', label: 'Critical Spoilage Risk (81–100%)', icon: ShieldAlert, type: 'danger' }
      ]
    },
    {
      group: 'Hardware & Sensor Telemetry States',
      items: [
        { id: 'device_offline', label: 'Device Offline', icon: WifiOff, type: 'danger' },
        { id: 'device_reconnect', label: 'Device Reconnect', icon: Wifi, type: 'success' },
        { id: 'sensor_unavailable', label: 'Sensor Unavailable', icon: Radio, type: 'warning' },
        { id: 'sensor_recovery', label: 'Sensor Recovery', icon: Radio, type: 'success' }
      ]
    }
  ];

  return (
    <div
      className="vegsense-card"
      style={{
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        backgroundColor: 'var(--bg-card)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.85rem',
          marginBottom: '1rem',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FlaskConical size={18} color="var(--primary)" />
          <span style={{ fontWeight: 800, fontSize: '0.975rem', color: 'var(--text-main)' }}>
            Demo Alert Testing Laboratory
          </span>
          <span
            style={{
              fontSize: '0.675rem',
              fontWeight: 800,
              padding: '0.15rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--primary)',
              textTransform: 'uppercase'
            }}
          >
            DEMO MODE ONLY
          </span>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setActiveTest('normal');
            if (onResetDemo) onResetDemo();
          }}
          style={{ height: '32px', fontSize: '0.785rem', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <RotateCcw size={13} />
          <span>Reset Demo</span>
        </button>
      </div>

      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
        Execute reproducible microclimate test events to evaluate state transition alerts, event deduplication, and automated recovery resolution.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {testGroups.map((grp, gIdx) => (
          <div key={gIdx}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--text-muted)',
                marginBottom: '0.5rem'
              }}
            >
              {grp.group}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {grp.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTest === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`btn-secondary ${isActive ? 'active' : ''}`}
                    onClick={() => handleTest(item.id, item.label)}
                    style={{
                      height: '32px',
                      fontSize: '0.775rem',
                      fontWeight: 700,
                      padding: '0 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      borderColor: isActive ? 'var(--primary)' : 'var(--border-light)',
                      backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                      color: isActive ? 'var(--primary)' : 'var(--text-main)'
                    }}
                  >
                    <Icon size={13} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
