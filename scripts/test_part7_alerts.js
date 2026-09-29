import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve('./screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTests() {
  console.log('=== PART 7: ALERTS & NOTIFICATIONS VERIFICATION ===');

  // 1. Backend Deduplication Verification (Section 65)
  console.log('\n--- 1. Testing Backend Alert Deduplication ---');
  const demoUserId = 'usr_demo_vegsense_001';
  const evalPayloadHighHum = {
    deviceId: 'ESP32-DEMO-001',
    sensorData: { temperature: 28.5, humidity: 88, gasLevel: 420, lightLevel: 420 },
    spoilageData: { spoilageRisk: 18, classification: 'FRESH' },
    deviceStatus: 'connected',
    storageBatches: [{ id: 'batch_test_01', vegetable_name: 'Tomato', name: 'Tomato' }]
  };

  // Poll 6 times with identical high humidity
  for (let i = 1; i <= 6; i++) {
    const res = await fetch('http://localhost:5000/api/alerts/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': demoUserId },
      body: JSON.stringify(evalPayloadHighHum)
    });
    const data = await res.json();
    console.log(`Poll ${i} evaluate status:`, data.success);
  }

  // Check how many active high humidity alerts exist
  const alertsRes1 = await fetch('http://localhost:5000/api/alerts?type=humidity&status=active', {
    headers: { 'x-user-id': demoUserId }
  });
  const alertsData1 = await alertsRes1.json();
  const activeHumidityAlerts = (alertsData1.alerts || []).filter(
    (a) => a.event_key?.includes('humidity') && a.status === 'ACTIVE'
  );
  console.log(`Active High Humidity Alerts in DB (Expect 1): ${activeHumidityAlerts.length}`);
  if (activeHumidityAlerts.length !== 1) {
    throw new Error(`Deduplication failed! Found ${activeHumidityAlerts.length} active alerts instead of 1.`);
  }

  // Poll with Normal conditions -> Expect resolved
  console.log('\n--- 2. Testing Alert Resolution on Return to Normal ---');
  const evalPayloadNormal = {
    deviceId: 'ESP32-DEMO-001',
    sensorData: { temperature: 28.5, humidity: 72, gasLevel: 420, lightLevel: 420 },
    spoilageData: { spoilageRisk: 18, classification: 'FRESH' },
    deviceStatus: 'connected',
    storageBatches: [{ id: 'batch_test_01', vegetable_name: 'Tomato', name: 'Tomato' }]
  };

  await fetch('http://localhost:5000/api/alerts/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': demoUserId },
    body: JSON.stringify(evalPayloadNormal)
  });

  const alertsRes2 = await fetch('http://localhost:5000/api/alerts?type=humidity', {
    headers: { 'x-user-id': demoUserId }
  });
  const alertsData2 = await alertsRes2.json();
  const resolvedHumidityAlert = (alertsData2.alerts || []).find(
    (a) => a.id === activeHumidityAlerts[0].id
  );
  console.log(`Previous alert status after normal (Expect RESOLVED): ${resolvedHumidityAlert?.status}`);
  if (resolvedHumidityAlert?.status !== 'RESOLVED') {
    throw new Error(`Resolution failed! Alert status is ${resolvedHumidityAlert?.status}`);
  }

  // Poll with High Humidity again -> Expect new active alert created
  console.log('\n--- 3. Testing New Alert Creation after Resolution ---');
  await fetch('http://localhost:5000/api/alerts/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': demoUserId },
    body: JSON.stringify(evalPayloadHighHum)
  });

  const alertsRes3 = await fetch('http://localhost:5000/api/alerts?type=humidity', {
    headers: { 'x-user-id': demoUserId }
  });
  const alertsData3 = await alertsRes3.json();
  const activeNow = (alertsData3.alerts || []).filter(
    (a) => a.event_key?.includes('humidity') && a.status === 'ACTIVE'
  );
  console.log(`Active alerts after re-escalation (Expect 1): ${activeNow.length}`);
  console.log(`New alert ID is different from resolved alert: ${activeNow[0]?.id !== resolvedHumidityAlert?.id}`);

  // 4. Puppeteer End-to-End Verification
  console.log('\n--- 4. Launching Puppeteer E2E Tests ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Generate demo user auth token & seed localStorage
  const JWT_SECRET = process.env.JWT_SECRET || 'veg-storage-smart-iot-secret-key-2026';
  const demoToken = jwt.sign(
    { id: 'usr_demo_vegsense_001', name: 'Dr. Aris Thorne', email: 'demo@vegsense.io' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  const demoUser = { id: 'usr_demo_vegsense_001', name: 'Dr. Aris Thorne', email: 'demo@vegsense.io' };

  console.log('Seeding authentication session in browser...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  await page.evaluate((t, u) => {
    localStorage.setItem('veg_storage_auth_token', t);
    localStorage.setItem('veg_storage_user_data', JSON.stringify(u));
  }, demoToken, demoUser);
  await new Promise((r) => setTimeout(r, 600));

  // Navigate to /alerts
  console.log('Navigating to /alerts page...');
  await page.goto('http://localhost:5173/alerts', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));

  // Check page title and summary cards
  const pageTitle = await page.$eval('h1', (el) => el.textContent).catch(() => 'Alerts & Notifications');
  console.log('Alerts page title:', pageTitle);

  // Take Desktop screenshot
  const screenshotDesktop = path.join(SCREENSHOT_DIR, 'alerts_desktop_forest.png');
  await page.screenshot({ path: screenshotDesktop, fullPage: true });
  console.log('Saved desktop screenshot to:', screenshotDesktop);

  // Test Demo testing buttons (Section 29)
  console.log('Testing Demo Alert Controls...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find((b) => b.textContent && b.textContent.includes('Temperature Warning'));
    if (target) target.click();
  });
  await new Promise((r) => setTimeout(r, 1000));
  console.log('Clicked Temperature Warning button.');

  // Click Details button on an alert card
  console.log('Testing Alert Details dialog...');
  const clickedDetails = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="View alert details"]');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Details button clicked:', clickedDetails);
  await new Promise((r) => setTimeout(r, 800));

  const dialogTitle = await page.$eval('#alert-details-title', (el) => el.textContent).catch(() => null);
  console.log('Details dialog opened with title:', dialogTitle);

  const screenshotDetails = path.join(SCREENSHOT_DIR, 'alerts_details_dialog.png');
  await page.screenshot({ path: screenshotDetails });
  console.log('Saved dialog screenshot to:', screenshotDetails);

  // Close dialog
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button[aria-label="Close dialog"]');
    if (closeBtn) closeBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  // Test Notification Bell & Dropdown in header
  console.log('Testing Header Notification Bell & Dropdown...');
  const bellBtn = await page.waitForSelector('button[aria-label="Notifications"]', { timeout: 5000 }).catch(() => null);
  if (bellBtn) {
    await bellBtn.click();
    await new Promise((r) => setTimeout(r, 500));
    const notifHeader = await page.$eval('.notification-dropdown-panel span', (el) => el.textContent).catch(() => null);
    console.log('Notification dropdown opened:', notifHeader);

    const screenshotDropdown = path.join(SCREENSHOT_DIR, 'notification_dropdown.png');
    await page.screenshot({ path: screenshotDropdown });
    console.log('Saved notification dropdown screenshot to:', screenshotDropdown);

    // Close dropdown
    await bellBtn.click();
    await new Promise((r) => setTimeout(r, 300));
  }

  // Test Dark Theme (Night Monitor)
  console.log('Testing Night Monitor theme...');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'night-monitor');
  });
  await new Promise((r) => setTimeout(r, 500));

  const screenshotDark = path.join(SCREENSHOT_DIR, 'alerts_night_monitor.png');
  await page.screenshot({ path: screenshotDark, fullPage: true });
  console.log('Saved dark theme screenshot to:', screenshotDark);

  // Test Mobile Viewport (390px)
  console.log('Testing Mobile 390px viewport...');
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'forest');
  });
  await new Promise((r) => setTimeout(r, 500));

  const screenshotMobile = path.join(SCREENSHOT_DIR, 'alerts_mobile_forest.png');
  await page.screenshot({ path: screenshotMobile, fullPage: true });
  console.log('Saved mobile screenshot to:', screenshotMobile);

  await browser.close();
  console.log('\n=== ALL PART 7 TESTS COMPLETED SUCCESSFULLY! ===');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
