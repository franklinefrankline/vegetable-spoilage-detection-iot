import express from 'express';
import jwt from 'jsonwebtoken';
import db from './db.js';
import crypto from 'node:crypto';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'veg-storage-smart-iot-secret-key-2026';

router.use((req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (e) {}
  }
  next();
});

/**
 * Helper to validate IPv4 format
 */
function isValidIPv4(ip) {
  if (typeof ip !== 'string') return false;
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const n = Number(p);
    return !isNaN(n) && n >= 0 && n <= 255 && String(n) === p;
  });
}

/**
 * GET /api/devices
 * Retrieves all devices belonging to the user.
 */
router.get('/devices', (req, res) => {
  const userId = req.user?.id || req.query.userId || req.headers['x-user-id'] || 'usr_demo_vegsense_001';
  try {
    const devices = db.prepare(`
      SELECT * FROM devices
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId);

    // If user has no registered device, include the standard demo device
    return res.json({
      success: true,
      devices: devices.length > 0 ? devices : [
        {
          id: 'ESP32-DEMO-001',
          user_id: userId,
          device_name: 'ESP32-DEMO-001',
          ip_address: '192.168.1.105',
          mode: 'DEMO',
          status: 'connected',
          is_active: 1,
          last_connected: new Date().toISOString(),
          last_seen: new Date().toISOString()
        }
      ]
    });
  } catch (err) {
    console.error('Error fetching devices:', err);
    return res.status(500).json({ success: false, error: 'Database error fetching devices.' });
  }
});

/**
 * POST /api/devices
 * Connects and saves a real or demo ESP32 device
 */
router.post('/devices', async (req, res) => {
  const userId = req.user?.id || req.body.userId || 'usr_demo_vegsense_001';
  const { deviceName, ipAddress, mode = 'REAL' } = req.body;

  if (!ipAddress) {
    return res.status(400).json({ success: false, message: 'ESP32 IP address is required.' });
  }

  const cleanIp = ipAddress.trim();
  if (mode !== 'DEMO' && !isValidIPv4(cleanIp)) {
    return res.status(400).json({ success: false, message: 'Invalid IPv4 address format (e.g. 192.168.1.105).' });
  }

  const name = deviceName?.trim() || (mode === 'DEMO' ? 'ESP32-DEMO-001' : 'ESP32-001');
  const id = 'dev_' + crypto.randomUUID().slice(0, 8);
  const now = new Date().toISOString();

  let initialStatus = 'connected';
  let verificationDetails = null;

  // If real mode, test reachability via /status with 4.5s timeout
  if (mode === 'REAL') {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const testRes = await fetch(`http://${cleanIp}/status`, { signal: controller.signal });
      clearTimeout(timeout);
      if (testRes.ok) {
        initialStatus = 'connected';
        try {
          verificationDetails = await testRes.json();
        } catch (e) {}
      } else {
        initialStatus = 'offline';
      }
    } catch (e) {
      initialStatus = 'offline';
    }
  }

  try {
    // Check if device with this IP already exists for user
    const existing = db.prepare('SELECT id FROM devices WHERE user_id = ? AND ip_address = ?').get(userId, cleanIp);
    if (existing) {
      db.prepare(`
        UPDATE devices
        SET device_name = ?, mode = ?, status = ?, is_active = 1, last_connected = ?, last_seen = ?, updated_at = ?
        WHERE id = ?
      `).run(name, mode, initialStatus, now, now, now, existing.id);

      const updated = db.prepare('SELECT * FROM devices WHERE id = ?').get(existing.id);
      return res.json({
        success: true,
        message: initialStatus === 'connected' ? 'Device connected and verified.' : 'Device saved. ESP32 is currently offline.',
        device: updated,
        verification: verificationDetails
      });
    }

    db.prepare(`
      INSERT INTO devices (id, user_id, device_name, device_identifier, ip_address, mode, status, is_active, last_connected, last_seen, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `).run(id, userId, name, name, cleanIp, mode, initialStatus, now, now, now, now);

    const created = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
    return res.status(201).json({
      success: true,
      message: initialStatus === 'connected' ? 'Device connected and verified.' : 'Device saved. Note: ESP32 is currently unreachable.',
      device: created,
      verification: verificationDetails
    });
  } catch (err) {
    console.error('Error creating device:', err);
    return res.status(500).json({ success: false, message: 'Database error saving device.' });
  }
});

