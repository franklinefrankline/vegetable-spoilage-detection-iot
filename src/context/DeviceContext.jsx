import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  connectToDevice as serviceConnect,
  getDeviceStatus,
  getSensorData,
  startSensorPolling,
  stopSensorPolling,
  validateIPAddress
} from '../services/deviceService';

const DeviceContext = createContext(null);

const INITIAL_VEGETABLES = [
  { id: 'v1', name: 'Tomato', variety: 'Roma / Cherry', quantity: '12 kg', temp: '28.5°C', humidity: '72%', risk: 18, status: 'FRESH', optimalTemp: '20-25°C', shelfLife: '14 days' },
  { id: 'v2', name: 'Potato', variety: 'Russet', quantity: '25 kg', temp: '18.2°C', humidity: '65%', risk: 12, status: 'FRESH', optimalTemp: '12-16°C', shelfLife: '30 days' },
  { id: 'v3', name: 'Onion', variety: 'Red & Yellow', quantity: '30 kg', temp: '20.1°C', humidity: '58%', risk: 14, status: 'FRESH', optimalTemp: '15-20°C', shelfLife: '45 days' },
  { id: 'v4', name: 'Carrot', variety: 'Nantes', quantity: '15 kg', temp: '24.3°C', humidity: '70%', risk: 19, status: 'FRESH', optimalTemp: '18-22°C', shelfLife: '21 days' },
  { id: 'v5', name: 'Cabbage', variety: 'Savoy Green', quantity: '18 kg', temp: '22.0°C', humidity: '76%', risk: 24, status: 'WARNING', optimalTemp: '10-15°C', shelfLife: '10 days' },
  { id: 'v6', name: 'Bell Pepper', variety: 'Tricolor', quantity: '10 kg', temp: '26.1°C', humidity: '74%', risk: 21, status: 'FRESH', optimalTemp: '18-24°C', shelfLife: '12 days' }
];

const INITIAL_ALERTS = [
  { id: 'a1', title: 'High Humidity Detected', message: 'Storage bay #04 relative humidity exceeded the configured threshold.', category: 'warning', time: '14 mins ago', read: false },
  { id: 'a2', title: 'Temperature Stable', message: 'Storage temperature normalized within optimal vegetable preservation limits.', category: 'info', time: '1 hour ago', read: false },
  { id: 'a3', title: 'Gas / VOC Level Normal', message: 'MQ-135 sensor verified: no abnormal spoilage gas accumulation detected.', category: 'info', time: '3 hours ago', read: true }
];

const INITIAL_HISTORY = [
  { time: '00:00', temp: 28.0, humidity: 70, gas: 410, risk: 16 },
  { time: '03:00', temp: 28.2, humidity: 71, gas: 415, risk: 17 },
  { time: '06:00', temp: 28.4, humidity: 72, gas: 418, risk: 17 },
  { time: '09:00', temp: 28.6, humidity: 72, gas: 422, risk: 18 },
  { time: '12:00', temp: 28.5, humidity: 72, gas: 420, risk: 18 }
];

const getDeviceStorageKey = (user) => {
  const userId = user?.id || user?.email || 'default_user';
  return `vegsense_device_${userId}`;
};

export const DEMO_DEVICE = {
  deviceId: 'ESP32-DEMO-001',
  id: 'ESP32-DEMO-001',
  deviceName: 'ESP32-DEMO-001',
  name: 'ESP32-DEMO-001',
  ip: '192.168.1.105',
  ipAddress: '192.168.1.105',
  status: 'Demo Connected',
  network: 'Wi-Fi',
  signal: 'Strong',
  controller: 'ESP32 DevKit V1 (Demo Gateway)',
  firmware: 'v2.5.0-demo',
  isDemo: true,
  lastConnected: null
};

export const DEMO_SENSOR_DATA = {
  temperature: 28.5,
  humidity: 72,
  gasLevel: 420,
  gasVOC: 420,
  spoilageRisk: 18,
  status: 'FRESH',
  storageCondition: 'Stable',
  isDhtUnavailable: false,
  lastUpdated: new Date()
};

