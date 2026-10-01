import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAppearanceSettings, updateAppearanceSettings } from '../services/settingsService';

const AppearanceContext = createContext(null);

const STORAGE_KEY = 'vegsense_appearance_settings';

export const THEME_OPTIONS = [
  {
    id: 'light',
    name: 'Light',
    subtitle: 'Enterprise Clean',
    description: 'Crisp light enterprise interface with cool slate borders, balanced whites, emerald accents, and high-clarity typography.',
    primary: '#166534',
    secondary: '#15803d',
    surface: '#ffffff',
    bg: '#f7f8f5',
    badge: 'Light',
    mode: 'light'
  },
  {
    id: 'dark',
    name: 'Night Monitor',
    subtitle: 'Dark / Night Monitor',
    description: 'Deep navy charcoal canvas, elevated cards, emerald telemetry signals, cyan highlights, and ultra-high contrast for low-light monitoring.',
    primary: '#10b981',
    secondary: '#22d3ee',
    surface: '#172033',
    bg: '#0b1220',
    badge: 'Night Monitor',
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

export const DEFAULT_SETTINGS = {
  theme: 'light',
  accent: 'green',
  layout: 'comfortable',
  sidebarMode: 'expanded',
  animation: 'subtle',
  cardStyle: 'rounded',
  fontSize: 'medium'
};

export function normalizeTheme(th) {
  if (!th) return 'light';
  const lower = String(th).toLowerCase().trim();
  if (lower === 'dark' || lower === 'night-monitor' || lower === 'night_monitor' || lower === 'night') {
    return 'dark';
  }
  if (lower === 'light') {
    return 'light';
  }
  // Any legacy or unrecognized value (e.g. 'forest', 'organic') strictly migrates to 'light'
  return 'light';
}

export function AppearanceProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const normalizedTheme = normalizeTheme(parsed.theme);
        return { ...DEFAULT_SETTINGS, ...parsed, theme: normalizedTheme };
      }
    } catch (e) {
      console.warn('Could not read appearance settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isQuickAppearanceOpen, setIsQuickAppearanceOpen] = useState(false);

  // Sync to document attributes immediately
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);
    root.setAttribute('data-accent', settings.accent);
    root.setAttribute('data-layout', settings.layout);
    root.setAttribute('data-sidebar', settings.sidebarMode);
    root.setAttribute('data-card-style', settings.cardStyle);
    root.setAttribute('data-font-size', settings.fontSize);
    root.setAttribute('data-animation', settings.animation);

    // Also keep localStorage updated
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Could not save appearance settings:', e);
    }
  }, [settings]);

  // Load saved appearance settings from backend on mount if user is authenticated
  useEffect(() => {
    const token =
      localStorage.getItem('veg_storage_auth_token') ||
      sessionStorage.getItem('veg_storage_auth_token');

    if (token) {
      getAppearanceSettings(token)
        .then((res) => {
          if (res?.success && res.appearance?.theme) {
            const remoteTheme = normalizeTheme(res.appearance.theme);
            setSettings((prev) => {
              if (prev.theme !== remoteTheme) {
                return {
                  ...prev,
                  theme: remoteTheme,
                  accent: res.appearance.accent || prev.accent,
                  cardStyle: res.appearance.card_style || prev.cardStyle,
                  fontSize: res.appearance.font_size || prev.fontSize,
                  animation: res.appearance.animation || prev.animation
                };
              }
              return prev;
            });
          }
        })
        .catch((err) => {
          console.warn('Initial appearance load fallback to local/default:', err);
        });
    }
  }, []);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setTheme = useCallback((themeInput) => {
    const valid = normalizeTheme(themeInput);

    // Apply immediately to HTML root element
    document.documentElement.setAttribute('data-theme', valid);

    // Update state
    setSettings((prev) => {
      const next = { ...prev, theme: valid };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // Asynchronously persist to backend database
    const token =
      localStorage.getItem('veg_storage_auth_token') ||
      sessionStorage.getItem('veg_storage_auth_token');

    if (token) {
      updateAppearanceSettings({ theme: valid }, token).catch((err) => {
        console.warn('Backend appearance theme persist notice:', err);
      });
    }
  }, []);

  const setAccent = useCallback((accent) => {
    updateSetting('accent', accent);
    const token =
      localStorage.getItem('veg_storage_auth_token') ||
      sessionStorage.getItem('veg_storage_auth_token');
    if (token) {
      updateAppearanceSettings({ accent }, token).catch(() => {});
    }
  }, [updateSetting]);

  const setLayout = useCallback((layout) => updateSetting('layout', layout), [updateSetting]);
  const setSidebarMode = useCallback((mode) => updateSetting('sidebarMode', mode), [updateSetting]);
  const setAnimation = useCallback((anim) => updateSetting('animation', anim), [updateSetting]);
  const setCardStyle = useCallback((style) => updateSetting('cardStyle', style), [updateSetting]);
  const setFontSize = useCallback((size) => updateSetting('fontSize', size), [updateSetting]);

  const resetToDefault = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    document.documentElement.setAttribute('data-theme', DEFAULT_SETTINGS.theme);
    const token =
      localStorage.getItem('veg_storage_auth_token') ||
      sessionStorage.getItem('veg_storage_auth_token');
    if (token) {
      updateAppearanceSettings({ theme: DEFAULT_SETTINGS.theme }, token).catch(() => {});
    }
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen((prev) => !prev);
  }, []);

  const toggleQuickAppearance = useCallback(() => {
    setIsQuickAppearanceOpen((prev) => !prev);
  }, []);

  const isDark = settings.theme === 'dark';

  const toggleMode = useCallback(() => {
    setTheme(settings.theme === 'dark' ? 'light' : 'dark');
  }, [settings.theme, setTheme]);

  const value = {
    theme: settings.theme,
    isDark,
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

// Global alias for compatibility
export const useTheme = useAppearance;
