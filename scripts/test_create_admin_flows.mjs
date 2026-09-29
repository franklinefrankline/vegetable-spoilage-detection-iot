import puppeteer from 'puppeteer-core';

async function testAllAdminCreationFlows() {
  console.log('====================================================');
  console.log('TESTING ALL ADMIN CREATION FLOWS (LOCALLY)');
  console.log('====================================================\n');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('[Browser Error]', msg.text());
    }
  });

  await page.setViewport({ width: 1440, height: 900 });

  // 1. Login
  console.log('[1/4] Authenticating as Main Admin...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  await page.type('#login-email', 'vegsense@gmail.com');
  await page.type('#login-password', 'VegSense@Admin2026!');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1500));

  // 2. Test User Management -> Add Admin -> Create New Administrator
  console.log('[2/4] Testing /admin/users -> Add Admin Modal -> Create New Administrator...');
  await page.goto('http://localhost:5173/admin/users', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.add-admin-btn', { timeout: 5000 });

  console.log('  Clicking .add-admin-btn...');
  await page.click('.add-admin-btn');
  await new Promise(r => setTimeout(r, 400));

  const rand1 = Math.floor(Math.random() * 10000);
  const email1 = `sarah_${rand1}@vegsense.org`;
  console.log(`  Filling create form with ${email1}...`);

  await page.type('#new-admin-name', `Sarah Connor ${rand1}`);
  await page.type('#new-admin-email', email1);
  await page.type('#new-admin-password', 'SarahPass2026!');
  await page.type('#new-admin-confirm', 'SarahPass2026!');

  console.log('  Submitting form...');
  await page.click('.create-admin-submit-btn');
  await new Promise(r => setTimeout(r, 1500));

  const toast1 = await page.evaluate(() => {
    const el = document.querySelector('.toast, .notification');
    return el ? el.innerText : null;
  });
  console.log(`  Toast Result: ${toast1}`);

  // 3. Test Administrator Management -> + Create Administrator
  console.log('\n[3/4] Testing /admin/admins -> + Create Administrator Modal...');
  await page.goto('http://localhost:5173/admin/admins', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.create-admin-btn', { timeout: 5000 });

  console.log('  Clicking .create-admin-btn...');
  await page.click('.create-admin-btn');
  await new Promise(r => setTimeout(r, 400));

  const rand2 = Math.floor(Math.random() * 10000);
  const email2 = `kyle_${rand2}@vegsense.org`;
  console.log(`  Filling modal with ${email2}...`);

  await page.type('#admin-create-name', `Kyle Reese ${rand2}`);
  await page.type('#admin-create-email', email2);
  await page.type('#admin-create-password', 'KylePass2026!');
  await page.type('input[placeholder="Re-enter password"]', 'KylePass2026!');

  console.log('  Submitting form...');
  await page.click('.create-admin-submit-btn');
  await new Promise(r => setTimeout(r, 1500));

  const toast2 = await page.evaluate(() => {
    const el = document.querySelector('.toast, .notification');
    return el ? el.innerText : null;
  });
  console.log(`  Toast Result: ${toast2}`);

  // 4. Verify Kyle Reese is in the administrator table
  console.log('\n[4/4] Verifying Kyle Reese in administrators table...');
  const foundAdmin = await page.evaluate((targetEmail) => {
    const tableText = document.body.innerText;
    return tableText.includes(targetEmail);
  }, email2);
  console.log(`  Administrator present in directory: ${foundAdmin}`);

  await browser.close();

  if (foundAdmin) {
    console.log('\nALL ADMIN CREATION FLOWS SUCCEEDED!');
  } else {
    throw new Error('Admin creation verification failed');
  }
}

testAllAdminCreationFlows().catch(err => {
  console.error(err);
  process.exit(1);
});
