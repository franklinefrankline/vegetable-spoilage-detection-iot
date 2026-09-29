/**
 * Standardized Alert Rules, Thresholds, and Neutral Recommendations
 * Strict adherence to non-diagnostic environmental safety reporting.
 */

export const ALERT_SEVERITIES = {
  INFO: {
    label: 'INFO',
    color: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.12)',
    border: 'rgba(37, 99, 235, 0.28)',
    description: 'Informational event such as device reconnecting or status recovery.'
  },
  WARNING: {
    label: 'WARNING',
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.12)',
    border: 'rgba(217, 119, 6, 0.28)',
    description: 'Condition requires monitoring to prevent escalation.'
  },
  HIGH: {
    label: 'HIGH',
    color: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.12)',
    border: 'rgba(234, 88, 12, 0.28)',
    description: 'Condition requires prompt attention to protect storage stability.'
  },
  CRITICAL: {
    label: 'CRITICAL',
    color: '#dc2626',
    bg: 'rgba(220, 38, 38, 0.12)',
    border: 'rgba(220, 38, 38, 0.28)',
    description: 'Condition requires immediate attention and environmental review.'
  }
};

export const DEFAULT_ALERT_THRESHOLDS = {
  tempWarningMax: 30.0,
  tempHighMax: 35.0,
  humidityMin: 50.0,
  humidityMax: 80.0,
  gasNormalMax: 500,
  gasElevatedMax: 700,
  lightMin: 100,
  lightMax: 500,
  spoilageWarning: 30,
  spoilageRisk: 60,
  spoilageCritical: 80,
  deviceOfflineDelaySec: 30,
  expiryReminderDays: [7, 3, 1]
};

export const ALERT_RECOMMENDATIONS = {
  TEMPERATURE: 'Review the storage environment and verify temperature control.',
  HUMIDITY: 'Review ventilation and moisture control.',
  GAS_VOC: 'Review storage conditions and inspect the affected batch.',
  LIGHT: 'Review storage lighting conditions.',
  SPOILAGE_RISK: 'Review the environmental factors contributing to the estimated risk.',
  STORAGE_EXPIRY: 'Review the batch storage date and configured shelf-life.',
  DEVICE_OFFLINE: 'Check ESP32 power, Wi-Fi connection and device availability.',
  DEVICE_RECONNECTED: 'Device connection established; monitor telemetry stream.',
  SENSOR_DATA_UNAVAILABLE: 'Check sensor wiring, power and sensor communication.',
  SENSOR_RECOVERY: 'Sensor telemetry restored; verify reading stability.',
  RISK_CHANGED: 'Review the environmental factors contributing to the transition.',
  STORAGE_CONDITION: 'Inspect microclimate conditions for stability.'
};

/**
 * Returns neutral practical recommendation text for an alert type
 */
export function getAlertRecommendation(alertType) {
  const norm = String(alertType || '').toUpperCase().trim();
  return ALERT_RECOMMENDATIONS[norm] || 'Inspect chamber conditions and verify system telemetry.';
}

/**
 * Maps alert type to navigation route and metric highlighting
 */
export function getAlertNavigationTarget(alert) {
  const type = String(alert.alert_type || alert.type || '').toUpperCase();
  if (type.includes('TEMP')) return { path: '/sensors', search: '?metric=temperature' };
  if (type.includes('HUMID')) return { path: '/sensors', search: '?metric=humidity' };
  if (type.includes('GAS')) return { path: '/sensors', search: '?metric=gas' };
  if (type.includes('LIGHT')) return { path: '/sensors', search: '?metric=light' };
  if (type.includes('SPOILAGE') || type.includes('RISK')) return { path: '/spoilage', search: '' };
  if (type.includes('EXPIRY') || type.includes('STORAGE')) return { path: '/storage', search: '' };
  if (type.includes('DEVICE')) return { path: '/connect-device', search: '' };
  return { path: '/alerts', search: '' };
}
