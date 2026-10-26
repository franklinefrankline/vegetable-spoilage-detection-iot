/**
 * =====================================================================================
 * VegSense Device Service
 * Handles REAL communication, strict IP validation, and telemetry streaming for the
 * physical ESP32 gateway.
 *
 * Communicates with:
 * - GET http://{IP}/status
 * - GET http://{IP}/api/data
 * =====================================================================================
 */

import { classifyLight } from '../utils/lightClassification.js';
import apiClient, { buildApiUrl } from './apiClient.js';

// Connection timeout in milliseconds: 5 seconds (Section 8)
export const CONNECTION_TIMEOUT_MS = 5000;

// Active polling interval reference
let activePollingTimer = null;

/**
 * Validates whether the given string is a valid IPv4 address.
 * Valid examples: 192.168.1.150, 192.168.0.25, 10.0.0.15
 * Invalid examples: abc, 192.168.1, 999.999.999.999, 192.168.1.999, empty
 */
export function validateIPAddress(ip) {
  if (!ip || typeof ip !== 'string') {
    return false;
  }

  const trimmed = ip.trim();
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = trimmed.match(ipv4Regex);

  if (!match) {
    return false;
  }

  // Ensure each octet is between 0 and 255 with no invalid leading zeroes
  for (let i = 1; i <= 4; i++) {
    const octet = match[i];
    const num = Number(octet);

    if (num < 0 || num > 255) {
      return false;
    }

    if (octet.length > 1 && octet.startsWith('0')) {
      return false;
    }
  }

  return true;
}

/**
 * Detects whether the current browser session is running on an HTTPS origin (e.g. Vercel)
 * versus a local HTTP origin (e.g. http://localhost:5173).
 */
export function isHttpsContext() {
  return typeof window !== 'undefined' && window.location.protocol === 'https:';
}

/**
 * Helper to fetch with an AbortController timeout (5 seconds, Section 8).
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = CONNECTION_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timer);
    return response;
  } catch (error) {
    clearTimeout(timer);
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Connection timed out. ESP32 did not respond.');
      timeoutError.code = 'TIMEOUT';
      throw timeoutError;
    }
    throw error;
  }
}

/**
 * Contact ESP32 status endpoint:
 * GET http://{ESP32_IP}/status
 * Expected response:
 * {
 *   "device": "ESP32-001",
 *   "status": "connected",
 *   "ip": "192.168.1.150"
 * }
 */
export async function getDeviceStatus(ip) {
  if (!validateIPAddress(ip)) {
    const err = new Error('Enter a valid ESP32 IP address.');
    err.code = 'INVALID_IP';
    throw err;
  }

  const cleanIp = ip.trim();
  const directUrl = `http://${cleanIp}/status`;

  try {
    const res = await fetchWithTimeout(directUrl, {
      method: 'GET',
      mode: 'cors'
    });

    if (!res.ok) {
      const err = new Error(`ESP32 returned HTTP status ${res.status}`);
      err.code = 'HTTP_ERROR';
      throw err;
    }

    const data = await res.json();

    // Verify response.status === "connected" (case-insensitive)
    if (!data || typeof data !== 'object' || String(data.status).toLowerCase() !== 'connected') {
      const err = new Error('ESP32 returned an invalid response.');
      err.code = 'INVALID_STATUS';
      throw err;
    }

    return {
      success: true,
      data: {
        id: data.device || 'ESP32-001',
        name: data.device || 'ESP32-001',
        status: 'connected',
        ipAddress: data.ip || cleanIp,
        firmware: data.firmware || 'v2.5.0',
        network: data.network || 'Wi-Fi'
      },
      rawResponse: data
    };
  } catch (directErr) {
    if (directErr.code === 'INVALID_STATUS' || directErr.code === 'INVALID_IP') {
      throw directErr;
    }

    if (directErr.code === 'TIMEOUT') {
      const timeoutErr = new Error('ESP32 did not respond.\n\nCheck:\n• ESP32 is powered\n• ESP32 is connected to Wi-Fi\n• Computer and ESP32 are on the same Wi-Fi\n• IP address is correct\n• ESP32 HTTP server is running');
      timeoutErr.code = 'TIMEOUT';
      throw timeoutErr;
    }

    // Check if the request failed due to HTTPS Mixed Content or Private Network Access restrictions
    if (isHttpsContext()) {
      const httpsErr = new Error(
        'Mixed Content Restriction: This browser is running VegSense over HTTPS (https://' +
        window.location.host +
        '). Browsers block secure HTTPS sites from directly accessing local HTTP IP addresses (' +
        directUrl +
        ').\n\nTo connect directly to your local ESP32:\n• Run the frontend locally over HTTP: npm run dev\n• Open http://localhost:5173/connect-device on the same Wi-Fi.'
      );
      httpsErr.code = 'HTTPS_MIXED_CONTENT';
      throw httpsErr;
    }

    const netErr = new Error(
      'ESP32 did not respond.\n\nCheck:\n• ESP32 is powered\n• ESP32 is connected to Wi-Fi\n• Computer and ESP32 are on the same Wi-Fi\n• IP address is correct\n• ESP32 HTTP server is running'
    );
    netErr.code = 'NETWORK_ERROR';
    throw netErr;
  }
}

