import React, { useState, useEffect } from 'react';
import {
  Activity,
  Check,
  AlertCircle,
  HelpCircle,
  Percent,
  Sliders,
  Scale
} from 'lucide-react';

export function SpoilageSettings({ settings, onSave, isSaving }) {
  // 5 Spoilage Risk factor weights
  const [wTemp, setWTemp] = useState(settings?.weight_temperature ?? 30.0);
  const [wHum, setWHum] = useState(settings?.weight_humidity ?? 25.0);
  const [wGas, setWGas] = useState(settings?.weight_gas ?? 25.0);
  const [wLight, setWLight] = useState(settings?.weight_light ?? 10.0);
  const [wAge, setWAge] = useState(settings?.weight_age ?? 10.0);

  // Spoilage classification boundaries
  const [spoilWarn, setSpoilWarn] = useState(settings?.spoilage_warning_threshold ?? 31.0);
  const [spoilRisk, setSpoilRisk] = useState(settings?.spoilage_risk_threshold ?? 61.0);
  const [spoilCrit, setSpoilCrit] = useState(settings?.spoilage_critical_threshold ?? 81.0);

  const [weightSum, setWeightSum] = useState(100);
  const [validationError, setValidationError] = useState('');
  const [isTouched, setIsTouched] = useState(false);

  useEffect(() => {
    const sum = Number(wTemp) + Number(wHum) + Number(wGas) + Number(wLight) + Number(wAge);
    setWeightSum(Math.round(sum * 10) / 10);

    if (Math.abs(sum - 100.0) > 0.5) {
      setValidationError(`Risk weights must total 100%. Current sum: ${Math.round(sum)}%.`);
      return;
    }

    if (Number(spoilWarn) >= Number(spoilRisk) || Number(spoilRisk) >= Number(spoilCrit)) {
      setValidationError('Classification thresholds must follow: Warning < Spoilage Risk < Critical.');
      return;
    }

    setValidationError('');
  }, [wTemp, wHum, wGas, wLight, wAge, spoilWarn, spoilRisk, spoilCrit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validationError) return;

    onSave({
      weight_temperature: Number(wTemp),
      weight_humidity: Number(wHum),
      weight_gas: Number(wGas),
      weight_light: Number(wLight),
      weight_age: Number(wAge),
      spoilage_warning_threshold: Number(spoilWarn),
      spoilage_risk_threshold: Number(spoilRisk),
      spoilage_critical_threshold: Number(spoilCrit)
    });
    setIsTouched(false);
  };

  const handleResetDefaults = () => {
    setWTemp(30);
    setWHum(25);
    setWGas(25);
    setWLight(10);
    setWAge(10);
    setSpoilWarn(31);
    setSpoilRisk(61);
    setSpoilCrit(81);
    setIsTouched(true);
  };

  return (
    <div className="settings-panel">
      <div className="settings-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Estimated Spoilage Risk Engine
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Weights and mathematical sensitivity configuration for the centralized Part 6 risk algorithm.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="btn btn-secondary"
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 600 }}
        >
          Reset Model Defaults
        </button>
      </div>

      {validationError ? (
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
      ) : (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            background: 'rgba(22, 163, 74, 0.1)',
            color: '#16a34a',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Check size={16} /> Risk factor weights total 100.0% perfectly.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
        {/* Factor Weights Panel */}
        <div
          style={{
            padding: '1.15rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Scale size={18} style={{ color: 'var(--primary-color, #1b4d2e)' }} />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Multi-Factor Risk Weights
              </h4>
            </div>

            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                padding: '0.2rem 0.65rem',
                borderRadius: '6px',
                background: weightSum === 100 ? 'rgba(22, 163, 74, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: weightSum === 100 ? '#15803d' : '#dc2626'
              }}
            >
              Total Weight: {weightSum}%
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Temperature Weight */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Temperature Weight</span>
                <span style={{ fontWeight: 700, color: '#ea580c' }}>{wTemp}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={wTemp}
                onChange={(e) => { setWTemp(Number(e.target.value)); setIsTouched(true); }}
                style={{ width: '100%', accentColor: '#ea580c' }}
              />
            </div>

            {/* Humidity Weight */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Relative Humidity Weight</span>
                <span style={{ fontWeight: 700, color: '#0284c7' }}>{wHum}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={wHum}
                onChange={(e) => { setWHum(Number(e.target.value)); setIsTouched(true); }}
                style={{ width: '100%', accentColor: '#0284c7' }}
              />
            </div>

            {/* Gas/VOC Weight */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Gas / VOC Indicator Weight</span>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>{wGas}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={wGas}
                onChange={(e) => { setWGas(Number(e.target.value)); setIsTouched(true); }}
                style={{ width: '100%', accentColor: '#16a34a' }}
              />
            </div>

            {/* Light Weight */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Light Illumination Weight</span>
                <span style={{ fontWeight: 700, color: '#ca8a04' }}>{wLight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={wLight}
                onChange={(e) => { setWLight(Number(e.target.value)); setIsTouched(true); }}
                style={{ width: '100%', accentColor: '#ca8a04' }}
              />
            </div>

            {/* Storage Age Weight */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Storage Shelf Age Weight</span>
                <span style={{ fontWeight: 700, color: '#7c3aed' }}>{wAge}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={wAge}
                onChange={(e) => { setWAge(Number(e.target.value)); setIsTouched(true); }}
                style={{ width: '100%', accentColor: '#7c3aed' }}
              />
            </div>
          </div>
        </div>

        {/* Classification Boundaries Panel */}
        <div
          style={{
            padding: '1.15rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Activity size={18} style={{ color: 'var(--primary-color, #1b4d2e)' }} />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Risk Classification Ranges (0–100)
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Warning Threshold (Fresh ceiling)
              </label>
              <input
                type="number"
                value={spoilWarn}
                onChange={(e) => { setSpoilWarn(e.target.value); setIsTouched(true); }}
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
              <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>
                0 to {spoilWarn - 1}: FRESH
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Spoilage Risk Ceiling
              </label>
              <input
                type="number"
                value={spoilRisk}
                onChange={(e) => { setSpoilRisk(e.target.value); setIsTouched(true); }}
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
              <span style={{ fontSize: '0.72rem', color: '#ca8a04', fontWeight: 600 }}>
                {spoilWarn} to {spoilRisk - 1}: WARNING
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Critical Risk Floor
              </label>
              <input
                type="number"
                value={spoilCrit}
                onChange={(e) => { setSpoilCrit(e.target.value); setIsTouched(true); }}
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
              <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600 }}>
                {spoilCrit} to 100: CRITICAL
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
            Save Spoilage Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
