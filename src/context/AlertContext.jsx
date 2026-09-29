import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  getAlerts,
  getUnreadCount,
  getAlertSummary,
  markAlertRead,
  markAllAlertsRead,
  resolveAlert as apiResolveAlert,
  evaluateAlerts as apiEvaluateAlerts
} from '../services/alertService';
import { DEFAULT_ALERT_THRESHOLDS } from '../utils/alertRules';

const AlertContext = createContext(null);

const DEFAULT_PREFERENCES = {
  temperatureAlerts: true,
  humidityAlerts: true,
  gasAlerts: true,
  lightAlerts: true,
  spoilageAlerts: true,
  storageExpiryAlerts: true,
  deviceAlerts: true,
  sensorAlerts: true,
  browserNotifications: false
};

export function AlertProvider({ children }) {
  const { currentUser, isAuthenticated, token } = useAuth();

  const [alerts, setAlerts] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    unread: 0,
    critical: 0,
    high: 0,
    warning: 0,
    info: 0,
    resolved: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // User Alert Preferences & Thresholds
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('vegsense_alert_prefs');
      if (saved) return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_PREFERENCES;
  });

  const [alertThresholds, setAlertThresholds] = useState(() => {
    try {
      const saved = localStorage.getItem('vegsense_alert_thresholds');
      if (saved) return { ...DEFAULT_ALERT_THRESHOLDS, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_ALERT_THRESHOLDS;
  });

  const shownBrowserNotifIds = useRef(new Set());
  const previousStateRef = useRef({});

  // Browser Notification Trigger
  const triggerBrowserNotification = useCallback((alert) => {
    if (!preferences.browserNotifications) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    if (!alert?.id || shownBrowserNotifIds.current.has(alert.id)) return;
    shownBrowserNotifIds.current.add(alert.id);

    try {
      new Notification(`VegSense: ${alert.title || 'Storage Alert'}`, {
        body: alert.message || 'Environmental condition requires attention.',
        icon: '/favicon.ico',
        tag: alert.event_key || alert.id
      });
    } catch (e) {
      console.warn('Could not display browser notification:', e);
    }
  }, [preferences.browserNotifications]);

  // Request browser notification permission
  const requestBrowserPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPreferences((prev) => {
          const updated = { ...prev, browserNotifications: true };
          try {
            localStorage.setItem('vegsense_alert_prefs', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }
      return permission;
    } catch (e) {
      return 'denied';
    }
  }, []);

  // Fetch full alerts list with parameters
  const loadAlerts = useCallback(async (params = {}) => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAlerts({ ...params, token });
      if (data?.success) {
        setAlerts(data.alerts || []);
        // Extract active alerts
        const active = (data.alerts || []).filter((a) => a.status === 'ACTIVE');
        setActiveAlerts(active);
      }
    } catch (err) {
      console.warn('[AlertContext] Failed to load alerts:', err);
      setError('Unable to load alerts.');
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, [isAuthenticated, token]);

  // Quick refresh for summary and unread count
  const refreshSummaryAndCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [count, sumData, activeList] = await Promise.all([
        getUnreadCount(token),
        getAlertSummary(token),
        getAlerts({ status: 'active', limit: 20, token })
      ]);
      setUnreadCount(count);
      if (sumData) setSummary(sumData);
      if (activeList?.alerts) {
        setActiveAlerts(activeList.alerts);
        // Check for new critical/high alerts to notify via browser
        activeList.alerts.forEach((alt) => {
          if (alt.severity === 'CRITICAL' || alt.severity === 'HIGH') {
            triggerBrowserNotification(alt);
          }
        });
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.warn('[AlertContext] Summary sync error:', err);
    }
  }, [isAuthenticated, token, triggerBrowserNotification]);

  // Mark single alert as read
  const handleMarkAsRead = useCallback(async (alertId) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, is_read: true, read: true } : a))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await markAlertRead(alertId, token);
    refreshSummaryAndCount();
  }, [token, refreshSummaryAndCount]);

  // Mark all alerts as read
  const handleMarkAllAsRead = useCallback(async () => {
    setAlerts((prev) =>
      prev.map((a) => ({ ...a, is_read: true, read: true }))
    );
    setUnreadCount(0);
    await markAllAlertsRead(token);
    refreshSummaryAndCount();
  }, [token, refreshSummaryAndCount]);

  // Resolve alert
  const handleResolveAlert = useCallback(async (alertId) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'RESOLVED' } : a))
    );
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
    await apiResolveAlert(alertId, token);
    refreshSummaryAndCount();
  }, [token, refreshSummaryAndCount]);

  // Evaluate real-time / demo sensor readings against alert rules (Section 17, 45)
  const evaluateTelemetry = useCallback(async ({
    deviceId = 'ESP32-DEMO-001',
    sensorData = {},
    spoilageData = {},
    deviceStatus = 'connected',
    storageBatches = []
  }) => {
    if (!isAuthenticated) return;

    try {
      const evaluation = await apiEvaluateAlerts({
        deviceId,
        sensorData,
        spoilageData,
        deviceStatus,
        storageBatches,
        configuredThresholds: alertThresholds,
        previousState: previousStateRef.current,
        token
      });

      // Update previous state reference
      previousStateRef.current = {
        temperature: sensorData.temperature,
        humidity: sensorData.humidity,
        gas: sensorData.gasLevel,
        light: sensorData.lightLevel,
        spoilageRisk: spoilageData.spoilageRisk ?? sensorData.spoilageRisk,
        spoilageClassification: spoilageData.classification?.label || spoilageData.classification || sensorData.status,
        deviceStatus
      };

      if (evaluation?.generatedAlerts?.length > 0 || evaluation?.resolvedAlerts?.length > 0) {
        refreshSummaryAndCount();
        loadAlerts();
      }
    } catch (err) {
      console.warn('[AlertContext] Telemetry evaluation error:', err);
    }
  }, [isAuthenticated, token, alertThresholds, refreshSummaryAndCount, loadAlerts]);

  // Initial load and periodic polling (every 12 seconds per Section 27)
  useEffect(() => {
    if (!isAuthenticated) return;
    loadAlerts();
    refreshSummaryAndCount();

    const interval = setInterval(() => {
      refreshSummaryAndCount();
    }, 12000);

    return () => clearInterval(interval);
  }, [isAuthenticated, loadAlerts, refreshSummaryAndCount]);

  // Save preferences helper
  const updatePreferences = useCallback((newPrefs) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...newPrefs };
      try {
        localStorage.setItem('vegsense_alert_prefs', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // Save thresholds helper
  const updateAlertThresholds = useCallback((newThresholds) => {
    setAlertThresholds((prev) => {
      const updated = { ...prev, ...newThresholds };
      try {
        localStorage.setItem('vegsense_alert_thresholds', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const value = {
    alerts,
    activeAlerts,
    unreadCount,
    summary,
    loading,
    error,
    lastUpdated,
    preferences,
    alertThresholds,
    loadAlerts,
    refreshSummaryAndCount,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    resolveAlert: handleResolveAlert,
    evaluateTelemetry,
    updatePreferences,
    updateAlertThresholds,
    requestBrowserPermission
  };

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
}

export function useAlerts() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
}
