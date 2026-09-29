import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';
import { useNavigate } from '../router/Router';
import { getActiveStorage, fetchActiveStorage } from '../services/storageService';

// Modular Dashboard Components
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { DeviceStatusCard } from '../components/dashboard/DeviceStatusCard';
import { TemperatureCard } from '../components/dashboard/TemperatureCard';
import { HumidityCard } from '../components/dashboard/HumidityCard';
import { GasLevelCard } from '../components/dashboard/GasLevelCard';
import { LightLevelCard } from '../components/dashboard/LightLevelCard';
import { SpoilageRiskCard } from '../components/dashboard/SpoilageRiskCard';
import { StorageStatusCard } from '../components/dashboard/StorageStatusCard';
import { StorageHealthCard } from '../components/dashboard/StorageHealthCard';
import { EnvironmentalConditionsCard } from '../components/dashboard/EnvironmentalConditionsCard';
import { SensorChart } from '../components/dashboard/SensorChart';
import { RecentAlerts } from '../components/dashboard/RecentAlerts';
import { QuickActions } from '../components/dashboard/QuickActions';
import { OfflineState } from '../components/dashboard/OfflineState';
import { LoadingState } from '../components/dashboard/LoadingState';
import { VegetableStorageSummary } from '../components/dashboard/VegetableStorageSummary';

export function DashboardPage() {
  const { currentUser, isAuthenticated } = useAuth();
  const {
    isConnected,
    isCheckingReachability,
    connectionLost,
    hasSavedDevice,
    savedDevice,
    device,
    sensorData,
    lastKnownData,
    previousData,
    history,
    alerts,
    unreadAlertsCount,
    reconnectDevice,
    loadingStage,
    thresholds
  } = useDevice();

  const navigate = useNavigate();
  const [activeStorage, setActiveStorage] = useState(null);

  // Section 2: Access Rules Enforcement
  useEffect(() => {
    // 1. User must be authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // 2. User must have a verified ESP32 device
    // If authenticated but no verified ESP32 -> redirect to /connect-device
    if (!hasSavedDevice && !savedDevice?.ipAddress) {
      navigate('/connect-device');
      return;
    }

    // 3. Load active vegetable storage selection from database
    const userId = currentUser?.id || currentUser?.email || 'default';
    fetchActiveStorage(userId)
      .then((item) => {
        if (item) setActiveStorage(item);
      })
      .catch(() => {
        const fallback = getActiveStorage(userId);
        if (fallback) setActiveStorage(fallback);
      });
  }, [isAuthenticated, hasSavedDevice, savedDevice, currentUser, navigate]);

  const displayIp = device?.ipAddress || device?.ip || savedDevice?.ipAddress || '192.168.1.105';
  const isOffline = !isConnected || connectionLost;

  // Staged loading state during initial reachability test if no data is available yet
  if (isCheckingReachability && !sensorData?.temperature && !lastKnownData) {
    return (
      <LoadingState
        stage={loadingStage || 'Connecting to ESP32...'}
        displayIp={displayIp}
      />
    );
  }

  return (
    <div className="dashboard-page-container">
      {/* 1. Header (Desktop & Mobile Unified) */}
      <DashboardHeader
        device={device}
        isConnected={isConnected}
        isOffline={isOffline}
        unreadAlertsCount={unreadAlertsCount}
      />

      {/* 2. Device Offline Banner (Section 16 & 17) */}
      {isOffline && (
        <OfflineState
          device={device}
          lastKnownData={lastKnownData || sensorData}
          lastUpdated={sensorData?.lastUpdated}
          onReconnect={reconnectDevice}
        />
      )}

      {/* 3. Primary Live Sensor Metric Cards (Section 10) */}
      <section className="dashboard-sensor-metrics-grid" aria-label="Real-time Sensor Cards">
        <TemperatureCard
          temperature={sensorData?.temperature}
          previousTemperature={previousData?.temperature}
          lastUpdated={sensorData?.lastUpdated}
          isOffline={isOffline}
        />

        <HumidityCard
          humidity={sensorData?.humidity}
          lastUpdated={sensorData?.lastUpdated}
          isOffline={isOffline}
        />

        <GasLevelCard
          gasLevel={sensorData?.gasLevel ?? sensorData?.gasVOC}
          lastUpdated={sensorData?.lastUpdated}
          isOffline={isOffline}
        />

        <LightLevelCard
          lightLevel={sensorData?.lightLevel}
          lightClassification={sensorData?.lightClassification}
          lightRisk={sensorData?.lightRisk}
          lastUpdated={sensorData?.lastUpdated}
          isOffline={isOffline}
        />

        <SpoilageRiskCard
          spoilageRisk={sensorData?.spoilageRisk}
          lastUpdated={sensorData?.lastUpdated}
          isOffline={isOffline}
        />
      </section>

      {/* 4. Main Storage Overview (Status Hero, Environmental Conditions, Storage Health & Crop Summary) */}
      <section className="dashboard-overview-split" aria-label="Atmospheric Status and Crop Health">
        {/* Left: Large Storage Status Card & Multi-Pillar Environmental Conditions (Section 8 & 11) */}
        <div className="overview-status-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <StorageStatusCard
            status={sensorData?.status}
            spoilageRisk={sensorData?.spoilageRisk}
            temperature={sensorData?.temperature}
            humidity={sensorData?.humidity}
            gasLevel={sensorData?.gasLevel ?? sensorData?.gasVOC}
            lightLevel={sensorData?.lightLevel}
            lightClassification={sensorData?.lightClassification}
            isOffline={isOffline}
          />

          <EnvironmentalConditionsCard
            temperature={sensorData?.temperature}
            humidity={sensorData?.humidity}
            gasLevel={sensorData?.gasLevel ?? sensorData?.gasVOC}
            lightLevel={sensorData?.lightLevel}
            thresholds={thresholds}
            isOffline={isOffline}
          />
        </div>

        {/* Right: Health Score & Current Vegetable Storage (Section 12 & 21) */}
        <div className="overview-crop-column">
          <StorageHealthCard
            spoilageRisk={sensorData?.spoilageRisk}
            status={sensorData?.status}
            isOffline={isOffline}
          />

          <VegetableStorageSummary
            activeStorage={activeStorage}
            currentSensorData={sensorData}
            isOffline={isOffline}
          />
        </div>
      </section>

      {/* 5. Live Sensor Data Chart (Section 13) */}
      <section className="dashboard-chart-section" aria-label="Live Sensor Chart">
        <SensorChart
          history={history}
          currentData={sensorData}
          isOffline={isOffline}
        />
      </section>

      {/* 6. Lower Operations Deck: Recent Alerts, Device Card & Quick Actions */}
      <section className="dashboard-operations-deck" aria-label="Alerts and Device Operations">
        {/* Left: Recent Alerts (Section 18) */}
        <div className="operations-alerts-column">
          <RecentAlerts
            alerts={alerts}
            isOffline={isOffline}
            displayIp={displayIp}
          />
        </div>

        {/* Right: Device Telemetry & Quick Action Buttons (Section 15 & 22) */}
        <div className="operations-controls-column">
          <DeviceStatusCard
            device={device}
            isConnected={isConnected}
            isOffline={isOffline}
            lastUpdated={sensorData?.lastUpdated}
            onReconnect={reconnectDevice}
          />

          <QuickActions />
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
