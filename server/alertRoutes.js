import express from 'express';
import jwt from 'jsonwebtoken';
import {
  createOrDeduplicateAlert,
  resolveAlert,
  markAlertRead,
  markAllAlertsRead,
  getAlerts,
  getUnreadCount,
  getAlertSummary,
  getAlertById,
  evaluateAlertRules
} from './alertService.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'veg-storage-smart-iot-secret-key-2026';

// Middleware: Authenticate user via JWT Bearer or fallback to query/body userId (for demo)
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      // Token invalid/expired
    }
  }

  // Fallback for demo mode testing or query params
  const fallbackId = req.query.userId || req.body?.userId || req.headers['x-user-id'];
  if (fallbackId) {
    req.user = { id: fallbackId };
    return next();
  }

  // Default to demo account if in demo mode or unauthenticated testing
  req.user = { id: 'usr_demo_vegsense_001' };
  next();
}

router.use(requireAuth);

/**
 * GET /api/alerts
 * Returns authenticated user's alerts with filtering, search, sorting and pagination
 */
router.get('/', (req, res) => {
  try {
    const {
      status,
      severity,
      type,
      search,
      sort,
      page = 1,
      limit = 50
    } = req.query;

    const result = getAlerts({
      userId: req.user.id,
      status,
      severity,
      type,
      search,
      sort,
      page,
      limit
    });

    return res.json({
      success: true,
      alerts: result.alerts,
      pagination: result.pagination
    });
  } catch (err) {
    console.error('[Alerts API] Error fetching alerts:', err);
    return res.status(500).json({ success: false, error: 'Database error retrieving alerts.' });
  }
});

/**
 * GET /api/alerts/unread-count
 * Returns unread count for the notification bell
 */
router.get('/unread-count', (req, res) => {
  try {
    const count = getUnreadCount(req.user.id);
    return res.json(count);
  } catch (err) {
    console.error('[Alerts API] Error fetching unread count:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve unread count.' });
  }
});

/**
 * GET /api/alerts/summary
 * Returns overview statistics for summary cards
 */
router.get('/summary', (req, res) => {
  try {
    const summary = getAlertSummary(req.user.id);
    return res.json(summary);
  } catch (err) {
    console.error('[Alerts API] Error fetching alert summary:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve alert summary.' });
  }
});

/**
 * GET /api/alerts/:id
 * Returns detailed alert information
 */
router.get('/:id', (req, res) => {
  try {
    const alert = getAlertById(req.params.id, req.user.id);
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found or unauthorized.' });
    }
    return res.json({ success: true, alert });
  } catch (err) {
    console.error('[Alerts API] Error fetching alert details:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

/**
 * PATCH /api/alerts/read-all
 * Marks all alerts as read
 */
router.patch('/read-all', (req, res) => {
  try {
    markAllAlertsRead(req.user.id);
    return res.json({ success: true, message: 'All alerts marked as read.' });
  } catch (err) {
    console.error('[Alerts API] Error marking all read:', err);
    return res.status(500).json({ success: false, error: 'Failed to mark alerts as read.' });
  }
});

/**
 * PATCH /api/alerts/:id/read
 * Marks single alert as read
 */
router.patch('/:id/read', (req, res) => {
  try {
    const result = markAlertRead(req.params.id, req.user.id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.json({ success: true, message: 'Alert marked as read.' });
  } catch (err) {
    console.error('[Alerts API] Error marking alert read:', err);
    return res.status(500).json({ success: false, error: 'Failed to update alert.' });
  }
});

/**
 * PATCH /api/alerts/:id/resolve
 * Marks an active alert as resolved
 */
router.patch('/:id/resolve', (req, res) => {
  try {
    const result = resolveAlert(req.params.id, req.user.id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.json({ success: true, message: 'Alert resolved successfully.', alert: result.alert });
  } catch (err) {
    console.error('[Alerts API] Error resolving alert:', err);
    return res.status(500).json({ success: false, error: 'Failed to resolve alert.' });
  }
});

/**
 * POST /api/alerts/evaluate
 * Evaluates real-time / demo sensor readings and generates deduplicated alerts
 */
router.post('/evaluate', (req, res) => {
  try {
    const {
      deviceId,
      sensorData,
      spoilageData,
      deviceStatus,
      storageBatches,
      configuredThresholds,
      previousState
    } = req.body;

    const evaluation = evaluateAlertRules({
      userId: req.user.id,
      deviceId: deviceId || 'ESP32-DEMO-001',
      sensorData: sensorData || {},
      spoilageData: spoilageData || {},
      deviceStatus: deviceStatus || 'connected',
      storageBatches: storageBatches || [],
      configuredThresholds: configuredThresholds || {},
      previousState: previousState || {}
    });

    return res.json(evaluation);
  } catch (err) {
    console.error('[Alerts API] Error evaluating alert rules:', err);
    return res.status(500).json({ success: false, error: 'Failed to evaluate alerts.' });
  }
});

/**
 * POST /api/alerts
 * Manual alert creation with deduplication
 */
router.post('/', (req, res) => {
  try {
    const {
      deviceId,
      storageBatchId,
      alertType,
      severity,
      title,
      message,
      value,
      threshold,
      previousValue,
      eventKey,
      metadata
    } = req.body;

    if (!alertType || !title || !message) {
      return res.status(400).json({ success: false, error: 'Missing required alert fields.' });
    }

    const result = createOrDeduplicateAlert({
      userId: req.user.id,
      deviceId: deviceId || 'ESP32-DEMO-001',
      storageBatchId,
      alertType,
      severity: severity || 'WARNING',
      title,
      message,
      value,
      threshold,
      previousValue,
      eventKey,
      metadata
    });

    return res.json(result);
  } catch (err) {
    console.error('[Alerts API] Error creating alert:', err);
    return res.status(500).json({ success: false, error: 'Failed to create alert.' });
  }
});

export default router;
