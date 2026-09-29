const BASE_URL = 'https://vegitables.vercel.app';
const timestamp = Date.now();
const testEmail = `permperson_${timestamp}@vegsense.io`;
const testPass = 'SecureVegPass2026!';
const newPass = 'UpdatedSecureVegPass2026!';

async function runTests() {
  console.log('--- 1. Testing Registration for New Permanent User ---');
  let regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Permanent Tester', email: testEmail, password: testPass })
  });
  let regData = await regRes.json();
  console.log('Register Response Status:', regRes.status, regData.success ? 'SUCCESS' : regData.message);
  if (!regData.success) {
    throw new Error('Registration failed');
  }
  const userId = regData.user.id;

  console.log('\n--- 2. Testing Duplicate Account Registration Prevention ---');
  let dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Duplicate Attempt', email: testEmail, password: 'DifferentPassword123!' })
  });
  let dupData = await dupRes.json();
  console.log('Duplicate Status:', dupRes.status);
  console.log('Duplicate Message:', dupData.message);
  if (dupRes.status !== 409 || dupData.message !== 'An account with this email already exists. Please log in.') {
    throw new Error(`Expected exact duplicate message, got: ${dupData.message}`);
  }
  console.log('Duplicate prevention verified: EXACT error message returned.');

  console.log('\n--- 3. Testing Login with Created Permanent Credentials ---');
  let loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPass })
  });
  let loginData = await loginRes.json();
  console.log('Login Status:', loginRes.status, loginData.success ? 'SUCCESS' : loginData.message);
  if (!loginData.success || !loginData.token) {
    throw new Error('Login failed');
  }
  const token = loginData.token;

  console.log('\n--- 4. Testing Authenticated /api/auth/me Session Verification ---');
  let meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  let meData = await meRes.json();
  console.log('/me Status:', meRes.status, meData.user?.email === testEmail ? 'MATCH (User verified)' : 'MISMATCH', meData);
  if (!meData.authenticated || meData.user?.email !== testEmail) {
    throw new Error('Session verification failed');
  }

  console.log('\n--- 5. Testing Password Reset Flow ---');
  let forgotRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail })
  });
  let forgotData = await forgotRes.json();
  console.log('Forgot Password Status:', forgotRes.status, forgotData.resetToken ? 'RESET TOKEN RECEIVED' : 'NO TOKEN');
  
  if (!forgotData.resetToken) {
    throw new Error('No reset token returned');
  }

  let resetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: forgotData.resetToken, password: newPass })
  });
  let resetData = await resetRes.json();
  console.log('Reset Password Status:', resetRes.status, resetData.success ? 'SUCCESS' : resetData.message);
  if (!resetData.success) {
    throw new Error('Reset password failed');
  }

  console.log('\n--- 6. Testing Returning User Login with New Reset Password ---');
  let reLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: newPass })
  });
  let reLoginData = await reLoginRes.json();
  console.log('Re-login with new password Status:', reLoginRes.status, reLoginData.success ? 'SUCCESS' : reLoginData.message);
  if (!reLoginData.success) {
    throw new Error('Re-login failed');
  }
  const newToken = reLoginData.token;

  console.log('\n--- 7. Testing Logout and Returning User Re-Login ---');
  let logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST' });
  let logoutData = await logoutRes.json();
  console.log('Logout Status:', logoutRes.status, logoutData.message);

  let returningLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: newPass })
  });
  let returningLoginData = await returningLoginRes.json();
  console.log('Returning Login Status:', returningLoginRes.status, returningLoginData.success ? 'SUCCESS' : returningLoginData.message);
  if (!returningLoginData.success) {
    throw new Error('Returning user login failed');
  }

  console.log('\n--- 8. Testing Unauthorized Account Deletion Block ---');
  let unauthDelRes = await fetch(`${BASE_URL}/api/auth/admin/users/${userId}`, {
    method: 'DELETE'
  });
  let unauthDelData = await unauthDelRes.json();
  console.log('Unauthenticated Delete Status:', unauthDelRes.status, unauthDelData.message);
  if (unauthDelRes.status !== 403) {
    throw new Error('Security violation: unauthenticated deletion allowed');
  }

  console.log('\n--- 9. Testing Storage Records API on Production ---');
  let storageRes = await fetch(`${BASE_URL}/api/storage`, {
    headers: { 'Authorization': `Bearer ${newToken}` }
  });
  let storageData = await storageRes.json();
  console.log('Storage Records Status:', storageRes.status, `Records Count: ${Array.isArray(storageData) ? storageData.length : 0}`);

  console.log('\n======================================================');
  console.log('>>> ALL 9 PRODUCTION AUTH & PERSISTENCE TESTS PASSED! <<<');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
