import express from 'express';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { verifyApiKey, requireApiKey, requireAuthOrApiKey } from '../server/apiKeyMiddleware.js';
import { getJwtSecret } from '../server/jwtConfig.js';

const logPass = (name) => console.log(`\x1b[32m✔ PASS: ${name}\x1b[0m`);
const logFail = (name, err) => {
  console.error(`\x1b[31m✘ FAIL: ${name}\x1b[0m`, err);
  process.exit(1);
};

async function runApiKeyTests() {
  console.log('====================================================');
  console.log('RUNNING VEGSENSE API-KEY & AUTH VERIFICATION TESTS');
  console.log('====================================================\n');

  const TEST_API_KEY = 'vegsense_prod_sec_key_test_99218204';
  const TEST_JWT_SECRET = 'vegsense_prod_jwt_secret_test_1234567890';
  process.env.VEGSENSE_API_KEY = TEST_API_KEY;
  process.env.JWT_SECRET = TEST_JWT_SECRET;

  try {
    // ---------------------------------------------------------
    // 1. Direct Constant-Time Comparison Unit Tests
    // ---------------------------------------------------------
    if (verifyApiKey(TEST_API_KEY, TEST_API_KEY)) {
      logPass('Constant-time verifyApiKey accepts exact matching key');
    } else {
      throw new Error('Exact key should match');
    }

    if (!verifyApiKey('wrong_api_key_attempt', TEST_API_KEY)) {
      logPass('Constant-time verifyApiKey rejects mismatched key');
    } else {
      throw new Error('Mismatched key should fail');
    }

    if (!verifyApiKey(TEST_API_KEY.slice(0, 10), TEST_API_KEY)) {
      logPass('Constant-time verifyApiKey rejects prefix/partial match without leaking');
    } else {
      throw new Error('Partial key should fail');
    }

    if (!verifyApiKey('', TEST_API_KEY) && !verifyApiKey(null, TEST_API_KEY)) {
      logPass('Constant-time verifyApiKey handles null or empty input safely');
    } else {
      throw new Error('Empty/null key should fail');
    }

    // ---------------------------------------------------------
    // 2. HTTP Server Middleware Integration Tests
    // ---------------------------------------------------------
    const app = express();
    app.use(express.json());

    // Public health check
    app.get(['/api/health', '/health'], (req, res) => {
      res.json({ status: 'ok', service: 'Test Health' });
    });

    // API Key Protected route
    app.get('/api/secure/verify-key', requireApiKey, (req, res) => {
      res.json({ success: true, message: 'API key verified.' });
    });

    // Dual Auth route (accepts JWT or API Key)
    app.post('/api/sensors/record', requireAuthOrApiKey, (req, res) => {
      res.json({ success: true, recorded: true, user: req.user || 'apiKeyClient' });
    });

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    // Test 2.1: Public health check remains accessible without any key
    let res = await fetch(`${baseUrl}/api/health`);
    let data = await res.json();
    if (res.status === 200 && data.status === 'ok') {
      logPass('Public health check remains accessible without API key');
    } else {
      throw new Error(`Expected 200 for health check, got ${res.status}`);
    }

    // Test 2.2: Missing API key rejected with HTTP 401
    res = await fetch(`${baseUrl}/api/secure/verify-key`);
    data = await res.json();
    if (res.status === 401 && data.error === 'MISSING_API_KEY') {
      logPass('API-key protected route rejects request missing x-api-key with HTTP 401');
    } else {
      throw new Error(`Expected 401 for missing key, got ${res.status}: ${JSON.stringify(data)}`);
    }

    // Test 2.3: Incorrect API key rejected with HTTP 403
    res = await fetch(`${baseUrl}/api/secure/verify-key`, {
      headers: { 'x-api-key': 'invalid_random_key_attempt' }
    });
    data = await res.json();
    if (res.status === 403 && data.error === 'INVALID_API_KEY') {
      logPass('API-key protected route rejects incorrect key with HTTP 403');
    } else {
      throw new Error(`Expected 403 for invalid key, got ${res.status}`);
    }

    // Test 2.4: Correct API key accepted with HTTP 200
    res = await fetch(`${baseUrl}/api/secure/verify-key`, {
      headers: { 'x-api-key': TEST_API_KEY }
    });
    data = await res.json();
    if (res.status === 200 && data.success && data.message === 'API key verified.') {
      logPass('API-key protected route accepts valid key with HTTP 200');
    } else {
      throw new Error(`Expected 200 for valid key, got ${res.status}: ${JSON.stringify(data)}`);
    }

    // Test 2.5: Missing production secret fails closed
    delete process.env.VEGSENSE_API_KEY;
    res = await fetch(`${baseUrl}/api/secure/verify-key`, {
      headers: { 'x-api-key': TEST_API_KEY }
    });
    data = await res.json();
    if (res.status === 401 && data.error === 'API_KEY_UNAVAILABLE') {
      logPass('Missing production secret fails closed (HTTP 401 API_KEY_UNAVAILABLE)');
    } else {
      throw new Error(`Expected fail closed 401 when key unconfigured, got ${res.status}`);
    }
    // Restore key
    process.env.VEGSENSE_API_KEY = TEST_API_KEY;

    // Test 2.6: Dual auth route accepts valid API key
    res = await fetch(`${baseUrl}/api/sensors/record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TEST_API_KEY
      },
      body: JSON.stringify({ temperature: 22.5, humidity: 65 })
    });
    data = await res.json();
    if (res.status === 200 && data.success) {
      logPass('Dual auth route allows valid API key (IoT telemetry)');
    } else {
      throw new Error(`Dual auth with API key failed: ${res.status}`);
    }

    // Test 2.7: Dual auth route accepts valid Bearer JWT
    const testJwt = jwt.sign({ id: 'usr_test_1', email: 'test@vegsense.io' }, getJwtSecret(), { expiresIn: '1h' });
    res = await fetch(`${baseUrl}/api/sensors/record`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testJwt}`
      },
      body: JSON.stringify({ temperature: 22.5, humidity: 65 })
    });
    data = await res.json();
    if (res.status === 200 && data.success && data.user.id === 'usr_test_1') {
      logPass('Dual auth route allows valid Bearer JWT (Browser session)');
    } else {
      throw new Error(`Dual auth with JWT failed: ${res.status}`);
    }

    // Test 2.8: Dual auth route rejects request without JWT and without API key
    res = await fetch(`${baseUrl}/api/sensors/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temperature: 22.5, humidity: 65 })
    });
    data = await res.json();
    if (res.status === 401) {
      logPass('Dual auth route rejects request lacking both JWT and API key');
    } else {
      throw new Error(`Expected 401 for unauthenticated dual route, got ${res.status}`);
    }

    await new Promise((resolve) => server.close(resolve));

    console.log('\n====================================================');
    console.log('★ ALL 8 API-KEY & AUTH INTEGRATION TESTS PASSED! ★');
    console.log('====================================================\n');
  } catch (err) {
    logFail('API-Key test suite', err);
  }
}

runApiKeyTests();
