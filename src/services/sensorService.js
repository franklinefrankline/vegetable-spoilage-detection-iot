/**
 * Unified Sensor Service for VegSense Smart Storage Intelligence
 * Dispatches between Real ESP32 hardware and Demo Mode gracefully.
 */

import { buildApiUrl } from './apiClient.js';
import {
  getDemoSensorData,
  startDemoSensorPolling,
  stopDemoSensorPolling,
  getDemoHistory
} from './demoSensorService';

let realPollingTimer = null;
let realSubscribers = new Set();

/**
 * Fetches current sensor data from backend or demo service
 */
export async function getCurrentSensorData(deviceId = 'ESP32-DEMO-001', isDemo = true) {
  if (isDemo || deviceId.includes('DEMO')) {
    return getDemoSensorData();
  }

  try {
    const res = await fetch(buildApiUrl(`/sensors/current?deviceId=${encodeURIComponent(deviceId)}`));
    if (!res.ok) {
      throw new Error(`Sensor API error: ${res.status}`);
    }
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn('[SensorService] Cloud sensor read notice:', err.message);
    return {
      deviceId,
      temperature: null,
      humidity: null,
      gas_level: null,
      gasVOC: null,
      light_level: null,
      lightLevel: null,
      status: 'OFFLINE',
      spoilageRisk: 0,
      isOffline: true,
      is_stale: true,
      is_temp_unavailable: true,
      is_light_unavailable: true
    };
  }
}

/**
 * Fetches sensor history points for specified time range
 */
export async function getSensorHistory(deviceId = 'ESP32-DEMO-001', range = '24h', isDemo = true) {
  if (isDemo || deviceId.includes('DEMO')) {
    return getDemoHistory(range);
  }

  try {
    const res = await fetch(buildApiUrl(`/sensors/history?deviceId=${encodeURIComponent(deviceId)}&range=${encodeURIComponent(range)}`));
    if (!res.ok) {
      throw new Error(`Sensor history API error: ${res.status}`);
    }
    const json = await res.json();
    const rawList = json.data || json.readings || [];
    if (rawList && rawList.length > 0) {
      return rawList.map((r) => ({
        time: new Date(r.recorded_at || r.recordedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: r.recorded_at || r.recordedAt,
        temperature: r.temperature,
        humidity: r.humidity,
        gasLevel: r.gas_level ?? r.gas,
        gasVOC: r.gas_level ?? r.gas,
        lightLevel: r.light_level ?? r.light,
        lightClassification: r.light_classification || (r.light_level === null ? 'NOT INSTALLED' : 'NORMAL LIGHT'),
        spoilageRisk: r.spoilage_risk || 18,
        source: r.source || 'esp32'
      }));
    }
    return [];
  } catch (err) {
    console.warn('[SensorService] Failed to load real hardware history:', err.message);
    return [];
  }
}

/**
 * Persists a sensor reading
 */
export async function recordSensorReading(reading) {
  try {
    const res = await fetch(buildApiUrl('/sensors/record'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reading)
    });
    return await res.json();
  } catch (err) {
    console.warn('[SensorService] Failed to record reading:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Starts continuous sensor polling
 */
export function startSensorPolling(callback, intervalMs = 5000, deviceId = 'ESP32-DEMO-001', isDemo = true) {
  if (isDemo || deviceId.includes('DEMO')) {
    return startDemoSensorPolling(callback, intervalMs);
  }

  if (callback) {
    realSubscribers.add(callback);
    getCurrentSensorData(deviceId, false).then(callback).catch(console.error);
  }

  if (!realPollingTimer) {
    realPollingTimer = setInterval(async () => {
      try {
        const data = await getCurrentSensorData(deviceId, false);
        realSubscribers.forEach((cb) => cb(data));
      } catch (err) {
        console.error('[SensorService] Polling error:', err);
      }
    }, intervalMs);
  }

  return () => stopSensorPolling(callback);
}

/**
 * Stops continuous sensor polling
 */
export function stopSensorPolling(callback) {
  if (callback) {
    realSubscribers.delete(callback);
  }
  if (realSubscribers.size === 0 && realPollingTimer) {
    clearInterval(realPollingTimer);
    realPollingTimer = null;
  }
}
