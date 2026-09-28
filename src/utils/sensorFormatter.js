/**
 * VegSense Sensor Formatting & Calculation Utilities
 * Strictly uses actual sensor data.
 */

/**
 * Format temperature to 1 decimal place with °C.
 */
export function formatTemperature(val) {
  if (val === undefined || val === null || isNaN(Number(val))) return '-- °C';
  return `${Number(val).toFixed(1)} °C`;
}

/**
 * Format humidity as whole percentage.
 */
export function formatHumidity(val) {
  if (val === undefined || val === null || isNaN(Number(val))) return '-- %';
  return `${Math.round(Number(val))} %`;
}

/**
 * Format gas level as integer with ppm unit.
 */
export function formatGas(val) {
  if (val === undefined || val === null || isNaN(Number(val))) return '-- ppm';
  return `${Math.round(Number(val))} ppm`;
}

/**
 * Format spoilage risk percentage.
 */
export function formatSpoilageRisk(val) {
  if (val === undefined || val === null || isNaN(Number(val))) return '-- %';
  return `${Math.round(Number(val))} %`;
}

/**
 * Calculate storage health score based strictly on documented formula:
 * healthScore = 100 - spoilageRisk (e.g. spoilageRisk = 18 -> healthScore = 82%)
 */
export function calculateStorageHealth(spoilageRisk) {
  if (spoilageRisk === undefined || spoilageRisk === null || isNaN(Number(spoilageRisk))) {
    return 100;
  }
  const risk = Math.max(0, Math.min(100, Math.round(Number(spoilageRisk))));
  return 100 - risk;
}

/**
 * Categorize spoilage risk into visual band:
 * Green: 0–30 (Low)
 * Yellow: 31–60 (Medium)
 * Red: 61–100 (High)
 */
export function getRiskSeverity(risk) {
  const num = Number(risk) || 0;
  if (num <= 30) {
    return { level: 'Low', color: 'var(--status-green, #16a34a)', badgeClass: 'risk-badge-low', label: 'Low Risk' };
  }
  if (num <= 60) {
    return { level: 'Medium', color: 'var(--status-yellow, #eab308)', badgeClass: 'risk-badge-med', label: 'Medium Risk' };
  }
  return { level: 'High', color: 'var(--status-red, #ef4444)', badgeClass: 'risk-badge-high', label: 'High Risk' };
}

/**
 * Map storage status to color and description.
 * FRESH: Green
 * WARNING: Yellow/Amber
 * SPOILAGE RISK: Red
 */
export function getStatusDetails(status) {
  const clean = String(status || '').toUpperCase();
  if (clean === 'FRESH') {
    return {
      status: 'FRESH',
      color: '#16a34a',
      badgeClass: 'status-fresh',
      headline: 'Fresh Condition',
      subtext: 'Optimal atmospheric environment for extended preservation.'
    };
  }
  if (clean === 'WARNING' || clean === 'MONITOR') {
    return {
      status: 'WARNING',
      color: '#eab308',
      badgeClass: 'status-warning',
      headline: 'Cautionary Environment',
      subtext: 'Atmospheric parameters elevated. Ventilation or cooling advised.'
    };
  }
  return {
    status: 'SPOILAGE RISK',
    color: '#ef4444',
    badgeClass: 'status-critical',
    headline: 'Atmospheric Warning',
    subtext: 'High spoilage risk. Inspect storage bay immediately.'
  };
}

/**
 * Calculate actual trend from previous reading.
 * Returns null if no historical comparison exists (show 'Live' instead of fake trend).
 */
export function calculateTrend(currentVal, previousVal) {
  if (
    currentVal === undefined ||
    previousVal === undefined ||
    currentVal === null ||
    previousVal === null ||
    isNaN(Number(currentVal)) ||
    isNaN(Number(previousVal))
  ) {
    return null; // Return null so UI shows "Live"
  }

  const diff = Number((Number(currentVal) - Number(previousVal)).toFixed(2));
  if (Math.abs(diff) < 0.05) {
    return { direction: 'stable', label: 'Normal range', diff: 0 };
  }
  if (diff > 0) {
    return { direction: 'up', label: `+${diff}`, diff };
  }
  return { direction: 'down', label: `${diff}`, diff };
}

/**
 * Format relative elapsed time:
 * "Just now", "5 seconds ago", "2 minutes ago", etc.
 */
export function formatTimeAgo(date) {
  if (!date) return 'Waiting for data';
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return 'Just now';

  const diffSec = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 1000));

  if (diffSec < 4) return 'Just now';
  if (diffSec < 60) return `${diffSec} seconds ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return '1 minute ago';
  if (diffMin < 60) return `${diffMin} minutes ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr === 1) return '1 hour ago';
  return `${diffHr} hours ago`;
}
