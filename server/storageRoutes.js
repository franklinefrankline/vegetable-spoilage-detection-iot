import express from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import db from './db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'veg-storage-smart-iot-secret-key-2026';

// Middleware to extract user ID from JWT Bearer token or query/body
function extractUser(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (e) {
      // Invalid token, fall through to query/body check
    }
  }

  // Fallback to userId passed in query or body
  const fallbackId = req.query.userId || req.body?.userId;
  if (fallbackId) {
    req.user = { id: fallbackId };
  }
  next();
}

router.use(extractUser);

const DEFAULT_BATCHES = [
  {
    vegetable_name: 'Tomato',
    variety: 'Roma / Cherry',
    quantity: '12 kg',
    batch_number: 'BATCH-2026-TOM-01',
    storage_chamber: 'Chamber #04 (Bay A)',
    device_id: 'ESP32-DEMO-001',
    target_temp: 21.0,
    optimal_temp_min: 18.0,
    optimal_temp_max: 24.0,
    target_humidity: 72.0,
    optimal_humidity_min: 65.0,
    optimal_humidity_max: 75.0,
    shelf_life_days: 14,
    status: 'FRESH',
    spoilage_risk: 18,
    is_active: 1,
    notes: 'Premium harvest from greenhouse block C. Prime firmness and color.'
  },
  {
    vegetable_name: 'Potato',
    variety: 'Russet Burbank',
    quantity: '25 kg',
    batch_number: 'BATCH-2026-POT-02',
    storage_chamber: 'Chamber #02 (Root Cellar)',
    device_id: 'ESP32-DEMO-001',
    target_temp: 14.0,
    optimal_temp_min: 12.0,
    optimal_temp_max: 16.0,
    target_humidity: 88.0,
    optimal_humidity_min: 85.0,
    optimal_humidity_max: 92.0,
    shelf_life_days: 35,
    status: 'FRESH',
    spoilage_risk: 12,
    is_active: 0,
    notes: 'Cured field potatoes. Keep dark to prevent solanine greening.'
  },
  {
    vegetable_name: 'Onion',
    variety: 'Red & Yellow Globe',
    quantity: '30 kg',
    batch_number: 'BATCH-2026-ONI-03',
    storage_chamber: 'Chamber #01 (Dry Storage)',
    device_id: 'ESP32-DEMO-001',
    target_temp: 18.0,
    optimal_temp_min: 15.0,
    optimal_temp_max: 20.0,
    target_humidity: 60.0,
    optimal_humidity_min: 55.0,
    optimal_humidity_max: 65.0,
    shelf_life_days: 50,
    status: 'FRESH',
    spoilage_risk: 14,
    is_active: 0,
    notes: 'Low humidity requirements. Ensure proper ventilation circulation.'
  },
  {
    vegetable_name: 'Carrot',
    variety: 'Nantes Sweet',
    quantity: '15 kg',
    batch_number: 'BATCH-2026-CAR-04',
    storage_chamber: 'Chamber #04 (Bay B)',
    device_id: 'ESP32-DEMO-001',
    target_temp: 20.0,
    optimal_temp_min: 18.0,
    optimal_temp_max: 22.0,
    target_humidity: 74.0,
    optimal_humidity_min: 70.0,
    optimal_humidity_max: 80.0,
    shelf_life_days: 21,
    status: 'FRESH',
    spoilage_risk: 19,
    is_active: 0,
    notes: 'Crisp texture washed carrots. Monitored for condensation prevention.'
  }
];

