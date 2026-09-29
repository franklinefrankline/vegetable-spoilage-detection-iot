import express from 'express';
import jwt from 'jsonwebtoken';
import {
  getAnalyticsSummary,
  getSensorTimeseries,
  getAlertAnalytics,
  getStorageAnalytics,
  getComparisonAnalytics,
  resetDemoHistory
} from './analyticsService.js';
import db from './db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'veg-storage-smart-iot-secret-key-2026';

// Middleware: Authenticate user via JWT Bearer or fallback to demo account
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      // Invalid/expired token, proceed to fallback
    }
  }

  const fallbackId = req.query.userId || req.body?.userId || req.headers['x-user-id'];
  if (fallbackId) {
    req.user = { id: fallbackId };
    return next();
  }

  req.user = { id: 'usr_demo_vegsense_001' };
  next();
}

router.use(requireAuth);

/**
 * GET /api/analytics/summary
 * Returns high-level metrics, averages, min/max, risk distribution, and alert counts
 */
router.get('/summary', (req, res) => {
  try {
    const summary = getAnalyticsSummary({
      userId: req.user.id,
      deviceId: req.query.device_id || req.query.deviceId,
      batchId: req.query.batch_id || req.query.batchId,
      vegetableType: req.query.vegetable_type || req.query.vegetableType,
      range: req.query.range || '24h',
      from: req.query.from,
      to: req.query.to,
      sourceMode: req.query.source_mode || req.query.sourceMode || 'all'
    });

    return res.json(summary);
  } catch (err) {
    console.error('[Analytics API] Summary error:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate analytics summary.' });
  }
});

/**
 * GET /api/analytics/sensors
 * Returns full timeseries history with server-side aggregation for charts
 */
router.get('/sensors', (req, res) => {
  try {
    const timeseries = getSensorTimeseries({
      userId: req.user.id,
      deviceId: req.query.device_id || req.query.deviceId,
      batchId: req.query.batch_id || req.query.batchId,
      vegetableType: req.query.vegetable_type || req.query.vegetableType,
      range: req.query.range || '24h',
      from: req.query.from,
      to: req.query.to,
      sourceMode: req.query.source_mode || req.query.sourceMode || 'all'
    });

    return res.json(timeseries);
  } catch (err) {
    console.error('[Analytics API] Sensors error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch sensor timeseries.' });
  }
});

/**
 * GET /api/analytics/temperature
 * Metric-specific timeseries for temperature
 */
