import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from '../router/Router';
import { fetchStorageItems } from '../services/storageService';
import { getSpoilageStatus, getSpoilageHistory } from '../services/spoilageService';
import {
  calculateSpoilageRisk,
  getSpoilageClassification,
  getSpoilageRecommendations,
  getDataQuality
} from '../utils/spoilageRisk';
import { getVegetableProfile } from '../utils/spoilageThresholds';

// Modular Spoilage Subcomponents
import { SpoilageHeader } from '../components/spoilage/SpoilageHeader';
import { SpoilageRiskCard } from '../components/spoilage/SpoilageRiskCard';
import { RiskBreakdown } from '../components/spoilage/RiskBreakdown';
import { EnvironmentalConditions } from '../components/spoilage/EnvironmentalConditions';
import { StorageContext } from '../components/spoilage/StorageContext';
import { SpoilageRecommendations } from '../components/spoilage/SpoilageRecommendations';
import { SpoilageTrend } from '../components/spoilage/SpoilageTrend';
import { SpoilageDataQuality } from '../components/spoilage/SpoilageDataQuality';
import { SpoilageOffline } from '../components/spoilage/SpoilageOffline';
import { SpoilageSkeleton } from '../components/spoilage/SpoilageSkeleton';
import { SpoilageEmptyState } from '../components/spoilage/SpoilageEmptyState';

