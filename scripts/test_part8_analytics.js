import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve('./screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runPart8Tests() {
  console.log('============================================================');
  console.log('VEGSENSE PART 8: HISTORY & ANALYTICS VERIFICATION SUITE');
  console.log('============================================================\n');

  const demoUserId = 'usr_demo_vegsense_001';
  const JWT_SECRET = process.env.JWT_SECRET || 'veg-storage-smart-iot-secret-key-2026';
  const authToken = jwt.sign(
    { id: demoUserId, name: 'Dr. Aris Thorne', email: 'demo@vegsense.io' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const authHeaders = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  // 1. Backend API Verification
  console.log('--- 1. Testing Backend Analytics Endpoints ---');

  // Summary
  const summaryRes = await fetch('http://localhost:5000/api/analytics/summary?range=24h', { headers: authHeaders });
  if (!summaryRes.ok) throw new Error(`Summary failed: ${summaryRes.status}`);
  const summary = await summaryRes.json();
  console.log('✓ /summary response received:');
  console.log(`  - Data points: ${summary.data_points}`);
  console.log(`  - Avg Temp: ${summary.average_temperature}°C (Min: ${summary.min_temperature}, Max: ${summary.max_temperature})`);
  console.log(`  - Avg Humidity: ${summary.average_humidity}% (Min: ${summary.min_humidity}, Max: ${summary.max_humidity})`);
  console.log(`  - Avg Gas/VOC: ${summary.average_gas}`);
  console.log(`  - Avg Light: ${summary.average_light} lx`);
  console.log(`  - Avg Spoilage Risk: ${summary.average_spoilage_risk}%`);
  console.log(`  - Total Alerts: ${summary.total_alerts}, Critical: ${summary.critical_alerts}`);

  if (summary.data_points === 0) {
    throw new Error('Expected persistent data points in database, got 0!');
  }

  // Sensors Timeseries & Aggregation
  const sensors24hRes = await fetch('http://localhost:5000/api/analytics/sensors?range=24h', { headers: authHeaders });
  const sensors24h = await sensors24hRes.json();
  console.log(`✓ /sensors (24h) points: Temp=${sensors24h.temperature_points?.length}, Hum=${sensors24h.humidity_points?.length}, Aggregation=${sensors24h.aggregation}`);

  const sensors7dRes = await fetch('http://localhost:5000/api/analytics/sensors?range=7d', { headers: authHeaders });
  const sensors7d = await sensors7dRes.json();
  console.log(`✓ /sensors (7d server aggregation): points=${sensors7d.temperature_points?.length}, Aggregation=${sensors7d.aggregation}`);

  // Spoilage Trend
  const spoilageRes = await fetch('http://localhost:5000/api/analytics/spoilage?range=24h', { headers: authHeaders });
  const spoilage = await spoilageRes.json();
  console.log(`✓ /spoilage points: ${spoilage.points?.length}, Trend: ${spoilage.stats?.trend}, Dist: Fresh=${spoilage.distribution?.fresh}%, Warning=${spoilage.distribution?.warning}%`);

  // Alerts Analytics
  const alertsRes = await fetch('http://localhost:5000/api/analytics/alerts?range=24h', { headers: authHeaders });
  const alertsData = await alertsRes.json();
  console.log(`✓ /alerts analytics: Total=${alertsData.summary?.total_alerts}, Active=${alertsData.summary?.active_alerts}, Resolved=${alertsData.summary?.resolved_alerts}`);
  console.log(`  - Resolution time display: ${alertsData.resolution?.avg_resolution_display}`);

  // Storage Analytics
  const storageRes = await fetch('http://localhost:5000/api/analytics/storage', { headers: authHeaders });
  const storage = await storageRes.json();
  console.log(`✓ /storage analytics: Batches=${storage.summary?.total_batches}, Active=${storage.summary?.active_batches}, Mass=${storage.summary?.total_quantity_kg}kg`);

  // Comparison
  const compRes = await fetch('http://localhost:5000/api/analytics/comparison?range=24h', { headers: authHeaders });
  const comp = await compRes.json();
  console.log(`✓ /comparison analytics: Current Temp=${comp.current_period?.average_temperature}°C, Prev=${comp.previous_period?.average_temperature}°C, Diff=${comp.difference?.temperature_diff}°C`);

  // 2. Demo Reset & Re-seed
  console.log('\n--- 2. Testing Demo History Reset & Baseline Re-seed ---');
  const resetRes = await fetch('http://localhost:5000/api/analytics/reset-demo', {
    method: 'POST',
    headers: authHeaders
  });
  const resetData = await resetRes.json();
  console.log(`✓ Reset response: success=${resetData.success}, reseeded_points=${resetData.reseeded_points}`);
  if (!resetData.success || resetData.reseeded_points < 10) {
    throw new Error('Reset demo history failed to reseed baseline!');
  }

  // 3. Puppeteer Frontend End-to-End Verification
  console.log('\n--- 3. Launching Puppeteer Browser Tests ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,1050']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1050 });

  // Inject authentication into browser localStorage
  console.log('Navigating to app and setting auth state...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  await page.evaluate((token, user) => {
    localStorage.setItem('veg_storage_auth_token', token);
    localStorage.setItem('veg_storage_user', JSON.stringify(user));
  }, authToken, { id: demoUserId, name: 'Dr. Aris Thorne', email: 'demo@vegsense.io' });

  // Navigate to /analytics
  console.log('Navigating to http://localhost:5173/analytics ...');
  await page.goto('http://localhost:5173/analytics', { waitUntil: 'networkidle2' });

  // Wait for analytics elements to render
  await page.waitForSelector('h1', { timeout: 10000 });
  const pageTitle = await page.$eval('h1', el => el.textContent.trim());
  console.log(`✓ Analytics Header Rendered: "${pageTitle}"`);

  // Wait for summary cards to render with data
  await page.waitForSelector('.vegsense-card', { timeout: 8000 });

  // Verify KPI cards
  const kpiCount = await page.$$eval('.vegsense-card', cards => cards.length);
  console.log(`✓ Rendered ${kpiCount} cards across analytics dashboard`);

  // Capture Desktop Screenshot - Forest Theme
  const screenshotForest = path.join(SCREENSHOT_DIR, 'part8_analytics_desktop_forest.png');
  await page.screenshot({ path: screenshotForest, fullPage: true });
  console.log(`✓ Captured Forest theme desktop view: ${screenshotForest}`);

  // Test Sensor Tab Switching
  console.log('\n--- 4. Testing Sensor History Tab Interactions ---');
  // Click Humidity Tab
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Relative Humidity') || text.includes('Humidity')) {
      await btn.click();
      console.log('✓ Clicked Humidity tab');
      break;
    }
  }
  await new Promise(r => setTimeout(r, 600));

  // Click Gas/VOC Tab
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Gas/VOC Indicator') || text.includes('Gas')) {
      await btn.click();
      console.log('✓ Clicked Gas/VOC Indicator tab');
      break;
    }
  }
  await new Promise(r => setTimeout(r, 600));

  // Click Light Level Tab
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Light Level') || text.includes('Light')) {
      await btn.click();
      console.log('✓ Clicked Light Level tab');
      break;
    }
  }
  await new Promise(r => setTimeout(r, 600));

  // Test Theme Switch to Night Monitor (Dark Mode)
  console.log('\n--- 5. Testing Night Monitor / Dark Pro Mode ---');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'night-monitor');
    document.documentElement.setAttribute('data-accent', 'green');
    localStorage.setItem('vegsense_appearance_settings', JSON.stringify({
      theme: 'night-monitor',
      accent: 'green',
      layout: 'comfortable',
      sidebarMode: 'expanded',
      animation: 'subtle',
      cardStyle: 'rounded',
      fontSize: 'medium'
    }));
  });
  await new Promise(r => setTimeout(r, 800));

  const screenshotDark = path.join(SCREENSHOT_DIR, 'part8_analytics_desktop_dark.png');
  await page.screenshot({ path: screenshotDark, fullPage: true });
  console.log(`✓ Captured Night Monitor theme desktop view: ${screenshotDark}`);

  // Test Mobile Responsiveness (390x844)
  console.log('\n--- 6. Testing Mobile Viewport (390x844) ---');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'forest');
    document.documentElement.classList.remove('theme-night');
    document.body.classList.remove('theme-night');
  });
  await new Promise(r => setTimeout(r, 800));

  const screenshotMobile = path.join(SCREENSHOT_DIR, 'part8_analytics_mobile.png');
  await page.screenshot({ path: screenshotMobile, fullPage: true });
  console.log(`✓ Captured Mobile view: ${screenshotMobile}`);

  await browser.close();
  console.log('\n============================================================');
  console.log('ALL PART 8 VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('============================================================');
}

runPart8Tests().catch(err => {
  console.error('\n❌ Part 8 Verification Failed:', err);
  process.exit(1);
});
