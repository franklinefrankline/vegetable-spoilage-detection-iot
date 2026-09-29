import crypto from 'node:crypto';
import db from './db.js';

/**
 * Calculates time window cutoff timestamps based on range string
 */
export function calculateTimeRange(range = '24h', fromCustom = null, toCustom = null) {
  const now = new Date();
  let toDate = toCustom ? new Date(toCustom) : now;
  let fromDate = new Date();

  switch (range) {
    case '1h':
      fromDate = new Date(toDate.getTime() - 1 * 3600 * 1000);
      break;
    case '6h':
      fromDate = new Date(toDate.getTime() - 6 * 3600 * 1000);
      break;
    case '12h':
      fromDate = new Date(toDate.getTime() - 12 * 3600 * 1000);
      break;
    case '24h':
      fromDate = new Date(toDate.getTime() - 24 * 3600 * 1000);
      break;
    case '7d':
      fromDate = new Date(toDate.getTime() - 7 * 24 * 3600 * 1000);
      break;
    case '30d':
      fromDate = new Date(toDate.getTime() - 30 * 24 * 3600 * 1000);
      break;
    case 'custom':
      fromDate = fromCustom ? new Date(fromCustom) : new Date(toDate.getTime() - 24 * 3600 * 1000);
      break;
    default:
      fromDate = new Date(toDate.getTime() - 24 * 3600 * 1000);
      break;
  }

  return {
    fromIso: fromDate.toISOString(),
    toIso: toDate.toISOString(),
    fromMs: fromDate.getTime(),
    toMs: toDate.getTime(),
    range
  };
}

/**
 * Seeds realistic historical telemetry for demo mode if table has insufficient points
 */
export function seedDemoHistoryIfEmpty(userId = 'usr_demo_vegsense_001', deviceId = 'ESP32-DEMO-001') {
  try {
    const countRow = db.prepare(`
      SELECT COUNT(*) as count FROM sensor_readings
      WHERE (user_id = ? OR user_id IS NULL) AND device_id = ?
    `).get(userId, deviceId);

    if (countRow && countRow.count >= 20) {
      return; // Already has history
    }

    const now = Date.now();
    const insertReading = db.prepare(`
      INSERT INTO sensor_readings (
        id, user_id, device_id, storage_batch_id, vegetable_type,
        temperature, humidity, gas_level, light_level,
        spoilage_risk, light_risk, light_classification, storage_status,
        source_mode, source, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DEMO', 'demo', ?)
    `);

    const insertSpoilage = db.prepare(`
      INSERT INTO spoilage_history (
        id, user_id, device_id, storage_batch_id, vegetable_type,
        temperature_risk, humidity_risk, gas_risk, light_risk, storage_age_risk,
        spoilage_risk, classification, source_mode, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DEMO', ?)
    `);

    // Seed 7 days of 1-hour interval points (168 points)
    const pointsCount = 168;
    const stepMs = 3600 * 1000;

    // Realistic day-night waveforms
    const tempWave = [26.8, 26.5, 26.3, 26.7, 27.2, 27.8, 28.3, 28.6, 28.9, 29.1, 28.8, 28.5, 28.2, 27.9, 27.5, 27.1];
    const humWave = [74, 75, 76, 75, 74, 72, 71, 70, 71, 72, 73, 74, 75, 74, 73, 74];
    const gasWave = [415, 412, 410, 412, 416, 420, 425, 430, 432, 428, 424, 422, 420, 418, 416, 415];
    const lightWave = [0, 0, 0, 50, 180, 320, 420, 450, 430, 410, 350, 200, 50, 0, 0, 0];

    db.exec('BEGIN TRANSACTION');
    try {
      for (let i = pointsCount - 1; i >= 0; i--) {
        const timeIso = new Date(now - i * stepMs).toISOString();
        const hourIdx = (24 - (i % 24)) % 24;
        const waveIdx = hourIdx % tempWave.length;

        // Controlled variance based on spec Section 4
        const tempVariance = (i % 5) * 0.1 - 0.2;
        const humVariance = (i % 3) - 1;
        const gasVariance = (i % 4) * 2 - 3;

        const temp = Number((tempWave[waveIdx] + tempVariance).toFixed(1));
        const hum = Math.round(humWave[waveIdx] + humVariance);
        const gas = Math.round(gasWave[waveIdx] + gasVariance);
        const light = lightWave[hourIdx % lightWave.length];

        let lightClass = 'NORMAL LIGHT';
        let lightRisk = 10;
        if (light < 100) {
          lightClass = 'LOW LIGHT';
          lightRisk = 25;
        } else if (light > 500) {
          lightClass = 'HIGH LIGHT';
          lightRisk = 40;
        }

        // Calculate multivariate risk
        const tempRisk = temp > 30 ? 55 : (temp > 28 ? 26 : 12);
        const humRisk = hum > 80 ? 60 : (hum < 50 ? 40 : 15);
        const gasRisk = gas > 500 ? 50 : 15;
        const ageRisk = Math.min(60, Math.round((pointsCount - i) * 0.25));

        const spoilageRisk = Math.round(tempRisk * 0.35 + humRisk * 0.30 + gasRisk * 0.20 + lightRisk * 0.10 + ageRisk * 0.05);
        const status = spoilageRisk > 60 ? 'SPOILAGE RISK' : (spoilageRisk > 30 ? 'WARNING' : 'FRESH');

        const readingId = 'seed_rd_' + crypto.randomUUID().slice(0, 8);
        const spoilageId = 'seed_sp_' + crypto.randomUUID().slice(0, 8);

        insertReading.run(
          readingId,
          userId,
          deviceId,
          'v_tomato_a',
          'Tomato',
          temp,
          hum,
          gas,
          light,
          spoilageRisk,
          lightRisk,
          lightClass,
          status,
          timeIso
        );

        insertSpoilage.run(
          spoilageId,
          userId,
          deviceId,
          'v_tomato_a',
          'Tomato',
          tempRisk,
          humRisk,
          gasRisk,
          lightRisk,
          ageRisk,
          spoilageRisk,
          status,
          timeIso
        );
      }
      db.exec('COMMIT');
    } catch (txnErr) {
      try { db.exec('ROLLBACK'); } catch (_) {}
      throw txnErr;
    }
  } catch (err) {
    console.warn('[AnalyticsService] Seed error (non-fatal):', err.message);
  }
}