export function Spoilage() {
  const { currentUser, token } = useAuth();
  const {
    device,
    sensorData,
    isConnected,
    isOffline: deviceOffline,
    isDemo,
    reconnectDevice
  } = useDevice();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const userId = currentUser?.id || currentUser?.email || 'default_user';

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Storage batches & selection
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  // Simulation condition for Demo Mode testing (null = default baseline 18% FRESH)
  const [simulatedCondition, setSimulatedCondition] = useState(null);

  // Historical data for trend chart
  const [historyRange, setHistoryRange] = useState('24h');
  const [historyData, setHistoryData] = useState([]);

  // Load storage batches on mount
  useEffect(() => {
    let isMounted = true;

    async function loadBatches() {
      try {
        setLoading(true);
        setError(null);

        const fetched = await fetchStorageItems(userId, token);
        if (!isMounted) return;

        if (fetched && fetched.length > 0) {
          setBatches(fetched);
          setSelectedBatchId(fetched[0].id);
        } else {
          // If no stored batches in DB, provide default reference batch
          const defaultTomato = {
            id: 'batch_tomato_001',
            name: 'Tomato',
            vegetable_name: 'Tomato',
            variety: 'Tomato Batch A',
            quantity: 50,
            unit: 'kg',
            storage_location: 'Cold Room A',
            stored_at: '2026-09-29T00:00:00.000Z',
            expected_expiry_date: '2026-10-06T00:00:00.000Z',
            shelf_life_days: 14,
            days_remaining: 7
          };
          setBatches([defaultTomato]);
          setSelectedBatchId(defaultTomato.id);
        }
      } catch (err) {
        console.warn('[SpoilagePage] Error loading batches:', err);
        if (isMounted) {
          setError('Unable to load storage batch data. Displaying fallback baseline.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadBatches();
    return () => {
      isMounted = false;
    };
  }, [userId, token]);

  // Load history data when device or range changes
  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      try {
        const hist = await getSpoilageHistory(historyRange, device?.name || 'ESP32-DEMO-001', isDemo);
        if (isMounted && hist) {
          setHistoryData(hist);
        }
      } catch (err) {
        console.warn('[SpoilagePage] Error loading spoilage history:', err);
      }
    }
    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [historyRange, device, isDemo]);

  // Active selected batch object
  const activeBatch = useMemo(() => {
    if (!batches || batches.length === 0) return null;
    return batches.find((b) => b.id === selectedBatchId) || batches[0];
  }, [batches, selectedBatchId]);

  // Produce profile based on active batch vegetable
  const vegetableProfile = useMemo(() => {
    const vegName = activeBatch?.name || activeBatch?.vegetable_name || 'Tomato';
    return getVegetableProfile(vegName);
  }, [activeBatch]);

  // Format batch details for StorageContext display (Section 22)
  const batchDetails = useMemo(() => {
    if (!activeBatch) {
      return {
        vegetable: 'Tomato',
        batchName: 'Tomato Batch A',
        quantity: '50 kg',
        location: 'Cold Room A',
        storedDate: '29 Sep 2026',
        expiryDate: '06 Oct 2026',
        daysRemaining: '7 days'
      };
    }

    const veg = activeBatch.name || activeBatch.vegetable_name || 'Tomato';
    const batchName = activeBatch.variety
      ? `${veg} ${activeBatch.variety}`
      : activeBatch.batch_number
      ? `${veg} Batch ${activeBatch.batch_number}`
      : `${veg} Batch A`;
    const qty = `${activeBatch.quantity || 50} ${activeBatch.unit || 'kg'}`;
    const loc = activeBatch.storage_location || activeBatch.location || 'Cold Room A';

    const storedStr = activeBatch.stored_at
      ? new Date(activeBatch.stored_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '29 Sep 2026';
    const expiryStr = activeBatch.expected_expiry_date
      ? new Date(activeBatch.expected_expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '06 Oct 2026';

    const daysRemaining = activeBatch.days_remaining != null
      ? `${activeBatch.days_remaining} days`
      : '7 days';

    return {
      vegetable: veg,
      batchName,
      quantity: qty,
      location: loc,
      storedDate: storedStr,
      expiryDate: expiryStr,
      daysRemaining
    };
  }, [activeBatch]);

  // Prepare sensor inputs, applying demo condition overrides if testing is active (Section 28)
  const effectiveSensorData = useMemo(() => {
    // Base live telemetry from DeviceContext
    const live = {
      temperature: sensorData?.temperature ?? 28.5,
      humidity: sensorData?.humidity ?? 72,
      gasLevel: sensorData?.gasLevel ?? sensorData?.gasVOC ?? 420,
      lightLevel: sensorData?.lightLevel ?? 420,
      lightClassification: sensorData?.lightClassification ?? 'NORMAL LIGHT',
      lightRisk: sensorData?.lightRisk ?? 10,
      status: sensorData?.status ?? 'FRESH',
      storageCondition: sensorData?.storageCondition ?? 'OPTIMAL',
      lastUpdated: sensorData?.lastUpdated || new Date().toISOString()
    };

    if (!isDemo || !simulatedCondition) {
      return live;
    }

    // Demo Simulation Presets (Section 28)
    switch (simulatedCondition) {
      case 'warning':
        return {
          ...live,
          temperature: 32.5,
          humidity: 82,
          gasLevel: 510,
          lightLevel: 620,
          lightClassification: 'HIGH LIGHT',
          lightRisk: 30,
          status: 'WARNING',
          storageCondition: 'WARNING',
          lastUpdated: new Date().toISOString()
        };
      case 'high_risk':
      case 'high-risk':
      case 'spoilage_risk':
      case 'spoilage-risk':
        return {
          ...live,
          temperature: 36.0,
          humidity: 89,
          gasLevel: 660,
          lightLevel: 780,
          lightClassification: 'HIGH LIGHT',
          lightRisk: 65,
          status: 'SPOILAGE RISK',
          storageCondition: 'DEVIATING',
          lastUpdated: new Date().toISOString()
        };
      case 'critical':
        return {
          ...live,
          temperature: 39.5,
          humidity: 95,
          gasLevel: 820,
          lightLevel: 950,
          lightClassification: 'EXTREME LIGHT',
          lightRisk: 85,
          status: 'CRITICAL',
          storageCondition: 'CRITICAL',
          lastUpdated: new Date().toISOString()
        };
      default:
        return live;
    }
  }, [sensorData, isDemo, simulatedCondition]);

  // Execute Centralized Authoritative Spoilage Risk Calculation (Sections 5 & 12)
  const calculationResult = useMemo(() => {
    return calculateSpoilageRisk({
      temperature: effectiveSensorData.temperature,
      humidity: effectiveSensorData.humidity,
      gasLevel: effectiveSensorData.gasLevel,
      lightLevel: effectiveSensorData.lightLevel,
      lightRisk: effectiveSensorData.lightRisk,
      storageBatch: activeBatch || {
        name: 'Tomato',
        days_remaining: 7,
        shelf_life_days: 14
      },
      vegetableType: activeBatch?.name || 'tomato'
    });
  }, [effectiveSensorData, activeBatch]);

  // Recommendations based on actual deviations (Section 25)
  const recommendations = useMemo(() => {
    return getSpoilageRecommendations({
      breakdown: calculationResult.breakdown,
      profile: calculationResult.profile,
      sensorData: effectiveSensorData,
      storageBatch: activeBatch
    });
  }, [calculationResult, effectiveSensorData, activeBatch]);

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (reconnectDevice && deviceOffline) {
        await reconnectDevice();
      }
      const fetched = await fetchStorageItems(userId, token);
      if (fetched && fetched.length > 0) {
        setBatches(fetched);
      }
      addToast('Spoilage analysis refreshed.', 'success');
    } catch (err) {
      addToast('Refresh failed: ' + err.message, 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [reconnectDevice, deviceOffline, userId, token, addToast]);

  // Handle batch selection
  const handleSelectBatch = useCallback((batchId) => {
    setSelectedBatchId(batchId);
  }, []);

  // Handle Demo Condition Switcher
  const handleSimulateCondition = useCallback((cond) => {
    setSimulatedCondition(cond);
    if (cond) {
      addToast(`Simulating ${cond.toUpperCase()} environment`, 'info');
    } else {
      addToast('Restored default demo baseline (18% FRESH)', 'success');
    }
  }, [addToast]);

  // Render Skeleton while initial loading
  if (loading) {
    return <SpoilageSkeleton />;
  }

  // Render Error state if critical failure
  if (error && batches.length === 0) {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div className="vegsense-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-red)', marginBottom: '0.5rem' }}>
            Unable to load spoilage analysis.
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            className="btn btn-primary"
            style={{ padding: '0.6rem 1.5rem', fontWeight: 700 }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render Empty State if no batches exist (Section 50)
  if (!batches || batches.length === 0) {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem' }}>
        <SpoilageHeader
          device={device}
          selectedBatch={null}
          isDemo={isDemo}
          onSimulateCondition={handleSimulateCondition}
          activeCondition={simulatedCondition}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
        <SpoilageEmptyState />
      </div>
    );
  }

  return (
    <div className="spoilage-page-container" style={{ maxWidth: '1120px', margin: '0 auto' }}>
      {/* 1. Spoilage Page Header with Selected Batch & Device Tags (Section 17) */}
      <SpoilageHeader
        device={device}
        selectedBatch={activeBatch}
        isDemo={isDemo}
        onSimulateCondition={handleSimulateCondition}
        activeCondition={simulatedCondition}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* 2. Device Offline Banner (Section 46) */}
      {deviceOffline && (
        <SpoilageOffline
          lastKnownRisk={calculationResult.spoilageRisk}
          lastUpdated={effectiveSensorData.lastUpdated}
          onReconnect={reconnectDevice}
        />
      )}

      {/* 3. Main Spoilage Responsive Content Grid (Sections 56 & 57) */}
      <div className="spoilage-grid-layout">
        {/* Left Column: Primary Risk Card, Multi-Factor Breakdown, Environmental Telemetry */}
        <div className="spoilage-col-left">
          {/* Main Risk Card & Visual Linear Gauge (Sections 18 & 19, Mobile Order 1) */}
          <div className="spoilage-item-risk">
            <SpoilageRiskCard
              spoilageRisk={calculationResult.spoilageRisk}
              classification={calculationResult.classification.label}
              severity={calculationResult.classification.severity}
              dataQuality={calculationResult.dataQuality}
              lastUpdated={effectiveSensorData.lastUpdated}
              description={
                calculationResult.classification.label === 'FRESH'
                  ? 'Environmental conditions are currently within the configured monitoring range.'
                  : calculationResult.classification.label === 'WARNING'
                  ? 'One or more atmospheric parameters deviate from optimal preservation thresholds.'
                  : calculationResult.classification.label === 'SPOILAGE RISK'
                  ? 'Elevated spoilage risk detected. Produce requires environmental ventilation or temperature adjustment.'
                  : 'Critical atmospheric condition. High probability of accelerated crop degradation.'
              }
            />
          </div>

          {/* Environmental Conditions Live Panel (Section 21, Mobile Order 3) */}
          <div className="spoilage-item-env">
            <EnvironmentalConditions
              sensorData={effectiveSensorData}
              breakdown={calculationResult.breakdown}
            />
          </div>

          {/* Multi-Factor Risk Breakdown (Section 20, Mobile Order 4) */}
          <div className="spoilage-item-breakdown">
            <RiskBreakdown breakdown={calculationResult.breakdown} />
          </div>
        </div>

        {/* Right Column: Storage Batch Context, Prescriptive Recommendations, Risk Trend */}
        <div className="spoilage-col-right">
          {/* Storage Batch Details & Batch Selector (Sections 22 & 23, Mobile Order 2) */}
          <div className="spoilage-item-batch">
            <StorageContext
              batches={batches}
              selectedBatchId={selectedBatchId}
              onSelectBatch={handleSelectBatch}
              batchDetails={batchDetails}
            />
          </div>

          {/* Storage Recommendations (Section 25, Mobile Order 5) */}
          <div className="spoilage-item-recs">
            <SpoilageRecommendations
              recommendations={recommendations}
              classification={calculationResult.classification.label}
            />
          </div>

          {/* Spoilage Risk Historical Trend (Sections 36 & 37, Mobile Order 6) */}
          <div className="spoilage-item-trend">
            <SpoilageTrend
              history={historyData}
              isDemo={isDemo}
              currentRange={historyRange}
              onRangeChange={setHistoryRange}
            />
          </div>

          {/* Telemetry Input Integrity & Data Quality (Section 16, Mobile Order 7) */}
          <div className="spoilage-item-quality">
            <SpoilageDataQuality
              dataQuality={calculationResult.dataQuality}
              sensors={{
                temp: effectiveSensorData.temperature,
                hum: effectiveSensorData.humidity,
                gas: effectiveSensorData.gasLevel,
                light: effectiveSensorData.lightLevel
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Spoilage;
