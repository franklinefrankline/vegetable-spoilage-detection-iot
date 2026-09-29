/**
 * =====================================================================================
 * VegSense Light Classification & Risk Engine
 * Standardized photometry evaluation for smart vegetable storage environments.
 * =====================================================================================
 */

// Initial application thresholds per Section 3
export const DEFAULT_LIGHT_THRESHOLDS = {
  minLight: 100, // lux
  maxLight: 500  // lux
};

/**
 * Classifies a light level (in lux) into LOW LIGHT, NORMAL LIGHT, or HIGH LIGHT.
 * Computes light-specific risk (0-100) per Section 4 & 6.
 *
 * Expected behavior:
 * - 80 lux  -> LOW LIGHT    -> Light Warning (~40-55% light risk)
 * - 300 lux -> NORMAL LIGHT -> Low Light Risk (10% light risk)
 * - 700 lux -> HIGH LIGHT   -> Light Warning (~60-70% light risk)
 */
export function classifyLight(lightLevel, minThreshold = DEFAULT_LIGHT_THRESHOLDS.minLight, maxThreshold = DEFAULT_LIGHT_THRESHOLDS.maxLight) {
  if (lightLevel === null || lightLevel === undefined || isNaN(Number(lightLevel))) {
    return {
      lightLevel: null,
      classification: 'UNAVAILABLE',
      riskCategory: 'Unavailable',
      lightRisk: null,
      statusLabel: 'Sensor Unavailable',
      color: '#94a3b8',
      badgeClass: 'badge-unavailable',
      isUnavailable: true
    };
  }

  const val = Number(lightLevel);
  const min = Number(minThreshold) || 100;
  const max = Number(maxThreshold) || 500;

  if (val < min) {
    // LOW LIGHT (< 100 lux)
    // Warning level: darkness can stimulate dormancy or moisture accumulation depending on crop
    const deficitRatio = Math.max(0, val / min);
    const calculatedRisk = Math.round(50 - deficitRatio * 20); // ~40-50%
    return {
      lightLevel: val,
      classification: 'LOW LIGHT',
      riskCategory: 'Light Warning',
      lightRisk: Math.max(25, Math.min(calculatedRisk, 65)),
      statusLabel: 'Low Light Warning',
      color: '#f59e0b', // Amber
      badgeClass: 'badge-amber',
      isUnavailable: false
    };
  } else if (val > max) {
    // HIGH LIGHT (> 500 lux)
    // Warning level: excessive light accelerates chlorophyll/solanine greening in root crops, premature sprouting & warmth
    const excess = val - max;
    const calculatedRisk = Math.round(50 + Math.min(40, (excess / 400) * 30)); // ~55-80%
    return {
      lightLevel: val,
      classification: 'HIGH LIGHT',
      riskCategory: 'Light Warning',
      lightRisk: Math.min(90, calculatedRisk),
      statusLabel: 'High Light Warning',
      color: '#ef4444', // Orange/Red
      badgeClass: 'badge-red',
      isUnavailable: false
    };
  } else {
    // NORMAL LIGHT (100–500 lux)
    // Low risk: Section 6 explicitly mentions Light: 420 lux -> NORMAL LIGHT -> Light Risk: 10%
    return {
      lightLevel: val,
      classification: 'NORMAL LIGHT',
      riskCategory: 'Low Light Risk',
      lightRisk: 10,
      statusLabel: 'Suitable',
      color: '#10b981', // Green
      badgeClass: 'badge-green',
      isUnavailable: false
    };
  }
}

/**
 * Section 8: Environmental Conditions synthesis
 * Evaluates Temperature, Humidity, Gas/VOC, and Light based on sensor readings.
 */
export function evaluateEnvironmentalConditions({
  temperature = 28.5,
  humidity = 72,
  gasLevel = 420,
  lightLevel = 420,
  thresholds = {}
}) {
  const minLight = thresholds.minLight ?? DEFAULT_LIGHT_THRESHOLDS.minLight;
  const maxLight = thresholds.maxLight ?? DEFAULT_LIGHT_THRESHOLDS.maxLight;

  // 1. Temperature Evaluation (Optimal ~ 18 - 25°C, Normal up to 30°C)
  let tempStatus = 'Normal';
  let tempColor = '#10b981';
  if (temperature > (thresholds.maxTemp || 30)) {
    tempStatus = 'Elevated';
    tempColor = '#ef4444';
  } else if (temperature < 15) {
    tempStatus = 'Chilled';
    tempColor = '#0ea5e9';
  }

  // 2. Humidity Evaluation (Optimal ~ 65 - 75%)
  let humStatus = 'Optimal';
  let humColor = '#10b981';
  if (humidity > (thresholds.maxHumidity || 78)) {
    humStatus = 'High Humidity';
    humColor = '#f59e0b';
  } else if (humidity < 55) {
    humStatus = 'Dry';
    humColor = '#0ea5e9';
  }

  // 3. Gas / VOC Evaluation (Normal <= 450 ppm)
  let gasStatus = 'Normal';
  let gasColor = '#10b981';
  if (gasLevel > (thresholds.maxGas || 500)) {
    gasStatus = 'Elevated VOC';
    gasColor = '#ef4444';
  } else if (gasLevel > 450) {
    gasStatus = 'Moderate';
    gasColor = '#f59e0b';
  }

  // 4. Light Evaluation
  const lightData = classifyLight(lightLevel, minLight, maxLight);
  let lightStatus = 'Normal';
  let lightColor = '#10b981';
  if (lightData.isUnavailable) {
    lightStatus = 'Unavailable';
    lightColor = '#94a3b8';
  } else if (lightData.classification === 'LOW LIGHT') {
    lightStatus = 'Low Light';
    lightColor = '#f59e0b';
  } else if (lightData.classification === 'HIGH LIGHT') {
    lightStatus = 'High Light';
    lightColor = '#ef4444';
  }

  // 5. Overall Synthesis: FRESH, WARNING, or SPOILAGE RISK
  let overall = 'FRESH';
  let overallColor = '#10b981';

  if (tempStatus === 'Elevated' || gasStatus === 'Elevated VOC' || (lightStatus === 'High Light' && humStatus === 'High Humidity')) {
    overall = 'SPOILAGE RISK';
    overallColor = '#ef4444';
  } else if (tempStatus !== 'Normal' || humStatus !== 'Optimal' || gasStatus !== 'Normal' || lightStatus !== 'Normal') {
    overall = 'WARNING';
    overallColor = '#f59e0b';
  }

  return {
    temperature: tempStatus,
    temperatureColor: tempColor,
    humidity: humStatus,
    humidityColor: humColor,
    gas: gasStatus,
    gasColor: gasColor,
    light: lightStatus,
    lightColor: lightColor,
    overall,
    overallColor,
    lightRisk: lightData.lightRisk ?? 10,
    lightClassification: lightData.classification
  };
}

/**
 * Section 5: Combined Environmental Risk calculation
 * Preserves the existing spoilage-risk calculation and integrates light as a complementary environmental factor.
 */
export function calculateCombinedSpoilageRisk(baseRisk, lightRisk) {
  const base = Number(baseRisk) || 18;
  if (lightRisk === null || lightRisk === undefined || isNaN(lightRisk)) {
    return base;
  }
  // Light contributes up to 10-15% weighting to overall spoilage risk if light is in warning state
  if (lightRisk > 30) {
    const additional = Math.round(((lightRisk - 30) / 70) * 8); // max +8%
    return Math.min(100, base + additional);
  }
  return base;
}
