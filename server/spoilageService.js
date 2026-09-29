/**
 * Backend Authoritative Spoilage Risk Calculation Engine
 * Keeps business logic outside API route handlers (Section 31).
 */

const DEFAULT_WEIGHTS = {
  temperature: 0.30,
  humidity: 0.25,
  gas: 0.25,
  light: 0.10,
  storageAge: 0.10
};

export function calculate_temperature_risk(temp) {
  if (temp == null || isNaN(Number(temp))) return null;
  const t = Number(temp);
  // Tomato/standard baseline: 18-24 optimal, 30 max
  if (t >= 18.0 && t <= 24.0) return 10;
  if (t > 24.0 && t <= 30.0) {
    return Math.round(10 + ((t - 24.0) / 6.0) * 24); // ~28% for 28.5 °C
  }
  if (t < 18.0) return Math.min(85, Math.round(15 + (18.0 - t) * 6));
  return Math.min(100, Math.round(35 + (t - 30.0) * 9));
}

export function calculate_humidity_risk(hum) {
  if (hum == null || isNaN(Number(hum))) return null;
  const h = Number(hum);
  // 65-75 optimal
  if (h >= 65.0 && h <= 75.0) return 15;
  if (h > 75.0 && h <= 82.0) return Math.round(15 + ((h - 75.0) / 7.0) * 30);
  if (h < 65.0) return Math.min(90, Math.round(15 + (65.0 - h) * 3));
  return Math.min(100, Math.round(50 + (h - 82.0) * 3.5));
}

export function calculate_gas_risk(gas) {
  if (gas == null || isNaN(Number(gas))) return null;
  const g = Number(gas);
  if (g <= 420) return 10;
  if (g <= 450) return 15;
  if (g <= 550) return Math.round(20 + ((g - 450) / 100) * 40);
  return Math.min(100, Math.round(65 + ((g - 550) / 150) * 35));
}

export function calculate_light_risk(light) {
  if (light == null || isNaN(Number(light))) return null;
  const l = Number(light);
  if (l >= 100 && l <= 500) return 10;
  if (l < 100) return 22;
  return Math.min(100, Math.round(25 + ((l - 500) / 400) * 45));
}

export function calculate_storage_age_risk(daysRemaining, shelfLife = 14) {
  if (daysRemaining == null || isNaN(Number(daysRemaining))) return 23;
  const rem = Number(daysRemaining);
  if (rem <= 0) return 95;
  const fraction = Math.max(0, Math.min(1, rem / (Number(shelfLife) || 14)));
  return Math.round(5 + (1 - fraction) * 36);
}

export function get_spoilage_classification(risk) {
  if (risk == null || isNaN(Number(risk))) {
    return { label: 'UNAVAILABLE', severity: 'muted' };
  }
  const val = Number(risk);
  if (val <= 30) return { label: 'FRESH', severity: 'low' };
  if (val <= 60) return { label: 'WARNING', severity: 'warning' };
  if (val <= 80) return { label: 'SPOILAGE RISK', severity: 'high' };
  return { label: 'CRITICAL', severity: 'critical' };
}

export function calculate_spoilage_risk({
  temperature,
  humidity,
  gas_level,
  light_level,
  days_remaining = 7,
  shelf_life = 14
}) {
  const tempRisk = calculate_temperature_risk(temperature);
  const humRisk = calculate_humidity_risk(humidity);
  const gasRisk = calculate_gas_risk(gas_level);
  const lightRisk = calculate_light_risk(light_level);
  const ageRisk = calculate_storage_age_risk(days_remaining, shelf_life);

  const active = [];
  if (tempRisk != null) active.push({ risk: tempRisk, weight: DEFAULT_WEIGHTS.temperature });
  if (humRisk != null) active.push({ risk: humRisk, weight: DEFAULT_WEIGHTS.humidity });
  if (gasRisk != null) active.push({ risk: gasRisk, weight: DEFAULT_WEIGHTS.gas });
  if (lightRisk != null) active.push({ risk: lightRisk, weight: DEFAULT_WEIGHTS.light });
  if (ageRisk != null) active.push({ risk: ageRisk, weight: DEFAULT_WEIGHTS.storageAge });

  if (active.length === 0) {
    return {
      spoilage_risk: null,
      classification: 'UNAVAILABLE',
      data_quality: 'UNAVAILABLE',
      breakdown: { temperature_risk: 0, humidity_risk: 0, gas_risk: 0, light_risk: 0, storage_age_risk: 0 }
    };
  }

  const totalW = active.reduce((acc, a) => acc + a.weight, 0);
  const sum = active.reduce((acc, a) => acc + a.risk * (a.weight / totalW), 0);
  const finalScore = Math.max(0, Math.min(100, Math.round(sum)));

  const classObj = get_spoilage_classification(finalScore);
  const quality = active.length >= 4 ? 'GOOD' : (active.length === 3 ? 'FAIR' : 'LIMITED');

  return {
    spoilage_risk: finalScore,
    classification: classObj.label,
    severity: classObj.severity,
    data_quality: quality,
    breakdown: {
      temperature_risk: tempRisk ?? 0,
      humidity_risk: humRisk ?? 0,
      gas_risk: gasRisk ?? 0,
      light_risk: lightRisk ?? 0,
      storage_age_risk: ageRisk ?? 0
    }
  };
}

export function get_spoilage_recommendations({
  breakdown,
  temperature,
  humidity,
  gas_level,
  light_level,
  vegetable_type = 'tomato'
}) {
  const recs = [];
  if (breakdown.temperature_risk > 30) {
    recs.push(`Chamber temperature (${temperature}°C) is elevated above optimal preservation band. Engage active cooling or ventilation.`);
  }
  if (breakdown.humidity_risk > 30) {
    recs.push(`Relative humidity (${humidity}%) exceeds normal baseline. Activate dehumidification to inhibit condensation and fungal germination.`);
  }
  if (breakdown.gas_risk > 30) {
    recs.push('Gas/VOC indicator readings are elevated compared with baseline. Inspect chamber for trapped ethylene or decaying produce.');
  }
  if (breakdown.light_risk > 25) {
    recs.push(`Ambient light level (${light_level} lux) is outside ideal dark/shade storage limits.`);
  }
  if (breakdown.storage_age_risk > 50) {
    recs.push('Storage batch is approaching expected expiry period. Prioritize for distribution or processing.');
  }
  if (recs.length === 0) {
    recs.push('Current environmental conditions are within the configured monitoring range.');
    recs.push('Atmospheric microclimate parameters are stable.');
  }
  return recs;
}
