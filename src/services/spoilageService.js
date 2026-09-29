/**
 * Frontend Spoilage Service for VegSense Smart Storage Intelligence
 * Communicates with backend spoilage endpoints or utilizes the local engine for demo mode.
 */

import {
  calculateSpoilageRisk,
  getSpoilageClassification,
  getSpoilageRecommendations,
  calculateRiskTrend
} from '../utils/spoilageRisk';
import { getVegetableProfile } from '../utils/spoilageThresholds';

/**
 * Fetches current authoritative spoilage risk calculation
 */
export async function getSpoilageStatus(batchId = 'v_tomato_a', deviceId = 'ESP32-DEMO-001', isDemo = true, liveSensorFrame = null) {
  // If demo mode or offline, utilize authoritative local engine
  if (isDemo || deviceId.includes('DEMO')) {
    const reading = liveSensorFrame || {
      temperature: 28.5,
      humidity: 72,
      gasLevel: 420,
      lightLevel: 420
    };

    const calc = calculateSpoilageRisk({
      temperature: reading.temperature,
      humidity: reading.humidity,
      gasLevel: reading.gasLevel ?? reading.gasVOC,
      lightLevel: reading.lightLevel,
      storageBatch: { id: batchId, name: 'Tomato', variety: 'Batch A', daysRemaining: 7, shelfLife: 14 }
    });

    const recs = getSpoilageRecommendations({
      breakdown: calc.breakdown,
      profile: calc.profile,
      sensorData: reading,
      storageBatch: { id: batchId, name: 'Tomato' }
    });

    return {
      success: true,
      batchId,
      spoilageRisk: calc.spoilageRisk,
      classification: calc.classification.label,
      severity: calc.classification.severity,
      dataQuality: calc.dataQuality,
      breakdown: calc.breakdown,
      recommendations: recs,
      updatedAt: new Date().toISOString()
    };
  }

  // Real backend call for live devices
  try {
    const res = await fetch(`/api/spoilage/current?deviceId=${encodeURIComponent(deviceId)}&batchId=${encodeURIComponent(batchId)}`);
    if (!res.ok) throw new Error(`Spoilage API error: ${res.status}`);
    const data = await res.json();
    return {
      success: true,
      batchId: data.batch_id,
      spoilageRisk: data.spoilage_risk,
      classification: data.classification,
      severity: data.severity,
      dataQuality: data.data_quality,
      breakdown: {
        temperatureRisk: data.temperature_risk,
        humidityRisk: data.humidity_risk,
        gasRisk: data.gas_risk,
        lightRisk: data.light_risk,
        storageAgeRisk: data.storage_age_risk
      },
      recommendations: data.recommendations,
      updatedAt: data.updated_at
    };
  } catch (err) {
    console.warn('[SpoilageService] API call failed, falling back to local calculation:', err.message);
    // Fallback to local calculation
    return getSpoilageStatus(batchId, deviceId, true, liveSensorFrame);
  }
}

/**
 * Fetches historical spoilage risk progression
 */
export async function getSpoilageHistory(range = '24h', deviceId = 'ESP32-DEMO-001', isDemo = true) {
  try {
    const res = await fetch(`/api/spoilage/history?deviceId=${encodeURIComponent(deviceId)}&range=${encodeURIComponent(range)}&isDemo=${isDemo}`);
    if (res.ok) {
      const data = await res.json();
      if (data.history && data.history.length > 0) {
        return data.history;
      }
    }
  } catch (e) {
    console.warn('[SpoilageService] Error fetching history:', e);
  }

  // Fallback demo baseline history
  const points = [];
  const now = Date.now();
  const count = range === '7d' ? 28 : (range === '30d' ? 30 : 24);
  const stepMs = range === '7d' ? 6 * 3600 * 1000 : (range === '30d' ? 24 * 3600 * 1000 : 3600 * 1000);
  const seeds = [18, 17, 18, 19, 18, 17, 18, 18, 19, 20, 19, 18, 18, 17, 18, 19, 18, 18];

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * stepMs);
    const r = seeds[(count - i) % seeds.length];
    points.push({
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: timestamp.toISOString(),
      spoilageRisk: r,
      spoilage_risk: r,
      classification: r > 30 ? 'WARNING' : 'FRESH'
    });
  }
  return points;
}