export function DeviceProvider({ children }) {
  const { currentUser, isAuthenticated } = useAuth();

  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingReachability, setIsCheckingReachability] = useState(false);
  const [connectionLost, setConnectionLost] = useState(false);
  const [savedDevice, setSavedDevice] = useState(null);

  const [device, setDevice] = useState({
    id: 'ESP32-001',
    name: 'ESP32-001',
    ip: '',
    ipAddress: '',
    status: 'Not Connected',
    signal: 'None',
    network: 'Wi-Fi',
    controller: 'ESP32 DevKit V1',
    firmware: '1.0.0',
    lastConnected: null
  });

  const [sensorData, setSensorData] = useState({
    temperature: 0,
    humidity: 0,
    gasLevel: 0,
    gasVOC: 0,
    spoilageRisk: 0,
    status: 'FRESH',
    storageCondition: 'Stable',
    lastUpdated: new Date()
  });

  const [vegetables, setVegetables] = useState(INITIAL_VEGETABLES);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [thresholds, setThresholds] = useState({
    maxTemp: 30,
    maxHumidity: 78,
    maxGas: 500
  });

  const [lastKnownData, setLastKnownData] = useState(null);
  const [previousData, setPreviousData] = useState(null);
  const [loadingStage, setLoadingStage] = useState('Connecting to ESP32...');

  const consecutiveErrorsRef = useRef(0);

  // Load and auto-verify saved device when user logs in or page refreshes
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      stopSensorPolling();
      setIsConnected(false);
      setSavedDevice(null);
      setDevice((prev) => ({
        ...prev,
        status: 'Not Connected',
        ip: '',
        ipAddress: '',
        signal: 'None'
      }));
      return;
    }

    const storageKey = getDeviceStorageKey(currentUser);
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSavedDevice(parsed);

        // If saved device is Demo ESP32, immediately activate without network fetch
        if (parsed.isDemo || parsed.status === 'Demo Connected' || parsed.id === 'ESP32-DEMO-001' || parsed.deviceId === 'ESP32-DEMO-001') {
          const demoDev = {
            ...DEMO_DEVICE,
            ...parsed,
            id: 'ESP32-DEMO-001',
            name: 'ESP32-DEMO-001',
            ip: '192.168.1.105',
            ipAddress: '192.168.1.105',
            status: 'Demo Connected',
            isDemo: true,
            lastConnected: parsed.lastConnected || new Date().toISOString()
          };
          const demoSens = {
            ...DEMO_SENSOR_DATA,
            lastUpdated: new Date()
          };
          setDevice(demoDev);
          setSensorData(demoSens);
          setLastKnownData(demoSens);
          setIsConnected(true);
          setConnectionLost(false);
          setIsCheckingReachability(false);
          setLoadingStage('Demo monitoring active');
          return;
        }

        // Auto-check reachability of previously connected device
        // Do not falsely show Connected based only on saved data
        if (parsed.ipAddress && validateIPAddress(parsed.ipAddress)) {
          setIsCheckingReachability(true);
          setLoadingStage('Connecting to ESP32...');
          getDeviceStatus(parsed.ipAddress)
            .then(async (res) => {
              if (res.success) {
                setLoadingStage('Reading sensor data...');
                // Fetch real sensor data as well
                try {
                  const sData = await getSensorData(parsed.ipAddress);
                  setSensorData(sData);
                  setLastKnownData(sData);
                  setIsConnected(true);
                  setConnectionLost(false);
                  setLoadingStage('Live monitoring active');
                  setDevice((prev) => ({
                    ...prev,
                    id: parsed.deviceId || parsed.id || 'ESP32-001',
                    name: parsed.deviceName || parsed.name || 'ESP32-001',
                    ip: parsed.ipAddress,
                    ipAddress: parsed.ipAddress,
                    status: 'connected',
                    signal: 'Strong',
                    network: 'Wi-Fi',
                    lastConnected: parsed.lastConnected || new Date().toISOString()
                  }));
                } catch (sErr) {
                  // Device status ok but sensor read failed
                  setIsConnected(false);
                  setConnectionLost(true);
                  setDevice((prev) => ({
                    ...prev,
                    ip: parsed.ipAddress,
                    ipAddress: parsed.ipAddress,
                    status: 'Offline',
                    signal: 'None'
                  }));
                }
              } else {
                setIsConnected(false);
                setConnectionLost(true);
                setDevice((prev) => ({
                  ...prev,
                  ip: parsed.ipAddress,
                  ipAddress: parsed.ipAddress,
                  status: 'Offline',
                  signal: 'None'
                }));
              }
            })
            .catch(() => {
              setIsConnected(false);
              setConnectionLost(true);
              setDevice((prev) => ({
                ...prev,
                ip: parsed.ipAddress,
                ipAddress: parsed.ipAddress,
                status: 'Offline',
                signal: 'None'
              }));
            })
            .finally(() => {
              setIsCheckingReachability(false);
            });
        }
      } catch (e) {
        console.warn('Failed to parse saved device info:', e);
      }
    } else {
      setIsConnected(false);
      setSavedDevice(null);
    }
  }, [isAuthenticated, currentUser]);

  // Real-time Sensor Polling (every 5 seconds)
  useEffect(() => {
    if (!isConnected) {
      stopSensorPolling();
      return;
    }

    // Demo Mode Polling: updates clock and chart history every 5 seconds
    if (device.isDemo) {
      consecutiveErrorsRef.current = 0;
      const demoInterval = setInterval(() => {
        const now = new Date();
        const nowStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        setSensorData({
          ...DEMO_SENSOR_DATA,
          lastUpdated: now
        });
        setLastKnownData({
          ...DEMO_SENSOR_DATA,
          lastUpdated: now
        });
        setConnectionLost(false);

        // Update history chart data dynamically: maximum 30 FIFO points
        setHistory((prev) => {
          const newPoint = {
            time: nowStr,
            temp: DEMO_SENSOR_DATA.temperature,
            temperature: DEMO_SENSOR_DATA.temperature,
            humidity: DEMO_SENSOR_DATA.humidity,
            gas: DEMO_SENSOR_DATA.gasLevel,
            risk: DEMO_SENSOR_DATA.spoilageRisk,
            spoilageRisk: DEMO_SENSOR_DATA.spoilageRisk
          };
          const updated = [...prev, newPoint];
          return updated.slice(-30);
        });
      }, 5000);

      return () => {
        clearInterval(demoInterval);
      };
    }

    if (!device.ipAddress) {
      stopSensorPolling();
      return;
    }

    consecutiveErrorsRef.current = 0;

    const stop = startSensorPolling(
      device.ipAddress,
      // On real data received from ESP32:
      (newData) => {
        consecutiveErrorsRef.current = 0;
        setSensorData((prev) => {
          if (prev && prev.temperature !== undefined) {
            setPreviousData(prev);
          }
          return newData;
        });
        setLastKnownData(newData);
        setConnectionLost(false);
        setDevice((prev) => ({
          ...prev,
          status: 'connected',
          signal: 'Strong'
        }));

        // Update history chart data dynamically: maximum 30 FIFO points (Section 13)
        setHistory((prev) => {
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const newPoint = {
            time: nowStr,
            temp: newData.temperature,
            temperature: newData.temperature,
            humidity: newData.humidity,
            gas: newData.gasLevel,
            risk: newData.spoilageRisk,
            spoilageRisk: newData.spoilageRisk
          };
          const updated = [...prev, newPoint];
          return updated.slice(-30); // Keep last 30 data points exactly
        });
      },
      // On error communicating with ESP32:
      (err) => {
        consecutiveErrorsRef.current += 1;
        // After 2 consecutive failures, mark device offline
        if (consecutiveErrorsRef.current >= 2) {
          setIsConnected(false);
          setConnectionLost(true);
          setDevice((prev) => ({
            ...prev,
            status: 'Offline',
            signal: 'None'
          }));
          stopSensorPolling();
        }
      },
      5000 // Exact 5-second polling interval (Section 5)
    );

    return () => {
      stop();
    };
  }, [isConnected, device.ipAddress, device.isDemo]);

  // Connect to ESP32: validates IP, checks status, tests real sensors, and persists user device
  const connectDevice = useCallback(
    async (ip) => {
      const result = await serviceConnect(ip);

      const deviceData = {
        deviceId: result.device.id,
        id: result.device.id,
        deviceName: result.device.name,
        name: result.device.name,
        ip: result.device.ipAddress,
        ipAddress: result.device.ipAddress,
        status: 'connected',
        network: 'Wi-Fi',
        signal: 'Strong',
        controller: 'ESP32 DevKit V1',
        firmware: result.device.firmware || '1.0.0',
        lastConnected: result.device.lastConnected
      };

      setDevice(deviceData);
      setSensorData(result.sensorData);
      setIsConnected(true);
      setConnectionLost(false);
      setSavedDevice(deviceData);

      // Save user-specific device info in localStorage (no passwords)
      if (currentUser) {
        const storageKey = getDeviceStorageKey(currentUser);
        localStorage.setItem(storageKey, JSON.stringify(deviceData));
      }

      return result;
    },
    [currentUser]
  );

  // Connect Demo ESP32 directly with user specifications:
  // IP: 192.168.1.105 | Device: ESP32-DEMO-001 | Status: Demo Connected
  // Temp: 28.5°C | Humidity: 72% | Gas: 420 | Spoilage Risk: 18% | Status: FRESH
  const connectDemoDevice = useCallback(async () => {
    stopSensorPolling();
    const nowIso = new Date().toISOString();
    const demoDev = {
      ...DEMO_DEVICE,
      lastConnected: nowIso
    };
    const demoSens = {
      ...DEMO_SENSOR_DATA,
      lastUpdated: new Date()
    };

    setDevice(demoDev);
    setSensorData(demoSens);
    setLastKnownData(demoSens);
    setIsConnected(true);
    setConnectionLost(false);
    setSavedDevice(demoDev);

    if (currentUser) {
      const storageKey = getDeviceStorageKey(currentUser);
      localStorage.setItem(storageKey, JSON.stringify(demoDev));
    }

    return {
      success: true,
      device: demoDev,
      sensorData: demoSens
    };
  }, [currentUser]);

  // Disconnect device without logging out user session
  const disconnectDevice = useCallback(() => {
    stopSensorPolling();
    setIsConnected(false);
    setConnectionLost(false);
    setDevice((prev) => ({
      ...prev,
      status: 'Not Connected',
      signal: 'None',
      isDemo: false
    }));
  }, []);

  // Reconnect previously saved device
  const reconnectDevice = useCallback(async () => {
    if (savedDevice?.isDemo || device?.isDemo || savedDevice?.id === 'ESP32-DEMO-001') {
      return connectDemoDevice();
    }
    const targetIp = savedDevice?.ipAddress || device?.ipAddress;
    if (!targetIp) {
      throw new Error('No previously connected IP address found.');
    }
    return connectDevice(targetIp);
  }, [savedDevice, device, connectDevice, connectDemoDevice]);

  // Clear saved device preferences
  const clearSavedDevice = useCallback(() => {
    if (currentUser) {
      const storageKey = getDeviceStorageKey(currentUser);
      localStorage.removeItem(storageKey);
    }
    setSavedDevice(null);
    disconnectDevice();
  }, [currentUser, disconnectDevice]);

  const addVegetableBatch = useCallback((newBatch) => {
    setVegetables((prev) => [
      {
        ...newBatch,
        id: 'v_' + Date.now(),
        temp: `${sensorData.temperature}°C`,
        humidity: `${sensorData.humidity}%`,
        risk: sensorData.spoilageRisk,
        status: sensorData.status
      },
      ...prev
    ]);
  }, [sensorData]);

  const markAlertsAsRead = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  }, []);

  const unreadAlertsCount = alerts.filter((a) => !a.read).length;

  const updateThresholds = useCallback((newSettings) => {
    setThresholds((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const value = {
    isConnected,
    isCheckingReachability,
    connectionLost,
    hasSavedDevice: Boolean(savedDevice?.ipAddress),
    savedDevice,
    device,
    sensorData,
    vegetables,
    alerts,
    history,
    thresholds,
    unreadAlertsCount,
    connectDevice,
    connectDemoDevice,
    disconnectDevice,
    reconnectDevice,
    lastKnownData,
    previousData,
    loadingStage,
    clearSavedDevice,
    addVegetableBatch,
    markAlertsAsRead,
    updateThresholds
  };

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDevice() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
}
