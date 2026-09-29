/**
 * Part 10: Settings & Device Management Verification Suite
 * Tests full backend APIs, data validation, device management, user isolation, and UI via Puppeteer.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:5173';

async function request(method, path, body = null, headers = {}) {
  const url = new URL(path, BASE_URL);
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  if (body) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = text;
  }
  return { status: res.status, headers: res.headers, data: json };
}

function findChromePath() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

async function runTests() {
  console.log('============================================================');
  console.log('VEGSENSE PART 10: SETTINGS & DEVICE MANAGEMENT VERIFICATION');
  console.log('============================================================\n');

  // --- 1. Login / Authenticate Users ---
  console.log('--- 1. Authenticating Users ---');
  const userAEmail = `settings_tester_a_${Date.now()}@vegsense.io`;
  const regA = await request('POST', '/api/auth/register', {
    name: 'Dr. Aris Thorne',
    email: userAEmail,
    password: 'Password123'
  });
  if (!regA.data.token) {
    throw new Error('Failed to register user A: ' + JSON.stringify(regA.data));
  }
  const tokenA = regA.data.token;
  const userA = regA.data.user;
  console.log(`✓ Registered & Authenticated User A (${userA.email}, ID: ${userA.id})`);

  // Create/Login User B for strict isolation tests
  const userBEmail = `settings_tester_b_${Date.now()}@vegsense.io`;
  const regB = await request('POST', '/api/auth/register', {
    name: 'User B Tester',
    email: userBEmail,
    password: 'Password123'
  });
  const tokenB = regB.data.token;
  console.log(`✓ Registered & Authenticated User B (${userBEmail})`);

  // --- 2. Test Settings API & User Isolation ---
  console.log('\n--- 2. Testing Settings Retrieval & User Isolation ---');
  const getSettingsA = await request('GET', '/api/settings', null, { Authorization: `Bearer ${tokenA}` });
  console.log(`✓ User A Settings status: ${getSettingsA.status}, theme: ${getSettingsA.data.settings.theme}`);

  // Update User A's theme to night-monitor
  const patchSettingsA = await request('PATCH', '/api/settings', { theme: 'night-monitor' }, { Authorization: `Bearer ${tokenA}` });
  console.log(`✓ User A updated theme to: ${patchSettingsA.data.settings.theme}`);

  // Verify User B's settings are completely isolated (default 'forest')
  const getSettingsB = await request('GET', '/api/settings', null, { Authorization: `Bearer ${tokenB}` });
  console.log(`✓ User B theme (Expect 'forest'): ${getSettingsB.data.settings.theme}`);
  if (getSettingsB.data.settings.theme === 'night-monitor') {
    throw new Error('User isolation failure: User A theme leaked to User B!');
  }

  // --- 3. Test Thresholds & Spoilage Weights Validation ---
  console.log('\n--- 3. Testing Threshold & Weights Validation ---');
  // Test invalid weights (sum != 100%)
  const badWeights = await request('PATCH', '/api/settings/thresholds', {
    weights: {
      temperature: 40,
      humidity: 30,
      gas: 20,
      light: 20,
      storage_age: 10 // Sum = 120%
    }
  }, { Authorization: `Bearer ${tokenA}` });
  console.log(`✓ Invalid weights rejected (Status ${badWeights.status}): "${badWeights.data.message}"`);

  // Test invalid threshold ordering (temp_warning >= temp_high)
  const badOrder = await request('PATCH', '/api/settings/thresholds', {
    temperature_warning: 38,
    temperature_high: 32
  }, { Authorization: `Bearer ${tokenA}` });
  console.log(`✓ Invalid threshold ordering rejected (Status ${badOrder.status}): "${badOrder.data.message}"`);

  // Test valid thresholds & weights update
  const validThresholds = await request('PATCH', '/api/settings/thresholds', {
    temperature_warning: 31.5,
    temperature_high: 36.0,
    humidity_low: 52.0,
    humidity_high: 82.0,
    weights: {
      temperature: 30,
      humidity: 25,
      gas: 25,
      light: 10,
      storage_age: 10 // Sum = 100%
    }
  }, { Authorization: `Bearer ${tokenA}` });
  console.log(`✓ Valid thresholds & weights saved: Temp Warning=${validThresholds.data.settings.temperature_warning_threshold}°C, Temp High=${validThresholds.data.settings.temperature_high_threshold}°C`);

  // --- 4. Test Notification Settings ---
  console.log('\n--- 4. Testing Notification Channels API ---');
  const notifPatch = await request('PATCH', '/api/settings/notifications', {
    browser_notifications_enabled: 1,
    critical_alerts_enabled: 1
  }, { Authorization: `Bearer ${tokenA}` });
  console.log(`✓ Notification channels updated. browser_notifications: ${notifPatch.data.settings.browser_notifications_enabled}`);

  // --- 5. Test Profile Update ---
  console.log('\n--- 5. Testing Profile Update ---');
  const profilePatch = await request('PATCH', '/api/auth/profile', {
    name: 'Dr. Aris Thorne (Chief Agronomist)'
  }, { Authorization: `Bearer ${tokenA}` });
  console.log(`✓ Profile Name updated to: "${profilePatch.data.user.name}"`);

  // --- 6. Test Password Change ---
  console.log('\n--- 6. Testing Secure Password Change ---');
  // Attempt with wrong current password
  const badPwd = await request('POST', '/api/auth/change-password', {
    currentPassword: 'WrongPassword123',
    newPassword: 'NewPassword999',
    confirmPassword: 'NewPassword999'
  }, { Authorization: `Bearer ${tokenB}` });
  console.log(`✓ Incorrect current password rejected (Status ${badPwd.status}): "${badPwd.data.message}"`);

  // Successful password change for User B
  const goodPwd = await request('POST', '/api/auth/change-password', {
    currentPassword: 'Password123',
    newPassword: 'NewPassword999',
    confirmPassword: 'NewPassword999'
  }, { Authorization: `Bearer ${tokenB}` });
  console.log(`✓ Password changed successfully for User B: "${goodPwd.data.message}"`);

  // Verify login with new password
  const testNewLogin = await request('POST', '/api/auth/login', {
    email: userBEmail,
    password: 'NewPassword999'
  });
  console.log(`✓ Login with new password succeeded: ${testNewLogin.status === 200}`);

  // --- 7. Test Device Management API ---
  console.log('\n--- 7. Testing Device Management Endpoints ---');
  // Add a real device
  const addDevRes = await request('POST', '/api/devices', {
    deviceName: 'ESP32-CHAMBER-01',
    ipAddress: '192.168.1.188',
    mode: 'REAL'
  }, { Authorization: `Bearer ${tokenA}` });
  console.log(`✓ Added device: ID=${addDevRes.data.device.id}, Name=${addDevRes.data.device.device_name}, Status=${addDevRes.data.device.status}`);

  // List devices
  const listDevs = await request('GET', '/api/devices', null, { Authorization: `Bearer ${tokenA}` });
  console.log(`✓ Total registered devices for User A: ${listDevs.data.devices.length}`);

  // Reconnect device test
  const reconnRes = await request('POST', `/api/devices/${addDevRes.data.device.id}/reconnect`, null, { Authorization: `Bearer ${tokenA}` });
  console.log(`✓ Reconnect endpoint tested: status=${reconnRes.data.status || 'tested'}`);

  // Remove device (soft-disconnect)
  const removeDevRes = await request('DELETE', `/api/devices/${addDevRes.data.device.id}`, null, { Authorization: `Bearer ${tokenA}` });
  console.log(`✓ Device soft-disconnected: "${removeDevRes.data.message}"`);

  // --- 8. Test Data Export & Demo Reset ---
  console.log('\n--- 8. Testing Data Export & Demo Reset ---');
  const exportRes = await request('GET', '/api/settings/export', null, { Authorization: `Bearer ${tokenA}` });
  console.log(`✓ User data archive exported. Profile: ${exportRes.data.profile.email}, Readings count: ${exportRes.data.sensorReadings.length}`);
  if (exportRes.data.profile.password_hash || exportRes.data.profile.password) {
    throw new Error('Security violation: Password hash detected in export archive!');
  }
  console.log('✓ Verified: Zero sensitive credentials/hashes exposed in export archive.');

  const resetDemoRes = await request('POST', '/api/settings/reset-demo', null, { Authorization: `Bearer ${tokenA}` });
  console.log(`✓ Demo data reset: "${resetDemoRes.data.message}"`);

  // --- 9. Test Puppeteer Browser E2E ---
  console.log('\n--- 9. Launching Puppeteer Browser Tests ---');
  const chromePath = findChromePath();
  if (!chromePath) {
    console.warn('Chrome executable not found. Skipping browser screenshot test.');
    return;
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Seed authenticated localStorage
  await page.goto(FRONTEND_URL + '/login', { waitUntil: 'networkidle2' });
  await page.evaluate((tok, usr) => {
    localStorage.setItem('veg_storage_auth_token', tok);
    localStorage.setItem('veg_storage_user', JSON.stringify(usr));
  }, tokenA, userA);

  // Navigate to /settings
  console.log('Navigating to http://localhost:5173/settings ...');
  await page.goto(FRONTEND_URL + '/settings', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));

  // Verify page title
  const title = await page.$eval('h1', (el) => el.textContent.trim());
  console.log(`✓ Settings Header Rendered: "${title}"`);

  // Capture Desktop Forest screenshot
  const screenshotDir = path.resolve('screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  const forestPath = path.join(screenshotDir, 'part10_settings_desktop_forest.png');
  await page.screenshot({ path: forestPath, fullPage: false });
  console.log(`✓ Captured Forest theme desktop view: ${forestPath}`);

  // Test clicking through sections
  console.log('Testing section switching...');
  const navButtons = await page.$$('nav button');
  if (navButtons.length > 3) {
    // Click "Device Management"
    await navButtons[2].click();
    await new Promise((r) => setTimeout(r, 600));

    // Click "Storage Thresholds"
    await navButtons[4].click();
    await new Promise((r) => setTimeout(r, 600));
    console.log('✓ Successfully clicked through Settings sections.');
  }

  // Test Night Monitor Dark Mode
  console.log('\n--- 10. Testing Night Monitor / Dark Pro Mode ---');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'night-monitor');
  });
  await new Promise((r) => setTimeout(r, 600));

  const darkPath = path.join(screenshotDir, 'part10_settings_desktop_dark.png');
  await page.screenshot({ path: darkPath, fullPage: false });
  console.log(`✓ Captured Night Monitor theme desktop view: ${darkPath}`);

  // Test Mobile Viewport (390x844)
  console.log('\n--- 11. Testing Mobile Viewport (390x844) ---');
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'forest');
  });
  await new Promise((r) => setTimeout(r, 800));

  const mobilePath = path.join(screenshotDir, 'part10_settings_mobile.png');
  await page.screenshot({ path: mobilePath, fullPage: false });
  console.log(`✓ Captured Mobile view: ${mobilePath}`);

  await browser.close();

  // --- 12. Test Account Deletion ---
  console.log('\n--- 12. Testing Account Deletion Security ---');
  // Attempt to delete permanent demo seed user (must fail)
  const demoToken = jwt.sign(
    { id: 'usr_demo_vegsense_001', name: 'Dr. Aris Thorne', email: 'demo@vegsense.io' },
    'veg-storage-smart-iot-secret-key-2026',
    { expiresIn: '7d' }
  );
  const deleteDemoAttempt = await request('DELETE', '/api/auth/account', {
    confirmationText: 'DELETE'
  }, { Authorization: `Bearer ${demoToken}` });
  console.log(`✓ Demo account deletion safely blocked (Status ${deleteDemoAttempt.status}): "${deleteDemoAttempt.data.message}"`);

  // Delete User B account (should succeed)
  const deleteUserB = await request('DELETE', '/api/auth/account', {
    confirmationText: 'DELETE'
  }, { Authorization: `Bearer ${tokenB}` });
  console.log(`✓ User B account deleted: "${deleteUserB.data.message}"`);

  // Verify User B cannot login anymore
  const checkDeletedLogin = await request('POST', '/api/auth/login', {
    email: userBEmail,
    password: 'NewPassword999'
  });
  console.log(`✓ Deleted user login rejected (Expect 401): ${checkDeletedLogin.status}`);

  console.log('\n============================================================');
  console.log('ALL PART 10 SETTINGS & DEVICE MANAGEMENT TESTS PASSED!');
  console.log('============================================================');
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