/**
 * Contact ESP32 sensor data endpoint:
 * GET http://{ESP32_IP}/api/data
 * Expected response:
 * {
 *   "temperature": 28.5,
 *   "humidity": 72.0,
 *   "gas_level": 420,
 *   "status": "FRESH",
 *   "spoilage_risk": 18
 * }
 * Or error response (Section 18):
 * {
 *   "error": "DHT22_READ_FAILED"
 * }
 */
export async function getSensorData(ip) {
  if (!validateIPAddress(ip)) {
    const err = new Error('Enter a valid ESP32 IP address.');
    err.code = 'INVALID_IP';
    throw err;
  }

  const cleanIp = ip.trim();
  const directUrl = `http://${cleanIp}/api/data`;

  try {
    const res = await fetchWithTimeout(directUrl, {
      method: 'GET',
      mode: 'cors'
    });

    if (!res.ok) {
      const err = new Error(`Sensor API returned status ${res.status}`);
      err.code = 'HTTP_ERROR';
      throw err;
    }

    const data = await res.json();
    return validateAndParseSensorResponse(data);
  } catch (directErr) {
    if (directErr.code === 'INVALID_SENSOR_DATA' || directErr.code === 'INVALID_IP') {
      throw directErr;
    }

    if (directErr.code === 'TIMEOUT') {
      const timeoutErr = new Error('ESP32 did not respond.\n\nCheck:\n• ESP32 is powered\n• ESP32 is connected to Wi-Fi\n• Computer and ESP32 are on the same Wi-Fi\n• IP address is correct\n• ESP32 HTTP server is running');
      timeoutErr.code = 'TIMEOUT';
      throw timeoutErr;
    }

    if (isHttpsContext()) {
      const httpsErr = new Error(
        'Mixed Content Restriction: Browsers block HTTPS cloud frontends from directly accessing private HTTP endpoints (' +
        directUrl +
        '). Run locally over HTTP at http://localhost:5173/connect-device.'
      );
      httpsErr.code = 'HTTPS_MIXED_CONTENT';
      throw httpsErr;
    }

    const netErr = new Error('ESP32 did not respond.');
    netErr.code = 'NETWORK_ERROR';
    throw netErr;
  }
}

/**
 * Validates that the sensor response contains required fields.
 * Handles Section 18 DHT22 error cleanly (e.g. DHT22_READ_FAILED).
 * Backward Compatibility (Section 13): If older ESP32 payload does not have light_level,
 * marks light as unavailable without crashing.
 */
