/**
 * Centralized Spoilage Risk Engine for VegSense Smart Storage Intelligence
 * Multivariate environmental risk estimation model based on DHT22, MQ-135, and BH1750/LDR.
 * Note: Calculates environmental storage risk; does not make unverified biological diagnoses.
 */

import { DEFAULT_SPOILAGE_WEIGHTS, getVegetableProfile } from './spoilageThresholds.js';

/**
 * Calculates Temperature Risk (0–100)
 */
export function calculateTemperatureRisk(temperature, profile = null) {
  if (temperature == null || isNaN(Number(temperature))) return null;
  const temp = Number(temperature);
  const p = profile || getVegetableProfile('general');

  const optMin = p.tempOptimalMin ?? 18.0;
  const optMax = p.tempOptimalMax ?? 24.0;
  const warnMax = p.tempWarningMax ?? 30.0;

  // Perfect optimal band
  if (temp >= optMin && temp <= optMax) {
    return 10;
  }

  // Slightly above optimal max (e.g. 28.5 °C for tomato)
  if (temp > optMax && temp <= warnMax) {
    const fraction = (temp - optMax) / (warnMax - optMax);
    return Math.round(10 + fraction * 24); // ~28% for 28.5 °C
  }

  // Below optimal min (chilling injury risk for sensitive fruits)
  if (temp < optMin) {
    const deficit = optMin - temp;
    return Math.min(85, Math.round(15 + deficit * 6));
  }

  // Elevated critical temperatures (> warnMax)
  const excess = temp - warnMax;
  return Math.min(100, Math.round(35 + excess * 9));
}

/**
 * Calculates Humidity Risk (0–100)
 */
export function calculateHumidityRisk(humidity, profile = null) {
  if (humidity == null || isNaN(Number(humidity))) return null;
  const hum = Number(humidity);
  const p = profile || getVegetableProfile('general');

  const optMin = p.humidityOptimalMin ?? 65.0;
  const optMax = p.humidityOptimalMax ?? 75.0;
  const warnMax = p.humidityWarningMax ?? 82.0;

  if (hum >= optMin && hum <= optMax) {
    // Optimal window baseline (15% risk)
    return 15;
  }

  if (hum > optMax && hum <= warnMax) {
    const fraction = (hum - optMax) / (warnMax - optMax);
    return Math.round(15 + fraction * 30);
  }

  if (hum < optMin) {
    // Dehydration / shriveling risk
    const deficit = optMin - hum;
    return Math.min(90, Math.round(15 + deficit * 3));
  }

  // Extreme condensation & fungal spores (> warnMax)
  const excess = hum - warnMax;
  return Math.min(100, Math.round(50 + excess * 3.5));
}

/**
 * Calculates Gas / VOC Risk (0–100)
 * Note: MQ-135 is a broad Gas/VOC indicator.
 */
export function calculateGasRisk(gasLevel, profile = null) {
  if (gasLevel == null || isNaN(Number(gasLevel))) return null;
  const gas = Number(gasLevel);
  const p = profile || getVegetableProfile('general');

  const normalMax = p.gasNormalMax ?? 450;
  const warningMax = p.gasWarningMax ?? 550;

  // Clean baseline (<= 420 ppm)
  if (gas <= 420) {
    return 10;
  }

  if (gas <= normalMax) {
    return 15;
  }

  if (gas <= warningMax) {
    const fraction = (gas - normalMax) / (warningMax - normalMax);
    return Math.round(20 + fraction * 40); // 20–60
  }

  // High volatile emissions (> warningMax)
  const excess = gas - warningMax;
  return Math.min(100, Math.round(65 + (excess / 150) * 35));
}

/**
 * Calculates Light-Induced Risk (0–100)
 */
export function calculateLightRisk(lightLevel, profile = null) {
  if (lightLevel == null || isNaN(Number(lightLevel))) return null;
  const lux = Number(lightLevel);
  const p = profile || getVegetableProfile('general');

  const minLux = p.lightMin ?? 100;
  const maxLux = p.lightMax ?? 500;

  if (lux >= minLux && lux <= maxLux) {
    return 10; // Normal ambient light: minimal risk
  }

  if (lux < minLux) {
    // For potatoes 0-50 is desired, for others low light promotes damp mold
    if (p.id === 'potato') return 5;
    return 22;
  }

  // High light (> maxLux) triggers chlorophyll/solanine or transpiration
  const excess = lux - maxLux;
  return Math.min(100, Math.round(25 + (excess / 400) * 45));
}

/**
 * Calculates Storage Age Risk (0–100)
 */
