import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';
import { useToast } from '../context/ToastContext';
import {
  getAnalyticsSummary,
  getSensorHistory,
  getSpoilageHistory,
  getAlertAnalytics,
  getStorageAnalytics,
  getComparisonAnalytics,
  resetDemoHistory
} from '../services/analyticsService';

import { AnalyticsHeader } from '../components/analytics/AnalyticsHeader';
import { AnalyticsFilters } from '../components/analytics/AnalyticsFilters';
import { AnalyticsSummary } from '../components/analytics/AnalyticsSummary';
import { EnvironmentalOverview } from '../components/analytics/EnvironmentalOverview';
import { SensorHistory } from '../components/analytics/SensorHistory';
import { SpoilageRiskChart } from '../components/analytics/SpoilageRiskChart';
import { AlertAnalytics } from '../components/analytics/AlertAnalytics';
import { StorageAnalytics } from '../components/analytics/StorageAnalytics';
import { BatchHistory } from '../components/analytics/BatchHistory';
import { ComparisonPanel } from '../components/analytics/ComparisonPanel';
import { DataQuality } from '../components/analytics/DataQuality';
import { AnalyticsTable } from '../components/analytics/AnalyticsTable';
import { AnalyticsSkeleton } from '../components/analytics/AnalyticsSkeleton';
import { AnalyticsError } from '../components/analytics/AnalyticsError';
import { AnalyticsEmptyState } from '../components/analytics/AnalyticsEmptyState';

