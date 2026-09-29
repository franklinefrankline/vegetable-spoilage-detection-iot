import crypto from 'node:crypto';
import db from './db.js';

export const DEFAULT_USER_SETTINGS = {
  theme: 'forest',
  accent: 'green',
  card_style: 'rounded',
  font_size: 'medium',
  animation: 'subtle',
  notifications_enabled: 1,
  browser_notifications_enabled: 0,
  critical_alerts_enabled: 1,
  high_alerts_enabled: 1,
  warning_alerts_enabled: 1,
  info_alerts_enabled: 1,
  temperature_alerts_enabled: 1,
  humidity_alerts_enabled: 1,
  gas_alerts_enabled: 1,
  light_alerts_enabled: 1,
  spoilage_alerts_enabled: 1,
  expiry_alerts_enabled: 1,
  device_alerts_enabled: 1,
  sensor_alerts_enabled: 1,
  sensor_temp_enabled: 1,
  sensor_hum_enabled: 1,
  sensor_gas_enabled: 1,
  sensor_light_enabled: 1,
  light_sensor_type: 'BH1750',
  temperature_warning_threshold: 30.0,
  temperature_high_threshold: 35.0,
  humidity_low_threshold: 50.0,
  humidity_high_threshold: 80.0,
  gas_elevated_threshold: 500.0,
  gas_high_threshold: 700.0,
  light_low_threshold: 100.0,
  light_high_threshold: 500.0,
  spoilage_warning_threshold: 31.0,
  spoilage_risk_threshold: 61.0,
  spoilage_critical_threshold: 81.0,
  weight_temperature: 30.0,
  weight_humidity: 25.0,
  weight_gas: 25.0,
  weight_light: 10.0,
  weight_age: 10.0
};

/**
 * Retrieves the settings for a user. If none exist, seeds default settings.
 */