/**
 * GET /api/devices/:id
 */
router.get('/devices/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id || req.query.userId || 'usr_demo_vegsense_001';

  try {
    const device = db.prepare('SELECT * FROM devices WHERE id = ? AND user_id = ?').get(id, userId);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found.' });
    }
    return res.json({ success: true, device });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving device.' });
  }
});

/**
 * PATCH /api/devices/:id
 */
router.patch('/devices/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id || req.body.userId || 'usr_demo_vegsense_001';
  const { deviceName, ipAddress, mode, is_active } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM devices WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Device not found.' });
    }

    const updates = [];
    const params = [];
    if (deviceName !== undefined) { updates.push('device_name = ?'); params.push(deviceName.trim()); }
    if (ipAddress !== undefined) {
      if (mode !== 'DEMO' && !isValidIPv4(ipAddress.trim())) {
        return res.status(400).json({ success: false, message: 'Invalid IPv4 address format.' });
      }
      updates.push('ip_address = ?');
      params.push(ipAddress.trim());
    }
    if (mode !== undefined) { updates.push('mode = ?'); params.push(mode); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());

    params.push(id);
    params.push(userId);

    db.prepare(`UPDATE devices SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...params);
    const updated = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);

    return res.json({ success: true, message: 'Device updated successfully.', device: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error updating device.' });
  }
});

/**
 * DELETE /api/devices/:id
 * Disconnects device from active monitoring without deleting historical data.
 */
router.delete('/devices/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id || req.body?.userId || req.query?.userId || 'usr_demo_vegsense_001';

  try {
    const existing = db.prepare('SELECT * FROM devices WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Device not found.' });
    }

    // Set inactive and status to inactive - preserves all historical readings, alerts, and reports
    db.prepare(`
      UPDATE devices
      SET is_active = 0, status = 'inactive', updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(new Date().toISOString(), id, userId);

    return res.json({
      success: true,
      message: 'Device disconnected and marked inactive. Historical telemetry and alerts have been preserved.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error removing device.' });
  }
});

/**
 * POST /api/devices/:id/reconnect
 * Tests ESP32 reachability and updates live connection state
 */
router.post('/devices/:id/reconnect', async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id || req.body.userId || 'usr_demo_vegsense_001';

  try {
    const device = db.prepare('SELECT * FROM devices WHERE id = ? AND user_id = ?').get(id, userId);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found.' });
    }

    const now = new Date().toISOString();
    if (device.mode === 'DEMO') {
      db.prepare(`UPDATE devices SET status = 'connected', last_connected = ?, last_seen = ? WHERE id = ?`).run(now, now, id);
      return res.json({
        success: true,
        status: 'connected',
        mode: 'DEMO',
        message: 'Demo gateway reconnected successfully.'
      });
    }

    // Real ESP32 ping
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const ping = await fetch(`http://${device.ip_address}/status`, { signal: controller.signal });
      clearTimeout(timeout);

      if (ping.ok) {
        db.prepare(`
          UPDATE devices
          SET status = 'connected', is_active = 1, last_connected = ?, last_seen = ?
          WHERE id = ?
        `).run(now, now, id);

        return res.json({
          success: true,
          status: 'connected',
          message: `ESP32 (${device.ip_address}) reconnected successfully.`
        });
      } else {
        db.prepare(`UPDATE devices SET status = 'offline', updated_at = ? WHERE id = ?`).run(now, id);
        return res.status(502).json({
          success: false,
          status: 'offline',
          message: 'ESP32 device responded with an error.'
        });
      }
    } catch (netErr) {
      db.prepare(`UPDATE devices SET status = 'offline', updated_at = ? WHERE id = ?`).run(now, id);
      return res.status(504).json({
        success: false,
        status: 'offline',
        message: `ESP32 (${device.ip_address}) is unreachable or timed out.`
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal error during reconnect.' });
  }
});

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
