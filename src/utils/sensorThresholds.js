/**
 * Central Sensor Thresholds Configuration
 * Controls normal, warning, and critical boundaries for storage conditions.
 * Configurable dynamically and persisted to local/database settings.
 */

export const DEFAULT_THRESHOLDS = {
  temperature: {
    min: 15,
    max: 30,
    unit: '°C'
  },
  humidity: {
    min: 40,
    max: 80,
    unit: '%'
  },
  gasLevel: {
    normalMax: 450,
    warningMax: 700,
    unit: 'ppm'
  },
  spoilageRisk: {
    low: 30,
    medium: 60
  }
};

const STORAGE_KEY = 'vegsense_sensor_thresholds';

/**
 * Loads configured thresholds from storage or returns defaults.
 */
export function getSensorThresholds() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_THRESHOLDS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Failed to load thresholds from localStorage:', e);
  }
  return DEFAULT_THRESHOLDS;
}

/**
 * Saves updated thresholds to storage.
 */
export function saveSensorThresholds(newThresholds) {
  try {
    const merged = { ...DEFAULT_THRESHOLDS, ...newThresholds };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.warn('Failed to save thresholds to localStorage:', e);
    return newThresholds;
  }
}

/**
 * Evaluates real sensor readings against the central thresholds.
 * Returns generated alerts array.
 */
export function evaluateSensorReading(reading, thresholds = DEFAULT_THRESHOLDS) {
  const alerts = [];
  if (!reading || typeof reading !== 'object') return alerts;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 1. Temperature Evaluation
  if (typeof reading.temperature === 'number') {
    if (reading.temperature > thresholds.temperature.max) {
      alerts.push({
        id: `alt_temp_high_${Date.now()}`,
        type: 'Temperature High',
        severity: reading.temperature > thresholds.temperature.max + 5 ? 'Critical' : 'Warning',
        message: `Temperature (${reading.temperature.toFixed(1)}°C) exceeds optimal threshold (${thresholds.temperature.max}°C).`,
        value: `${reading.temperature.toFixed(1)}°C`,
        time: timeStr,
        createdAt: now.toISOString()
      });
    } else if (reading.temperature < thresholds.temperature.min) {
      alerts.push({
        id: `alt_temp_low_${Date.now()}`,
        type: 'Temperature Low',
        severity: 'Warning',
        message: `Temperature (${reading.temperature.toFixed(1)}°C) is below minimum threshold (${thresholds.temperature.min}°C).`,
        value: `${reading.temperature.toFixed(1)}°C`,
        time: timeStr,
        createdAt: now.toISOString()
      });
    }
  }

  // 2. Humidity Evaluation
  if (typeof reading.humidity === 'number') {
    if (reading.humidity > thresholds.humidity.max) {
      alerts.push({
        id: `alt_hum_high_${Date.now()}`,
        type: 'Humidity High',
        severity: 'Warning',
        message: `Humidity (${Math.round(reading.humidity)}%) exceeds normal boundary (${thresholds.humidity.max}%). Condensation risk elevated.`,
        value: `${Math.round(reading.humidity)}%`,
        time: timeStr,
        createdAt: now.toISOString()
      });
    } else if (reading.humidity < thresholds.humidity.min) {
      alerts.push({
        id: `alt_hum_low_${Date.now()}`,
        type: 'Humidity Low',
        severity: 'Warning',
        message: `Humidity (${Math.round(reading.humidity)}%) is below optimal boundary (${thresholds.humidity.min}%). Risk of vegetable dehydration.`,
        value: `${Math.round(reading.humidity)}%`,
        time: timeStr,
        createdAt: now.toISOString()
      });
    }
  }

  // 3. Gas / VOC Evaluation (MQ-135)
  const gas = reading.gasLevel ?? reading.gasVOC;
  if (typeof gas === 'number') {
    if (gas > thresholds.gasLevel.warningMax) {
      alerts.push({
        id: `alt_gas_crit_${Date.now()}`,
        type: 'Gas Level Increased',
        severity: 'Critical',
        message: `Gas/VOC concentration (${gas} ppm) is critically elevated. High volatile spoilage emissions detected.`,
        value: `${gas} ppm`,
        time: timeStr,
        createdAt: now.toISOString()
      });
    } else if (gas > thresholds.gasLevel.normalMax) {
      alerts.push({
        id: `alt_gas_warn_${Date.now()}`,
        type: 'Gas Level Increased',
        severity: 'Warning',
        message: `Gas/VOC concentration (${gas} ppm) is moderately elevated above baseline (${thresholds.gasLevel.normalMax} ppm).`,
        value: `${gas} ppm`,
        time: timeStr,
        createdAt: now.toISOString()
      });
    }
  }

  // 4. Spoilage Risk Evaluation
  if (typeof reading.spoilageRisk === 'number') {
    if (reading.spoilageRisk > thresholds.spoilageRisk.medium) {
      alerts.push({
        id: `alt_risk_high_${Date.now()}`,
        type: 'Spoilage Risk High',
        severity: 'Critical',
        message: `Spoilage risk index reached ${reading.spoilageRisk}%. Immediate inspection recommended.`,
        value: `${reading.spoilageRisk}%`,
        time: timeStr,
        createdAt: now.toISOString()
      });
    } else if (reading.spoilageRisk > thresholds.spoilageRisk.low) {
      alerts.push({
        id: `alt_risk_med_${Date.now()}`,
        type: 'Spoilage Risk Elevated',
        severity: 'Warning',
        message: `Spoilage risk is rising (${reading.spoilageRisk}%). Monitor atmospheric ventilation.`,
        value: `${reading.spoilageRisk}%`,
        time: timeStr,
        createdAt: now.toISOString()
      });
    }
  }

  return alerts;
}
