import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';
import { useToast } from '../context/ToastContext';
import {
  getReports,
  getReport,
  previewReport,
  generateReport,
  downloadReport,
  deleteReport
} from '../services/reportService';
import { getStorageAnalytics } from '../services/analyticsService';

import { ReportsHeader } from '../components/reports/ReportsHeader';
import { ReportTypeSelector } from '../components/reports/ReportTypeSelector';
import { ReportFilters } from '../components/reports/ReportFilters';
import { ReportPreview } from '../components/reports/ReportPreview';
import { ReportHistory } from '../components/reports/ReportHistory';
import { ReportSkeleton } from '../components/reports/ReportSkeleton';
import { ReportError } from '../components/reports/ReportError';

export function Reports() {
  const { user } = useAuth();
  const { isDemoMode, savedDevice } = useDevice();
  const { addToast } = useToast();

  const [selectedType, setSelectedType] = useState('COMPLETE_STORAGE');
  const [filters, setFilters] = useState({
    device_id: '',
    vegetable_type: '',
    batch_id: '',
    range: '24h',
    from: '',
    to: '',
    source_mode: 'ALL',
    sections: {
      storage: true,
      sensors: true,
      spoilage: true,
      alerts: true,
      analytics: true,
      batch: true,
      recommendations: true
    }
  });

  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Preview & Generation states
  const [previewData, setPreviewData] = useState(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(null);

  // Available metadata for filters
  const [availableDevices, setAvailableDevices] = useState([]);
  const [availableVegetables, setAvailableVegetables] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);

  // Load reports list and storage batch metadata
  const loadReportsData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const [reportsRes, storageRes] = await Promise.all([
        getReports().catch(err => {
          console.error('Fetch reports error:', err);
          return [];
        }),
        getStorageAnalytics().catch(err => {
          console.error('Fetch storage metadata error:', err);
          return null;
        })
      ]);

      setReportsList(reportsRes || []);

      if (storageRes?.batches) {
        setAvailableBatches(storageRes.batches);
        const vegSet = new Set(storageRes.batches.map(b => b.vegetable_name || b.vegetable_type).filter(Boolean));
        setAvailableVegetables(Array.from(vegSet));
      }
      if (storageRes?.devices) {
        setAvailableDevices(storageRes.devices.map(d => d.device_id).filter(Boolean));
      }
    } catch (err) {
      console.error('Failed to load reports suite:', err);
      setError(err.message || 'Unable to load report history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReportsData(false);
  }, [loadReportsData]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      device_id: '',
      vegetable_type: '',
      batch_id: '',
      range: '24h',
      from: '',
      to: '',
      source_mode: 'ALL',
      sections: {
        storage: true,
        sensors: true,
        spoilage: true,
        alerts: true,
        analytics: true,
        batch: true,
        recommendations: true
      }
    });
    setSelectedType('COMPLETE_STORAGE');
  };

  // Preview Action
  const handlePreview = async () => {
    try {
      setIsPreviewing(true);
      setError(null);
      const payload = {
        ...filters,
        report_type: selectedType
      };
      const preview = await previewReport(payload);
      setPreviewData(preview);
    } catch (err) {
      console.error('Report preview error:', err);
      addToast?.(err.message || 'Failed to generate report preview.', 'error');
    } finally {
      setIsPreviewing(false);
    }
  };

  // Generate Action with Anti-Duplication Protection (Section 23 & 24)
  const handleGenerate = async () => {
    if (isGenerating) return; // Prevent double trigger
    try {
      setIsGenerating(true);
      setError(null);
      const payload = {
        ...filters,
        report_type: selectedType
      };

      const newReport = await generateReport(payload);
      addToast?.(`Report "${newReport.title}" generated successfully!`, 'success');

      // Refresh history list silently
      await loadReportsData(true);

      // Automatically download the generated PDF
      if (newReport.id) {
        await downloadReport(newReport.id, newReport.file_name);
      }

      // Close preview if open
      setPreviewData(null);
    } catch (err) {
      console.error('Report generation error:', err);
      addToast?.(err.message || 'Failed to generate report PDF.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download Existing Report Action
  const handleDownload = async (report) => {
    if (isDownloading) return;
    try {
      setIsDownloading(report.id);
      await downloadReport(report.id, report.file_name);
      addToast?.(`Downloaded "${report.file_name}"`, 'info');
    } catch (err) {
      console.error('Download report error:', err);
      addToast?.(err.message || 'Failed to download report PDF.', 'error');
    } finally {
      setIsDownloading(null);
    }
  };

  // Delete Action with Confirmation (Section 54 & 96)
  const handleDelete = async (report) => {
    const confirmed = window.confirm(
      `Delete report "${report.title}"? \n\nNote: Underlying sensor telemetry, spoilage history, and alert records will NOT be deleted.`
    );
    if (!confirmed) return;

    try {
      await deleteReport(report.id);
      addToast?.('Report deleted from history.', 'info');
      setReportsList(prev => prev.filter(r => r.id !== report.id));
    } catch (err) {
      console.error('Delete report error:', err);
      addToast?.(err.message || 'Failed to delete report.', 'error');
    }
  };

  const activeDeviceName = savedDevice?.deviceId || (isDemoMode ? 'ESP32-DEMO-001' : 'ESP32-001');

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* 1. Header (Section 13) */}
      <ReportsHeader
        isDemoMode={isDemoMode}
        activeDevice={activeDeviceName}
        onOpenCreate={() => {
          const configElem = document.getElementById('report-creator-section');
          if (configElem) configElem.scrollIntoView({ behavior: 'smooth' });
        }}
        onRefresh={() => loadReportsData(false)}
        isRefreshing={refreshing}
      />

      {/* Main Creation Panel */}
      <div id="report-creator-section">
        {/* 2. Report Type Selector (Section 2 & 50) */}
        <ReportTypeSelector
          selectedType={selectedType}
          onSelectType={setSelectedType}
        />

        {/* 3. Report Filters & Scope (Section 8, 14, 44, 45) */}
        <ReportFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          availableDevices={availableDevices}
          availableVegetables={availableVegetables}
          availableBatches={availableBatches}
          onPreview={handlePreview}
          onGenerate={handleGenerate}
          onReset={handleResetFilters}
          isGenerating={isGenerating}
          isPreviewing={isPreviewing}
        />
      </div>

      {/* Error Boundary View */}
      {error && (
        <ReportError
          message={error}
          onRetry={() => loadReportsData(false)}
        />
      )}

      {/* 4. Report History (Section 22, 51) */}
      {loading ? (
        <ReportSkeleton />
      ) : (
        <ReportHistory
          reports={reportsList}
          onPreviewReport={(r) => {
            if (r.summary_data && Object.keys(r.summary_data).length > 0) {
              setPreviewData(r.summary_data);
            } else {
              // Fetch details
              getReport(r.id)
                .then(detail => {
                  if (detail?.summary_data) setPreviewData(detail.summary_data);
                })
                .catch(err => {
                  addToast?.(err.message || 'Could not load report preview.', 'error');
                });
            }
          }}
          onDownloadReport={handleDownload}
          onDeleteReport={handleDelete}
          isDownloading={isDownloading}
        />
      )}

      {/* 5. Document Preview Modal (Section 15, 46, 80) */}
      {previewData && (
        <ReportPreview
          previewData={previewData}
          onGeneratePdf={handleGenerate}
          onClose={() => setPreviewData(null)}
          isGenerating={isGenerating}
        />
      )}
    </div>
  );
}

export default Reports;
