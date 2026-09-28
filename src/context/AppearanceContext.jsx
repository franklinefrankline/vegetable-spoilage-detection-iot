import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppearanceContext = createContext(null);

const STORAGE_KEY = 'vegsense_appearance_settings';

export const THEME_OPTIONS = [
  {
    id: 'forest',
    name: 'FOREST',
    subtitle: 'Organic',
    description: 'Premium light agriculture-tech interface with warm cream tones, deep forest & olive greens, soft mint accents, and clean modern typography.',
    primary: '#1b4d2e',
    secondary: '#365314',
    surface: '#ffffff',
    bg: '#faf7f0',
    badge: 'Organic',
    mode: 'light'
  },
  {
    id: 'night-monitor',
    name: 'NIGHT MONITOR',
    subtitle: 'Dark Pro',
    description: 'Professional dark IoT monitoring interface with deep charcoal navy, emerald & cyan telemetry highlights, and layered dark monitoring cards.',
    primary: '#10b981',
    secondary: '#06b6d4',
    surface: '#111a26',
    bg: '#0b1118',
    badge: 'Dark Pro',
    mode: 'dark'
  }
];

export const ACCENT_OPTIONS = [
  { id: 'green', name: 'Green', color: '#16a34a' },
  { id: 'teal', name: 'Teal', color: '#0d9488' },
  { id: 'blue', name: 'Blue', color: '#0284c7' },
  { id: 'purple', name: 'Purple', color: '#7c3aed' },
  { id: 'orange', name: 'Orange', color: '#ea580c' }
];

const DEFAULT_SETTINGS = {
  theme: 'forest',
  accent: 'green',
  layout: 'comfortable',
  sidebarMode: 'expanded',
  animation: 'subtle',
  cardStyle: 'rounded',
  fontSize: 'medium'
};

export function AppearanceProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Normalize legacy or other theme IDs to either forest or night-monitor
        let normalizedTheme = parsed.theme;
        if (normalizedTheme === 'dark') {
          normalizedTheme = 'night-monitor';
        } else if (normalizedTheme !== 'night-monitor') {
          normalizedTheme = 'forest';
        }
        return { ...DEFAULT_SETTINGS, ...parsed, theme: normalizedTheme };
      }
    } catch (e) {
      console.warn('Could not read appearance settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isQuickAppearanceOpen, setIsQuickAppearanceOpen] = useState(false);

  // Sync to document attributes
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);
    root.setAttribute('data-accent', settings.accent);
    root.setAttribute('data-layout', settings.layout);
    root.setAttribute('data-sidebar', settings.sidebarMode);
    root.setAttribute('data-card-style', settings.cardStyle);
    root.setAttribute('data-font-size', settings.fontSize);
    root.setAttribute('data-animation', settings.animation);

    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not save appearance settings:', e);
    }
  }, [settings]);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setTheme = useCallback((theme) => {
    // Ensure only valid themes are applied
    const valid = theme === 'night-monitor' ? 'night-monitor' : 'forest';
    updateSetting('theme', valid);
  }, [updateSetting]);

  const setAccent = useCallback((accent) => updateSetting('accent', accent), [updateSetting]);
  const setLayout = useCallback((layout) => updateSetting('layout', layout), [updateSetting]);
  const setSidebarMode = useCallback((mode) => updateSetting('sidebarMode', mode), [updateSetting]);
  const setAnimation = useCallback((anim) => updateSetting('animation', anim), [updateSetting]);
  const setCardStyle = useCallback((style) => updateSetting('cardStyle', style), [updateSetting]);
  const setFontSize = useCallback((size) => updateSetting('fontSize', size), [updateSetting]);

  const resetToDefault = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen((prev) => !prev);
  }, []);

  const toggleQuickAppearance = useCallback(() => {
    setIsQuickAppearanceOpen((prev) => !prev);
  }, []);

  const toggleMode = useCallback(() => {
    setTheme(settings.theme === 'night-monitor' ? 'forest' : 'night-monitor');
  }, [settings.theme, setTheme]);

  const value = {
    settings,
    setTheme,
    toggleMode,
    setAccent,
    setLayout,
    setSidebarMode,
    setAnimation,
    setCardStyle,
    setFontSize,
    resetToDefault,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    toggleMobileSidebar,
    isQuickAppearanceOpen,
    setIsQuickAppearanceOpen,
    toggleQuickAppearance
  };

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
}
