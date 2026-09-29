import React, { useState } from 'react';
import {
  BellRing,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Activity,
  Calendar,
  Cpu,
  Sliders,
  Check,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export function AlertSettings({ settings, onSave, isSaving }) {
  const [tempAlerts, setTempAlerts] = useState(Boolean(settings?.temperature_alerts_enabled ?? 1));
  const [humAlerts, setHumAlerts] = useState(Boolean(settings?.humidity_alerts_enabled ?? 1));
  const [gasAlerts, setGasAlerts] = useState(Boolean(settings?.gas_alerts_enabled ?? 1));
  const [lightAlerts, setLightAlerts] = useState(Boolean(settings?.light_alerts_enabled ?? 1));
  const [spoilAlerts, setSpoilAlerts] = useState(Boolean(settings?.spoilage_alerts_enabled ?? 1));
  const [expiryAlerts, setExpiryAlerts] = useState(Boolean(settings?.expiry_alerts_enabled ?? 1));
  const [devAlerts, setDevAlerts] = useState(Boolean(settings?.device_alerts_enabled ?? 1));
  const [sensorAlerts, setSensorAlerts] = useState(Boolean(settings?.sensor_alerts_enabled ?? 1));
  const [isTouched, setIsTouched] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      temperature_alerts_enabled: tempAlerts ? 1 : 0,
      humidity_alerts_enabled: humAlerts ? 1 : 0,
      gas_alerts_enabled: gasAlerts ? 1 : 0,
      light_alerts_enabled: lightAlerts ? 1 : 0,
      spoilage_alerts_enabled: spoilAlerts ? 1 : 0,
      expiry_alerts_enabled: expiryAlerts ? 1 : 0,
      device_alerts_enabled: devAlerts ? 1 : 0,
      sensor_alerts_enabled: sensorAlerts ? 1 : 0
    });
    setIsTouched(false);
  };

  const alertCategories = [
    {
      id: 'temp',
      title: 'Temperature Incident Alerts',
      desc: 'Dispatches warnings when temperatures rise above configured warning and critical limits.',
      enabled: tempAlerts,
      toggle: () => { setTempAlerts(!tempAlerts); setIsTouched(true); },
      icon: Thermometer,
      color: '#ea580c'
    },
    {
      id: 'hum',
      title: 'Humidity Spike Alerts',
      desc: 'Dispatches warnings when storage chamber relative humidity violates optimal moisture ceilings.',
      enabled: humAlerts,
      toggle: () => { setHumAlerts(!humAlerts); setIsTouched(true); },
      icon: Droplets,
      color: '#0284c7'
    },
    {
      id: 'gas',
      title: 'Gas / VOC Elevation Alerts',
      desc: 'Triggers when MQ-135 detects elevated trace organic decomposition gases.',
      enabled: gasAlerts,
      toggle: () => { setGasAlerts(!gasAlerts); setIsTouched(true); },
      icon: Wind,
      color: '#16a34a'
    },
    {
      id: 'light',
      title: 'Photometric Exposure Alerts',
      desc: 'Flags excessive illumination exceeding the safe storage threshold (greening hazard).',
      enabled: lightAlerts,
      toggle: () => { setLightAlerts(!lightAlerts); setIsTouched(true); },
      icon: Sun,
      color: '#ca8a04'
    },
    {
      id: 'spoilage',
      title: 'Estimated Spoilage Risk Alerts',
      desc: 'High-priority notifications when combined algorithmic risk enters SPOILAGE RISK or CRITICAL.',
      enabled: spoilAlerts,
      toggle: () => { setSpoilAlerts(!spoilAlerts); setIsTouched(true); },
      icon: Activity,
      color: '#dc2626'
    },
    {
      id: 'expiry',
      title: 'Configured Storage Expiry Alerts',
      desc: 'Alerts when vegetable batches reach or exceed their configured shelf life duration.',
      enabled: expiryAlerts,
      toggle: () => { setExpiryAlerts(!expiryAlerts); setIsTouched(true); },
      icon: Calendar,
      color: '#7c3aed'
    },
    {
      id: 'device',
      title: 'ESP32 Connectivity & Offline Alerts',
      desc: 'Immediate notifications when the microcontroller drops offline or loses Wi-Fi connection.',
      enabled: devAlerts,
      toggle: () => { setDevAlerts(!devAlerts); setIsTouched(true); },
      icon: Cpu,
      color: '#0891b2'
    },
    {
      id: 'sensor',
      title: 'Hardware Sensor Failure Alerts',
      desc: 'Flags when DHT22, MQ-135, or BH1750 probe wiring produces unavailable or corrupted telemetry.',
      enabled: sensorAlerts,
      toggle: () => { setSensorAlerts(!sensorAlerts); setIsTouched(true); },
      icon: Sliders,
      color: '#d97706'
    }
  ];

  return (
    <div className="settings-panel">
      <div className="settings-panel-header">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Alert Subscriptions & Rules
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Control which microclimate and equipment conditions trigger active incident notices.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {alertCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                style={{
                  padding: '1.15rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        backgroundColor: `${cat.color}15`,
                        color: cat.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {cat.title}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={cat.toggle}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: cat.enabled ? 'var(--primary-color, #1b4d2e)' : 'var(--text-secondary)',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    aria-label={`Toggle ${cat.title}`}
                  >
                    {cat.enabled ? (
                      <ToggleRight size={28} />
                    ) : (
                      <ToggleLeft size={28} />
                    )}
                  </button>
                </div>

                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {cat.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="submit"
            disabled={!isTouched || isSaving}
            className="btn btn-primary"
            style={{
              padding: '0.6rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.86rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              opacity: !isTouched || isSaving ? 0.65 : 1
            }}
          >
            {isSaving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={16} />}
            Save Alert Subscriptions
          </button>
        </div>
      </form>
    </div>
  );
}
