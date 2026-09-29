import crypto from 'node:crypto';
import db from './db.js';

/**
 * Normalizes event keys to prevent duplicate active alerts during high-frequency polling
 */
export function buildEventKey(category, targetId, condition) {
  const c = String(category || 'system').toLowerCase().trim();
  const t = String(targetId || 'device').trim();
  const s = String(condition || 'alert').toLowerCase().trim();
  return `${c}:${t}:${s}`;
}

/**
 * Creates an alert or deduplicates if an identical active alert already exists.
 * Follows strict user isolation and maintains last_seen_at timestamp.
 */
export function createOrDeduplicateAlert({
  userId,
  deviceId,
  storageBatchId = null,
  alertType,
  severity,
  title,
  message,
  status = 'ACTIVE',
  source = 'SYSTEM',
  value = null,
  threshold = null,
  previousValue = null,
  eventKey,
  metadata = {}
}) {
  if (!userId) {
    throw new Error('user_id is mandatory for alert creation.');
  }
  const cleanKey = eventKey || buildEventKey(alertType, deviceId || 'global', severity);
  const now = new Date().toISOString();

  // Check if identical alert is already ACTIVE for this user
  const activeAlert = db.prepare(`
    SELECT * FROM alerts
    WHERE user_id = ? AND event_key = ? AND status = 'ACTIVE'
    LIMIT 1
  `).get(userId, cleanKey);

  if (activeAlert) {
    // Deduplication: Update last_seen_at and current value without creating a duplicate record
    db.prepare(`
      UPDATE alerts
      SET last_seen_at = ?,
          value = ?,
          updated_at = ?
      WHERE id = ?
    `).run(now, value != null ? String(value) : activeAlert.value, now, activeAlert.id);

    return {
      success: true,
      deduplicated: true,
      alert: {
        ...activeAlert,
        last_seen_at: now,
        value: value != null ? String(value) : activeAlert.value
      }
    };
  }

  // Insert new active alert
  const id = 'alt_' + crypto.randomUUID().slice(0, 12);
  const metaString = typeof metadata === 'string' ? metadata : JSON.stringify(metadata || {});

  db.prepare(`
    INSERT INTO alerts (
      id, user_id, device_id, storage_batch_id, alert_type, type, severity,
      title, message, status, source, value, threshold,
      previous_value, event_key, metadata, is_read,
      created_at, updated_at, last_seen_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
  `).run(
    id,
    userId,
    deviceId || 'ESP32-DEMO-001',
    storageBatchId,
    alertType.toUpperCase(),
    alertType.toUpperCase(),
    severity.toUpperCase(),
    title,
    message,
    status,
    source,
    value != null ? String(value) : '',
    threshold != null ? String(threshold) : '',
    previousValue != null ? String(previousValue) : '',
    cleanKey,
    metaString,
    now,
    now,
    now
  );

  const created = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
  return {
    success: true,
    deduplicated: false,
    alert: created
  };
}

/**
 * Resolves active alert by ID
 */
