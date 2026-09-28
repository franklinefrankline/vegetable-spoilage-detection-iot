/**
 * VegSense Alert Service
 * Evaluates real sensor telemetry and persists alerts to SQLite and localStorage.
 */
import { evaluateSensorReading, getSensorThresholds } from '../utils/sensorThresholds';

const LOCAL_ALERTS_KEY = 'vegsense_recent_alerts';

/**
 * Checks a sensor reading against configured thresholds and returns any generated alerts.
 */
export function checkReadingForAlerts(reading) {
  const thresholds = getSensorThresholds();
  return evaluateSensorReading(reading, thresholds);
}

/**
 * Persists an alert to backend database with local fallback.
 */
export async function recordAlert(deviceId, alert) {
  // Store locally
  try {
    const stored = JSON.parse(localStorage.getItem(LOCAL_ALERTS_KEY) || '[]');
    const updated = [alert, ...stored].slice(0, 20);
    localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not save alert locally:', e);
  }

  // Attempt backend persistence
  try {
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: deviceId || 'ESP32-001',
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        value: alert.value
      })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Offline or serverless fallback
  }

  return { success: true };
}

/**
 * Retrieves alerts from backend or local fallback.
 */
export async function fetchDeviceAlerts(deviceId) {
  try {
    const res = await fetch(`/api/alerts/${encodeURIComponent(deviceId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.alerts) && data.alerts.length > 0) {
        return data.alerts.map((a) => ({
          id: a.id,
          type: a.type,
          title: a.type,
          severity: a.severity,
          message: a.message,
          value: a.value,
          time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: Boolean(a.is_read)
        }));
      }
    }
  } catch (e) {
    // fallback to local
  }

  try {
    const stored = localStorage.getItem(LOCAL_ALERTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Could not read local alerts:', e);
  }

  return [];
}
