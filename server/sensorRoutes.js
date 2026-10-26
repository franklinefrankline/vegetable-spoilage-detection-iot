import express from 'express';
import db, { savePersistentReading, savePersistentDevice } from './db.js';
import crypto from 'node:crypto';

const router = express.Router();

/**
 * Migration helper to ensure user_id and source columns exist on sensor_readings
 */
try {
  db.exec("ALTER TABLE sensor_readings ADD COLUMN user_id TEXT");
} catch (e) {
  // Column already exists
}

try {
  db.exec("ALTER TABLE sensor_readings ADD COLUMN source TEXT DEFAULT 'esp32'");
} catch (e) {
  // Column already exists
}

// Ensure indexes
try {
  db.exec("CREATE INDEX IF NOT EXISTS idx_sensor_readings_user ON sensor_readings(user_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_sensor_readings_recorded ON sensor_readings(recorded_at)");
} catch (e) {
  // Indexes exist
}

/**
 * Baseline controlled demo history points
 */
function generateDemoHistoryPoints(range = '24h') {
  const points = [];
  const now = Date.now();
  let count = 24;
  let stepMs = 3600 * 1000; // 1 hour per step for 24h

  if (range === '1h') {
    count = 12;
    stepMs = 5 * 60 * 1000; // 5 mins
  } else if (range === '6h') {
    count = 18;
    stepMs = 20 * 60 * 1000; // 20 mins
  } else if (range === '12h') {
    count = 24;
    stepMs = 30 * 60 * 1000; // 30 mins
  } else if (range === '7d') {
    count = 28;
    stepMs = 6 * 3600 * 1000; // 6 hours
  } else if (range === '30d') {
    count = 30;
    stepMs = 24 * 3600 * 1000; // 1 day
  }

  // Realistic seed parameters
  const tempWave = [28.5, 28.2, 27.8, 27.4, 27.1, 26.9, 27.3, 27.9, 28.4, 28.8, 29.2, 29.0, 28.7, 28.5, 28.3, 28.1, 28.4, 28.6, 28.5];
  const humWave = [72, 73, 74, 75, 75, 76, 74, 73, 72, 70, 69, 70, 71, 72, 73, 72, 71, 72, 72];
  const gasWave = [420, 418, 415, 412, 415, 418, 422, 425, 428, 430, 426, 422, 420, 419, 421, 424, 422, 420, 420];
  const lightWave = [420, 390, 200, 50, 0, 0, 120, 310, 430, 470, 450, 420, 400, 350, 280, 410, 420, 420, 420];
  const riskWave = [18, 17, 16, 16, 15, 15, 16, 17, 18, 19, 20, 19, 18, 18, 17, 18, 18, 18, 18];

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * stepMs).toISOString();
    const idx = (count - i) % tempWave.length;
    const temp = tempWave[idx];
    const hum = humWave[idx];
    const gas = gasWave[idx];
    const light = lightWave[idx];
    const risk = riskWave[idx];

    let lightClass = 'NORMAL LIGHT';
    let lightRisk = 10;
    if (light < 100) {
      lightClass = 'LOW LIGHT';
      lightRisk = 30;
    } else if (light > 500) {
      lightClass = 'HIGH LIGHT';
      lightRisk = 45;
    }

    points.push({
      id: `demo_pt_${i}`,
      device_id: 'ESP32-DEMO-001',
      temperature: temp,
      humidity: hum,
      gas_level: gas,
      light_level: light,
      spoilage_risk: risk,
      light_risk: lightRisk,
      light_classification: lightClass,
      storage_status: risk > 30 ? 'WARNING' : 'FRESH',
      recorded_at: timestamp,
      source: 'demo'
    });
  }

  return points;
}

/**
 * GET /api/sensors/current
 * Returns the most recent sensor reading for the active device
 */