export function validateAndParseSensorResponse(data) {
  if (!data || typeof data !== 'object') {
    const err = new Error('Sensor data could not be read.');
    err.code = 'INVALID_SENSOR_DATA';
    throw err;
  }

  // Section 18: DHT22 NaN / Read Failed Handling
  const isDhtError = data.error === 'DHT22_READ_FAILED' || data.temperature === null || data.humidity === null;

  const hasTemp = !isDhtError && data.temperature !== undefined && data.temperature !== null && !isNaN(Number(data.temperature));
  const hasHum = !isDhtError && data.humidity !== undefined && data.humidity !== null && !isNaN(Number(data.humidity));
  const hasGas = (data.gas_level !== undefined && data.gas_level !== null && !isNaN(Number(data.gas_level))) ||
                 (data.gasLevel !== undefined && data.gasLevel !== null && !isNaN(Number(data.gasLevel))) ||
                 (data.gasVOC !== undefined && data.gasVOC !== null && !isNaN(Number(data.gasVOC)));
  const hasRisk = (data.spoilage_risk !== undefined && data.spoilage_risk !== null && !isNaN(Number(data.spoilage_risk))) ||
                  (data.spoilageRisk !== undefined && data.spoilageRisk !== null && !isNaN(Number(data.spoilageRisk)));

  if (!hasGas && !hasRisk && !hasTemp) {
    const err = new Error('ESP32 connected, but sensor data could not be read.');
    err.code = 'INVALID_SENSOR_DATA';
    throw err;
  }

  // Section 1 & 13: Light Sensor (BH1750 / LDR) & Backward Compatibility
  const rawLight = data.light_level ?? data.lightLevel ?? data.light;
  const hasLight = rawLight !== undefined && rawLight !== null && rawLight !== '' && !isNaN(Number(rawLight));
  const lightLevel = hasLight ? Math.round(Number(rawLight)) : null;
  const isLightUnavailable = !hasLight;
  const lightEval = hasLight ? classifyLight(lightLevel) : {
    classification: data.light_classification || 'UNAVAILABLE',
    riskCategory: 'Unavailable',
    lightRisk: null,
    statusLabel: 'Light Sensor Unavailable'
  };

  const temp = hasTemp ? Number(Number(data.temperature).toFixed(1)) : null;
  const humidity = hasHum ? Math.round(Number(data.humidity)) : null;
  const gasLevel = Math.round(Number(data.gas_level ?? data.gasLevel ?? data.gasVOC ?? 0));
  const spoilageRisk = Math.round(Number(data.spoilage_risk ?? data.spoilageRisk ?? 0));
  const status = String(data.status || 'FRESH').toUpperCase();
  const storageCondition = status === 'FRESH' ? 'Stable' : status === 'WARNING' || status === 'MONITOR' ? 'Caution' : 'Critical';

  return {
    temperature: temp,
    humidity,
    gasLevel,
    gasVOC: gasLevel,
    lightLevel,
    lightClassification: data.light_classification || lightEval.classification,
    lightRisk: data.light_risk !== undefined && data.light_risk !== null ? Number(data.light_risk) : lightEval.lightRisk,
    spoilageRisk,
    status,
    storageCondition,
    isDhtUnavailable: isDhtError,
    isLightUnavailable,
    lastUpdated: new Date()
  };
}

/**
 * Full Connect Device Flow (Section 13 & 21):
 * 1. Validate IP (do NOT mark successful merely because IP is valid format)
 * 2. GET http://{IP}/status
 * 3. Verify ESP32 responds with status === "connected"
 * 4. GET http://{IP}/api/data
 * 5. Validate real sensor data
 * 6. Return device & sensor data only after both succeed
 */
