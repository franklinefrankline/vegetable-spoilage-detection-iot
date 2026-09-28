import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppearanceContext = createContext(null);

const STORAGE_KEY = 'vegsense_appearance_settings';

const DEFAULT_SETTINGS = {
  theme: 'fresh-green',
  accent: 'green',
  layout: 'comfortable',
  sidebarMode: 'expanded',
  animation: 'subtle',
  cardStyle: 'rounded',
  fontSize: 'medium'
};

export const THEME_OPTIONS = [
  {
    id: 'fresh-green',
    name: 'Fresh Green',
    description: 'Natural agriculture green with soft mint cards and crisp light background.',
    primary: '#16a34a',
    secondary: '#14532d',
    surface: '#ffffff',
    bg: '#f8fafc',
    badge: 'Default'
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Deep forest green with warm cream accents and organic farming feel.',
    primary: '#15803d',
    secondary: '#052e16',
    surface: '#ffffff',
    bg: '#fcfdfa',
    badge: 'Popular'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool teal and cyan accents with high-tech IoT device atmosphere.',
    primary: '#0d9488',
    secondary: '#115e59',
    surface: '#ffffff',
    bg: '#f0fdfa',
    badge: 'Tech'
  },
  {
    id: 'earth',
    name: 'Earth',
    description: 'Warm olive, amber, and terracotta tones reflecting fertile soil.',
    primary: '#65a30d',
    secondary: '#365314',
    surface: '#ffffff',
    bg: '#fbfbf7',
    badge: 'Natural'
  },
  {
    id: 'lavender',
    name: 'Lavender',
    description: 'Refined modern purple and lavender palette with clean SaaS aesthetics.',
    primary: '#7c3aed',
    secondary: '#4c1d95',
    surface: '#ffffff',
    bg: '#faf5ff',
    badge: 'Modern'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Monochromatic slate and subtle green focus with distraction-free layout.',
    primary: '#334155',
    secondary: '#0f172a',
    surface: '#ffffff',
    bg: '#f8fafc',
    badge: 'Clean'
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Deep charcoal background with high-contrast emerald and cyan telemetry glow.',
    primary: '#22c55e',
    secondary: '#15803d',
    surface: '#1e293b',
    bg: '#0f172a',
    badge: 'Night'
  }
];

export const ACCENT_OPTIONS = [
  { id: 'green', name: 'Green', color: '#16a34a' },
  { id: 'teal', name: 'Teal', color: '#0d9488' },
  { id: 'blue', name: 'Blue', color: '#0284c7' },
  { id: 'purple', name: 'Purple', color: '#7c3aed' },
  { id: 'orange', name: 'Orange', color: '#ea580c' }
];

export function AppearanceProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
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

  const setTheme = useCallback((theme) => updateSetting('theme', theme), [updateSetting]);
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

  const value = {
    settings,
    setTheme,
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
