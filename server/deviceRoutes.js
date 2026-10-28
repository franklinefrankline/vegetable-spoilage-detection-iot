import express from 'express';
import jwt from 'jsonwebtoken';
import db, { savePersistentReading, savePersistentDevice } from './db.js';
import crypto from 'node:crypto';
import { getJwtSecret } from './jwtConfig.js';
import { requireAuthOrApiKey } from './apiKeyMiddleware.js';

const router = express.Router();

router.use((req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (token) {
    try {
      req.user = jwt.verify(token, getJwtSecret());
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
    const rawDevices = db.prepare(`
      SELECT * FROM devices
      WHERE user_id = ? OR id = 'ESP32-001' OR id = 'vegsense-esp32-001'
      ORDER BY created_at DESC
    `).all(userId);

    const fallbackList = [
      {
        id: 'ESP32-001',
        user_id: userId,
        device_name: 'ESP32-001 (Production Node)',
        device_identifier: 'ESP32-001',
        ip_address: '192.168.1.150',
        mode: 'REAL',
        status: 'connected',
        is_active: 1,
        last_connected: new Date().toISOString(),
        last_seen: new Date().toISOString()
      }
    ];

    const sourceList = rawDevices.length > 0 ? rawDevices : fallbackList;

    const safeDevices = sourceList.map((d) => {
      let maskedToken = null;
      if (d.device_token) {
        maskedToken = d.device_token.length > 8 ? `vgs_${d.device_token.slice(4, 8)}...****` : '****';
      }
      return {
        id: d.id,
        user_id: d.user_id,
        device_name: d.device_name || d.id,
        device_identifier: d.device_identifier || d.id,
        ip_address: d.ip_address,
        mode: d.mode,
        status: d.status,
        is_active: d.is_active,
        has_token: Boolean(d.device_token || d.api_key),
        device_token_masked: maskedToken,
        revoked_at: d.revoked_at,
        last_used_at: d.last_used_at,
        last_connected: d.last_connected,
        last_seen: d.last_seen,
        created_at: d.created_at,
        updated_at: d.updated_at
      };
    });

    return res.json({
      success: true,
      count: safeDevices.length,
      devices: safeDevices
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
    return res.status(400).json({ success: false, message: 'Invalid IPv4 address format (e.g. 192.168.1.150).' });
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
 * GET /api/devices/:deviceId/latest
 * Returns latest telemetry reading and status for the specified device
 */
function handleGetDeviceLatest(req, res) {
  const deviceId = req.params.deviceId || req.query.deviceId || 'ESP32-001';
  try {
    const latest = db.prepare(`
      SELECT * FROM sensor_readings
      WHERE device_id = ?
      ORDER BY recorded_at DESC
      LIMIT 1
    `).get(deviceId);

    const device = db.prepare('SELECT * FROM devices WHERE id = ? OR device_identifier = ? LIMIT 1').get(deviceId, deviceId);

    if (!latest) {
      return res.json({
        success: true,
        deviceId,
        status: 'offline',
        device_status: 'offline',
        data: null,
        message: `No telemetry recorded for device ${deviceId} yet.`
      });
    }

    const recordedMs = new Date(latest.recorded_at).getTime();
    const nowMs = Date.now();
    const ageSeconds = Math.max(0, Math.round((nowMs - recordedMs) / 1000));
    const isStale = ageSeconds > 90;
    const isOffline = ageSeconds > 300;

    const isTempUnavail = Boolean(latest.is_temp_unavailable || latest.temperature === null || latest.temperature === -999.0);
    const isHumUnavail = Boolean(latest.is_hum_unavailable || latest.humidity === null || latest.humidity === -999.0);
    const isGasUnavail = Boolean(latest.is_gas_unavailable || latest.gas_level === null);
    const isLightUnavail = Boolean(latest.is_light_unavailable || latest.light_level === null);

    const temp = isTempUnavail ? null : latest.temperature;
    const hum = isHumUnavail ? null : latest.humidity;
    const mqRaw = latest.raw_mq135 ?? latest.gas_level;
    const gasIndex = latest.gas_index ?? (latest.gas_level ? Math.round(latest.gas_level / 40) : null);
    const risk = latest.spoilage_risk ?? 18;
    const health = latest.health_score ?? Math.max(0, 100 - risk);
    const light = isLightUnavail ? null : latest.light_level;
    const status = latest.storage_status || 'FRESH';

    return res.json({
      success: true,
      deviceId: latest.device_id,
      deviceName: device?.device_name || latest.device_id,
      status,
      device_status: isOffline ? 'offline' : (isStale ? 'stale' : 'connected'),
      is_stale: isStale,
      is_offline: isOffline,
      ageSeconds,
      last_seen: latest.recorded_at,
      recorded_at: latest.recorded_at,
      timestamp: latest.recorded_at,
      metrics: {
        temperature: temp,
        humidity: hum,
        mqRaw,
        gasIndex,
        gas_level: latest.gas_level,
        gasVOC: latest.gas_level,
        lightLevel: light,
        light_level: light,
        lightClassification: latest.light_classification || (isLightUnavail ? 'NOT INSTALLED' : 'NORMAL LIGHT'),
        risk,
        spoilageRisk: risk,
        health,
        storageCondition: status === 'FRESH' ? 'Optimal' : (status === 'WARNING' ? 'Monitor' : 'Critical'),
        availableSensors: {
          dht22: !isTempUnavail && !isHumUnavail,
          mq135: !isGasUnavail,
          bh1750: !isLightUnavail
        }
      },
      data: {
        deviceId: latest.device_id,
        temperature: temp,
        humidity: hum,
        mqRaw,
        gasIndex,
        gas_level: latest.gas_level,
        gasVOC: latest.gas_level,
        light_level: light,
        lightLevel: light,
        light_classification: latest.light_classification || (isLightUnavail ? 'NOT INSTALLED' : 'NORMAL LIGHT'),
        status,
        spoilage_risk: risk,
        spoilageRisk: risk,
        health,
        device_status: isOffline ? 'offline' : (isStale ? 'stale' : 'connected'),
        ageSeconds,
        is_stale: isStale,
        is_temp_unavailable: isTempUnavail,
        is_hum_unavailable: isHumUnavail,
        is_gas_unavailable: isGasUnavail,
        is_light_unavailable: isLightUnavail,
        recorded_at: latest.recorded_at,
        recordedAt: latest.recorded_at
      }
    });
  } catch (err) {
    console.error('Error fetching latest device reading:', err);
    return res.status(500).json({ success: false, error: 'DATABASE_ERROR', message: err.message });
  }
}

/**
 * GET /api/devices/:deviceId/history
 * Returns historical readings with pagination and time filters
 */
function handleGetDeviceHistory(req, res) {
  const deviceId = req.params.deviceId || req.query.deviceId || 'ESP32-001';
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 500);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
  const from = req.query.from || req.query.since;
  const to = req.query.to;

  try {
    let sql = 'SELECT * FROM sensor_readings WHERE device_id = ?';
    const params = [deviceId];

    if (from) {
      sql += ' AND recorded_at >= ?';
      params.push(from);
    }
    if (to) {
      sql += ' AND recorded_at <= ?';
      params.push(to);
    }

    sql += ' ORDER BY recorded_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = db.prepare(sql).all(...params);
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM sensor_readings WHERE device_id = ?').get(deviceId);

    const formatted = rows.map((r) => {
      const isTempUnavail = Boolean(r.is_temp_unavailable || r.temperature === null || r.temperature === -999.0);
      const isHumUnavail = Boolean(r.is_hum_unavailable || r.humidity === null || r.humidity === -999.0);
      const isLightUnavail = Boolean(r.is_light_unavailable || r.light_level === null);
      const risk = r.spoilage_risk ?? 18;

      return {
        id: r.id,
        deviceId: r.device_id,
        time: r.recorded_at ? new Date(r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--',
        recorded_at: r.recorded_at,
        recordedAt: r.recorded_at,
        timestamp: r.recorded_at,
        temperature: isTempUnavail ? null : r.temperature,
        temp: isTempUnavail ? null : r.temperature,
        humidity: isHumUnavail ? null : r.humidity,
        mqRaw: r.raw_mq135 ?? r.gas_level,
        gasIndex: r.gas_index ?? (r.gas_level ? Math.round(r.gas_level / 40) : null),
        gas_level: r.gas_level,
        gasLevel: r.gas_level,
        gasVOC: r.gas_level,
        light_level: isLightUnavail ? null : r.light_level,
        lightLevel: isLightUnavail ? null : r.light_level,
        light_classification: r.light_classification || (isLightUnavail ? 'NOT INSTALLED' : 'NORMAL LIGHT'),
        spoilage_risk: risk,
        spoilageRisk: risk,
        health: r.health_score ?? Math.max(0, 100 - risk),
        status: r.storage_status || 'FRESH',
        is_temp_unavailable: isTempUnavail,
        is_hum_unavailable: isHumUnavail,
        is_light_unavailable: isLightUnavail,
        source: r.source || 'esp32'
      };
    });

    return res.json({
      success: true,
      deviceId,
      count: formatted.length,
      total: totalRow?.count || formatted.length,
      limit,
      offset,
      data: formatted,
      readings: formatted
    });
  } catch (err) {
    console.error('Error fetching device history:', err);
    return res.status(500).json({ success: false, error: 'DATABASE_ERROR', message: err.message });
  }
}

/**
 * POST /api/devices/register
 * Creates or registers a new device and generates a secure device token
 */
async function handleRegisterDevice(req, res) {
  const userId = req.user?.id || req.body.userId || 'usr_demo_vegsense_001';
  const { deviceId, deviceName } = req.body || {};

  const cleanDeviceId = String(deviceId || 'ESP32-' + crypto.randomUUID().slice(0, 6).toUpperCase()).trim();
  const token = 'vgs_' + crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const now = new Date().toISOString();

  try {
    await savePersistentDevice({
      id: cleanDeviceId,
      user_id: userId,
      device_name: deviceName?.trim() || cleanDeviceId,
      device_identifier: cleanDeviceId,
      device_token: token,
      api_key: token,
      token_hash: tokenHash,
      mode: 'REAL',
      status: 'registered',
      is_active: 1,
      last_connected: now,
      last_seen: now
    });

    return res.status(201).json({
      success: true,
      deviceId: cleanDeviceId,
      deviceToken: token,
      cloudIngestionUrl: 'https://vegitables.vercel.app/api/device/ingest',
      authHeader: 'x-api-key',
      message: 'Device credential generated successfully. Store this token securely; it will not be displayed again.'
    });
  } catch (err) {
    console.error('Error registering device:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/devices/:deviceId/rotate-token
 * Rotates the device token and invalidates the previous one
 */
async function handleRotateDeviceToken(req, res) {
  const deviceId = req.params.deviceId || req.body.deviceId;
  if (!deviceId) return res.status(400).json({ success: false, message: 'Device ID required.' });

  const newToken = 'vgs_' + crypto.randomBytes(24).toString('hex');
  const newTokenHash = crypto.createHash('sha256').update(newToken).digest('hex');
  const now = new Date().toISOString();

  try {
    const existing = db.prepare('SELECT * FROM devices WHERE id = ? OR device_identifier = ? LIMIT 1').get(deviceId, deviceId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Device not found.' });
    }

    await savePersistentDevice({
      ...existing,
      device_token: newToken,
      api_key: newToken,
      token_hash: newTokenHash,
      is_active: 1,
      status: 'active',
      updated_at: now
    });

    return res.json({
      success: true,
      deviceId: existing.id,
      newDeviceToken: newToken,
      message: 'Device token rotated successfully. Update your ESP32 firmware with this new credential.'
    });
  } catch (err) {
    console.error('Error rotating device token:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/devices/:deviceId/revoke
 * Revokes a device credential, blocking all future uploads
 */
async function handleRevokeDevice(req, res) {
  const deviceId = req.params.deviceId || req.body.deviceId;
  if (!deviceId) return res.status(400).json({ success: false, message: 'Device ID required.' });

  const now = new Date().toISOString();

  try {
    const existing = db.prepare('SELECT * FROM devices WHERE id = ? OR device_identifier = ? LIMIT 1').get(deviceId, deviceId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Device not found.' });
    }

    await savePersistentDevice({
      ...existing,
      is_active: 0,
      status: 'REVOKED',
      revoked_at: now,
      updated_at: now
    });

    return res.json({
      success: true,
      deviceId: existing.id,
      status: 'REVOKED',
      message: 'Device credential has been revoked. Ingestion requests will be rejected with HTTP 403.'
    });
  } catch (err) {
    console.error('Error revoking device:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/devices/:deviceId/activate
 * Re-activates a previously revoked device
 */
async function handleActivateDevice(req, res) {
  const deviceId = req.params.deviceId || req.body.deviceId;
  if (!deviceId) return res.status(400).json({ success: false, message: 'Device ID required.' });

  const now = new Date().toISOString();

  try {
    const existing = db.prepare('SELECT * FROM devices WHERE id = ? OR device_identifier = ? LIMIT 1').get(deviceId, deviceId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Device not found.' });
    }

    await savePersistentDevice({
      ...existing,
      is_active: 1,
      status: 'ACTIVE',
      revoked_at: null,
      updated_at: now
    });

    return res.json({
      success: true,
      deviceId: existing.id,
      status: 'ACTIVE',
      message: 'Device has been re-activated.'
    });
  } catch (err) {
    console.error('Error activating device:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

router.get('/devices/:deviceId/latest', handleGetDeviceLatest);
router.get('/devices/:deviceId/history', handleGetDeviceHistory);
router.post(['/devices/register', '/device/register'], handleRegisterDevice);
router.post(['/devices/:deviceId/rotate-token', '/device/:deviceId/rotate-token'], handleRotateDeviceToken);
router.post(['/devices/:deviceId/revoke', '/device/:deviceId/revoke'], handleRevokeDevice);
router.post(['/devices/:deviceId/activate', '/device/:deviceId/activate'], handleActivateDevice);

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
 * GET /api/device/provision-info
 * Returns cloud ingestion endpoint and authentication configuration
 */
router.get('/device/provision-info', (req, res) => {
  const hasKey = Boolean(process.env.VEGSENSE_API_KEY && process.env.VEGSENSE_API_KEY.trim().length > 0);
  return res.json({
    success: true,
    cloudIngestionUrl: 'https://vegitables.vercel.app/api/readings',
    cloudApiBase: 'https://vegitables.vercel.app/api',
    endpoints: {
      ingest: '/api/readings',
      current: '/api/sensors/current',
      history: '/api/sensors/history',
      health: '/api/health'
    },
    authHeader: 'x-api-key',
    hasApiKeyConfigured: hasKey,
    instructions: hasKey
      ? 'Set CLOUD_API_URL to https://vegitables.vercel.app/api/readings and DEVICE_API_KEY to your configured VEGSENSE_API_KEY.'
      : 'Set VEGSENSE_API_KEY in your cloud environment variables or provision a dedicated device token.'
  });
});

/**
 * POST /api/device/provision-token
 * Generates a dedicated device credential for authenticated users
 */
router.post('/device/provision-token', async (req, res) => {
  const userId = req.user?.id || req.body?.userId || 'usr_demo_vegsense_001';
  const { deviceId = 'ESP32-001' } = req.body || {};

  const cleanDeviceId = String(deviceId).trim() || 'ESP32-001';
  const token = 'vgs_' + crypto.randomBytes(20).toString('hex');
  const now = new Date().toISOString();

  try {
    await savePersistentDevice({
      id: cleanDeviceId,
      user_id: userId,
      device_name: cleanDeviceId,
      device_identifier: cleanDeviceId,
      device_token: token,
      api_key: token,
      mode: 'REAL',
      status: 'provisioned',
      is_active: 1,
      last_connected: now,
      last_seen: now
    });

    return res.status(201).json({
      success: true,
      deviceId: cleanDeviceId,
      deviceToken: token,
      cloudIngestionUrl: 'https://vegitables.vercel.app/api/readings',
      authHeader: 'x-api-key',
      message: 'Dedicated device credential provisioned successfully.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
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
/**
 * POST /api/readings, /api/sensors/ingest, /api/ingest
 * Dedicated Cloud Ingestion Endpoint for ESP32 Hardware & IoT Gateways
 * Accepts real telemetry via header x-api-key, x-device-token, or Bearer JWT session.
 * Stores readings in durable production storage (SQLite + Vercel Blob permanent backup).
 */
router.post(['/device/ingest', '/devices/ingest', '/readings', '/sensors/ingest', '/sensor/ingest', '/sensors/record', '/ingest'], requireAuthOrApiKey, async (req, res) => {
  const body = req.body || {};
  const deviceId = body.deviceId || body.device_id || body.device || 'ESP32-001';

  if (!deviceId || typeof deviceId !== 'string' || !deviceId.trim()) {
    return res.status(400).json({ success: false, error: 'INVALID_PAYLOAD', message: 'Valid deviceId is required.' });
  }

  // Payload size safety guard: reject payloads > 16KB
  const rawBodyLength = JSON.stringify(body).length;
  if (rawBodyLength > 16384) {
    return res.status(413).json({ success: false, error: 'PAYLOAD_TOO_LARGE', message: 'Payload size exceeds 16KB limit.' });
  }

  const rawTemp = body.temperature ?? body.temp ?? body.t;
  const rawHum = body.humidity ?? body.hum ?? body.h;
  const rawGas = body.mqRaw ?? body.rawMQ135 ?? body.gasLevel ?? body.gas_level ?? body.gas ?? body.rawGas;
  const rawLight = body.lightLevel ?? body.light_level ?? body.light ?? body.light_lux ?? body.lux;

  // Numeric and range validations
  let finalTemp = null;
  let isTempUnavail = false;
  if (rawTemp !== null && rawTemp !== undefined) {
    const num = Number(rawTemp);
    if (isNaN(num)) {
      isTempUnavail = true;
    } else if (num < -40 || num > 80) {
      return res.status(400).json({ success: false, error: 'INVALID_TEMPERATURE', message: 'Temperature must be between -40°C and 80°C or null.' });
    } else {
      finalTemp = Number(num.toFixed(1));
    }
  } else {
    isTempUnavail = true;
  }

  let finalHum = null;
  let isHumUnavail = false;
  if (rawHum !== null && rawHum !== undefined) {
    const num = Number(rawHum);
    if (isNaN(num)) {
      isHumUnavail = true;
    } else if (num < 0 || num > 100) {
      return res.status(400).json({ success: false, error: 'INVALID_HUMIDITY', message: 'Humidity must be between 0% and 100% or null.' });
    } else {
      finalHum = Number(num.toFixed(1));
    }
  } else {
    isHumUnavail = true;
  }

  let finalGas = 400;
  if (rawGas !== null && rawGas !== undefined) {
    const num = Number(rawGas);
    if (isNaN(num) || num < 0 || num > 4095) {
      return res.status(400).json({ success: false, error: 'INVALID_GAS_READING', message: 'Gas sensor reading must be between 0 and 4095.' });
    }
    finalGas = Math.round(num);
  }

  const finalGasIndex = body.gasIndex !== undefined ? Math.round(Number(body.gasIndex)) : (body.gas_index !== undefined ? Math.round(Number(body.gas_index)) : Math.round(finalGas / 40));

  let finalLight = null;
  let isLightUnavail = true;
  let finalLightClass = 'NOT INSTALLED';
  let finalLightRisk = 0;
  if (rawLight !== null && rawLight !== undefined) {
    const num = Number(rawLight);
    if (!isNaN(num) && num >= 0 && num <= 65535) {
      finalLight = Math.round(num);
      isLightUnavail = false;
      if (finalLight < 100) {
        finalLightClass = 'LOW LIGHT';
        finalLightRisk = 30;
      } else if (finalLight > 500) {
        finalLightClass = 'HIGH LIGHT';
        finalLightRisk = 40;
      } else {
        finalLightClass = 'NORMAL LIGHT';
        finalLightRisk = 10;
      }
    }
  }

  // Calculate spoilage risk if not provided
  let finalRisk = 18;
  if (body.risk !== undefined || body.spoilageRisk !== undefined || body.spoilage_risk !== undefined) {
    finalRisk = Math.max(0, Math.min(100, Math.round(Number(body.risk ?? body.spoilageRisk ?? body.spoilage_risk))));
  } else if (finalTemp !== null && finalHum !== null) {
    let score = 10;
    if (finalTemp > 24) score += (finalTemp - 24) * 3.5;
    if (finalHum > 75) score += (finalHum - 75) * 1.8;
    if (finalGas > 400) score += (finalGas - 400) * 0.12;
    finalRisk = Math.max(0, Math.min(100, Math.round(score)));
  }

  const finalHealth = body.health !== undefined ? Math.max(0, Math.min(100, Math.round(Number(body.health)))) : Math.max(0, 100 - finalRisk);
  const finalStatus = finalRisk > 60 ? 'SPOILAGE_RISK' : (finalRisk > 30 ? 'WARNING' : 'FRESH');
  const now = new Date().toISOString();
  const id = 'rd_' + crypto.randomUUID().slice(0, 10);
  const userId = req.user?.id || body.userId || null;

  try {
    // Persist to SQLite and durable Vercel Blob store
    await savePersistentReading({
      id,
      user_id: userId,
      device_id: deviceId.trim(),
      temperature: finalTemp,
      humidity: finalHum,
      gas_level: finalGas,
      raw_mq135: finalGas,
      gas_index: finalGasIndex,
      health_score: finalHealth,
      light_level: finalLight,
      spoilage_risk: finalRisk,
      light_risk: finalLightRisk,
      light_classification: finalLightClass,
      storage_status: finalStatus,
      source: 'esp32',
      is_temp_unavailable: isTempUnavail ? 1 : 0,
      is_hum_unavailable: isHumUnavail ? 1 : 0,
      is_gas_unavailable: 0,
      is_light_unavailable: isLightUnavail ? 1 : 0,
      recorded_at: now
    });

    // Update device state and persist to durable store
    await savePersistentDevice({
      id: deviceId.trim(),
      user_id: userId || 'usr_demo_vegsense_001',
      device_name: deviceId.trim(),
      device_identifier: deviceId.trim(),
      ip_address: body.ipAddress || body.ip || req.ip || req.headers['x-forwarded-for'] || '192.168.1.150',
      mode: 'REAL',
      status: 'connected',
      is_active: 1,
      last_seen: now,
      last_connected: now,
      last_used_at: now
    });

    return res.status(201).json({
      success: true,
      readingId: id,
      timestamp: now,
      deviceId: deviceId.trim(),
      metrics: {
        temperature: finalTemp,
        humidity: finalHum,
        mqRaw: finalGas,
        gasIndex: finalGasIndex,
        gas_level: finalGas,
        gasVOC: finalGas,
        light_level: finalLight,
        lightLevel: finalLight,
        risk: finalRisk,
        spoilage_risk: finalRisk,
        health: finalHealth,
        status: finalStatus,
        is_temp_unavailable: isTempUnavail,
        is_hum_unavailable: isHumUnavail,
        is_light_unavailable: isLightUnavail
      }
    });
  } catch (err) {
    console.error('Error storing sensor reading:', err);
    return res.status(500).json({ success: false, error: 'DATABASE_ERROR', message: err.message });
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
