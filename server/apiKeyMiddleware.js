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

/**
 * Reusable server-side middleware that protects routes with VEGSENSE_API_KEY.
 * Reads 'x-api-key' request header.
 * - Missing production secret: fails closed (401).
 * - Missing header: rejects with 401.
 * - Incorrect key: rejects with 403.
 * - Valid key: permits request and sets req.apiKeyAuthenticated = true.
 * Does not log key values.
 */
export const requireApiKey = (req, res, next) => {
  const configuredKey = process.env.VEGSENSE_API_KEY;

  if (!configuredKey || typeof configuredKey !== 'string' || configuredKey.trim().length === 0) {
    return res.status(401).json({
      success: false,
      error: 'API_KEY_UNAVAILABLE',
      message: 'API key authentication is currently unavailable.'
    });
  }

  const providedKey = req.headers['x-api-key'];

  if (!providedKey || typeof providedKey !== 'string' || providedKey.trim().length === 0) {
    return res.status(401).json({
      success: false,
      error: 'MISSING_API_KEY',
      message: 'API key required. Please provide a valid key in the x-api-key header.'
    });
  }

  const isValid = verifyApiKey(providedKey.trim(), configuredKey.trim());
  if (!isValid) {
    return res.status(403).json({
      success: false,
      error: 'INVALID_API_KEY',
      message: 'Invalid API key provided.'
    });
  }

  req.apiKeyAuthenticated = true;
  next();
};

/**
 * Dual authentication middleware: accepts EITHER a valid Bearer JWT (browser sessions)
 * OR a valid x-api-key header (server-to-server or IoT telemetry ingestion).
 */
export const requireAuthOrApiKey = (req, res, next) => {
  const apiKeyHeader = req.headers['x-api-key'];
  if (apiKeyHeader) {
    return requireApiKey(req, res, next);
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const secret = getJwtSecret();
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
      return next();
    } catch (err) {
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