router.get('/temperature', (req, res) => {
  try {
    const data = getSensorTimeseries({
      userId: req.user.id,
      deviceId: req.query.device_id || req.query.deviceId,
      range: req.query.range || '24h',
      from: req.query.from,
      to: req.query.to,
      sourceMode: req.query.source_mode || req.query.sourceMode || 'all'
    });

    return res.json({
      success: true,
      sensor: 'temperature',
      unit: '°C',
      range: data.range,
      isAggregated: data.isAggregated,
      points: data.points.map((p) => ({
        timestamp: p.timestamp,
        time: p.time,
        date: p.date,
        value: p.temperature
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch temperature history.' });
  }
});

/**
 * GET /api/analytics/humidity
 * Metric-specific timeseries for humidity
 */
router.get('/humidity', (req, res) => {
  try {
    const data = getSensorTimeseries({
      userId: req.user.id,
      deviceId: req.query.device_id || req.query.deviceId,
      range: req.query.range || '24h',
      from: req.query.from,
      to: req.query.to,
      sourceMode: req.query.source_mode || req.query.sourceMode || 'all'
    });

    return res.json({
      success: true,
      sensor: 'humidity',
      unit: '%',
      range: data.range,
      isAggregated: data.isAggregated,
      points: data.points.map((p) => ({
        timestamp: p.timestamp,
        time: p.time,
        date: p.date,
        value: p.humidity
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch humidity history.' });
  }
});

/**
 * GET /api/analytics/gas
 * Metric-specific timeseries for Gas/VOC Indicator (MQ-135)
 */
router.get('/gas', (req, res) => {
  try {
    const data = getSensorTimeseries({
      userId: req.user.id,
      deviceId: req.query.device_id || req.query.deviceId,
      range: req.query.range || '24h',
      from: req.query.from,
      to: req.query.to,
      sourceMode: req.query.source_mode || req.query.sourceMode || 'all'
    });

    return res.json({
      success: true,
      sensor: 'gas',
      label: 'Gas/VOC Indicator',
      unit: 'ppm',
      range: data.range,
      isAggregated: data.isAggregated,
      points: data.points.map((p) => ({
        timestamp: p.timestamp,
        time: p.time,
        date: p.date,
        value: p.gas
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch Gas/VOC history.' });
  }
});

/**
 * GET /api/analytics/light
 * Metric-specific timeseries for Light Level (BH1750/LDR)
 */
router.get('/light', (req, res) => {
  try {
    const data = getSensorTimeseries({
      userId: req.user.id,
      deviceId: req.query.device_id || req.query.deviceId,
      range: req.query.range || '24h',
      from: req.query.from,
      to: req.query.to,
      sourceMode: req.query.source_mode || req.query.sourceMode || 'all'
    });

    return res.json({
      success: true,
      sensor: 'light',
      label: 'Light Level',
      unit: 'lux',
      range: data.range,
      isAggregated: data.isAggregated,
      points: data.points.map((p) => ({
        timestamp: p.timestamp,
        time: p.time,
        date: p.date,
        value: p.light,
        classification: p.light_classification
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch light history.' });
  }
});

/**
 * GET /api/analytics/spoilage
 * Timeseries of multivariate spoilage risk and classification
 */
router.get('/spoilage', (req, res) => {
  try {
    const data = getSensorTimeseries({
      userId: req.user.id,
      deviceId: req.query.device_id || req.query.deviceId,
      batchId: req.query.batch_id || req.query.batchId,
      range: req.query.range || '24h',
      from: req.query.from,
      to: req.query.to,
      sourceMode: req.query.source_mode || req.query.sourceMode || 'all'
    });

    return res.json({
      success: true,
      range: data.range,
      points: data.points.map((p) => ({
        timestamp: p.timestamp,
        time: p.time,
        date: p.date,
        risk: p.spoilage_risk,
        classification: p.classification
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch spoilage history.' });
  }
});

/**
 * GET /api/analytics/alerts
 * Alert statistics, breakdowns by severity and category, and resolution metrics
 */
router.get('/alerts', (req, res) => {
  try {
    const alertsData = getAlertAnalytics({
      userId: req.user.id,
      deviceId: req.query.device_id || req.query.deviceId,
      batchId: req.query.batch_id || req.query.batchId,
      range: req.query.range || '24h',
      from: req.query.from,
      to: req.query.to
    });

    return res.json(alertsData);
  } catch (err) {
    console.error('[Analytics API] Alerts error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch alert analytics.' });
  }
});

/**
 * GET /api/analytics/storage
 * Vegetable batch history, distribution and quantities
 */
router.get('/storage', (req, res) => {
  try {
    const storageData = getStorageAnalytics({ userId: req.user.id });
    return res.json(storageData);
  } catch (err) {
    console.error('[Analytics API] Storage error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch storage analytics.' });
  }
});

/**
 * GET /api/analytics/batch/:batch_id
 * Detailed batch history, timeline and environmental risks
 */
router.get('/batch/:batch_id', (req, res) => {
  try {
    const batchId = req.params.batch_id;
    const batch = db.prepare(`
      SELECT * FROM storage_items
      WHERE (id = ? OR batch_number = ?)
      AND (user_id = ? OR user_id = 'usr_demo_vegsense_001')
      LIMIT 1
    `).get(batchId, batchId, req.user.id);

    if (!batch) {
      return res.status(404).json({ success: false, error: 'Storage batch not found.' });
    }

    // Historical readings related to this batch
    const readings = db.prepare(`
      SELECT temperature, humidity, gas_level, light_level, spoilage_risk, storage_status, recorded_at
      FROM sensor_readings
      WHERE (storage_batch_id = ? OR storage_batch_id = ?)
      ORDER BY recorded_at DESC
      LIMIT 50
    `).all(batch.id, batch.batch_number);

    // Alerts related to this batch
    const batchAlerts = db.prepare(`
      SELECT id, title, severity, alert_type, status, message, created_at, resolved_at
      FROM alerts
      WHERE storage_batch_id = ? OR storage_batch_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(batch.id, batch.batch_number);

    return res.json({
      success: true,
      batch: {
        id: batch.id,
        name: batch.batch_number || batch.vegetable_name,
        vegetable_name: batch.vegetable_name,
        variety: batch.variety,
        quantity: batch.quantity,
        chamber: batch.storage_chamber,
        target_temp: batch.target_temp,
        target_humidity: batch.target_humidity,
        shelf_life_days: batch.shelf_life_days,
        current_risk: batch.spoilage_risk || 18,
        status: batch.status || 'FRESH',
        added_at: batch.added_at
      },
      readings,
      alerts: batchAlerts
    });
  } catch (err) {
    console.error('[Analytics API] Batch details error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch batch analytics.' });
  }
});

/**
 * GET /api/analytics/comparison
 * Compares two adjacent periods for environmental variables and alerts
 */
router.get('/comparison', (req, res) => {
  try {
    const comparison = getComparisonAnalytics({
      userId: req.user.id,
      deviceId: req.query.device_id || req.query.deviceId,
      batchId: req.query.batch_id || req.query.batchId,
      vegetableType: req.query.vegetable_type || req.query.vegetableType,
      range: req.query.range || '7d',
      sourceMode: req.query.source_mode || req.query.sourceMode || 'all'
    });

    return res.json(comparison);
  } catch (err) {
    console.error('[Analytics API] Comparison error:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate period comparison.' });
  }
});

/**
 * POST /api/analytics/reset-demo
 * Resets demo history and seeds fresh baseline without deleting real records
 */
router.post('/reset-demo', (req, res) => {
  try {
    const result = resetDemoHistory(req.user.id);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
