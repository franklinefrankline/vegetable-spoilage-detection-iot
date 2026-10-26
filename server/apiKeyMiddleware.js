import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from './jwtConfig.js';

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

import db from './db.js';

/**
 * Reusable server-side middleware that protects routes with VEGSENSE_API_KEY or provisioned device tokens.
 * Reads 'x-api-key', 'x-device-token', or Bearer token header.
 * - Missing production secret and no device token: fails closed (401).
 * - Missing header: rejects with 401.
 * - Incorrect key: rejects with 403.
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
      message: 'API key required. Please provide a valid key in the x-api-key header.'
    });
  }

  const cleanProvided = providedKey.trim();

  // 1. Verify against configured master VEGSENSE_API_KEY in constant time
  if (configuredKey && typeof configuredKey === 'string' && configuredKey.trim().length > 0) {
    if (verifyApiKey(cleanProvided, configuredKey.trim())) {
      req.apiKeyAuthenticated = true;
      return next();
    }
  }

  // 2. Verify against provisioned device credentials in the database
  try {
    const device = db.prepare(`
      SELECT * FROM devices
      WHERE (device_token IS NOT NULL AND device_token = ?)
         OR (api_key IS NOT NULL AND api_key = ?)
      LIMIT 1
    `).get(cleanProvided, cleanProvided);

    if (device) {
      req.apiKeyAuthenticated = true;
      req.authenticatedDevice = device;
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
        const device = db.prepare(`
          SELECT * FROM devices
          WHERE (device_token IS NOT NULL AND device_token = ?)
             OR (api_key IS NOT NULL AND api_key = ?)
          LIMIT 1
        `).get(token.trim(), token.trim());

        if (device) {
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
