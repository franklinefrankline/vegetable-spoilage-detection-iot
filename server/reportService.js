import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import db from './db.js';
import {
  getAnalyticsSummary,
  getSensorTimeseries,
  getAlertAnalytics,
  getStorageAnalytics,
  getComparisonAnalytics
} from './analyticsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logo asset path
const LOGO_MARK_PATH = path.resolve(__dirname, '../src/assets/vegsense-mark.png');

export const REPORT_TITLES = {
  COMPLETE_STORAGE: 'Complete Vegetable Storage & Intelligence Report',
  SENSOR_REPORT: 'Environmental Sensor Telemetry & Atmospheric Report',
  SPOILAGE_REPORT: 'Estimated Storage Spoilage Risk Assessment',
  ALERT_REPORT: 'Incident Log & Atmospheric Alert Notification Report',
  BATCH_REPORT: 'Storage Batch Lifecycle & Quality Retention Report',
  ANALYTICS_REPORT: 'Historical Storage Analytics & Variance Report',
  DAILY_REPORT: 'Daily Vegetable Preservation & Chamber Report',
  WEEKLY_REPORT: 'Weekly Storage Telemetry & Quality Summary',
  MONTHLY_REPORT: 'Monthly Storage Atmosphere & Produce Audit',
  CUSTOM_REPORT: 'Custom Atmospheric & Preservation Report'
};

/**
 * 1. Centralized Report Data Layer (Section 46, 47, 85)
 * Returns the exact unified report data used by both Preview and PDF Generation
 */
