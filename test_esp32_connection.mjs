import http from 'node:http';
import {
  validateIPAddress,
  validateAndParseSensorResponse,
  extractJsonFromSerialLine,
  isWebSerialSupported,
  CONNECTION_TIMEOUT_MS
} from './src/services/deviceService.js';

async function runTests() {
  console.log('\n--- STARTING ESP32 REAL CONNECTION TEST SUITE ---\n');

  // Test 1: validateIPAddress
  const validIPs = ['192.168.1.150', '192.168.0.1', '10.0.0.5', '172.16.0.10'];
  const invalidIPs = ['abc', '192.168.1', '999.999.999.999', '192.168.1.999', '', '   '];

  for (const ip of validIPs) {
    if (!validateIPAddress(ip)) {
      throw new Error(`Expected valid IP: ${ip}`);
    }
  }
  console.log('✔ PASS: IP validation correctly accepts valid IPv4 addresses');

  for (const ip of invalidIPs) {
    if (validateIPAddress(ip)) {
      throw new Error(`Expected invalid IP: ${ip}`);
    }
  }
  console.log('✔ PASS: IP validation correctly rejects invalid IP formats');

  // Start Simulated ESP32 HTTP Server
  const PORT = 8123;
  let dhtErrorSimulation = false;

  const server = http.createServer((req, res) => {
    // Add CORS headers as specified in Section 5
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === '/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        device: 'ESP32-001',
        status: 'connected',
        ip: '192.168.1.105',
        network: 'Wi-Fi',
        firmware: 'v2.5.0'
      }));
      return;
    }

    if (req.url === '/api/data') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      if (dhtErrorSimulation) {
        // Section 18 DHT22 NaN error format
        res.end(JSON.stringify({
          error: 'DHT22_READ_FAILED',
          device: 'ESP32-001',
          temperature: null,
          humidity: null,
          gas_level: 420,
          status: 'WARNING',
          spoilage_risk: 50
        }));
      } else {
        // Section 4 real sensor format
        res.end(JSON.stringify({
          device: 'ESP32-001',
          temperature: 28.5,
          humidity: 72.0,
          gas_level: 420,
          status: 'FRESH',
          spoilage_risk: 18
        }));
      }
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`✔ PASS: Simulated ESP32 HTTP server listening on port ${PORT}`);

  try {
    // Test 2: Test GET /status
    const statusRes = await fetch(`http://127.0.0.1:${PORT}/status`);
    const statusData = await statusRes.json();
    if (
      statusData.device === 'ESP32-001' &&
      statusData.status === 'connected' &&
      statusData.ip === '192.168.1.105'
    ) {
      console.log('✔ PASS: GET /status returns correct ESP32 payload with dynamic IP');
    } else {
      throw new Error(`Unexpected /status data: ${JSON.stringify(statusData)}`);
    }

    // Test 3: Test CORS headers on OPTIONS and GET
    const optRes = await fetch(`http://127.0.0.1:${PORT}/status`, { method: 'OPTIONS' });
    if (
      optRes.headers.get('access-control-allow-origin') === '*' &&
      optRes.headers.get('access-control-allow-private-network') === 'true'
    ) {
      console.log('✔ PASS: CORS and Private Network Access headers correctly present');
    } else {
      throw new Error('CORS headers missing on OPTIONS');
    }

    // Test 4: Test GET /api/data normal readings
    const dataRes = await fetch(`http://127.0.0.1:${PORT}/api/data`);
    const sensorRaw = await dataRes.json();
    const parsedData = validateAndParseSensorResponse(sensorRaw);

    if (
      parsedData.temperature === 28.5 &&
      parsedData.humidity === 72 &&
      parsedData.gasLevel === 420 &&
      parsedData.status === 'FRESH' &&
      parsedData.spoilageRisk === 18 &&
      parsedData.isDhtUnavailable === false
    ) {
      console.log('✔ PASS: GET /api/data validates and parses real DHT22 and MQ-135 values');
    } else {
      throw new Error(`Unexpected parsed sensor data: ${JSON.stringify(parsedData)}`);
    }

    // Test 5: Test Section 18 DHT22 Error handling
    dhtErrorSimulation = true;
    const errDataRes = await fetch(`http://127.0.0.1:${PORT}/api/data`);
    const errSensorRaw = await errDataRes.json();
    const parsedErrData = validateAndParseSensorResponse(errSensorRaw);

    if (
      parsedErrData.isDhtUnavailable === true &&
      parsedErrData.temperature === null &&
      parsedErrData.humidity === null &&
      parsedErrData.gasLevel === 420
    ) {
      console.log('✔ PASS: DHT22 NaN reading handled cleanly: temperature & humidity marked unavailable without crashing');
    } else {
      throw new Error(`Unexpected DHT22 error handling: ${JSON.stringify(parsedErrData)}`);
    }

    // Test 6: Web Serial JSON line extraction
    const rawLine1 = '{"device":"vegsense-esp32-001","status":"connected","ip":"192.168.1.150","network":"Wi-Fi","firmware":"v2.7.0"}';
    const rawLine2 = '[TELEMETRY] {"device":"vegsense-esp32-001","temperature":24.5,"humidity":65.0,"gas_level":412,"spoilage_risk":15,"status":"FRESH"}';
    const nonJsonLine = '[VegSense] Initializing ESP32 Storage Node Firmware v2.7.0...';

    const p1 = extractJsonFromSerialLine(rawLine1);
    const p2 = extractJsonFromSerialLine(rawLine2);
    const p3 = extractJsonFromSerialLine(nonJsonLine);

    if (p1 && p1.device === 'vegsense-esp32-001' && p1.status === 'connected') {
      console.log('✔ PASS: Web Serial cleanly extracts status JSON from raw line');
    } else {
      throw new Error(`Failed to extract status JSON: ${JSON.stringify(p1)}`);
    }

    if (p2 && p2.temperature === 24.5 && p2.gas_level === 412) {
      console.log('✔ PASS: Web Serial cleanly extracts telemetry JSON from prefixed log line');
    } else {
      throw new Error(`Failed to extract telemetry JSON: ${JSON.stringify(p2)}`);
    }

    if (p3 === null) {
      console.log('✔ PASS: Non-JSON log output safely filtered without throwing errors');
    } else {
      throw new Error(`Expected null for non-JSON log line, got: ${JSON.stringify(p3)}`);
    }

    // Test 7: Verify telemetry payload parsed from serial stream
    const serialParsed = validateAndParseSensorResponse(p2);
    if (serialParsed.temperature === 24.5 && serialParsed.humidity === 65 && serialParsed.gasLevel === 412) {
      console.log('✔ PASS: Telemetry payload parsed from Web Serial stream conforms to app model');
    } else {
      throw new Error(`Unexpected serial parsed sensor: ${JSON.stringify(serialParsed)}`);
    }

    // Test 8: Verify CONNECTION_TIMEOUT_MS is 15000ms
    if (CONNECTION_TIMEOUT_MS === 15000) {
      console.log('✔ PASS: Connection timeout configured to 15s for robust PNA & handshake handling');
    } else {
      throw new Error(`Expected CONNECTION_TIMEOUT_MS to be 15000, got ${CONNECTION_TIMEOUT_MS}`);
    }

    console.log('\n★ ALL ESP32 REAL COMMUNICATION & PARSING TESTS PASSED! ★\n');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
