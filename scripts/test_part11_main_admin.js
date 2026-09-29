import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000';

async function req(url, options = {}) {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('STARTING PART 11 MAIN ADMIN & RBAC VERIFICATION');
  console.log('====================================================\n');

  // TEST 1: Main Admin Login (Email & Username)
  console.log('[1/12] Testing Main Admin Login via Email...');
  const mainLoginEmail = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'vegsense@gmail.com',
      password: process.env.MAIN_ADMIN_PASSWORD || 'VegSense@Admin2026!'
    })
  });
  assert.strictEqual(mainLoginEmail.status, 200, 'Main Admin login with email must succeed');
  assert.strictEqual(mainLoginEmail.data.user.role, 'MAIN_ADMIN', 'Main Admin role must be MAIN_ADMIN');
  assert.strictEqual(mainLoginEmail.data.user.username, 'vegsense', 'Main Admin username must be vegsense');
  assert.strictEqual(mainLoginEmail.data.user.permissions.full_access, 1, 'Main Admin must have full_access = 1');
  const mainToken = mainLoginEmail.data.token;
  console.log('  PASS: Main Admin authenticated via email.');

  console.log('[2/12] Testing Main Admin Login via Username...');
  const mainLoginUsername = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'vegsense', // Accepts username in email field
      password: process.env.MAIN_ADMIN_PASSWORD || 'VegSense@Admin2026!'
    })
  });
  assert.strictEqual(mainLoginUsername.status, 200, 'Main Admin login with username must succeed');
  console.log('  PASS: Main Admin authenticated via username.');

  // TEST 2: Normal User Login & Forbidden Access to Admin APIs
  console.log('[3/12] Testing Normal User blocked from Admin APIs...');
  // Register or login a normal test user
  const userReg = await req('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Normal Test User',
      email: `normal_user_${Date.now()}@example.com`,
      password: 'User@Password123!'
    })
  });
  const userToken = userReg.data.token;
  assert.ok(userToken, 'Normal user must receive token');

  const adminDashboardAsUser = await req('/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert.strictEqual(adminDashboardAsUser.status, 403, 'Normal user must receive 403 on /api/admin/dashboard');

  const adminListAsUser = await req('/api/admin/admins', {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  assert.strictEqual(adminListAsUser.status, 403, 'Normal user must receive 403 on /api/admin/admins');
  console.log('  PASS: Normal user strictly blocked from Admin APIs (403 Forbidden).');

  // TEST 3: Main Admin Creates Administrator
  console.log('[4/12] Main Admin creating operational Administrator...');
  const testAdminUsername = `test_admin_${Date.now().toString().slice(-4)}`;
  const testAdminEmail = `${testAdminUsername}@vegsense.org`;
  const testAdminPassword = 'AdminSecret@2026!';

  const createAdminRes = await req('/api/admin/admins', {
    method: 'POST',
    headers: { Authorization: `Bearer ${mainToken}` },
    body: JSON.stringify({
      name: 'Test Operational Admin',
      username: testAdminUsername,
      email: testAdminEmail,
      password: testAdminPassword,
      is_active: 1,
      full_access: false,
      permissions: {
        user_management: true,
        admin_management: false,
        device_management: true,
        storage_management: true,
        sensor_monitoring: true,
        spoilage_monitoring: true,
        alert_management: true,
        analytics: true,
        reports: true,
        system_settings: false,
        audit_logs: true
      }
    })
  });
  assert.strictEqual(createAdminRes.status, 201, 'Main Admin must be able to create an administrator');
  const createdAdminId = createAdminRes.data.admin.id;
  console.log(`  PASS: Created Administrator ID ${createdAdminId} (@${testAdminUsername}).`);

  // TEST 4: Administrator Login & Permitted Access
  console.log('[5/12] Testing Administrator login via username & email...');
  const adminLoginRes = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testAdminUsername,
      password: testAdminPassword
    })
  });
  assert.strictEqual(adminLoginRes.status, 200, 'Admin must be able to log in via username');
  assert.strictEqual(adminLoginRes.data.user.role, 'ADMIN', 'Role must be ADMIN');
  const adminToken = adminLoginRes.data.token;

  // Admin accesses user directory (has user_management permission)
  const usersAsAdmin = await req('/api/admin/users', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(usersAsAdmin.status, 200, 'Admin with user_management must be able to view users');
  console.log('  PASS: Administrator login and permitted module access verified.');

  // TEST 5: Privilege Escalation Protection
  console.log('[6/12] Testing privilege escalation protection...');
  // 1. Admin without admin_management tries to create another Admin -> 403
  const adminCreatesAdmin = await req('/api/admin/admins', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'Escalated Admin',
      username: `esc_${Date.now()}`,
      email: `esc_${Date.now()}@vegsense.org`,
      password: 'AdminPassword123!'
    })
  });
  assert.strictEqual(adminCreatesAdmin.status, 403, 'Admin without admin_management cannot create Admin');

  // 2. Admin tries to delete Main Admin -> 403
  const mainAdminId = mainLoginEmail.data.user.id;
  const adminDeletesMain = await req(`/api/admin/admins/${mainAdminId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ confirmation: 'DELETE' })
  });
  assert.strictEqual(adminDeletesMain.status, 403, 'Admin cannot delete Main Admin');

  // 3. Admin tries to modify their own permissions -> 403
  const adminEditsOwnPerms = await req(`/api/admin/admins/${createdAdminId}/permissions`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ full_access: true })
  });
  assert.strictEqual(adminEditsOwnPerms.status, 403, 'Admin cannot modify permissions (Main Admin only)');
  console.log('  PASS: All privilege escalation attempts strictly rejected (403 Forbidden).');

  // TEST 6: Main Admin Account Protection
  console.log('[7/12] Testing Main Admin permanent protection...');
  // Main admin deletes themselves -> 403
  const mainDeletesSelf = await req(`/api/admin/admins/${mainAdminId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${mainToken}` },
    body: JSON.stringify({ confirmation: 'DELETE' })
  });
  assert.strictEqual(mainDeletesSelf.status, 403, 'Main Admin cannot self-delete');

  // Main admin deactivates themselves -> 403
  const mainDeactivatesSelf = await req(`/api/admin/admins/${mainAdminId}/deactivate`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${mainToken}` }
  });
  assert.strictEqual(mainDeactivatesSelf.status, 403, 'Main Admin cannot self-deactivate');
  console.log('  PASS: Main Admin account is permanent and protected.');

  // TEST 7: Main Admin Modifies Administrator Permissions
  console.log('[8/12] Testing Main Admin updating administrator permissions...');
  const updatePermsRes = await req(`/api/admin/admins/${createdAdminId}/permissions`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${mainToken}` },
    body: JSON.stringify({
      full_access: false,
      admin_management: true,
      user_management: true
    })
  });
  assert.strictEqual(updatePermsRes.status, 200, 'Main Admin can update administrator permissions');
  assert.strictEqual(updatePermsRes.data.permissions.admin_management, 1, 'admin_management should now be 1');
  console.log('  PASS: Administrator permissions successfully updated.');

  // TEST 8: Main Admin Resets Administrator Password
  console.log('[9/12] Testing Administrator password reset...');
  const newSecret = 'NewSecurePass@2026!';
  const resetPassRes = await req(`/api/admin/admins/${createdAdminId}/reset-password`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${mainToken}` },
    body: JSON.stringify({ password: newSecret })
  });
  assert.strictEqual(resetPassRes.status, 200, 'Password reset must succeed');

  // Login with new password
  const newLoginRes = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testAdminEmail,
      password: newSecret
    })
  });
  assert.strictEqual(newLoginRes.status, 200, 'Admin must be able to log in with newly reset password');
  console.log('  PASS: Administrator password reset and verified.');

  // TEST 9: Deactivate & Reactivate Administrator
  console.log('[10/12] Testing Administrator deactivation & reactivation...');
  const deactRes = await req(`/api/admin/admins/${createdAdminId}/deactivate`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${mainToken}` }
  });
  assert.strictEqual(deactRes.status, 200, 'Deactivation must succeed');

  // Deactivated admin login attempt
  const deactLoginRes = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testAdminEmail,
      password: newSecret
    })
  });
  assert.strictEqual(deactLoginRes.status, 403, 'Deactivated admin login must be rejected (403)');
  assert.ok(deactLoginRes.data.message.includes('deactivated'), 'Deactivation message must be clear');

  // Reactivate
  const actRes = await req(`/api/admin/admins/${createdAdminId}/activate`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${mainToken}` }
  });
  assert.strictEqual(actRes.status, 200, 'Reactivation must succeed');
  console.log('  PASS: Administrator deactivation blocks login; reactivation restores access.');

  // TEST 10: Delete Administrator Permanently
  console.log('[11/12] Testing permanent deletion of administrator...');
  const delRes = await req(`/api/admin/admins/${createdAdminId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${mainToken}` },
    body: JSON.stringify({ confirmation: 'DELETE' })
  });
  assert.strictEqual(delRes.status, 200, 'Deletion must succeed');

  // Verify login fails
  const delLoginRes = await req('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testAdminEmail,
      password: newSecret
    })
  });
  assert.strictEqual(delLoginRes.status, 401, 'Deleted admin can no longer log in (401)');
  console.log('  PASS: Administrator deleted permanently; login immediately revoked.');

  // TEST 11: System Devices Directory & System Health
  console.log('[12/12] Testing System Devices Directory and Health APIs...');
  const devicesRes = await req('/api/admin/devices', {
    headers: { Authorization: `Bearer ${mainToken}` }
  });
  assert.strictEqual(devicesRes.status, 200, 'Devices directory must return 200');
  assert.ok(Array.isArray(devicesRes.data.devices), 'Devices must be an array');

  const healthRes = await req('/api/admin/system', {
    headers: { Authorization: `Bearer ${mainToken}` }
  });
  assert.strictEqual(healthRes.status, 200, 'System health must return 200');
  assert.ok(healthRes.data.services.database, 'Database health check must be present');
  assert.ok(healthRes.data.services.api, 'API health check must be present');
  assert.ok(healthRes.data.services.auth, 'Auth health check must be present');
  console.log('  PASS: System hardware registry and multi-service health checks verified.');

  console.log('\n====================================================');
  console.log('ALL PART 11 BACKEND & RBAC ACCEPTANCE TESTS PASSED!');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