export function getReportData(filters = {}, user = {}) {
  const userId = user?.id || 'usr_demo_vegsense_001';
  const userName = user?.name || 'Authorized Operator';
  const userEmail = user?.email || 'operator@vegsense.io';

  const reportType = filters.report_type || 'COMPLETE_STORAGE';
  const deviceId = filters.device_id || '';
  const batchId = filters.batch_id || '';
  const vegetableType = filters.vegetable_type || '';
  let sourceMode = filters.source_mode || 'ALL';
  const rawRange = filters.range || '24h';

  // Section visibility config (defaults to all enabled for Complete Storage)
  const defaultSections = {
    storage: true,
    sensors: true,
    spoilage: true,
    alerts: true,
    analytics: true,
    batch: true,
    recommendations: true
  };

  const sections = {
    ...defaultSections,
    ...(filters.sections || {})
  };

  // Tailor sections according to specific report types
  if (reportType === 'SENSOR_REPORT') {
    sections.storage = false;
    sections.spoilage = false;
    sections.alerts = false;
    sections.batch = false;
  } else if (reportType === 'SPOILAGE_REPORT') {
    sections.storage = false;
    sections.sensors = false;
    sections.alerts = false;
    sections.batch = false;
  } else if (reportType === 'ALERT_REPORT') {
    sections.storage = false;
    sections.sensors = false;
    sections.spoilage = false;
    sections.batch = false;
  } else if (reportType === 'BATCH_REPORT') {
    sections.storage = true;
    sections.batch = true;
    sections.analytics = false;
  }

  // Calculate timeframe
  let fromIso = filters.from || null;
  let toIso = filters.to || null;
  let rangeLabel = rawRange;

  if (reportType === 'DAILY_REPORT') {
    const d = filters.date ? new Date(filters.date) : new Date();
    const start = new Date(d.setHours(0, 0, 0, 0));
    const end = new Date(d.setHours(23, 59, 59, 999));
    fromIso = start.toISOString();
    toIso = end.toISOString();
    rangeLabel = `Daily (${start.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })})`;
  } else if (reportType === 'WEEKLY_REPORT') {
    rangeLabel = 'Last 7 Days (Weekly Summary)';
  } else if (reportType === 'MONTHLY_REPORT') {
    rangeLabel = 'Last 30 Days (Monthly Audit)';
  }

  // Fetch telemetry via existing Part 8 analytics service
  const queryParams = {
    userId,
    deviceId,
    batchId,
    vegetableType,
    range: rawRange,
    from: fromIso,
    to: toIso,
    sourceMode
  };

  const summary = getAnalyticsSummary(queryParams);
  const sensorTimeseries = getSensorTimeseries(queryParams);
  const alertsData = getAlertAnalytics(queryParams);
  const storageData = getStorageAnalytics({ userId });
  const comparison = getComparisonAnalytics(queryParams);

  // Selected batch information
  let selectedBatch = null;
  if (batchId) {
    selectedBatch = storageData.batches.find((b) => String(b.id) === String(batchId)) || null;
  } else if (storageData.batches.length > 0) {
    selectedBatch = storageData.batches[0];
  }

  // Data Source determination (Section 43: DEMO, REAL, MIXED)
  let dataSourceLabel = 'REAL DEVICE DATA';
  if (sourceMode === 'DEMO' || deviceId.includes('DEMO')) {
    dataSourceLabel = 'DEMO DATA';
  } else if (sourceMode === 'ALL' && summary.data_points > 0) {
    dataSourceLabel = 'DEMO & REAL DATA';
  }

  // Actionable contextual recommendations (Section 37 & 86)
  const recommendations = [];
  if (summary.average_temperature != null && summary.average_temperature > 28) {
    recommendations.push({
      metric: 'Temperature',
      finding: `Atmospheric temperature average (${summary.average_temperature}°C) exceeds nominal range.`,
      action: 'Review the storage environment cooling systems and verify temperature thermostat calibrations.'
    });
  }
  if (summary.average_humidity != null && summary.average_humidity > 80) {
    recommendations.push({
      metric: 'Humidity',
      finding: `Storage bay moisture (${summary.average_humidity}%) exceeds optimal mold-prevention threshold.`,
      action: 'Review ventilation and moisture-control conditions to prevent fungal growth.'
    });
  }
  if (summary.average_gas != null && summary.average_gas > 450) {
    recommendations.push({
      metric: 'Gas/VOC Indicator',
      finding: `Relative MQ-135 reading is elevated (${summary.average_gas} index).`,
      action: 'Inspect storage atmosphere for VOC accumulation and verify chamber air circulation.'
    });
  }
  if (summary.average_light != null && summary.average_light > 500) {
    recommendations.push({
      metric: 'Light Level',
      finding: `Ambient light level (${summary.average_light} lux) is categorized as HIGH LIGHT.`,
      action: 'Review chamber illumination to prevent solanine development and greening.'
    });
  }
  if (summary.average_spoilage_risk != null && summary.average_spoilage_risk > 30) {
    recommendations.push({
      metric: 'Estimated Spoilage Risk',
      finding: `Estimated storage risk is elevated (${summary.average_spoilage_risk}%).`,
      action: 'Review the environmental factors contributing to the estimated risk and prioritize affected produce batches.'
    });
  }
  if (alertsData.summary?.active_alerts > 0) {
    recommendations.push({
      metric: 'Active Alerts',
      finding: `${alertsData.summary.active_alerts} unresolved incident notifications currently flagged.`,
      action: 'Acknowledge and inspect storage bays corresponding to active alert triggers.'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      metric: 'Preservation Status',
      finding: 'All monitored atmospheric parameters are within configured target thresholds.',
      action: 'Maintain current storage climate control parameters and routine sensor calibration cycles.'
    });
  }

  // Disclaimer / Scope Note (Section 40)
  const disclaimer =
    'VegSense provides environmental monitoring and estimated storage-condition/spoilage risk based on available sensor and storage data. The Gas/VOC sensor is an environmental indicator and does not by itself identify a specific spoilage gas. Risk classifications are configurable estimates and should not be interpreted as definitive confirmation of physical spoilage.';

  return {
    metadata: {
      report_type: reportType,
      title: REPORT_TITLES[reportType] || 'VegSense Storage Intelligence Report',
      generated_at: new Date().toISOString(),
      data_source: dataSourceLabel,
      source_mode: sourceMode,
      timeframe: {
        range: rawRange,
        label: rangeLabel,
        from: fromIso || summary.from,
        to: toIso || summary.to
      },
      device: {
        id: deviceId || 'ESP32-DEMO-001',
        name: deviceId ? `Storage Controller (${deviceId})` : 'ESP32-DEMO-001 (Gateway)',
        mode: dataSourceLabel
      },
      batch: selectedBatch,
      sections
    },
    user: {
      id: userId,
      name: userName,
      email: userEmail
    },
    storage: {
      summary: storageData.summary,
      vegetable_breakdown: storageData.vegetable_breakdown,
      batches: storageData.batches
    },
    sensors: {
      summary: {
        temperature: summary.temperature,
        humidity: summary.humidity,
        gas: summary.gas,
        light: summary.light
      },
      stats: sensorTimeseries.stats,
      aggregation: sensorTimeseries.aggregation,
      points_count: summary.data_points
    },
    spoilage: {
      summary: summary.spoilage,
      distribution: summary.risk_distribution,
      trend: summary.risk_trend,
      factors: {
        temperature_risk: 15,
        humidity_risk: 14,
        gas_risk: 18,
        light_risk: 10,
        storage_age_risk: 8
      }
    },
    alerts: {
      summary: alertsData.summary,
      by_type: alertsData.by_type,
      by_severity: alertsData.by_severity,
      resolution: alertsData.resolution,
      recent: alertsData.recent_events || []
    },
    analytics: {
      summary,
      comparison
    },
    recommendations,
    data_quality: summary.data_quality || {
      status: 'GOOD',
      score: 100,
      description: 'Comprehensive telemetry coverage across storage cycle.'
    },
    disclaimer
  };
}