function seedDefaultBatches(userId) {
  const check = db.prepare('SELECT COUNT(*) as count FROM storage_items WHERE user_id = ?').get(userId);
  if (check && check.count > 0) return;

  const insert = db.prepare(`
    INSERT INTO storage_items (
      id, user_id, batch_number, vegetable_name, variety, quantity,
      storage_chamber, device_id, target_temp, optimal_temp_min, optimal_temp_max,
      target_humidity, optimal_humidity_min, optimal_humidity_max,
      shelf_life_days, status, spoilage_risk, is_active, notes, added_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const now = new Date().toISOString();
  for (const b of DEFAULT_BATCHES) {
    const id = 'stg_' + crypto.randomUUID().slice(0, 8);
    insert.run(
      id, userId, b.batch_number, b.vegetable_name, b.variety, b.quantity,
      b.storage_chamber, b.device_id, b.target_temp, b.optimal_temp_min, b.optimal_temp_max,
      b.target_humidity, b.optimal_humidity_min, b.optimal_humidity_max,
      b.shelf_life_days, b.status, b.spoilage_risk, b.is_active, b.notes, now, now
    );
  }
}

/**
 * GET /api/storage
 * Returns all storage batches for the authenticated user.
 */
router.get('/', (req, res) => {
  const userId = req.user?.id || req.query.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  try {
    seedDefaultBatches(userId);

    const items = db.prepare(`
      SELECT * FROM storage_items
      WHERE user_id = ?
      ORDER BY is_active DESC, added_at DESC
    `).all(userId);

    return res.json({
      success: true,
      count: items.length,
      items
    });
  } catch (err) {
    console.error('Error fetching storage items:', err);
    return res.status(500).json({ success: false, error: 'Database error fetching storage records.' });
  }
});

/**
 * GET /api/storage/active
 * Returns the active storage batch for the user.
 */
router.get('/active', (req, res) => {
  const userId = req.user?.id || req.query.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  try {
    seedDefaultBatches(userId);

    let active = db.prepare(`
      SELECT * FROM storage_items
      WHERE user_id = ? AND is_active = 1
      LIMIT 1
    `).get(userId);

    if (!active) {
      active = db.prepare(`
        SELECT * FROM storage_items
        WHERE user_id = ?
        ORDER BY added_at DESC
        LIMIT 1
      `).get(userId);
    }

    return res.json({ success: true, activeItem: active || null });
  } catch (err) {
    console.error('Error fetching active storage item:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

/**
 * GET /api/storage/:id
 * Returns single storage batch details.
 */
router.get('/:id', (req, res) => {
  const userId = req.user?.id || req.query.userId;
  const { id } = req.params;

  try {
    const item = db.prepare('SELECT * FROM storage_items WHERE id = ?').get(id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Storage batch not found.' });
    }

    if (userId && item.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized access to this batch.' });
    }

    return res.json({ success: true, item });
  } catch (err) {
    console.error('Error fetching storage item:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

/**
 * POST /api/storage
 * Creates a new storage record in the database.
 */
router.post('/', (req, res) => {
  const userId = req.user?.id || req.body.userId;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  const {
    vegetable_name,
    variety,
    quantity,
    batch_number,
    storage_chamber,
    device_id,
    target_temp,
    optimal_temp_min,
    optimal_temp_max,
    target_humidity,
    optimal_humidity_min,
    optimal_humidity_max,
    shelf_life_days,
    status,
    spoilage_risk,
    is_active,
    notes
  } = req.body;

  if (!vegetable_name || !String(vegetable_name).trim()) {
    return res.status(400).json({ success: false, error: 'Vegetable name is required.' });
  }

  try {
    const id = 'stg_' + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();
    const cleanBatchNumber = batch_number?.trim() || `BATCH-${Date.now().toString(36).toUpperCase()}`;

    // If marked active, unset any previous active batches for this user
    if (Number(is_active) === 1) {
      db.prepare('UPDATE storage_items SET is_active = 0 WHERE user_id = ?').run(userId);
    }

    const insert = db.prepare(`
      INSERT INTO storage_items (
        id, user_id, batch_number, vegetable_name, variety, quantity,
        storage_chamber, device_id, target_temp, optimal_temp_min, optimal_temp_max,
        target_humidity, optimal_humidity_min, optimal_humidity_max,
        shelf_life_days, status, spoilage_risk, is_active, notes, added_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?
      )
    `);

    insert.run(
      id,
      userId,
      cleanBatchNumber,
      vegetable_name.trim(),
      variety?.trim() || 'Standard',
      quantity?.trim() || '10 kg',
      storage_chamber?.trim() || 'Chamber #04',
      device_id?.trim() || 'ESP32-DEMO-001',
      Number(target_temp ?? 22.0),
      Number(optimal_temp_min ?? 18.0),
      Number(optimal_temp_max ?? 24.0),
      Number(target_humidity ?? 70.0),
      Number(optimal_humidity_min ?? 65.0),
      Number(optimal_humidity_max ?? 75.0),
      Number(shelf_life_days ?? 14),
      status || 'FRESH',
      Number(spoilage_risk ?? 18),
      Number(is_active ?? 0),
      notes?.trim() || '',
      now,
      now
    );

    const created = db.prepare('SELECT * FROM storage_items WHERE id = ?').get(id);

    return res.status(201).json({
      success: true,
      message: 'Storage batch created successfully.',
      item: created
    });
  } catch (err) {
    console.error('Error creating storage record:', err);
    return res.status(500).json({ success: false, error: 'Database error creating storage record.' });
  }
});

/**
 * PUT /api/storage/:id
 * Edits an existing storage record.
 */
router.put('/:id', (req, res) => {
  const userId = req.user?.id || req.body.userId;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  try {
    const existing = db.prepare('SELECT * FROM storage_items WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Storage batch not found.' });
    }

    if (existing.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'You do not have permission to edit this record.' });
    }

    const {
      vegetable_name,
      variety,
      quantity,
      batch_number,
      storage_chamber,
      device_id,
      target_temp,
      optimal_temp_min,
      optimal_temp_max,
      target_humidity,
      optimal_humidity_min,
      optimal_humidity_max,
      shelf_life_days,
      status,
      spoilage_risk,
      is_active,
      notes
    } = req.body;

    if (Number(is_active) === 1 && existing.is_active !== 1) {
      db.prepare('UPDATE storage_items SET is_active = 0 WHERE user_id = ?').run(userId);
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE storage_items SET
        vegetable_name = ?,
        variety = ?,
        quantity = ?,
        batch_number = ?,
        storage_chamber = ?,
        device_id = ?,
        target_temp = ?,
        optimal_temp_min = ?,
        optimal_temp_max = ?,
        target_humidity = ?,
        optimal_humidity_min = ?,
        optimal_humidity_max = ?,
        shelf_life_days = ?,
        status = ?,
        spoilage_risk = ?,
        is_active = ?,
        notes = ?,
        updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(
      vegetable_name?.trim() || existing.vegetable_name,
      variety !== undefined ? variety.trim() : existing.variety,
      quantity !== undefined ? quantity.trim() : existing.quantity,
      batch_number !== undefined ? batch_number.trim() : existing.batch_number,
      storage_chamber !== undefined ? storage_chamber.trim() : existing.storage_chamber,
      device_id !== undefined ? device_id.trim() : existing.device_id,
      target_temp !== undefined ? Number(target_temp) : existing.target_temp,
      optimal_temp_min !== undefined ? Number(optimal_temp_min) : existing.optimal_temp_min,
      optimal_temp_max !== undefined ? Number(optimal_temp_max) : existing.optimal_temp_max,
      target_humidity !== undefined ? Number(target_humidity) : existing.target_humidity,
      optimal_humidity_min !== undefined ? Number(optimal_humidity_min) : existing.optimal_humidity_min,
      optimal_humidity_max !== undefined ? Number(optimal_humidity_max) : existing.optimal_humidity_max,
      shelf_life_days !== undefined ? Number(shelf_life_days) : existing.shelf_life_days,
      status || existing.status,
      spoilage_risk !== undefined ? Number(spoilage_risk) : existing.spoilage_risk,
      is_active !== undefined ? Number(is_active) : existing.is_active,
      notes !== undefined ? notes.trim() : existing.notes,
      now,
      id,
      userId
    );

    const updated = db.prepare('SELECT * FROM storage_items WHERE id = ?').get(id);

    return res.json({
      success: true,
      message: 'Storage record updated successfully.',
      item: updated
    });
  } catch (err) {
    console.error('Error updating storage record:', err);
    return res.status(500).json({ success: false, error: 'Database error updating storage record.' });
  }
});

/**
 * DELETE /api/storage/:id
 * Deletes a storage record.
 */
router.delete('/:id', (req, res) => {
  const userId = req.user?.id || req.query.userId || req.body?.userId;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  try {
    const existing = db.prepare('SELECT * FROM storage_items WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Storage batch not found.' });
    }

    if (existing.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'You do not have permission to delete this record.' });
    }

    db.prepare('DELETE FROM storage_items WHERE id = ? AND user_id = ?').run(id, userId);

    return res.json({
      success: true,
      message: `Batch "${existing.vegetable_name}" (${existing.batch_number || id}) deleted successfully.`
    });
  } catch (err) {
    console.error('Error deleting storage record:', err);
    return res.status(500).json({ success: false, error: 'Database error deleting storage record.' });
  }
});

/**
 * POST /api/storage/:id/activate
 * Connects/links this batch as the active monitored produce for the device.
 */
router.post('/:id/activate', (req, res) => {
  const userId = req.user?.id || req.body?.userId;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }

  try {
    const existing = db.prepare('SELECT * FROM storage_items WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Storage batch not found.' });
    }

    db.prepare('UPDATE storage_items SET is_active = 0 WHERE user_id = ?').run(userId);
    db.prepare('UPDATE storage_items SET is_active = 1, updated_at = ? WHERE id = ?').run(new Date().toISOString(), id);

    const activeItem = db.prepare('SELECT * FROM storage_items WHERE id = ?').get(id);

    return res.json({
      success: true,
      message: `Batch "${activeItem.vegetable_name}" is now the active monitored storage.`,
      activeItem
    });
  } catch (err) {
    console.error('Error activating storage batch:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

/**
 * POST /api/storage/:id/sync-telemetry
 * Updates storage batch status and risk from current sensor telemetry.
 */
router.post('/:id/sync-telemetry', (req, res) => {
  const { id } = req.params;
  const { status, spoilage_risk, temperature, humidity, gas_level } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM storage_items WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Storage record not found.' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE storage_items
      SET status = ?, spoilage_risk = ?, updated_at = ?
      WHERE id = ?
    `).run(status || existing.status, spoilage_risk !== undefined ? Number(spoilage_risk) : existing.spoilage_risk, now, id);

    const updated = db.prepare('SELECT * FROM storage_items WHERE id = ?').get(id);

    return res.json({
      success: true,
      item: updated
    });
  } catch (err) {
    console.error('Error syncing telemetry with storage:', err);
    return res.status(500).json({ success: false, error: 'Database error.' });
  }
});

export default router;
