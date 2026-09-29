/**
 * Unified Sensor Service for VegSense Smart Storage Intelligence
 * Dispatches between Real ESP32 hardware and Demo Mode gracefully.
 */

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
    const res = await fetch(`/api/sensors/current?deviceId=${encodeURIComponent(deviceId)}`);
    if (!res.ok) {
      throw new Error(`Sensor API error: ${res.status}`);
    }
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn('[SensorService] Fallback to demo sensor data:', err.message);
    return getDemoSensorData();
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
    const res = await fetch(`/api/sensors/history?deviceId=${encodeURIComponent(deviceId)}&range=${encodeURIComponent(range)}`);
    if (!res.ok) {
      throw new Error(`Sensor history API error: ${res.status}`);
    }
    const json = await res.json();
    if (json.readings && json.readings.length > 0) {
      return json.readings.map((r) => ({
        time: new Date(r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: r.recorded_at,
        temperature: r.temperature,
        humidity: r.humidity,
        gasLevel: r.gas_level,
        gasVOC: r.gas_level,
        lightLevel: r.light_level ?? 420,
        lightClassification: r.light_classification || 'NORMAL LIGHT',
        spoilageRisk: r.spoilage_risk || 18,
        source: r.source || 'esp32'
      }));
    }
    return getDemoHistory(range);
  } catch (err) {
    console.warn('[SensorService] Fallback to demo history:', err.message);
    return getDemoHistory(range);
  }
}

/**
 * Persists a sensor reading
 */
export async function recordSensorReading(reading) {
  try {
    const res = await fetch('/api/sensors/record', {
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
