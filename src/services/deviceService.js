/**
 * VegSense Device Service
 * Handles REAL communication, strict IP validation, and telemetry streaming for the physical ESP32 gateway.
 * Communicates with:
 * - GET http://{IP}/status
 * - GET http://{IP}/api/data
 */

// Connection timeout in milliseconds (5 seconds as recommended)
const CONNECTION_TIMEOUT_MS = 5000;

// Active polling interval reference
let activePollingTimer = null;

/**
 * Validates whether the given string is a valid IPv4 address.
 * Valid examples: 192.168.1.105, 192.168.0.25, 10.0.0.15
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
 * Helper to fetch with an AbortController timeout (5 seconds).
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = CONNECTION_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Connection timed out.');
      timeoutError.code = 'TIMEOUT';
      throw timeoutError;
    }
    throw error;
  }
}

/**
 * Contact ESP32 status endpoint:
 * GET http://{ESP32_IP}/status
 * Expected response: { "device": "ESP32-001", "status": "connected" }
 * Must verify response.status === "connected"
 */
export async function getDeviceStatus(ip) {
  if (!validateIPAddress(ip)) {
    throw new Error('Enter a valid ESP32 IP address.');
  }

  const cleanIp = ip.trim();
  const directUrl = `http://${cleanIp}/status`;

  try {
    // 1. Direct browser fetch to ESP32 on same local network
    const res = await fetchWithTimeout(directUrl, { method: 'GET', mode: 'cors' });
    if (!res.ok) {
      throw new Error(`ESP32 returned HTTP status ${res.status}`);
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
        ipAddress: cleanIp,
        firmware: data.firmware || '1.0.0'
      }
    };
  } catch (directErr) {
    if (directErr.code === 'INVALID_STATUS') {
      throw directErr;
    }

    // 2. If running on HTTPS (like Vercel) where browser blocks direct HTTP requests,
    // fallback to backend proxy which communicates with the real ESP32 at http://{cleanIp}/status
    try {
      const proxyUrl = `/api/esp32/status?ip=${encodeURIComponent(cleanIp)}`;
      const proxyRes = await fetchWithTimeout(proxyUrl, { method: 'GET' });
      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (proxyData.success && proxyData.data) {
          const raw = proxyData.data;
          if (String(raw.status).toLowerCase() === 'connected') {
            return {
              success: true,
              data: {
                id: raw.device || 'ESP32-001',
                name: raw.device || 'ESP32-001',
                status: 'connected',
                ipAddress: cleanIp,
                firmware: raw.firmware || '1.0.0'
              }
            };
          } else {
            const err = new Error('ESP32 returned an invalid response.');
            err.code = 'INVALID_STATUS';
            throw err;
          }
        }
      }
    } catch (proxyErr) {
      if (proxyErr.code === 'INVALID_STATUS') throw proxyErr;
    }

    if (directErr.code === 'TIMEOUT') {
      const err = new Error('Connection timed out. ESP32 did not respond.');
      err.code = 'TIMEOUT';
      throw err;
    }

    const err = new Error('ESP32 is unreachable. Check that your device and ESP32 are on the same Wi-Fi.');
    err.code = 'NETWORK_ERROR';
    throw err;
  }
}

/**
 * Contact ESP32 sensor data endpoint:
 * GET http://{ESP32_IP}/api/data
 * Expected response:
 * {
 *   "temperature": 28.5,
 *   "humidity": 72,
 *   "gas_level": 420,
 *   "status": "FRESH",
 *   "spoilage_risk": 18
 * }
 * Must validate required fields.
 */
export async function getSensorData(ip) {
  if (!validateIPAddress(ip)) {
    throw new Error('Enter a valid ESP32 IP address.');
  }

  const cleanIp = ip.trim();
  const directUrl = `http://${cleanIp}/api/data`;

  try {
    // 1. Direct browser fetch
    const res = await fetchWithTimeout(directUrl, { method: 'GET', mode: 'cors' });
    if (!res.ok) {
      throw new Error(`Sensor API returned status ${res.status}`);
    }
    const data = await res.json();
    return validateAndParseSensorResponse(data);
  } catch (directErr) {
    if (directErr.code === 'INVALID_SENSOR_DATA') {
      throw directErr;
    }

    // 2. Fallback to backend proxy (handles HTTPS mixed-content without mock data)
    try {
      const proxyUrl = `/api/esp32/data?ip=${encodeURIComponent(cleanIp)}`;
      const proxyRes = await fetchWithTimeout(proxyUrl, { method: 'GET' });
      if (proxyRes.ok) {
        const proxyData = await proxyRes.json();
        if (proxyData.success && proxyData.data) {
          return validateAndParseSensorResponse(proxyData.data);
        }
      }
    } catch (proxyErr) {
      if (proxyErr.code === 'INVALID_SENSOR_DATA') throw proxyErr;
    }

    if (directErr.code === 'TIMEOUT') {
      const err = new Error('Connection timed out.');
      err.code = 'TIMEOUT';
      throw err;
    }

    const err = new Error('ESP32 is unreachable.');
    err.code = 'NETWORK_ERROR';
    throw err;
  }
}

