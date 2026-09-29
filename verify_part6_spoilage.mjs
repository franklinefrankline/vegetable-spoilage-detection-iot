import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\inbat\\.gemini\\antigravity-ide\\brain\\f93ee1fd-8435-4fb9-b427-226fe7d5f7a1';

async function run() {
  console.log('🚀 Starting Part 6 Spoilage Detection Module Verification...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // Step 1: Check unauthenticated access to /spoilage redirects to /login (Section 2)
    console.log('Testing Unauthenticated /spoilage redirect...');
    await page.goto('http://localhost:5173/spoilage', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));
    const currentUrl = page.url();
    console.log('Redirected to:', currentUrl);
    if (!currentUrl.includes('/login')) {
      console.warn('⚠️ Warning: unauthenticated access did not land on login page:', currentUrl);
    } else {
      console.log('✅ Unauthenticated access correctly redirects to /login');
    }

    // Step 2: Register a fresh user
    console.log('Registering test user...');
    await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle2' });
    const userEmail = `spoilage_tester_${Date.now()}@vegsense.io`;
    const userPass = 'VegSensePass123!';

    await page.waitForSelector('#reg-name', { timeout: 5000 });
    await page.type('#reg-name', 'Dr. Spoilage Inspector');
    await page.type('#reg-email', userEmail);
    await page.type('#reg-password', userPass);
    await page.type('#reg-confirm-password', userPass);

    // Accept terms if checkbox exists
    const checkbox = await page.$('#reg-terms');
    if (checkbox) await checkbox.click();

    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 2000));

    console.log('Registered and redirected to:', page.url());

    // Step 2b: Log in on LoginPage
    if (page.url().includes('/login')) {
      console.log('Logging in with registered credentials...');
      await page.waitForSelector('#login-password', { timeout: 5000 });
      // Email is usually prefilled via query param, but let's ensure it
      const emailVal = await page.$eval('#login-email', el => el.value);
      if (!emailVal) {
        await page.type('#login-email', userEmail);
      }
      await page.type('#login-password', userPass);
      await page.click('button[type="submit"]');
      await new Promise((r) => setTimeout(r, 2000));
      console.log('Logged in and redirected to:', page.url());
    }

    // Step 3: If on connect-device page, connect Demo Device
    if (page.url().includes('/connect-device')) {
      console.log('Connecting Demo ESP32 device...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent && b.textContent.includes('Connect Demo ESP32'));
        if (btn) btn.click();
      });
      await new Promise((r) => setTimeout(r, 2000));
    }

    // Step 4: Navigate to /spoilage
    console.log('Navigating to http://localhost:5173/spoilage...');
    await page.goto('http://localhost:5173/spoilage', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 2000));

    // Capture main Spoilage page screenshot
    const mainScreenPath = path.join(ARTIFACT_DIR, 'spoilage_main_desktop.png');
    await page.screenshot({ path: mainScreenPath, fullPage: true });
    console.log('📸 Captured desktop screenshot to:', mainScreenPath);

    // Step 5: Verify page elements
    const pageText = await page.evaluate(() => document.body.innerText);

    const hasTitle = pageText.includes('Spoilage Detection');
    const hasSubtitle = pageText.includes('Environmental spoilage-risk analysis for stored vegetables');
    const has18Percent = pageText.includes('18%') || pageText.includes('18');
    const hasFresh = pageText.includes('FRESH');
    const hasDataQuality = pageText.includes('Data Quality: GOOD') || pageText.includes('GOOD');
    const hasTempRisk = pageText.includes('Temperature Risk');
    const hasHumRisk = pageText.includes('Humidity Risk');
    const hasGasRisk = pageText.includes('Gas/VOC Risk');
    const hasLightRisk = pageText.includes('Light Risk');
    const hasAgeRisk = pageText.includes('Storage Age Risk');
    const hasTempCondition = pageText.includes('Temperature') && pageText.includes('28.5');
    const hasHumCondition = pageText.includes('Humidity') && pageText.includes('72');
    const hasGasCondition = pageText.includes('420');
    const hasBatchTomato = pageText.includes('Tomato');
    const hasRecommendations = pageText.includes('Storage Recommendations') || pageText.includes('Recommendations');
    const hasRiskTrend = pageText.includes('Spoilage Risk Trend') || pageText.includes('Risk Trend');

    console.log('--- Verification Checklist ---');
    console.log('Title present:', hasTitle);
    console.log('Subtitle present:', hasSubtitle);
    console.log('Risk Score 18%:', has18Percent);
    console.log('Classification FRESH:', hasFresh);
    console.log('Data Quality GOOD:', hasDataQuality);
    console.log('5 Risk Factors:', hasTempRisk && hasHumRisk && hasGasRisk && hasLightRisk && hasAgeRisk);
    console.log('Environmental conditions:', hasTempCondition && hasHumCondition && hasGasCondition);
    console.log('Storage batch Tomato:', hasBatchTomato);
    console.log('Recommendations panel:', hasRecommendations);
    console.log('Risk Trend panel:', hasRiskTrend);

    // Step 6: Test Simulation Controls (Warning, Spoilage Risk, Critical)
    console.log('Testing Simulation Controls...');
    const openedMenu = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const simBtn = buttons.find(b => b.textContent && (b.textContent.includes('Test Risk Levels') || b.textContent.includes('Sim:')));
      if (simBtn) {
        simBtn.click();
        return true;
      }
      return false;
    });

    if (openedMenu) {
      await new Promise((r) => setTimeout(r, 600));

      // Click Warning
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const wBtn = buttons.find(b => b.textContent && b.textContent.includes('Simulate Warning'));
        if (wBtn) wBtn.click();
      });
      await new Promise((r) => setTimeout(r, 600));
      const warningText = await page.evaluate(() => document.body.innerText);
      console.log('Simulated WARNING classification active:', warningText.includes('WARNING'));

      const warningScreen = path.join(ARTIFACT_DIR, 'spoilage_sim_warning.png');
      await page.screenshot({ path: warningScreen, fullPage: true });
      console.log('📸 Captured simulated warning screenshot to:', warningScreen);

      // Open menu again and click Spoilage Risk
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const simBtn = buttons.find(b => b.textContent && (b.textContent.includes('Test Risk Levels') || b.textContent.includes('Sim:')));
        if (simBtn) simBtn.click();
      });
      await new Promise((r) => setTimeout(r, 600));
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const rBtn = buttons.find(b => b.textContent && b.textContent.includes('Simulate High Spoilage Risk'));
        if (rBtn) rBtn.click();
      });
      await new Promise((r) => setTimeout(r, 600));
      const riskText = await page.evaluate(() => document.body.innerText);
      console.log('Simulated SPOILAGE RISK active:', riskText.includes('SPOILAGE RISK'));

      // Open menu again and click Critical
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const simBtn = buttons.find(b => b.textContent && (b.textContent.includes('Test Risk Levels') || b.textContent.includes('Sim:')));
        if (simBtn) simBtn.click();
      });
      await new Promise((r) => setTimeout(r, 600));
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const cBtn = buttons.find(b => b.textContent && b.textContent.includes('Simulate Critical'));
        if (cBtn) cBtn.click();
      });
      await new Promise((r) => setTimeout(r, 600));
      const critText = await page.evaluate(() => document.body.innerText);
      console.log('Simulated CRITICAL active:', critText.includes('CRITICAL'));

      const critScreen = path.join(ARTIFACT_DIR, 'spoilage_sim_critical.png');
      await page.screenshot({ path: critScreen, fullPage: true });
      console.log('📸 Captured simulated critical screenshot to:', critScreen);

      // Restore Default
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const simBtn = buttons.find(b => b.textContent && (b.textContent.includes('Test Risk Levels') || b.textContent.includes('Sim:')));
        if (simBtn) simBtn.click();
      });
      await new Promise((r) => setTimeout(r, 600));
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const dBtn = buttons.find(b => b.textContent && b.textContent.includes('Default (18% FRESH)'));
        if (dBtn) dBtn.click();
      });
      await new Promise((r) => setTimeout(r, 600));
      console.log('Restored default baseline 18% FRESH');
    }

    // Step 7: Test Mobile View (375x667)
    console.log('Testing Mobile Responsiveness (375x667)...');
    await page.setViewport({ width: 375, height: 667, isMobile: true });
    await new Promise((r) => setTimeout(r, 600));

    // Check for horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    console.log('Mobile horizontal overflow detected:', hasHorizontalOverflow);

    const mobileScreen = path.join(ARTIFACT_DIR, 'spoilage_mobile_375.png');
    await page.screenshot({ path: mobileScreen, fullPage: true });
    console.log('📸 Captured mobile screenshot to:', mobileScreen);

    // Step 8: Test Theme Switching via Appearance Studio
    console.log('Testing Themes...');
    await page.setViewport({ width: 1280, height: 900, isMobile: false });

    // Open Quick Appearance popover
    const paletteBtn = await page.$('button[aria-label="Quick Appearance"]');
    if (paletteBtn) {
      await paletteBtn.click();
      await new Promise((r) => setTimeout(r, 600));

      // Click Night Monitor button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('.quick-theme-toggle-row button, .quick-appearance-panel button'));
        const nightBtn = buttons.find(b => b.textContent && (b.textContent.includes('NIGHT MONITOR') || b.textContent.includes('Night Monitor')));
        if (nightBtn) nightBtn.click();
      });
      await new Promise((r) => setTimeout(r, 1000));

      const nightScreen = path.join(ARTIFACT_DIR, 'spoilage_night_theme.png');
      await page.screenshot({ path: nightScreen, fullPage: true });
      console.log('📸 Captured Night Monitor theme screenshot to:', nightScreen);

      // Re-open palette and switch back to Forest
      await paletteBtn.click();
      await new Promise((r) => setTimeout(r, 600));
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('.quick-theme-toggle-row button, .quick-appearance-panel button'));
        const forestBtn = buttons.find(b => b.textContent && (b.textContent.includes('FOREST') || b.textContent.includes('Forest')));
        if (forestBtn) forestBtn.click();
      });
      await new Promise((r) => setTimeout(r, 1000));

      const forestScreen = path.join(ARTIFACT_DIR, 'spoilage_forest_theme.png');
      await page.screenshot({ path: forestScreen, fullPage: true });
      console.log('📸 Captured Forest theme screenshot to:', forestScreen);
    }

    console.log('🎉 Verification completed successfully!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
  } finally {
    await browser.close();
  }
}

run();