export async function connectToDevice(ip) {
  if (!validateIPAddress(ip)) {
    const err = new Error('Enter a valid ESP32 IP address.');
    err.code = 'INVALID_IP';
    throw err;
  }

  const cleanIp = ip.trim();

  // Step 1: Verify device status endpoint
  const statusResult = await getDeviceStatus(cleanIp);

  // Step 2: Fetch and validate real sensor data endpoint
  const sensorResult = await getSensorData(cleanIp);

  return {
    device: {
      id: statusResult.data.id || 'ESP32-001',
      name: statusResult.data.name || 'ESP32-001',
      ipAddress: cleanIp,
      ip: cleanIp,
      status: 'connected',
      network: 'Wi-Fi',
      signal: 'Strong',
      firmware: statusResult.data.firmware || 'v2.5.0',
      lastConnected: new Date().toISOString()
    },
    sensorData: sensorResult
  };
}

/**
 * Start sensor polling every 5 seconds (Section 13 & 14).
 * Updates sensor data dynamically without page reload.
 */
export function startSensorPolling(ip, onData, onError, intervalMs = 5000) {
  stopSensorPolling();

  if (!ip || !validateIPAddress(ip)) {
    return () => {};
  }

  activePollingTimer = setInterval(async () => {
    try {
      const data = await getSensorData(ip);
      if (onData) onData(data);
    } catch (err) {
      if (onError) onError(err);
    }
  }, intervalMs);

  return stopSensorPolling;
}

/**
 * Stop active sensor polling.
 */
export function stopSensorPolling() {
  if (activePollingTimer) {
    clearInterval(activePollingTimer);
    activePollingTimer = null;
  }
}

/**
 * Reconnect to device using the saved IP address.
 */
export async function reconnectDevice(ip) {
  return connectToDevice(ip);
}

/**
 * Disconnect device helper.
 */
export function disconnectDevice() {
  stopSensorPolling();
  return {
    status: 'Not Connected',
    ipAddress: '',
    signal: 'None'
  };
}

/**
 * =====================================================================================
 * Cloud IoT Gateway Communication Services
 * Communicates with the cloud endpoints without requiring LAN IP access:
 * - GET /api/sensors/current?deviceId=ESP32-001
 * - GET /api/sensors/history?deviceId=ESP32-001
 * - GET /api/device/provision-info
 * - POST /api/device/provision-token
 * =====================================================================================
 */

/**
 * Formats a raw cloud sensor response into the standard application sensorData model.
 */
export function formatCloudSensorResponse(data = {}) {
  const isTempUnavailable = Boolean(
    data.is_temp_unavailable ||
    data.temperature === null ||
    data.temperature === undefined ||
    isNaN(Number(data.temperature))
  );
  const isHumUnavailable = Boolean(
    data.is_hum_unavailable ||
    data.humidity === null ||
    data.humidity === undefined ||
    isNaN(Number(data.humidity))
  );
  const isGasUnavailable = Boolean(
    data.is_gas_unavailable ||
    (data.gas_level === null && data.gasVOC === null && data.gasLevel === null)
  );
  const isLightUnavailable = Boolean(
    data.is_light_unavailable ||
    data.light_level === null ||
    data.lightLevel === null ||
    data.light_level === undefined ||
    isNaN(Number(data.light_level ?? data.lightLevel))
  );

  const isStale = Boolean(data.is_stale);
  const isOffline = data.device_status === 'offline' || isStale;

  const temp = isTempUnavailable ? null : Number(Number(data.temperature).toFixed(1));
  const humidity = isHumUnavailable ? null : Math.round(Number(data.humidity));
  const rawGas = data.gas_level ?? data.gasVOC ?? data.gasLevel;
  const gasLevel = !isGasUnavailable && rawGas !== null && rawGas !== undefined ? Math.round(Number(rawGas)) : null;
  const rawLight = data.light_level ?? data.lightLevel;
  const lightLevel = !isLightUnavailable && rawLight !== null && rawLight !== undefined ? Math.round(Number(rawLight)) : null;

  const status = String(data.status || 'FRESH').toUpperCase();
  const spoilageRisk = data.spoilage_risk !== null && data.spoilage_risk !== undefined ? Math.round(Number(data.spoilage_risk)) : 18;

  let lightClassification = data.light_classification || data.lightClassification || 'NORMAL LIGHT';
  if (isLightUnavailable) {
    lightClassification = 'NOT INSTALLED';
  }

  const recordedAt = data.recorded_at || data.recordedAt || (data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString());

  return {
    temperature: temp,
    humidity,
    gasLevel,
    gasVOC: gasLevel,
    lightLevel,
    lightClassification,
    lightRisk: data.light_risk ?? data.lightRisk ?? 0,
    spoilageRisk,
    status,
    storageCondition: status === 'FRESH' ? 'Stable' : status === 'WARNING' || status === 'MONITOR' ? 'Caution' : 'Critical',
    isDhtUnavailable: isTempUnavailable || isHumUnavailable,
    isTempUnavailable,
    isHumUnavailable,
    isGasUnavailable,
    isLightUnavailable,
    isStale,
    isOffline,
    ageSeconds: data.ageSeconds ?? 0,
    lastUpdated: new Date(recordedAt),
    recordedAt,
    deviceId: data.deviceId || 'ESP32-001',
    source: data.source || 'cloud-https'
  };
}

