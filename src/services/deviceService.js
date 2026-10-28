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

// Connection timeout in milliseconds: 15 seconds for robust LAN / PNA handshakes
export const CONNECTION_TIMEOUT_MS = 15000;

// Active polling interval reference
let activePollingTimer = null;

// Active Web Serial references
let activeSerialPort = null;
let activeSerialReader = null;
let activeSerialStreamClosed = null;
let serialDisconnectListener = null;
let serialKeepReading = false;

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
 * Helper to fetch with an AbortController timeout (15 seconds).
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
      const timeoutError = new Error(`Connection timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
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
    }, CONNECTION_TIMEOUT_MS);

    if (!res.ok) {
      const err = new Error(`ESP32 returned HTTP status ${res.status}`);
      err.code = 'HTTP_ERROR';
      err.status = res.status;
      throw err;
    }

    const data = await res.json();

    // Verify response.status === "connected" (case-insensitive)
    if (!data || typeof data !== 'object' || String(data.status).toLowerCase() !== 'connected') {
      const err = new Error(`ESP32 responded, but status was '${data?.status || 'unknown'}' instead of 'connected'.`);
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
        firmware: data.firmware || 'v2.7.0',
        network: data.network || 'Wi-Fi'
      },
      rawResponse: data
    };
  } catch (directErr) {
    if (directErr.code === 'INVALID_STATUS' || directErr.code === 'INVALID_IP' || directErr.code === 'HTTP_ERROR') {
      throw directErr;
    }

    // Check if the request failed due to HTTPS Mixed Content or Private Network Access restrictions
    if (isHttpsContext()) {
      const httpsErr = new Error(
        `Mixed Content & Private Network Restriction:\n\n` +
        `This browser is accessing VegSense over HTTPS (${window.location.origin}). ` +
        `Browsers block secure HTTPS sites from directly accessing local HTTP IP addresses (${directUrl}) to enforce security.\n\n` +
        `Compatible connection options:\n` +
        `• Web Serial: Connect your ESP32 via USB and click "Connect via Web Serial"\n` +
        `• Cloud Gateway: Let the ESP32 upload to VegSense Cloud via HTTPS\n` +
        `• Local HTTP: Run the web interface locally at http://localhost:5173`
      );
      httpsErr.code = 'HTTPS_MIXED_CONTENT';
      throw httpsErr;
    }

    if (directErr.code === 'TIMEOUT') {
      const timeoutErr = new Error(
        `Connection timed out after 15 seconds. ESP32 at ${cleanIp} did not respond.\n\n` +
        `Troubleshooting:\n` +
        `• Ensure ESP32 is powered on\n` +
        `• Confirm ESP32 is connected to the same Wi-Fi network\n` +
        `• Check that IP ${cleanIp} is correct\n` +
        `• Check if http://${cleanIp}/status opens directly in a browser tab`
      );
      timeoutErr.code = 'TIMEOUT';
      throw timeoutErr;
    }

    const netErr = new Error(
      `Network communication error with ESP32 at ${cleanIp}: ${directErr.message || 'Device unreachable'}.\n\n` +
      `Check:\n• ESP32 is powered\n• ESP32 is connected to Wi-Fi\n• Computer and ESP32 are on the same Wi-Fi\n• IP address is correct`
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
    }, CONNECTION_TIMEOUT_MS);

    if (!res.ok) {
      const err = new Error(`Sensor API returned HTTP status ${res.status}`);
      err.code = 'HTTP_ERROR';
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    return validateAndParseSensorResponse(data);
  } catch (directErr) {
    if (directErr.code === 'INVALID_SENSOR_DATA' || directErr.code === 'INVALID_IP' || directErr.code === 'HTTP_ERROR') {
      throw directErr;
    }

    if (isHttpsContext()) {
      const httpsErr = new Error(
        `Mixed Content Restriction: Browsers block HTTPS cloud frontends from directly accessing private HTTP endpoints (${directUrl}). ` +
        `Connect via Web Serial (USB) or use the Cloud IoT Gateway.`
      );
      httpsErr.code = 'HTTPS_MIXED_CONTENT';
      throw httpsErr;
    }

    if (directErr.code === 'TIMEOUT') {
      const timeoutErr = new Error(`Sensor reading timed out after 15 seconds. ESP32 at ${cleanIp} did not respond.`);
      timeoutErr.code = 'TIMEOUT';
      throw timeoutErr;
    }

    const netErr = new Error(`Failed to read sensor data from ESP32 at ${cleanIp}: ${directErr.message || 'Endpoint unreachable'}.`);
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
  disconnectWebSerial().catch(() => {});
  return {
    status: 'Not Connected',
    ipAddress: '',
    signal: 'None'
  };
}

