import { useState, useEffect, useRef, useCallback } from 'react';
import { getDeviceStatus, getSensorData } from '../services/deviceService';
import { checkReadingForAlerts, recordAlert } from '../services/alertService';

export const POLLING_STATES = {
  INITIAL_LOADING: 'INITIAL_LOADING',
  CONNECTED: 'CONNECTED',
  UPDATING: 'UPDATING',
  OFFLINE: 'OFFLINE',
  ERROR: 'ERROR'
};

const POLLING_INTERVAL_MS = 5000; // Exact 5 seconds as specified in Section 5

/**
 * useDevicePolling Hook
 * Implements real 5-second automatic sensor polling from the physical ESP32 gateway.
 * Strictly uses actual values returned from http://{IP}/api/data.
 */
export function useDevicePolling(deviceIp, deviceId = 'ESP32-001', isEnabled = true) {
  const [pollingState, setPollingState] = useState(POLLING_STATES.INITIAL_LOADING);
  const [loadingStage, setLoadingStage] = useState('Connecting to ESP32...');
  const [currentData, setCurrentData] = useState(null);
  const [previousData, setPreviousData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  const timerRef = useRef(null);
  const consecutiveErrorsRef = useRef(0);
  const isPollingRef = useRef(false);

  // Single poll execution
  const executePoll = useCallback(async () => {
    if (!deviceIp || isPollingRef.current) return;

    isPollingRef.current = true;
    setPollingState((prev) => (prev === POLLING_STATES.CONNECTED ? POLLING_STATES.UPDATING : prev));

    try {
      // 1. Verify status
      await getDeviceStatus(deviceIp);

      // 2. Fetch real sensor data
      const data = await getSensorData(deviceIp);

      consecutiveErrorsRef.current = 0;
      setPreviousData(currentData);
      setCurrentData(data);
      setLastUpdated(new Date());
      setPollingState(POLLING_STATES.CONNECTED);
      setErrorMsg(null);

      // 3. Evaluate alerts against thresholds
      const generated = checkReadingForAlerts(data);
      if (generated.length > 0) {
        setActiveAlerts(generated);
        generated.forEach((alt) => {
          recordAlert(deviceId, alt);
        });
      } else {
        setActiveAlerts([]);
      }

      // Persist reading to database in background
      fetch('/api/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          temperature: data.temperature,
          humidity: data.humidity,
          gasLevel: data.gasLevel,
          spoilageRisk: data.spoilageRisk,
          storageStatus: data.status
        })
      }).catch(() => {});
    } catch (err) {
      consecutiveErrorsRef.current += 1;

      // After 2 consecutive failures, mark device OFFLINE
      if (consecutiveErrorsRef.current >= 2) {
        setPollingState(POLLING_STATES.OFFLINE);
        setErrorMsg('Unable to reach ESP32. Check device power and Wi-Fi connection.');
      } else {
        setPollingState(POLLING_STATES.ERROR);
        setErrorMsg(err.message || 'Error communicating with ESP32');
      }
    } finally {
      isPollingRef.current = false;
    }
  }, [deviceIp, deviceId, currentData]);

  // Initial startup flow (Section 24):
  // Connecting to ESP32... -> Reading sensor data... -> Live monitoring active
  useEffect(() => {
    if (!isEnabled || !deviceIp) {
      setPollingState(POLLING_STATES.OFFLINE);
      return;
    }

    let isMounted = true;
    setPollingState(POLLING_STATES.INITIAL_LOADING);
    setLoadingStage('Connecting to ESP32...');

    const startInitial = async () => {
      try {
        await getDeviceStatus(deviceIp);
        if (!isMounted) return;

        setLoadingStage('Reading sensor data...');
        const firstData = await getSensorData(deviceIp);
        if (!isMounted) return;

        setLoadingStage('Live monitoring active');
        setCurrentData(firstData);
        setLastUpdated(new Date());
        setPollingState(POLLING_STATES.CONNECTED);
        consecutiveErrorsRef.current = 0;
      } catch (err) {
        if (!isMounted) return;
        setPollingState(POLLING_STATES.OFFLINE);
        setErrorMsg(err.message || 'Unable to connect to ESP32.');
      }
    };

    startInitial();

    return () => {
      isMounted = false;
    };
  }, [deviceIp, isEnabled]);

  // Regular 5-second polling interval (Section 5 & 32)
  useEffect(() => {
    if (!isEnabled || !deviceIp || pollingState === POLLING_STATES.INITIAL_LOADING || pollingState === POLLING_STATES.OFFLINE) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Set 5-second interval
    timerRef.current = setInterval(() => {
      // Pause if browser tab is hidden (Section 32)
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }
      executePoll();
    }, POLLING_INTERVAL_MS);

    // Page visibility listener: resume immediately when tab becomes active
    const handleVisibilityChange = () => {
      if (!document.hidden && isEnabled && deviceIp && pollingState !== POLLING_STATES.OFFLINE) {
        executePoll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEnabled, deviceIp, pollingState, executePoll]);

  // Manual reconnect trigger
  const triggerReconnect = useCallback(async () => {
    setPollingState(POLLING_STATES.INITIAL_LOADING);
    setLoadingStage('Connecting to ESP32...');
    consecutiveErrorsRef.current = 0;
    try {
      await getDeviceStatus(deviceIp);
      setLoadingStage('Reading sensor data...');
      const data = await getSensorData(deviceIp);
      setCurrentData(data);
      setLastUpdated(new Date());
      setPollingState(POLLING_STATES.CONNECTED);
      setErrorMsg(null);
      return true;
    } catch (err) {
      setPollingState(POLLING_STATES.OFFLINE);
      setErrorMsg(err.message || 'ESP32 unreachable.');
      return false;
    }
  }, [deviceIp]);

  return {
    pollingState,
    loadingStage,
    currentData,
    previousData,
    lastUpdated,
    activeAlerts,
    errorMsg,
    triggerReconnect,
    isOffline: pollingState === POLLING_STATES.OFFLINE,
    isLoading: pollingState === POLLING_STATES.INITIAL_LOADING
  };
}
