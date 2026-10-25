/**
 * VegSense Centralized JWT Configuration & Validation
 * Eliminates hardcoded production fallbacks and guarantees consistent secret handling.
 */

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  const INSECURE_FALLBACK = 'veg-storage-smart-iot-secret-key-2026';

  if (!secret || secret.trim() === '' || secret === INSECURE_FALLBACK) {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      throw new Error('FATAL: JWT_SECRET environment variable is missing or set to insecure default in production.');
    }
    console.warn('[AUTH WARNING] JWT_SECRET not set in environment. Using local development fallback.');
    return INSECURE_FALLBACK;
  }

  return secret.trim();
}