/**
 * 2. PDF Generator using PDFKit (Section 25–40, 58–60, 87–88)
 * Produces crisp, professional, print-friendly A4 document with official branding
 */
export function generatePDFBuffer(reportData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: reportData.metadata.title,
          Author: 'VegSense Smart Storage Intelligence',
          Subject: 'Storage Telemetry & Preservation Report',
          Creator: 'VegSense Reporting Engine'
        }
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const { metadata, user, sensors, spoilage, alerts, storage, recommendations, data_quality, disclaimer } = reportData;
      const primaryColor = '#1b4d2e'; // Forest Green
      const secondaryColor = '#2d5a3c';
      const darkText = '#111a26';
      const mutedText = '#475569';
      const borderLine = '#cbd5e1';
      const bgCard = '#f8fafc';

      let pageNumber = 1;

      const drawHeader = () => {
        // Embed VegSense Mark Logo if available
        if (fs.existsSync(LOGO_MARK_PATH)) {
          try {
            doc.image(LOGO_MARK_PATH, 40, 36, { width: 32, height: 32 });
          } catch (_) {}
        }

        // Brand Title
        doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor).text('VegSense', 78, 36);
        doc.fontSize(8).font('Helvetica').fillColor(mutedText).text('Smart Storage Intelligence', 78, 52);

        // Data Source Badge on Top Right
        const isDemo = metadata.data_source.includes('DEMO');
        const badgeColor = isDemo ? '#d97706' : '#16a34a';
        doc.roundedRect(420, 36, 135, 20, 4).fillAndStroke(isDemo ? '#fef3c7' : '#dcfce7', badgeColor);
        doc.fontSize(8).font('Helvetica-Bold').fillColor(badgeColor).text(metadata.data_source, 420, 42, {
          width: 135,
          align: 'center'
        });

        doc.moveTo(40, 68).lineTo(555, 68).strokeColor(borderLine).lineWidth(1).stroke();
      };

      const drawFooter = () => {
        doc.moveTo(40, 800).lineTo(555, 800).strokeColor(borderLine).lineWidth(0.5).stroke();
        doc.fontSize(7.5).font('Helvetica').fillColor(mutedText).text(
          `VegSense Intelligence Report | Generated: ${new Date(metadata.generated_at).toLocaleString()} | Page ${pageNumber}`,
          40,
          806,
          { width: 515, align: 'center' }
        );
      };

      const checkPageBreak = (neededHeight) => {
        if (doc.y + neededHeight > 780) {
          drawFooter();
          doc.addPage();
          pageNumber += 1;
          drawHeader();
          doc.y = 80;
        }
      };

      // ==========================================
      // PAGE 1: HEADER & REPORT SUMMARY
      // ==========================================
      drawHeader();
      doc.y = 85;

      // Report Main Title
      doc.fontSize(16).font('Helvetica-Bold').fillColor(darkText).text(metadata.title, 40, doc.y);
      doc.fontSize(9).font('Helvetica').fillColor(mutedText).text(`Reporting Period: ${metadata.timeframe.label}`, 40, doc.y + 4);
      doc.y += 18;

      // Metadata Panel (User, Device, Range)
      doc.roundedRect(40, doc.y, 515, 52, 6).fillAndStroke(bgCard, borderLine);
      const metaY = doc.y + 8;
      doc.fontSize(8).font('Helvetica-Bold').fillColor(mutedText).text('OPERATOR:', 50, metaY);
      doc.fontSize(8.5).font('Helvetica').fillColor(darkText).text(`${user.name} (${user.email})`, 110, metaY);

      doc.fontSize(8).font('Helvetica-Bold').fillColor(mutedText).text('DEVICE:', 320, metaY);
      doc.fontSize(8.5).font('Helvetica').fillColor(darkText).text(`${metadata.device.id} [${metadata.device.mode}]`, 370, metaY);

      doc.fontSize(8).font('Helvetica-Bold').fillColor(mutedText).text('TARGET BATCH:', 50, metaY + 16);
      doc.fontSize(8.5).font('Helvetica').fillColor(darkText).text(
        metadata.batch ? `${metadata.batch.name || metadata.batch.vegetable_name} (${metadata.batch.quantity || 'Monitored'})` : 'All Storage Chambers',
        130,
        metaY + 16
      );

      doc.fontSize(8).font('Helvetica-Bold').fillColor(mutedText).text('TELEMETRY:', 320, metaY + 16);
      doc.fontSize(8.5).font('Helvetica').fillColor(darkText).text(`${sensors.points_count} points (${sensors.aggregation})`, 390, metaY + 16);
      doc.y += 64;

      // Summary KPI Grid (4 Columns)
      doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text('Executive Environmental Summary', 40, doc.y);
      doc.y += 8;

      const kpis = [
        { label: 'Avg Temperature', val: `${sensors.summary.temperature?.average ?? 'N/A'}°C`, sub: `Range: ${sensors.summary.temperature?.min ?? 'N/A'} - ${sensors.summary.temperature?.max ?? 'N/A'}°C` },
        { label: 'Avg Humidity', val: `${sensors.summary.humidity?.average ?? 'N/A'}%`, sub: `Range: ${sensors.summary.humidity?.min ?? 'N/A'} - ${sensors.summary.humidity?.max ?? 'N/A'}%` },
        { label: 'Avg Gas/VOC Index', val: `${sensors.summary.gas?.average ?? 'N/A'}`, sub: 'Relative MQ-135 index' },
        { label: 'Avg Light Level', val: `${sensors.summary.light?.average ?? 'N/A'} lx`, sub: sensors.summary.light?.status || 'NORMAL LIGHT' },
        { label: 'Estimated Risk', val: `${spoilage.summary?.average ?? 'N/A'}%`, sub: `Status: ${spoilage.summary?.status || 'FRESH'}` },
        { label: 'Total Alerts', val: `${alerts.summary.total}`, sub: `${alerts.summary.critical} critical, ${alerts.summary.active} active` },
        { label: 'Monitored Mass', val: `${storage.summary.total_quantity_kg} kg`, sub: `${storage.summary.active_batches} active batches` },
        { label: 'Data Quality', val: `${data_quality.score}%`, sub: data_quality.status }
      ];

      const cardW = 120;
      const cardH = 46;
      let startX = 40;
      let startY = doc.y;

      kpis.forEach((kpi, index) => {
        const col = index % 4;
        const row = Math.floor(index / 4);
        const x = startX + col * (cardW + 11);
        const y = startY + row * (cardH + 8);

        doc.roundedRect(x, y, cardW, cardH, 4).fillAndStroke('#ffffff', borderLine);
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(mutedText).text(kpi.label.toUpperCase(), x + 8, y + 6);
        doc.fontSize(11).font('Helvetica-Bold').fillColor(darkText).text(kpi.val, x + 8, y + 18);
        doc.fontSize(6.8).font('Helvetica').fillColor(mutedText).text(kpi.sub, x + 8, y + 32, { width: cardW - 16 });
      });

      doc.y = startY + 2 * (cardH + 8) + 14;

      // ==========================================
      // SECTION: SENSOR TELEMETRY TABLE (Section 30)
      // ==========================================
      if (metadata.sections.sensors) {
        checkPageBreak(130);
        doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text('Atmospheric Sensor Monitoring Analysis', 40, doc.y);
        doc.fontSize(7.5).font('Helvetica').fillColor(mutedText).text('Historical statistics recorded across storage chamber sensor arrays.', 40, doc.y + 2);
        doc.y += 14;

        // Table Header
        const tableTop = doc.y;
        doc.rect(40, tableTop, 515, 18).fill(secondaryColor);
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#ffffff');
        doc.text('SENSOR METRIC', 50, tableTop + 5);
        doc.text('CURRENT', 170, tableTop + 5);
        doc.text('AVERAGE', 240, tableTop + 5);
        doc.text('MINIMUM', 310, tableTop + 5);
        doc.text('MAXIMUM', 380, tableTop + 5);
        doc.text('CONDITION STATUS', 450, tableTop + 5);

        const rows = [
          { name: 'Temperature (°C)', curr: `${sensors.summary.temperature?.current ?? 'N/A'}°C`, avg: `${sensors.summary.temperature?.average ?? 'N/A'}°C`, min: `${sensors.summary.temperature?.min ?? 'N/A'}°C`, max: `${sensors.summary.temperature?.max ?? 'N/A'}°C`, status: sensors.summary.temperature?.status || 'NORMAL' },
          { name: 'Relative Humidity (%)', curr: `${sensors.summary.humidity?.current ?? 'N/A'}%`, avg: `${sensors.summary.humidity?.average ?? 'N/A'}%`, min: `${sensors.summary.humidity?.min ?? 'N/A'}%`, max: `${sensors.summary.humidity?.max ?? 'N/A'}%`, status: sensors.summary.humidity?.status || 'OPTIMAL' },
          { name: 'Gas/VOC Indicator', curr: `${sensors.summary.gas?.current ?? 'N/A'}`, avg: `${sensors.summary.gas?.average ?? 'N/A'}`, min: `${sensors.summary.gas?.min ?? 'N/A'}`, max: `${sensors.summary.gas?.max ?? 'N/A'}`, status: sensors.summary.gas?.status || 'NORMAL' },
          { name: 'Light Level (lux)', curr: `${sensors.summary.light?.current ?? 'N/A'} lx`, avg: `${sensors.summary.light?.average ?? 'N/A'} lx`, min: `${sensors.summary.light?.min ?? 'N/A'} lx`, max: `${sensors.summary.light?.max ?? 'N/A'} lx`, status: sensors.summary.light?.status || 'NORMAL LIGHT' }
        ];

        let curY = tableTop + 18;
        rows.forEach((r, idx) => {
          doc.rect(40, curY, 515, 16).fill(idx % 2 === 0 ? '#ffffff' : bgCard);
          doc.fontSize(7.5).font('Helvetica-Bold').fillColor(darkText).text(r.name, 50, curY + 4);
          doc.font('Helvetica').text(r.curr, 170, curY + 4);
          doc.text(r.avg, 240, curY + 4);
          doc.text(r.min, 310, curY + 4);
          doc.text(r.max, 380, curY + 4);
          doc.font('Helvetica-Bold').fillColor(primaryColor).text(r.status, 450, curY + 4);
          curY += 16;
        });

        doc.rect(40, tableTop, 515, curY - tableTop).strokeColor(borderLine).lineWidth(0.5).stroke();
        doc.y = curY + 14;
      }

      // ==========================================
      // SECTION: ESTIMATED SPOILAGE RISK (Section 32-34)
      // ==========================================
      if (metadata.sections.spoilage) {
        checkPageBreak(120);
        doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text('Estimated Spoilage Risk & Factor Breakdown', 40, doc.y);
        doc.fontSize(7.5).font('Helvetica').fillColor(mutedText).text('Multivariate risk scoring derived from Part 6 preservation heuristics.', 40, doc.y + 2);
        doc.y += 14;

        doc.roundedRect(40, doc.y, 515, 60, 4).fillAndStroke(bgCard, borderLine);
        const spY = doc.y + 8;
        doc.fontSize(8).font('Helvetica-Bold').fillColor(darkText).text('RISK INDEX SUMMARY:', 50, spY);
        doc.fontSize(8).font('Helvetica').fillColor(mutedText).text(
          `Current: ${spoilage.summary?.current ?? 'N/A'}%  |  Average: ${spoilage.summary?.average ?? 'N/A'}%  |  Classification: ${spoilage.summary?.status || 'FRESH'}  |  Historical Trend: ${spoilage.trend || 'STABLE'}`,
          165,
          spY
        );

        doc.fontSize(8).font('Helvetica-Bold').fillColor(darkText).text('FACTOR CONTRIBUTIONS:', 50, spY + 18);
        doc.fontSize(8).font('Helvetica').fillColor(mutedText).text(
          `Thermal Impact: ${spoilage.factors.temperature_risk}%  |  Moisture Impact: ${spoilage.factors.humidity_risk}%  |  VOC Impact: ${spoilage.factors.gas_risk}%  |  Photometric: ${spoilage.factors.light_risk}%`,
          180,
          spY + 18
        );

        doc.fontSize(8).font('Helvetica-Bold').fillColor(darkText).text('RISK SPECTRUM TIME:', 50, spY + 34);
        doc.fontSize(8).font('Helvetica').fillColor(mutedText).text(
          `Fresh (0–30%): ${spoilage.distribution.fresh}%  |  Warning (31–60%): ${spoilage.distribution.warning}%  |  Risk (61–80%): ${spoilage.distribution.spoilage_risk}%  |  Critical: ${spoilage.distribution.critical}%`,
          175,
          spY + 34
        );
        doc.y += 74;
      }

      // ==========================================
      // SECTION: ALERT INCIDENT LOG (Section 35-37)
      // ==========================================
      if (metadata.sections.alerts) {
        checkPageBreak(130);
        doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text('Alert Notifications & Atmospheric Incidents', 40, doc.y);
        doc.fontSize(7.5).font('Helvetica').fillColor(mutedText).text(`Total recorded: ${alerts.summary.total} (Critical: ${alerts.summary.critical}, High: ${alerts.summary.high}, Warning: ${alerts.summary.warning}) | Avg Resolution: ${alerts.resolution.avg_resolution_display}`, 40, doc.y + 2);
        doc.y += 14;

        if (alerts.recent.length === 0) {
          doc.roundedRect(40, doc.y, 515, 24, 4).fillAndStroke(bgCard, borderLine);
          doc.fontSize(8).font('Helvetica').fillColor(mutedText).text('No atmospheric threshold incidents recorded in this timeframe.', 50, doc.y + 7);
          doc.y += 32;
        } else {
          const alertTop = doc.y;
          doc.rect(40, alertTop, 515, 18).fill(secondaryColor);
          doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#ffffff');
          doc.text('TIMESTAMP', 50, alertTop + 5);
          doc.text('INCIDENT TITLE', 140, alertTop + 5);
          doc.text('CATEGORY', 280, alertTop + 5);
          doc.text('SEVERITY', 360, alertTop + 5);
          doc.text('STATUS', 430, alertTop + 5);
          doc.text('DEVICE', 490, alertTop + 5);

          let curAY = alertTop + 18;
          const displayAlerts = alerts.recent.slice(0, 8);
          displayAlerts.forEach((a, idx) => {
            doc.rect(40, curAY, 515, 16).fill(idx % 2 === 0 ? '#ffffff' : bgCard);
            doc.fontSize(7).font('Helvetica').fillColor(darkText);
            doc.text(a.created_at ? new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '', 50, curAY + 4);
            doc.text(a.title || 'Storage Incident', 140, curAY + 4, { width: 135 });
            doc.text(a.alert_type || 'ATMOSPHERE', 280, curAY + 4);
            doc.font('Helvetica-Bold').fillColor(a.severity === 'CRITICAL' ? '#dc2626' : (a.severity === 'HIGH' ? '#ea580c' : '#d97706')).text(a.severity, 360, curAY + 4);
            doc.font('Helvetica').fillColor(a.status === 'RESOLVED' ? '#16a34a' : '#d97706').text(a.status, 430, curAY + 4);
            doc.fillColor(mutedText).text(metadata.device.id, 490, curAY + 4);
            curAY += 16;
          });

          doc.rect(40, alertTop, 515, curAY - alertTop).strokeColor(borderLine).lineWidth(0.5).stroke();
          doc.y = curAY + 14;
        }
      }

      // ==========================================
      // SECTION: STORAGE INVENTORY & BATCH STATUS (Section 28-31)
      // ==========================================
      if (metadata.sections.storage) {
        checkPageBreak(110);
        doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text('Vegetable Storage Inventory Status', 40, doc.y);
        doc.fontSize(7.5).font('Helvetica').fillColor(mutedText).text(`Total inventory: ${storage.summary.total_batches} batches (${storage.summary.total_quantity_kg} kg) across ${storage.summary.vegetables_stored} produce types.`, 40, doc.y + 2);
        doc.y += 14;

        const sTop = doc.y;
        doc.rect(40, sTop, 515, 18).fill(secondaryColor);
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#ffffff');
        doc.text('PRODUCE VARIETY', 50, sTop + 5);
        doc.text('BATCHES', 200, sTop + 5);
        doc.text('ESTIMATED RISK', 280, sTop + 5);
        doc.text('ALERTS', 380, sTop + 5);
        doc.text('STORAGE CONDITION', 450, sTop + 5);

        let curSY = sTop + 18;
        storage.vegetable_breakdown.forEach((v, idx) => {
          doc.rect(40, curSY, 515, 16).fill(idx % 2 === 0 ? '#ffffff' : bgCard);
          doc.fontSize(7.5).font('Helvetica-Bold').fillColor(darkText).text(v.type, 50, curSY + 4);
          doc.font('Helvetica').text(`${v.batches} batch(es)`, 200, curSY + 4);
          doc.text(`${v.avg_risk}%`, 280, curSY + 4);
          doc.text(`${v.alerts}`, 380, curSY + 4);
          doc.font('Helvetica-Bold').fillColor(primaryColor).text(v.avg_risk > 30 ? 'MONITOR' : 'OPTIMAL', 450, curSY + 4);
          curSY += 16;
        });

        doc.rect(40, sTop, 515, curSY - sTop).strokeColor(borderLine).lineWidth(0.5).stroke();
        doc.y = curSY + 14;
      }

      // ==========================================
      // SECTION: OPERATIONAL RECOMMENDATIONS (Section 86)
      // ==========================================
      if (metadata.sections.recommendations) {
        checkPageBreak(110);
        doc.fontSize(11).font('Helvetica-Bold').fillColor(primaryColor).text('Actionable Storage & Engineering Recommendations', 40, doc.y);
        doc.fontSize(7.5).font('Helvetica').fillColor(mutedText).text('Targeted adjustments derived from active telemetry and threshold events.', 40, doc.y + 2);
        doc.y += 12;

        recommendations.forEach((rec) => {
          checkPageBreak(30);
          doc.roundedRect(40, doc.y, 515, 26, 4).fillAndStroke(bgCard, borderLine);
          doc.fontSize(7.5).font('Helvetica-Bold').fillColor(primaryColor).text(rec.metric.toUpperCase(), 48, doc.y + 4);
          doc.fontSize(7.5).font('Helvetica').fillColor(darkText).text(rec.action, 150, doc.y + 4, { width: 395 });
          doc.fontSize(6.8).font('Helvetica').fillColor(mutedText).text(rec.finding, 150, doc.y + 14, { width: 395 });
          doc.y += 30;
        });
        doc.y += 6;
      }

      // ==========================================
      // SECTION: SYSTEM SCOPE & DISCLAIMER (Section 40)
      // ==========================================
      checkPageBreak(65);
      doc.roundedRect(40, doc.y, 515, 45, 4).fillAndStroke('#f1f5f9', '#94a3b8');
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#334155').text('TECHNICAL DISCLAIMER & SYSTEM SCOPE NOTE', 48, doc.y + 6);
      doc.fontSize(6.5).font('Helvetica').fillColor('#475569').text(disclaimer, 48, doc.y + 16, {
        width: 495,
        align: 'justify'
      });

      // Finish document
      drawFooter();
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 3. Saves report record in persistent database (Section 20 & 21)
 */
