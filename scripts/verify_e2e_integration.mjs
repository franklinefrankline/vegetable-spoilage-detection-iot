import fs from 'node:fs';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';
const results = [];

function recordResult(category, name, status, details = '') {
  const icon = status === 'PASS' ? '✔ PASS' : status === 'FAIL' ? '✘ FAIL' : '⊘ NOT TESTED';
  console.log(`[${category}] ${icon}: ${name}${details ? ` -> ${details}` : ''}`);
  results.push({ category, name, status, details });
}

async function runE2EVerification() {
  console.log('================================================================');
  console.log('VEGSENSE COMPREHENSIVE CLOUD IOT, SECURITY, & TELEMETRY SUITE');
  console.log(`Target Base URL: ${BASE_URL}`);
  console.log('================================================================\n');

  // 1. Health Check
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    if (res.status === 200 && data.status === 'ok') {
      recordResult('Health Endpoint', 'GET /api/health', 'PASS', `Status: 200, platform: ${data.platform || 'node'}`);
    } else {
      recordResult('Health Endpoint', 'GET /api/health', 'FAIL', `Expected 200, got ${res.status}`);
    }
  } catch (err) {
    recordResult('Health Endpoint', 'GET /api/health', 'FAIL', err.message);
  }

  // 2. Device Provisioning Information
  try {
    const res = await fetch(`${BASE_URL}/api/device/provision-info`);
    const data = await res.json();
    if (res.status === 200 && data.cloudIngestionUrl && data.authHeader) {
      recordResult('Device Provisioning', 'GET /api/device/provision-info', 'PASS', `Ingestion URL: ${data.cloudIngestionUrl}, Auth: ${data.authHeader}`);
    } else {
      recordResult('Device Provisioning', 'GET /api/device/provision-info', 'FAIL', `Status ${res.status}`);
    }
  } catch (err) {
    recordResult('Device Provisioning', 'GET /api/device/provision-info', 'FAIL', err.message);
  }

  // 3. Register Dedicated Device Credential (POST /api/devices/register)
  const testDeviceId = `vegsense-esp32-node-${Date.now().toString().slice(-4)}`;
  let deviceToken = '';
  try {
    const res = await fetch(`${BASE_URL}/api/devices/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: testDeviceId,
        deviceName: 'VegSense Production Test Node'
      })
    });
    const data = await res.json();
    if (res.status === 201 && data.deviceToken) {
      deviceToken = data.deviceToken;
      recordResult('Device Authentication', 'Register Dedicated Device (POST /api/devices/register)', 'PASS', `Issued secure token: ${deviceToken.slice(0, 10)}...`);
    } else {
      recordResult('Device Authentication', 'Register Dedicated Device (POST /api/devices/register)', 'FAIL', `Status ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('Device Authentication', 'Register Dedicated Device (POST /api/devices/register)', 'FAIL', err.message);
  }

  // 4. Device Authentication - Missing Credentials (Expect 401)
  try {
    const res = await fetch(`${BASE_URL}/api/device/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: testDeviceId, temperature: 24.5, humidity: 65, mqRaw: 410 })
    });
    const data = await res.json();
    if (res.status === 401) {
      recordResult('Device Authentication', 'Rejection of missing credentials (POST /api/device/ingest)', 'PASS', `Rejected HTTP 401 (${data.error}: ${data.message})`);
    } else {
      recordResult('Device Authentication', 'Rejection of missing credentials (POST /api/device/ingest)', 'FAIL', `Expected 401, got ${res.status}`);
    }
  } catch (err) {
    recordResult('Device Authentication', 'Rejection of missing credentials (POST /api/device/ingest)', 'FAIL', err.message);
  }

  // 5. Device Authentication - Invalid Key (Expect 403)
  try {
    const res = await fetch(`${BASE_URL}/api/device/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'forged_unauthorized_token_99999999'
      },
      body: JSON.stringify({ deviceId: testDeviceId, temperature: 24.5, humidity: 65, mqRaw: 410 })
    });
    const data = await res.json();
    if (res.status === 403) {
      recordResult('Device Authentication', 'Rejection of invalid credentials (POST /api/device/ingest)', 'PASS', `Rejected HTTP 403 (${data.error})`);
    } else {
      recordResult('Device Authentication', 'Rejection of invalid credentials (POST /api/device/ingest)', 'FAIL', `Expected 403, got ${res.status}`);
    }
  } catch (err) {
    recordResult('Device Authentication', 'Rejection of invalid credentials (POST /api/device/ingest)', 'FAIL', err.message);
  }

  // 6. Device Authentication - Valid Token Ingestion via POST /api/device/ingest
  try {
    const res = await fetch(`${BASE_URL}/api/device/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': deviceToken
      },
      body: JSON.stringify({
        deviceId: testDeviceId,
        temperature: 24.8,
        humidity: 66.5,
        mqRaw: 415,
        gasIndex: 10,
        risk: 18,
        health: 82,
        lightLevel: 395
      })
    });
    const data = await res.json();
    if (res.status === 201 && data.success) {
      recordResult('Device Authentication', 'Ingestion with verified token (POST /api/device/ingest)', 'PASS', `Accepted telemetry with HTTP 201, ID: ${data.readingId}`);
    } else {
      recordResult('Device Authentication', 'Ingestion with verified token (POST /api/device/ingest)', 'FAIL', `Expected 201, got ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('Device Authentication', 'Ingestion with verified token (POST /api/device/ingest)', 'FAIL', err.message);
  }

  // 7. Token Rotation (POST /api/devices/:deviceId/rotate-token)
  let rotatedToken = '';
  try {
    const res = await fetch(`${BASE_URL}/api/devices/${testDeviceId}/rotate-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (res.status === 200 && data.newDeviceToken) {
      rotatedToken = data.newDeviceToken;
      recordResult('Device Authentication', 'Rotate Device Token (POST /api/devices/:id/rotate-token)', 'PASS', `New token generated: ${rotatedToken.slice(0, 10)}...`);
    } else {
      recordResult('Device Authentication', 'Rotate Device Token (POST /api/devices/:id/rotate-token)', 'FAIL', `Expected 200, got ${res.status}`);
    }
  } catch (err) {
    recordResult('Device Authentication', 'Rotate Device Token (POST /api/devices/:id/rotate-token)', 'FAIL', err.message);
  }

  // 8. Rejection of Old Rotated Token (Expect 403)
  try {
    const res = await fetch(`${BASE_URL}/api/device/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': deviceToken // old token
      },
      body: JSON.stringify({ deviceId: testDeviceId, temperature: 24.5, humidity: 65, mqRaw: 410 })
    });
    if (res.status === 403) {
      recordResult('Device Authentication', 'Rejection of old rotated token (Expect HTTP 403)', 'PASS', `Previous token invalidated successfully`);
    } else {
      recordResult('Device Authentication', 'Rejection of old rotated token (Expect HTTP 403)', 'FAIL', `Expected 403, got ${res.status}`);
    }
  } catch (err) {
    recordResult('Device Authentication', 'Rejection of old rotated token (Expect HTTP 403)', 'FAIL', err.message);
  }

  // 9. Device Revocation (POST /api/devices/:deviceId/revoke)
  try {
    const res = await fetch(`${BASE_URL}/api/devices/${testDeviceId}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (res.status === 200 && data.status === 'REVOKED') {
      recordResult('Device Authentication', 'Revoke Device Credential (POST /api/devices/:id/revoke)', 'PASS', `Device marked REVOKED`);
    } else {
      recordResult('Device Authentication', 'Revoke Device Credential (POST /api/devices/:id/revoke)', 'FAIL', `Expected 200, got ${res.status}`);
    }
  } catch (err) {
    recordResult('Device Authentication', 'Revoke Device Credential (POST /api/devices/:id/revoke)', 'FAIL', err.message);
  }

  // 10. Rejection of Revoked Device Ingestion (Expect 403 DEVICE_REVOKED)
  try {
    const res = await fetch(`${BASE_URL}/api/device/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': rotatedToken
      },
      body: JSON.stringify({ deviceId: testDeviceId, temperature: 24.5, humidity: 65, mqRaw: 410 })
    });
    const data = await res.json();
    if (res.status === 403 && data.error === 'DEVICE_REVOKED') {
      recordResult('Device Authentication', 'Rejection of Revoked Device (HTTP 403 DEVICE_REVOKED)', 'PASS', `Blocked revoked device: ${data.message}`);
    } else {
      recordResult('Device Authentication', 'Rejection of Revoked Device (HTTP 403 DEVICE_REVOKED)', 'FAIL', `Expected 403 DEVICE_REVOKED, got ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('Device Authentication', 'Rejection of Revoked Device (HTTP 403 DEVICE_REVOKED)', 'FAIL', err.message);
  }

  // 11. Re-activate Device (POST /api/devices/:deviceId/activate)
  try {
    const res = await fetch(`${BASE_URL}/api/devices/${testDeviceId}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (res.status === 200 && data.status === 'ACTIVE') {
      recordResult('Device Authentication', 'Re-activate Device Credential (POST /api/devices/:id/activate)', 'PASS', `Device restored to ACTIVE`);
    } else {
      recordResult('Device Authentication', 'Re-activate Device Credential (POST /api/devices/:id/activate)', 'FAIL', `Expected 200, got ${res.status}`);
    }
  } catch (err) {
    recordResult('Device Authentication', 'Re-activate Device Credential (POST /api/devices/:id/activate)', 'FAIL', err.message);
  }

  // 12. Sensor Ingestion - With Optional BH1750 Light Installed
  try {
    const res = await fetch(`${BASE_URL}/api/device/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': rotatedToken
      },
      body: JSON.stringify({
        deviceId: testDeviceId,
        temperature: 25.2,
        humidity: 68.0,
        mqRaw: 420,
        gasIndex: 11,
        risk: 22,
        health: 78,
        lightLevel: 425
      })
    });
    const data = await res.json();
    if (res.status === 201 && data.metrics?.light_level === 425) {
      recordResult('Sensor Ingestion', 'Ingestion with optional BH1750 light present', 'PASS', `Stored light_level: ${data.metrics.light_level} lux`);
    } else {
      recordResult('Sensor Ingestion', 'Ingestion with optional BH1750 light present', 'FAIL', `Response: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('Sensor Ingestion', 'Ingestion with optional BH1750 light present', 'FAIL', err.message);
  }

  // 13. Sensor Ingestion - BH1750 Light Sensor NOT Installed (Omitted in payload)
  try {
    const res = await fetch(`${BASE_URL}/api/device/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': rotatedToken
      },
      body: JSON.stringify({
        deviceId: testDeviceId,
        temperature: 25.4,
        humidity: 67.5,
        mqRaw: 418,
        gasIndex: 10,
        risk: 20,
        health: 80
        // light omitted deliberately
      })
    });
    const data = await res.json();
    if (res.status === 201 && (data.metrics?.light_level === null || data.metrics?.light_level === undefined)) {
      recordResult('Sensor Ingestion', 'Ingestion with BH1750 omitted (optional sensor)', 'PASS', `Gracefully handled missing light without crashing`);
    } else {
      recordResult('Sensor Ingestion', 'Ingestion with BH1750 omitted (optional sensor)', 'FAIL', `Response: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('Sensor Ingestion', 'Ingestion with BH1750 omitted (optional sensor)', 'FAIL', err.message);
  }

  // 14. Sensor Ingestion - DHT22 Sensor Read Failure Payload
  try {
    const res = await fetch(`${BASE_URL}/api/device/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': rotatedToken
      },
      body: JSON.stringify({
        deviceId: testDeviceId,
        temperature: null,
        humidity: null,
        mqRaw: 422,
        gasIndex: 10,
        risk: 18,
        health: 82,
        error: 'DHT22_READ_FAILED'
      })
    });
    const data = await res.json();
    if (res.status === 201 && (data.reading?.is_temp_unavailable === 1 || data.metrics?.is_temp_unavailable === true)) {
      recordResult('Sensor Ingestion', 'Ingestion handling DHT22 sensor failure cleanly', 'PASS', `Logged unavailable sensor flag without crashing`);
    } else {
      recordResult('Sensor Ingestion', 'Ingestion handling DHT22 sensor failure cleanly', 'FAIL', `Response: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('Sensor Ingestion', 'Ingestion handling DHT22 sensor failure cleanly', 'FAIL', err.message);
  }

  // 15. Latest Reading Dedicated API (GET /api/devices/:deviceId/latest)
  try {
    const res = await fetch(`${BASE_URL}/api/devices/${testDeviceId}/latest`);
    const data = await res.json();
    if (res.status === 200 && data.success && data.data) {
      const d = data.data;
      recordResult('Latest Readings API', `GET /api/devices/${testDeviceId}/latest`, 'PASS', `Device: ${d.deviceId}, Status: ${d.status}, Health: ${d.health}, Stale: ${d.is_stale}`);
    } else {
      recordResult('Latest Readings API', `GET /api/devices/${testDeviceId}/latest`, 'FAIL', `Unexpected response: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('Latest Readings API', `GET /api/devices/${testDeviceId}/latest`, 'FAIL', err.message);
  }

  // 16. Historical Readings Dedicated API (GET /api/devices/:deviceId/history?limit=10)
  try {
    const res = await fetch(`${BASE_URL}/api/devices/${testDeviceId}/history?limit=10`);
    const data = await res.json();
    if (res.status === 200 && data.success && Array.isArray(data.data) && data.data.length > 0) {
      recordResult('History API', `GET /api/devices/${testDeviceId}/history`, 'PASS', `Retrieved ${data.data.length} historical readings (total: ${data.total})`);
    } else {
      recordResult('History API', `GET /api/devices/${testDeviceId}/history`, 'FAIL', `Unexpected response: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('History API', `GET /api/devices/${testDeviceId}/history`, 'FAIL', err.message);
  }

  // 17. Masked Device List - Security Check (GET /api/devices)
  try {
    const res = await fetch(`${BASE_URL}/api/devices`);
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data.devices)) {
      const found = data.devices.find((d) => d.id === testDeviceId);
      const isMasked = !found || !found.device_token || found.device_token_masked?.includes('****');
      if (isMasked) {
        recordResult('Device Security', 'Masked Device List (GET /api/devices)', 'PASS', `Tokens properly masked as ${found?.device_token_masked || 'hidden'}`);
      } else {
        recordResult('Device Security', 'Masked Device List (GET /api/devices)', 'FAIL', `Raw token leaked: ${found.device_token}`);
      }
    } else {
      recordResult('Device Security', 'Masked Device List (GET /api/devices)', 'FAIL', `Expected 200 array`);
    }
  } catch (err) {
    recordResult('Device Security', 'Masked Device List (GET /api/devices)', 'FAIL', err.message);
  }

  // 18. Authentication - User Registration Weak Password (Expect 400)
  const testEmail = `agronomist_${Date.now()}@vegsense.org`;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Agronomist',
        email: testEmail,
        password: 'weak',
        confirmPassword: 'weak'
      })
    });
    const data = await res.json();
    if (res.status === 400) {
      recordResult('Registration & Login', 'Registration - Weak Password Rejection', 'PASS', `Rejected with HTTP 400: ${data.message || data.error}`);
    } else {
      recordResult('Registration & Login', 'Registration - Weak Password Rejection', 'FAIL', `Expected 400, got ${res.status}`);
    }
  } catch (err) {
    recordResult('Registration & Login', 'Registration - Weak Password Rejection', 'FAIL', err.message);
  }

  // 19. Authentication - User Registration Valid
  let authToken = '';
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Agronomist',
        email: testEmail,
        password: 'SafeStoragePassword2026!',
        confirmPassword: 'SafeStoragePassword2026!'
      })
    });
    const data = await res.json();
    if (res.status === 201 && data.user) {
      authToken = data.token;
      recordResult('Registration & Login', 'Registration - Successful Creation', 'PASS', `Created user: ${data.user.email}`);
    } else {
      recordResult('Registration & Login', 'Registration - Successful Creation', 'FAIL', `Expected 201, got ${res.status}`);
    }
  } catch (err) {
    recordResult('Registration & Login', 'Registration - Successful Creation', 'FAIL', err.message);
  }

  // 20. Authentication - Duplicate Registration Prevention (Expect 409)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate User',
        email: testEmail,
        password: 'SafeStoragePassword2026!',
        confirmPassword: 'SafeStoragePassword2026!'
      })
    });
    const data = await res.json();
    if (res.status === 409) {
      recordResult('Registration & Login', 'Registration - Duplicate Prevention (HTTP 409)', 'PASS', `Prevented duplicate registration`);
    } else {
      recordResult('Registration & Login', 'Registration - Duplicate Prevention (HTTP 409)', 'FAIL', `Expected 409, got ${res.status}`);
    }
  } catch (err) {
    recordResult('Registration & Login', 'Registration - Duplicate Prevention (HTTP 409)', 'FAIL', err.message);
  }

  // 21. Authentication - Login
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'SafeStoragePassword2026!'
      })
    });
    const data = await res.json();
    if (res.status === 200 && data.token) {
      authToken = data.token;
      recordResult('Registration & Login', 'Authentication - Login (POST /api/auth/login)', 'PASS', `JWT Token issued`);
    } else {
      recordResult('Registration & Login', 'Authentication - Login (POST /api/auth/login)', 'FAIL', `Expected 200, got ${res.status}`);
    }
  } catch (err) {
    recordResult('Registration & Login', 'Authentication - Login (POST /api/auth/login)', 'FAIL', err.message);
  }

  // 22. Existing Storage Batches
  try {
    const res = await fetch(`${BASE_URL}/api/storage`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (res.status === 200 && (Array.isArray(data.items) || Array.isArray(data))) {
      const count = Array.isArray(data.items) ? data.items.length : data.length;
      recordResult('Existing Features', 'Storage Management (GET /api/storage)', 'PASS', `Preserved ${count} vegetable batches`);
    } else {
      recordResult('Existing Features', 'Storage Management (GET /api/storage)', 'FAIL', `Expected 200, got ${res.status}`);
    }
  } catch (err) {
    recordResult('Existing Features', 'Storage Management (GET /api/storage)', 'FAIL', err.message);
  }

  // 23. Existing Alerts
  try {
    const res = await fetch(`${BASE_URL}/api/alerts`);
    const data = await res.json();
    if (res.status === 200 && (Array.isArray(data.alerts) || Array.isArray(data))) {
      recordResult('Existing Features', 'Alerts Engine (GET /api/alerts)', 'PASS', `Alerts system operational`);
    } else {
      recordResult('Existing Features', 'Alerts Engine (GET /api/alerts)', 'FAIL', `Expected 200, got ${res.status}`);
    }
  } catch (err) {
    recordResult('Existing Features', 'Alerts Engine (GET /api/alerts)', 'FAIL', err.message);
  }

  // 24. Spoilage Summary Report PDF Generation & Download
  try {
    const genRes = await fetch(`${BASE_URL}/api/reports/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        report_type: 'COMPLETE_STORAGE',
        timeframe: 'ALL'
      })
    });
    const genData = await genRes.json();
    if (genRes.status === 201 && genData.report?.id) {
      const dlRes = await fetch(`${BASE_URL}/api/reports/${genData.report.id}/download`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const contentType = dlRes.headers.get('content-type') || '';
      if (dlRes.status === 200 && contentType.includes('application/pdf')) {
        const buffer = await dlRes.arrayBuffer();
        recordResult('Existing Features', 'PDF Report Generation (POST /api/reports/generate -> GET download)', 'PASS', `Generated & downloaded ${buffer.byteLength} byte PDF document`);
      } else {
        recordResult('Existing Features', 'PDF Report Generation (POST /api/reports/generate -> GET download)', 'FAIL', `Download failed: HTTP ${dlRes.status}`);
      }
    } else {
      recordResult('Existing Features', 'PDF Report Generation (POST /api/reports/generate)', 'FAIL', `Generation failed: HTTP ${genRes.status}: ${JSON.stringify(genData)}`);
    }
  } catch (err) {
    recordResult('Existing Features', 'PDF Report Generation', 'FAIL', err.message);
  }

  console.log('\n================================================================');
  console.log('SUMMARY OF ALL TEST RESULTS');
  console.log('================================================================');
  const passes = results.filter((r) => r.status === 'PASS').length;
  const fails = results.filter((r) => r.status === 'FAIL').length;
  console.log(`TOTAL TESTS: ${results.length} | PASS: ${passes} | FAIL: ${fails}`);
  console.log('================================================================\n');

  if (fails > 0) {
    process.exit(1);
  }
}

runE2EVerification();
