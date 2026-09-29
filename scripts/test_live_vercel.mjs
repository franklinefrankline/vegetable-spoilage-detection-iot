import puppeteer from 'puppeteer-core';

const LIVE_URL = 'https://vegitables.vercel.app';

async function testLiveVercelProduction() {
  console.log('====================================================');
  console.log('TESTING LIVE VERCEL PRODUCTION DEPLOYMENT');
  console.log(`URL: ${LIVE_URL}`);
  console.log('====================================================\n');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: true });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('[Live Browser Error]', msg.text());
    }
  });

  await page.setViewport({ width: 1440, height: 900 });

  // 1. Login on Live Production
  console.log('[1/4] Authenticating as Main Admin on Live Vercel...');
  await page.goto(`${LIVE_URL}/login`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('#login-email', { timeout: 10000 });
  await page.type('#login-email', 'vegsense@gmail.com');
  await page.type('#login-password', 'VegSense@Admin2026!');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2500));

  // 2. Test User Management (/admin/users) -> Add Admin -> Create Administrator
  console.log('[2/4] Testing User Management (/admin/users) on Live Vercel...');
  await page.goto(`${LIVE_URL}/admin/users`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.add-admin-btn', { timeout: 10000 });

  console.log('  Clicking "Add Admin" button...');
  await page.click('.add-admin-btn');
  await new Promise(r => setTimeout(r, 600));

  const rand1 = Math.floor(Math.random() * 10000);
  const email1 = `live_sarah_${rand1}@vegsense.org`;
  console.log(`  Filling create form with ${email1}...`);

  await page.type('#new-admin-name', `Live Sarah ${rand1}`);
  await page.type('#new-admin-email', email1);
  await page.type('#new-admin-password', 'LiveSarahPass2026!');
  await page.type('#new-admin-confirm', 'LiveSarahPass2026!');

  console.log('  Submitting "+ Create Administrator"...');
  await page.click('.create-admin-submit-btn');
  await new Promise(r => setTimeout(r, 3000));

  const toast1 = await page.evaluate(() => {
    const el = document.querySelector('.toast, .notification');
    return el ? el.innerText : null;
  });
  console.log(`  Live Toast 1: ${toast1}`);

  // 3. Test Administrator Management (/admin/admins) -> + Create Administrator
  console.log('\n[3/4] Testing Administrator Management (/admin/admins) on Live Vercel...');
  await page.goto(`${LIVE_URL}/admin/admins`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('.create-admin-btn', { timeout: 10000 });

  console.log('  Clicking "+ Create Administrator"...');
  await page.click('.create-admin-btn');
  await new Promise(r => setTimeout(r, 600));

  const rand2 = Math.floor(Math.random() * 10000);
  const email2 = `live_kyle_${rand2}@vegsense.org`;
  console.log(`  Filling modal with ${email2}...`);

  await page.type('#admin-create-name', `Live Kyle ${rand2}`);
  await page.type('#admin-create-email', email2);
  await page.type('#admin-create-password', 'LiveKylePass2026!');
  await page.type('input[placeholder="Re-enter password"]', 'LiveKylePass2026!');

  console.log('  Submitting form...');
  await page.click('.create-admin-submit-btn');
  await new Promise(r => setTimeout(r, 3000));

  const toast2 = await page.evaluate(() => {
    const el = document.querySelector('.toast, .notification');
    return el ? el.innerText : null;
  });
  console.log(`  Live Toast 2: ${toast2}`);

  // 4. Verify admin appears in live directory
  console.log('\n[4/4] Verifying created administrator in Live Vercel directory...');
  const foundLiveAdmin = await page.evaluate((targetEmail) => {
    return document.body.innerText.includes(targetEmail);
  }, email2);
  console.log(`  Admin ${email2} found in Live Table: ${foundLiveAdmin}`);

  await browser.close();

  if (foundLiveAdmin) {
    console.log('\n====================================================');
    console.log('ALL LIVE VERCEL TESTS PASSED WITH 100% SUCCESS!');
    console.log('====================================================');
  } else {
    throw new Error('Live admin verification failed');
  }
}

testLiveVercelProduction().catch(err => {
  console.error(err);
  process.exit(1);
});