export function resolveAlert(alertId, userId) {
  const now = new Date().toISOString();
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ? AND user_id = ?').get(alertId, userId);
  if (!alert) return { success: false, error: 'Alert not found or unauthorized' };

  db.prepare(`
    UPDATE alerts
    SET status = 'RESOLVED',
        resolved_at = ?,
        updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(now, now, alertId, userId);

  return { success: true, alert: { ...alert, status: 'RESOLVED', resolved_at: now } };
}

/**
 * Resolves all active alerts matching an event key prefix for a device/batch
 */
export function resolveAlertsByPrefix(userId, prefix) {
  const now = new Date().toISOString();
  const matching = db.prepare(`
    SELECT id FROM alerts
    WHERE user_id = ? AND status = 'ACTIVE' AND event_key LIKE ?
  `).all(userId, `${prefix}%`);

  if (matching.length > 0) {
    db.prepare(`
      UPDATE alerts
      SET status = 'RESOLVED',
          resolved_at = ?,
          updated_at = ?
      WHERE user_id = ? AND status = 'ACTIVE' AND event_key LIKE ?
    `).run(now, now, userId, `${prefix}%`);
  }

  return matching.length;
}

/**
 * Marks single alert as read
 */
export function markAlertRead(alertId, userId) {
  const now = new Date().toISOString();
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ? AND user_id = ?').get(alertId, userId);
  if (!alert) return { success: false, error: 'Alert not found or unauthorized' };

  db.prepare(`
    UPDATE alerts
    SET is_read = 1,
        read_at = COALESCE(read_at, ?),
        updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(now, now, alertId, userId);

  return { success: true };
}

/**
 * Marks all alerts as read for user
 */
export function markAllAlertsRead(userId) {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE alerts
    SET is_read = 1,
        read_at = COALESCE(read_at, ?),
        updated_at = ?
    WHERE user_id = ? AND is_read = 0
  `).run(now, now, userId);

  return { success: true };
}

/**
 * Retrieves filtered alerts with pagination
 */
export function getAlerts({
  userId,
  status = null,
  severity = null,
  type = null,
  search = null,
  sort = 'newest',
  page = 1,
  limit = 50
}) {
  const conditions = ['user_id = ?'];
  const params = [userId];

  if (status && status !== 'all') {
    if (status.toUpperCase() === 'UNREAD') {
      conditions.push('is_read = 0');
    } else {
      conditions.push('status = ?');
      params.push(status.toUpperCase());
    }
  }

  if (severity && severity !== 'all') {
    conditions.push('severity = ?');
    params.push(severity.toUpperCase());
  }

  if (type && type !== 'all') {
    conditions.push('(alert_type = ? OR type = ?)');
    params.push(type.toUpperCase(), type.toUpperCase());
  }

  if (search && search.trim()) {
    conditions.push('(title LIKE ? OR message LIKE ? OR device_id LIKE ?)');
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  const whereClause = conditions.join(' AND ');

  let orderClause = 'created_at DESC';
  if (sort === 'oldest') {
    orderClause = 'created_at ASC';
  } else if (sort === 'severity') {
    orderClause = `
      CASE severity
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'WARNING' THEN 3
        WHEN 'INFO' THEN 4
        ELSE 5
      END ASC, created_at DESC
    `;
  }

  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);

  const countRow = db.prepare(`SELECT COUNT(*) as count FROM alerts WHERE ${whereClause}`).get(...params);
  const total = countRow ? countRow.count : 0;

  const rows = db.prepare(`
    SELECT * FROM alerts
    WHERE ${whereClause}
    ORDER BY ${orderClause}
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);

  // Format records for frontend consumption
  const alerts = rows.map((r) => {
    let parsedMeta = {};
    try {
      parsedMeta = JSON.parse(r.metadata || '{}');
    } catch (e) {}

    return {
      id: r.id,
      alert_id: r.id,
      user_id: r.user_id,
      device_id: r.device_id,
      storage_batch_id: r.storage_batch_id,
      alert_type: r.alert_type || r.type,
      type: r.alert_type || r.type,
      severity: r.severity,
      title: r.title,
      message: r.message,
      status: r.status,
      source: r.source,
      value: r.value,
      threshold: r.threshold,
      previous_value: r.previous_value,
      event_key: r.event_key,
      metadata: parsedMeta,
      is_read: Boolean(r.is_read),
      read: Boolean(r.is_read),
      created_at: r.created_at,
      updated_at: r.updated_at,
      read_at: r.read_at,
      resolved_at: r.resolved_at,
      last_seen_at: r.last_seen_at
    };
  });

  return {
    alerts,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  };
}

/**
 * Returns unread alert count for user
 */
export function getUnreadCount(userId) {
  const row = db.prepare('SELECT COUNT(*) as unread_count FROM alerts WHERE user_id = ? AND is_read = 0').get(userId);
  return { unread_count: row ? row.unread_count : 0 };
}

/**
 * Returns alert summary statistics
 */
