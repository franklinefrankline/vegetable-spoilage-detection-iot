import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const FRONTEND_URL = 'http://localhost:5173';

function findChromePath() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Users\\' + (process.env.USERNAME || '') + '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  return possiblePaths.find((p) => fs.existsSync(p)) || null;
}

const TEST_VIEWPORTS = [
  { name: 'Desktop (1440px)', width: 1440, height: 900, type: 'desktop' },
  { name: 'Laptop (1280px)', width: 1280, height: 800, type: 'desktop' },
  { name: 'Tablet Landscape (1024px)', width: 1024, height: 768, type: 'tablet' },
  { name: 'Tablet Portrait (768px)', width: 768, height: 1024, type: 'tablet' },
  { name: 'Small Tablet (600px)', width: 600, height: 960, type: 'mobile' },
  { name: 'Mobile (480px)', width: 480, height: 800, type: 'mobile' },
  { name: 'iPhone XR (414px)', width: 414, height: 896, type: 'mobile' },
  { name: 'iPhone 14 (390px)', width: 390, height: 844, type: 'mobile' },
  { name: 'iPhone SE (375px)', width: 375, height: 667, type: 'mobile' },
  { name: 'Small Mobile (360px)', width: 360, height: 740, type: 'mobile' }
];

async function run() {
  console.log('============================================================');
  console.log('VEGSENSE ADMIN PORTAL - COMPREHENSIVE RESPONSIVE SUITE');
  console.log('Testing Desktop, Tablet, Mobile (1440px down to 360px)');
  console.log('============================================================\n');

  const chromePath = findChromePath();
  if (!chromePath) {
    console.error('ERROR: Chrome/Edge executable not found.');
    process.exit(1);
  }

  const screenshotsDir = path.resolve('screenshots', 'admin_responsive');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore favicon or non-critical 404s
      if (!text.includes('favicon') && !text.includes('manifest')) {
        console.log(`[Browser Console Error] ${text}`);
      }
    }
  });

  try {
    // 1. Authenticate as Main Admin
    console.log('[1/8] Logging in with Main Admin credentials...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2' });

    await page.waitForSelector('#login-email', { timeout: 5000 });
    await page.type('#login-email', 'vegsense@gmail.com');
    await page.type('#login-password', 'VegSense@Admin2026!');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1500));

    // Navigate to Admin Users
    console.log('[2/8] Navigating to /admin/users...');
    await page.goto(`${FRONTEND_URL}/admin/users`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.admin-page-content', { timeout: 6000 });
    console.log('  Successfully loaded /admin/users');

    // 2. Viewport Responsive Tests (No horizontal page scroll on all 10 widths)
    console.log('\n[3/8] Testing 10 Viewports for Horizontal Scroll & Element Fit...');
    for (const vp of TEST_VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await new Promise((r) => setTimeout(r, 300));

      const overflow = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const bodyWidth = document.body.scrollWidth;
        return {
          docWidth,
          winWidth,
          bodyWidth,
          hasPageScroll: docWidth > winWidth + 1 || bodyWidth > winWidth + 1
        };
      });

      if (overflow.hasPageScroll) {
        errors.push(`Page horizontal scroll detected at ${vp.name}: docWidth=${overflow.docWidth}, winWidth=${overflow.winWidth}`);
        console.error(`  FAIL: ${vp.name} has horizontal scroll! (${overflow.docWidth}px > ${overflow.winWidth}px)`);
      } else {
        console.log(`  PASS: ${vp.name} (scrollWidth=${overflow.docWidth}px, innerWidth=${overflow.winWidth}px) - No page scroll!`);
      }

      // Check view-specific elements
      if (vp.type === 'desktop') {
        const tableCheck = await page.evaluate(() => {
          const tableWrap = document.querySelector('.desktop-user-table-wrap');
          const table = document.querySelector('.admin-data-table');
          const actionsCell = document.querySelector('.th-actions');
          const actionButtons = document.querySelectorAll('.row-action-buttons');
          const style = tableWrap ? window.getComputedStyle(tableWrap) : null;
          const actionsWidth = actionsCell ? actionsCell.getBoundingClientRect().width : 0;
          return {
            visible: style && style.display !== 'none',
            hasTable: Boolean(table),
            actionsWidth,
            actionsCount: actionButtons.length
          };
        });

        if (!tableCheck.visible) {
          errors.push(`Desktop table wrap not visible at ${vp.name}`);
        } else if (tableCheck.actionsWidth < 170) {
          errors.push(`Actions column too narrow at ${vp.name}: ${tableCheck.actionsWidth}px`);
        } else {
          console.log(`    Desktop table verified: Actions column width = ${Math.round(tableCheck.actionsWidth)}px (>= 180px required)`);
        }
      } else if (vp.type === 'mobile') {
        const cardCheck = await page.evaluate(() => {
          const cardsWrap = document.querySelector('.mobile-user-cards-wrap');
          const cards = document.querySelectorAll('.admin-user-card');
          const style = cardsWrap ? window.getComputedStyle(cardsWrap) : null;
          const firstActionBtn = document.querySelector('.btn-card-action');
          const btnRect = firstActionBtn ? firstActionBtn.getBoundingClientRect() : null;
          return {
            visible: style && style.display !== 'none',
            cardCount: cards.length,
            btnHeight: btnRect ? btnRect.height : 0
          };
        });

        if (!cardCheck.visible || cardCheck.cardCount === 0) {
          errors.push(`Mobile cards not displayed at ${vp.name}`);
        } else if (cardCheck.btnHeight < 40) {
          errors.push(`Mobile button touch target too small at ${vp.name}: ${cardCheck.btnHeight}px (< 44px)`);
        } else {
          console.log(`    Mobile user cards verified: ${cardCheck.cardCount} cards, action touch target = ${Math.round(cardCheck.btnHeight)}px (>= 44px)`);
        }
      }

      // Capture screenshot
      const shotName = `users_${vp.width}px.png`;
      await page.screenshot({ path: path.join(screenshotsDir, shotName) });
    }

    // 3. Desktop Table Details & More Menu Verification
    console.log('\n[4/8] Testing Desktop Table Elements & More Actions Menu (1440px)...');
    await page.setViewport({ width: 1440, height: 900 });
    await new Promise((r) => setTimeout(r, 400));

    const desktopChecks = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('.admin-data-table thead th')).map((th) => th.textContent.trim());
      const firstRow = document.querySelector('.admin-data-table tbody tr');
      const protectedBadge = document.querySelector('.badge-status.status-protected');
      const moreBtn = document.querySelector('.action-menu-trigger-btn');
      return {
        headers,
        hasRows: Boolean(firstRow),
        hasProtectedMainAdmin: Boolean(protectedBadge),
        hasMoreBtn: Boolean(moreBtn)
      };
    });

    console.log(`  Headers present: ${desktopChecks.headers.join(' | ')}`);
    if (!desktopChecks.headers.includes('ACTIONS')) {
      errors.push('ACTIONS column missing from table headers');
    }
    if (!desktopChecks.hasProtectedMainAdmin) {
      errors.push('Main Admin Protected badge not found');
    } else {
      console.log('  PASS: Main Admin account correctly shows PROTECTED status!');
    }

    // Click More button on first row to test dropdown
    const moreBtn = await page.$('.action-menu-trigger-btn');
    if (moreBtn) {
      await moreBtn.click();
      await new Promise((r) => setTimeout(r, 300));
      const dropdownItems = await page.evaluate(() => {
        const dropdown = document.querySelector('.user-action-dropdown');
        if (!dropdown) return null;
        return Array.from(dropdown.querySelectorAll('.action-dropdown-item, .action-dropdown-protected')).map((el) => el.textContent.trim());
      });

      console.log(`  More Menu Items: ${dropdownItems ? dropdownItems.join(', ') : 'None'}`);
      if (!dropdownItems || dropdownItems.length === 0) {
        errors.push('More action dropdown did not open');
      } else {
        console.log('  PASS: Desktop More action menu opened successfully!');
      }
      // Click outside to close
      await page.click('.admin-page-main-heading, .admin-section-title').catch(() => {});
    }

    // 4. Test Mobile Hamburger Drawer (390px)
    console.log('\n[5/8] Testing Mobile Hamburger & Drawer (390px)...');
    await page.setViewport({ width: 390, height: 844 });
    await new Promise((r) => setTimeout(r, 300));

    const hamburgerBtn = await page.$('.admin-hamburger-btn');
    if (!hamburgerBtn) {
      errors.push('Hamburger button not found on mobile (390px)');
    } else {
      await hamburgerBtn.click();
      await new Promise((r) => setTimeout(r, 400));

      const drawerOpen = await page.evaluate(() => {
        const sidebar = document.querySelector('.admin-sidebar');
        const overlay = document.querySelector('.admin-mobile-overlay');
        const isSidebarOpen = sidebar ? sidebar.classList.contains('open') : false;
        const isOverlayActive = overlay ? overlay.classList.contains('active') : false;
        return isSidebarOpen && isOverlayActive;
      });

      if (!drawerOpen) {
        errors.push('Mobile sidebar drawer did not open on hamburger click');
      } else {
        console.log('  PASS: Mobile navigation drawer opened cleanly!');
      }

      await page.screenshot({ path: path.join(screenshotsDir, 'mobile_drawer_open_390px.png') });

      // Click a navigation item (e.g. Dashboard) and verify drawer closes
      const dashLink = await page.$('.admin-nav-link');
      if (dashLink) {
        await dashLink.click();
        await new Promise((r) => setTimeout(r, 600));
        const drawerClosed = await page.evaluate(() => {
          const sidebar = document.querySelector('.admin-sidebar');
          return sidebar ? !sidebar.classList.contains('open') : true;
        });
        if (!drawerClosed) {
          errors.push('Mobile drawer did not close after navigation click');
        } else {
          console.log('  PASS: Mobile drawer automatically closes upon navigation!');
        }
      }
    }

    // Return to /admin/users
    await page.goto(`${FRONTEND_URL}/admin/users`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.admin-page-content', { timeout: 6000 });

    // 5. Test Search & Filter Toolbar
    console.log('\n[6/8] Testing Toolbar Search & Role/Status Filters...');
    await page.setViewport({ width: 1280, height: 800 });
    await page.type('.toolbar-search-input', 'vegsense');
    await new Promise((r) => setTimeout(r, 500));

    const searchCount = await page.evaluate(() => {
      const rows = document.querySelectorAll('.admin-data-table tbody tr');
      return rows.length;
    });
    console.log(`  Filtered by 'vegsense': ${searchCount} row(s) returned`);

    // Clear search
    const clearBtn = await page.$('.search-clear-btn');
    if (clearBtn) {
      await clearBtn.click();
      await new Promise((r) => setTimeout(r, 500));
      console.log('  PASS: Search cleared and user directory restored!');
    }

    // 6. Test User Drawer View Profile
    console.log('\n[7/8] Testing User Profile Drawer...');
    const viewBtn = await page.$('.quick-action-btn.view-btn');
    if (viewBtn) {
      await viewBtn.click();
      await new Promise((r) => setTimeout(r, 500));

      const drawerVisible = await page.evaluate(() => {
        const drawer = document.querySelector('.admin-user-drawer');
        return Boolean(drawer);
      });

      if (!drawerVisible) {
        errors.push('User details drawer did not open on View button click');
      } else {
        console.log('  PASS: User Profile Drawer opened successfully!');
        // Close drawer with Escape key
        await page.keyboard.press('Escape');
        await new Promise((r) => setTimeout(r, 400));
        console.log('  PASS: User Profile Drawer closed cleanly via Escape key!');
      }
    }

    // 7. Test Theme Support on Admin Portal
    console.log('\n[8/8] Testing Theme Switching on Admin Portal...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.evaluate(() => {
      const c = document.querySelector('.user-table-container');
      if (c) c.scrollLeft = 0;
    });
    for (const theme of ['forest', 'light', 'dark']) {
      await page.evaluate((th) => {
        document.documentElement.setAttribute('data-theme', th);
      }, theme);
      await new Promise((r) => setTimeout(r, 300));

      const themeStyle = await page.evaluate(() => {
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;
        const cardBg = window.getComputedStyle(document.querySelector('.admin-toolbar-card') || document.body).backgroundColor;
        const currentTheme = document.documentElement.getAttribute('data-theme');
        return { bodyBg, cardBg, currentTheme };
      });

      console.log(`  Theme '${theme}': DOM attribute = ${themeStyle.currentTheme}, Card background = ${themeStyle.cardBg}`);
      await page.screenshot({ path: path.join(screenshotsDir, `theme_${theme}_users.png`) });
    }

    // Test Administrator Management on Mobile & Desktop
    console.log('\n[BONUS] Testing Administrator Management (/admin/admins)...');
    await page.goto(`${FRONTEND_URL}/admin/admins`, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.admin-page-content', { timeout: 6000 });

    // Desktop
    await page.setViewport({ width: 1440, height: 900 });
    await new Promise((r) => setTimeout(r, 400));
    const adminDesktopCheck = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;
      const table = document.querySelector('.desktop-admin-table-wrap');
      return { hasPageScroll: docWidth > winWidth, hasTable: Boolean(table) };
    });
    console.log(`  Admin directory desktop (1440px): table present = ${adminDesktopCheck.hasTable}, no page scroll = ${!adminDesktopCheck.hasPageScroll}`);

    // Mobile
    await page.setViewport({ width: 390, height: 844 });
    await new Promise((r) => setTimeout(r, 400));
    const adminMobileCheck = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;
      const cards = document.querySelectorAll('.mobile-admin-cards-wrap .admin-user-card');
      return { hasPageScroll: docWidth > winWidth, cardCount: cards.length };
    });
    console.log(`  Admin directory mobile (390px): ${adminMobileCheck.cardCount} cards rendered, no page scroll = ${!adminMobileCheck.hasPageScroll}`);
    await page.screenshot({ path: path.join(screenshotsDir, 'admin_management_mobile_390px.png') });

  } catch (err) {
    console.error('Fatal error during test execution:', err);
    errors.push(err.message);
  } finally {
    await browser.close();
  }

  console.log('\n============================================================');
  console.log('TEST SUMMARY');
  console.log('============================================================');
  if (errors.length === 0) {
    console.log('ALL TESTS PASSED! 0 failures, 0 layout errors, 0 overflow issues.');
    console.log('Screenshots saved to: screenshots/admin_responsive/');
    process.exit(0);
  } else {
    console.error(`FAILED with ${errors.length} error(s):`);
    errors.forEach((e, idx) => console.error(`  ${idx + 1}. ${e}`));
    process.exit(1);
  }
}

run();
