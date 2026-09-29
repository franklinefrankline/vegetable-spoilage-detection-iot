import express from 'express';
import jwt from 'jsonwebtoken';
import {
  getUserSettings,
  updateUserSettings,
  resetUserSettings,
  resetUserDemoData,
  exportUserData
} from './settingsService.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'veg-storage-smart-iot-secret-key-2026';

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Session expired or invalid token.' });
    }
  }

  // Fallback for query param / headers in demo or test modes
  const fallbackId = req.query.userId || req.body?.userId || req.headers['x-user-id'];
  if (fallbackId) {
    req.user = { id: fallbackId };
    return next();
  }

  // Default to demo account if in demo mode
  req.user = { id: 'usr_demo_vegsense_001' };
  next();
}

router.use(requireAuth);

/**
 * GET /api/settings
 * Retrieves all user settings (theme, thresholds, alerts, notifications, weights)
 */
router.get('/', (req, res) => {
  try {
    const settings = getUserSettings(req.user.id);
    return res.json({ success: true, settings });
  } catch (err) {
    console.error('Error fetching settings:', err);
    return res.status(500).json({ success: false, error: err.message || 'Unable to load settings.' });
  }
});

/**
 * PATCH /api/settings
 * Updates any subset of settings with validation
 */
router.patch('/', (req, res) => {
  try {
    const updated = updateUserSettings(req.user.id, req.body || {});
    return res.json({
      success: true,
      message: 'Settings saved successfully.',
      settings: updated
    });
  } catch (err) {
    const status = err.status || 400;
    return res.status(status).json({
      success: false,
      error: 'SETTINGS_UPDATE_FAILED',
      message: err.message || 'Unable to save settings.'
    });
  }
});

/**
 * GET /api/settings/thresholds
 * Returns current thresholds and weights
 */