router.get('/current', (req, res) => {
  const deviceId = req.query.deviceId || 'ESP32-DEMO-001';
  const isDemo = req.query.isDemo === 'true' || deviceId.includes('DEMO');

  try {
    const latest = db.prepare(`
      SELECT * FROM sensor_readings
      WHERE device_id = ?
      ORDER BY recorded_at DESC
      LIMIT 1
    `).get(deviceId);

    if (latest) {
      const recordedMs = new Date(latest.recorded_at).getTime();
      const ageSeconds = isNaN(recordedMs) ? 0 : Math.max(0, Math.round((Date.now() - recordedMs) / 1000));
      const isStale = ageSeconds > 90; // If no telemetry received in last 90s, mark stale/offline
      const deviceStatus = isStale ? 'offline' : 'connected';

      const isTempUnavailable = Boolean(latest.is_temp_unavailable || latest.temperature === null);
      const isHumUnavailable = Boolean(latest.is_hum_unavailable || latest.humidity === null);
      const isGasUnavailable = Boolean(latest.is_gas_unavailable || latest.gas_level === null);
      const isLightUnavailable = Boolean(latest.is_light_unavailable || latest.light_level === null);

      return res.json({
        success: true,
        data: {
          deviceId: latest.device_id,
          temperature: latest.temperature,
          humidity: latest.humidity,
          gas_level: latest.gas_level,
          gasVOC: latest.gas_level,
          light_level: latest.light_level,
          lightLevel: latest.light_level,
          status: latest.storage_status || 'FRESH',
          spoilage_risk: latest.spoilage_risk || 18,
          spoilageRisk: latest.spoilage_risk || 18,
          light_classification: latest.light_classification || (isLightUnavailable ? 'NOT INSTALLED' : 'NORMAL LIGHT'),
          lightClassification: latest.light_classification || (isLightUnavailable ? 'NOT INSTALLED' : 'NORMAL LIGHT'),
          light_risk: latest.light_risk ?? 0,
          lightRisk: latest.light_risk ?? 0,
          recorded_at: latest.recorded_at,
          recordedAt: latest.recorded_at,
          ageSeconds,
          is_stale: isStale,
          device_status: deviceStatus,
          is_temp_unavailable: isTempUnavailable,
          is_hum_unavailable: isHumUnavailable,
          is_gas_unavailable: isGasUnavailable,
          is_light_unavailable: isLightUnavailable,
          source: latest.source || (isDemo ? 'demo' : 'esp32')
        }
      });
    }
  } catch (err) {
    console.warn('[API] /sensors/current DB error:', err.message);
  }

  // If real hardware device was requested but no cloud readings received yet:
  if (!isDemo && !deviceId.includes('DEMO')) {
    return res.json({
      success: true,
      data: {
        deviceId,
        temperature: null,
        humidity: null,
        gas_level: null,
        gasVOC: null,
        light_level: null,
        lightLevel: null,
        status: 'AWAITING_DATA',
        spoilage_risk: 0,
        spoilageRisk: 0,
        light_classification: 'NOT INSTALLED',
        lightClassification: 'NOT INSTALLED',
        light_risk: 0,
        lightRisk: 0,
        recorded_at: null,
        recordedAt: null,
        is_stale: true,
        device_status: 'offline',
        is_temp_unavailable: true,
        is_hum_unavailable: true,
        is_gas_unavailable: true,
        is_light_unavailable: true,
        source: 'esp32',
        message: 'Awaiting first telemetry upload from ESP32.'
      }
    });
  }

  // Fallback for demo device
  return res.json({
    success: true,
    data: {
      deviceId: 'ESP32-DEMO-001',
      temperature: 28.5,
      humidity: 72,
      gas_level: 420,
      gasVOC: 420,
      light_level: 420,
      lightLevel: 420,
      status: 'FRESH',
      spoilage_risk: 18,
      spoilageRisk: 18,
      light_classification: 'NORMAL LIGHT',
      lightClassification: 'NORMAL LIGHT',
      light_risk: 10,
      lightRisk: 10,
      recorded_at: new Date().toISOString(),
      recordedAt: new Date().toISOString(),
      ageSeconds: 0,
      is_stale: false,
      device_status: 'connected',
      is_temp_unavailable: false,
      is_hum_unavailable: false,
      is_gas_unavailable: false,
      is_light_unavailable: false,
      source: 'demo'
    }
  });
});

/**
 * GET /api/sensors/history
 * Returns sensor history points for specified range (1h, 6h, 12h, 24h, 7d, 30d)
 */
router.get('/history', (req, res) => {
  const deviceId = req.query.deviceId || 'ESP32-DEMO-001';
  const range = req.query.range || '24h';
  const isDemo = req.query.isDemo === 'true' || deviceId.includes('DEMO');

  // Calculate range cutoff
  const now = Date.now();
  let cutoffMs = now - 24 * 3600 * 1000;
  if (range === '1h') cutoffMs = now - 3600 * 1000;
  else if (range === '6h') cutoffMs = now - 6 * 3600 * 1000;
  else if (range === '12h') cutoffMs = now - 12 * 3600 * 1000;
  else if (range === '7d') cutoffMs = now - 7 * 24 * 3600 * 1000;
  else if (range === '30d') cutoffMs = now - 30 * 24 * 3600 * 1000;

  const cutoffIso = new Date(cutoffMs).toISOString();

  try {
    const rows = db.prepare(`
      SELECT * FROM sensor_readings
      WHERE device_id = ? AND recorded_at >= ?
      ORDER BY recorded_at ASC
      LIMIT 100
    `).all(deviceId, cutoffIso);

    if (rows && rows.length > 0) {
      const sanitized = rows.map((r) => ({
        ...r,
        temperature: (r.is_temp_unavailable || r.temperature === -999.0) ? null : r.temperature,
        humidity: (r.is_hum_unavailable || r.humidity === -999.0) ? null : r.humidity
      }));
      return res.json({
        success: true,
        range,
        isDemo,
        data: sanitized,
        readings: sanitized,
        total: sanitized.length
      });
    }
  } catch (err) {
    console.warn('[API] /sensors/history error:', err.message);
  }

  // If in demo mode or empty real history, return baseline history
  if (isDemo || deviceId.includes('DEMO')) {
    const demoData = generateDemoHistoryPoints(range);
    return res.json({
      success: true,
      range,
      isDemo: true,
      data: demoData,
      readings: demoData
    });
  }

  return res.json({
    success: true,
    range,
    isDemo: false,
    data: [],
    readings: []
  });
});

