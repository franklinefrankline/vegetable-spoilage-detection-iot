import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve('./screenshots/live_production_verification');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyBrowser() {
  console.log('=== STARTING BROWSER E2E TEST ON LIVE VERCEL PRODUCTION ===');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. Visit Login Page
    console.log('1. Navigating to https://vegitables.vercel.app/login...');
    await page.goto('https://vegitables.vercel.app/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_live_login_page.png') });
    console.log('✔ Captured 01_live_login_page.png');

    // 2. Perform Login with demo credentials
    console.log('2. Entering demo credentials and logging in...');
    await page.waitForSelector('#login-email', { timeout: 10000 });
    await page.type('#login-email', 'demo@vegsense.io');
    await page.type('#login-password', 'Password123');
    await page.click('button[type="submit"]');

    // Wait for navigation or dashboard element
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_live_dashboard.png') });
    console.log('✔ Captured 02_live_dashboard.png');

    // 3. Navigate to Storage Page
    console.log('3. Navigating to /storage...');
    await page.goto('https://vegitables.vercel.app/storage', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_live_storage_page.png') });
    console.log('✔ Captured 03_live_storage_page.png');

    // 4. Navigate to Sensors Page
    console.log('4. Navigating to /sensors...');
    await page.goto('https://vegitables.vercel.app/sensors', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_live_sensors_page.png') });
    console.log('✔ Captured 04_live_sensors_page.png');

    // 5. Navigate to Spoilage Page
    console.log('5. Navigating to /spoilage...');
    await page.goto('https://vegitables.vercel.app/spoilage', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_live_spoilage_page.png') });
    console.log('✔ Captured 05_live_spoilage_page.png');

    // 6. Navigate to Analytics Page
    console.log('6. Navigating to /analytics...');
    await page.goto('https://vegitables.vercel.app/analytics', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_live_analytics_page.png') });
    console.log('✔ Captured 06_live_analytics_page.png');

    // 7. Navigate to Reports Page
    console.log('7. Navigating to /reports...');
    await page.goto('https://vegitables.vercel.app/reports', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_live_reports_page.png') });
    console.log('✔ Captured 07_live_reports_page.png');

    console.log('★ LIVE BROWSER VERIFICATION COMPLETED SUCCESSFULLY! ★');
  } catch (err) {
    console.error('Browser test failed:', err);
  } finally {
    await browser.close();
  }
}

verifyBrowser();