router.get('/thresholds', (req, res) => {
  try {
    const settings = getUserSettings(req.user.id);
    return res.json({
      success: true,
      thresholds: {
        temperature_warning: settings.temperature_warning_threshold,
        temperature_high: settings.temperature_high_threshold,
        humidity_low: settings.humidity_low_threshold,
        humidity_high: settings.humidity_high_threshold,
        gas_elevated: settings.gas_elevated_threshold,
        gas_high: settings.gas_high_threshold,
        light_low: settings.light_low_threshold,
        light_high: settings.light_high_threshold,
        spoilage_warning: settings.spoilage_warning_threshold,
        spoilage_risk: settings.spoilage_risk_threshold,
        spoilage_critical: settings.spoilage_critical_threshold,
        weights: {
          temperature: settings.weight_temperature,
          humidity: settings.weight_humidity,
          gas: settings.weight_gas,
          light: settings.weight_light,
          storage_age: settings.weight_age
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Unable to load thresholds.' });
  }
});

/**
 * PATCH /api/settings/thresholds
 * Validates and updates thresholds and weights
 */
router.patch('/thresholds', (req, res) => {
  try {
    const body = req.body || {};
    const updates = {};
    if (body.temperature_warning !== undefined) updates.temperature_warning_threshold = body.temperature_warning;
    if (body.temperature_high !== undefined) updates.temperature_high_threshold = body.temperature_high;
    if (body.humidity_low !== undefined) updates.humidity_low_threshold = body.humidity_low;
    if (body.humidity_high !== undefined) updates.humidity_high_threshold = body.humidity_high;
    if (body.gas_elevated !== undefined) updates.gas_elevated_threshold = body.gas_elevated;
    if (body.gas_high !== undefined) updates.gas_high_threshold = body.gas_high;
    if (body.light_low !== undefined) updates.light_low_threshold = body.light_low;
    if (body.light_high !== undefined) updates.light_high_threshold = body.light_high;
    if (body.spoilage_warning !== undefined) updates.spoilage_warning_threshold = body.spoilage_warning;
    if (body.spoilage_risk !== undefined) updates.spoilage_risk_threshold = body.spoilage_risk;
    if (body.spoilage_critical !== undefined) updates.spoilage_critical_threshold = body.spoilage_critical;

    if (body.weights) {
      if (body.weights.temperature !== undefined) updates.weight_temperature = body.weights.temperature;
      if (body.weights.humidity !== undefined) updates.weight_humidity = body.weights.humidity;
      if (body.weights.gas !== undefined) updates.weight_gas = body.weights.gas;
      if (body.weights.light !== undefined) updates.weight_light = body.weights.light;
      if (body.weights.storage_age !== undefined) updates.weight_age = body.weights.storage_age;
    }

    // Direct field overrides if passed
    for (const k of [
      'temperature_warning_threshold', 'temperature_high_threshold',
      'humidity_low_threshold', 'humidity_high_threshold',
      'gas_elevated_threshold', 'gas_high_threshold',
      'light_low_threshold', 'light_high_threshold',
      'spoilage_warning_threshold', 'spoilage_risk_threshold', 'spoilage_critical_threshold',
      'weight_temperature', 'weight_humidity', 'weight_gas', 'weight_light', 'weight_age'
    ]) {
      if (body[k] !== undefined) updates[k] = body[k];
    }

    const updated = updateUserSettings(req.user.id, updates);
    return res.json({
      success: true,
      message: 'Thresholds and weights updated successfully.',
      settings: updated
    });
  } catch (err) {
    const status = err.status || 400;
    return res.status(status).json({
      success: false,
      error: 'THRESHOLD_UPDATE_FAILED',
      message: err.message || 'Unable to update thresholds.'
    });
  }
});

/**
 * GET /api/settings/notifications
 */
router.get('/notifications', (req, res) => {
  try {
    const s = getUserSettings(req.user.id);
    return res.json({
      success: true,
      notifications: {
        notifications_enabled: Boolean(s.notifications_enabled),
        browser_notifications_enabled: Boolean(s.browser_notifications_enabled),
        critical_alerts_enabled: Boolean(s.critical_alerts_enabled),
        high_alerts_enabled: Boolean(s.high_alerts_enabled),
        warning_alerts_enabled: Boolean(s.warning_alerts_enabled),
        info_alerts_enabled: Boolean(s.info_alerts_enabled),
        categories: {
          temperature: Boolean(s.temperature_alerts_enabled),
          humidity: Boolean(s.humidity_alerts_enabled),
          gas: Boolean(s.gas_alerts_enabled),
          light: Boolean(s.light_alerts_enabled),
          spoilage: Boolean(s.spoilage_alerts_enabled),
          expiry: Boolean(s.expiry_alerts_enabled),
          device: Boolean(s.device_alerts_enabled),
          sensor: Boolean(s.sensor_alerts_enabled)
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Unable to load notification settings.' });
  }
});

/**
 * PATCH /api/settings/notifications
 */
router.patch('/notifications', (req, res) => {
  try {
    const updated = updateUserSettings(req.user.id, req.body || {});
    return res.json({
      success: true,
      message: 'Notification settings saved.',
      settings: updated
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Unable to save notification settings.' });
  }
});

/**
 * GET /api/settings/appearance
 */
router.get('/appearance', (req, res) => {
  try {
    const s = getUserSettings(req.user.id);
    return res.json({
      success: true,
      appearance: {
        theme: s.theme,
        accent: s.accent,
        card_style: s.card_style,
        font_size: s.font_size,
        animation: s.animation
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Unable to load appearance settings.' });
  }
});

/**
 * PATCH /api/settings/appearance
 */
router.patch('/appearance', (req, res) => {
  try {
    const { theme, accent, card_style, font_size, animation } = req.body || {};
    const updates = {};
    if (theme) updates.theme = theme;
    if (accent) updates.accent = accent;
    if (card_style) updates.card_style = card_style;
    if (font_size) updates.font_size = font_size;
    if (animation) updates.animation = animation;

    const updated = updateUserSettings(req.user.id, updates);
    return res.json({
      success: true,
      message: 'Appearance settings updated.',
      settings: updated
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Unable to update appearance.' });
  }
});

/**
 * POST /api/settings/reset
 * Resets settings back to default baseline without touching data
 */
router.post('/reset', (req, res) => {
  try {
    const reset = resetUserSettings(req.user.id);
    return res.json({
      success: true,
      message: 'Settings have been reset to factory defaults.',
      settings: reset
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to reset settings.' });
  }
});

/**
 * POST /api/settings/reset-demo
 * Resets demo mode telemetry and alerts without affecting real data
 */
router.post('/reset-demo', (req, res) => {
  try {
    const result = resetUserDemoData(req.user.id);
    return res.json({
      success: true,
      message: 'Demo mode data reset successfully. Real device records were not affected.',
      details: result
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to reset demo data.' });
  }
});

/**
 * GET /api/settings/export
 * Exports authenticated user's complete data archive
 */
router.get('/export', (req, res) => {
  try {
    const data = exportUserData(req.user.id);
    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Disposition', `attachment; filename="VegSense_Data_Export_${dateStr}.json"`);
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error exporting user data:', err);
    return res.status(500).json({ success: false, message: 'Unable to export user data.' });
  }
});

export default router;