export function getAlertSummary(userId) {
  const rows = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread,
      SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved,
      SUM(CASE WHEN severity = 'CRITICAL' AND status = 'ACTIVE' THEN 1 ELSE 0 END) as critical,
      SUM(CASE WHEN severity = 'HIGH' AND status = 'ACTIVE' THEN 1 ELSE 0 END) as high,
      SUM(CASE WHEN severity = 'WARNING' AND status = 'ACTIVE' THEN 1 ELSE 0 END) as warning,
      SUM(CASE WHEN severity = 'INFO' AND status = 'ACTIVE' THEN 1 ELSE 0 END) as info
    FROM alerts
    WHERE user_id = ?
  `).get(userId);

  return {
    total: rows?.total || 0,
    active: rows?.active || 0,
    unread: rows?.unread || 0,
    resolved: rows?.resolved || 0,
    critical: rows?.critical || 0,
    high: rows?.high || 0,
    warning: rows?.warning || 0,
    info: rows?.info || 0
  };
}

/**
 * Retrieves alert by ID
 */
export function getAlertById(alertId, userId) {
  const row = db.prepare('SELECT * FROM alerts WHERE id = ? AND user_id = ?').get(alertId, userId);
  if (!row) return null;
  let parsedMeta = {};
  try {
    parsedMeta = JSON.parse(row.metadata || '{}');
  } catch (e) {}

  return {
    ...row,
    alert_id: row.id,
    metadata: parsedMeta,
    is_read: Boolean(row.is_read),
    read: Boolean(row.is_read)
  };
}

/**
 * Primary Centralized Alert Evaluation Engine (Sections 5-14, 45, 46)
 * Processes incoming sensor telemetry, spoilage metrics, device status and storage batches.
 * Generates deduplicated alerts or triggers resolution/recovery events upon returning to normal.
 */
export function evaluateAlertRules({
  userId,
  deviceId = 'ESP32-DEMO-001',
  sensorData = {},
  spoilageData = {},
  deviceStatus = 'connected',
  storageBatches = [],
  configuredThresholds = {},
  previousState = {}
}) {
  if (!userId) return { success: false, error: 'User ID required' };

  const generatedAlerts = [];
  const resolvedAlerts = [];

  // Configurable thresholds with standardized defaults (Sections 5-9)
  const thresholds = {
    tempWarningMax: configuredThresholds.tempWarningMax ?? 30.0,
    tempHighMax: configuredThresholds.tempHighMax ?? 35.0,
    humidityMin: configuredThresholds.humidityMin ?? 50.0,
    humidityMax: configuredThresholds.humidityMax ?? 80.0,
    gasNormalMax: configuredThresholds.gasNormalMax ?? 500,
    gasElevatedMax: configuredThresholds.gasElevatedMax ?? 700,
    lightMin: configuredThresholds.lightMin ?? 100,
    lightMax: configuredThresholds.lightMax ?? 500,
    spoilageWarning: configuredThresholds.spoilageWarning ?? 30,
    spoilageRisk: configuredThresholds.spoilageRisk ?? 60,
    spoilageCritical: configuredThresholds.spoilageCritical ?? 80,
    ...configuredThresholds
  };

  // 1. Device Offline / Reconnected Evaluation (Section 11)
  const isDeviceOffline = deviceStatus === 'OFFLINE' || deviceStatus === 'offline' || sensorData.isOffline;
  const offlineKey = buildEventKey('device', deviceId, 'offline');

  if (isDeviceOffline) {
    const res = createOrDeduplicateAlert({
      userId,
      deviceId,
      alertType: 'DEVICE_OFFLINE',
      severity: 'HIGH',
      title: 'ESP32 Device Offline',
      message: `${deviceId} is currently offline. Live sensor readings are unavailable.`,
      status: 'ACTIVE',
      source: 'DEVICE',
      eventKey: offlineKey,
      metadata: { device_id: deviceId, last_seen: new Date().toISOString() }
    });
    if (!res.deduplicated) generatedAlerts.push(res.alert);
    // If device is offline, skip sensor-threshold evaluations since data is unavailable or stale
    return { success: true, generatedAlerts, resolvedAlerts };
  } else {
    // Device is connected: check if previous offline alert needs resolution (Section 11)
    const existingOffline = db.prepare(`
      SELECT * FROM alerts
      WHERE user_id = ? AND event_key = ? AND status = 'ACTIVE'
    `).get(userId, offlineKey);

    if (existingOffline) {
      resolveAlert(existingOffline.id, userId);
      resolvedAlerts.push(existingOffline.id);

      // Create recovery event
      const rec = createOrDeduplicateAlert({
        userId,
        deviceId,
        alertType: 'DEVICE_RECONNECTED',
        severity: 'INFO',
        title: 'ESP32 Device Reconnected',
        message: `${deviceId} has reconnected and live sensor monitoring has resumed.`,
        status: 'ACTIVE',
        source: 'DEVICE',
        eventKey: buildEventKey('device', deviceId, 'reconnected'),
        metadata: { device_id: deviceId, reconnected_at: new Date().toISOString() }
      });
      if (!rec.deduplicated) generatedAlerts.push(rec.alert);
    }
  }

  // 2. Sensor Availability Evaluation (Section 12)
  const tempVal = sensorData.temperature ?? sensorData.temp;
  const humVal = sensorData.humidity ?? sensorData.hum;
  const gasVal = sensorData.gasLevel ?? sensorData.gas_level ?? sensorData.gas ?? sensorData.gasVOC;
  const lightVal = sensorData.lightLevel ?? sensorData.light_level ?? sensorData.light ?? sensorData.lux;

  const sensors = [
    { name: 'Temperature', key: 'temperature', val: tempVal, isUnavail: sensorData.isTempUnavailable || sensorData.isDhtUnavailable },
    { name: 'Humidity', key: 'humidity', val: humVal, isUnavail: sensorData.isHumUnavailable || sensorData.isDhtUnavailable },
    { name: 'Gas/VOC', key: 'gas', val: gasVal, isUnavail: sensorData.isGasUnavailable },
    { name: 'Light', key: 'light', val: lightVal, isUnavail: sensorData.isLightUnavailable }
  ];

  for (const s of sensors) {
    const unavailKey = buildEventKey('sensor', `${deviceId}:${s.key}`, 'unavailable');
    const isInvalid = s.isUnavail || s.val == null || (typeof s.val === 'number' && isNaN(s.val));

    if (isInvalid) {
      const res = createOrDeduplicateAlert({
        userId,
        deviceId,
        alertType: 'SENSOR_DATA_UNAVAILABLE',
        severity: 'WARNING',
        title: `${s.name} Sensor Data Unavailable`,
        message: `${s.name} readings are currently unavailable.`,
        status: 'ACTIVE',
        source: 'SENSOR',
        eventKey: unavailKey,
        metadata: { sensor: s.name, sensor_key: s.key }
      });
      if (!res.deduplicated) generatedAlerts.push(res.alert);
    } else {
      // Check if previously unavailable -> trigger recovery event
      const prevUnavail = db.prepare(`
        SELECT * FROM alerts
        WHERE user_id = ? AND event_key = ? AND status = 'ACTIVE'
      `).get(userId, unavailKey);

      if (prevUnavail) {
        resolveAlert(prevUnavail.id, userId);
        resolvedAlerts.push(prevUnavail.id);

        const rec = createOrDeduplicateAlert({
          userId,
          deviceId,
          alertType: 'SENSOR_RECOVERY',
          severity: 'INFO',
          title: `${s.name} Sensor Recovered`,
          message: `${s.name} sensor communication has been restored with valid telemetry.`,
          status: 'ACTIVE',
          source: 'SENSOR',
          eventKey: buildEventKey('sensor', `${deviceId}:${s.key}`, 'recovered'),
          metadata: { sensor: s.name, sensor_key: s.key }
        });
        if (!rec.deduplicated) generatedAlerts.push(rec.alert);
      }
    }
  }

  // 3. Temperature Alert Logic (Section 5)
  if (sensorData.temperature != null && !isNaN(Number(sensorData.temperature))) {
    const temp = Number(sensorData.temperature);
    const tempPrefix = `temperature:${deviceId}:`;

    if (temp > thresholds.tempHighMax) {
      // HIGH Temperature
      resolveAlertsByPrefix(userId, `${tempPrefix}warning`);
      const res = createOrDeduplicateAlert({
        userId,
        deviceId,
        alertType: 'TEMPERATURE',
        severity: 'HIGH',
        title: 'High Temperature',
        message: `Temperature (${temp.toFixed(1)}°C) is above the configured high storage threshold (${thresholds.tempHighMax}°C).`,
        status: 'ACTIVE',
        source: 'SENSOR',
        value: `${temp.toFixed(1)}°C`,
        threshold: `> ${thresholds.tempHighMax}°C`,
        eventKey: `${tempPrefix}high`,
        metadata: { metric: 'temperature', current: temp, threshold: thresholds.tempHighMax }
      });
      if (!res.deduplicated) generatedAlerts.push(res.alert);
    } else if (temp >= thresholds.tempWarningMax) {
      // WARNING Temperature
      resolveAlertsByPrefix(userId, `${tempPrefix}high`);
      const res = createOrDeduplicateAlert({
        userId,
        deviceId,
        alertType: 'TEMPERATURE',
        severity: 'WARNING',
        title: 'Temperature Warning',
        message: `Temperature has exceeded the configured warning threshold (${thresholds.tempWarningMax}°C).`,
        status: 'ACTIVE',
        source: 'SENSOR',
        value: `${temp.toFixed(1)}°C`,
        threshold: `${thresholds.tempWarningMax}–${thresholds.tempHighMax}°C`,
        eventKey: `${tempPrefix}warning`,
        metadata: { metric: 'temperature', current: temp, threshold: thresholds.tempWarningMax }
      });
      if (!res.deduplicated) generatedAlerts.push(res.alert);
    } else {
      // Returns to Normal (< 30°C) -> Resolve previous active temperature alerts (Section 5)
      const count = resolveAlertsByPrefix(userId, tempPrefix);
      if (count > 0) {
        resolvedAlerts.push(tempPrefix);
      }
    }
  }

  // 4. Humidity Alert Logic (Section 6)
  if (sensorData.humidity != null && !isNaN(Number(sensorData.humidity))) {
    const hum = Number(sensorData.humidity);
    const humPrefix = `humidity:${deviceId}:`;

    if (hum > thresholds.humidityMax) {
      resolveAlertsByPrefix(userId, `${humPrefix}low`);
      const res = createOrDeduplicateAlert({
        userId,
        deviceId,
        alertType: 'HUMIDITY',
        severity: 'HIGH',
        title: 'High Humidity',
        message: 'Humidity is above the configured threshold and may increase storage-condition risk.',
        status: 'ACTIVE',
        source: 'SENSOR',
        value: `${hum.toFixed(0)}%`,
        threshold: `> ${thresholds.humidityMax}%`,
        eventKey: `${humPrefix}high`,
        metadata: { metric: 'humidity', current: hum, threshold: thresholds.humidityMax }
      });
      if (!res.deduplicated) generatedAlerts.push(res.alert);
    } else if (hum < thresholds.humidityMin) {
      resolveAlertsByPrefix(userId, `${humPrefix}high`);
      const res = createOrDeduplicateAlert({
        userId,
        deviceId,
        alertType: 'HUMIDITY',
        severity: 'WARNING',
        title: 'Low Humidity',
        message: 'Humidity is below the configured optimal threshold.',
        status: 'ACTIVE',
        source: 'SENSOR',
        value: `${hum.toFixed(0)}%`,
        threshold: `< ${thresholds.humidityMin}%`,
        eventKey: `${humPrefix}low`,
        metadata: { metric: 'humidity', current: hum, threshold: thresholds.humidityMin }
      });
      if (!res.deduplicated) generatedAlerts.push(res.alert);
    } else {
      // Optimal window (50–80%) -> Resolve active humidity alerts
      const count = resolveAlertsByPrefix(userId, humPrefix);
      if (count > 0) {
        resolvedAlerts.push(humPrefix);
      }
    }
  }

  // 5. Gas/VOC Alert Logic (Section 7)
  if (gasVal != null && !isNaN(Number(gasVal))) {
    const gas = Number(gasVal);
    const gasPrefix = `gas:${deviceId}:`;

    if (gas > thresholds.gasElevatedMax) {
      resolveAlertsByPrefix(userId, `${gasPrefix}elevated`);
      const res = createOrDeduplicateAlert({
        userId,
        deviceId,
        alertType: 'GAS_VOC',
        severity: 'HIGH',
        title: 'High Gas/VOC Indicator',
        message: 'The Gas/VOC indicator is above the configured threshold.',
        status: 'ACTIVE',
        source: 'SENSOR',
        value: `${gas} ppm`,
        threshold: `> ${thresholds.gasElevatedMax}`,
        eventKey: `${gasPrefix}high`,
        metadata: { metric: 'gas_voc', sensor: 'MQ-135', current: gas }
      });
      if (!res.deduplicated) generatedAlerts.push(res.alert);
    } else if (gas >= thresholds.gasNormalMax) {
      resolveAlertsByPrefix(userId, `${gasPrefix}high`);
      const res = createOrDeduplicateAlert({
        userId,
        deviceId,
        alertType: 'GAS_VOC',
        severity: 'WARNING',
        title: 'Elevated Gas/VOC Indicator',
        message: 'Environmental conditions indicate increased storage-condition risk.',
        status: 'ACTIVE',
        source: 'SENSOR',
        value: `${gas} ppm`,
        threshold: `${thresholds.gasNormalMax}–${thresholds.gasElevatedMax}`,
        eventKey: `${gasPrefix}elevated`,
        metadata: { metric: 'gas_voc', sensor: 'MQ-135', current: gas }
      });
      if (!res.deduplicated) generatedAlerts.push(res.alert);
    } else {
      // Normal range (< 500) -> Resolve active gas alerts
      const count = resolveAlertsByPrefix(userId, gasPrefix);
      if (count > 0) {
        resolvedAlerts.push(gasPrefix);
      }
    }
  }

  // 6. Light Alert Logic (Section 8)
  if (lightVal != null && !isNaN(Number(lightVal))) {
    const light = Number(lightVal);
    const lightPrefix = `light:${deviceId}:`;

    if (light > thresholds.lightMax) {
      resolveAlertsByPrefix(userId, `${lightPrefix}low`);
      const res = createOrDeduplicateAlert({
        userId,
        deviceId,
        alertType: 'LIGHT',
        severity: 'WARNING',
        title: 'High Light Level',
        message: 'Light level is above the configured storage threshold.',
        status: 'ACTIVE',
        source: 'SENSOR',
        value: `${light} lux`,
        threshold: `> ${thresholds.lightMax} lux`,
        eventKey: `${lightPrefix}high`,
        metadata: { metric: 'light', classification: 'HIGH LIGHT', current: light }
      });
      if (!res.deduplicated) generatedAlerts.push(res.alert);
    } else if (light < thresholds.lightMin) {
      resolveAlertsByPrefix(userId, `${lightPrefix}high`);
      const res = createOrDeduplicateAlert({
        userId,
        deviceId,
        alertType: 'LIGHT',
        severity: 'WARNING',
        title: 'Low Light Level',
        message: 'Light level is below the configured storage threshold.',
        status: 'ACTIVE',
        source: 'SENSOR',
        value: `${light} lux`,
        threshold: `< ${thresholds.lightMin} lux`,
        eventKey: `${lightPrefix}low`,
        metadata: { metric: 'light', classification: 'LOW LIGHT', current: light }
      });
      if (!res.deduplicated) generatedAlerts.push(res.alert);
    } else {
      // Normal range (100–500 lux) -> Resolve active light alerts
      const count = resolveAlertsByPrefix(userId, lightPrefix);
      if (count > 0) {
        resolvedAlerts.push(lightPrefix);
      }
    }
  }

  // 7. Spoilage Risk & Classification Change Alerts (Sections 9 & 13)
  const currentRisk = spoilageData.spoilageRisk ?? sensorData.spoilageRisk;
  const currentClass = spoilageData.classification?.label || spoilageData.classification || sensorData.status;

  if (currentRisk != null && !isNaN(Number(currentRisk))) {
    const risk = Number(currentRisk);
    const batchId = storageBatches[0]?.id || 'v_active_batch';
    const batchName = storageBatches[0]?.vegetable_name || storageBatches[0]?.name || 'Active Storage Batch';
    const spoilPrefix = `spoilage:${batchId}:`;

    if (risk > thresholds.spoilageCritical) {
      // 81-100 CRITICAL
      resolveAlertsByPrefix(userId, `${spoilPrefix}warning`);
      resolveAlertsByPrefix(userId, `${spoilPrefix}risk`);

      const res = createOrDeduplicateAlert({
        userId,
        deviceId,
        storageBatchId: batchId,
        alertType: 'SPOILAGE_RISK',
        severity: 'CRITICAL',
        title: 'Critical Storage Risk',
        message: 'Estimated environmental storage risk is in the CRITICAL range. Review the storage conditions immediately.',
        status: 'ACTIVE',
        source: 'SPOILAGE',
        value: `${risk}%`,
        threshold: `> ${thresholds.spoilageCritical}%`,
        eventKey: `${spoilPrefix}critical`,
        metadata: {
          batch_id: batchId,
          batch_name: batchName,
          spoilage_risk: risk,
          classification: 'CRITICAL'
        }
      });
      if (!res.deduplicated) generatedAlerts.push(res.alert);
    } else if (risk > thresholds.spoilageRisk) {
      // 61-80 SPOILAGE RISK
      resolveAlertsByPrefix(userId, `${spoilPrefix}warning`);
      resolveAlertsByPrefix(userId, `${spoilPrefix}critical`);

      const res = createOrDeduplicateAlert({
        userId,
        deviceId,
        storageBatchId: batchId,
        alertType: 'SPOILAGE_RISK',
        severity: 'HIGH',
        title: 'High Spoilage Risk',
        message: 'Estimated environmental spoilage risk is currently elevated.',
        status: 'ACTIVE',
        source: 'SPOILAGE',
        value: `${risk}%`,
        threshold: `${thresholds.spoilageRisk}–${thresholds.spoilageCritical}%`,
        eventKey: `${spoilPrefix}risk`,
        metadata: {
          batch_id: batchId,
          batch_name: batchName,
          spoilage_risk: risk,
          classification: 'SPOILAGE RISK'
        }
      });
      if (!res.deduplicated) generatedAlerts.push(res.alert);
    } else if (risk > thresholds.spoilageWarning) {
      // 31-60 WARNING
      resolveAlertsByPrefix(userId, `${spoilPrefix}risk`);
      resolveAlertsByPrefix(userId, `${spoilPrefix}critical`);

      const res = createOrDeduplicateAlert({
        userId,
        deviceId,
        storageBatchId: batchId,
        alertType: 'SPOILAGE_RISK',
        severity: 'WARNING',
        title: 'Spoilage Risk Increased',
        message: 'Estimated environmental spoilage risk has entered the WARNING range.',
        status: 'ACTIVE',
        source: 'SPOILAGE',
        value: `${risk}%`,
        threshold: `${thresholds.spoilageWarning}–${thresholds.spoilageRisk}%`,
        eventKey: `${spoilPrefix}warning`,
        metadata: {
          batch_id: batchId,
          batch_name: batchName,
          spoilage_risk: risk,
          classification: 'WARNING'
        }
      });
      if (!res.deduplicated) generatedAlerts.push(res.alert);
    } else {
      // 0-30 FRESH: Resolve active spoilage alerts and create condition improved event if transitioned
      const count = resolveAlertsByPrefix(userId, spoilPrefix);
      if (count > 0) {
        resolvedAlerts.push(spoilPrefix);
      }
    }

    // Status transition tracking (Section 13)
    const prevClass = previousState.spoilageClassification;
    if (prevClass && prevClass !== currentClass) {
      let transSeverity = 'INFO';
      let transTitle = 'Spoilage Risk Classification Changed';
      let transMsg = `Estimated storage-condition risk changed from ${prevClass} to ${currentClass}.`;

      if (currentClass === 'CRITICAL') {
        transSeverity = 'CRITICAL';
        transTitle = 'Critical Storage Risk';
      } else if (currentClass === 'SPOILAGE RISK') {
        transSeverity = 'HIGH';
        transTitle = 'Storage Risk Increased';
        transMsg = 'Estimated storage-condition risk has increased to SPOILAGE RISK.';
      } else if (prevClass === 'CRITICAL' && currentClass === 'SPOILAGE RISK') {
        transSeverity = 'INFO';
        transTitle = 'Storage Risk Improved';
        transMsg = 'Estimated storage-condition risk improved from CRITICAL to SPOILAGE RISK.';
      } else if (currentClass === 'FRESH') {
        transSeverity = 'INFO';
        transTitle = 'Storage Conditions Improved';
        transMsg = 'Estimated storage-condition risk normalized to FRESH range.';
      }

      const transRes = createOrDeduplicateAlert({
        userId,
        deviceId,
        storageBatchId: batchId,
        alertType: 'RISK_CHANGED',
        severity: transSeverity,
        title: transTitle,
        message: transMsg,
        status: 'ACTIVE',
        source: 'SPOILAGE',
        value: `${risk}% (${currentClass})`,
        previousValue: prevClass,
        eventKey: buildEventKey('transition', batchId, `${prevClass}_to_${currentClass}`),
        metadata: { from: prevClass, to: currentClass, risk }
      });
      if (!transRes.deduplicated) generatedAlerts.push(transRes.alert);
    }
  }

  // 8. Storage Batch Expiry Reminders (Section 10)
  for (const batch of storageBatches) {
    if (!batch.id) continue;
    const batchName = batch.vegetable_name || batch.name || 'Produce Batch';
    let daysRemaining = batch.daysRemaining ?? batch.days_remaining;

    if (daysRemaining == null && (batch.expiryDate || batch.expected_expiry_date)) {
      const diffMs = new Date(batch.expiryDate || batch.expected_expiry_date) - new Date();
      daysRemaining = Math.ceil(diffMs / (1000 * 3600 * 24));
    }

    if (daysRemaining != null) {
      if (daysRemaining <= 0) {
        // Expired (days <= 0)
        const res = createOrDeduplicateAlert({
          userId,
          deviceId: batch.device_id || deviceId,
          storageBatchId: batch.id,
          alertType: 'STORAGE_EXPIRY',
          severity: 'CRITICAL',
          title: 'Storage Period Expired',
          message: `${batchName} has reached its configured storage expiry date. Review batch conditions.`,
          status: 'ACTIVE',
          source: 'STORAGE',
          eventKey: `expiry:${batch.id}:expired`,
          metadata: { batch_id: batch.id, batch_name: batchName, days_remaining: daysRemaining }
        });
        if (!res.deduplicated) generatedAlerts.push(res.alert);
      } else if (daysRemaining === 1) {
        // 1 day reminder
        const res = createOrDeduplicateAlert({
          userId,
          deviceId: batch.device_id || deviceId,
          storageBatchId: batch.id,
          alertType: 'STORAGE_EXPIRY',
          severity: 'HIGH',
          title: 'Storage Expiry Reminder',
          message: `${batchName} is scheduled to reach its configured expiry date tomorrow.`,
          status: 'ACTIVE',
          source: 'STORAGE',
          eventKey: `expiry:${batch.id}:1day`,
          metadata: { batch_id: batch.id, batch_name: batchName, days_remaining: 1 }
        });
        if (!res.deduplicated) generatedAlerts.push(res.alert);
      } else if (daysRemaining <= 3) {
        // 3 days reminder
        const res = createOrDeduplicateAlert({
          userId,
          deviceId: batch.device_id || deviceId,
          storageBatchId: batch.id,
          alertType: 'STORAGE_EXPIRY',
          severity: 'WARNING',
          title: 'Storage Expiry Reminder',
          message: `${batchName} is scheduled to reach its configured expiry date in 3 days.`,
          status: 'ACTIVE',
          source: 'STORAGE',
          eventKey: `expiry:${batch.id}:3days`,
          metadata: { batch_id: batch.id, batch_name: batchName, days_remaining: 3 }
        });
        if (!res.deduplicated) generatedAlerts.push(res.alert);
      } else if (daysRemaining <= 7) {
        // 7 days reminder
        const res = createOrDeduplicateAlert({
          userId,
          deviceId: batch.device_id || deviceId,
          storageBatchId: batch.id,
          alertType: 'STORAGE_EXPIRY',
          severity: 'INFO',
          title: 'Storage Expiry Reminder',
          message: `${batchName} is scheduled to reach its configured expiry date in 7 days.`,
          status: 'ACTIVE',
          source: 'STORAGE',
          eventKey: `expiry:${batch.id}:7days`,
          metadata: { batch_id: batch.id, batch_name: batchName, days_remaining: 7 }
        });
        if (!res.deduplicated) generatedAlerts.push(res.alert);
      }
    }
  }

  return {
    success: true,
    generatedAlerts,
    resolvedAlerts
  };
}
