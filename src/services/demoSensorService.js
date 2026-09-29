/**
 * Dedicated Demo Sensor Service for VegSense Smart Storage Intelligence
 * Provides realistic, controlled environmental variations for ESP32-DEMO-001 (192.168.1.105)
 * Without physical hardware dependencies.
 */

import {
  getTemperatureStatus,
  getHumidityStatus,
  getGasStatus,
  getLightClassification,
  getLightRisk,
  getEnvironmentStatus
} from '../utils/sensorStatus';

// Official controlled baseline sequences (Section 16)
export const DEMO_SEQUENCES = {
  temperature: [28.5, 28.6, 28.4, 28.7, 28.5],
  humidity: [72, 73, 71, 72, 74],
  gas: [420, 425, 418, 430, 423],
  light: [420, 450, 390, 470, 430],
  spoilageRisk: [18, 19, 17, 20, 18]
};

let currentSeqIndex = 0;
let pollingTimer = null;
let subscribers = new Set();
let isSimulatedOffline = false;
let forcedCondition = null;
let lastKnownReading = null;

// Initial state
let currentDemoState = {
  temperature: 28.5,
  humidity: 72,
  gasLevel: 420,
  gasVOC: 420,
  lightLevel: 420,
  lightClassification: 'NORMAL LIGHT',
  lightRisk: 10,
  spoilageRisk: 18,
  status: 'FRESH',
  environmentStatus: 'FRESH',
  isDemo: true,
  deviceId: 'ESP32-DEMO-001',
  ipAddress: '192.168.1.105',
  lastUpdated: new Date()
};

lastKnownReading = { ...currentDemoState };

/**
 * Returns the current demo sensor reading frame
 */
export function getDemoSensorData() {
  if (isSimulatedOffline) {
    return {
      ...lastKnownReading,
      isOffline: true,
      status: 'OFFLINE'
    };
  }
  return { ...currentDemoState, isOffline: false };
}

/**
 * Generates the next realistic reading based on sequence or active simulation
 */
export function generateDemoReading() {
  if (isSimulatedOffline) {
    return { ...lastKnownReading, isOffline: true };
  }

  const now = new Date();
  const idx = currentSeqIndex % DEMO_SEQUENCES.temperature.length;

  let temp = DEMO_SEQUENCES.temperature[idx];
  let hum = DEMO_SEQUENCES.humidity[idx];
  let gas = DEMO_SEQUENCES.gas[idx];
  let light = DEMO_SEQUENCES.light[idx];
  let risk = DEMO_SEQUENCES.spoilageRisk[idx];

  // Apply condition overrides if active (Section 17 testing)
  if (forcedCondition === 'low-light') {
    light = 80;
  } else if (forcedCondition === 'high-light') {
    light = 700;
  } else if (forcedCondition === 'high-temp') {
    temp = 34.2;
  } else if (forcedCondition === 'high-humidity') {
    hum = 86;
  } else if (forcedCondition === 'elevated-gas') {
    gas = 540;
  }

  currentSeqIndex += 1;

  const tempStatus = getTemperatureStatus(temp);
  const humStatus = getHumidityStatus(hum);
  const gasStatus = getGasStatus(gas);
  const lightClass = getLightClassification(light);
  const lightRiskVal = getLightRisk(light);
  const envStatus = getEnvironmentStatus({
    temperatureStatus: tempStatus,
    humidityStatus: humStatus,
    gasStatus,
    lightClassification: lightClass,
    spoilageRisk: risk
  });

  currentDemoState = {
    temperature: temp,
    humidity: hum,
    gasLevel: gas,
    gasVOC: gas,
    lightLevel: light,
    lightClassification: lightClass,
    lightRisk: lightRiskVal,
    spoilageRisk: risk,
    status: risk > 30 ? 'WARNING' : 'FRESH',
    environmentStatus: envStatus,
    tempStatus,
    humStatus,
    gasStatus,
    isDemo: true,
    deviceId: 'ESP32-DEMO-001',
    ipAddress: '192.168.1.105',
    lastUpdated: now,
    isOffline: false
  };

  lastKnownReading = { ...currentDemoState };
  return currentDemoState;
}

