import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

async function runTestSuite() {
  console.log('========================================================================');
  console.log('VEGSENSE - COMPREHENSIVE UI/UX, THEME, IMAGE, STORAGE & DASHBOARD VERIFICATION');
  console.log('========================================================================\n');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const screenshotDir = path.resolve('screenshots/ui_ux_verification');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Track network requests to verify Demo Mode makes NO calls to 192.168.1.150 or 192.168.1.105
  const forbiddenNetworkCalls = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('192.168.1.150') || url.includes('192.168.1.105')) {
      forbiddenNetworkCalls.push(url);
    }
  });

  let passedChecks = 0;
  let totalChecks = 0;

  function assert(condition, name, details = '') {
    totalChecks++;
    if (condition) {
      passedChecks++;
      console.log(`  [PASS] #${totalChecks}: ${name}`);
    } else {
      console.error(`  [FAIL] #${totalChecks}: ${name}${details ? ` -> ${details}` : ''}`);
    }
  }

  const testUser = {
    name: 'VegSense QA Engineer',
    email: `qa_user_${Date.now()}@vegsense.io`,
    password: 'VegSense@2026!'
  };

  try {
    // -------------------------------------------------------------------------
    // 1. REGISTRATION & AUTHENTICATION REGRESSION TEST (Requirement 39)
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing Register -> Login -> Dashboard Flow ---');
    await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle2' });
    
    // Clear any previous session
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(screenshotDir, '01_register_page.png') });

    // Check register visual panel image & copy
    const registerHeroTitle = await page.$eval('.visual-hero-title', el => el.textContent.trim()).catch(() => '');
    assert(registerHeroTitle.includes('Smart Vegetable Storage'), 'Register hero has "Smart Vegetable Storage" title', registerHeroTitle);

    const hasRegisterProduceImg = await page.$$eval('.login-visual-section img', imgs => imgs.some(i => i.src.includes('vegetable') || i.src.includes('generic'))).catch(() => false);
    assert(hasRegisterProduceImg, 'Register visual side includes high-quality vegetable image');

    // Fill registration form with correct IDs
    await page.type('#reg-name', testUser.name);
    await page.type('#reg-email', testUser.email);
    await page.type('#reg-password', testUser.password);
    await page.type('#reg-confirm-password', testUser.password);
    await page.click('#reg-terms');
    await page.screenshot({ path: path.join(screenshotDir, '01b_register_form_filled.png') });
    await page.click('#btn-create-account');

    // Should redirect to /login with email prefilled
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1000));
    assert(page.url().includes('/login'), 'Registration redirects to /login', page.url());

    // Check login visual side image & copy
    const loginHeroTitle = await page.$eval('.visual-hero-title', el => el.textContent.trim()).catch(() => '');
    assert(loginHeroTitle.includes('Smart Vegetable Storage'), 'Login hero has "Smart Vegetable Storage" title', loginHeroTitle);

    const hasLoginProduceImg = await page.$$eval('.login-visual-section img', imgs => imgs.some(i => i.src.includes('vegetable') || i.src.includes('generic'))).catch(() => false);
    assert(hasLoginProduceImg, 'Login visual side includes high-quality vegetable image');

    // Wait for login password input
    await page.waitForSelector('#login-password', { timeout: 5000 });
    await page.evaluate(() => {
      const p = document.querySelector('#login-password');
      if (p) p.value = '';
    });
    await page.type('#login-password', testUser.password);
    await page.screenshot({ path: path.join(screenshotDir, '02_login_form_filled.png') });
    await page.click('button[type="submit"]');

    // Wait for Dashboard navigation
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 1500));

    const currentUrl = page.url();
    assert(currentUrl.includes('/dashboard'), 'User successfully navigates to /dashboard after login', currentUrl);

    // -------------------------------------------------------------------------
    // 2. CONNECT DEMO ESP32 & DASHBOARD CHECKS
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Connecting Demo ESP32 Gateway ---');
    // Connect Demo ESP32
    await page.goto('http://localhost:5173/connect-device', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    // Click Connect Demo ESP32 button
    const demoConnectBtn = await page.$('.demo-connection-quick-box button');
    if (demoConnectBtn) {
      await demoConnectBtn.click();
      await new Promise(r => setTimeout(r, 2000));
    }

    // Now navigate back to Dashboard
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(screenshotDir, '03_dashboard_demo_connected.png') });

    // Verify only ONE theme toggle exists
    const themeTogglesCount = await page.$$eval('#theme-toggle-btn, .vegsense-theme-toggle-btn', els => els.length);
    assert(themeTogglesCount === 1, `Dashboard has exactly ONE Theme Toggle button in the header (found ${themeTogglesCount})`);

    // Verify Demo IP is 192.168.1.150
    const bodyText = await page.$eval('body', el => el.innerText);
    assert(bodyText.includes('192.168.1.150'), 'Dashboard displays Demo IP 192.168.1.150');
    assert(!bodyText.includes('192.168.1.105'), 'Dashboard does NOT display old IP 192.168.1.105');

    // Verify telemetry label is "Demo ESP32 Telemetry"
    assert(bodyText.includes('Demo ESP32 Telemetry'), 'Telemetry badge displays "Demo ESP32 Telemetry" in Demo Mode');
    assert(!bodyText.includes('Real ESP32 Telemetry'), 'Dashboard does NOT display "Real ESP32 Telemetry" in Demo Mode');

    // -------------------------------------------------------------------------
    // 3. THEME PERSISTENCE & TOGGLING (LIGHT <-> DARK)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Theme Switch & Persistence ---');
    const initialTheme = await page.$eval('html', el => el.getAttribute('data-theme'));
    console.log(`    Initial theme: ${initialTheme}`);

    // Click global theme toggle
    await page.click('#theme-toggle-btn, .vegsense-theme-toggle-btn');
    await new Promise(r => setTimeout(r, 600));

    const themeAfterToggle = await page.$eval('html', el => el.getAttribute('data-theme'));
    const isDarkClassPresent = await page.$eval('html', el => el.classList.contains('dark'));
    assert(themeAfterToggle === 'dark', 'Theme toggled from light to dark', themeAfterToggle);
    assert(isDarkClassPresent, 'HTML element classList includes "dark"');
    await page.screenshot({ path: path.join(screenshotDir, '04_dashboard_dark.png') });

    // Refresh page to verify persistence
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    const themeAfterReload = await page.$eval('html', el => el.getAttribute('data-theme'));
    assert(themeAfterReload === 'dark', 'Dark theme persists after page reload', themeAfterReload);

    // Toggle back to light
    await page.click('#theme-toggle-btn, .vegsense-theme-toggle-btn');
    await new Promise(r => setTimeout(r, 600));
    const themeBackLight = await page.$eval('html', el => el.getAttribute('data-theme'));
    assert(themeBackLight === 'light', 'Theme toggled back from dark to light', themeBackLight);

    // -------------------------------------------------------------------------
    // 4. STORAGE PAGE & DYNAMIC VEGETABLE IMAGE MAPPING
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Vegetable Storage Page & Dynamic Images ---');
    await page.goto('http://localhost:5173/storage', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(screenshotDir, '05_storage_page.png') });

    // Verify storage header has demo IP 192.168.1.150
    const storageText = await page.$eval('.storage-page-container', el => el.innerText);
    assert(storageText.includes('192.168.1.150'), 'Storage page displays Demo IP 192.168.1.150');
    assert(!storageText.includes('192.168.1.105'), 'Storage page does NOT display old IP 192.168.1.105');

    // TEST: Add a new Tomato batch
    console.log('    Creating a new Tomato storage batch...');
    await page.click('button.btn-primary');
    await new Promise(r => setTimeout(r, 600));

    // Preset selection Tomato
    const presetTomato = await page.$('button.preset-pill');
    if (presetTomato) {
      await presetTomato.click();
    }
    await page.evaluate(() => {
      const qtyInput = document.querySelector('input[placeholder*="15 kg"]');
      if (qtyInput) qtyInput.value = '45 kg';
      const chamberInput = document.querySelector('input[placeholder*="Chamber"]');
      if (chamberInput) chamberInput.value = 'Cold Room Alpha';
    });

    // Verify modal live preview image
    const modalPreviewHasTomato = await page.$$eval('.storage-modal-card img', imgs => imgs.some(i => i.src.includes('tomato')));
    assert(modalPreviewHasTomato, 'Add modal preview displays tomato.jpg when Tomato preset is active');

    // Submit batch
    await page.click('.storage-modal-card button[type="submit"]');
    await new Promise(r => setTimeout(r, 1500));

    // Verify newly added batch appears with Tomato image
    const tomatoImgRendered = await page.$$eval('.storage-card img', imgs => imgs.some(i => i.src.includes('tomato')));
    assert(tomatoImgRendered, 'Newly created batch renders tomato image in storage grid');

    // TEST: Add a Potato batch
    console.log('    Creating a new Potato storage batch...');
    await page.click('button.btn-primary');
    await new Promise(r => setTimeout(r, 600));

    // Click Potato preset pill
    await page.evaluate(() => {
      const pills = Array.from(document.querySelectorAll('.preset-pill'));
      const potatoPill = pills.find(p => p.textContent.includes('Potato'));
      if (potatoPill) potatoPill.click();
      const qtyInput = document.querySelector('input[placeholder*="15 kg"]');
      if (qtyInput) qtyInput.value = '80 kg';
      const chamberInput = document.querySelector('input[placeholder*="Chamber"]');
      if (chamberInput) chamberInput.value = 'Root Cellar B';
    });
    await new Promise(r => setTimeout(r, 300));

    const potatoModalHasImg = await page.$$eval('.storage-modal-card img', imgs => imgs.some(i => i.src.includes('potato')));
    assert(potatoModalHasImg, 'Add modal preview dynamically updates to potato.jpg upon selecting Potato');

    await page.click('.storage-modal-card button[type="submit"]');
    await new Promise(r => setTimeout(r, 1500));

    const potatoImgRendered = await page.$$eval('.storage-card img', imgs => imgs.some(i => i.src.includes('potato')));
    assert(potatoImgRendered, 'Newly created Potato batch renders potato image in storage grid');
    await page.screenshot({ path: path.join(screenshotDir, '06_storage_batches_with_images.png') });

    // TEST: Edit Tomato to Carrot or Potato and verify dynamic image switch
    console.log('    Testing batch edit dynamic image switch...');
    const editButton = await page.$('.btn-icon-action[title*="Edit"]');
    if (editButton) {
      await editButton.click();
      await new Promise(r => setTimeout(r, 600));

      // Switch to Carrot
      await page.evaluate(() => {
        const pills = Array.from(document.querySelectorAll('.preset-pill'));
        const carrotPill = pills.find(p => p.textContent.includes('Carrot'));
        if (carrotPill) carrotPill.click();
      });
      await new Promise(r => setTimeout(r, 300));

      const editPreviewHasCarrot = await page.$$eval('.storage-modal-card img', imgs => imgs.some(i => i.src.includes('carrot')));
      assert(editPreviewHasCarrot, 'Edit modal dynamic preview switches to carrot.jpg');

      await page.click('.storage-modal-card button[type="submit"]');
      await new Promise(r => setTimeout(r, 1500));

      const carrotImgRendered = await page.$$eval('.storage-card img', imgs => imgs.some(i => i.src.includes('carrot')));
      assert(carrotImgRendered, 'Storage grid dynamically displays carrot image after batch edit');
    }

    // -------------------------------------------------------------------------
    // 5. SPOILAGE PAGE
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Spoilage Detection Page ---');
    await page.goto('http://localhost:5173/spoilage', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(screenshotDir, '07_spoilage_page.png') });

    const spoilageText = await page.$eval('.spoilage-page-container', el => el.innerText);
    assert(spoilageText.includes('Environmental Spoilage Risk'), 'Page prominently labels "Environmental Spoilage Risk"');
    assert(spoilageText.includes('18'), 'Displays baseline 18% spoilage risk');
    assert(spoilageText.includes('FRESH'), 'Displays FRESH classification');

    const hasSpoilageVegImg = await page.$$eval('.spoilage-page-container img', imgs => imgs.some(i => i.src.includes('vegetable')));
    assert(hasSpoilageVegImg, 'Spoilage page shows vegetable image corresponding to monitored batch');

    // -------------------------------------------------------------------------
    // 6. CONNECT DEVICE / DEVICE PAGE
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Device / Connect Device Page ---');
    await page.goto('http://localhost:5173/connect-device', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(screenshotDir, '08_device_page.png') });

    const deviceText = await page.$eval('.connect-device-refined-container', el => el.innerText);
    assert(deviceText.includes('192.168.1.150'), 'Connect Device page displays Demo IP 192.168.1.150');
    assert(!deviceText.includes('192.168.1.105'), 'Connect Device page does NOT display old IP 192.168.1.105');

    // -------------------------------------------------------------------------
    // 7. SENSORS, ALERTS, ANALYTICS, REPORTS, SETTINGS
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Testing Sensors, Alerts, Analytics, Reports, Settings ---');
    await page.goto('http://localhost:5173/sensors', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));
    assert(page.url().includes('/sensors'), 'Sensors page loaded successfully');

    await page.goto('http://localhost:5173/alerts', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));
    assert(page.url().includes('/alerts'), 'Alerts page loaded successfully');

    await page.goto('http://localhost:5173/analytics', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    assert(page.url().includes('/analytics'), 'Analytics page loaded successfully');
    await page.screenshot({ path: path.join(screenshotDir, '09_analytics_page.png') });

    await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    assert(page.url().includes('/reports'), 'Reports page loaded successfully');

    await page.goto('http://localhost:5173/settings', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    assert(page.url().includes('/settings'), 'Settings page loaded successfully');

    // -------------------------------------------------------------------------
    // 8. VERIFY NETWORK SAFETY
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Verifying Network Safety (No calls to demo IP) ---');
    assert(forbiddenNetworkCalls.length === 0, `Zero network calls to demo IP (192.168.1.150 / 192.168.1.105)`, forbiddenNetworkCalls.join(', '));

    // -------------------------------------------------------------------------
    // 9. RESPONSIVE DESIGN VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Responsive Layout Checks ---');
    const viewports = [
      { name: 'Mobile (390px)', width: 390, height: 844 },
      { name: 'Tablet (768px)', width: 768, height: 1024 },
      { name: 'Desktop (1440px)', width: 1440, height: 900 }
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 600));

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert(!hasHorizontalScroll, `No horizontal scrolling on ${vp.name}`);
      await page.screenshot({ path: path.join(screenshotDir, `responsive_${vp.width}.png`) });
    }

    console.log('\n========================================================================');
    console.log(`TEST SUMMARY: ${passedChecks}/${totalChecks} CHECKS PASSED`);
    console.log('========================================================================\n');

  } catch (err) {
    console.error('Test execution failed with error:', err);
  } finally {
    await browser.close();
  }
}

runTestSuite();