export function calculateStorageAgeRisk(daysRemaining, shelfLifeDays = 14) {
  if (daysRemaining == null || isNaN(Number(daysRemaining))) return 23;
  const rem = Number(daysRemaining);
  const total = Number(shelfLifeDays) || 14;

  if (rem <= 0) {
    return 95; // Storage period exceeded
  }

  const fractionRemaining = Math.max(0, Math.min(1, rem / total));
  // When half shelf life left (7 of 14 days) -> 5 + 0.5 * 36 = 23%
  const elapsedFraction = 1 - fractionRemaining;
  return Math.round(5 + elapsedFraction * 36);
}

/**
 * Evaluates Data Quality based on available sensors (Section 16)
 */
export function getDataQuality({ temperature, humidity, gasLevel, lightLevel }) {
  const hasTemp = temperature != null && !isNaN(Number(temperature));
  const hasHum = humidity != null && !isNaN(Number(humidity));
  const hasGas = gasLevel != null && !isNaN(Number(gasLevel));
  const hasLight = lightLevel != null && !isNaN(Number(lightLevel));

  const validCount = [hasTemp, hasHum, hasGas, hasLight].filter(Boolean).length;

  if (validCount === 4) return 'GOOD';
  if (validCount === 3) return 'FAIR';
  if (validCount >= 1) return 'LIMITED';
  return 'UNAVAILABLE';
}

/**
 * Primary Spoilage Risk Calculation Engine (Section 4, 12, 13)
 * Weighted multi-factor model producing strictly clamped 0–100 score.
 */
export function calculateSpoilageRisk({
  temperature,
  humidity,
  gasLevel,
  lightLevel,
  storageBatch = null,
  weights = DEFAULT_SPOILAGE_WEIGHTS
}) {
  const profile = getVegetableProfile(storageBatch?.name || storageBatch?.vegetable_name || 'tomato');

  const tempRisk = calculateTemperatureRisk(temperature, profile);
  const humRisk = calculateHumidityRisk(humidity, profile);
  const gasRisk = calculateGasRisk(gasLevel, profile);
  const lightRisk = calculateLightRisk(lightLevel, profile);

  // Storage age calculation if available
  let daysRemaining = storageBatch?.daysRemaining ?? storageBatch?.days_remaining;
  if (daysRemaining == null && storageBatch?.expiryDate) {
    const diffMs = new Date(storageBatch.expiryDate) - new Date();
    daysRemaining = Math.ceil(diffMs / (1000 * 3600 * 24));
  }
  if (daysRemaining == null && storageBatch?.expected_expiry_date) {
    const diffMs = new Date(storageBatch.expected_expiry_date) - new Date();
    daysRemaining = Math.ceil(diffMs / (1000 * 3600 * 24));
  }
  if (daysRemaining == null) {
    daysRemaining = 7;
  }
  const ageRisk = calculateStorageAgeRisk(daysRemaining, profile.shelfLifeDays);

  // Dynamic weight redistribution if any factor is unavailable
  const activeFactors = [];
  if (tempRisk != null) activeFactors.push({ risk: tempRisk, weight: weights.temperature });
  if (humRisk != null) activeFactors.push({ risk: humRisk, weight: weights.humidity });
  if (gasRisk != null) activeFactors.push({ risk: gasRisk, weight: weights.gas });
  if (lightRisk != null) activeFactors.push({ risk: lightRisk, weight: weights.light });
  if (ageRisk != null) activeFactors.push({ risk: ageRisk, weight: weights.storageAge });

  if (activeFactors.length === 0) {
    return {
      spoilageRisk: null,
      classification: { label: 'UNAVAILABLE', severity: 'muted' },
      dataQuality: 'UNAVAILABLE',
      breakdown: { tempRisk: 0, humRisk: 0, gasRisk: 0, lightRisk: 0, ageRisk: 0 }
    };
  }

  const totalActiveWeight = activeFactors.reduce((acc, f) => acc + f.weight, 0);
  const weightedSum = activeFactors.reduce((acc, f) => {
    const normalizedWeight = f.weight / totalActiveWeight;
    return acc + f.risk * normalizedWeight;
  }, 0);

  // Exact clamp 0–100
  const finalScore = Math.max(0, Math.min(100, Math.round(weightedSum)));
  const classification = getSpoilageClassification(finalScore);
  const dataQuality = getDataQuality({ temperature, humidity, gasLevel, lightLevel });

  return {
    spoilageRisk: finalScore,
    classification,
    dataQuality,
    breakdown: {
      temperatureRisk: tempRisk ?? 0,
      humidityRisk: humRisk ?? 0,
      gasRisk: gasRisk ?? 0,
      lightRisk: lightRisk ?? 0,
      storageAgeRisk: ageRisk ?? 0
    },
    profile
  };
}

