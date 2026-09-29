import express from 'express';
import db from './db.js';
import crypto from 'node:crypto';

const router = express.Router();

/**
 * POST /api/device/save
 * Associates or updates an ESP32 device for an authenticated user.
 */
router.post('/device/save', (req, res) => {
  const { userId, deviceName, ipAddress, status } = req.body;

  if (!userId || !ipAddress) {
    return res.status(400).json({ success: false, error: 'User ID and IP address are required.' });
  }

  try {
    const existing = db.prepare('SELECT id FROM devices WHERE user_id = ?').get(userId);
    const now = new Date().toISOString();

    if (existing) {
      db.prepare(`
        UPDATE devices
        SET device_name = ?, ip_address = ?, status = ?, last_connected = ?, updated_at = ?
        WHERE id = ?
      `).run(deviceName || 'ESP32-001', ipAddress, status || 'connected', now, now, existing.id);

      return res.json({
        success: true,
        device: { id: existing.id, userId, deviceName: deviceName || 'ESP32-001', ipAddress, status: status || 'connected', lastConnected: now }
      });
    } else {
      const id = 'dev_' + crypto.randomUUID().slice(0, 8);
      db.prepare(`
        INSERT INTO devices (id, user_id, device_name, ip_address, status, last_connected, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, userId, deviceName || 'ESP32-001', ipAddress, status || 'connected', now, now, now);

      return res.json({
        success: true,
        device: { id, userId, deviceName: deviceName || 'ESP32-001', ipAddress, status: status || 'connected', lastConnected: now }
      });
    }
  } catch (err) {
    console.error('Error saving device:', err);
    return res.status(500).json({ success: false, error: 'Database error saving device.' });
  }
});

/**
 * GET /api/device/:userId
 * Retrieves the saved device for a specific user.
 */
router.get('/device/:userId', (req, res) => {
  const { userId } = req.params;
  try {
    const device = db.prepare('SELECT * FROM devices WHERE user_id = ?').get(userId);
    if (!device) {
      return res.json({ success: true, device: null });
    }
    return res.json({ success: true, device });
  } catch (err) {
    console.error('Error fetching device:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

/**
 * POST /api/readings
 * Records an actual sensor reading into history.
 */
router.post('/readings', (req, res) => {
  const {
    deviceId,
    temperature,
    humidity,
    gasLevel,
    lightLevel,
    light_level,
    spoilageRisk,
    spoilage_risk,
    lightRisk,
    light_risk,
    lightClassification,
    light_classification,
    storageStatus,
    storage_status
  } = req.body;

  if (!deviceId || temperature === undefined || humidity === undefined || gasLevel === undefined) {
    return res.status(400).json({ success: false, error: 'Required sensor fields missing.' });
  }

  try {
    const id = 'rd_' + crypto.randomUUID().slice(0, 10);
    const now = new Date().toISOString();

    const finalLight = lightLevel !== undefined ? Number(lightLevel) : (light_level !== undefined ? Number(light_level) : 420);
    const finalLightRisk = lightRisk !== undefined ? Number(lightRisk) : (light_risk !== undefined ? Number(light_risk) : 10);
    const finalLightClass = lightClassification || light_classification || 'NORMAL LIGHT';
    const finalRisk = spoilageRisk !== undefined ? Number(spoilageRisk) : (spoilage_risk !== undefined ? Number(spoilage_risk) : 0);
    const finalStatus = storageStatus || storage_status || 'FRESH';

    db.prepare(`
      INSERT INTO sensor_readings (id, device_id, temperature, humidity, gas_level, light_level, spoilage_risk, light_risk, light_classification, storage_status, recorded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, deviceId, temperature, humidity, gasLevel, finalLight, finalRisk, finalLightRisk, finalLightClass, finalStatus, now);

    return res.json({ success: true, readingId: id });
  } catch (err) {
    console.error('Error storing sensor reading:', err);
    return res.status(500).json({ success: false, error: 'Database error storing reading.' });
  }
});

/**
 * GET /api/data (Section 12: Real ESP32 API spec)
 * Returns live or baseline environmental & light telemetry in exact Section 12 format.
 */
router.get('/data', (req, res) => {
  try {
    const latest = db.prepare('SELECT * FROM sensor_readings ORDER BY recorded_at DESC LIMIT 1').get();
    if (latest) {
      return res.json({
        temperature: latest.temperature,
        humidity: latest.humidity,
        gas_level: latest.gas_level,
        light_level: latest.light_level ?? 420,
        status: latest.storage_status || 'FRESH',
        spoilage_risk: latest.spoilage_risk || 18,
        light_classification: latest.light_classification || 'NORMAL LIGHT',
        light_risk: latest.light_risk ?? 10
      });
    }
  } catch (e) {
    console.warn('[API] Fallback for GET /api/data:', e.message);
  }

  // Baseline Section 12 response
  return res.json({
    temperature: 28.5,
    humidity: 72,
    gas_level: 420,
    light_level: 420,
    status: 'FRESH',
    spoilage_risk: 18,
    light_classification: 'NORMAL LIGHT',
    light_risk: 10
  });
});

/**
 * GET /api/readings/:deviceId and GET /api/readings
 * Retrieves latest sensor readings history (up to 30 points).
 */
function handleGetReadings(req, res) {
  const deviceId = req.params.deviceId || req.query.deviceId || 'ESP32-001';
  const limit = Math.min(30, Number(req.query.limit) || 30);

  try {
    const readings = db.prepare(`
      SELECT * FROM sensor_readings
      WHERE device_id = ?
      ORDER BY recorded_at DESC
      LIMIT ?
    `).all(deviceId, limit);

    // Return in chronological order
    return res.json({ success: true, readings: readings.reverse() });
  } catch (err) {
    console.error('Error fetching readings:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
}

router.get('/readings/:deviceId', handleGetReadings);
router.get('/readings', handleGetReadings);

/**
 * GET /api/alerts/:deviceId and GET /api/alerts
 * Retrieves alerts for a device.
 */
function handleGetAlerts(req, res) {
  const deviceId = req.params.deviceId || req.query.deviceId || 'ESP32-001';
  try {
    const alerts = db.prepare(`
      SELECT * FROM alerts
      WHERE device_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all(deviceId);

    return res.json({ success: true, alerts });
  } catch (err) {
    console.error('Error fetching alerts:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
}

router.get('/alerts/:deviceId', handleGetAlerts);
router.get('/alerts', handleGetAlerts);

/**
 * POST /api/alerts
 * Records a new alert.
 */
router.post('/alerts', (req, res) => {
  const { deviceId, type, severity, message, value } = req.body;

  if (!deviceId || !type || !message) {
    return res.status(400).json({ success: false, error: 'Device ID, type and message are required.' });
  }

  try {
    const id = 'alt_' + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO alerts (id, device_id, type, severity, message, value, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(id, deviceId, type, severity || 'Warning', message, value ? String(value) : '', now);

    return res.json({ success: true, alertId: id });
  } catch (err) {
    console.error('Error creating alert:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

/**
 * PUT /api/alerts/:id/read
 * Marks an alert as read.
 */
router.put('/alerts/:id/read', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('UPDATE alerts SET is_read = 1 WHERE id = ?').run(id);
    return res.json({ success: true });
  } catch (err) {
    console.error('Error updating alert:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});
export default router;
