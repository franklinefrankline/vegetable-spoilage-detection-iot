/**
 * Centralized Sensor Status and Environmental Classification Service
 * Single source of truth for all sensor statuses, thresholds, and health classifications.
 */

import { DEFAULT_THRESHOLDS } from './sensorThresholds';

/**
 * Evaluates Temperature Status
 * Return values: 'NORMAL' | 'WARNING' | 'HIGH' | 'UNAVAILABLE'
 */
export function getTemperatureStatus(temperature, thresholds = DEFAULT_THRESHOLDS) {
  if (temperature === null || temperature === undefined || isNaN(Number(temperature))) {
    return 'UNAVAILABLE';
  }
  const temp = Number(temperature);
  const min = thresholds?.temperature?.min ?? 15;
  const max = thresholds?.temperature?.max ?? 30;

  if (temp > max + 3) {
    return 'HIGH';
  }
  if (temp > max || temp < min) {
    return 'WARNING';
  }
  return 'NORMAL';
}

/**
 * Evaluates Humidity Status
 * Return values: 'LOW' | 'OPTIMAL' | 'HIGH' | 'UNAVAILABLE'
 */
export function getHumidityStatus(humidity, thresholds = DEFAULT_THRESHOLDS) {
  if (humidity === null || humidity === undefined || isNaN(Number(humidity))) {
    return 'UNAVAILABLE';
  }
  const hum = Number(humidity);
  const min = thresholds?.humidity?.min ?? 60;
  const max = thresholds?.humidity?.max ?? 78;

  if (hum < min) {
    return 'LOW';
  }
  if (hum > max) {
    return 'HIGH';
  }
  return 'OPTIMAL';
}

/**
 * Evaluates Gas / VOC Status (MQ-135)
 * Return values: 'BASELINE NORMAL' | 'ELEVATED' | 'HIGH' | 'UNAVAILABLE'
 */
export function getGasStatus(gasLevel, thresholds = DEFAULT_THRESHOLDS) {
  if (gasLevel === null || gasLevel === undefined || isNaN(Number(gasLevel))) {
    return 'UNAVAILABLE';
  }
  const gas = Number(gasLevel);
  const normalMax = thresholds?.gasLevel?.normalMax ?? 450;
  const warningMax = thresholds?.gasLevel?.warningMax ?? 600;

  if (gas > warningMax) {
    return 'HIGH';
  }
  if (gas > normalMax) {
    return 'ELEVATED';
  }
  return 'BASELINE NORMAL';
}

/**
 * Evaluates Light Classification (BH1750 / LDR)
 * Return values: 'LOW LIGHT' | 'NORMAL LIGHT' | 'HIGH LIGHT' | 'UNAVAILABLE'
 */
export function getLightClassification(lightLevel, thresholds = DEFAULT_THRESHOLDS) {
  if (lightLevel === null || lightLevel === undefined || isNaN(Number(lightLevel))) {
    return 'UNAVAILABLE';
  }
  const lux = Number(lightLevel);
  const minLux = thresholds?.light?.min ?? (thresholds?.minLight ?? 100);
  const maxLux = thresholds?.light?.max ?? (thresholds?.maxLight ?? 500);

  if (lux < minLux) {
    return 'LOW LIGHT';
  }
  if (lux > maxLux) {
    return 'HIGH LIGHT';
  }
  return 'NORMAL LIGHT';
}

/**
 * Calculates Light-induced risk penalty (0-100)
 */
export function getLightRisk(lightLevel, thresholds = DEFAULT_THRESHOLDS) {
  if (lightLevel === null || lightLevel === undefined || isNaN(Number(lightLevel))) {
    return 10;
  }
  const lux = Number(lightLevel);
  const minLux = thresholds?.light?.min ?? (thresholds?.minLight ?? 100);
  const maxLux = thresholds?.light?.max ?? (thresholds?.maxLight ?? 500);

  if (lux >= minLux && lux <= maxLux) {
    // Normal light: minimal risk (5-12%)
    return 10;
  }
  if (lux < minLux) {
    // Low light / dark: slight risk of mold / high humidity trapped (20-35%)
    const deficit = (minLux - lux) / minLux;
    return Math.min(35, Math.round(15 + deficit * 20));
  }
  // High light: stimulates premature sprouting and solanine production in nightshades
  const excess = (lux - maxLux) / 500;
  return Math.min(80, Math.round(30 + excess * 40));
}

/**
 * Evaluates Overall Environmental Condition
 * Return values: 'FRESH' | 'NORMAL' | 'WARNING'
 */
export function getEnvironmentStatus({
  temperatureStatus,
  humidityStatus,
  gasStatus,
  lightClassification,
  spoilageRisk = 18
}) {
  // If high gas, high temp, or high spoilage risk -> WARNING
  if (
    temperatureStatus === 'HIGH' ||
    gasStatus === 'HIGH' ||
    spoilageRisk > 45 ||
    humidityStatus === 'HIGH'
  ) {
    return 'WARNING';
  }

  // If any warning or elevated condition -> NORMAL
  if (
    temperatureStatus === 'WARNING' ||
    humidityStatus === 'LOW' ||
    gasStatus === 'ELEVATED' ||
    lightClassification === 'LOW LIGHT' ||
    lightClassification === 'HIGH LIGHT' ||
    spoilageRisk > 25
  ) {
    return 'NORMAL';
  }

  // Ideal baseline storage environment
  return 'FRESH';
}

/**
 * Helper to get status badge colors and visual config
 */
export function getStatusBadgeConfig(status) {
  switch (status) {
    case 'FRESH':
    case 'OPTIMAL':
    case 'NORMAL':
    case 'BASELINE NORMAL':
    case 'NORMAL LIGHT':
      return {
        bg: 'rgba(16, 185, 129, 0.12)',
        color: '#10b981',
        border: 'rgba(16, 185, 129, 0.3)',
        label: status
      };
    case 'ELEVATED':
    case 'LOW':
    case 'LOW LIGHT':
    case 'WARNING':
      return {
        bg: 'rgba(245, 158, 11, 0.12)',
        color: '#f59e0b',
        border: 'rgba(245, 158, 11, 0.3)',
        label: status
      };
    case 'HIGH':
    case 'HIGH LIGHT':
    case 'CRITICAL':
    case 'SPOILAGE RISK':
      return {
        bg: 'rgba(239, 68, 68, 0.12)',
        color: '#ef4444',
        border: 'rgba(239, 68, 68, 0.3)',
        label: status
      };
    case 'UNAVAILABLE':
    default:
      return {
        bg: 'rgba(148, 163, 184, 0.12)',
        color: '#94a3b8',
        border: 'rgba(148, 163, 184, 0.25)',
        label: 'UNAVAILABLE'
      };
  }
}
