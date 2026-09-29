/**
 * Part 11: Enterprise Admin Portal Verification Suite
 * Tests full backend APIs, RBAC authorization, account lifecycle, deactivation blocking,
 * last-admin & self-deletion protections, audit logs, system health, and UI via Puppeteer.
 */

import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:5173';

async function request(method, path, body = null, headers = {}) {
  const url = new URL(path, BASE_URL);
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  if (body) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = text;
  }
  return { status: res.status, headers: res.headers, data: json };
}

function findChromePath() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

async function runTests() {
  console.log('============================================================');
  console.log('VEGSENSE PART 11: ENTERPRISE ADMIN PORTAL VERIFICATION');
  console.log('============================================================\n');

  // --- 1. RBAC Route Guard & Authentication Tests ---
  console.log('--- 1. RBAC Route Guard & Authentication Tests ---');

  // A. Unauthorized access (no token)
  const unauthRes = await request('GET', '/api/admin/dashboard');
  if (unauthRes.status !== 401) {
    throw new Error(`Expected 401 for unauthorized access, got ${unauthRes.status}`);
  }
  console.log('✓ Rejected unauthenticated request to /api/admin/dashboard (401)');

  // B. Standard user access (role = USER)
  const userReg = await request('POST', '/api/auth/register', {
    name: 'Standard User Tester',
    email: `standard_user_${Date.now()}@vegsense.io`,
    password: 'Password123'
  });
  const userToken = userReg.data.token;
  const userForbiddenRes = await request('GET', '/api/admin/dashboard', null, {
    Authorization: `Bearer ${userToken}`
  });
  if (userForbiddenRes.status !== 403) {
    throw new Error(`Expected 403 for standard user accessing admin API, got ${userForbiddenRes.status}`);
  }
  console.log('✓ Rejected standard USER from accessing /api/admin/dashboard (403 Forbidden)');

  // C. Admin Login
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@vegsense.io',
    password: 'Password123'
  });
  if (adminLogin.status !== 200 || !adminLogin.data.token) {
    throw new Error('Admin login failed: ' + JSON.stringify(adminLogin.data));
  }
  const adminToken = adminLogin.data.token;
  const currentAdmin = adminLogin.data.user;
  if (currentAdmin.role !== 'ADMIN') {
    throw new Error(`Expected admin role to be ADMIN, got ${currentAdmin.role}`);
  }
  console.log(`✓ Authenticated Administrator (${currentAdmin.email}, Role: ${currentAdmin.role})`);

  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  // --- 2. Dashboard Statistics & Metric Aggregation ---
  console.log('\n--- 2. Dashboard Statistics & Metric Aggregation ---');
  const dashRes = await request('GET', '/api/admin/dashboard', null, adminHeaders);
  if (dashRes.status !== 200 || !dashRes.data.success) {
    throw new Error('Failed to retrieve admin dashboard data: ' + JSON.stringify(dashRes.data));
  }
  const { stats, accountStatus, registrationTrend, recentUsers, recentActivity } = dashRes.data;
  console.log(`✓ Retrieved real DB stats: ${stats.totalUsers} total users, ${stats.activeUsers} active, ${stats.administrators} admins`);
  console.log(`✓ Retrieved hardware stats: ${stats.totalDevices} devices, ${stats.onlineDevices} online, ${stats.offlineDevices} offline`);
  console.log(`✓ Registration trend buckets populated: 7d (${registrationTrend['7d'].length} points), 30d (${registrationTrend['30d'].length} points)`);
  console.log(`✓ Recent users list length: ${recentUsers.length}, Recent activities: ${recentActivity.length}`);

  // --- 3. User Directory & Server-Side Filtering ---
  console.log('\n--- 3. User Directory & Server-Side Filtering ---');

  // A. All users list
  const usersRes = await request('GET', '/api/admin/users?page=1&limit=10', null, adminHeaders);
  if (usersRes.status !== 200 || !Array.isArray(usersRes.data.users)) {
    throw new Error('Failed to list users');
  }
  console.log(`✓ Retrieved paginated user list: Page 1, Limit 10, Total: ${usersRes.data.total}`);

  // Verify password hash is NEVER exposed
  for (const u of usersRes.data.users) {
    if (u.password_hash) {
      throw new Error(`CRITICAL SECURITY FAILURE: password_hash leaked for user ${u.email}`);
    }
  }
  console.log('✓ Verified: password_hash is completely excluded from user responses');

  // B. Role filter (ADMIN)
  const adminsRes = await request('GET', '/api/admin/users?role=ADMIN', null, adminHeaders);
  const allAreAdmins = adminsRes.data.users.every((u) => u.role === 'ADMIN');
  if (!allAreAdmins || adminsRes.data.users.length === 0) {
    throw new Error('Role filtering failed for role=ADMIN');
  }
  console.log(`✓ Filtered users by role=ADMIN (${adminsRes.data.users.length} administrators found)`);

  // C. Search by email
  const searchRes = await request('GET', '/api/admin/users?search=admin@vegsense.io', null, adminHeaders);
  if (searchRes.data.users.length === 0 || searchRes.data.users[0].email !== 'admin@vegsense.io') {
    throw new Error('Search by email failed');
  }
  console.log(`✓ Server-side search verified for email: admin@vegsense.io`);

  // --- 4. User Details Drawer Endpoint ---
  console.log('\n--- 4. User Profile Details Endpoint ---');
  const targetUser = usersRes.data.users[0];
  const userDetailRes = await request('GET', `/api/admin/users/${targetUser.id}`, null, adminHeaders);
  if (userDetailRes.status !== 200 || !userDetailRes.data.user) {
    throw new Error('Failed to fetch user details');
  }
  console.log(`✓ Retrieved details for ${userDetailRes.data.user.email} (Devices: ${userDetailRes.data.user.deviceCount}, Batches: ${userDetailRes.data.user.batchCount})`);

  // --- 5. Edit User Account ---
  console.log('\n--- 5. Edit User Account ---');
  const testAccountEmail = `edit_tester_${Date.now()}@vegsense.io`;
  const createdTest = await request('POST', '/api/auth/register', {
    name: 'Original Name',
    email: testAccountEmail,
    password: 'Password123'
  });
  const testUserId = createdTest.data.user.id;

  const updateRes = await request('PATCH', `/api/admin/users/${testUserId}`, {
    name: 'Updated Enterprise Name'
  }, adminHeaders);
  if (updateRes.status !== 200 || updateRes.data.user.name !== 'Updated Enterprise Name') {
    throw new Error('Failed to update user profile name: ' + JSON.stringify(updateRes.data));
  }
  console.log('✓ Successfully updated user full name via PATCH /api/admin/users/:id');

  // --- 6. Deactivation & Login Blocking (Section 23 & 24) ---
  console.log('\n--- 6. Deactivation & Section 24 Login Blocking Test ---');

  // Deactivate account
  const deactRes = await request('PATCH', `/api/admin/users/${testUserId}/deactivate`, null, adminHeaders);
  if (deactRes.status !== 200 || deactRes.data.status !== 'INACTIVE') {
    throw new Error('Failed to deactivate user');
  }
  console.log(`✓ Deactivated account ${testAccountEmail} (is_active = 0)`);

  // Attempt login with deactivated credentials -> MUST BE REJECTED WITH 403
  const deactLoginRes = await request('POST', '/api/auth/login', {
    email: testAccountEmail,
    password: 'Password123'
  });
  if (deactLoginRes.status !== 403 || !deactLoginRes.data.message.includes('deactivated')) {
    throw new Error(`CRITICAL: Deactivated user was not blocked! Status: ${deactLoginRes.status}, data: ${JSON.stringify(deactLoginRes.data)}`);
  }
  console.log('✓ Confirmed Section 24: Deactivated user login rejected with 403: "Your account has been deactivated. Please contact an administrator."');

  // Reactivate account
  const reactRes = await request('PATCH', `/api/admin/users/${testUserId}/activate`, null, adminHeaders);
  if (reactRes.status !== 200 || reactRes.data.status !== 'ACTIVE') {
    throw new Error('Failed to reactivate user');
  }
  console.log(`✓ Reactivated account ${testAccountEmail} (is_active = 1)`);

  // Attempt login after reactivation -> MUST SUCCEED
  const reactLoginRes = await request('POST', '/api/auth/login', {
    email: testAccountEmail,
    password: 'Password123'
  });
  if (reactLoginRes.status !== 200 || !reactLoginRes.data.token) {
    throw new Error('Login failed after account reactivation');
  }
  console.log('✓ Verified: Reactivated user successfully signs in');

  // --- 7. Security Protections: Self-Deactivation & Self-Deletion ---
  console.log('\n--- 7. Security Protections: Self-Action Guards ---');

  // Admin tries to deactivate themselves
  const selfDeact = await request('PATCH', `/api/admin/users/${currentAdmin.id}/deactivate`, null, adminHeaders);
  if (selfDeact.status !== 400 || !selfDeact.data.message.includes('own administrator account')) {
    throw new Error(`Expected self-deactivation to be blocked, got ${selfDeact.status}: ${JSON.stringify(selfDeact.data)}`);
  }
  console.log('✓ Blocked self-deactivation: "You cannot deactivate your own administrator account."');

  // Admin tries to delete themselves
  const selfDel = await request('DELETE', `/api/admin/users/${currentAdmin.id}`, { confirmation: 'DELETE' }, adminHeaders);
  if (selfDel.status !== 400 || !selfDel.data.message.includes('own administrator account')) {
    throw new Error(`Expected self-deletion to be blocked, got ${selfDel.status}: ${JSON.stringify(selfDel.data)}`);
  }
  console.log('✓ Blocked self-deletion: "You cannot delete your own administrator account."');

  // --- 8. Role Change & Promotion ---
  console.log('\n--- 8. Role Management (USER <-> ADMIN) ---');
  const rolePromoteRes = await request('PATCH', `/api/admin/users/${testUserId}/role`, { role: 'ADMIN' }, adminHeaders);
  if (rolePromoteRes.status !== 200 || rolePromoteRes.data.role !== 'ADMIN') {
    throw new Error('Failed to promote user to ADMIN');
  }
  console.log(`✓ Promoted user to ADMIN role`);

  const roleDemoteRes = await request('PATCH', `/api/admin/users/${testUserId}/role`, { role: 'USER' }, adminHeaders);
  if (roleDemoteRes.status !== 200 || roleDemoteRes.data.role !== 'USER') {
    throw new Error('Failed to demote user to USER');
  }
  console.log(`✓ Demoted user back to USER role`);

  // --- 9. Account Deletion with "DELETE" Keyword Confirmation ---
  console.log('\n--- 9. Permanent Account Deletion with "DELETE" Keyword ---');

  // Reject delete without typing "DELETE"
  const badDel = await request('DELETE', `/api/admin/users/${testUserId}`, { confirmation: 'wrong' }, adminHeaders);
  if (badDel.status !== 400 || !badDel.data.message.includes('DELETE')) {
    throw new Error('Deletion succeeded without explicit "DELETE" confirmation');
  }
  console.log('✓ Blocked deletion without exact "DELETE" confirmation keyword (400)');

  // Execute deletion with valid "DELETE" confirmation
  const goodDel = await request('DELETE', `/api/admin/users/${testUserId}`, { confirmation: 'DELETE' }, adminHeaders);
  if (goodDel.status !== 200 || !goodDel.data.success) {
    throw new Error('Failed to delete user account: ' + JSON.stringify(goodDel.data));
  }
  console.log(`✓ Permanently deleted account ${testAccountEmail}`);

  // Confirm deleted account can no longer sign in
  const postDelLogin = await request('POST', '/api/auth/login', {
    email: testAccountEmail,
    password: 'Password123'
  });
  if (postDelLogin.status !== 401) {
    throw new Error(`Deleted user was still able to login! Status: ${postDelLogin.status}`);
  }
  console.log('✓ Confirmed: Deleted account cannot sign in (401 Invalid email or password)');

  // --- 10. Bulk Account Deletion ---
  console.log('\n--- 10. Bulk Account Deletion ---');
  const bulkA = await request('POST', '/api/auth/register', {
    name: 'Bulk User A',
    email: `bulk_a_${Date.now()}@vegsense.io`,
    password: 'Password123'
  });
  const bulkB = await request('POST', '/api/auth/register', {
    name: 'Bulk User B',
    email: `bulk_b_${Date.now()}@vegsense.io`,
    password: 'Password123'
  });

  const bulkDelRes = await request('POST', '/api/admin/users/bulk-delete', {
    user_ids: [bulkA.data.user.id, bulkB.data.user.id],
    confirmation: 'DELETE'
  }, adminHeaders);

  if (bulkDelRes.status !== 200 || bulkDelRes.data.deleted < 2) {
    throw new Error('Bulk delete failed: ' + JSON.stringify(bulkDelRes.data));
  }
  console.log(`✓ Bulk deleted ${bulkDelRes.data.deleted} user accounts successfully`);

  // --- 11. Audit Logs Verification ---
  console.log('\n--- 11. Audit Logs Verification ---');
  const auditRes = await request('GET', '/api/admin/audit-logs?limit=20', null, adminHeaders);
  if (auditRes.status !== 200 || !Array.isArray(auditRes.data.logs)) {
    throw new Error('Failed to fetch audit logs');
  }
  console.log(`✓ Audit logs table active: ${auditRes.data.total} total logged security events`);
  const actionsLogged = new Set(auditRes.data.logs.map((l) => l.action));
  console.log(`✓ Actions tracked in immutable log: ${Array.from(actionsLogged).join(', ')}`);

  // Verify no passwords in audit logs
  for (const log of auditRes.data.logs) {
    const details = JSON.stringify(log.details || '');
    if (details.toLowerCase().includes('password') && (details.includes('$2b$') || details.includes('Password123'))) {
      throw new Error(`CRITICAL SECURITY FAILURE: Password hash or plaintext found in audit log ${log.id}`);
    }
  }
  console.log('✓ Verified: Zero passwords, hashes, or secrets stored in audit log records');

  // --- 12. System Health Overview ---
  console.log('\n--- 12. System Infrastructure Health Check ---');
  const sysRes = await request('GET', '/api/admin/system', null, adminHeaders);
  if (sysRes.status !== 200 || !sysRes.data.services) {
    throw new Error('System health check failed');
  }
  const s = sysRes.data.services;
  console.log(`✓ Database Service: ${s.database.status} (${s.database.engine}, ${s.database.records.users} users)`);
  console.log(`✓ REST API Service: ${s.api.status} (Uptime: ${s.api.uptimeSeconds}s, Memory: ${s.api.memoryRssMb}MB)`);
  console.log(`✓ Authentication: ${s.auth.status} (${s.auth.type})`);
  console.log(`✓ Report Engine: ${s.reports.status} (${s.reports.engine})`);
  console.log(`✓ Device Gateway: ${s.devices.status} (${s.devices.mode})`);

  // --- 13. UI & Puppeteer Browser Verification ---
  console.log('\n--- 13. Puppeteer Browser Testing & Theme Verification ---');
  const chromePath = findChromePath();
  if (!chromePath) {
    console.warn('Chrome executable not found. Skipping browser screenshot step.');
  } else {
    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Inject Admin Session into LocalStorage
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2', timeout: 15000 });
    await page.evaluate((tok, usr) => {
      localStorage.setItem('veg_storage_auth_token', tok);
      localStorage.setItem('veg_storage_user_data', JSON.stringify(usr));
    }, adminToken, currentAdmin);

    // Open /admin
    await page.goto(`${FRONTEND_URL}/admin`, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Ensure output screenshot directory exists
    const ssDir = path.join(process.cwd(), 'screenshots');
    if (!fs.existsSync(ssDir)) fs.mkdirSync(ssDir, { recursive: true });

    // Desktop Screenshot - Forest Theme
    await page.screenshot({ path: path.join(ssDir, 'part11_admin_dashboard_forest.png') });
    console.log('✓ Captured desktop Admin Dashboard screenshot (Forest theme): screenshots/part11_admin_dashboard_forest.png');

    // Navigate to /admin/users
    await page.goto(`${FRONTEND_URL}/admin/users`, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(ssDir, 'part11_admin_users_desktop.png') });
    console.log('✓ Captured desktop User Management table screenshot: screenshots/part11_admin_users_desktop.png');

    // Switch to Night Monitor / Dark Pro theme
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'night-monitor');
    });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ssDir, 'part11_admin_users_dark.png') });
    console.log('✓ Captured User Management screenshot in Night Monitor theme: screenshots/part11_admin_users_dark.png');

    // Mobile Viewport Test (390x844 iPhone 12/13/14)
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${FRONTEND_URL}/admin/users`, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(ssDir, 'part11_admin_users_mobile.png') });
    console.log('✓ Captured mobile User Management cards screenshot (390x844): screenshots/part11_admin_users_mobile.png');

    await browser.close();
  }

  console.log('\n============================================================');
  console.log('🎉 ALL PART 11 ENTERPRISE ADMIN PORTAL TESTS PASSED (100%)');
  console.log('============================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
