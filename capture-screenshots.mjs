import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const BASE_URL = 'https://vegitables.vercel.app';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\Users\\inbat\\.gemini\\antigravity-ide\\brain\\f93ee1fd-8435-4fb9-b427-226fe7d5f7a1\\scratch';

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('1. Registering/authenticating user for capture session...');
  const captureEmail = `capture_bot_${Date.now()}@vegsense.io`;
  const capturePass = 'CapturePass123!';

  await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dashboard Inspector',
      email: captureEmail,
      password: capturePass
    })
  });

  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: captureEmail,
      password: capturePass
    })
  });
  const loginData = await loginRes.json();
  if (!loginData.success || !loginData.token) {
    throw new Error('API login failed: ' + JSON.stringify(loginData));
  }
  console.log('API login successful. User:', captureEmail);

  console.log('2. Launching local Chrome browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('3. Navigating to login page...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });

  console.log('4. Entering credentials in form...');
  await page.waitForSelector('#login-email', { timeout: 10000 });
  await page.type('#login-email', captureEmail);
  await page.type('#login-password', capturePass);

  console.log('5. Clicking sign in button...');
  await page.click('button[type="submit"]');

  // Wait for navigation
  await new Promise(r => setTimeout(r, 3000));

  // If on connect-device, click demo connect
  const currentUrl = page.url();
  console.log('Current URL after login:', currentUrl);
  if (currentUrl.includes('/connect-device')) {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const demoBtn = btns.find(b => b.textContent.includes('Connect Demo ESP32') || b.textContent.includes('Demo'));
      if (demoBtn) demoBtn.click();
    });
    console.log('Connected demo device via UI.');
    await new Promise(r => setTimeout(r, 2000));
  }

  // Go to /dashboard
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // --- DESKTOP VIEWPORT (1280x800) ---
  console.log('5. Capturing Desktop Viewport (1280x800)...');
  await page.setViewport({ width: 1280, height: 800 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 1000));

  const desktopMetrics = await page.evaluate(() => {
    const sidebarLogo = document.querySelector('.vegsense-sidebar .sidebar-header img') ||
                        document.querySelector('.vegsense-sidebar img');
    const headerLogo = document.querySelector('.dashboard-header img') ||
                       document.querySelector('.vegsense-header img');
    const sidebarPadding = window.getComputedStyle(document.querySelector('.vegsense-sidebar .sidebar-header') || document.body).padding;

    return {
      sidebarLogo: sidebarLogo ? {
        width: Math.round(sidebarLogo.getBoundingClientRect().width),
        height: Math.round(sidebarLogo.getBoundingClientRect().height),
        src: sidebarLogo.src
      } : null,
      headerLogo: headerLogo ? {
        width: Math.round(headerLogo.getBoundingClientRect().width),
        height: Math.round(headerLogo.getBoundingClientRect().height),
        src: headerLogo.src
      } : null,
      sidebarPadding
    };
  });
  console.log('Desktop Metrics:', JSON.stringify(desktopMetrics, null, 2));

  const desktopPath = path.join(OUTPUT_DIR, 'dashboard_desktop.png');
  await page.screenshot({ path: desktopPath });
  console.log('Saved desktop screenshot to:', desktopPath);

  // --- TABLET VIEWPORT (768x1024) ---
  console.log('6. Capturing Tablet Viewport (768x1024)...');
  await page.setViewport({ width: 768, height: 1024 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 1000));

  const tabletMetrics = await page.evaluate(() => {
    const headerLogo = document.querySelector('.dashboard-header img') ||
                       document.querySelector('.vegsense-header img') ||
                       document.querySelector('header img');
    return {
      headerLogo: headerLogo ? {
        width: Math.round(headerLogo.getBoundingClientRect().width),
        height: Math.round(headerLogo.getBoundingClientRect().height)
      } : null
    };
  });
  console.log('Tablet Metrics:', JSON.stringify(tabletMetrics, null, 2));

  const tabletPath = path.join(OUTPUT_DIR, 'dashboard_tablet.png');
  await page.screenshot({ path: tabletPath });
  console.log('Saved tablet screenshot to:', tabletPath);

  // --- MOBILE VIEWPORT (375x667) ---
  console.log('7. Capturing Mobile Viewport (375x667)...');
  await page.setViewport({ width: 375, height: 667 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 1000));

  const mobileMetrics = await page.evaluate(() => {
    const headerLogo = document.querySelector('.dashboard-header img') ||
                       document.querySelector('.vegsense-header img') ||
                       document.querySelector('header img');
    return {
      headerLogo: headerLogo ? {
        width: Math.round(headerLogo.getBoundingClientRect().width),
        height: Math.round(headerLogo.getBoundingClientRect().height)
      } : null
    };
  });
  console.log('Mobile Metrics:', JSON.stringify(mobileMetrics, null, 2));

  const mobilePath = path.join(OUTPUT_DIR, 'dashboard_mobile.png');
  await page.screenshot({ path: mobilePath });
  console.log('Saved mobile screenshot to:', mobilePath);

  await browser.close();
  console.log('\n>>> VISUAL SCREENSHOT VERIFICATION COMPLETE! <<<');
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
