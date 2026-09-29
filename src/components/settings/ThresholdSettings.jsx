import React, { useState, useEffect } from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Check,
  AlertCircle,
  Sliders
} from 'lucide-react';

export function ThresholdSettings({ settings, onSave, isSaving }) {
  const [tempWarn, setTempWarn] = useState(settings?.temperature_warning_threshold ?? 30.0);
  const [tempHigh, setTempHigh] = useState(settings?.temperature_high_threshold ?? 35.0);
  const [humLow, setHumLow] = useState(settings?.humidity_low_threshold ?? 50.0);
  const [humHigh, setHumHigh] = useState(settings?.humidity_high_threshold ?? 80.0);
  const [gasElevated, setGasElevated] = useState(settings?.gas_elevated_threshold ?? 500.0);
  const [gasHigh, setGasHigh] = useState(settings?.gas_high_threshold ?? 700.0);
  const [lightLow, setLightLow] = useState(settings?.light_low_threshold ?? 100.0);
  const [lightHigh, setLightHigh] = useState(settings?.light_high_threshold ?? 500.0);
  const [validationError, setValidationError] = useState('');
  const [isTouched, setIsTouched] = useState(false);

  useEffect(() => {
    // Validate live
    if (Number(tempWarn) >= Number(tempHigh)) {
      setValidationError('Temperature warning threshold must be less than high threshold.');
      return;
    }
    if (Number(humLow) >= Number(humHigh)) {
      setValidationError('Humidity low threshold must be less than high threshold.');
      return;
    }
    if (Number(gasElevated) >= Number(gasHigh)) {
      setValidationError('Gas/VOC elevated threshold must be less than high threshold.');
      return;
    }
    if (Number(lightLow) >= Number(lightHigh)) {
      setValidationError('Light low threshold must be less than high threshold.');
      return;
    }
    setValidationError('');
  }, [tempWarn, tempHigh, humLow, humHigh, gasElevated, gasHigh, lightLow, lightHigh]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validationError) return;

    onSave({
      temperature_warning_threshold: Number(tempWarn),
      temperature_high_threshold: Number(tempHigh),
      humidity_low_threshold: Number(humLow),
      humidity_high_threshold: Number(humHigh),
      gas_elevated_threshold: Number(gasElevated),
      gas_high_threshold: Number(gasHigh),
      light_low_threshold: Number(lightLow),
      light_high_threshold: Number(lightHigh)
    });
    setIsTouched(false);
  };

  return (
    <div className="settings-panel">
      <div className="settings-panel-header">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Storage Microclimate Thresholds
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Configure atmospheric boundaries that trigger warnings, incident alerts, and risk shifts.
          </p>
        </div>
      </div>

      {validationError && (
        <div
          style={{
            marginTop: '1rem',
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
          <AlertCircle size={16} /> {validationError}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
        {/* Temperature Thresholds */}
        <div
          style={{
            padding: '1.15rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Thermometer size={18} style={{ color: '#ea580c' }} />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Temperature Boundaries (°C)
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Warning Threshold (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={tempWarn}
                onChange={(e) => { setTempWarn(e.target.value); setIsTouched(true); }}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-page)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem'
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Default: 30°C (30–35°C Warning)
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Critical High Threshold (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={tempHigh}
                onChange={(e) => { setTempHigh(e.target.value); setIsTouched(true); }}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-page)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem'
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Default: 35°C (&gt;35°C High)
              </span>
            </div>
          </div>
        </div>

        {/* Humidity Thresholds */}
        <div
          style={{
            padding: '1.15rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Droplets size={18} style={{ color: '#0284c7' }} />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Relative Humidity Boundaries (%)
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Low Humidity Floor (%)
              </label>
              <input
                type="number"
                value={humLow}
                onChange={(e) => { setHumLow(e.target.value); setIsTouched(true); }}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-page)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem'
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Default: 50% (&lt;50% Low)
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                High Humidity Ceiling (%)
              </label>
              <input
                type="number"
                value={humHigh}
                onChange={(e) => { setHumHigh(e.target.value); setIsTouched(true); }}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-page)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem'
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Default: 80% (&gt;80% High)
              </span>
            </div>
          </div>
        </div>

        {/* Gas / VOC Thresholds */}
        <div
          style={{
            padding: '1.15rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Wind size={18} style={{ color: '#16a34a' }} />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Gas / VOC Indicator Thresholds
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Elevated Indicator Level
              </label>
              <input
                type="number"
                value={gasElevated}
                onChange={(e) => { setGasElevated(e.target.value); setIsTouched(true); }}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-page)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem'
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Default: 500 (500–700 Elevated)
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                High Indicator Level
              </label>
              <input
                type="number"
                value={gasHigh}
                onChange={(e) => { setGasHigh(e.target.value); setIsTouched(true); }}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-page)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem'
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Default: 700 (&gt;700 High Risk)
              </span>
            </div>
          </div>
        </div>

        {/* Light Lux Thresholds */}
        <div
          style={{
            padding: '1.15rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Sun size={18} style={{ color: '#ca8a04' }} />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Photometric Light Boundaries (lux)
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Low Light Threshold (lux)
              </label>
              <input
                type="number"
                value={lightLow}
                onChange={(e) => { setLightLow(e.target.value); setIsTouched(true); }}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-page)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem'
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Default: 100 (&lt;100 LOW LIGHT)
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                High Light Threshold (lux)
              </label>
              <input
                type="number"
                value={lightHigh}
                onChange={(e) => { setLightHigh(e.target.value); setIsTouched(true); }}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-page)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem'
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Default: 500 (&gt;500 HIGH LIGHT)
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="submit"
            disabled={!isTouched || Boolean(validationError) || isSaving}
            className="btn btn-primary"
            style={{
              padding: '0.6rem 1.25rem',
              fontWeight: 600,
              fontSize: '0.86rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              opacity: !isTouched || Boolean(validationError) || isSaving ? 0.65 : 1
            }}
          >
            {isSaving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={16} />}
            Save Storage Thresholds
          </button>
        </div>
      </form>
    </div>
  );
}
