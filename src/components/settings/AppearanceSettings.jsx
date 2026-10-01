import React, { useState, useEffect } from 'react';
import {
  Check,
  RotateCcw,
  Sparkles,
  Circle,
  CheckCircle2
} from 'lucide-react';
import { THEME_OPTIONS, ACCENT_OPTIONS, normalizeTheme } from '../../context/AppearanceContext';
import { ThemeToggle } from '../ThemeToggle';

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
  const [selectedTheme, setSelectedTheme] = useState(() => normalizeTheme(currentTheme || 'light'));
  const [selectedAccent, setSelectedAccent] = useState(currentAccent || 'green');
  const [selectedCardStyle, setSelectedCardStyle] = useState(cardStyle || 'rounded');
  const [selectedFontSize, setSelectedFontSize] = useState(fontSize || 'medium');
  const [isTouched, setIsTouched] = useState(false);

  // Synchronize when currentTheme changes externally
  useEffect(() => {
    if (currentTheme) {
      setSelectedTheme(normalizeTheme(currentTheme));
    }
  }, [currentTheme]);

  useEffect(() => {
    if (currentAccent) setSelectedAccent(currentAccent);
  }, [currentAccent]);

  useEffect(() => {
    if (cardStyle) setSelectedCardStyle(cardStyle);
  }, [cardStyle]);

  useEffect(() => {
    if (fontSize) setSelectedFontSize(fontSize);
  }, [fontSize]);

  const handleSelectTheme = (themeId) => {
    const valid = normalizeTheme(themeId);
    setSelectedTheme(valid);
    onThemeChange(valid);
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
      <div
        className="settings-panel-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
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
            setSelectedTheme('light');
            setSelectedAccent('green');
            setSelectedCardStyle('rounded');
            setSelectedFontSize('medium');
            setIsTouched(false);
          }}
          className="btn btn-secondary"
          style={{
            padding: '0.45rem 0.85rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <RotateCcw size={14} /> Reset Defaults
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.25rem' }}>
        {/* Visual Theme Section with Single Compact Theme Toggle Button */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.88rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              marginBottom: '0.4rem'
            }}
          >
            Visual Theme
          </label>
          <p style={{ margin: '0 0 0.85rem', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
            Switch between Light and Night Monitor (Dark) telemetry modes.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <ThemeToggle
              onToggle={(newTheme) => {
                setSelectedTheme(newTheme);
                onThemeChange(newTheme);
                setIsTouched(true);
              }}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Current Theme: <strong style={{ color: 'var(--text-main)' }}>{selectedTheme === 'dark' ? 'Night Monitor / Dark' : 'Light'}</strong>
            </span>
          </div>
        </div>

        {/* Accent Colors */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.86rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              marginBottom: '0.65rem'
            }}
          >
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
                    gap: '0.45rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    border: isSelected ? `2px solid ${acc.color}` : '1px solid var(--border-light, #e2e8f0)',
                    backgroundColor: isSelected ? `${acc.color}15` : 'var(--bg-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: acc.color,
                      display: 'inline-block'
                    }}
                  />
                  <span>{acc.name}</span>
                  {isSelected && <Check size={14} color={acc.color} />}
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
                    border: selectedCardStyle === style ? '1px solid var(--primary, #10b981)' : '1px solid var(--border-light, #e2e8f0)',
                    backgroundColor: selectedCardStyle === style ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card)',
                    color: selectedCardStyle === style ? 'var(--primary, #10b981)' : 'var(--text-main)',
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
                    border: selectedFontSize === size ? '1px solid var(--primary, #10b981)' : '1px solid var(--border-light, #e2e8f0)',
                    backgroundColor: selectedFontSize === size ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card)',
                    color: selectedFontSize === size ? 'var(--primary, #10b981)' : 'var(--text-main)',
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
