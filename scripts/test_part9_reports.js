import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.resolve('./screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runPart9Tests() {
  console.log('============================================================');
  console.log('VEGSENSE PART 9: REPORTS & PDF GENERATION VERIFICATION SUITE');
  console.log('============================================================\n');

  const demoUserId = 'usr_demo_vegsense_001';
  const otherUserId = 'usr_isolated_user_b';
  const JWT_SECRET = process.env.JWT_SECRET || 'veg-storage-smart-iot-secret-key-2026';

  const userAToken = jwt.sign(
    { id: demoUserId, name: 'Dr. Aris Thorne', email: 'demo@vegsense.io' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const userBToken = jwt.sign(
    { id: otherUserId, name: 'Inspector Vance', email: 'vance@partnerlab.org' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const headersUserA = {
    'Authorization': `Bearer ${userAToken}`,
    'Content-Type': 'application/json'
  };

  const headersUserB = {
    'Authorization': `Bearer ${userBToken}`,
    'Content-Type': 'application/json'
  };

  // 1. Backend Preview for Multiple Report Types
  console.log('--- 1. Testing Report Preview for All 10 Report Types ---');
  const reportTypes = [
    'COMPLETE_STORAGE',
    'SENSOR_REPORT',
    'SPOILAGE_REPORT',
    'ALERT_REPORT',
    'BATCH_REPORT',
    'ANALYTICS_REPORT',
    'DAILY_REPORT',
    'WEEKLY_REPORT',
    'MONTHLY_REPORT',
    'CUSTOM_REPORT'
  ];

  for (const rType of reportTypes) {
    const previewRes = await fetch('http://localhost:5000/api/reports/preview', {
      method: 'POST',
      headers: headersUserA,
      body: JSON.stringify({
        report_type: rType,
        range: '24h',
        device_id: 'ESP32-DEMO-001',
        source_mode: 'ALL'
      })
    });
    if (!previewRes.ok) throw new Error(`Preview failed for ${rType}: ${previewRes.status}`);
    const data = await previewRes.json();
    console.log(`✓ Preview generated for ${rType}: "${data.preview?.metadata?.title}"`);
    if (!data.preview?.sensors || !data.preview?.spoilage || !data.preview?.disclaimer) {
      throw new Error(`Incomplete preview payload for ${rType}`);
    }
  }

  // 2. Generate Authoritative PDF & Save Report
  console.log('\n--- 2. Testing Report Generation & PDF Creation ---');
  const genRes = await fetch('http://localhost:5000/api/reports/generate', {
    method: 'POST',
    headers: headersUserA,
    body: JSON.stringify({
      report_type: 'COMPLETE_STORAGE',
      range: '24h',
      device_id: 'ESP32-DEMO-001',
      source_mode: 'DEMO',
      sections: {
        storage: true,
        sensors: true,
        spoilage: true,
        alerts: true,
        analytics: true,
        batch: true,
        recommendations: true
      }
    })
  });

  if (!genRes.ok) {
    const errText = await genRes.text();
    throw new Error(`Report generation failed: ${genRes.status} - ${errText}`);
  }

  const genData = await genRes.json();
  const createdReport = genData.report;
  console.log(`✓ Report Created: ID=${createdReport.id}, Title="${createdReport.title}", FileSize=${createdReport.file_size} bytes`);
  if (!createdReport.id || createdReport.file_size < 1000) {
    throw new Error('Generated report PDF buffer is suspiciously small or invalid!');
  }

  // 3. List Reports
  console.log('\n--- 3. Testing Report Retrieval ---');
  const listRes = await fetch('http://localhost:5000/api/reports', { headers: headersUserA });
  const listData = await listRes.json();
  const found = (listData.reports || []).find(r => r.id === createdReport.id);
  console.log(`✓ Listed ${listData.reports?.length} reports. Found newly created report: ${Boolean(found)}`);
  if (!found) throw new Error('Newly created report not present in user reports list!');

  // 4. Download PDF & Verify PDF Header Magic Bytes
  console.log('\n--- 4. Testing PDF Download & Binary Integrity ---');
  const downloadRes = await fetch(`http://localhost:5000/api/reports/${createdReport.id}/download`, {
    headers: { Authorization: `Bearer ${userAToken}` }
  });
  if (!downloadRes.ok) throw new Error(`Download failed: ${downloadRes.status}`);
  const pdfArrayBuffer = await downloadRes.arrayBuffer();
  const pdfBuffer = Buffer.from(pdfArrayBuffer);
  const pdfHeader = pdfBuffer.slice(0, 5).toString('ascii');
  console.log(`✓ Downloaded ${pdfBuffer.length} bytes. Header check: "${pdfHeader}"`);
  if (pdfHeader !== '%PDF-') {
    throw new Error(`Corrupted PDF download! Expected %PDF- magic bytes, got "${pdfHeader}"`);
  }

  // Save sample PDF to disk for manual inspection if needed
  const samplePdfPath = path.join(SCREENSHOT_DIR, 'sample_generated_storage_report.pdf');
  fs.writeFileSync(samplePdfPath, pdfBuffer);
  console.log(`✓ Saved sample PDF to: ${samplePdfPath}`);

  // 5. User Isolation Security Test (Section 70)
  console.log('\n--- 5. Testing Strict User Isolation ---');
  const userBListRes = await fetch('http://localhost:5000/api/reports', { headers: headersUserB });
  const userBListData = await userBListRes.json();
  const userBSeesReport = (userBListData.reports || []).some(r => r.id === createdReport.id);
  console.log(`✓ User B sees User A's report (Expect false): ${userBSeesReport}`);
  if (userBSeesReport) {
    throw new Error('CRITICAL SECURITY FLAW: User B was able to see User A\'s report in list!');
  }

  const userBDownloadRes = await fetch(`http://localhost:5000/api/reports/${createdReport.id}/download`, {
    headers: { Authorization: `Bearer ${userBToken}` }
  });
  console.log(`✓ User B downloading User A's report status (Expect 404): ${userBDownloadRes.status}`);
  if (userBDownloadRes.status !== 404) {
    throw new Error(`CRITICAL SECURITY FLAW: User B downloaded User A's report with status ${userBDownloadRes.status}!`);
  }

  // 6. Puppeteer Frontend Visual Verification
  console.log('\n--- 6. Launching Puppeteer E2E Browser Tests ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,1050']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1050 });

  console.log('Seeding authentication state...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  await page.evaluate((token, user) => {
    localStorage.setItem('veg_storage_auth_token', token);
    localStorage.setItem('veg_storage_user', JSON.stringify(user));
  }, userAToken, { id: demoUserId, name: 'Dr. Aris Thorne', email: 'demo@vegsense.io' });

  // Navigate to /reports
  console.log('Navigating to http://localhost:5173/reports ...');
  await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle2' });

  // Wait for header and selector cards
  await page.waitForSelector('h1', { timeout: 10000 });
  const pageTitle = await page.$eval('h1', el => el.textContent.trim());
  console.log(`✓ Reports Header Rendered: "${pageTitle}"`);

  // Verify 10 report type cards rendered
  const selectorCards = await page.$$eval('#report-creator-section > div:first-child > div > div', cards => cards.length);
  console.log(`✓ Rendered ${selectorCards} Report Type cards`);

  // Click "Preview Report" button
  console.log('Testing Preview button click...');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Preview Report')) {
      await btn.click();
      console.log('✓ Clicked "Preview Report" button');
      break;
    }
  }

  // Wait for preview modal to appear
  await page.waitForFunction(() => {
    return document.body.innerText.includes('Report Document Preview');
  }, { timeout: 8000 });
  console.log('✓ Report Preview Modal opened successfully');

  // Capture Preview Modal Screenshot - Forest Theme
  const screenshotPreview = path.join(SCREENSHOT_DIR, 'part9_reports_preview_forest.png');
  await page.screenshot({ path: screenshotPreview, fullPage: false });
  console.log(`✓ Captured Forest theme Preview modal: ${screenshotPreview}`);

  // Close preview modal
  const closeBtn = await page.$('button[style*="justify-content: center"]');
  if (closeBtn) {
    await closeBtn.click();
    console.log('✓ Closed preview modal');
  }
  await new Promise(r => setTimeout(r, 600));

  // Capture Main Reports Page - Forest Theme
  const screenshotForest = path.join(SCREENSHOT_DIR, 'part9_reports_desktop_forest.png');
  await page.screenshot({ path: screenshotForest, fullPage: true });
  console.log(`✓ Captured Forest theme desktop view: ${screenshotForest}`);

  // Test Night Monitor Theme (Dark Mode)
  console.log('\n--- 7. Testing Night Monitor / Dark Pro Mode ---');
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

  const screenshotDark = path.join(SCREENSHOT_DIR, 'part9_reports_desktop_dark.png');
  await page.screenshot({ path: screenshotDark, fullPage: true });
  console.log(`✓ Captured Night Monitor theme desktop view: ${screenshotDark}`);

  // Test Mobile Viewport (390x844)
  console.log('\n--- 8. Testing Mobile Viewport (390x844) ---');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'forest');
  });
  await new Promise(r => setTimeout(r, 800));

  const screenshotMobile = path.join(SCREENSHOT_DIR, 'part9_reports_mobile.png');
  await page.screenshot({ path: screenshotMobile, fullPage: true });
  console.log(`✓ Captured Mobile view: ${screenshotMobile}`);

  await browser.close();

  // 9. Report Delete Test (Section 54 & 96)
  console.log('\n--- 9. Testing Report Deletion without Affecting Raw Data ---');
  const deleteRes = await fetch(`http://localhost:5000/api/reports/${createdReport.id}`, {
    method: 'DELETE',
    headers: headersUserA
  });
  const deleteData = await deleteRes.json();
  console.log(`✓ Delete report status: ${deleteData.success}`);

  // Verify report is deleted from list
  const listAfterDel = await fetch('http://localhost:5000/api/reports', { headers: headersUserA });
  const listAfterDelData = await listAfterDel.json();
  const stillExists = (listAfterDelData.reports || []).some(r => r.id === createdReport.id);
  console.log(`✓ Deleted report still exists in DB (Expect false): ${stillExists}`);
  if (stillExists) throw new Error('Report was not removed from database!');

  // Verify raw sensor data still exists in DB!
  const sensorsCheck = await fetch('http://localhost:5000/api/analytics/summary?range=24h', { headers: headersUserA });
  const sensorsCheckData = await sensorsCheck.json();
  console.log(`✓ Raw sensor readings still intact in database: ${sensorsCheckData.data_points} points`);
  if (sensorsCheckData.data_points === 0) {
    throw new Error('CRITICAL FLAW: Deleting report deleted raw sensor data!');
  }

  console.log('\n============================================================');
  console.log('ALL PART 9 VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('============================================================');
}

runPart9Tests().catch(err => {
  console.error('\n❌ Part 9 Verification Failed:', err);
  process.exit(1);
});
