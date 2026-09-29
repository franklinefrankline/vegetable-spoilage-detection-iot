import React, { useState } from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Check,
  AlertCircle,
  HelpCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export function SensorSettings({ settings, onSave, isSaving }) {
  const [tempEnabled, setTempEnabled] = useState(Boolean(settings?.sensor_temp_enabled ?? 1));
  const [humEnabled, setHumEnabled] = useState(Boolean(settings?.sensor_hum_enabled ?? 1));
  const [gasEnabled, setGasEnabled] = useState(Boolean(settings?.sensor_gas_enabled ?? 1));
  const [lightEnabled, setLightEnabled] = useState(Boolean(settings?.sensor_light_enabled ?? 1));
  const [lightType, setLightType] = useState(settings?.light_sensor_type || 'BH1750');
  const [isTouched, setIsTouched] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      sensor_temp_enabled: tempEnabled ? 1 : 0,
      sensor_hum_enabled: humEnabled ? 1 : 0,
      sensor_gas_enabled: gasEnabled ? 1 : 0,
      sensor_light_enabled: lightEnabled ? 1 : 0,
      light_sensor_type: lightType
    });
    setIsTouched(false);
  };

  const sensors = [
    {
      id: 'temp',
      name: 'Temperature Sensor',
      model: 'DHT22 / AM2302',
      enabled: tempEnabled,
      toggle: () => { setTempEnabled(!tempEnabled); setIsTouched(true); },
      icon: Thermometer,
      color: '#ea580c',
      desc: 'High-precision digital temperature sensor providing ambient readings with 0.1°C resolution.'
    },
    {
      id: 'hum',
      name: 'Humidity Sensor',
      model: 'DHT22 Capacitive',
      enabled: humEnabled,
      toggle: () => { setHumEnabled(!humEnabled); setIsTouched(true); },
      icon: Droplets,
      color: '#0284c7',
      desc: 'Relative humidity monitoring preventing moisture accumulation, mold growth, and premature desiccation.'
    },
    {
      id: 'gas',
      name: 'Gas / VOC Indicator',
      model: 'MQ-135 Semi-Conductor',
      enabled: gasEnabled,
      toggle: () => { setGasEnabled(!gasEnabled); setIsTouched(true); },
      icon: Wind,
      color: '#16a34a',
      desc: 'Environmental volatile organic compound and organic decomposition indicator.',
      disclaimer: 'MQ-135 readings should be interpreted as an environmental indicator unless the sensor has been calibrated for the intended application.'
    },
    {
      id: 'light',
      name: 'Light / Luminescence Sensor',
      model: lightType,
      enabled: lightEnabled,
      toggle: () => { setLightEnabled(!lightEnabled); setIsTouched(true); },
      icon: Sun,
      color: '#ca8a04',
      desc: 'Photometric ambient illumination sensor detecting chlorophyll degradation and greening risks.',
      hasTypeSelect: true
    }
  ];

  return (
    <div className="settings-panel">
      <div className="settings-panel-header">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Sensor Configuration
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Enable or configure individual hardware sensor channels and physical probe models.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {sensors.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                style={{
                  padding: '1.15rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '8px',
                        backgroundColor: `${s.color}15`,
                        color: s.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {s.name}
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {s.model}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={s.toggle}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: s.enabled ? 'var(--primary-color, #1b4d2e)' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                    aria-label={`Toggle ${s.name}`}
                  >
                    {s.enabled ? (
                      <ToggleRight size={28} />
                    ) : (
                      <ToggleLeft size={28} />
                    )}
                  </button>
                </div>

                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {s.desc}
                </p>

                {s.disclaimer && (
                  <div
                    style={{
                      padding: '0.5rem 0.65rem',
                      borderRadius: '6px',
                      background: 'rgba(234, 179, 8, 0.08)',
                      border: '1px solid rgba(234, 179, 8, 0.25)',
                      fontSize: '0.74rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.35
                    }}
                  >
                    <strong>Indicator Scope:</strong> {s.disclaimer}
                  </div>
                )}

                {s.hasTypeSelect && (
                  <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Photometric Sensor Hardware
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['BH1750', 'LDR'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => { setLightType(type); setIsTouched(true); }}
                          style={{
                            flex: 1,
                            padding: '0.35rem 0.5rem',
                            borderRadius: '6px',
                            border: lightType === type ? '1px solid var(--primary-color, #1b4d2e)' : '1px solid var(--border-color)',
                            background: lightType === type ? 'rgba(27, 77, 46, 0.1)' : 'var(--bg-page)',
                            color: lightType === type ? 'var(--primary-color, #1b4d2e)' : 'var(--text-main)',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {type} {type === 'BH1750' ? '(Digital Lux)' : '(Analog)'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
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
            Save Sensor Settings
          </button>
        </div>
      </form>
    </div>
  );
}
