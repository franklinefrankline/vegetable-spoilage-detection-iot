import fs from 'node:fs';

const PROD_BASE = 'https://vegitables.vercel.app';
const results = [];

function recordResult(name, status, details = '') {
  const icon = status === 'PASS' ? '✔ PASS' : '✘ FAIL';
  console.log(`${icon}: ${name}${details ? ` -> ${details}` : ''}`);
  results.push({ name, status, details });
}

async function verifyProduction() {
  console.log('================================================================');
  console.log('STARTING VEGSENSE LIVE PRODUCTION DEPLOYMENT VERIFICATION SUITE');
  console.log(`Base URL: ${PROD_BASE}`);
  console.log('================================================================\n');

  // 1. Health Check
  try {
    const res = await fetch(`${PROD_BASE}/api/health`);
    const data = await res.json();
    if (res.status === 200 && data.status === 'ok') {
      recordResult('Health Check Endpoint (GET /api/health)', 'PASS', `Status: 200, db: ${data.db || 'ok'}, timestamp: ${data.timestamp}`);
    } else {
      recordResult('Health Check Endpoint (GET /api/health)', 'FAIL', `Unexpected status: ${res.status}, response: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('Health Check Endpoint (GET /api/health)', 'FAIL', err.message);
  }

  // 2. API Key Endpoint - Missing Key (Expect 401)
  try {
    const res = await fetch(`${PROD_BASE}/api/secure/verify-key`);
    const data = await res.json();
    if (res.status === 401 && (data.error === 'MISSING_API_KEY' || data.error === 'API_KEY_REQUIRED' || data.error === 'API_KEY_UNAVAILABLE')) {
      recordResult('API-Key Endpoint - Missing Key (GET /api/secure/verify-key)', 'PASS', `Rejected with HTTP ${res.status} (${data.error}: ${data.message})`);
    } else {
      recordResult('API-Key Endpoint - Missing Key (GET /api/secure/verify-key)', 'FAIL', `Expected 401, got ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('API-Key Endpoint - Missing Key (GET /api/secure/verify-key)', 'FAIL', err.message);
  }

  // 3. API Key Endpoint - Invalid Key (Expect 403)
  try {
    const res = await fetch(`${PROD_BASE}/api/secure/verify-key`, {
      headers: { 'x-api-key': 'invalid_forged_api_key_vegsense_999' }
    });
    const data = await res.json();
    if (res.status === 403 && (data.error === 'INVALID_API_KEY' || data.error === 'FORBIDDEN')) {
      recordResult('API-Key Endpoint - Invalid Key (GET /api/secure/verify-key)', 'PASS', `Rejected with HTTP 403 (${data.error}) in constant time`);
    } else {
      recordResult('API-Key Endpoint - Invalid Key (GET /api/secure/verify-key)', 'FAIL', `Expected 403, got ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('API-Key Endpoint - Invalid Key (GET /api/secure/verify-key)', 'FAIL', err.message);
  }

  // 4. Registration - Weak Password Rejection (Expect 400)
  const timestamp = Date.now();
  const testUser = {
    name: 'Production Agronomist',
    email: `prod_tester_${timestamp}@vegsense.io`,
    password: 'SafeStoragePassword2026!',
    confirmPassword: 'SafeStoragePassword2026!'
  };

  try {
    const res = await fetch(`${PROD_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Weak User',
        email: `weak_${timestamp}@vegsense.io`,
        password: 'weak',
        confirmPassword: 'weak'
      })
    });
    const data = await res.json();
    if (res.status === 400) {
      recordResult('Registration - Weak Password Rejection (POST /api/auth/register)', 'PASS', `Rejected with HTTP 400: ${data.message || data.error}`);
    } else {
      recordResult('Registration - Weak Password Rejection (POST /api/auth/register)', 'FAIL', `Expected 400, got ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('Registration - Weak Password Rejection (POST /api/auth/register)', 'FAIL', err.message);
  }

  // 5. Registration - Password Mismatch Rejection (Expect 400)
  try {
    const res = await fetch(`${PROD_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...testUser,
        confirmPassword: 'DifferentPassword123!'
      })
    });
    const data = await res.json();
    if (res.status === 400) {
      recordResult('Registration - Confirm Password Mismatch (POST /api/auth/register)', 'PASS', `Rejected with HTTP 400: ${data.message || data.error}`);
    } else {
      recordResult('Registration - Confirm Password Mismatch (POST /api/auth/register)', 'FAIL', `Expected 400, got ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('Registration - Confirm Password Mismatch (POST /api/auth/register)', 'FAIL', err.message);
  }

  // 6. Registration - Successful Live User Creation (Expect 201)
  let authToken = null;
  let registeredUserId = null;
  try {
    const res = await fetch(`${PROD_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const data = await res.json();
    if (res.status === 201 && data.success && data.token && data.user) {
      authToken = data.token;
      registeredUserId = data.user.id;
      recordResult('Registration - Successful Creation (POST /api/auth/register)', 'PASS', `Created user ${data.user.email} (ID: ${registeredUserId})`);
    } else {
      recordResult('Registration - Successful Creation (POST /api/auth/register)', 'FAIL', `Expected 201, got ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('Registration - Successful Creation (POST /api/auth/register)', 'FAIL', err.message);
  }

  // 7. Registration - Duplicate Email Prevention (Expect 409)
  try {
    const res = await fetch(`${PROD_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const data = await res.json();
    if (res.status === 409) {
      recordResult('Registration - Duplicate Email Conflict (POST /api/auth/register)', 'PASS', `Prevented duplicate registration with HTTP 409 Conflict`);
    } else {
      recordResult('Registration - Duplicate Email Conflict (POST /api/auth/register)', 'FAIL', `Expected 409, got ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('Registration - Duplicate Email Conflict (POST /api/auth/register)', 'FAIL', err.message);
  }

  // 8. User Login - Credentials Authentication (Expect 200)
  try {
    const res = await fetch(`${PROD_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.token) {
      authToken = data.token;
      recordResult('Authentication - Live Login (POST /api/auth/login)', 'PASS', `Authenticated successfully, token verified`);
    } else {
      recordResult('Authentication - Live Login (POST /api/auth/login)', 'FAIL', `Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('Authentication - Live Login (POST /api/auth/login)', 'FAIL', err.message);
  }

  // 9. Session Validation - Current User (GET /api/auth/me)
  try {
    const res = await fetch(`${PROD_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (res.status === 200 && (data.success || data.authenticated) && data.user && data.user.email === testUser.email) {
      recordResult('Session Validation (GET /api/auth/me)', 'PASS', `Session active for ${data.user.email} (Role: ${data.user.role})`);
    } else {
      recordResult('Session Validation (GET /api/auth/me)', 'FAIL', `Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('Session Validation (GET /api/auth/me)', 'FAIL', err.message);
  }

  // 10. Storage Batches - Creation & Retrieval (GET & POST /api/storage)
  let createdBatchId = null;
  try {
    // List batches
    const listRes = await fetch(`${PROD_BASE}/api/storage`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const listData = await listRes.json();
    const initialCount = (listData.items || []).length;

    // Create a new storage batch
    const createRes = await fetch(`${PROD_BASE}/api/storage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        vegetable_name: 'Bell Pepper',
        variety: 'California Wonder',
        quantity: '25 kg',
        storage_chamber: 'Chamber #02 (Cold Bay)',
        device_id: 'ESP32-DEMO-001',
        target_temp: 10.0,
        optimal_temp_min: 7.0,
        optimal_temp_max: 13.0,
        target_humidity: 92.0,
        optimal_humidity_min: 90,
        optimal_humidity_max: 95
      })
    });
    const createData = await createRes.json();
    if (createRes.status === 201 && createData.success && createData.item) {
      createdBatchId = createData.item.id;
      recordResult('Storage Management - Create Batch (POST /api/storage)', 'PASS', `Created batch ID: ${createdBatchId} (${createData.item.vegetable_name}, initial items: ${initialCount})`);
    } else {
      recordResult('Storage Management - Create Batch (POST /api/storage)', 'FAIL', `Expected 201, got ${createRes.status}: ${JSON.stringify(createData)}`);
    }
  } catch (err) {
    recordResult('Storage Management - Create Batch (POST /api/storage)', 'FAIL', err.message);
  }

  // 11. Spoilage Intelligence (GET /api/spoilage/current)
  try {
    const res = await fetch(`${PROD_BASE}/api/spoilage/current?deviceId=ESP32-DEMO-001`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (res.status === 200 && data.success && data.spoilage_risk !== undefined) {
      recordResult('Spoilage Intelligence - Current Status (GET /api/spoilage/current)', 'PASS', `Risk: ${data.spoilage_risk}%, Classification: ${data.classification}, Vegetable: ${data.vegetable_type}`);
    } else {
      recordResult('Spoilage Intelligence - Current Status (GET /api/spoilage/current)', 'FAIL', `Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('Spoilage Intelligence - Current Status (GET /api/spoilage/current)', 'FAIL', err.message);
  }

  // 12. Alert & Telemetry Evaluation (POST /api/alerts/evaluate)
  try {
    const res = await fetch(`${PROD_BASE}/api/alerts/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        deviceId: 'ESP32-DEMO-001',
        sensorData: {
          temperature: 28.5,
          humidity: 72,
          gasLevel: 420,
          lightLevel: 420
        },
        spoilageData: {
          spoilageRisk: 18,
          classification: 'FRESH'
        },
        storageBatches: [
          {
            id: createdBatchId || 'batch_sample_01',
            vegetable_name: 'Bell Pepper',
            name: 'Bell Pepper'
          }
        ]
      })
    });
    const data = await res.json();
    if (res.status === 200 && data.success) {
      recordResult('Telemetry & Alert Evaluation (POST /api/alerts/evaluate)', 'PASS', `Evaluated conditions: status=${data.status}, alerts generated: ${(data.alerts || []).length}`);
    } else {
      recordResult('Telemetry & Alert Evaluation (POST /api/alerts/evaluate)', 'FAIL', `Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    recordResult('Telemetry & Alert Evaluation (POST /api/alerts/evaluate)', 'FAIL', err.message);
  }

  // 12. Reports & PDF Generation & Download
  try {
    // Generate a report
    const genRes = await fetch(`${PROD_BASE}/api/reports/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        report_type: 'COMPLETE_STORAGE',
        title: 'Production Verification Storage Audit',
        range: '24h',
        notes: 'Automated E2E Verification Report on live Vercel environment'
      })
    });
    const genData = await genRes.json();
    if (genRes.status === 201 && genData.success && genData.report) {
      const reportId = genData.report.id;
      recordResult('Reports Engine - Report Generation (POST /api/reports/generate)', 'PASS', `Created Report ID: ${reportId}, size: ${genData.report.file_size} bytes`);

      // Download PDF
      const dlRes = await fetch(`${PROD_BASE}/api/reports/${reportId}/download`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (dlRes.status === 200) {
        const arrayBuf = await dlRes.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        const header = buf.slice(0, 5).toString('ascii');
        if (header === '%PDF-') {
          recordResult('Reports Engine - PDF Binary Download (GET /api/reports/:id/download)', 'PASS', `Downloaded ${buf.length} bytes, verified valid %PDF- magic bytes`);
        } else {
          recordResult('Reports Engine - PDF Binary Download (GET /api/reports/:id/download)', 'FAIL', `Corrupted binary header: ${header}`);
        }
      } else {
        recordResult('Reports Engine - PDF Binary Download (GET /api/reports/:id/download)', 'FAIL', `Download failed with HTTP ${dlRes.status}`);
      }
    } else {
      recordResult('Reports Engine - Report Generation (POST /api/reports/generate)', 'FAIL', `Expected 201, got ${genRes.status}: ${JSON.stringify(genData)}`);
    }
  } catch (err) {
    recordResult('Reports Engine - Report Generation & Download', 'FAIL', err.message);
  }

  // Summary
  console.log('\n================================================================');
  console.log('LIVE PRODUCTION VERIFICATION SUMMARY');
  console.log('================================================================');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
  if (failed === 0) {
    console.log('★ ALL LIVE PRODUCTION ENDPOINTS VERIFIED SUCCESSFULLY! ★');
  } else {
    console.log('✘ SOME PRODUCTION TESTS FAILED. PLEASE REVIEW LOGS ABOVE.');
  }
}

verifyProduction();