/**
 * Fetch latest sensor readings from the dedicated cloud endpoint:
 * GET /api/sensors/current?deviceId={deviceId}
 */
export async function getCloudSensorData(deviceId = 'ESP32-001') {
  const url = buildApiUrl(`/sensors/current?deviceId=${encodeURIComponent(deviceId)}`);
  const res = await fetch(url, { method: 'GET', credentials: 'include' });

  if (!res.ok) {
    const err = new Error(`Cloud API returned HTTP status ${res.status}`);
    err.code = 'CLOUD_HTTP_ERROR';
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  if (!data || !data.success) {
    const err = new Error(data?.message || 'Failed to retrieve cloud sensor readings.');
    err.code = 'CLOUD_API_ERROR';
    throw err;
  }

  return formatCloudSensorResponse(data.data || {});
}

/**
 * Fetch cloud device status and health:
 * GET /api/sensors/current?deviceId={deviceId}
 */
export async function getCloudDeviceStatus(deviceId = 'ESP32-001') {
  const sensorData = await getCloudSensorData(deviceId);
  return {
    success: true,
    data: {
      id: sensorData.deviceId || deviceId,
      name: sensorData.deviceId || deviceId,
      status: sensorData.isOffline ? 'Offline' : 'connected',
      isStale: sensorData.isStale,
      ageSeconds: sensorData.ageSeconds,
      recordedAt: sensorData.recordedAt,
      network: 'Cloud Ingestion (HTTPS)',
      signal: sensorData.isOffline ? 'None' : 'Strong',
      controller: 'ESP32 DevKit V1',
      firmware: 'v2.6.0-cloud',
      mode: 'cloud',
      lastConnected: sensorData.recordedAt
    },
    sensorData
  };
}

/**
 * Fetch cloud historical readings:
 * GET /api/sensors/history?deviceId={deviceId}&limit={limit}
 */
export async function fetchCloudHistory(deviceId = 'ESP32-001', limit = 30) {
  try {
    const url = buildApiUrl(`/sensors/history?deviceId=${encodeURIComponent(deviceId)}&limit=${limit}`);
    const res = await fetch(url, { method: 'GET', credentials: 'include' });
    if (!res.ok) return [];

    const json = await res.json();
    if (!json || !json.success || !Array.isArray(json.data)) return [];

    return json.data.map((item) => {
      const timeStr = item.time || (item.recorded_at ? new Date(item.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--');
      return {
        time: timeStr,
        temp: item.temperature ?? item.temp,
        temperature: item.temperature ?? item.temp,
        humidity: item.humidity,
        gas: item.gas_level ?? item.gas,
        gasLevel: item.gas_level ?? item.gas,
        light: item.light_level ?? item.light,
        lightLevel: item.light_level ?? item.light,
        risk: item.spoilage_risk ?? item.risk,
        spoilageRisk: item.spoilage_risk ?? item.risk,
        recordedAt: item.recorded_at || item.time
      };
    });
  } catch (err) {
    console.warn('Failed to fetch cloud history:', err.message);
    return [];
  }
}

/**
 * Fetch device provisioning instructions and details:
 * GET /api/device/provision-info
 */
export async function fetchProvisionInfo() {
  try {
    return await apiClient.get('/device/provision-info');
  } catch (err) {
    return {
      success: true,
      deviceId: 'ESP32-001',
      cloudIngestionUrl: 'https://vegitables.vercel.app/api/readings',
      authHeader: 'x-api-key',
      authAlternatives: ['x-device-token', 'Authorization: Bearer <TOKEN>'],
      format: {
        deviceId: 'ESP32-001',
        temperature: 24.5,
        humidity: 65.2,
        rawMQ135: 412,
        light: 380,
        timestamp: 1730000000000
      }
    };
  }
}

/**
 * Provision a dedicated token for this ESP32 hardware device:
 * POST /api/device/provision-token
 */
export async function provisionDeviceToken(deviceId = 'ESP32-001', deviceName = 'ESP32-001') {
  return apiClient.post('/device/provision-token', { deviceId, name: deviceName });
}

/**
 * Connect to Cloud ESP32 Gateway:
 * Validates connectivity to the cloud ingestion endpoint, reads telemetry & history.
 */
export async function connectToCloudDevice(deviceId = 'ESP32-001') {
  const statusRes = await getCloudDeviceStatus(deviceId);
  const historyData = await fetchCloudHistory(deviceId, 30);

  return {
    device: statusRes.data,
    sensorData: statusRes.sensorData,
    history: historyData
  };
}

/**
 * Fetch latest device telemetry from dedicated device endpoint:
 * GET /api/devices/:deviceId/latest
 */
export async function fetchDeviceLatest(deviceId = 'ESP32-001') {
  const url = buildApiUrl(`/devices/${encodeURIComponent(deviceId)}/latest`);
  const res = await fetch(url, { method: 'GET', credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching latest device telemetry`);
  return res.json();
}

/**
 * Fetch historical device telemetry with pagination and date filters:
 * GET /api/devices/:deviceId/history?limit=...&offset=...&from=...&to=...
 */
export async function fetchDeviceHistory(deviceId = 'ESP32-001', options = {}) {
  const { limit = 50, offset = 0, from = '', to = '' } = options;
  const params = new URLSearchParams({ limit, offset });
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  const url = buildApiUrl(`/devices/${encodeURIComponent(deviceId)}/history?${params.toString()}`);
  const res = await fetch(url, { method: 'GET', credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching device history`);
  return res.json();
}

/**
 * Register a new device and generate dedicated credential:
 * POST /api/devices/register
 */
export async function registerCloudDevice(payload) {
  return apiClient.post('/devices/register', payload);
}

/**
 * Rotate a device's credential:
 * POST /api/devices/:deviceId/rotate-token
 */
export async function rotateDeviceToken(deviceId) {
  return apiClient.post(`/devices/${encodeURIComponent(deviceId)}/rotate-token`, {});
}

/**
 * Revoke a device's credential:
 * POST /api/devices/:deviceId/revoke
 */
export async function revokeCloudDevice(deviceId) {
  return apiClient.post(`/devices/${encodeURIComponent(deviceId)}/revoke`, {});
}

/**
 * Re-activate a revoked device:
 * POST /api/devices/:deviceId/activate
 */
export async function activateCloudDevice(deviceId) {
  return apiClient.post(`/devices/${encodeURIComponent(deviceId)}/activate`, {});
}


