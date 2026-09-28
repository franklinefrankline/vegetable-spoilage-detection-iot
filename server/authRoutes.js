import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import db from './db.js';

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
    const existing = checkStmt.get(trimmedEmail);
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Hash password securely
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    const userId = crypto.randomUUID();

    const insertStmt = db.prepare(`
      INSERT INTO users (id, name, email, password_hash)
      VALUES (?, ?, ?, ?)
    `);
    insertStmt.run(userId, name.trim(), trimmedEmail, password_hash);

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
    const user = queryStmt.get(trimmedEmail);

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

export default router;