/**
 * =====================================================================================
 * Web Serial API Communication Services
 * Direct browser-to-microcontroller USB connection:
 * - W3C Standard supported on Chrome, Edge, Brave, Opera
 * - Works natively on HTTPS (https://vegitables.vercel.app) without Mixed Content or LAN issues
 * - Communicates with ESP32 DevKit V1 CP2102 / CH340 / CH9102 UART at 115200 baud
 * =====================================================================================
 */

/**
 * Check if the current browser environment supports the Web Serial API.
 */
export function isWebSerialSupported() {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

/**
 * Helper to safely extract a JSON object from a Serial line.
 * Handles prefixes, dirty lines, and trailing characters.
 */
export function extractJsonFromSerialLine(line) {
  if (!line || typeof line !== 'string') return null;
  const trimmed = line.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      const jsonStr = trimmed.substring(start, end + 1);
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Get current Web Serial connection status.
 */
export function getWebSerialStatus() {
  return {
    isOpen: Boolean(activeSerialPort && activeSerialPort.readable),
    port: activeSerialPort
  };
}

/**
 * Connect to ESP32 DevKit V1 via Web Serial API:
 * 1. Request port from user with 'Waiting for permission' state
 * 2. Open serial port at 115200 baud with 'Connecting' state
 * 3. Read stream, send query commands, and verify real sensor data
 * 4. Only once valid telemetry is received, transition to 'Connected'
 */
export async function connectWebSerial({
  onData,
  onError,
  onStateChange,
  timeoutMs = 15000
} = {}) {
  if (!isWebSerialSupported()) {
    const unsupportedErr = new Error(
      'Web Serial is not supported in this browser.\n\n' +
      'Please use Google Chrome, Microsoft Edge, Brave, or Opera to connect your ESP32 directly via USB cable.'
    );
    unsupportedErr.code = 'SERIAL_UNSUPPORTED';
    throw unsupportedErr;
  }

  // Close any existing active serial port first
  if (activeSerialPort) {
    await disconnectWebSerial();
  }

  // State 1: Waiting for permission
  onStateChange?.('Waiting for permission');

  let port;
  try {
    port = await navigator.serial.requestPort();
  } catch (err) {
    if (
      err.name === 'NotFoundError' ||
      err.name === 'AbortError' ||
      err.message?.toLowerCase().includes('no port selected') ||
      err.message?.toLowerCase().includes('cancelled')
    ) {
      const cancelErr = new Error('No serial port selected. Port selection was cancelled.');
      cancelErr.code = 'PERMISSION_CANCELLED';
      throw cancelErr;
    }
    const permErr = new Error(`Browser permission denied: ${err.message || 'Permission request failed'}`);
    permErr.code = 'PERMISSION_ERROR';
    throw permErr;
  }

  if (!port) {
    const cancelErr = new Error('No serial port selected.');
    cancelErr.code = 'PERMISSION_CANCELLED';
    throw cancelErr;
  }

  // State 2: Connecting
  onStateChange?.('Connecting');

  try {
    await port.open({ baudRate: 115200 });
  } catch (err) {
    if (
      err.name === 'InvalidStateError' ||
      err.name === 'NetworkError' ||
      err.message?.toLowerCase().includes('already open') ||
      err.message?.toLowerCase().includes('busy') ||
      err.message?.toLowerCase().includes('access denied')
    ) {
      const busyErr = new Error(
        'Serial port is already in use by another application.\n\n' +
        'Troubleshooting:\n' +
        '• Close the Arduino IDE Serial Monitor (Tools > Serial Monitor)\n' +
        '• Close any other terminal, screen, or browser tab connected to this COM port\n' +
        '• Unplug and reconnect the USB cable, then click "Try Again".'
      );
      busyErr.code = 'PORT_BUSY';
      throw busyErr;
    }
    const openErr = new Error(`Failed to open serial port: ${err.message}`);
    openErr.code = 'PORT_OPEN_ERROR';
    throw openErr;
  }

  activeSerialPort = port;
  serialKeepReading = true;

  // Add hardware disconnect event listener
  if (navigator.serial?.addEventListener) {
    serialDisconnectListener = (event) => {
      if (event.port === port || event.target === port) {
        disconnectWebSerial();
        if (onError) {
          onError(new Error('ESP32 was disconnected from the USB port.'));
        }
      }
    };
    navigator.serial.addEventListener('disconnect', serialDisconnectListener);
  }

  // Send handshake command to prompt immediate response from ESP32
  try {
    const encoder = new TextEncoder();
    const writer = port.writable.getWriter();
    await writer.write(encoder.encode("STATUS\nDATA\n"));
    writer.releaseLock();
  } catch (wErr) {
    console.warn('Initial serial handshake command warning:', wErr);
  }

  // Setup stream reading pipeline
  const textDecoder = new TextDecoderStream();
  activeSerialStreamClosed = port.readable.pipeTo(textDecoder.writable).catch((e) => {
    // Pipe error is expected on manual port close
    console.debug('Serial pipe stream closed:', e?.message);
  });
  const reader = textDecoder.readable.getReader();
  activeSerialReader = reader;

  let lineBuffer = '';
  let initialDeviceData = null;
  let initialSensorData = null;

  // Promise that resolves when real sensor data is verified or rejects on timeout
  const handshakePromise = new Promise((resolve, reject) => {
    const handshakeTimer = setTimeout(() => {
      reject(
        new Error(
          'Serial communication established, but ESP32 did not return sensor readings within 15 seconds.\n\n' +
          'Troubleshooting:\n' +
          '• Verify the ESP32 is flashed with VegSense firmware v2.7.0\n' +
          '• Check that the baud rate is 115200\n' +
          '• Press the EN / RST button on the ESP32 to restart it'
        )
      );
    }, timeoutMs);

    const checkResolve = () => {
      if (initialSensorData) {
        clearTimeout(handshakeTimer);
        resolve({
          device: initialDeviceData || {
            id: 'ESP32-001',
            name: 'ESP32 DevKit V1 (USB Serial)',
            ip: 'USB-Serial',
            ipAddress: 'USB-Serial',
            status: 'connected',
            network: 'Web Serial (USB)',
            signal: 'Strong',
            mode: 'serial',
            controller: 'ESP32 DevKit V1',
            firmware: 'v2.7.0',
            lastConnected: new Date().toISOString()
          },
          sensorData: initialSensorData
        });
      }
    };

    // Asynchronous read pump loop
    (async () => {
      try {
        while (serialKeepReading) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }

          if (value) {
            lineBuffer += value;
            const lines = lineBuffer.split('\n');
            lineBuffer = lines.pop(); // keep unfinished line in buffer

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed) continue;

              const parsed = extractJsonFromSerialLine(trimmed);
              if (parsed) {
                // If it's status payload
                if (parsed.status === 'connected' && parsed.device) {
                  initialDeviceData = {
                    id: parsed.device || 'ESP32-001',
                    name: parsed.device || 'ESP32 DevKit V1 (USB Serial)',
                    ip: parsed.ip || 'USB-Serial',
                    ipAddress: parsed.ip || 'USB-Serial',
                    status: 'connected',
                    network: 'Web Serial (USB)',
                    signal: 'Strong',
                    mode: 'serial',
                    controller: 'ESP32 DevKit V1',
                    firmware: parsed.firmware || 'v2.7.0',
                    lastConnected: new Date().toISOString()
                  };
                }

                // If it's telemetry payload
                try {
                  const sensor = validateAndParseSensorResponse(parsed);
                  if (sensor) {
                    sensor.source = 'web-serial';
                    if (!initialSensorData) {
                      initialSensorData = sensor;
                      checkResolve();
                    } else if (onData) {
                      onData(sensor);
                    }
                  }
                } catch {
                  // Ignore JSON lines that do not contain complete sensor metrics
                }
              }
            }
          }
        }
      } catch (readErr) {
        if (serialKeepReading) {
          console.warn('Web Serial reader error:', readErr);
          if (onError) onError(readErr);
        }
      } finally {
        clearTimeout(handshakeTimer);
      }
    })();
  });

  try {
    const result = await handshakePromise;
    onStateChange?.('Connected');
    return result;
  } catch (err) {
    await disconnectWebSerial();
    throw err;
  }
}

