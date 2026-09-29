import express from 'express';
import db from './db.js';
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
      return res.json({
        success: true,
        data: {
          temperature: latest.temperature,
          humidity: latest.humidity,
          gas_level: latest.gas_level,
          gasVOC: latest.gas_level,
          light_level: latest.light_level ?? 420,
          lightLevel: latest.light_level ?? 420,
          status: latest.storage_status || 'FRESH',
          spoilage_risk: latest.spoilage_risk || 18,
          spoilageRisk: latest.spoilage_risk || 18,
          light_classification: latest.light_classification || 'NORMAL LIGHT',
          lightClassification: latest.light_classification || 'NORMAL LIGHT',
          light_risk: latest.light_risk ?? 10,
          lightRisk: latest.light_risk ?? 10,
          recorded_at: latest.recorded_at,
          source: latest.source || (isDemo ? 'demo' : 'esp32')
        }
      });
    }
  } catch (err) {
    console.warn('[API] /sensors/current DB error:', err.message);
  }

  // Fallback to official baseline demo frame
  return res.json({
    success: true,
    data: {
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
      source: isDemo ? 'demo' : 'esp32'
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
      return res.json({
        success: true,
        range,
        isDemo,
        readings: rows
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
      readings: demoData
    });
  }

  return res.json({
    success: true,
    range,
    isDemo: false,
    readings: []
  });
});

/**
 * POST /api/sensors/record
 * Persists a validated sensor reading to the database
 */
router.post('/record', (req, res) => {
  const {
    deviceId,
    userId,
    temperature,
    humidity,
    gasLevel,
    gas_level,
    lightLevel,
    light_level,
    spoilageRisk,
    spoilage_risk,
    lightRisk,
    light_risk,
    lightClassification,
    light_classification,
    storageStatus,
    storage_status,
    source,
    mode
  } = req.body;

  // Validate mandatory fields
  const finalTemp = Number(temperature);
  const finalHum = Number(humidity);
  const finalGas = Number(gasLevel !== undefined ? gasLevel : gas_level);

  if (isNaN(finalTemp) || isNaN(finalHum) || isNaN(finalGas)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid payload: temperature, humidity, and gasLevel must be valid numeric values.'
    });
  }

  const finalLight = Number(lightLevel !== undefined ? lightLevel : (light_level !== undefined ? light_level : 420));
  const finalSpoilage = Number(spoilageRisk !== undefined ? spoilageRisk : (spoilage_risk !== undefined ? spoilage_risk : 18));
  const finalLightRisk = Number(lightRisk !== undefined ? lightRisk : (light_risk !== undefined ? light_risk : 10));
  const finalLightClass = lightClassification || light_classification || 'NORMAL LIGHT';
  const finalStatus = storageStatus || storage_status || 'FRESH';
  const finalSource = source || mode || (deviceId && deviceId.includes('DEMO') ? 'demo' : 'esp32');
  const finalDeviceId = deviceId || 'ESP32-DEMO-001';

  try {
    const id = 'rd_' + crypto.randomUUID().slice(0, 10);
    const recordedAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO sensor_readings (
        id, user_id, device_id, temperature, humidity, gas_level, light_level,
        spoilage_risk, light_risk, light_classification, storage_status, source, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId || null,
      finalDeviceId,
      finalTemp,
      finalHum,
      finalGas,
      isNaN(finalLight) ? 420 : finalLight,
      finalSpoilage,
      finalLightRisk,
      finalLightClass,
      finalStatus,
      finalSource,
      recordedAt
    );

    return res.json({
      success: true,
      readingId: id,
      recordedAt
    });
  } catch (err) {
    console.error('Error persisting sensor reading:', err);
    return res.status(500).json({ success: false, error: 'Database error saving reading.' });
  }
});

export default router;