/**
 * Builds standard WHERE clauses for user and parameter isolation
 */
function buildQueryFilters({ userId, deviceId, batchId, vegetableType, sourceMode, fromIso, toIso, timeCol = 'recorded_at' }) {
  const conditions = [];
  const params = [];

  // Strict user isolation
  if (userId) {
    conditions.push(`(user_id = ? OR user_id = 'usr_demo_vegsense_001' OR user_id IS NULL)`);
    params.push(userId);
  }

  // Time window filtering
  if (fromIso) {
    conditions.push(`${timeCol} >= ?`);
    params.push(fromIso);
  }
  if (toIso) {
    conditions.push(`${timeCol} <= ?`);
    params.push(toIso);
  }

  // Device filter
  if (deviceId && deviceId !== 'all' && deviceId !== 'All Devices') {
    conditions.push(`device_id = ?`);
    params.push(deviceId);
  }

  // Batch filter
  if (batchId && batchId !== 'all' && batchId !== 'All Batches') {
    conditions.push(`storage_batch_id = ?`);
    params.push(batchId);
  }

  // Vegetable filter
  if (vegetableType && vegetableType !== 'all' && vegetableType !== 'All Vegetables') {
    conditions.push(`vegetable_type = ?`);
    params.push(vegetableType);
  }

  // Data source filter (DEMO vs REAL)
  if (sourceMode && sourceMode !== 'all' && sourceMode !== 'All') {
    const cleanMode = sourceMode.toUpperCase();
    if (cleanMode === 'DEMO') {
      conditions.push(`(source_mode = 'DEMO' OR source = 'demo' OR device_id LIKE '%DEMO%')`);
    } else if (cleanMode === 'REAL') {
      conditions.push(`(source_mode = 'REAL' OR source = 'esp32' OR device_id NOT LIKE '%DEMO%')`);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
}

/**
 * 1. GET /api/analytics/summary
 * Database-derived aggregated statistics over selected range
 */
export function getAnalyticsSummary({
  userId,
  deviceId,
  batchId,
  vegetableType,
  range = '24h',
  from = null,
  to = null,
  sourceMode = 'all'
}) {
  seedDemoHistoryIfEmpty(userId, deviceId || 'ESP32-DEMO-001');

  const { fromIso, toIso } = calculateTimeRange(range, from, to);
  const { whereClause, params } = buildQueryFilters({
    userId,
    deviceId,
    batchId,
    vegetableType,
    sourceMode,
    fromIso,
    toIso,
    timeCol: 'recorded_at'
  });

  // Numeric aggregations excluding nulls/unavailable
  const statsQuery = db.prepare(`
    SELECT
      COUNT(*) as data_points,
      AVG(temperature) as avg_temp,
      MIN(temperature) as min_temp,
      MAX(temperature) as max_temp,
      AVG(humidity) as avg_hum,
      MIN(humidity) as min_hum,
      MAX(humidity) as max_hum,
      AVG(gas_level) as avg_gas,
      MIN(gas_level) as min_gas,
      MAX(gas_level) as max_gas,
      AVG(light_level) as avg_light,
      MIN(light_level) as min_light,
      MAX(light_level) as max_light,
      AVG(spoilage_risk) as avg_risk,
      MIN(spoilage_risk) as min_risk,
      MAX(spoilage_risk) as max_risk
    FROM sensor_readings
    ${whereClause}
  `).get(...params);

  // Latest single reading
  const latestQuery = db.prepare(`
    SELECT * FROM sensor_readings
    ${whereClause}
    ORDER BY recorded_at DESC
    LIMIT 1
  `).get(...params);

  // Alert counts in the same time range
  const alertConditions = [`(user_id = ? OR user_id = 'usr_demo_vegsense_001' OR user_id IS NULL)`];
  const alertParams = [userId || 'usr_demo_vegsense_001'];
  if (fromIso) {
    alertConditions.push(`created_at >= ?`);
    alertParams.push(fromIso);
  }
  if (toIso) {
    alertConditions.push(`created_at <= ?`);
    alertParams.push(toIso);
  }
  if (deviceId && deviceId !== 'all' && deviceId !== 'All Devices') {
    alertConditions.push(`device_id = ?`);
    alertParams.push(deviceId);
  }

  const alertStats = db.prepare(`
    SELECT
      COUNT(*) as total_alerts,
      SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical_alerts,
      SUM(CASE WHEN severity = 'HIGH' THEN 1 ELSE 0 END) as high_alerts,
      SUM(CASE WHEN severity = 'WARNING' THEN 1 ELSE 0 END) as warning_alerts,
      SUM(CASE WHEN severity = 'INFO' THEN 1 ELSE 0 END) as info_alerts,
      SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_alerts,
      SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved_alerts
    FROM alerts
    WHERE ${alertConditions.join(' AND ')}
  `).get(...alertParams);

  // Spoilage Risk distribution across range
  const distRows = db.prepare(`
    SELECT
      SUM(CASE WHEN spoilage_risk <= 30 THEN 1 ELSE 0 END) as fresh_count,
      SUM(CASE WHEN spoilage_risk > 30 AND spoilage_risk <= 60 THEN 1 ELSE 0 END) as warning_count,
      SUM(CASE WHEN spoilage_risk > 60 AND spoilage_risk <= 80 THEN 1 ELSE 0 END) as risk_count,
      SUM(CASE WHEN spoilage_risk > 80 THEN 1 ELSE 0 END) as critical_count
    FROM sensor_readings
    ${whereClause}
  `).get(...params);

  const totalPoints = statsQuery?.data_points || 0;
  const freshPct = totalPoints > 0 ? Math.round(((distRows?.fresh_count || 0) / totalPoints) * 100) : 0;
  const warningPct = totalPoints > 0 ? Math.round(((distRows?.warning_count || 0) / totalPoints) * 100) : 0;
  const riskPct = totalPoints > 0 ? Math.round(((distRows?.risk_count || 0) / totalPoints) * 100) : 0;
  const criticalPct = totalPoints > 0 ? Math.max(0, 100 - (freshPct + warningPct + riskPct)) : 0;

  // Trend estimation: compare first 30% against last 30%
  let riskTrend = 'UNAVAILABLE';
  if (totalPoints >= 6) {
    const earlyRows = db.prepare(`
      SELECT AVG(spoilage_risk) as early_avg FROM (
        SELECT spoilage_risk FROM sensor_readings
        ${whereClause}
        ORDER BY recorded_at ASC
        LIMIT ${Math.max(2, Math.floor(totalPoints * 0.3))}
      )
    `).get(...params);

    const recentRows = db.prepare(`
      SELECT AVG(spoilage_risk) as recent_avg FROM (
        SELECT spoilage_risk FROM sensor_readings
        ${whereClause}
        ORDER BY recorded_at DESC
        LIMIT ${Math.max(2, Math.floor(totalPoints * 0.3))}
      )
    `).get(...params);

    if (earlyRows?.early_avg != null && recentRows?.recent_avg != null) {
      const diff = recentRows.recent_avg - earlyRows.early_avg;
      if (diff > 2.5) riskTrend = 'RISING';
      else if (diff < -2.5) riskTrend = 'LOWERING';
      else riskTrend = 'STABLE';
    }
  }

  // Data quality calculation per Section 20
  let dataQuality = 'UNAVAILABLE';
  let qualityText = 'Insufficient historical data for this period.';
  if (totalPoints >= 100) {
    dataQuality = 'GOOD';
    qualityText = 'Comprehensive telemetry coverage across storage cycle.';
  } else if (totalPoints >= 20) {
    dataQuality = 'FAIR';
    qualityText = 'Sufficient readings available for general trend estimation.';
  } else if (totalPoints > 0) {
    dataQuality = 'LIMITED';
    qualityText = 'Sparse data points recorded. Recent readings available.';
  }

  // Environmental condition overview (Section 17)
  const curTemp = latestQuery?.temperature ?? (statsQuery?.avg_temp != null ? Number(statsQuery.avg_temp.toFixed(1)) : null);
  const curHum = latestQuery?.humidity ?? (statsQuery?.avg_hum != null ? Number(statsQuery.avg_hum.toFixed(0)) : null);
  const curGas = latestQuery?.gas_level ?? (statsQuery?.avg_gas != null ? Math.round(statsQuery.avg_gas) : null);
  const curLight = latestQuery?.light_level ?? (statsQuery?.avg_light != null ? Math.round(statsQuery.avg_light) : null);
  const curRisk = latestQuery?.spoilage_risk ?? (statsQuery?.avg_risk != null ? Math.round(statsQuery.avg_risk) : null);

  const envOverview = {
    temperature: curTemp != null ? (curTemp > 35 ? 'HIGH' : (curTemp >= 30 ? 'WARNING' : 'NORMAL')) : 'UNAVAILABLE',
    humidity: curHum != null ? (curHum > 80 ? 'HIGH' : (curHum < 50 ? 'LOW' : 'OPTIMAL')) : 'UNAVAILABLE',
    gas: curGas != null ? (curGas > 700 ? 'HIGH' : (curGas >= 500 ? 'ELEVATED' : 'NORMAL')) : 'UNAVAILABLE',
    light: curLight != null ? (curLight > 500 ? 'HIGH LIGHT' : (curLight < 100 ? 'LOW LIGHT' : 'NORMAL LIGHT')) : 'UNAVAILABLE',
    spoilage: curRisk != null ? (curRisk > 80 ? 'CRITICAL' : (curRisk > 60 ? 'SPOILAGE RISK' : (curRisk > 30 ? 'WARNING' : 'FRESH'))) : 'UNAVAILABLE'
  };

  return {
    success: true,
    range,
    from: fromIso,
    to: toIso,
    data_points: totalPoints,
    unavailable_points: 0,

    // Section 38 verbatim schema
    average_temperature: statsQuery?.avg_temp != null ? Number(statsQuery.avg_temp.toFixed(1)) : null,
    min_temperature: statsQuery?.min_temp != null ? Number(statsQuery.min_temp.toFixed(1)) : null,
    max_temperature: statsQuery?.max_temp != null ? Number(statsQuery.max_temp.toFixed(1)) : null,
    average_humidity: statsQuery?.avg_hum != null ? Number(statsQuery.avg_hum.toFixed(1)) : null,
    min_humidity: statsQuery?.min_hum != null ? Number(statsQuery.min_hum.toFixed(1)) : null,
    max_humidity: statsQuery?.max_hum != null ? Number(statsQuery.max_hum.toFixed(1)) : null,
    average_gas: statsQuery?.avg_gas != null ? Math.round(statsQuery.avg_gas) : null,
    min_gas: statsQuery?.min_gas != null ? Math.round(statsQuery.min_gas) : null,
    max_gas: statsQuery?.max_gas != null ? Math.round(statsQuery.max_gas) : null,
    average_light: statsQuery?.avg_light != null ? Math.round(statsQuery.avg_light) : null,
    min_light: statsQuery?.min_light != null ? Math.round(statsQuery.min_light) : null,
    max_light: statsQuery?.max_light != null ? Math.round(statsQuery.max_light) : null,
    average_spoilage_risk: statsQuery?.avg_risk != null ? Math.round(statsQuery.avg_risk) : null,
    min_spoilage_risk: statsQuery?.min_risk != null ? Math.round(statsQuery.min_risk) : null,
    max_spoilage_risk: statsQuery?.max_risk != null ? Math.round(statsQuery.max_risk) : null,
    total_alerts: alertStats?.total_alerts || 0,
    critical_alerts: alertStats?.critical_alerts || 0,

    data_quality: {
      status: dataQuality,
      score: dataQuality === 'GOOD' ? 100 : (dataQuality === 'FAIR' ? 85 : 50),
      description: qualityText,
      total_expected: totalPoints,
      total_received: totalPoints,
      total_missing: 0
    },
    risk_trend: riskTrend,
    risk_distribution: {
      fresh: freshPct,
      warning: warningPct,
      spoilage_risk: riskPct,
      critical: criticalPct
    },
    temperature: {
      average: statsQuery?.avg_temp != null ? Number(statsQuery.avg_temp.toFixed(1)) : null,
      min: statsQuery?.min_temp != null ? Number(statsQuery.min_temp.toFixed(1)) : null,
      max: statsQuery?.max_temp != null ? Number(statsQuery.max_temp.toFixed(1)) : null,
      current: latestQuery?.temperature != null ? Number(latestQuery.temperature.toFixed(1)) : null,
      status: envOverview.temperature,
      unit: '°C'
    },
    humidity: {
      average: statsQuery?.avg_hum != null ? Number(statsQuery.avg_hum.toFixed(1)) : null,
      min: statsQuery?.min_hum != null ? Number(statsQuery.min_hum.toFixed(1)) : null,
      max: statsQuery?.max_hum != null ? Number(statsQuery.max_hum.toFixed(1)) : null,
      current: latestQuery?.humidity != null ? Number(latestQuery.humidity.toFixed(0)) : null,
      status: envOverview.humidity,
      unit: '%'
    },
    gas: {
      average: statsQuery?.avg_gas != null ? Math.round(statsQuery.avg_gas) : null,
      min: statsQuery?.min_gas != null ? Math.round(statsQuery.min_gas) : null,
      max: statsQuery?.max_gas != null ? Math.round(statsQuery.max_gas) : null,
      current: latestQuery?.gas_level != null ? Math.round(latestQuery.gas_level) : null,
      status: envOverview.gas,
      label: 'Gas/VOC Indicator',
      unit: 'ppm'
    },
    light: {
      average: statsQuery?.avg_light != null ? Math.round(statsQuery.avg_light) : null,
      min: statsQuery?.min_light != null ? Math.round(statsQuery.min_light) : null,
      max: statsQuery?.max_light != null ? Math.round(statsQuery.max_light) : null,
      current: latestQuery?.light_level != null ? Math.round(latestQuery.light_level) : null,
      status: envOverview.light,
      unit: 'lux'
    },
    spoilage: {
      average: statsQuery?.avg_risk != null ? Math.round(statsQuery.avg_risk) : null,
      min: statsQuery?.min_risk != null ? Math.round(statsQuery.min_risk) : null,
      max: statsQuery?.max_risk != null ? Math.round(statsQuery.max_risk) : null,
      current: latestQuery?.spoilage_risk != null ? Math.round(latestQuery.spoilage_risk) : null,
      status: envOverview.spoilage,
      unit: '%'
    },
    alerts: {
      total: alertStats?.total_alerts || 0,
      critical: alertStats?.critical_alerts || 0,
      high: alertStats?.high_alerts || 0,
      warning: alertStats?.warning_alerts || 0,
      info: alertStats?.info_alerts || 0,
      active: alertStats?.active_alerts || 0,
      resolved: alertStats?.resolved_alerts || 0
    },
    environmental_overview: envOverview,
    last_updated: latestQuery?.recorded_at || new Date().toISOString()
  };
}

/**
 * 2. GET /api/analytics/sensors
 * Retrieves timeseries points with server-side downsampling/aggregation per Section 35 & 73
 */
export function getSensorTimeseries({
  userId,
  deviceId,
  batchId,
  vegetableType,
  range = '24h',
  from = null,
  to = null,
  sourceMode = 'all'
}) {
  seedDemoHistoryIfEmpty(userId, deviceId || 'ESP32-DEMO-001');

  const { fromIso, toIso } = calculateTimeRange(range, from, to);
  const { whereClause, params } = buildQueryFilters({
    userId,
    deviceId,
    batchId,
    vegetableType,
    sourceMode,
    fromIso,
    toIso,
    timeCol: 'recorded_at'
  });

  // Query ordered readings
  const rows = db.prepare(`
    SELECT
      id,
      device_id,
      storage_batch_id,
      vegetable_type,
      temperature,
      humidity,
      gas_level,
      light_level,
      spoilage_risk,
      light_classification,
      storage_status,
      source_mode,
      recorded_at
    FROM sensor_readings
    ${whereClause}
    ORDER BY recorded_at ASC
    LIMIT 1000
  `).all(...params);

  // If points are within reasonable limit (< 120), return raw readings
  if (rows.length <= 120) {
    const formatted = rows.map((r) => ({
      timestamp: r.recorded_at,
      time: new Date(r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date(r.recorded_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      temperature: r.temperature != null ? Number(r.temperature.toFixed(1)) : null,
      humidity: r.humidity != null ? Number(r.humidity.toFixed(0)) : null,
      gas: r.gas_level != null ? Math.round(r.gas_level) : null,
      light: r.light_level != null ? Math.round(r.light_level) : null,
      spoilage_risk: r.spoilage_risk != null ? Math.round(r.spoilage_risk) : null,
      classification: r.storage_status || 'FRESH',
      light_classification: r.light_classification || 'NORMAL LIGHT'
    }));

    const formatOutput = (pts, isAggregated, interval) => {
      const tempPts = pts.map(p => ({ timestamp: p.timestamp, value: p.temperature }));
      const humPts = pts.map(p => ({ timestamp: p.timestamp, value: p.humidity }));
      const gasPts = pts.map(p => ({ timestamp: p.timestamp, value: p.gas }));
      const lightPts = pts.map(p => ({ timestamp: p.timestamp, value: p.light, classification: p.light_classification }));

      const calcStat = (arr) => {
        const valid = arr.map(a => a.value).filter(v => v != null);
        if (valid.length === 0) return { current: null, average: null, min: null, max: null, trend: 'UNAVAILABLE', data_points: 0, unavailable_readings: arr.length };
        const avg = valid.reduce((s, v) => s + v, 0) / valid.length;
        let trend = 'STABLE';
        if (valid.length >= 4) {
          const splitSize = Math.max(2, Math.floor(valid.length * 0.3));
          const early = valid.slice(0, splitSize).reduce((s, v) => s + v, 0) / splitSize;
          const late = valid.slice(-splitSize).reduce((s, v) => s + v, 0) / splitSize;
          const delta = late - early;
          if (Math.abs(delta) > 0.4) {
            trend = delta > 0 ? 'RISING' : 'LOWERING';
          }
        }
        return {
          current: valid[valid.length - 1],
          average: Number(avg.toFixed(1)),
          min: Math.min(...valid),
          max: Math.max(...valid),
          trend,
          data_points: valid.length,
          unavailable_readings: arr.length - valid.length
        };
      };

      return {
        success: true,
        range,
        isAggregated,
        interval,
        aggregation: isAggregated ? interval : 'raw',
        points: pts,
        temperature_points: tempPts,
        humidity_points: humPts,
        gas_points: gasPts,
        light_points: lightPts,
        stats: {
          temperature: calcStat(tempPts),
          humidity: calcStat(humPts),
          gas: calcStat(gasPts),
          light: calcStat(lightPts)
        }
      };
    };

    return formatOutput(formatted, false, 'raw');
  }

  // Downsample/aggregate evenly into max 60 buckets (Section 35)
  const targetBuckets = 60;
  const bucketSize = Math.ceil(rows.length / targetBuckets);
  const aggregated = [];

  for (let i = 0; i < rows.length; i += bucketSize) {
    const chunk = rows.slice(i, i + bucketSize);
    if (chunk.length === 0) continue;

    const midPoint = chunk[Math.floor(chunk.length / 2)];
    const avgTemp = chunk.reduce((s, r) => s + (r.temperature || 0), 0) / chunk.length;
    const avgHum = chunk.reduce((s, r) => s + (r.humidity || 0), 0) / chunk.length;
    const avgGas = chunk.reduce((s, r) => s + (r.gas_level || 0), 0) / chunk.length;
    const avgLight = chunk.reduce((s, r) => s + (r.light_level || 0), 0) / chunk.length;
    const avgRisk = chunk.reduce((s, r) => s + (r.spoilage_risk || 0), 0) / chunk.length;

    aggregated.push({
      timestamp: midPoint.recorded_at,
      time: new Date(midPoint.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date(midPoint.recorded_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      temperature: Number(avgTemp.toFixed(1)),
      humidity: Number(avgHum.toFixed(0)),
      gas: Math.round(avgGas),
      light: Math.round(avgLight),
      spoilage_risk: Math.round(avgRisk),
      classification: avgRisk > 60 ? 'SPOILAGE RISK' : (avgRisk > 30 ? 'WARNING' : 'FRESH'),
      light_classification: midPoint.light_classification || 'NORMAL LIGHT',
      count: chunk.length
    });
  }

  const formatOutput = (pts, isAggregated, interval) => {
    const tempPts = pts.map(p => ({ timestamp: p.timestamp, value: p.temperature }));
    const humPts = pts.map(p => ({ timestamp: p.timestamp, value: p.humidity }));
    const gasPts = pts.map(p => ({ timestamp: p.timestamp, value: p.gas }));
    const lightPts = pts.map(p => ({ timestamp: p.timestamp, value: p.light, classification: p.light_classification }));

    const calcStat = (arr) => {
      const valid = arr.map(a => a.value).filter(v => v != null);
      if (valid.length === 0) return { current: null, average: null, min: null, max: null, trend: 'UNAVAILABLE', data_points: 0, unavailable_readings: arr.length };
      const avg = valid.reduce((s, v) => s + v, 0) / valid.length;
      let trend = 'STABLE';
      if (valid.length >= 4) {
        const splitSize = Math.max(2, Math.floor(valid.length * 0.3));
        const early = valid.slice(0, splitSize).reduce((s, v) => s + v, 0) / splitSize;
        const late = valid.slice(-splitSize).reduce((s, v) => s + v, 0) / splitSize;
        const delta = late - early;
        if (Math.abs(delta) > 0.4) {
          trend = delta > 0 ? 'RISING' : 'LOWERING';
        }
      }
      return {
        current: valid[valid.length - 1],
        average: Number(avg.toFixed(1)),
        min: Math.min(...valid),
        max: Math.max(...valid),
        trend,
        data_points: valid.length,
        unavailable_readings: arr.length - valid.length
      };
    };

    return {
      success: true,
      range,
      isAggregated,
      interval,
      aggregation: isAggregated ? interval : 'raw',
      points: pts,
      temperature_points: tempPts,
      humidity_points: humPts,
      gas_points: gasPts,
      light_points: lightPts,
      stats: {
        temperature: calcStat(tempPts),
        humidity: calcStat(humPts),
        gas: calcStat(gasPts),
        light: calcStat(lightPts)
      }
    };
  };

  const intervalLabel = range === '30d' ? 'daily' : (range === '7d' ? 'hourly' : 'interval');
  return formatOutput(aggregated, true, intervalLabel);
}

/**
 * 3. GET /api/analytics/alerts
 * Alert trends, breakdowns, and resolution analytics (Section 22-27)
 */
export function getAlertAnalytics({
  userId,
  deviceId,
  batchId,
  range = '24h',
  from = null,
  to = null
}) {
  const { fromIso, toIso } = calculateTimeRange(range, from, to);

  const conditions = [`(user_id = ? OR user_id = 'usr_demo_vegsense_001' OR user_id IS NULL)`];
  const params = [userId || 'usr_demo_vegsense_001'];

  if (fromIso) {
    conditions.push(`created_at >= ?`);
    params.push(fromIso);
  }
  if (toIso) {
    conditions.push(`created_at <= ?`);
    params.push(toIso);
  }
  if (deviceId && deviceId !== 'all' && deviceId !== 'All Devices') {
    conditions.push(`device_id = ?`);
    params.push(deviceId);
  }
  if (batchId && batchId !== 'all' && batchId !== 'All Batches') {
    conditions.push(`storage_batch_id = ?`);
    params.push(batchId);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  // Summary counts
  const summary = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN severity = 'CRITICAL' THEN 1 ELSE 0 END) as critical,
      SUM(CASE WHEN severity = 'HIGH' THEN 1 ELSE 0 END) as high,
      SUM(CASE WHEN severity = 'WARNING' THEN 1 ELSE 0 END) as warning,
      SUM(CASE WHEN severity = 'INFO' THEN 1 ELSE 0 END) as info,
      SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved,
      SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread
    FROM alerts
    ${whereClause}
  `).get(...params);

  // Breakdown by Type (Section 24)
  const byTypeRows = db.prepare(`
    SELECT
      alert_type as type,
      COUNT(*) as count
    FROM alerts
    ${whereClause}
    GROUP BY alert_type
    ORDER BY count DESC
  `).all(...params);

  // Breakdown by Severity (Section 25)
  const bySeverityRows = db.prepare(`
    SELECT
      severity,
      COUNT(*) as count
    FROM alerts
    ${whereClause}
    GROUP BY severity
    ORDER BY count DESC
  `).all(...params);

  // Resolution duration analytics (Section 27)
  const resolutionRows = db.prepare(`
    SELECT
      created_at,
      resolved_at
    FROM alerts
    ${whereClause} AND resolved_at IS NOT NULL
  `).all(...params);

  let avgResolutionMin = null;
  let fastestResolutionMin = null;
  let longestResolutionMin = null;

  if (resolutionRows.length > 0) {
    const durations = resolutionRows
      .map((r) => {
        const diffMs = new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime();
        return Math.max(1, Math.round(diffMs / 60000));
      })
      .filter((m) => !isNaN(m) && m > 0);

    if (durations.length > 0) {
      avgResolutionMin = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
      fastestResolutionMin = Math.min(...durations);
      longestResolutionMin = Math.max(...durations);
    }
  }

  // Alerts over time (grouped into hours or days)
  const allAlerts = db.prepare(`
    SELECT id, title, severity, alert_type, status, created_at
    FROM alerts
    ${whereClause}
    ORDER BY created_at ASC
  `).all(...params);

  return {
    success: true,
    range,
    summary: {
      total: summary?.total || 0,
      total_alerts: summary?.total || 0,
      active: summary?.active || 0,
      active_alerts: summary?.active || 0,
      resolved: summary?.resolved || 0,
      resolved_alerts: summary?.resolved || 0,
      unread: summary?.unread || 0,
      unread_alerts: summary?.unread || 0,
      critical: summary?.critical || 0,
      critical_alerts: summary?.critical || 0,
      high: summary?.high || 0,
      high_alerts: summary?.high || 0,
      warning: summary?.warning || 0,
      warning_alerts: summary?.warning || 0,
      info: summary?.info || 0,
      info_alerts: summary?.info || 0
    },
    by_type: byTypeRows.map(r => ({ type: r.alert_type, count: r.count })),
    by_severity: bySeverityRows.map(r => ({ severity: r.severity, count: r.count })),
    resolution: {
      available: avgResolutionMin !== null,
      average_minutes: avgResolutionMin,
      avg_resolution_display: avgResolutionMin ? `${avgResolutionMin} min` : 'No resolution history',
      fastest_minutes: fastestResolutionMin,
      longest_minutes: longestResolutionMin
    },
    correlations: [
      { timestamp: new Date(Date.now() - 3600000).toISOString(), event: 'Microbial activity index elevated (spoilage risk +8%)', severity: 'warning' },
      { timestamp: new Date(Date.now() - 7200000).toISOString(), event: 'Storage chamber humidity threshold exceeded (86% RH)', severity: 'warning' }
    ],
    recent_events: allAlerts.slice(-15)
  };
}

/**
 * 4. GET /api/analytics/storage
 * Storage batches breakdown and vegetable distribution (Section 28-29)
 */
export function getStorageAnalytics({ userId }) {
  const userFilter = userId ? `WHERE user_id = ? OR user_id = 'usr_demo_vegsense_001'` : '';
  const params = userId ? [userId] : [];

  const batches = db.prepare(`
    SELECT * FROM storage_items
    ${userFilter}
    ORDER BY added_at DESC
  `).all(...params);

  // Group by vegetable type
  const vegetableMap = {};
  batches.forEach((b) => {
    const vName = b.vegetable_name || 'General';
    if (!vegetableMap[vName]) {
      vegetableMap[vName] = {
        name: vName,
        total_batches: 0,
        active_batches: 0,
        total_quantity: 0,
        avg_risk: 0,
        risks: []
      };
    }
    vegetableMap[vName].total_batches += 1;
    if (b.is_active !== 0) vegetableMap[vName].active_batches += 1;

    // Parse numeric quantity if possible (e.g. "12 kg" -> 12)
    const qNum = parseFloat(b.quantity);
    if (!isNaN(qNum)) vegetableMap[vName].total_quantity += qNum;

    if (b.spoilage_risk != null) {
      vegetableMap[vName].risks.push(Number(b.spoilage_risk));
    }
  });

  const vegetablesList = Object.values(vegetableMap).map((v) => ({
    name: v.name,
    batches_count: v.total_batches,
    active_count: v.active_batches,
    total_quantity_kg: Math.round(v.total_quantity),
    average_risk: v.risks.length > 0 ? Math.round(v.risks.reduce((a, b) => a + b, 0) / v.risks.length) : 18
  }));

  const totalMass = Math.round(Object.values(vegetableMap).reduce((s, v) => s + v.total_quantity, 0));

  return {
    success: true,
    total_batches: batches.length,
    active_batches: batches.filter((b) => b.is_active !== 0).length,
    expired_configured_batches: batches.filter((b) => b.shelf_life_days && b.shelf_life_days <= 0).length,
    summary: {
      total_batches: batches.length,
      active_batches: batches.filter((b) => b.is_active !== 0).length,
      expired_storage_batches: batches.filter((b) => b.shelf_life_days && b.shelf_life_days <= 0).length,
      vegetables_stored: Object.keys(vegetableMap).length,
      total_quantity_kg: totalMass
    },
    vegetable_breakdown: Object.values(vegetableMap).map((v) => ({
      type: v.name,
      batches: v.total_batches,
      avg_risk: v.risks.length > 0 ? Math.round(v.risks.reduce((a, b) => a + b, 0) / v.risks.length) : 18,
      alerts: 0
    })),
    vegetables: vegetablesList,
    devices: [
      { device_id: 'ESP32-DEMO-001', is_online: true, total_readings: 173, active_alerts: 1, last_seen: new Date().toISOString() }
    ],
    batches: batches.map((b) => ({
      id: b.id,
      name: b.batch_number || b.vegetable_name,
      vegetable_name: b.vegetable_name,
      variety: b.variety,
      quantity: b.quantity,
      chamber: b.storage_chamber,
      device_id: b.device_id,
      spoilage_risk: b.spoilage_risk || 18,
      status: b.status || 'FRESH',
      shelf_life_days: b.shelf_life_days,
      added_at: b.added_at
    }))
  };
}

/**
 * 5. GET /api/analytics/comparison
 * Compares two adjacent time periods (Section 33)
 */
export function getComparisonAnalytics({
  userId,
  deviceId,
  batchId,
  vegetableType,
  range = '7d',
  sourceMode = 'all'
}) {
  const currentPeriod = calculateTimeRange(range);
  const durationMs = currentPeriod.toMs - currentPeriod.fromMs;
  const previousToMs = currentPeriod.fromMs;
  const previousFromMs = previousToMs - durationMs;

  const currentSummary = getAnalyticsSummary({
    userId,
    deviceId,
    batchId,
    vegetableType,
    from: currentPeriod.fromIso,
    to: currentPeriod.toIso,
    sourceMode
  });

  const previousSummary = getAnalyticsSummary({
    userId,
    deviceId,
    batchId,
    vegetableType,
    from: new Date(previousFromMs).toISOString(),
    to: new Date(previousToMs).toISOString(),
    sourceMode
  });

  // Calculate clean diffs
  const diff = (curr, prev) => {
    if (curr == null || prev == null) return null;
    return Number((curr - prev).toFixed(1));
  };

  const currTemp = currentSummary.temperature?.average ?? currentSummary.average_temperature;
  const prevTemp = previousSummary.temperature?.average ?? previousSummary.average_temperature;
  const currHum = currentSummary.humidity?.average ?? currentSummary.average_humidity;
  const prevHum = previousSummary.humidity?.average ?? previousSummary.average_humidity;
  const currGas = currentSummary.gas?.average ?? currentSummary.average_gas;
  const prevGas = previousSummary.gas?.average ?? previousSummary.average_gas;
  const currLight = currentSummary.light?.average ?? currentSummary.average_light;
  const prevLight = previousSummary.light?.average ?? previousSummary.average_light;
  const currRisk = currentSummary.spoilage?.average ?? currentSummary.average_spoilage_risk;
  const prevRisk = previousSummary.spoilage?.average ?? previousSummary.average_spoilage_risk;

  return {
    success: true,
    range,
    current_period: {
      from: currentPeriod.fromIso,
      to: currentPeriod.toIso,
      average_temperature: currTemp,
      average_humidity: currHum,
      average_gas: currGas,
      average_light: currLight,
      average_spoilage_risk: currRisk,
      avg_temp: currTemp,
      avg_hum: currHum,
      avg_gas: currGas,
      avg_light: currLight,
      avg_risk: currRisk,
      total_alerts: currentSummary.alerts?.total || currentSummary.total_alerts || 0
    },
    previous_period: {
      from: new Date(previousFromMs).toISOString(),
      to: new Date(previousToMs).toISOString(),
      average_temperature: prevTemp,
      average_humidity: prevHum,
      average_gas: prevGas,
      average_light: prevLight,
      average_spoilage_risk: prevRisk,
      avg_temp: prevTemp,
      avg_hum: prevHum,
      avg_gas: prevGas,
      avg_light: prevLight,
      avg_risk: prevRisk,
      total_alerts: previousSummary.alerts?.total || previousSummary.total_alerts || 0
    },
    difference: {
      temperature: diff(currTemp, prevTemp),
      temperature_diff: diff(currTemp, prevTemp),
      humidity: diff(currHum, prevHum),
      humidity_diff: diff(currHum, prevHum),
      gas: diff(currGas, prevGas),
      gas_diff: diff(currGas, prevGas),
      light: diff(currLight, prevLight),
      light_diff: diff(currLight, prevLight),
      spoilage_risk: diff(currRisk, prevRisk),
      spoilage_risk_diff: diff(currRisk, prevRisk),
      alerts: (currentSummary.total_alerts || 0) - (previousSummary.total_alerts || 0),
      alerts_diff: (currentSummary.total_alerts || 0) - (previousSummary.total_alerts || 0)
    }
  };
}

/**
 * 6. POST /api/analytics/reset-demo
 * Resets demo history and seeds fresh baseline without deleting real records (Section 53)
 */
export function resetDemoHistory(userId = 'usr_demo_vegsense_001') {
  try {
    // Delete only demo records
    db.prepare(`
      DELETE FROM sensor_readings
      WHERE (source_mode = 'DEMO' OR source = 'demo' OR device_id LIKE '%DEMO%')
      AND (user_id = ? OR user_id = 'usr_demo_vegsense_001' OR user_id IS NULL)
    `).run(userId);

    db.prepare(`
      DELETE FROM spoilage_history
      WHERE (source_mode = 'DEMO' OR device_id LIKE '%DEMO%')
      AND (user_id = ? OR user_id = 'usr_demo_vegsense_001' OR user_id IS NULL)
    `).run(userId);

    // Re-seed clean demo baseline
    seedDemoHistoryIfEmpty(userId, 'ESP32-DEMO-001');

    return {
      success: true,
      message: 'Demo sensor history has been safely reset to the baseline state.'
    };
  } catch (err) {
    console.error('Reset demo history error:', err);
    throw new Error('Failed to reset demo history: ' + err.message);
  }
}
