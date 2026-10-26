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
  console.log('VEGSENSE END-TO-END IOT, CLOUD API, & AUTH VERIFICATION SUITE');
  console.log(`Target Base URL: ${BASE_URL}`);
  console.log('================================================================\n');

  // 1. Health Check
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    if (res.status === 200 && data.status === 'ok') {
      recordResult('Health Endpoint', 'GET /api/health', 'PASS', `Status: 200, db: ${data.db || 'ok'}`);
    } else {
      recordResult('Health Endpoint', 'GET /api/health', 'FAIL', `Expected 200, got ${res.status}`);
    }
  } catch (err) {
    recordResult('Health Endpoint', 'GET /api/health', 'FAIL', err.message);
  }

  // 2. Device Provisioning Info
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

  // 3. Provision Dedicated Device Token
  let dedicatedToken = '';
  try {
    const res = await fetch(`${BASE_URL}/api/device/provision-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: 'ESP32-001', name: 'ESP32 Production Node' })
    });
    const data = await res.json();
    if (res.status === 201 && data.deviceToken) {
      dedicatedToken = data.deviceToken;
      recordResult('Device Provisioning', 'POST /api/device/provision-token', 'PASS', `Generated dedicated token: ${dedicatedToken.slice(0, 10)}...`);
    } else {
      recordResult('Device Provisioning', 'POST /api/device/provision-token', 'FAIL', `Status ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('Device Provisioning', 'POST /api/device/provision-token', 'FAIL', err.message);
  }

  // 4. Device Authentication - Missing Secret (Expect 401)
  try {
    const res = await fetch(`${BASE_URL}/api/readings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: 'ESP32-001', temperature: 24.5, humidity: 65, rawMQ135: 410 })
    });
    const data = await res.json();
    if (res.status === 401) {
      recordResult('Device Authentication', 'Rejection of missing credentials (POST /api/readings)', 'PASS', `Rejected HTTP 401 (${data.error}: ${data.message})`);
    } else {
      recordResult('Device Authentication', 'Rejection of missing credentials (POST /api/readings)', 'FAIL', `Expected 401, got ${res.status}`);
    }
  } catch (err) {
    recordResult('Device Authentication', 'Rejection of missing credentials (POST /api/readings)', 'FAIL', err.message);
  }

  // 5. Device Authentication - Invalid Secret (Expect 403)
  try {
    const res = await fetch(`${BASE_URL}/api/readings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'forged_unauthorized_key_99999999'
      },
      body: JSON.stringify({ deviceId: 'ESP32-001', temperature: 24.5, humidity: 65, rawMQ135: 410 })
    });
    const data = await res.json();
    if (res.status === 403) {
      recordResult('Device Authentication', 'Rejection of invalid credentials (POST /api/readings)', 'PASS', `Rejected HTTP 403 (${data.error})`);
    } else {
      recordResult('Device Authentication', 'Rejection of invalid credentials (POST /api/readings)', 'FAIL', `Expected 403, got ${res.status}`);
    }
  } catch (err) {
    recordResult('Device Authentication', 'Rejection of invalid credentials (POST /api/readings)', 'FAIL', err.message);
  }

  // 6. Device Authentication - Valid Dedicated Token via x-api-key header
  try {
    const res = await fetch(`${BASE_URL}/api/readings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': dedicatedToken
      },
      body: JSON.stringify({
        deviceId: 'ESP32-001',
        temperature: 24.8,
        humidity: 66.5,
        rawMQ135: 415,
        light: 395,
        timestamp: Date.now()
      })
    });
    const data = await res.json();
    if (res.status === 201 && data.success) {
      recordResult('Device Authentication', 'Validation with dedicated token (POST /api/readings)', 'PASS', `Accepted telemetry with HTTP 201, ID: ${data.id}`);
    } else {
      recordResult('Device Authentication', 'Validation with dedicated token (POST /api/readings)', 'FAIL', `Expected 201, got ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('Device Authentication', 'Validation with dedicated token (POST /api/readings)', 'FAIL', err.message);
  }

  // 7. Sensor Ingestion - With BH1750 Optional Light Installed
  try {
    const res = await fetch(`${BASE_URL}/api/sensors/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-token': dedicatedToken
      },
      body: JSON.stringify({
        deviceId: 'ESP32-001',
        temperature: 25.2,
        humidity: 68.0,
        rawMQ135: 420,
        light: 425,
        timestamp: Date.now()
      })
    });
    const data = await res.json();
    if (res.status === 201 && data.reading?.light_level === 425) {
      recordResult('Sensor Ingestion', 'Ingestion with optional BH1750 light present', 'PASS', `Stored light_level: ${data.reading.light_level} lux`);
    } else {
      recordResult('Sensor Ingestion', 'Ingestion with optional BH1750 light present', 'FAIL', `Response: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('Sensor Ingestion', 'Ingestion with optional BH1750 light present', 'FAIL', err.message);
  }

  // 8. Sensor Ingestion - BH1750 Light Sensor NOT Installed (Omitted in payload)
  try {
    const res = await fetch(`${BASE_URL}/api/readings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dedicatedToken}`
      },
      body: JSON.stringify({
        deviceId: 'ESP32-001',
        temperature: 25.4,
        humidity: 67.5,
        rawMQ135: 418,
        // light omitted deliberately
        timestamp: Date.now()
      })
    });
    const data = await res.json();
    if (res.status === 201 && (data.reading?.light_level === null || data.reading?.light_level === undefined)) {
      recordResult('Sensor Ingestion', 'Ingestion with BH1750 omitted (optional sensor)', 'PASS', `Gracefully handled missing light without crashing`);
    } else {
      recordResult('Sensor Ingestion', 'Ingestion with BH1750 omitted (optional sensor)', 'FAIL', `Response: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('Sensor Ingestion', 'Ingestion with BH1750 omitted (optional sensor)', 'FAIL', err.message);
  }

  // 9. Sensor Ingestion - DHT22 Sensor Read Failure Payload
  try {
    const res = await fetch(`${BASE_URL}/api/readings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': dedicatedToken
      },
      body: JSON.stringify({
        deviceId: 'ESP32-001',
        temperature: null,
        humidity: null,
        rawMQ135: 422,
        error: 'DHT22_READ_FAILED',
        timestamp: Date.now()
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

  // 10. Latest Reading API - Real Hardware Telemetry Verification
  try {
    const res = await fetch(`${BASE_URL}/api/sensors/current?deviceId=ESP32-001`);
    const data = await res.json();
    if (res.status === 200 && data.success && data.data) {
      const d = data.data;
      const isFresh = d.ageSeconds !== undefined && d.ageSeconds < 90;
      recordResult('Latest Readings API', 'GET /api/sensors/current?deviceId=ESP32-001', 'PASS', `Device: ${d.deviceId}, Status: ${d.device_status}, Age: ${d.ageSeconds}s, Stale: ${d.is_stale}`);
    } else {
      recordResult('Latest Readings API', 'GET /api/sensors/current?deviceId=ESP32-001', 'FAIL', `Unexpected response: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('Latest Readings API', 'GET /api/sensors/current?deviceId=ESP32-001', 'FAIL', err.message);
  }

  // 11. Historical Readings API
  try {
    const res = await fetch(`${BASE_URL}/api/sensors/history?deviceId=ESP32-001&limit=10`);
    const data = await res.json();
    if (res.status === 200 && data.success && Array.isArray(data.data) && data.data.length > 0) {
      recordResult('History API', 'GET /api/sensors/history?deviceId=ESP32-001', 'PASS', `Retrieved ${data.data.length} historical readings`);
    } else {
      recordResult('History API', 'GET /api/sensors/history?deviceId=ESP32-001', 'FAIL', `Unexpected response: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('History API', 'GET /api/sensors/history?deviceId=ESP32-001', 'FAIL', err.message);
  }

  // 12. Authentication - User Registration Weak Password (Expect 400)
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

  // 13. Authentication - User Registration Valid
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

  // 14. Authentication - Duplicate Registration Prevention (Expect 409)
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

  // 15. Authentication - Login
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

  // 16. Existing Storage Batches
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

  // 17. Existing Alerts
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

  // 18. Spoilage Summary Report PDF Generation & Download
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