/**
 * Send a text command over the active Web Serial connection (e.g. "STATUS\n", "DATA\n").
 */
export async function sendWebSerialCommand(command) {
  if (!activeSerialPort || !activeSerialPort.writable) {
    throw new Error('Web Serial port is not open or writable.');
  }

  const encoder = new TextEncoder();
  const cmd = command.endsWith('\n') ? command : command + '\n';
  const writer = activeSerialPort.writable.getWriter();
  try {
    await writer.write(encoder.encode(cmd));
  } finally {
    writer.releaseLock();
  }
}

/**
 * Disconnect and release the active Web Serial port cleanly.
 */
export async function disconnectWebSerial() {
  serialKeepReading = false;

  if (serialDisconnectListener && navigator.serial?.removeEventListener) {
    navigator.serial.removeEventListener('disconnect', serialDisconnectListener);
    serialDisconnectListener = null;
  }

  if (activeSerialReader) {
    try {
      await activeSerialReader.cancel();
      activeSerialReader.releaseLock();
    } catch (e) {
      console.debug('Error canceling serial reader:', e?.message);
    }
    activeSerialReader = null;
  }

  if (activeSerialStreamClosed) {
    try {
      await activeSerialStreamClosed;
    } catch (e) {
      // Ignore
    }
    activeSerialStreamClosed = null;
  }

  if (activeSerialPort) {
    try {
      await activeSerialPort.close();
    } catch (e) {
      console.debug('Error closing serial port:', e?.message);
    }
    activeSerialPort = null;
  }
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