/**
 * POST /api/sensors/record, /api/sensors/ingest, /api/sensors/readings
 * Persists a validated sensor reading to the durable database
 */
router.post(['/record', '/ingest', '/readings'], async (req, res) => {
  const body = req.body || {};
  const {
    deviceId = 'ESP32-001',
    userId,
    temperature,
    temp,
    humidity,
    hum,
    rawMQ135,
    gasLevel,
    gas_level,
    light,
    lightLevel,
    light_level,
    spoilageRisk,
    spoilage_risk,
    error
  } = body;

  const rawTemp = temperature ?? temp;
  const isTempUnavail = Boolean(error === 'DHT22_READ_FAILED' || rawTemp === null || rawTemp === undefined || isNaN(Number(rawTemp)));
  const finalTemp = isTempUnavail ? null : Number(Number(rawTemp).toFixed(1));

  const rawHum = humidity ?? hum;
  const isHumUnavail = Boolean(error === 'DHT22_READ_FAILED' || rawHum === null || rawHum === undefined || isNaN(Number(rawHum)));
  const finalHum = isHumUnavail ? null : Math.round(Number(rawHum));

  const rawGas = rawMQ135 ?? gasLevel ?? gas_level;
  let finalGas = 400;
  if (rawGas !== null && rawGas !== undefined && !isNaN(Number(rawGas))) {
    finalGas = Math.round(Number(rawGas));
  }

  const rawLight = light ?? lightLevel ?? light_level;
  const isLightUnavail = rawLight === null || rawLight === undefined || isNaN(Number(rawLight));
  const finalLight = isLightUnavail ? null : Math.round(Number(rawLight));

  let finalRisk = 18;
  if (spoilageRisk !== undefined || spoilage_risk !== undefined) {
    finalRisk = Math.max(0, Math.min(100, Math.round(Number(spoilageRisk ?? spoilage_risk))));
  }

  const finalStatus = finalRisk > 60 ? 'SPOILAGE_RISK' : (finalRisk > 30 ? 'WARNING' : 'FRESH');
  const recordedAt = new Date().toISOString();
  const id = 'rd_' + crypto.randomUUID().slice(0, 10);
  const finalDeviceId = String(deviceId || 'ESP32-001').trim();

  try {
    await savePersistentReading({
      id,
      user_id: userId || null,
      device_id: finalDeviceId,
      temperature: finalTemp,
      humidity: finalHum,
      gas_level: finalGas,
      light_level: finalLight,
      spoilage_risk: finalRisk,
      light_risk: isLightUnavail ? 0 : 10,
      light_classification: isLightUnavail ? 'NOT INSTALLED' : 'NORMAL LIGHT',
      storage_status: finalStatus,
      source: 'esp32',
      is_temp_unavailable: isTempUnavail ? 1 : 0,
      is_hum_unavailable: isHumUnavail ? 1 : 0,
      is_gas_unavailable: 0,
      is_light_unavailable: isLightUnavail ? 1 : 0,
      recorded_at: recordedAt
    });

    await savePersistentDevice({
      id: finalDeviceId,
      user_id: userId || 'usr_demo_vegsense_001',
      device_name: finalDeviceId,
      device_identifier: finalDeviceId,
      status: 'connected',
      is_active: 1,
      last_seen: recordedAt,
      last_connected: recordedAt
    });

    const readingObj = {
      id,
      deviceId: finalDeviceId,
      temperature: finalTemp,
      humidity: finalHum,
      gas_level: finalGas,
      light_level: finalLight,
      spoilage_risk: finalRisk,
      status: finalStatus,
      is_temp_unavailable: isTempUnavail ? 1 : 0,
      is_hum_unavailable: isHumUnavail ? 1 : 0,
      is_light_unavailable: isLightUnavail ? 1 : 0,
      recorded_at: recordedAt
    };

    return res.status(201).json({
      success: true,
      id,
      readingId: id,
      reading: readingObj,
      timestamp: recordedAt,
      deviceId: finalDeviceId
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'DATABASE_ERROR', message: err.message });
  }
});

export default router;