/**
 * Simulates specific conditions for testing thresholds (Section 17)
 */
export function simulateDemoCondition(condition) {
  forcedCondition = condition;
  return generateDemoReading();
}

/**
 * Clears any forced simulation condition
 */
export function clearDemoCondition() {
  forcedCondition = null;
  return generateDemoReading();
}

/**
 * Toggles offline state simulation (Section 30)
 */
export function simulateOffline(offline) {
  isSimulatedOffline = Boolean(offline);
  const result = isSimulatedOffline
    ? { ...lastKnownReading, isOffline: true, status: 'OFFLINE' }
    : { ...currentDemoState, isOffline: false };

  subscribers.forEach((cb) => cb(result));
  return result;
}

/**
 * Simulates reconnection sequence (Section 30)
 */
export async function reconnectDemo(onProgress) {
  if (onProgress) onProgress('Connecting...');
  await new Promise((r) => setTimeout(r, 600));

  if (onProgress) onProgress('Checking device...');
  await new Promise((r) => setTimeout(r, 600));

  if (onProgress) onProgress('Reading sensors...');
  await new Promise((r) => setTimeout(r, 600));

  isSimulatedOffline = false;
  const resumed = generateDemoReading();

  if (onProgress) onProgress('Connected');
  subscribers.forEach((cb) => cb(resumed));
  return resumed;
}

/**
 * Starts demo sensor polling (5-second default per Section 14)
 */
export function startDemoSensorPolling(callback, intervalMs = 5000) {
  if (callback) {
    subscribers.add(callback);
    callback(getDemoSensorData());
  }

  if (!pollingTimer) {
    pollingTimer = setInterval(() => {
      const nextReading = generateDemoReading();
      subscribers.forEach((cb) => cb(nextReading));
    }, intervalMs);
  }

  return () => stopDemoSensorPolling(callback);
}

/**
 * Stops demo sensor polling and cleans up timers
 */
export function stopDemoSensorPolling(callback) {
  if (callback) {
    subscribers.delete(callback);
  }
  if (subscribers.size === 0 && pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

/**
 * Generates controlled demo history for charts (Section 27)
 */
export function getDemoHistory(range = '24h') {
  const points = [];
  const now = Date.now();
  let count = 24;
  let stepMs = 3600 * 1000;

  if (range === '1h') {
    count = 12;
    stepMs = 5 * 60 * 1000;
  } else if (range === '6h') {
    count = 18;
    stepMs = 20 * 60 * 1000;
  } else if (range === '12h') {
    count = 24;
    stepMs = 30 * 60 * 1000;
  } else if (range === '7d') {
    count = 28;
    stepMs = 6 * 3600 * 1000;
  }

  const tempSeeds = [28.5, 28.2, 27.8, 27.4, 27.1, 26.9, 27.3, 27.9, 28.4, 28.8, 29.2, 29.0, 28.7, 28.5];
  const humSeeds = [72, 73, 74, 75, 75, 76, 74, 73, 72, 70, 69, 70, 71, 72];
  const gasSeeds = [420, 418, 415, 412, 415, 418, 422, 425, 428, 430, 426, 422, 420, 420];
  const lightSeeds = [420, 390, 200, 50, 0, 0, 120, 310, 430, 470, 450, 420, 400, 420];

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * stepMs);
    const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const idx = (count - i) % tempSeeds.length;

    points.push({
      time: timeStr,
      timestamp: timestamp.toISOString(),
      temperature: tempSeeds[idx],
      humidity: humSeeds[idx],
      gasLevel: gasSeeds[idx],
      gasVOC: gasSeeds[idx],
      lightLevel: lightSeeds[idx],
      lightClassification: lightSeeds[idx] < 100 ? 'LOW LIGHT' : (lightSeeds[idx] > 500 ? 'HIGH LIGHT' : 'NORMAL LIGHT'),
      spoilageRisk: 18,
      source: 'demo'
    });
  }

  return points;
}
