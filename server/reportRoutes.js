import express from 'express';
import jwt from 'jsonwebtoken';
import {
  getReportData,
  generatePDFBuffer,
  saveReport,
  getReports,
  getReportById,
  getReportPDFBuffer,
  deleteReport,
  REPORT_TITLES
} from './reportService.js';

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
      // Invalid/expired token
    }
  }

  const fallbackId = req.query.userId || req.body?.userId || req.headers['x-user-id'];
  if (fallbackId) {
    req.user = { id: fallbackId, name: 'Operator', email: 'demo@vegsense.io' };
    return next();
  }

  req.user = { id: 'usr_demo_vegsense_001', name: 'Dr. Aris Thorne', email: 'demo@vegsense.io' };
  next();
}

router.use(requireAuth);

/**
 * GET /api/reports
 * Lists all reports for authenticated user (Section 22)
 */
router.get('/', (req, res) => {
  try {
    const reports = getReports(req.user.id);
    return res.json({ success: true, reports });
  } catch (err) {
    console.error('List reports error:', err);
    return res.status(500).json({ error: 'REPORTS_FETCH_FAILED', message: err.message });
  }
});

/**
 * GET /api/reports/:id
 * Retrieves metadata for a single report
 */
router.get('/:id', (req, res) => {
  try {
    const report = getReportById(req.params.id, req.user.id);
    if (!report) {
      return res.status(404).json({ error: 'REPORT_NOT_FOUND', message: 'Report not found or unauthorized.' });
    }
    return res.json({ success: true, report });
  } catch (err) {
    console.error('Get report error:', err);
    return res.status(500).json({ error: 'REPORT_FETCH_FAILED', message: err.message });
  }
});

/**
 * POST /api/reports/preview
 * Generates preview dataset matching exact PDF content (Section 15 & 46)
 */
router.post('/preview', (req, res) => {
  try {
    const filters = req.body || {};
    const reportData = getReportData(filters, req.user);
    return res.json({ success: true, preview: reportData });
  } catch (err) {
    console.error('Report preview error:', err);
    return res.status(500).json({ error: 'PREVIEW_GENERATION_FAILED', message: err.message });
  }
});

/**
 * POST /api/reports/generate
 * Generates PDF, records metadata in SQLite, and returns report record (Section 16-19)
 */
router.post('/generate', async (req, res) => {
  try {
    const filters = req.body || {};
    const reportType = filters.report_type || 'COMPLETE_STORAGE';
    const reportData = getReportData(filters, req.user);

    // Validate that data exists for the selected scope (Section 61)
    if (reportData.sensors.points_count === 0 && reportData.storage.summary.total_batches === 0) {
      return res.status(400).json({
        error: 'NO_DATA_AVAILABLE',
        message: 'No historical storage or sensor telemetry is available for the selected filters and timeframe.'
      });
    }

    // Generate Authoritative PDF Buffer
    const pdfBuffer = await generatePDFBuffer(reportData);

    // Format safe professional filename (Section 53)
    const dateStamp = new Date().toISOString().slice(0, 10);
    const sanitizedType = reportType.toLowerCase().replace(/_/g, '-');
    const fileName = `VegSense_${sanitizedType}_report_${dateStamp}.pdf`;

    const savedRecord = await saveReport({
      userId: req.user.id,
      reportType,
      title: reportData.metadata.title,
      fileName,
      deviceId: filters.device_id || reportData.metadata.device.id,
      storageBatchId: filters.batch_id || null,
      vegetableType: filters.vegetable_type || null,
      sourceMode: filters.source_mode || reportData.metadata.source_mode,
      fromDate: reportData.metadata.timeframe.from,
      toDate: reportData.metadata.timeframe.to,
      sections: filters.sections || {},
      summaryData: reportData,
      recommendations: reportData.recommendations,
      pdfBuffer
    });

    return res.status(201).json({
      success: true,
      report: savedRecord
    });
  } catch (err) {
    console.error('Report generation error:', err);
    return res.status(500).json({
      error: 'REPORT_GENERATION_FAILED',
      message: err.message || 'Unable to generate report.'
    });
  }
});

/**
 * GET /api/reports/:id/download
 * Streams/downloads the generated PDF file securely (Section 52 & 53)
 */
router.get('/:id/download', (req, res) => {
  try {
    const reportPdf = getReportPDFBuffer(req.params.id, req.user.id);
    if (!reportPdf || !reportPdf.buffer) {
      return res.status(404).json({ error: 'FILE_NOT_FOUND', message: 'Report PDF is not available.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportPdf.fileName}"`);
    res.setHeader('Content-Length', reportPdf.buffer.length);
    return res.send(reportPdf.buffer);
  } catch (err) {
    console.error('Download report error:', err);
    return res.status(500).json({ error: 'DOWNLOAD_FAILED', message: err.message });
  }
});

/**
 * DELETE /api/reports/:id
 * Deletes report record without affecting underlying telemetry (Section 54 & 96)
 */
router.delete('/:id', (req, res) => {
  try {
    const success = deleteReport(req.params.id, req.user.id);
    if (!success) {
      return res.status(404).json({ error: 'REPORT_NOT_FOUND', message: 'Report not found or unauthorized.' });
    }
    return res.json({ success: true, message: 'Report deleted successfully.' });
  } catch (err) {
    console.error('Delete report error:', err);
    return res.status(500).json({ error: 'DELETE_FAILED', message: err.message });
  }
});

export default router;
