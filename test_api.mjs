async function runTests() {
  const BASE_URL = 'http://localhost:5000/api/auth';
  const logPass = (name) => console.log(`\x1b[32m✔ PASS: ${name}\x1b[0m`);
  const logFail = (name, err) => {
    console.error(`\x1b[31m✘ FAIL: ${name}\x1b[0m`, err);
    process.exit(1);
  };

  const uniqueSuffix = Date.now();
  const testUser = {
    name: 'Frank AgriTech',
    email: `frank.farmer_${uniqueSuffix}@example.com`,
    password: 'SafeStorage123'
  };

  try {
    // 1. Weak password registration test
    let res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Frank', email: 'test@example.com', password: 'weak' })
    });
    if (res.status === 400) {
      logPass('Reject weak password during registration');
    } else {
      throw new Error(`Expected 400 for weak password, got ${res.status}`);
    }

    // 2. Successful Registration
    res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    let data = await res.json();
    if (res.status === 201 && data.success && data.token && data.user.email === testUser.email) {
      logPass('Register new user successfully with token & user object');
    } else {
      throw new Error(`Registration failed: ${JSON.stringify(data)}`);
    }

    // 3. Duplicate Email Registration
    res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    data = await res.json();
    if (res.status === 409 && data.message.includes('already exists')) {
      logPass('Prevent duplicate email registration');
    } else {
      throw new Error(`Expected 409 duplicate email, got ${res.status}: ${JSON.stringify(data)}`);
    }

    // 4. Login with registered user
    res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password })
    });
    data = await res.json();
    if (res.status === 200 && data.success && data.token) {
      logPass('Login with correct credentials succeeds');
    } else {
      throw new Error(`Login failed: ${JSON.stringify(data)}`);
    }
    const token = data.token;

    // 5. Login with invalid password
    res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: 'WrongPassword999' })
    });
    data = await res.json();
    if (res.status === 401 && data.message === 'Invalid email or password.') {
      logPass('Reject incorrect password with generic message');
    } else {
      throw new Error(`Expected 401 for bad password, got ${res.status}`);
    }

    // 6. Login with nonexistent email
    res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@example.com', password: 'SafePassword123' })
    });
    data = await res.json();
    if (res.status === 401 && data.message === 'Invalid email or password.') {
      logPass('Reject nonexistent email without exposing existence');
    } else {
      throw new Error(`Expected 401 for unknown user, got ${res.status}`);
    }

    // 7. Verify session with /api/auth/me
    res = await fetch(`${BASE_URL}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    data = await res.json();
    if (res.status === 200 && data.authenticated && data.user.id) {
      logPass('GET /api/auth/me validates session and returns user');
    } else {
      throw new Error(`Session verify failed: ${JSON.stringify(data)}`);
    }

    // 8. Forgot Password Flow
    res = await fetch(`${BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email })
    });
    data = await res.json();
    if (res.status === 200 && data.message.includes('password reset link has been sent')) {
      logPass('Forgot password returns generic confirmation');
    } else {
      throw new Error(`Forgot password failed: ${JSON.stringify(data)}`);
    }
    const resetToken = data.resetToken;
    if (!resetToken) {
      throw new Error('Reset token was not generated');
    }
    logPass('Generated secure reset token in database');

    // 9. Reset Password with new credentials
    const newPassword = 'NewSecretPassword2026';
    res = await fetch(`${BASE_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, password: newPassword })
    });
    data = await res.json();
    if (res.status === 200 && data.success) {
      logPass('Password reset successfully with token');
    } else {
      throw new Error(`Reset password failed: ${JSON.stringify(data)}`);
    }

    // 10. Attempt to reuse reset token (must fail)
    res = await fetch(`${BASE_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, password: 'AnotherPassword123' })
    });
    if (res.status === 400) {
      logPass('Prevent token reuse after password reset');
    } else {
      throw new Error('Expected 400 when reusing reset token');
    }

    // 11. Login with new password
    res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: newPassword })
    });
    data = await res.json();
    if (res.status === 200 && data.success) {
      logPass('Login succeeds with newly reset password');
    } else {
      throw new Error('Login with new password failed');
    }

    // 12. Old password must now fail
    res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password })
    });
    if (res.status === 401) {
      logPass('Old password successfully invalidated');
    } else {
      throw new Error('Old password should have been rejected');
    }

    console.log('\n\x1b[32m★ ALL BACKEND AUTHENTICATION UNIT TESTS PASSED! ★\x1b[0m\n');
  } catch (err) {
    logFail('Test suite execution', err);
  }
}

runTests();
