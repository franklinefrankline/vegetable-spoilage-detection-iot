import express from 'express';
import db from './db.js';
import crypto from 'node:crypto';
import {
  calculate_spoilage_risk,
  get_spoilage_recommendations
} from './spoilageService.js';

const router = express.Router();

// Ensure spoilage_history table exists (Section 35)
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS spoilage_history (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      device_id TEXT NOT NULL,
      storage_batch_id TEXT,
      temperature_risk INTEGER NOT NULL,
      humidity_risk INTEGER NOT NULL,
      gas_risk INTEGER NOT NULL,
      light_risk INTEGER NOT NULL,
      storage_age_risk INTEGER NOT NULL,
      spoilage_risk INTEGER NOT NULL,
      classification TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_spoilage_device ON spoilage_history(device_id);
    CREATE INDEX IF NOT EXISTS idx_spoilage_user ON spoilage_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_spoilage_created ON spoilage_history(created_at);
  `);
} catch (e) {
  // Table or indexes exist
}

/**
 * GET /api/spoilage/current
 * Returns current calculated spoilage risk and breakdown for device/batch
 */
router.get('/current', (req, res) => {
  const deviceId = req.query.deviceId || 'ESP32-DEMO-001';
  const batchId = req.query.batchId || 'v_tomato_a';
  const isDemo = req.query.isDemo === 'true' || deviceId.includes('DEMO');

  let sensorFrame = {
    temperature: 28.5,
    humidity: 72,
    gas_level: 420,
    light_level: 420
  };

  try {
    const latest = db.prepare(`
      SELECT * FROM sensor_readings
      WHERE device_id = ?
      ORDER BY recorded_at DESC
      LIMIT 1
    `).get(deviceId);

    if (latest) {
      sensorFrame = {
        temperature: latest.temperature,
        humidity: latest.humidity,
        gas_level: latest.gas_level,
        light_level: latest.light_level ?? 420
      };
    }
  } catch (err) {
    console.warn('[SpoilageAPI] Using baseline sensor reading:', err.message);
  }

  // Load storage batch if available
  let batchInfo = {
    batch_id: batchId,
    vegetable_type: 'tomato',
    batch_name: 'Tomato Batch A',
    days_remaining: 7,
    shelf_life: 14
  };

  try {
    const item = db.prepare('SELECT * FROM storage_items WHERE id = ?').get(batchId);
    if (item) {
      batchInfo = {
        batch_id: item.id,
        vegetable_type: (item.vegetable_name || 'tomato').toLowerCase(),
        batch_name: `${item.vegetable_name} ${item.variety || 'Batch'}`,
        days_remaining: 7,
        shelf_life: 14
      };
    }
  } catch (e) {}

  const calc = calculate_spoilage_risk({
    temperature: sensorFrame.temperature,
    humidity: sensorFrame.humidity,
    gas_level: sensorFrame.gas_level,
    light_level: sensorFrame.light_level,
    days_remaining: batchInfo.days_remaining,
    shelf_life: batchInfo.shelf_life
  });

  const recs = get_spoilage_recommendations({
    breakdown: calc.breakdown,
    temperature: sensorFrame.temperature,
    humidity: sensorFrame.humidity,
    gas_level: sensorFrame.gas_level,
    light_level: sensorFrame.light_level,
    vegetable_type: batchInfo.vegetable_type
  });

  return res.json({
    success: true,
    batch_id: batchInfo.batch_id,
    vegetable_type: batchInfo.vegetable_type,
    batch_name: batchInfo.batch_name,
    spoilage_risk: calc.spoilage_risk,
    classification: calc.classification,
    severity: calc.severity,
    data_quality: calc.data_quality,
    temperature_risk: calc.breakdown.temperature_risk,
    humidity_risk: calc.breakdown.humidity_risk,
    gas_risk: calc.breakdown.gas_risk,
    light_risk: calc.breakdown.light_risk,
    storage_age_risk: calc.breakdown.storage_age_risk,
    recommendations: recs,
    sensor_data: sensorFrame,
    updated_at: new Date().toISOString()
  });
});

/**
 * GET /api/spoilage/history
 * Returns historical spoilage risk calculations (24h, 7d, 30d)
 */
router.get('/history', (req, res) => {
  const deviceId = req.query.deviceId || 'ESP32-DEMO-001';
  const range = req.query.range || '24h';
  const isDemo = req.query.isDemo === 'true' || deviceId.includes('DEMO');

  // Baseline demo history points if no recorded history
  const points = [];
  const now = Date.now();
  let count = 24;
  let stepMs = 3600 * 1000;

  if (range === '7d') {
    count = 28;
    stepMs = 6 * 3600 * 1000;
  } else if (range === '30d') {
    count = 30;
    stepMs = 24 * 3600 * 1000;
  }

  const riskSeeds = [18, 17, 18, 19, 18, 17, 18, 18, 19, 20, 19, 18, 18, 17, 18, 19, 18, 18];

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * stepMs);
    const risk = riskSeeds[(count - i) % riskSeeds.length];
    points.push({
      id: `spoil_pt_${i}`,
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: timestamp.toISOString(),
      spoilageRisk: risk,
      spoilage_risk: risk,
      classification: risk > 30 ? 'WARNING' : 'FRESH',
      isDemo: true
    });
  }

  return res.json({
    success: true,
    range,
    isDemo,
    history: points
  });
});

/**
 * GET /api/spoilage/:batchId
 * Returns spoilage evaluation for a specific storage batch
 */
router.get('/:batchId', (req, res) => {
  req.query.batchId = req.params.batchId;
  return router.handle(req, res);
});

export default router;
