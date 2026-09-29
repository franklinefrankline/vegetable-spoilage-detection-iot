import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Radio,
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';
import { useNavigate } from '../router/Router';

// Modular Components
import { SensorHeader } from '../components/sensors/SensorHeader';
import { SensorCard } from '../components/sensors/SensorCard';
import { EnvironmentStatus } from '../components/sensors/EnvironmentStatus';
import { SensorChart } from '../components/sensors/SensorChart';
import { SensorHealth } from '../components/sensors/SensorHealth';
import { SensorOffline } from '../components/sensors/SensorOffline';
import { SensorSkeleton } from '../components/sensors/SensorSkeleton';
import { StorageIntegrationCard } from '../components/sensors/StorageIntegrationCard';

// Services & Utilities
import {
  getCurrentSensorData,
  getSensorHistory,
  startSensorPolling,
  stopSensorPolling
} from '../services/sensorService';
import {
  simulateOffline,
  reconnectDemo,
  simulateDemoCondition,
  clearDemoCondition
} from '../services/demoSensorService';
import {
  getTemperatureStatus,
  getHumidityStatus,
  getGasStatus,
  getLightClassification,
  getLightRisk,
  getEnvironmentStatus
} from '../utils/sensorStatus';

export function SensorsPage() {
  const { isAuthenticated, currentUser } = useAuth();
  const {
    device,
    isConnected,
    sensorData: ctxSensorData,
    history: ctxHistory,
    thresholds
  } = useDevice();
  const navigate = useNavigate();

  const isDemo = device?.isDemo ?? true;
  const deviceId = device?.deviceId || device?.id || 'ESP32-DEMO-001';

  // Local state
  const [sensorData, setSensorData] = useState(ctxSensorData || {
    temperature: 28.5,
    humidity: 72,
    gasLevel: 420,
    gasVOC: 420,
    lightLevel: 420,
    lightClassification: 'NORMAL LIGHT',
    lightRisk: 10,
    spoilageRisk: 18,
    status: 'FRESH'
  });
  const [history, setHistory] = useState(ctxHistory || []);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [lastKnownReading, setLastKnownReading] = useState({ ...sensorData });
  const [activeCondition, setActiveCondition] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');

  // Guard authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Load history data for specified range
  const loadHistory = useCallback(async (range) => {
    try {
      const hist = await getSensorHistory(deviceId, range, isDemo);
      if (hist && hist.length > 0) {
        setHistory(hist);
      }
    } catch (err) {
      console.warn('[SensorsPage] Could not load history:', err.message);
    }
  }, [deviceId, isDemo]);

  // Initial load & Polling lifecycle with cleanup (Section 57, 58)
  useEffect(() => {
    let isMounted = true;

    // Load initial history
    loadHistory(timeRange);

    // Polling callback
    const handleReading = (reading) => {
      if (!isMounted) return;
      if (reading.isOffline) {
        setIsOffline(true);
      } else {
        setIsOffline(false);
        setSensorData(reading);
        setLastKnownReading(reading);
      }
    };

    // Start 5-second polling
    const cleanupPolling = startSensorPolling(handleReading, 5000, deviceId, isDemo);

    return () => {
      isMounted = false;
      cleanupPolling();
    };
  }, [deviceId, isDemo, loadHistory, timeRange]);

  // Trigger manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await getCurrentSensorData(deviceId, isDemo);
      if (data) {
        setSensorData(data);
        setLastKnownReading(data);
      }
      await loadHistory(timeRange);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  // Toggle simulate offline state
  const handleToggleOffline = () => {
    const nextOffline = !isOffline;
    setIsOffline(nextOffline);
    simulateOffline(nextOffline);
  };

  // Reconnection action
  const handleReconnect = async (onProgress) => {
    if (isDemo) {
      const resumed = await reconnectDemo(onProgress);
      setIsOffline(false);
      setSensorData(resumed);
      setLastKnownReading(resumed);
    } else {
      if (onProgress) onProgress('Connecting...');
      await handleRefresh();
      setIsOffline(false);
    }
  };

  // Simulate threshold condition
  const handleSimulateCondition = (condition) => {
    setActiveCondition(condition);
    if (!condition) {
      const reading = clearDemoCondition();
      setSensorData(reading);
    } else {
      const reading = simulateDemoCondition(condition);
      setSensorData(reading);
    }
  };

  // Calculate Statuses
  const tempStatus = useMemo(() => {
    return getTemperatureStatus(sensorData?.temperature, thresholds);
  }, [sensorData?.temperature, thresholds]);

  const humStatus = useMemo(() => {
    return getHumidityStatus(sensorData?.humidity, thresholds);
  }, [sensorData?.humidity, thresholds]);

  const gasVal = sensorData?.gasLevel ?? sensorData?.gasVOC;
  const gasStatus = useMemo(() => {
    return getGasStatus(gasVal, thresholds);
  }, [gasVal, thresholds]);

  const isLightUnavailable = sensorData?.isLightUnavailable || sensorData?.lightLevel === null || sensorData?.lightLevel === undefined;
  const lightClass = useMemo(() => {
    if (isLightUnavailable) return 'UNAVAILABLE';
    return sensorData?.lightClassification || getLightClassification(sensorData?.lightLevel, thresholds);
  }, [isLightUnavailable, sensorData?.lightClassification, sensorData?.lightLevel, thresholds]);

  const lightRiskVal = useMemo(() => {
    if (isLightUnavailable) return 10;
    return sensorData?.lightRisk ?? getLightRisk(sensorData?.lightLevel, thresholds);
  }, [isLightUnavailable, sensorData?.lightRisk, sensorData?.lightLevel, thresholds]);

  const overallEnvStatus = useMemo(() => {
    return getEnvironmentStatus({
      temperatureStatus: tempStatus,
      humidityStatus: humStatus,
      gasStatus,
      lightClassification: lightClass,
      spoilageRisk: sensorData?.spoilageRisk ?? 18
    });
  }, [tempStatus, humStatus, gasStatus, lightClass, sensorData?.spoilageRisk]);

  // Compute Min / Max / Avg stats from history
  const sensorStats = useMemo(() => {
    if (!history || history.length === 0) {
      return {
        temp: { min: 26.8, max: 29.4, avg: 28.1 },
        hum: { min: 68, max: 75, avg: 71 },
        gas: { min: 412, max: 430, avg: 421 },
        light: { min: 380, max: 480, avg: 425 }
      };
    }

    const temps = history.map((p) => p.temperature).filter((v) => v != null);
    const hums = history.map((p) => p.humidity).filter((v) => v != null);
    const gases = history.map((p) => p.gasLevel ?? p.gas_level ?? p.gasVOC).filter((v) => v != null);
    const lights = history.map((p) => p.lightLevel ?? p.light_level).filter((v) => v != null);

    const calc = (arr, fallback) => {
      if (!arr || arr.length === 0) return fallback;
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      return { min, max, avg };
    };

    return {
      temp: calc(temps, { min: 26.8, max: 29.4, avg: 28.1 }),
      hum: calc(hums, { min: 68, max: 75, avg: 71 }),
      gas: calc(gases, { min: 412, max: 430, avg: 421 }),
      light: calc(lights, { min: 380, max: 480, avg: 425 })
    };
  }, [history]);

  return (
    <div className="vegsense-sensors-page" style={{ paddingBottom: '3rem' }}>
      {/* 1. Header with Title & Device Metadata Bar */}
      <SensorHeader
        device={device}
        sensorData={sensorData}
        isOffline={isOffline}
        onToggleOffline={handleToggleOffline}
        onSimulateCondition={handleSimulateCondition}
        activeCondition={activeCondition}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Offline Alert Banner (Section 29, 30) */}
      {isOffline && (
        <SensorOffline
          lastKnownData={lastKnownReading}
          onReconnect={handleReconnect}
          isDemo={isDemo}
          deviceName={device?.deviceName || (isDemo ? 'ESP32-DEMO-001' : 'ESP32-001')}
          ipAddress={device?.ipAddress || '192.168.1.105'}
        />
      )}

      {/* 2. Top Sensor Cards Grid (Section 5) */}
      {loading ? (
        <SensorSkeleton />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {/* Card 1: TEMPERATURE */}
          <SensorCard
            title="TEMPERATURE"
            value={sensorData?.temperature ?? 28.5}
            unit="°C"
            status={tempStatus}
            source="DHT22"
            icon={Thermometer}
            accentColor="#f97316"
            stats={sensorStats.temp}
            subtitle="Optimal Range: 15–30 °C"
          />

          {/* Card 2: HUMIDITY */}
          <SensorCard
            title="HUMIDITY"
            value={sensorData?.humidity != null ? Math.round(sensorData.humidity) : 72}
            unit="%"
            status={humStatus}
            source="DHT22"
            icon={Droplets}
            accentColor="#0ea5e9"
            stats={sensorStats.hum}
            subtitle="Target Relative Humidity: 60–78%"
          />

          {/* Card 3: GAS / VOC (MQ-135) */}
          <SensorCard
            title="GAS / VOC"
            value={gasVal ?? 420}
            unit="ppm"
            status={gasStatus}
            source="MQ-135"
            icon={Wind}
            accentColor="#10b981"
            stats={sensorStats.gas}
            subtitle="Gas/VOC Indicator"
            extraInfo="Baseline Indicator"
          />

          {/* Card 4: LIGHT LEVEL (BH1750 / LDR) */}
          <SensorCard
            title="LIGHT LEVEL"
            value={isLightUnavailable ? null : (sensorData?.lightLevel != null ? Math.round(sensorData.lightLevel) : 420)}
            unit={isLightUnavailable ? '' : 'lux'}
            status={lightClass}
            source="BH1750 / LDR"
            icon={Sun}
            accentColor="#eab308"
            stats={isLightUnavailable ? null : sensorStats.light}
            isUnavailable={isLightUnavailable}
            unavailableMessage="Light Sensor Unavailable"
            subtitle="Configured: 100–500 lux"
            extraInfo={`Light Risk: ${lightRiskVal}%`}
          />
        </div>
      )}

      {/* 3. Overall Environment Summary (Section 13) */}
      <EnvironmentStatus
        tempStatus={tempStatus}
        humStatus={humStatus}
        gasStatus={gasStatus}
        lightClassification={lightClass}
        overallStatus={overallEnvStatus}
        spoilageRisk={sensorData?.spoilageRisk ?? 18}
      />

      {/* 4. Live Sensor Trends Chart (Section 25, 26, 27) */}
      <SensorChart
        history={history}
        isDemo={isDemo}
        currentRange={timeRange}
        onRangeChange={(newRange) => {
          setTimeRange(newRange);
          loadHistory(newRange);
        }}
      />

      {/* 5. Sensor Health & Hardware Diagnostic Link (Section 28) */}
      <SensorHealth
        isDemo={isDemo}
        isOffline={isOffline}
        isLightUnavailable={isLightUnavailable}
        isDhtUnavailable={sensorData?.isDhtUnavailable}
        isGasUnavailable={sensorData?.isGasUnavailable}
        lastUpdated={sensorData?.lastUpdated}
      />

      {/* 6. Current Storage Linkage Card (Section 34) */}
      <StorageIntegrationCard
        sensorData={sensorData}
      />
    </div>
  );
}
export default SensorsPage;
