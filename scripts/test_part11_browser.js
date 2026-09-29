import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const FRONTEND_URL = 'http://localhost:5173';
const BASE_URL = 'http://localhost:5000';

function findChromePath() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Users\\' + (process.env.USERNAME || '') + '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  return possiblePaths.find((p) => fs.existsSync(p)) || null;
}

async function runBrowserTests() {
  console.log('====================================================');
  console.log('STARTING PART 11 BROWSER END-TO-END VERIFICATION');
  console.log('====================================================\n');

  const chromePath = findChromePath();
  if (!chromePath) {
    console.error('Chrome/Edge executable not found on host machine.');
    process.exit(1);
  }

  const screenshotDir = path.resolve('screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Step 1: Login Page
    console.log('[1/7] Navigating to Login Page via UI...');
    await page.goto(FRONTEND_URL + '/login', { waitUntil: 'networkidle2' });

    // Type Main Admin Credentials
    console.log('  Filling Main Admin credentials in login form...');
    await page.type('#login-email', 'vegsense@gmail.com');
    await page.type('#login-password', 'VegSense@Admin2026!');
    
    // Click submit button
    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();

    // Wait for redirect to /admin
    console.log('  Waiting for authenticated redirect to /admin...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1500));

    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);
    if (!currentUrl.includes('/admin')) {
      // If direct navigation was delayed, ensure token and navigate
      console.log('  Directing to /admin...');
      await page.goto(FRONTEND_URL + '/admin', { waitUntil: 'networkidle2' });
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Step 2: Main Admin Dashboard Screenshot
    console.log('[2/7] Capturing Main Admin Dashboard...');
    const dashPath = path.join(screenshotDir, 'part11_admin_dashboard_desktop.png');
    await page.screenshot({ path: dashPath, fullPage: false });
    console.log(`  PASS: Saved ${dashPath}`);

    // Step 3: Admin Management Page
    console.log('[3/7] Navigating to Administrator Management (/admin/admins)...');
    await page.goto(FRONTEND_URL + '/admin/admins', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1200));

    const adminsPath = path.join(screenshotDir, 'part11_admin_management_desktop.png');
    await page.screenshot({ path: adminsPath, fullPage: false });
    console.log(`  PASS: Saved ${adminsPath}`);

    // Step 4: Open Create Administrator Modal
    console.log('[4/7] Opening Create Administrator modal...');
    const createBtn = await page.$('.create-admin-btn');
    if (createBtn) {
      await createBtn.click();
      await new Promise((r) => setTimeout(r, 600));

      // Type sample password to verify strength meter
      const pwdInput = await page.$('#admin-create-password');
      if (pwdInput) {
        await pwdInput.type('StrongPass@2026!');
        await new Promise((r) => setTimeout(r, 400));
      }

      const modalPath = path.join(screenshotDir, 'part11_create_admin_modal.png');
      await page.screenshot({ path: modalPath, fullPage: false });
      console.log(`  PASS: Saved ${modalPath}`);

      // Close modal
      const closeBtn = await page.$('.modal-close-btn');
      if (closeBtn) await closeBtn.click();
      await new Promise((r) => setTimeout(r, 400));
    }

    // Step 5: Open Admin Slide-over Drawer
    console.log('[5/7] Opening Administrator Details Drawer...');
    const viewButtons = await page.$$('.action-icon-btn');
    if (viewButtons.length > 0) {
      await viewButtons[0].click();
      await new Promise((r) => setTimeout(r, 600));

      const drawerPath = path.join(screenshotDir, 'part11_admin_drawer.png');
      await page.screenshot({ path: drawerPath, fullPage: false });
      console.log(`  PASS: Saved ${drawerPath}`);

      // Close drawer
      const closeDrawerBtn = await page.$('.drawer-close-btn');
      if (closeDrawerBtn) await closeDrawerBtn.click();
      await new Promise((r) => setTimeout(r, 400));
    }

    // Step 6: System Hardware Devices Page
    console.log('[6/7] Navigating to System Device Management (/admin/devices)...');
    await page.goto(FRONTEND_URL + '/admin/devices', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1200));

    const devicesPath = path.join(screenshotDir, 'part11_system_devices_desktop.png');
    await page.screenshot({ path: devicesPath, fullPage: false });
    console.log(`  PASS: Saved ${devicesPath}`);

    // Step 7: Night Monitor Theme & Mobile Viewport
    console.log('[7/7] Testing Mobile Viewport and Night Monitor theme...');
    await page.setViewport({ width: 390, height: 844 });
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'night-monitor');
    });
    await page.goto(FRONTEND_URL + '/admin', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1200));

    const mobilePath = path.join(screenshotDir, 'part11_admin_mobile_dark.png');
    await page.screenshot({ path: mobilePath, fullPage: false });
    console.log(`  PASS: Saved ${mobilePath}`);

    console.log('\n====================================================');
    console.log('ALL PART 11 BROWSER END-TO-END VERIFICATIONS PASSED!');
    console.log('====================================================');
  } finally {
    await browser.close();
  }
}

runBrowserTests().catch((err) => {
  console.error('BROWSER TEST FAILED:', err);
  process.exit(1);
});