export function getUserSettings(userId) {
  if (!userId) throw new Error('User ID is required.');
  
  const existing = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
  if (existing) {
    return existing;
  }

  // Seed default settings row for this user
  const id = 'set_' + crypto.randomUUID().slice(0, 10);
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO user_settings (
      id, user_id, theme, accent, card_style, font_size, animation,
      notifications_enabled, browser_notifications_enabled,
      critical_alerts_enabled, high_alerts_enabled, warning_alerts_enabled, info_alerts_enabled,
      temperature_alerts_enabled, humidity_alerts_enabled, gas_alerts_enabled, light_alerts_enabled,
      spoilage_alerts_enabled, expiry_alerts_enabled, device_alerts_enabled, sensor_alerts_enabled,
      sensor_temp_enabled, sensor_hum_enabled, sensor_gas_enabled, sensor_light_enabled,
      light_sensor_type,
      temperature_warning_threshold, temperature_high_threshold,
      humidity_low_threshold, humidity_high_threshold,
      gas_elevated_threshold, gas_high_threshold,
      light_low_threshold, light_high_threshold,
      spoilage_warning_threshold, spoilage_risk_threshold, spoilage_critical_threshold,
      weight_temperature, weight_humidity, weight_gas, weight_light, weight_age,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?,
      ?, ?,
      ?, ?,
      ?, ?,
      ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?
    )
  `).run(
    id, userId,
    DEFAULT_USER_SETTINGS.theme, DEFAULT_USER_SETTINGS.accent, DEFAULT_USER_SETTINGS.card_style, DEFAULT_USER_SETTINGS.font_size, DEFAULT_USER_SETTINGS.animation,
    DEFAULT_USER_SETTINGS.notifications_enabled, DEFAULT_USER_SETTINGS.browser_notifications_enabled,
    DEFAULT_USER_SETTINGS.critical_alerts_enabled, DEFAULT_USER_SETTINGS.high_alerts_enabled, DEFAULT_USER_SETTINGS.warning_alerts_enabled, DEFAULT_USER_SETTINGS.info_alerts_enabled,
    DEFAULT_USER_SETTINGS.temperature_alerts_enabled, DEFAULT_USER_SETTINGS.humidity_alerts_enabled, DEFAULT_USER_SETTINGS.gas_alerts_enabled, DEFAULT_USER_SETTINGS.light_alerts_enabled,
    DEFAULT_USER_SETTINGS.spoilage_alerts_enabled, DEFAULT_USER_SETTINGS.expiry_alerts_enabled, DEFAULT_USER_SETTINGS.device_alerts_enabled, DEFAULT_USER_SETTINGS.sensor_alerts_enabled,
    DEFAULT_USER_SETTINGS.sensor_temp_enabled, DEFAULT_USER_SETTINGS.sensor_hum_enabled, DEFAULT_USER_SETTINGS.sensor_gas_enabled, DEFAULT_USER_SETTINGS.sensor_light_enabled,
    DEFAULT_USER_SETTINGS.light_sensor_type,
    DEFAULT_USER_SETTINGS.temperature_warning_threshold, DEFAULT_USER_SETTINGS.temperature_high_threshold,
    DEFAULT_USER_SETTINGS.humidity_low_threshold, DEFAULT_USER_SETTINGS.humidity_high_threshold,
    DEFAULT_USER_SETTINGS.gas_elevated_threshold, DEFAULT_USER_SETTINGS.gas_high_threshold,
    DEFAULT_USER_SETTINGS.light_low_threshold, DEFAULT_USER_SETTINGS.light_high_threshold,
    DEFAULT_USER_SETTINGS.spoilage_warning_threshold, DEFAULT_USER_SETTINGS.spoilage_risk_threshold, DEFAULT_USER_SETTINGS.spoilage_critical_threshold,
    DEFAULT_USER_SETTINGS.weight_temperature, DEFAULT_USER_SETTINGS.weight_humidity, DEFAULT_USER_SETTINGS.weight_gas, DEFAULT_USER_SETTINGS.weight_light, DEFAULT_USER_SETTINGS.weight_age,
    now, now
  );

  return db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
}

/**
 * Validates threshold values and relative ordering
 */
export function validateThresholds(thresholds) {
  const errors = [];

  const tempWarn = Number(thresholds.temperature_warning_threshold);
  const tempHigh = Number(thresholds.temperature_high_threshold);
  if (!isNaN(tempWarn) && !isNaN(tempHigh)) {
    if (tempWarn >= tempHigh) {
      errors.push('Temperature warning threshold must be strictly less than high threshold.');
    }
  }

  const humLow = Number(thresholds.humidity_low_threshold);
  const humHigh = Number(thresholds.humidity_high_threshold);
  if (!isNaN(humLow) && !isNaN(humHigh)) {
    if (humLow >= humHigh) {
      errors.push('Humidity low threshold must be strictly less than high threshold.');
    }
    if (humLow < 0 || humHigh > 100) {
      errors.push('Humidity values must be between 0% and 100%.');
    }
  }

  const gasElevated = Number(thresholds.gas_elevated_threshold);
  const gasHigh = Number(thresholds.gas_high_threshold);
  if (!isNaN(gasElevated) && !isNaN(gasHigh)) {
    if (gasElevated >= gasHigh) {
      errors.push('Gas/VOC elevated indicator threshold must be strictly less than high threshold.');
    }
  }

  const lightLow = Number(thresholds.light_low_threshold);
  const lightHigh = Number(thresholds.light_high_threshold);
  if (!isNaN(lightLow) && !isNaN(lightHigh)) {
    if (lightLow >= lightHigh) {
      errors.push('Light low threshold must be strictly less than high threshold.');
    }
    if (lightLow < 0) {
      errors.push('Light threshold cannot be negative.');
    }
  }

  const spoilWarn = Number(thresholds.spoilage_warning_threshold);
  const spoilRisk = Number(thresholds.spoilage_risk_threshold);
  const spoilCrit = Number(thresholds.spoilage_critical_threshold);
  if (!isNaN(spoilWarn) && !isNaN(spoilRisk) && !isNaN(spoilCrit)) {
    if (spoilWarn >= spoilRisk || spoilRisk >= spoilCrit) {
      errors.push('Spoilage thresholds must follow: Warning < Spoilage Risk < Critical.');
    }
    if (spoilWarn < 0 || spoilCrit > 100) {
      errors.push('Spoilage risk thresholds must be between 0 and 100.');
    }
  }

  return errors;
}

/**
 * Validates spoilage weights to ensure they total 100%
 */
export function validateWeights(weights) {
  const wTemp = Number(weights.weight_temperature);
  const wHum = Number(weights.weight_humidity);
  const wGas = Number(weights.weight_gas);
  const wLight = Number(weights.weight_light);
  const wAge = Number(weights.weight_age);

  if (isNaN(wTemp) || isNaN(wHum) || isNaN(wGas) || isNaN(wLight) || isNaN(wAge)) {
    return ['All five risk weights must be specified as valid numbers.'];
  }

  if (wTemp < 0 || wHum < 0 || wGas < 0 || wLight < 0 || wAge < 0) {
    return ['Weights cannot be negative.'];
  }

  const total = wTemp + wHum + wGas + wLight + wAge;
  if (Math.abs(total - 100.0) > 0.5) {
    return [`Risk weights must total 100%. Current sum: ${Math.round(total)}%.`];
  }

  return [];
}

/**
 * Updates settings for a user with full field validation
 */
export function updateUserSettings(userId, updates) {
  getUserSettings(userId); // Ensure row exists

  // If thresholds or weights are updated, validate them
  const thresholdErrors = validateThresholds(updates);
  if (thresholdErrors.length > 0) {
    const err = new Error(thresholdErrors.join(' '));
    err.status = 400;
    throw err;
  }

  if (
    updates.weight_temperature !== undefined ||
    updates.weight_humidity !== undefined ||
    updates.weight_gas !== undefined ||
    updates.weight_light !== undefined ||
    updates.weight_age !== undefined
  ) {
    const current = getUserSettings(userId);
    const weightErrors = validateWeights({
      weight_temperature: updates.weight_temperature ?? current.weight_temperature,
      weight_humidity: updates.weight_humidity ?? current.weight_humidity,
      weight_gas: updates.weight_gas ?? current.weight_gas,
      weight_light: updates.weight_light ?? current.weight_light,
      weight_age: updates.weight_age ?? current.weight_age
    });
    if (weightErrors.length > 0) {
      const err = new Error(weightErrors.join(' '));
      err.status = 400;
      throw err;
    }
  }

  // Allowed columns whitelist
  const allowedKeys = [
    'theme', 'accent', 'card_style', 'font_size', 'animation',
    'notifications_enabled', 'browser_notifications_enabled',
    'critical_alerts_enabled', 'high_alerts_enabled', 'warning_alerts_enabled', 'info_alerts_enabled',
    'temperature_alerts_enabled', 'humidity_alerts_enabled', 'gas_alerts_enabled', 'light_alerts_enabled',
    'spoilage_alerts_enabled', 'expiry_alerts_enabled', 'device_alerts_enabled', 'sensor_alerts_enabled',
    'sensor_temp_enabled', 'sensor_hum_enabled', 'sensor_gas_enabled', 'sensor_light_enabled',
    'light_sensor_type',
    'temperature_warning_threshold', 'temperature_high_threshold',
    'humidity_low_threshold', 'humidity_high_threshold',
    'gas_elevated_threshold', 'gas_high_threshold',
    'light_low_threshold', 'light_high_threshold',
    'spoilage_warning_threshold', 'spoilage_risk_threshold', 'spoilage_critical_threshold',
    'weight_temperature', 'weight_humidity', 'weight_gas', 'weight_light', 'weight_age'
  ];

  const setClauses = [];
  const params = [];

  for (const key of allowedKeys) {
    if (updates[key] !== undefined) {
      setClauses.push(`${key} = ?`);
      let val = updates[key];
      if (typeof val === 'boolean') val = val ? 1 : 0;
      params.push(val);
    }
  }

  if (setClauses.length === 0) {
    return getUserSettings(userId);
  }

  setClauses.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(userId);

  const query = `UPDATE user_settings SET ${setClauses.join(', ')} WHERE user_id = ?`;
  db.prepare(query).run(...params);

  return getUserSettings(userId);
}

/**
 * Resets settings back to baseline defaults for a user
 */
export function resetUserSettings(userId) {
  return updateUserSettings(userId, DEFAULT_USER_SETTINGS);
}

/**
 * Resets Demo Mode telemetry & demo alerts without affecting real data
 */
export function resetUserDemoData(userId) {
  if (!userId) throw new Error('User ID is required.');

  // Delete sensor readings matching demo mode/device for this user
  const deletedReadings = db.prepare(`
    DELETE FROM sensor_readings
    WHERE user_id = ? AND (source_mode = 'DEMO' OR device_id = 'ESP32-DEMO-001')
  `).run(userId);

  // Delete spoilage history matching demo mode/device
  const deletedSpoilage = db.prepare(`
    DELETE FROM spoilage_history
    WHERE user_id = ? AND (source_mode = 'DEMO' OR device_id = 'ESP32-DEMO-001')
  `).run(userId);

  // Delete demo alerts
  const deletedAlerts = db.prepare(`
    DELETE FROM alerts
    WHERE user_id = ? AND (source = 'DEMO' OR device_id = 'ESP32-DEMO-001')
  `).run(userId);

  return {
    success: true,
    deletedReadings: deletedReadings.changes,
    deletedSpoilage: deletedSpoilage.changes,
    deletedAlerts: deletedAlerts.changes
  };
}

/**
 * Compiles a comprehensive export of all user-owned data in JSON format.
 * Strips password hashes and tokens to protect user privacy.
 */
export function exportUserData(userId) {
  if (!userId) throw new Error('User ID is required.');

  const user = db.prepare('SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?').get(userId);
  if (!user) {
    throw new Error('User account not found.');
  }

  const settings = getUserSettings(userId);
  const devices = db.prepare('SELECT * FROM devices WHERE user_id = ?').all(userId);
  const storageBatches = db.prepare('SELECT * FROM storage_items WHERE user_id = ?').all(userId);
  const sensorReadings = db.prepare('SELECT * FROM sensor_readings WHERE user_id = ? ORDER BY recorded_at DESC LIMIT 500').all(userId);
  const spoilageHistory = db.prepare('SELECT * FROM spoilage_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 500').all(userId);
  const alerts = db.prepare('SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT 200').all(userId);
  const reports = db.prepare(`
    SELECT id, user_id, report_type, title, file_name, device_id, storage_batch_id, vegetable_type,
           source_mode, from_date, to_date, status, file_size, created_at
    FROM reports
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId);

  return {
    exportDate: new Date().toISOString(),
    system: 'VegSense – Smart Storage Intelligence',
    version: '2.5.0-production',
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at
    },
    settings,
    devices,
    storageBatches,
    sensorReadings,
    spoilageHistory,
    alerts,
    reports
  };
}
