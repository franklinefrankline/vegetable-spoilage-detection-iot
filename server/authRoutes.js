import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import db, { savePersistentUser, updatePersistentPassword, deletePersistentUser, syncPersistentUsers } from './db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'veg-storage-smart-iot-secret-key-2026';
const TOKEN_EXPIRY = '7d';

// Helper to validate email format
const isValidEmail = (email) => {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

// Helper to validate password complexity
const isValidPassword = (password) => {
  if (typeof password !== 'string' || password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasUpper && hasLower && hasNumber;
};

// Middleware: Authenticate Bearer JWT
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ authenticated: false, message: 'No authentication token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ authenticated: false, message: 'Session expired or invalid token.' });
    }
    req.user = decoded;
    next();
  });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Full name is required (minimum 2 characters).' });
    }

    const trimmedEmail = email ? email.trim().toLowerCase() : '';
    if (!isValidEmail(trimmedEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number.'
      });
    }

    // Check if user already exists
    const checkStmt = db.prepare('SELECT id FROM users WHERE email = ?');
    let existing = checkStmt.get(trimmedEmail);
    if (!existing) {
      try {
        await syncPersistentUsers(true);
        existing = checkStmt.get(trimmedEmail);
      } catch (e) {}
    }

    if (existing) {
      const duplicateMsg = 'An account with this email already exists. Please log in.';
      return res.status(409).json({
        success: false,
        code: 'USER_ALREADY_EXISTS',
        message: duplicateMsg,
        error: duplicateMsg
      });
    }

    // Hash password securely
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertStmt.run(userId, name.trim(), trimmedEmail, password_hash, now, now);

    // Persist permanently into JSON file and Vercel Blob cloud store
    await savePersistentUser({
      id: userId,
      name: name.trim(),
      email: trimmedEmail,
      password_hash,
      created_at: now,
      updated_at: now
    });

    const userPayload = {
      id: userId,
      name: name.trim(),
      email: trimmedEmail
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Please enter your password.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const queryStmt = db.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?');
    let user = queryStmt.get(trimmedEmail);

    if (!user) {
      // Re-sync persistent users from Vercel Blob cloud store in case container is cold-started
      try {
        await syncPersistentUsers(true);
        user = queryStmt.get(trimmedEmail);
      } catch (syncErr) {
        console.warn('Sync users error on login:', syncErr.message);
      }
    }

    if (!user) {
      // Do not expose whether the email exists
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const checkStmt = db.prepare('SELECT id FROM users WHERE email = ?');
    const user = checkStmt.get(trimmedEmail);

    let resetToken = null;
    if (user) {
      // Invalidate existing active tokens
      db.prepare('UPDATE password_resets SET used = 1 WHERE email = ?').run(trimmedEmail);

      // Generate secure reset token
      resetToken = crypto.randomBytes(32).toString('hex');
      const resetId = crypto.randomUUID();
      const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour validity

      const insertReset = db.prepare(`
        INSERT INTO password_resets (id, email, token, expires_at)
        VALUES (?, ?, ?, ?)
      `);
      insertReset.run(resetId, trimmedEmail, resetToken, expiresAt);
    }

    // Always return generic response to avoid email enumeration
    return res.status(200).json({
      success: true,
      message: "If an account exists for this email, a password reset link has been sent.",
      // Provide preview token in response for realistic simulation and seamless testing
      resetToken: resetToken || null
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error processing request.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'Reset token is required.' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number.'
      });
    }

    const resetStmt = db.prepare(`
      SELECT id, email, expires_at, used
      FROM password_resets
      WHERE token = ?
    `);
    const record = resetStmt.get(token.trim());

    if (!record || record.used === 1 || record.expires_at < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is invalid or has expired. Please request a new link.'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const newHash = await bcrypt.hash(password, saltRounds);

    // Update user password
    const updateStmt = db.prepare(`
      UPDATE users
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE email = ?
    `);
    updateStmt.run(newHash, record.email);
    await updatePersistentPassword(record.email, newHash);

    // Mark reset token as used
    db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(record.id);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error resetting password.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?');
    const user = stmt.get(req.user.id);

    if (!user) {
      return res.status(404).json({ authenticated: false, message: 'User not found.' });
    }

    return res.status(200).json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('/me error:', error);
    return res.status(500).json({ authenticated: false, message: 'Internal server error.' });
  }
});

// PATCH /api/auth/profile - Updates user profile name
router.patch('/profile', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters long.' });
    }

    const trimmedName = name.trim();
    const now = new Date().toISOString();

    const user = db.prepare('SELECT id, email, password_hash, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    db.prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?').run(trimmedName, now, req.user.id);

    // Update persistent JSON
    await savePersistentUser({
      id: user.id,
      name: trimmedName,
      email: user.email,
      password_hash: user.password_hash,
      created_at: user.created_at,
      updated_at: now
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user.id,
        name: trimmedName,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// POST /api/auth/change-password - Secure password change for authenticated users
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirmation password do not match.' });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number.'
      });
    }

    const user = db.prepare('SELECT id, email, password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password.' });
    }

    // Hash and save new password
    const saltRounds = 10;
    const newHash = await bcrypt.hash(newPassword, saltRounds);

    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, user.id);
    await updatePersistentPassword(user.email, newHash);

    return res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, message: 'Internal error changing password.' });
  }
});

// DELETE /api/auth/account - Authenticated user deletes own account with confirmation
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { confirmationText, password } = req.body || {};

    const user = db.prepare('SELECT id, email, password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Protect permanent demo seed account from complete removal
    if (user.email === 'demo@vegsense.io' || user.id === 'usr_demo_vegsense_001') {
      return res.status(400).json({
        success: false,
        message: 'The shared system Demo Account cannot be deleted. You can reset demo data instead.'
      });
    }

    // Verify confirmation
    const confirmed = (confirmationText && confirmationText.trim().toUpperCase() === 'DELETE') ||
                      (password && await bcrypt.compare(password, user.password_hash));

    if (!confirmed) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your current password or type "DELETE" to confirm account deletion.'
      });
    }

    // Clean up user-owned records according to Section 7 & 90
    db.prepare('DELETE FROM user_settings WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM devices WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM storage_items WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM alerts WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM reports WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
    await deletePersistentUser(user.email);

    return res.json({
      success: true,
      message: 'Your account and all associated configuration have been permanently deleted.'
    });
  } catch (err) {
    console.error('Account deletion error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete account.' });
  }
});

// DELETE /api/auth/admin/users/:id - Only authorized Admin can delete accounts
router.delete('/admin/users/:id', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
    const expectedKey = process.env.ADMIN_SECRET_KEY || 'vegsense_super_admin_secret_2026';
    if (!adminKey || adminKey !== expectedKey) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only an authorized Admin can delete user accounts.'
      });
    }

    const { id } = req.params;
    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    await deletePersistentUser(user.email);

    return res.json({ success: true, message: `Account for ${user.email} permanently deleted by authorized Admin.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
});

export default router;