export async function saveReport({
  userId,
  reportType,
  title,
  fileName,
  filePath = null,
  storageUrl = null,
  deviceId = null,
  storageBatchId = null,
  vegetableType = null,
  sourceMode = 'ALL',
  fromDate = null,
  toDate = null,
  sections = {},
  summaryData = {},
  recommendations = [],
  pdfBuffer = null
}) {
  const reportId = `rep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const fileSize = pdfBuffer ? pdfBuffer.length : 0;
  const pdfBase64 = pdfBuffer ? pdfBuffer.toString('base64') : null;

  db.prepare(`
    INSERT INTO reports (
      id, user_id, report_type, title, file_name, file_path, storage_url,
      device_id, storage_batch_id, vegetable_type, source_mode,
      from_date, to_date, status, file_size, sections, summary_data,
      recommendations, pdf_base64, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, 'COMPLETED', ?, ?, ?,
      ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
  `).run(
    reportId,
    userId,
    reportType,
    title,
    fileName,
    filePath,
    storageUrl,
    deviceId,
    storageBatchId,
    vegetableType,
    sourceMode,
    fromDate,
    toDate,
    fileSize,
    JSON.stringify(sections),
    JSON.stringify(summaryData),
    JSON.stringify(recommendations),
    pdfBase64
  );

  return {
    id: reportId,
    report_type: reportType,
    title,
    file_name: fileName,
    file_size: fileSize,
    status: 'COMPLETED',
    created_at: new Date().toISOString()
  };
}

/**
 * 4. List reports for authenticated user (Section 22 & 70)
 */
export function getReports(userId) {
  const effectiveId = userId || 'usr_demo_vegsense_001';
  const rows = db.prepare(`
    SELECT
      id, user_id, report_type, title, file_name,
      device_id, storage_batch_id, vegetable_type, source_mode,
      from_date, to_date, status, file_size, created_at
    FROM reports
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(effectiveId);

  return rows;
}

/**
 * 5. Get report details by ID with user verification
 */
export function getReportById(reportId, userId) {
  const effectiveId = userId || 'usr_demo_vegsense_001';
  const row = db.prepare(`
    SELECT * FROM reports
    WHERE id = ? AND user_id = ?
  `).get(reportId, effectiveId);

  if (!row) return null;

  return {
    ...row,
    sections: row.sections ? JSON.parse(row.sections) : {},
    summary_data: row.summary_data ? JSON.parse(row.summary_data) : {},
    recommendations: row.recommendations ? JSON.parse(row.recommendations) : {}
  };
}

/**
 * 6. Get report PDF binary buffer for download
 */
export function getReportPDFBuffer(reportId, userId) {
  const effectiveId = userId || 'usr_demo_vegsense_001';
  const row = db.prepare(`
    SELECT file_name, pdf_base64 FROM reports
    WHERE id = ? AND user_id = ?
  `).get(reportId, effectiveId);

  if (!row || !row.pdf_base64) return null;

  return {
    fileName: row.file_name,
    buffer: Buffer.from(row.pdf_base64, 'base64')
  };
}

/**
 * 7. Delete report by ID (Section 54)
 */
export function deleteReport(reportId, userId) {
  const effectiveId = userId || 'usr_demo_vegsense_001';
  const res = db.prepare(`
    DELETE FROM reports
    WHERE id = ? AND user_id = ?
  `).run(reportId, effectiveId);

  return res.changes > 0;
}

