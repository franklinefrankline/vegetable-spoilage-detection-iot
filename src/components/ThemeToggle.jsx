import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAppearance } from '../context/AppearanceContext';

/**
 * ThemeToggle
 * Compact, professional button switching strictly between:
 * LIGHT (Sun icon) <--> NIGHT MONITOR / DARK (Moon icon)
 */
export function ThemeToggle({ className = '', style, id = 'theme-toggle-btn', onToggle }) {
  const { theme, setTheme, toggleMode } = useAppearance();

  const isDark = theme === 'dark' || theme === 'night-monitor';

  const handleClick = (e) => {
    e.preventDefault();
    const nextTheme = isDark ? 'light' : 'dark';
    if (toggleMode) {
      toggleMode();
    } else {
      setTheme(nextTheme);
    }
    if (onToggle) {
      onToggle(nextTheme);
    }
  };

  return (
    <button
      type="button"
      id={id}
      className={`vegsense-theme-toggle-btn ${className}`.trim()}
      style={style}
      onClick={handleClick}
      title="Theme Toggle"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? (
        <Moon size={18} className="theme-toggle-icon moon" aria-hidden="true" />
      ) : (
        <Sun size={18} className="theme-toggle-icon sun" aria-hidden="true" />
      )}
      <span className="theme-toggle-text">Theme Toggle</span>
    </button>
  );
}

export default ThemeToggle;
