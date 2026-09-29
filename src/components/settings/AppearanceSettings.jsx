import React, { useState } from 'react';
import {
  Palette,
  Sun,
  Moon,
  Sparkles,
  Check,
  RotateCcw,
  Layout,
  Type
} from 'lucide-react';
import { THEME_OPTIONS, ACCENT_OPTIONS } from '../../context/AppearanceContext';

export function AppearanceSettings({
  currentTheme,
  currentAccent,
  cardStyle,
  fontSize,
  onThemeChange,
  onAccentChange,
  onCardStyleChange,
  onFontSizeChange,
  onResetDefaults,
  onSave,
  isSaving
}) {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme || 'forest');
  const [selectedAccent, setSelectedAccent] = useState(currentAccent || 'green');
  const [selectedCardStyle, setSelectedCardStyle] = useState(cardStyle || 'rounded');
  const [selectedFontSize, setSelectedFontSize] = useState(fontSize || 'medium');
  const [isTouched, setIsTouched] = useState(false);

  const handleSelectTheme = (themeId) => {
    setSelectedTheme(themeId);
    onThemeChange(themeId);
    setIsTouched(true);
  };

  const handleSelectAccent = (accentId) => {
    setSelectedAccent(accentId);
    onAccentChange(accentId);
    setIsTouched(true);
  };

  const handleCardStyle = (style) => {
    setSelectedCardStyle(style);
    onCardStyleChange(style);
    setIsTouched(true);
  };

  const handleFontSize = (size) => {
    setSelectedFontSize(size);
    onFontSizeChange(size);
    setIsTouched(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      theme: selectedTheme,
      accent: selectedAccent,
      card_style: selectedCardStyle,
      font_size: selectedFontSize
    });
    setIsTouched(false);
  };

  return (
    <div className="settings-panel">
      <div className="settings-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Appearance & Visual Identity
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Customize system theme palettes, typography scale, and telemetry card styling.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            onResetDefaults();
            setSelectedTheme('forest');
            setSelectedAccent('green');
            setSelectedCardStyle('rounded');
            setSelectedFontSize('medium');
            setIsTouched(true);
          }}
          className="btn btn-secondary"
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <RotateCcw size={14} /> Reset Defaults
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.25rem' }}>
        {/* Theme Cards */}
        <div>
          <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
            Brand Themes
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {THEME_OPTIONS.map((theme) => {
              const isSelected = selectedTheme === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id)}
                  style={{
                    padding: '1.15rem',
                    borderRadius: '12px',
                    border: isSelected
                      ? '2px solid var(--primary-color, #1b4d2e)'
                      : '1px solid var(--border-color)',
                    background: theme.surface,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 4px 14px rgba(27, 77, 46, 0.1)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: theme.primary,
                          border: '2px solid #ffffff'
                        }}
                      />
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: theme.id === 'night-monitor' ? '#f8fafc' : '#0f172a' }}>
                        {theme.name}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '999px',
                        background: `${theme.primary}20`,
                        color: theme.primary
                      }}
                    >
                      {theme.badge}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.78rem', color: theme.id === 'night-monitor' ? '#94a3b8' : '#64748b', lineHeight: 1.4 }}>
                    {theme.description}
                  </p>

                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                    <div style={{ height: 6, flex: 1, borderRadius: 3, background: theme.primary }} />
                    <div style={{ height: 6, flex: 1, borderRadius: 3, background: theme.secondary }} />
                    <div style={{ height: 6, flex: 1, borderRadius: 3, background: theme.bg, border: '1px solid #cbd5e1' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Accent Colors */}
        <div>
          <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.65rem' }}>
            Accent Highlights
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {ACCENT_OPTIONS.map((acc) => {
              const isSelected = selectedAccent === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleSelectAccent(acc.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    border: isSelected ? `2px solid ${acc.color}` : '1px solid var(--border-color)',
                    background: isSelected ? `${acc.color}15` : 'var(--bg-surface)',
                    color: isSelected ? acc.color : 'var(--text-main)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: acc.color }} />
                  {acc.name}
                  {isSelected && <Check size={14} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Style & Font Scale */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Card Corner Styling
            </label>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['rounded', 'sharp'].map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => handleCardStyle(style)}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.75rem',
                    borderRadius: style === 'rounded' ? '8px' : '2px',
                    border: selectedCardStyle === style ? '1px solid var(--primary-color, #1b4d2e)' : '1px solid var(--border-color)',
                    background: selectedCardStyle === style ? 'rgba(27, 77, 46, 0.1)' : 'var(--bg-surface)',
                    color: selectedCardStyle === style ? 'var(--primary-color, #1b4d2e)' : 'var(--text-main)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Base Font Scale
            </label>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['small', 'medium', 'large'].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleFontSize(size)}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    border: selectedFontSize === size ? '1px solid var(--primary-color, #1b4d2e)' : '1px solid var(--border-color)',
                    background: selectedFontSize === size ? 'rgba(27, 77, 46, 0.1)' : 'var(--bg-surface)',
                    color: selectedFontSize === size ? 'var(--primary-color, #1b4d2e)' : 'var(--text-main)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
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
            Save Appearance Settings
          </button>
        </div>
      </form>
    </div>
  );
}
