import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from './jwtConfig.js';
import db from './db.js';

// Lightweight in-memory sliding-window rate limiter for IoT ingestion
const rateLimitMap = new Map();

// Periodic cleanup every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now - entry.resetTime > 120000) {
      rateLimitMap.delete(key);
    }
  }
}, 300000).unref();

function checkRateLimit(key, maxRequests = 40, windowMs = 60000) {
  const now = Date.now();
  let entry = rateLimitMap.get(key);
  if (!entry || now - entry.resetTime > windowMs) {
    entry = { count: 1, resetTime: now };
    rateLimitMap.set(key, entry);
    return { allowed: true };
  }
  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetTime + windowMs - now) / 1000) };
  }
  return { allowed: true };
}

/**
 * Constant-time comparison between provided API key and configured secret key.
 * Uses SHA-256 digests to ensure equal 32-byte buffer comparison without timing leaks.
 */
export function verifyApiKey(providedKey, configuredKey) {
  if (
    !providedKey ||
    !configuredKey ||
    typeof providedKey !== 'string' ||
    typeof configuredKey !== 'string'
  ) {
    return false;
  }

  try {
    const hashA = crypto.createHash('sha256').update(providedKey.trim()).digest();
    const hashB = crypto.createHash('sha256').update(configuredKey.trim()).digest();
    return crypto.timingSafeEqual(hashA, hashB);
  } catch (err) {
    return false;
  }
}

/**
 * Reusable server-side middleware that protects routes with VEGSENSE_API_KEY or provisioned device tokens.
 * Reads 'x-api-key', 'x-device-token', or Bearer token header.
 * - Missing header: rejects with 401.
 * - Revoked device: rejects with 403 DEVICE_REVOKED.
 * - Incorrect key: rejects with 403 INVALID_API_KEY.
 * - Rate limit exceeded: rejects with 429 TOO_MANY_REQUESTS.
 * - Valid key: permits request and sets req.apiKeyAuthenticated = true.
 * Does not log key values.
 */
export const requireApiKey = (req, res, next) => {
  const configuredKey = process.env.VEGSENSE_API_KEY;
  const providedKey = req.headers['x-api-key'] || req.headers['x-device-token'];

  if (!providedKey || typeof providedKey !== 'string' || providedKey.trim().length === 0) {
    return res.status(401).json({
      success: false,
      error: 'MISSING_API_KEY',
      message: 'API key required. Please provide a valid key in the x-api-key or x-device-token header.'
    });
  }

  const cleanProvided = providedKey.trim();

  // Rate limiting per provided key / IP
  const rateLimitKey = `${req.ip || 'ip'}_${cleanProvided.slice(0, 10)}`;
  const rateLimitCheck = checkRateLimit(rateLimitKey, 45, 60000); // 45 reqs per minute
  if (!rateLimitCheck.allowed) {
    res.setHeader('Retry-After', String(rateLimitCheck.retryAfter || 5));
    return res.status(429).json({
      success: false,
      error: 'TOO_MANY_REQUESTS',
      message: 'Ingestion rate limit exceeded. Please upload telemetry at 10-second intervals.'
    });
  }

  // 1. Verify against configured master VEGSENSE_API_KEY in constant time
  if (configuredKey && typeof configuredKey === 'string' && configuredKey.trim().length > 0) {
    if (verifyApiKey(cleanProvided, configuredKey.trim())) {
      req.apiKeyAuthenticated = true;
      return next();
    }
  }

  // 2. Verify against provisioned device credentials in the database (raw token, token_hash, or api_key)
  try {
    const tokenHash = crypto.createHash('sha256').update(cleanProvided).digest('hex');
    const device = db.prepare(`
      SELECT * FROM devices
      WHERE (device_token IS NOT NULL AND device_token = ?)
         OR (token_hash IS NOT NULL AND token_hash = ?)
         OR (api_key IS NOT NULL AND api_key = ?)
      LIMIT 1
    `).get(cleanProvided, tokenHash, cleanProvided);

    if (device) {
      // Check if device is active or revoked
      if (device.is_active === 0 || device.status === 'REVOKED' || device.status === 'revoked') {
        return res.status(403).json({
          success: false,
          error: 'DEVICE_REVOKED',
          message: 'This device credential has been revoked or deactivated.'
        });
      }

      req.apiKeyAuthenticated = true;
      req.authenticatedDevice = device;

      // Update last_used_at asynchronously
      try {
        db.prepare('UPDATE devices SET last_used_at = ? WHERE id = ?').run(new Date().toISOString(), device.id);
      } catch (_) {}

      return next();
    }
  } catch (dbErr) {
    console.warn('[Auth] Notice checking device token:', dbErr.message);
  }

  return res.status(403).json({
    success: false,
    error: 'INVALID_API_KEY',
    message: 'Invalid API key or device token provided.'
  });
};

/**
 * Dual authentication middleware: accepts EITHER a valid Bearer JWT (browser sessions)
 * OR a valid x-api-key / x-device-token header (server-to-server or IoT telemetry ingestion).
 */
export const requireAuthOrApiKey = (req, res, next) => {
  const apiKeyHeader = req.headers['x-api-key'] || req.headers['x-device-token'];
  if (apiKeyHeader) {
    return requireApiKey(req, res, next);
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    // 1. Check if token is a valid JWT session token
    try {
      const secret = getJwtSecret();
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
      return next();
    } catch (err) {
      // 2. If token is not a JWT, check if it was provided as an API key via Bearer token
      const configuredKey = process.env.VEGSENSE_API_KEY;
      if (configuredKey && verifyApiKey(token.trim(), configuredKey.trim())) {
        req.apiKeyAuthenticated = true;
        return next();
      }

      try {
        const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
        const device = db.prepare(`
          SELECT * FROM devices
          WHERE (device_token IS NOT NULL AND device_token = ?)
             OR (token_hash IS NOT NULL AND token_hash = ?)
             OR (api_key IS NOT NULL AND api_key = ?)
          LIMIT 1
        `).get(token.trim(), tokenHash, token.trim());

        if (device) {
          if (device.is_active === 0 || device.status === 'REVOKED' || device.status === 'revoked') {
            return res.status(403).json({
              success: false,
              error: 'DEVICE_REVOKED',
              message: 'This device credential has been revoked or deactivated.'
            });
          }

          req.apiKeyAuthenticated = true;
          req.authenticatedDevice = device;
          return next();
        }
      } catch (_) {}

      return res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Session expired or invalid authentication token.'
      });
    }
  }

  return res.status(401).json({
    success: false,
    error: 'AUTHENTICATION_REQUIRED',
    message: 'Authentication required. Please provide a valid JWT Bearer token or x-api-key header.'
  });
};