/**
 * Validates that the sensor response contains all required fields:
 * temperature, humidity, gas_level, status, spoilage_risk
 */
function validateAndParseSensorResponse(data) {
  if (!data || typeof data !== 'object') {
    const err = new Error('Sensor data could not be read.');
    err.code = 'INVALID_SENSOR_DATA';
    throw err;
  }

  const hasTemp = data.temperature !== undefined && data.temperature !== null && !isNaN(Number(data.temperature));
  const hasHum = data.humidity !== undefined && data.humidity !== null && !isNaN(Number(data.humidity));
  const hasGas = (data.gas_level !== undefined && data.gas_level !== null && !isNaN(Number(data.gas_level))) ||
                 (data.gasLevel !== undefined && data.gasLevel !== null && !isNaN(Number(data.gasLevel))) ||
                 (data.gasVOC !== undefined && data.gasVOC !== null && !isNaN(Number(data.gasVOC)));
  const hasRisk = (data.spoilage_risk !== undefined && data.spoilage_risk !== null && !isNaN(Number(data.spoilage_risk))) ||
                  (data.spoilageRisk !== undefined && data.spoilageRisk !== null && !isNaN(Number(data.spoilageRisk)));
  const hasStatus = data.status !== undefined && data.status !== null && String(data.status).trim().length > 0;

  if (!hasTemp || !hasHum || !hasGas || !hasRisk || !hasStatus) {
    const err = new Error('ESP32 connected, but sensor data could not be read.');
    err.code = 'INVALID_SENSOR_DATA';
    throw err;
  }

  const temp = Number(Number(data.temperature).toFixed(1));
  const humidity = Math.round(Number(data.humidity));
  const gasLevel = Math.round(Number(data.gas_level ?? data.gasLevel ?? data.gasVOC));
  const spoilageRisk = Math.round(Number(data.spoilage_risk ?? data.spoilageRisk));
  const status = String(data.status).toUpperCase();
  const storageCondition = status === 'FRESH' ? 'Stable' : status === 'MONITOR' || status === 'WARNING' ? 'Caution' : 'Critical';

  return {
    temperature: temp,
    humidity,
    gasLevel,
    gasVOC: gasLevel,
    spoilageRisk,
    status,
    storageCondition,
    lastUpdated: new Date()
  };
}

/**
 * Full Connect Device Flow:
 * 1. Validate IP
 * 2. GET http://{IP}/status
 * 3. Verify response.status === "connected"
 * 4. GET http://{IP}/api/data
 * 5. Validate sensor response fields
 */
export async function connectToDevice(ip) {
  if (!validateIPAddress(ip)) {
    throw new Error('Enter a valid ESP32 IP address.');
  }

  const cleanIp = ip.trim();

  // Step 1: Verify device status
  const statusResult = await getDeviceStatus(cleanIp);

  // Step 2: Fetch and validate real sensor data
  const sensorResult = await getSensorData(cleanIp);

  return {
    device: {
      id: statusResult.data.id || 'ESP32-001',
      name: statusResult.data.name || 'ESP32-001',
      ipAddress: cleanIp,
      status: 'connected',
      network: 'Wi-Fi',
      signal: 'Strong',
      firmware: statusResult.data.firmware || '1.0.0',
      lastConnected: new Date().toISOString()
    },
    sensorData: sensorResult
  };
}

/**
 * Start sensor polling every 3–5 seconds (3 seconds).
 * Updates sensor data without page refresh.
 */
export function startSensorPolling(ip, onData, onError, intervalMs = 3000) {
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
 * Reconnect to device using the saved IP.
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