export function Analytics() {
  const { user } = useAuth();
  const { isDemoMode, savedDevice, sensorData: currentLiveSensors } = useDevice();
  const { addToast } = useToast();

  // Filters State (Section 8, 34, 37, 79)
  const [filters, setFilters] = useState({
    device_id: '',
    vegetable_type: '',
    batch_id: '',
    range: '24h',
    from: '',
    to: '',
    source_mode: 'ALL'
  });

  // Analytics Data State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());

  const [summaryData, setSummaryData] = useState(null);
  const [sensorHistoryData, setSensorHistoryData] = useState(null);
  const [spoilageHistoryData, setSpoilageHistoryData] = useState(null);
  const [alertAnalyticsData, setAlertAnalyticsData] = useState(null);
  const [storageAnalyticsData, setStorageAnalyticsData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);

  // Available options for filter dropdowns
  const [availableDevices, setAvailableDevices] = useState([]);
  const [availableVegetables, setAvailableVegetables] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);

  // Fetch all analytics datasets
  const loadAnalytics = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      // Clean filter object (remove empty strings)
      const queryParams = {};
      if (filters.device_id) queryParams.device_id = filters.device_id;
      if (filters.vegetable_type) queryParams.vegetable_type = filters.vegetable_type;
      if (filters.batch_id) queryParams.batch_id = filters.batch_id;
      if (filters.range) queryParams.range = filters.range;
      if (filters.from) queryParams.from = filters.from;
      if (filters.to) queryParams.to = filters.to;
      if (filters.source_mode && filters.source_mode !== 'ALL') queryParams.source_mode = filters.source_mode;

      const [
        summaryRes,
        sensorsRes,
        spoilageRes,
        alertsRes,
        storageRes,
        comparisonRes
      ] = await Promise.all([
        getAnalyticsSummary(queryParams).catch(err => { console.error('Summary fetch error:', err); return null; }),
        getSensorHistory(queryParams).catch(err => { console.error('Sensors fetch error:', err); return null; }),
        getSpoilageHistory(queryParams).catch(err => { console.error('Spoilage fetch error:', err); return null; }),
        getAlertAnalytics(queryParams).catch(err => { console.error('Alerts fetch error:', err); return null; }),
        getStorageAnalytics(queryParams).catch(err => { console.error('Storage fetch error:', err); return null; }),
        getComparisonAnalytics(queryParams).catch(err => { console.error('Comparison fetch error:', err); return null; })
      ]);

      setSummaryData(summaryRes);
      setSensorHistoryData(sensorsRes);
      setSpoilageHistoryData(spoilageRes);
      setAlertAnalyticsData(alertsRes);
      setStorageAnalyticsData(storageRes);
      setComparisonData(comparisonRes);

      // Extract filter options from storage response
      if (storageRes?.batches) {
        setAvailableBatches(storageRes.batches);
        const vegSet = new Set(storageRes.batches.map(b => b.vegetable_name || b.vegetable_type).filter(Boolean));
        setAvailableVegetables(Array.from(vegSet));
      }
      if (storageRes?.devices) {
        setAvailableDevices(storageRes.devices.map(d => d.device_id).filter(Boolean));
      }

      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error('Failed to load analytics suite:', err);
      setError(err.message || 'Unable to load analytics data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  // Initial load and filter updates
  useEffect(() => {
    loadAnalytics(false);
  }, [loadAnalytics]);

  // Live auto-refresh interval: 20 seconds (Section 54)
  useEffect(() => {
    const timer = setInterval(() => {
      loadAnalytics(true);
    }, 20000);

    return () => clearInterval(timer);
  }, [loadAnalytics]);

  // Reset demo history handler (Section 53)
  const handleResetDemoHistory = async () => {
    if (!window.confirm('Reset Demo Mode history? Real device records and storage batches will NOT be affected.')) {
      return;
    }
    try {
      await resetDemoHistory();
      addToast?.('Demo history has been reset and baseline re-seeded.', 'info');
      await loadAnalytics(false);
    } catch (err) {
      console.error('Failed to reset demo history:', err);
      addToast?.(err.message || 'Failed to reset demo history.', 'error');
    }
  };

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
      source_mode: 'ALL'
    });
  };

  const handleApplyFilters = () => {
    loadAnalytics(false);
  };

  const activeDeviceName = savedDevice?.deviceId || (isDemoMode ? 'ESP32-DEMO-001' : 'ESP32-001');

  // Combined points for detailed table (Section 74)
  const tableTelemetryPoints = sensorHistoryData?.temperature_points?.map((pt, idx) => {
    const humPt = sensorHistoryData?.humidity_points?.[idx];
    const gasPt = sensorHistoryData?.gas_points?.[idx];
    const lightPt = sensorHistoryData?.light_points?.[idx];
    const spoilPt = spoilageHistoryData?.points?.[idx];

    return {
      timestamp: pt.timestamp,
      temperature: pt.value,
      humidity: humPt?.value ?? null,
      gas_level: gasPt?.value ?? null,
      light_level: lightPt?.value ?? null,
      light_classification: lightPt?.classification ?? 'NORMAL LIGHT',
      spoilage_risk: spoilPt?.risk ?? summaryData?.average_spoilage_risk ?? 18,
      classification: spoilPt?.classification ?? 'FRESH',
      device_id: pt.device_id || activeDeviceName,
      storage_batch_id: pt.storage_batch_id || filters.batch_id || null
    };
  }) || [];

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* 1. Header (Section 7) */}
      <AnalyticsHeader
        isDemoMode={isDemoMode}
        activeDevice={activeDeviceName}
        lastUpdated={lastUpdated}
        onResetDemoHistory={handleResetDemoHistory}
      />

      {/* 2. Global Filter Bar (Section 8) */}
      <AnalyticsFilters
        filters={filters}
        availableDevices={availableDevices}
        availableVegetables={availableVegetables}
        availableBatches={availableBatches}
        onFilterChange={handleFilterChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* Loading Skeleton */}
      {loading ? (
        <AnalyticsSkeleton />
      ) : error ? (
        <AnalyticsError
          message={error}
          onRetry={() => loadAnalytics(false)}
          onResetFilters={handleResetFilters}
        />
      ) : summaryData?.data_points === 0 && tableTelemetryPoints.length === 0 ? (
        <AnalyticsEmptyState
          onResetFilters={handleResetFilters}
          onChangeRange={(newRange) => handleFilterChange('range', newRange)}
        />
      ) : (
        <>
          {/* 3. Summary Cards (Section 9) */}
          <AnalyticsSummary
            summary={summaryData}
            isRefreshing={refreshing}
          />

          {/* 4. Environmental Condition Summary & Sensor Health (Section 17 & 19) */}
          <EnvironmentalOverview
            summary={summaryData}
            latestReading={currentLiveSensors}
          />

          {/* 5. Sensor History (Section 10–14) */}
          <SensorHistory
            sensorData={sensorHistoryData}
            timeRange={filters.range}
          />

          {/* 6. Spoilage Risk Trend (Section 15, 16, 32, 58, 59) */}
          <SpoilageRiskChart
            spoilageData={spoilageHistoryData}
            timeRange={filters.range}
          />

          {/* 7. Alert Analytics (Section 22–27, 60) */}
          <AlertAnalytics
            alertData={alertAnalyticsData}
            timeRange={filters.range}
          />

          {/* 8. Storage Analytics & Vegetable Varieties (Section 28, 29, 50) */}
          <StorageAnalytics
            storageData={storageAnalyticsData}
            deviceData={{ devices: storageAnalyticsData?.devices || [] }}
          />

          {/* 9. Batch History & Lifecycle Timeline (Section 30, 31) */}
          <BatchHistory
            batches={availableBatches}
            selectedBatchId={filters.batch_id}
            onSelectBatch={(id) => handleFilterChange('batch_id', id)}
          />

          {/* 10. Period Comparison Mode (Section 33) */}
          <ComparisonPanel
            comparisonData={comparisonData}
          />

          {/* 11. Data Quality Meter (Section 20, 21) */}
          <DataQuality
            summary={summaryData}
          />

          {/* 12. Detailed Telemetry Log Table (Section 74, 75) */}
          <AnalyticsTable
            points={tableTelemetryPoints}
          />
        </>
      )}
    </div>
  );
}

export default Analytics;