/**
 * Classifies Spoilage Risk (Section 14)
 * 0–30: FRESH
 * 31–60: WARNING
 * 61–80: SPOILAGE RISK
 * 81–100: CRITICAL
 */
export function getSpoilageClassification(risk) {
  if (risk == null || isNaN(Number(risk))) {
    return {
      label: 'UNAVAILABLE',
      severity: 'muted',
      color: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.12)',
      border: 'rgba(148, 163, 184, 0.25)'
    };
  }

  const val = Number(risk);

  if (val <= 30) {
    return {
      label: 'FRESH',
      severity: 'low',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.3)'
    };
  }

  if (val <= 60) {
    return {
      label: 'WARNING',
      severity: 'warning',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.3)'
    };
  }

  if (val <= 80) {
    return {
      label: 'SPOILAGE RISK',
      severity: 'high',
      color: '#f97316',
      bg: 'rgba(249, 115, 22, 0.12)',
      border: 'rgba(249, 115, 22, 0.3)'
    };
  }

  return {
    label: 'CRITICAL',
    severity: 'critical',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.3)'
  };
}

/**
 * Calculates Risk Trend from history (Section 37)
 * Returns 'LOWER' | 'STABLE' | 'RISING' | 'Insufficient Data'
 */
export function calculateRiskTrend(historyPoints = []) {
  if (!historyPoints || historyPoints.length < 3) {
    return 'Insufficient Data';
  }

  const risks = historyPoints
    .map((p) => p.spoilageRisk ?? p.spoilage_risk)
    .filter((v) => v != null && !isNaN(Number(v)));

  if (risks.length < 3) {
    return 'Insufficient Data';
  }

  const recent = risks.slice(-3);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const delta = last - first;

  if (delta > 2) return 'RISING';
  if (delta < -2) return 'LOWER';
  return 'STABLE';
}

/**
 * Generates context-aware Storage Recommendations (Section 25)
 */
export function getSpoilageRecommendations({
  breakdown,
  profile,
  sensorData,
  storageBatch
}) {
  const recs = [];
  const p = profile || getVegetableProfile(storageBatch?.name || 'general');

  // Check temperature
  if (breakdown.temperatureRisk > 30) {
    if (sensorData?.temperature > p.tempOptimalMax) {
      recs.push(`Chamber temperature (${sensorData.temperature.toFixed(1)}°C) exceeds optimal ${p.tempOptimalMax}°C. Engage active cooling or ventilation.`);
    } else if (sensorData?.temperature < p.tempOptimalMin) {
      recs.push(`Temperature (${sensorData.temperature.toFixed(1)}°C) is below minimum recommended ${p.tempOptimalMin}°C. Prevent potential chilling injury.`);
    }
  }

  // Check humidity
  if (breakdown.humidityRisk > 30) {
    if (sensorData?.humidity > p.humidityOptimalMax) {
      recs.push(`Relative humidity (${Math.round(sensorData.humidity)}%) is elevated above target ${p.humidityOptimalMax}%. Activate dehumidification to inhibit mold spore germination.`);
    } else if (sensorData?.humidity < p.humidityOptimalMin) {
      recs.push(`Humidity (${Math.round(sensorData.humidity)}%) is below optimal ${p.humidityOptimalMin}%. Monitor for premature moisture loss and produce shriveling.`);
    }
  }

  // Check gas / VOC
  if (breakdown.gasRisk > 30) {
    recs.push('Gas/VOC indicator readings are elevated compared with the configured baseline. Inspect chamber for decaying units or trapped ethylene.');
  }

  // Check light
  if (breakdown.lightRisk > 25) {
    if (p.id === 'potato') {
      recs.push('Light exposure detected in potato bay. Cover crates immediately to prevent chlorophyll formation and toxic solanine accumulation.');
    } else {
      recs.push(`Ambient light level (${Math.round(sensorData?.lightLevel || 420)} lux) is outside optimal range. Keep produce in indirect shade.`);
    }
  }

  // Check storage age
  if (breakdown.storageAgeRisk > 50) {
    recs.push('Storage period is approaching the configured expiry date. Prioritize this batch for distribution or immediate processing.');
  }

  // Default optimal status
  if (recs.length === 0) {
    recs.push('Current environmental conditions are within the configured monitoring range.');
    recs.push('Atmospheric microclimate parameters are stable. Continue standard routine inspection.');
  }

  return recs;
}
