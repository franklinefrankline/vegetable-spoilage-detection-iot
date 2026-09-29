/**
 * Standardized Alert Event Key Generator
 * Format: {category}:{target_id}:{condition}
 * Ensures unique deduplication fingerprints across high-frequency polling cycles.
 */

export function generateAlertEventKey(category, targetId, condition) {
  const c = String(category || 'system').toLowerCase().trim();
  const t = String(targetId || 'global').trim();
  const cond = String(condition || 'event').toLowerCase().trim();
  return `${c}:${t}:${cond}`;
}

export const ALERT_CATEGORIES = {
  TEMPERATURE: 'temperature',
  HUMIDITY: 'humidity',
  GAS_VOC: 'gas',
  LIGHT: 'light',
  SPOILAGE_RISK: 'spoilage',
  STORAGE_EXPIRY: 'expiry',
  DEVICE_OFFLINE: 'device',
  DEVICE_RECONNECTED: 'device',
  SENSOR_UNAVAILABLE: 'sensor',
  SENSOR_RECOVERY: 'sensor',
  RISK_CHANGED: 'transition',
  STORAGE_CONDITION: 'condition'
};
